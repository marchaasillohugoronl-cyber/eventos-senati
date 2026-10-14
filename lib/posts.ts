import { prisma } from "@/lib/database/prisma";
import { Prisma } from "@prisma/client";

export const postInclude = {
  user: { select: { publicName: true, avatarUrl: true } },
  images: { orderBy: { position: "asc" as const } },
  _count: { select: { likes: true, comments: true } },
} satisfies Prisma.PostInclude;

type PostRow = Prisma.PostGetPayload<{ include: typeof postInclude }>;

/** Serialización pública: nunca expone email ni googleId. */
export function serializePost(p: PostRow, likedByMe = false) {
  return {
    id: p.id,
    message: p.message,
    createdAt: p.createdAt.toISOString(),
    editedAt: p.editedAt?.toISOString() ?? null,
    author: { publicName: p.user.publicName, avatarUrl: p.user.avatarUrl },
    images: p.images.map((i) => ({ id: i.id, publicId: i.cloudinaryPublicId, width: i.width, height: i.height })),
    likeCount: p._count.likes,
    commentCount: p._count.comments,
    likedByMe,
  };
}

export type PublicPost = ReturnType<typeof serializePost>;

export async function loadPublicPost(id: string, viewerId?: string) {
  const p = await prisma.post.findFirst({ where: { id, visibility: "VISIBLE" }, include: postInclude });
  if (!p) return null;
  const liked = viewerId ? !!(await prisma.like.findUnique({ where: { userId_postId: { userId: viewerId, postId: id } } })) : false;
  return serializePost(p, liked);
}
