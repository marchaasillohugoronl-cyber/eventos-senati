import { handle } from "@/lib/api";
import { HttpError, requireUser } from "@/lib/auth/session";
import { prisma, getEvent } from "@/lib/database/prisma";
import { publish } from "@/lib/realtime/server";
import { rateLimit } from "@/lib/security/ratelimit";

/** Alterna el Me gusta. El índice único (userId, postId) garantiza uno por cuenta. */
export async function POST(_req: Request, { params }: { params: { id: string } }) {
  return handle(async () => {
    const user = await requireUser();
    rateLimit(`like:${user.id}`, 60, 60_000);

    const event = await getEvent();
    if (event.status !== "ACTIVE") throw new HttpError(403, "Las reacciones están cerradas.");

    const post = await prisma.post.findFirst({ where: { id: params.id, visibility: "VISIBLE" }, select: { id: true } });
    if (!post) throw new HttpError(404, "Publicación no encontrada.");

    const key = { userId_postId: { userId: user.id, postId: post.id } };
    const existing = await prisma.like.findUnique({ where: key });
    if (existing) await prisma.like.delete({ where: key });
    else await prisma.like.create({ data: { userId: user.id, postId: post.id } }).catch(() => null); // carrera: ya existe

    const likeCount = await prisma.like.count({ where: { postId: post.id } });
    await publish("like.updated", { postId: post.id, likeCount });
    return { liked: !existing, likeCount };
  });
}
