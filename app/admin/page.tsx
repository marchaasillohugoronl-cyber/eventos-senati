import { prisma, getEvent } from "@/lib/database/prisma";
import { getCurrentAdmin } from "@/lib/auth/admin";
import { redirect } from "next/navigation";
import { EventControl } from "@/components/administracion/AdminButtons";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function AdminHome() {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/admin/login");

  const [event, users, posts, photos, comments, likes, pendingReports, pendingRemovals] = await Promise.all([
    getEvent(),
    prisma.user.count(),
    prisma.post.count(),
    prisma.postImage.count(),
    prisma.comment.count({ where: { removed: false } }),
    prisma.like.count(),
    prisma.report.count({ where: { status: "PENDING" } }),
    prisma.removalRequest.count({ where: { status: "PENDING" } }),
  ]);

  const stats = [
    ["Visitantes", users],
    ["Publicaciones", posts],
    ["Fotografías", photos],
    ["Comentarios", comments],
    ["Me gusta", likes],
    ["Reportes pendientes", pendingReports],
    ["Retiradas pendientes", pendingRemovals],
  ];

  return (
    <div className="space-y-6">
      <div className="py-3"><p className="text-xs font-semibold uppercase tracking-widest text-senati-600">Centro de administración</p><h1 className="mt-2 text-3xl font-black tracking-tight">Todo listo para el evento</h1><p className="mt-2 text-sm text-slate-500">Gestiona la participación y acompaña a tu comunidad.</p></div>
      <section className="card space-y-3 p-5">
        <h2 className="text-lg font-bold text-senati-800">{event.title}</h2>
        <p className="text-sm">Estado actual: <span className="inline-flex rounded-full bg-senati-50 px-3 py-1 font-semibold text-senati-700">{{ SCHEDULED: "Programado", ACTIVE: "En vivo", FINISHED: "Finalizado" }[event.status]}</span></p>
        <p className="text-sm text-slate-500">{event.status === "ACTIVE" ? "Los visitantes pueden publicar, comentar y reaccionar." : event.status === "SCHEDULED" ? "Inicia el evento para habilitar la participación de los visitantes." : "El álbum sigue disponible. Puedes reabrir el evento para recibir nuevas fotografías."}</p>
        <EventControl status={event.status} isOwner={admin.role === "OWNER"} />
      </section>
      <section className="grid gap-3 sm:grid-cols-3" aria-label="Accesos rápidos">
        {[["/admin/qr", "Invita a participar", "Genera el QR y los afiches del evento."], ["/admin/publicaciones", "Revisa el álbum", "Gestiona las fotografías publicadas."], ["/tv", "Abre la pantalla", "Proyecta los momentos de la comunidad."]].map(([href, title, description]) => <Link key={href} href={href} className="card p-5 transition hover:bg-senati-50"><h2 className="font-bold text-senati-800">{title} →</h2><p className="mt-2 text-sm leading-6 text-slate-500">{description}</p></Link>)}
      </section>
      <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {stats.map(([label, value]) => (
          <div key={label as string} className="card p-4">
            <p className="text-3xl font-black text-senati-700">{value}</p>
            <p className="text-xs text-slate-500">{label}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
