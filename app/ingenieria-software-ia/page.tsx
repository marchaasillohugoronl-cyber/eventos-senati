import Link from "next/link";
import { Code2, BrainCircuit, Rocket, Briefcase } from "lucide-react";
import { InfoRequestForm } from "@/components/ui/InfoRequestForm";

export const metadata = { title: "Ingeniería de Software con IA · SENATI" };

const blocks = [
  { icon: Code2, title: "Desarrollo de software", text: "Diseño y construcción de aplicaciones web y móviles, bases de datos y buenas prácticas de ingeniería." },
  { icon: BrainCircuit, title: "Inteligencia artificial", text: "Introducción a modelos de aprendizaje automático y su integración en productos de software." },
  { icon: Rocket, title: "Aplicaciones prácticas", text: "Proyectos aplicados que conectan software e IA con necesidades reales de la industria." },
  { icon: Briefcase, title: "Oportunidades profesionales", text: "Roles en desarrollo, datos e innovación tecnológica." },
];

export default function CarreraPage() {
  return (
    <main className="mx-auto max-w-2xl space-y-6 p-4">
      <Link href="/evento" className="text-sm text-senati-700 underline">← Volver al muro</Link>
      <section className="rounded-3xl bg-gradient-to-br from-senati-800 to-senati-500 p-8 text-white">
        <h1 className="text-3xl font-black">Ingeniería de Software con Inteligencia Artificial</h1>
        <p className="mt-2 opacity-90">Una carrera para crear la tecnología del futuro.</p>
      </section>

      <div className="grid gap-3 sm:grid-cols-2">
        {blocks.map(({ icon: Icon, title, text }) => (
          <div key={title} className="card p-5">
            <Icon className="mb-2 h-6 w-6 text-senati-600" />
            <h2 className="font-bold">{title}</h2>
            <p className="text-sm text-slate-600">{text}</p>
          </div>
        ))}
      </div>

      {/* PENDIENTE: completar con información VERIFICADA de SENATI (duración, malla curricular,
          certificaciones, requisitos, tecnologías y proyectos de ejemplo). No se inventan datos. */}
      <section className="card border-dashed p-5 text-sm text-slate-500">
        Duración, malla curricular, certificaciones y requisitos: se publicarán con información oficial de SENATI.
      </section>

      <InfoRequestForm />
    </main>
  );
}
