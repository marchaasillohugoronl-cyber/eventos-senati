"use client";
import Link from "next/link";
import { AlertCircle } from "lucide-react";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <main className="mx-auto flex min-h-[70vh] max-w-lg items-center px-5 py-12">
    <section className="card w-full p-8 text-center">
      <AlertCircle className="mx-auto mb-4 h-10 w-10 text-senati-600" />
      <h1 className="text-xl font-bold">No pudimos cargar esta página</h1>
      <p className="mt-3 text-sm leading-6 text-slate-500">Puede ser un problema temporal de conexión. Intenta nuevamente en unos momentos.</p>
      <button className="btn btn-primary mt-6 w-full" onClick={reset}>Volver a intentar</button>
      <Link className="mt-4 inline-block text-sm text-senati-700 underline" href="/login">Volver al inicio</Link>
    </section>
  </main>;
}
