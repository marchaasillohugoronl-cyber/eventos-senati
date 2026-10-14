"use client";

import { useRouter } from "next/navigation";

async function call(url: string, method: string, body?: unknown) {
  const r = await fetch(url, { method, body: body ? JSON.stringify(body) : undefined });
  if (!r.ok) alert((await r.json().catch(() => ({}))).error ?? "Error");
  return r.ok;
}

export function EventControl({ status, isOwner }: { status: string; isOwner: boolean }) {
  const router = useRouter();
  const set = async (s: string) => {
    if (await call("/api/admin/event", "PATCH", { status: s })) router.refresh();
  };
  if (!isOwner) return <p className="text-sm text-slate-500">Solo el administrador principal controla el evento.</p>;
  return (
    <div className="flex flex-wrap gap-2">
      <button className="btn btn-primary" disabled={status === "ACTIVE"} onClick={() => set("ACTIVE")}>{status === "FINISHED" ? "Reabrir evento" : "Iniciar evento"}</button>
      <button className="btn btn-ghost" disabled={status !== "ACTIVE"} onClick={() => set("FINISHED")}>Finalizar evento</button>
      <button className="btn btn-ghost" disabled={status === "SCHEDULED"} onClick={() => set("SCHEDULED")}>Volver a programado</button>
    </div>
  );
}

export function PostModeration({ id, hidden, isOwner }: { id: string; hidden: boolean; isOwner: boolean }) {
  const router = useRouter();
  return (
    <div className="flex gap-2 text-sm">
      <button className="btn btn-ghost !px-3 !py-1" onClick={async () => (await call(`/api/admin/posts/${id}`, "PATCH", { visibility: hidden ? "VISIBLE" : "HIDDEN" })) && router.refresh()}>
        {hidden ? "Mostrar" : "Ocultar"}
      </button>
      {isOwner && (
        <button className="btn !bg-rose-600 !px-3 !py-1 text-white" onClick={async () => confirm("¿Eliminar definitivamente (incluye archivos)?") && (await call(`/api/admin/posts/${id}`, "DELETE")) && router.refresh()}>
          Eliminar
        </button>
      )}
    </div>
  );
}

export function LogoutButton() {
  const router = useRouter();
  return (
    <button className="btn btn-ghost" onClick={async () => { await call("/api/admin/login", "DELETE"); router.push("/admin/login"); }}>
      Salir
    </button>
  );
}
