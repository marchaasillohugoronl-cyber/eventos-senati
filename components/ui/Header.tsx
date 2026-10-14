import Link from "next/link";
import { User, GraduationCap } from "lucide-react";

export function Header({ title }: { title?: string }) {
  return (
    <header className="sticky top-0 z-20 bg-senati-700 text-white shadow">
      <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-3">
        <Link href="/evento" className="font-extrabold tracking-wide">
          SENATI <span className="font-normal opacity-80">{title ?? "Inauguración"}</span>
        </Link>
        <nav className="flex items-center gap-3">
          <Link href="/ingenieria-software-ia" aria-label="Ingeniería de Software con IA" className="rounded-full p-2 hover:bg-white/10">
            <GraduationCap className="h-5 w-5" />
          </Link>
          <Link href="/perfil" aria-label="Mi perfil" className="rounded-full p-2 hover:bg-white/10">
            <User className="h-5 w-5" />
          </Link>
        </nav>
      </div>
    </header>
  );
}
