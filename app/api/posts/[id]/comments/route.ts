import { NextRequest } from "next/server";
import { handle } from "@/lib/api";
import { HttpError, requireUser } from "@/lib/auth/session";
import { prisma, getEvent } from "@/lib/database/prisma";
import { commentSchema } from "@/lib/validations";
import { publish } from "@/lib/realtime/server";
import { rateLimit } from "@/lib/security/ratelimit";

export const dynamic = "force-dynamic";

function serialize(c: { id: string; content: string; createdAt: Date; user: { publicName: string } }) {
  return { id: c.id, content: c.content, createdAt: c.createdAt.toISOString(), authorName: c.user.publicName };
}

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  return handle(async () => {
    await requireUser();
    const comments = await prisma.comment.findMany({
      where: { postId: params.id, removed: false },
      orderBy: { createdAt: "asc" },
      take: 200,
      include: { user: { select: { publicName: true } } },
    });
    return { comments: comments.map(serialize) };
  });
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  return handle(async () => {
    const user = await requireUser();
    rateLimit(`comment:${user.id}`, 20, 60_000);

    const event = await getEvent();
    if (event.status !== "ACTIVE") throw new HttpError(403, "Los comentarios están cerrados.");

    const post = await prisma.post.findFirst({ where: { id: params.id, visibility: "VISIBLE" }, select: { id: true } });
    if (!post) throw new HttpError(404, "Publicación no encontrada.");

    const { content } = commentSchema.parse(await req.json());
    const c = await prisma.comment.create({
      data: { userId: user.id, postId: post.id, content },
      include: { user: { select: { publicName: true } } },
    });
    const payload = serialize(c);
    await publish("comment.created", { postId: post.id, comment: payload });
    return { comment: payload };
  });
}
