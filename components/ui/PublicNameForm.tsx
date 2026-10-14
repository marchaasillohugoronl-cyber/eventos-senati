"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function PublicNameForm({ initial }: { initial: string }) {
  const router = useRouter();
  const [name, setName] = useState(initial);
  const [msg, setMsg] = useState<string | null>(null);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const r = await fetch("/api/me", { method: "PATCH", body: JSON.stringify({ publicName: name }) });
    setMsg(r.ok ? "Nombre actualizado." : "Nombre no válido (2 a 40 caracteres).");
    if (r.ok) router.refresh();
  }

  return (
    <form onSubmit={save} className="flex gap-2">
      <input className="input" value={name} onChange={(e) => setName(e.target.value)} maxLength={40} aria-label="Nombre público" />
      <button className="btn btn-primary">Guardar</button>
      {msg && <span role="status" className="sr-only">{msg}</span>}
    </form>
  );
}
