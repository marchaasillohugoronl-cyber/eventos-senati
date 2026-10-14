import { redirect } from "next/navigation";
import { prisma } from "@/lib/database/prisma";
import { getCurrentAdmin } from "@/lib/auth/admin";
import { cldUrl } from "@/lib/cloudinary/urls";
import { PostModeration } from "@/components/administracion/AdminButtons";

export const dynamic = "force-dynamic";

export default async function AdminPosts({ searchParams }: { searchParams: { q?: string } }) {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/admin/login");
  const q = searchParams.q?.trim();

  const posts = await prisma.post.findMany({
    where: q ? { OR: [{ message: { contains: q, mode: "insensitive" } }, { user: { publicName: { contains: q, mode: "insensitive" } } }] } : {},
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { user: { select: { publicName: true } }, images: { orderBy: { position: "asc" } } },
  });

  return (
    <div className="space-y-4">
      <form className="flex gap-2">
        <input name="q" defaultValue={q} placeholder="Buscar por mensaje o autor" className="input" />
        <button className="btn btn-primary">Buscar</button>
      </form>
      {posts.map((p) => (
        <article key={p.id} className="card flex flex-wrap items-center gap-4 p-4">
          <div className="flex gap-1">
            {p.images.map((i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={i.id} src={cldUrl(i.cloudinaryPublicId, "thumb")} alt="" className="h-16 w-16 rounded-lg object-cover" />
            ))}
          </div>
          <div className="min-w-0 flex-1 text-sm">
            <p className="font-semibold">{p.user.publicName} {p.visibility === "HIDDEN" && <span className="text-rose-600">· oculta</span>}</p>
            <p className="truncate text-slate-600">{p.message}</p>
          </div>
          <PostModeration id={p.id} hidden={p.visibility === "HIDDEN"} isOwner={admin.role === "OWNER"} />
        </article>
      ))}
    </div>
  );
}
