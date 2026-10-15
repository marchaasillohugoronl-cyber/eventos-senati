import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/database/prisma";
import { postInclude, serializePost } from "@/lib/posts";
import { cldUrl } from "@/lib/cloudinary/urls";
import { Header } from "@/components/ui/Header";
import { PublicNameForm } from "@/components/ui/PublicNameForm";
import { signOut } from "@/auth";
import Link from "next/link";
import { Camera, ShieldCheck } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function PerfilPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?callbackUrl=/perfil");

  const posts = (
    await prisma.post.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, include: postInclude })
  ).map((p) => ({ ...serializePost(p), hidden: p.visibility === "HIDDEN" }));

  return (
    <div className="event-theme min-h-screen">
      <Header title="Mi perfil" />
      <main className="mx-auto max-w-5xl space-y-6 px-4 py-6 sm:px-6">
        <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white">
          <div className="h-24 bg-senati-900" />
          <div className="px-6 pb-6 sm:px-8">
            <div className="-mt-9 flex flex-wrap items-end justify-between gap-4">
              <div className="grid h-20 w-20 place-items-center rounded-3xl border-4 border-white bg-senati-100 text-3xl font-bold text-senati-700">{user.publicName.slice(0, 1).toUpperCase()}</div>
              <span className="rounded-full bg-slate-100 px-4 py-2 text-xs font-semibold text-slate-600">{posts.length} {posts.length === 1 ? "publicación" : "publicaciones"}</span>
            </div>
            <h1 className="mt-4 break-words text-2xl font-bold tracking-tight">Hola, {user.publicName}</h1>
            <p className="mt-2 text-sm text-slate-500">Este es tu espacio y tu colección de recuerdos.</p>
          </div>
        </section>
        <div className="grid items-start gap-6 lg:grid-cols-[300px_minmax(0,1fr)]">
        <section className="space-y-5 rounded-3xl border border-slate-200 bg-white p-6">
          <div><h2 className="font-bold">Mi cuenta</h2><p className="mt-2 text-xs leading-5 text-slate-500">Así aparece tu nombre en el muro del evento.</p></div>
          <PublicNameForm initial={user.publicName} />
          <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-semibold text-slate-600">Cuenta de Google</p><p className="mt-1 break-all text-sm text-slate-800">{user.email}</p><p className="mt-2 text-xs text-slate-500">Solo tú puedes ver tu correo.</p></div>
          <form action={async () => { "use server"; await signOut({ redirectTo: "/login" }); }}><button className="btn btn-ghost" type="submit">Cerrar sesión</button></form>
        </section>

        <section className="min-w-0 space-y-4">
          <h2 className="text-lg font-bold">Mis publicaciones</h2>
          {posts.length === 0 && <div className="rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center"><Camera className="mx-auto mb-4 h-9 w-9 text-senati-500" /><h3 className="font-semibold">Tus recuerdos empiezan aquí</h3><p className="mt-2 text-sm text-slate-500">Cuando compartas fotografías, las encontrarás en este espacio.</p><Link href="/evento/publicar" className="btn btn-primary mt-5">Compartir un momento</Link></div>}
          {posts.map((p) => (
            <article key={p.id} className="rounded-3xl border border-slate-200 bg-white p-5">
              <div className="flex gap-2 overflow-x-auto">
                {p.images.map((i) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img key={i.id} src={cldUrl(i.publicId, "thumb")} alt="Fotografía de tu publicación" className="h-28 w-28 shrink-0 rounded-2xl object-cover" />
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
        </div>

        <section className="rounded-2xl bg-slate-100 p-5 text-sm text-slate-600">
          <h2 className="mb-2 flex items-center gap-2 font-bold text-senati-800"><ShieldCheck className="h-4 w-4" /> Tu privacidad importa</h2>
          <p>
            Si deseas retirar fotografías o datos personales, escríbenos desde la <a className="underline" href="/privacidad#retirada">política de privacidad</a>.
          </p>
        </section>
      </main>
    </div>
  );
}
