"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLogin() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const r = await fetch("/api/admin/login", {
      method: "POST",
      body: JSON.stringify({ email: f.get("email"), password: f.get("password") }),
    });
    if (r.ok) router.push("/admin");
    else setError((await r.json()).error ?? "Error");
  }

  return (
    <main className="grid min-h-screen place-items-center bg-senati-800 p-6">
      <form onSubmit={submit} className="card w-full max-w-sm space-y-3 p-8">
        <h1 className="text-xl font-bold text-senati-800">Panel administrativo</h1>
        <input name="email" type="email" required autoComplete="username" placeholder="Correo" className="input" />
        <input name="password" type="password" required autoComplete="current-password" placeholder="Contraseña" className="input" />
        {error && <p role="alert" className="text-sm text-rose-600">{error}</p>}
        <button className="btn btn-primary w-full">Ingresar</button>
      </form>
    </main>
  );
}
