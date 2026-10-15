"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { User, GraduationCap, Images, Camera } from "lucide-react";

export function Header({ title }: { title?: string }) {
  const pathname = usePathname();
  const links = [
    { href: "/evento", label: "Muro", icon: Images },
    { href: "/evento/publicar", label: "Publicar", icon: Camera },
    { href: "https://www.senati.edu.pe/especialidades/tecnologias-de-la-informacion/ingenieria-de-software-con-inteligencia-artificial", label: "Carrera", icon: GraduationCap },
    { href: "/perfil", label: "Mi perfil", icon: User },
  ];
  return <header className="event-header sticky top-0 z-20 border-b border-slate-200 bg-white">
    <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-8 px-4 sm:px-6">
      <Link href="/evento" className="flex items-center gap-4 py-5" aria-label="SENATI, inicio del evento">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/senati-logo.svg" alt="SENATI" width={120} height={34} className="h-8 w-auto" />
        <span className="border-l border-slate-200 pl-4 text-xs text-slate-500">{title ?? "Inauguración"}</span>
      </Link>
      <nav aria-label="Navegación principal" className="grid w-full grid-cols-4 border-t border-slate-100 sm:w-auto sm:border-0">
        {links.map(({ href, label, icon: Icon }) => <Link key={href} href={href} aria-current={pathname === href ? "page" : undefined} className={`flex min-h-14 items-center justify-center gap-2 border-b-2 px-3 text-xs transition sm:px-5 sm:text-sm ${pathname === href ? "border-[#1645f5] text-[#1645f5]" : "border-transparent text-slate-500 hover:border-slate-300 hover:text-[#1645f5]"}`}><Icon className="h-4 w-4 sm:hidden" />{label}</Link>)}
      </nav>
    </div>
  </header>;
}
