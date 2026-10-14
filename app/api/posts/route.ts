import { NextRequest } from "next/server";
import { handle } from "@/lib/api";
import { HttpError, requireUser } from "@/lib/auth/session";
import { prisma, getEvent } from "@/lib/database/prisma";
import { postInclude, serializePost } from "@/lib/posts";
import { createPostSchema } from "@/lib/validations";
import { verifyResource } from "@/lib/cloudinary";
import { publish } from "@/lib/realtime/server";
import { rateLimit } from "@/lib/security/ratelimit";

export const dynamic = "force-dynamic";

/** Feed paginado. ?cursor=<postId>&limit=20  ·  ?since=<ISO> para re-sincronizar tras desconexión. */
export async function GET(req: NextRequest) {
  return handle(async () => {
    const user = await requireUser();
    const event = await getEvent();
    const sp = req.nextUrl.searchParams;
    const limit = Math.min(Number(sp.get("limit") ?? 20), 50);
    const cursor = sp.get("cursor");
    const since = sp.get("since");

    const posts = await prisma.post.findMany({
      where: {
        eventId: event.id,
        visibility: "VISIBLE",
        ...(since ? { OR: [{ createdAt: { gt: new Date(since) } }, { updatedAt: { gt: new Date(since) } }] } : {}),
      },
      orderBy: { createdAt: "desc" },
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      include: postInclude,
    });
    const likes = await prisma.like.findMany({
      where: { userId: user.id, postId: { in: posts.map((p) => p.id) } },
      select: { postId: true },
    });
    const liked = new Set(likes.map((l) => l.postId));
    const page = posts.slice(0, limit);
    return {
      status: event.status,
      posts: page.map((p) => serializePost(p, liked.has(p.id))),
      nextCursor: posts.length > limit ? page[page.length - 1].id : null,
    };
  });
}

export async function POST(req: NextRequest) {
  return handle(async () => {
    const user = await requireUser();
    rateLimit(`post:${user.id}`, 10, 60_000);

    const event = await getEvent();
    if (event.status !== "ACTIVE") throw new HttpError(403, "El evento no admite publicaciones en este momento.");

    const body = createPostSchema.parse(await req.json());

    const verified = await Promise.all(body.images.map((i) => verifyResource(i.publicId, user.id)));
    if (verified.some((v) => !v)) throw new HttpError(400, "Una de las fotografías no es válida.");

    const post = await prisma.post.create({
      data: {
        userId: user.id,
        eventId: event.id,
        message: body.message || null,
        images: {
          create: verified.map((v, position) => ({
            cloudinaryPublicId: v!.publicId,
            originalUrl: v!.url,
            width: v!.width,
            height: v!.height,
            position,
          })),
        },
      },
      include: postInclude,
    });

    const payload = serializePost(post);
    await publish("post.created", { post: payload });
    return { post: payload };
  });
}
