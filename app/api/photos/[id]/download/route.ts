import { NextResponse } from "next/server";
import { prisma } from "@/lib/database/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { cldOriginalDownloadUrl } from "@/lib/cloudinary/urls";

/** Descarga de la original (sin marca de agua). Requiere sesión y publicación visible. */
export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Inicia sesión para descargar." }, { status: 401 });

  const image = await prisma.postImage.findFirst({
    where: { id: params.id, post: { visibility: "VISIBLE" } },
    select: { cloudinaryPublicId: true },
  });
  if (!image) return NextResponse.json({ error: "No encontrada." }, { status: 404 });

  return NextResponse.redirect(cldOriginalDownloadUrl(image.cloudinaryPublicId));
}
