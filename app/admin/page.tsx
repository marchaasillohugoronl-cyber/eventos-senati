import { prisma, getEvent } from "@/lib/database/prisma";
import { getCurrentAdmin } from "@/lib/auth/admin";
import { redirect } from "next/navigation";
import { EventControl } from "@/components/administracion/AdminButtons";

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
      <section className="card space-y-3 p-5">
        <h1 className="text-lg font-bold text-senati-800">Control del evento</h1>
        <p className="text-sm">Estado actual: <b>{event.status}</b></p>
        <EventControl status={event.status} isOwner={admin.role === "OWNER"} />
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
