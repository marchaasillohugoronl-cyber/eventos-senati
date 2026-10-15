import { Camera, Images, Users } from "lucide-react";

export function EventIntro({ eyebrow, title, description }: { eyebrow: string; title: string; description: string }) {
  return <section className="event-hero text-white">
    <div className="mx-auto max-w-6xl px-4 pb-20 pt-7 sm:px-6 sm:pb-24">
      <p className="mb-12 text-xs text-slate-300">Inicio <span className="mx-3 text-slate-500">/</span> Evento SENATI</p>
      <div className="max-w-3xl">
      <span className="mb-3 block h-px w-8 bg-white" />
      <p className="text-xl font-normal uppercase sm:text-3xl">{eyebrow}</p>
      <h1 className="mt-1 text-3xl font-normal uppercase leading-tight text-[#39c9ef] sm:text-5xl">{title}</h1>
      <p className="mt-6 max-w-2xl text-base leading-7 text-white">{description}</p>
      <div className="mt-7 grid gap-4 border-t border-white/40 pt-6 text-sm text-slate-200 sm:grid-cols-3">
        <p className="flex items-center gap-3"><Camera className="h-5 w-5 shrink-0" /> Comparte tus fotografías</p>
        <p className="flex items-center gap-3"><Images className="h-5 w-5 shrink-0" /> Descubre el álbum</p>
        <p className="flex items-center gap-3"><Users className="h-5 w-5 shrink-0" /> Conecta con la comunidad</p>
      </div>
      </div>
    </div>
  </section>;
}
