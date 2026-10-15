import Link from "next/link";
import { getCurrentAdmin } from "@/lib/auth/admin";
import { LogoutButton } from "@/components/administracion/AdminButtons";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await getCurrentAdmin(); // null en /admin/login
  if (!admin) return <>{children}</>;
  return (
    <div className="min-h-screen">
      {admin && (
        <header className="bg-senati-800 text-white">
          <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-4 px-4 py-3 text-sm">
            <b>SENATI · Admin</b>
            <Link href="/admin">Resumen</Link>
            <Link href="/admin/publicaciones">Publicaciones</Link>
            <Link href="/admin/qr">QR y afiches</Link>
            {admin.role === "OWNER" && <Link href="/admin/interesados">Interesados</Link>}
            <span className="ml-auto opacity-70">{admin.email} ({admin.role === "OWNER" ? "principal" : "colaborador"})</span>
            <LogoutButton />
          </div>
        </header>
      )}
      <div className="mx-auto max-w-5xl p-4">{children}</div>
    </div>
  );
}
