"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function AdminLogin() {
  const router = useRouter();

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (loading) return;

    setLoading(true);
    setError(null);

    const form = new FormData(e.currentTarget);

    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: form.get("email"),
          password: form.get("password"),
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));

        throw new Error(
          typeof data.error === "string"
            ? data.error
            : "No se pudo iniciar sesión."
        );
      }

      router.push("/admin");
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Ocurrió un error inesperado."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-8">
      <div className="w-full max-w-[400px] rounded-lg bg-white px-8 py-10 shadow-md sm:px-10">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/senati-logo.svg" alt="SENATI" width={110} height={30} className="h-7 w-auto" />
        <h1 className="mt-5 text-2xl font-normal text-slate-900">Iniciar sesión</h1>
        <p className="mt-1 text-sm text-slate-700">para administrar el evento</p>

        <form onSubmit={submit} className="mt-8 space-y-5" aria-busy={loading}>
          <div>
            <label htmlFor="email" className="mb-2 block text-sm font-medium text-slate-700">Correo electrónico</label>
            <input id="email" name="email" type="email" required autoComplete="username" disabled={loading} placeholder="Tu correo electrónico" className="input min-h-11 rounded-md" />
          </div>
          <div>
            <label htmlFor="password" className="mb-2 block text-sm font-medium text-slate-700">Contraseña</label>
            <div className="flex items-center rounded-md border border-slate-200 focus-within:border-senati-500 focus-within:ring-2 focus-within:ring-senati-100">
              <input id="password" name="password" type={showPassword ? "text" : "password"} required autoComplete="current-password" disabled={loading} placeholder="Ingresa tu contraseña" className="min-h-11 min-w-0 flex-1 rounded-md bg-transparent px-3 py-2 text-sm outline-none" />
              <button type="button" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"} aria-pressed={showPassword} className="min-h-11 px-3 text-xs font-medium text-blue-600 hover:underline">{showPassword ? "Ocultar" : "Mostrar"}</button>
            </div>
          </div>
          {error && <p role="alert" className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">{error}</p>}
          <button type="submit" disabled={loading} className="btn btn-primary w-full">
            {loading ? <><span aria-hidden="true" className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />Ingresando…</> : "Iniciar sesión"}
          </button>
        </form>

        <p className="mt-6 text-xs leading-5 text-slate-500">Acceso exclusivo para el equipo de administración del evento.</p>
        <div className="mt-8 text-sm">
          <Link href="/login" className="font-medium text-blue-600 hover:underline">← Volver al acceso de visitantes</Link>
        </div>
      </div>
    </main>
  );
}
