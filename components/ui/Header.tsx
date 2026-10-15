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
  return <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
    <div className="mx-auto max-w-2xl px-4">
      <div className="flex items-center justify-between py-3">
        <Link href="/evento" className="text-lg font-black tracking-wide text-senati-700">SENATI <span className="text-xs font-medium tracking-normal text-slate-400">EventShare</span></Link>
        <span className="text-xs text-slate-500">{title ?? "Inauguración"}</span>
      </div>
      <nav aria-label="Navegación principal" className="grid grid-cols-4 gap-1 pb-2">
        {links.map(({ href, label, icon: Icon }) => <Link key={href} href={href} aria-current={pathname === href ? "page" : undefined} className={`flex items-center justify-center gap-1.5 rounded-lg px-1 py-2.5 text-xs font-semibold transition sm:text-sm ${pathname === href ? "bg-senati-50 text-senati-700" : "text-slate-500 hover:bg-slate-50 hover:text-senati-700"}`}><Icon className="h-4 w-4" />{label}</Link>)}
      </nav>
    </div>
  </header>;
}
