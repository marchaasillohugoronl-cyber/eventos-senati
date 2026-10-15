
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
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-slate-950 via-senati-800 to-blue-950 px-4 py-10 sm:px-6">

      {/* Decoración de fondo */}
      <div className="pointer-events-none absolute -left-20 top-10 h-72 w-72 rounded-full bg-blue-400/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-20 right-0 h-96 w-96 rounded-full bg-cyan-400/10 blur-3xl" />

      <div className="relative grid w-full max-w-5xl overflow-hidden rounded-3xl bg-white shadow-2xl md:grid-cols-2">

        {/* PANEL IZQUIERDO */}
        <section className="relative hidden min-h-[580px] flex-col justify-between overflow-hidden bg-gradient-to-br from-blue-800 to-slate-950 p-10 text-white md:flex">

          <div className="absolute -right-24 top-40 h-72 w-72 rounded-full border border-white/10" />
          <div className="absolute -right-10 top-52 h-52 w-52 rounded-full border border-white/10" />

          {/* Marca */}
          <div className="relative z-10 flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/15 text-2xl font-bold">
              S
            </div>

            <div>
              <h2 className="text-xl font-extrabold tracking-wider">
                SENATI
              </h2>
              <p className="text-xs text-blue-200">
                Sistema administrativo
              </p>
            </div>
          </div>

          {/* Presentación */}
          <div className="relative z-10">
            <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl border border-white/15 bg-white/10">
              <svg
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
                <path d="m9 12 2 2 4-4" />
              </svg>
            </div>

            <h1 className="max-w-sm text-4xl font-bold leading-tight">
              Administra todo desde un solo lugar.
            </h1>

            <p className="mt-5 max-w-sm text-sm leading-7 text-blue-100/80">
              Accede a las herramientas de administración
              de manera sencilla, rápida y segura.
            </p>
          </div>

          <p className="relative z-10 text-xs text-blue-200/80">
            Acceso exclusivo para personal autorizado
          </p>
        </section>

        {/* PANEL DERECHO */}
        <section className="flex min-h-[580px] items-center justify-center px-7 py-12 sm:px-12">

          <div className="w-full max-w-sm">

            {/* Logo para celulares */}
            <div className="mb-9 flex items-center gap-3 md:hidden">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-800 text-xl font-bold text-white">
                S
              </div>
              <span className="text-xl font-bold text-slate-900">
                SENATI
              </span>
            </div>

            <span className="inline-flex rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-800">
              Panel administrativo
            </span>

            <h2 className="mt-5 text-3xl font-bold tracking-tight text-slate-900">
              Bienvenido de nuevo
            </h2>

            <p className="mt-3 text-sm leading-6 text-slate-500">
              Ingresa tus credenciales para acceder
              al sistema.
            </p>

            {/* FORMULARIO */}
            <form onSubmit={submit} className="mt-9 space-y-5">

              {/* CORREO */}
              <div>
                <label
                  htmlFor="email"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Correo electrónico
                </label>

                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  autoComplete="username"
                  defaultValue="hugo@gmail.com"
                  placeholder="admin@ejemplo.com"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-600 focus:bg-white focus:ring-4 focus:ring-blue-100"
                />
              </div>

              {/* CONTRASEÑA */}
              <div>
                <label
                  htmlFor="password"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Contraseña
                </label>

                <div className="flex items-center overflow-hidden rounded-xl border border-slate-200 bg-slate-50 transition focus-within:border-blue-600 focus-within:bg-white focus-within:ring-4 focus-within:ring-blue-100">

                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    required
                    autoComplete="current-password"
                    placeholder="Ingresa tu contraseña"
                    className="min-w-0 flex-1 bg-transparent px-4 py-3.5 text-sm text-slate-900 outline-none placeholder:text-slate-400"
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={
                      showPassword
                        ? "Ocultar contraseña"
                        : "Mostrar contraseña"
                    }
                    aria-pressed={showPassword}
                    className="px-4 py-3 text-xs font-semibold text-blue-800 transition hover:text-blue-600"
                  >
                    {showPassword ? "Ocultar" : "Mostrar"}
                  </button>
                </div>
              </div>

              {/* ERRORES */}
              {error && (
                <div
                  role="alert"
                  className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
                >
                  {error}
                </div>
              )}

              {/* INGRESAR */}
              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-3 rounded-xl bg-blue-800 px-5 py-3.5 text-sm font-semibold text-white shadow-lg shadow-blue-900/15 transition hover:-translate-y-0.5 hover:bg-blue-900 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Ingresando...
                  </>
                ) : (
                  <>
                    Iniciar sesión
                    <span aria-hidden="true">→</span>
                  </>
                )}
              </button>
            </form>

            {/* PIE */}
            <div className="mt-9 border-t border-slate-100 pt-6">
              <Link href="/login" className="mb-4 block text-center text-sm font-medium text-senati-700 hover:underline">← Volver al acceso de visitantes</Link>
              <p className="text-center text-xs text-slate-400">
                Acceso seguro y restringido
              </p>
            </div>

          </div>
        </section>
      </div>
    </main>
  );
}
