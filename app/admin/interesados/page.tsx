import { redirect } from "next/navigation";
import { getCurrentAdmin } from "@/lib/auth/admin";
import { prisma } from "@/lib/database/prisma";

export const dynamic = "force-dynamic";

/** Solo administrador principal: los colaboradores no ven datos de potenciales estudiantes. */
export default async function Interesados() {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/admin/login");
  if (admin.role !== "OWNER") redirect("/admin");

  const rows = await prisma.informationRequest.findMany({ orderBy: { createdAt: "desc" }, take: 500 });
  return (
    <section className="card space-y-4 p-5">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold text-senati-800">Solicitudes de información ({rows.length})</h1>
        <a className="btn btn-primary" href="/api/admin/export">Exportar a Excel (con consentimiento)</a>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="text-xs uppercase text-slate-500">
            <tr><th className="p-2">Nombre</th><th>Correo</th><th>WhatsApp</th><th>Fecha</th><th>Comunicaciones</th></tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t border-slate-100">
                <td className="p-2">{r.name}</td><td>{r.email}</td><td>{r.whatsapp ?? "—"}</td>
                <td>{r.createdAt.toLocaleDateString("es-PE")}</td>
                <td>{r.consentGiven ? "Autorizó" : "No autorizó"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
