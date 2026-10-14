import { NextRequest } from "next/server";
import { handle } from "@/lib/api";
import { requireAdmin, audit } from "@/lib/auth/admin";
import { prisma } from "@/lib/database/prisma";
import { visibilitySchema } from "@/lib/validations";
import { destroyResource } from "@/lib/cloudinary";
import { publish } from "@/lib/realtime/server";

/** Ocultar / volver a mostrar (colaboradores y propietario). */
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  return handle(async () => {
    const admin = await requireAdmin();
    const { visibility } = visibilitySchema.parse(await req.json());
    await prisma.post.update({ where: { id: params.id }, data: { visibility } });
    await audit(admin.id, `post.${visibility.toLowerCase()}`, params.id);
    if (visibility === "HIDDEN") await publish("post.hidden", { postId: params.id });
    else await publish("post.updated", { postId: params.id, reload: true });
    return { ok: true };
  });
}

/** Eliminación definitiva (solo propietario): borra también los recursos en Cloudinary. */
export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  return handle(async () => {
    const admin = await requireAdmin("OWNER");
    const images = await prisma.postImage.findMany({ where: { postId: params.id }, select: { cloudinaryPublicId: true } });
    await prisma.post.delete({ where: { id: params.id } });
    await Promise.allSettled(images.map((i) => destroyResource(i.cloudinaryPublicId)));
    await audit(admin.id, "post.delete", params.id, { images: images.length });
    await publish("post.hidden", { postId: params.id });
    return { ok: true };
  });
}
