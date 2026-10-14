import { NextRequest } from "next/server";
import { handle } from "@/lib/api";
import { HttpError, requireUser } from "@/lib/auth/session";
import { prisma, getEvent } from "@/lib/database/prisma";
import { postInclude, serializePost } from "@/lib/posts";
import { updatePostSchema } from "@/lib/validations";
import { verifyResource } from "@/lib/cloudinary";
import { publish } from "@/lib/realtime/server";
import { rateLimit } from "@/lib/security/ratelimit";

/**
 * Edición por el autor: mensaje y/o fotografías (máx. 5). No existe DELETE para visitantes.
 * Se emite post.updated (nunca post.created), así la TV no vuelve a encolar la publicación.
 * createdAt no cambia, por lo que conserva su posición en el muro.
 */
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  return handle(async () => {
    const user = await requireUser();
    rateLimit(`edit:${user.id}`, 20, 60_000);

    const event = await getEvent();
    if (event.status !== "ACTIVE") throw new HttpError(403, "El evento no admite ediciones en este momento.");

    const existing = await prisma.post.findUnique({ where: { id: params.id }, include: { images: true } });
    if (!existing || existing.userId !== user.id) throw new HttpError(404, "Publicación no encontrada.");

    const body = updatePostSchema.parse(await req.json());

    await prisma.$transaction(async (tx) => {
      if (body.images) {
        const keep = new Set(existing.images.map((i) => i.cloudinaryPublicId));
        const verified = await Promise.all(
          body.images.map(async (i) => (keep.has(i.publicId) ? { publicId: i.publicId, existing: true } : { ...(await verifyResource(i.publicId, user.id)), existing: false }))
        );
        if (verified.some((v) => !v || !v.publicId)) throw new HttpError(400, "Una de las fotografías no es válida.");

        // Posiciones temporales para no chocar con @@unique([postId, position]).
        const wanted = body.images.map((i) => i.publicId);
        await tx.postImage.deleteMany({ where: { postId: existing.id, cloudinaryPublicId: { notIn: wanted } } });
        for (const [position, v] of verified.entries()) {
          const v2 = v as any;
          if (v2.existing) {
            await tx.postImage.update({ where: { cloudinaryPublicId: v2.publicId }, data: { position: 100 + position } });
          } else {
            await tx.postImage.create({
              data: { postId: existing.id, cloudinaryPublicId: v2.publicId, originalUrl: v2.url, width: v2.width, height: v2.height, position: 100 + position },
            });
          }
        }
        for (const [position, id] of wanted.entries()) {
          await tx.postImage.update({ where: { cloudinaryPublicId: id }, data: { position } });
        }
      }
      await tx.post.update({
        where: { id: existing.id },
        data: { ...(body.message !== undefined ? { message: body.message || null } : {}), editedAt: new Date() },
      });
    });

    const post = await prisma.post.findUniqueOrThrow({ where: { id: existing.id }, include: postInclude });
    const payload = serializePost(post);
    await publish("post.updated", { post: payload });
    return { post: payload };
  });
}
