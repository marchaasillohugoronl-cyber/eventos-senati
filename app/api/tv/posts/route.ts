import { NextRequest, NextResponse } from "next/server";
import { prisma, getEvent } from "@/lib/database/prisma";
import { postInclude, serializePost } from "@/lib/posts";

export const dynamic = "force-dynamic";

/** Feed público de solo lectura para /tv. Si TV_ACCESS_KEY está definida, se exige ?key=. */
export async function GET(req: NextRequest) {
  const key = process.env.TV_ACCESS_KEY;
  if (key && req.nextUrl.searchParams.get("key") !== key)
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });

  const event = await getEvent();
  const since = req.nextUrl.searchParams.get("since");
  const posts = await prisma.post.findMany({
    where: {
      eventId: event.id,
      visibility: "VISIBLE",
      ...(since ? { OR: [{ createdAt: { gt: new Date(since) } }, { updatedAt: { gt: new Date(since) } }] } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 100,
    include: postInclude,
  });
  return NextResponse.json({
    event: { title: event.title, status: event.status },
    now: new Date().toISOString(),
    posts: posts.map((p) => serializePost(p)),
  });
}
