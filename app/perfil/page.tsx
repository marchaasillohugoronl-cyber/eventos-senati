import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/database/prisma";
import { postInclude, serializePost } from "@/lib/posts";
import { cldUrl } from "@/lib/cloudinary/urls";
import { Header } from "@/components/ui/Header";
import { PublicNameForm } from "@/components/ui/PublicNameForm";
import { signOut } from "@/auth";

export const dynamic = "force-dynamic";

export default async function PerfilPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?callbackUrl=/perfil");

  const posts = (
    await prisma.post.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, include: postInclude })
  ).map((p) => ({ ...serializePost(p), hidden: p.visibility === "HIDDEN" }));

  return (
    <>
      <Header title="Mi perfil" />
      <main className="mx-auto max-w-2xl space-y-6 p-4">
        <section className="card space-y-3 p-5">
          <h2 className="font-bold text-senati-800">Mi cuenta</h2>
          <PublicNameForm initial={user.publicName} />
          <p className="text-sm text-slate-600">Cuenta de Google vinculada: <strong>{user.email}</strong> (privado, no se muestra a otros).</p>
          <form action={async () => { "use server"; await signOut({ redirectTo: "/login" }); }}><button className="btn btn-ghost" type="submit">Cerrar sesión</button></form>
        </section>

        <section className="space-y-3">
          <h2 className="font-bold text-senati-800">Mis publicaciones</h2>
          {posts.length === 0 && <p className="text-sm text-slate-500">Aún no has publicado fotografías.</p>}
          {posts.map((p) => (
            <article key={p.id} className="card p-4">
              <div className="flex gap-2 overflow-x-auto">
                {p.images.map((i) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img key={i.id} src={cldUrl(i.publicId, "thumb")} alt="" className="h-20 w-20 rounded-lg object-cover" />
                ))}
              </div>
              <p className="mt-2 text-sm">{p.message}</p>
              <p className="mt-1 text-xs text-slate-500">
                {new Date(p.createdAt).toLocaleString("es-PE")} · ♥ {p.likeCount} · {p.commentCount} comentarios {p.hidden && "· oculta por moderación"}
              </p>
              {/* TODO Fase 2: pantalla de edición (usa PATCH /api/posts/[id]). */}
            </article>
          ))}
        </section>

        <section className="card p-5 text-sm">
          <h2 className="mb-1 font-bold text-senati-800">Privacidad</h2>
          <p>
            Si deseas retirar fotografías o datos personales, escríbenos desde la <a className="underline" href="/privacidad#retirada">política de privacidad</a>.
          </p>
        </section>
      </main>
    </>
  );
}
