"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";

async function call(url: string, method: string, body?: unknown) {
  const r = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: body ? JSON.stringify(body) : undefined });
  if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error ?? "No se pudo completar la acción.");
  return true;
}

export function EventControl({ status, isOwner }: { status: string; isOwner: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const locked = useRef(false);
  const set = async (s: string) => {
    if (locked.current) return;
    if (s === "FINISHED" && !confirm("¿Finalizar el evento? Los visitantes podrán ver el álbum, pero ya no publicar.")) return;
    locked.current = true;
    setBusy(true);
    setError(null);
    try { await call("/api/admin/event", "PATCH", { status: s }); router.refresh(); }
    catch (err) { setError(err instanceof Error ? err.message : "Revisa tu conexión e intenta nuevamente."); }
    finally { locked.current = false; setBusy(false); }
  };
  if (!isOwner) return <p className="text-sm text-slate-500">Solo el administrador principal controla el evento.</p>;
  return (
    <div className="space-y-3">{error && <p role="alert" className="text-sm text-rose-700">{error}</p>}<div className="flex flex-wrap gap-2">
      <button className="btn btn-primary" disabled={busy || status === "ACTIVE"} onClick={() => set("ACTIVE")}>{status === "FINISHED" ? "Reabrir evento" : "Iniciar evento"}</button>
      <button className="btn btn-ghost" disabled={busy || status !== "ACTIVE"} onClick={() => set("FINISHED")}>Finalizar evento</button>
      <button className="btn btn-ghost" disabled={busy || status === "SCHEDULED"} onClick={() => set("SCHEDULED")}>Volver a programado</button>
    </div>{busy && <p role="status" className="text-sm text-slate-500">Actualizando evento…</p>}</div>
  );
}

export function PostModeration({ id, hidden, isOwner }: { id: string; hidden: boolean; isOwner: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const locked = useRef(false);
  async function moderate(remove = false) {
    if (locked.current) return;
    if (remove && !confirm("¿Eliminar definitivamente esta publicación y sus archivos?")) return;
    locked.current = true;
    setBusy(true); setError(null);
    try { await call(`/api/admin/posts/${id}`, remove ? "DELETE" : "PATCH", remove ? undefined : { visibility: hidden ? "VISIBLE" : "HIDDEN" }); router.refresh(); }
    catch (err) { setError(err instanceof Error ? err.message : "No se pudo completar la acción."); }
    finally { locked.current = false; setBusy(false); }
  }
  return <div className="space-y-2">
    <div className="flex gap-2 text-sm">
      <button disabled={busy} className="btn btn-ghost !px-3 !py-1" onClick={() => moderate()}>{hidden ? "Mostrar" : "Ocultar"}</button>
      {isOwner && <button disabled={busy} className="btn !bg-rose-600 !px-3 !py-1 text-white" onClick={() => moderate(true)}>Eliminar</button>}
    </div>
    {error && <p role="alert" className="text-sm text-rose-700">{error}</p>}
  </div>;
}

export function LogoutButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  return <div>
    <button disabled={busy} className="btn btn-ghost" onClick={async () => {
      setBusy(true); setError(false);
      try { await call("/api/admin/login", "DELETE"); router.replace("/admin/login"); router.refresh(); }
      catch { setError(true); setBusy(false); }
    }}>{busy ? "Saliendo…" : "Cerrar sesión"}</button>
    {error && <p role="alert" className="mt-2 text-xs">No se pudo cerrar la sesión. Intenta nuevamente.</p>}
  </div>;
}
