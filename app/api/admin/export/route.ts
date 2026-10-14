import * as XLSX from "xlsx";
import { NextResponse } from "next/server";
import { requireAdmin, audit } from "@/lib/auth/admin";
import { prisma } from "@/lib/database/prisma";

/**
 * Exporta SOLO solicitudes de información con consentimiento (finalidad autorizada).
 * Exclusivo del administrador principal. Los correos de Google OAuth NO se incluyen.
 */
export async function GET() {
  try {
    const admin = await requireAdmin("OWNER");
    const rows = await prisma.informationRequest.findMany({
      where: { consentGiven: true },
      orderBy: { createdAt: "desc" },
    });
    const data = rows.map((r) => ({
      Nombre: r.name,
      Correo: r.email,
      WhatsApp: r.whatsapp ?? "",
      Carrera: r.career,
      "Fecha de solicitud": r.createdAt.toISOString(),
      "Consentimiento otorgado": r.consentTimestamp?.toISOString() ?? "",
    }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(data), "Interesados");
    const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
    await audit(admin.id, "export.interesados", undefined, { count: rows.length });
    return new NextResponse(buf, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": 'attachment; filename="interesados-senati.xlsx"',
      },
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Error" }, { status: e?.status ?? 500 });
  }
}
