"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Camera, GraduationCap, RefreshCw, ImageIcon } from "lucide-react";
import { PostCard } from "./PostCard";
import { EventIntro } from "@/components/ui/EventIntro";
import { useRealtime } from "@/lib/realtime/client";
import type { PublicPost } from "@/lib/posts";

type Status = "SCHEDULED" | "ACTIVE" | "FINISHED";

export function Feed() {
  const [posts, setPosts] = useState<PublicPost[]>([]);
  const [status, setStatus] = useState<Status>("SCHEDULED");
  const [cursor, setCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const inFlight = useRef(false);
  const pendingLikes = useRef(new Set<string>());
  const lastSync = useRef<string>(new Date(0).toISOString());

  const load = useCallback(async (after?: string | null) => {
    if (inFlight.current) return;
    inFlight.current = true;
    setError(null);
    if (after) setLoadingMore(true); else setLoading(true);
    try {
      const r = await fetch(`/api/posts?limit=20${after ? `&cursor=${encodeURIComponent(after)}` : ""}`);
      if (r.status === 401) { window.location.assign("/login?callbackUrl=/evento"); return; }
      if (!r.ok) throw new Error("No se pudo cargar el muro. Intenta nuevamente.");
      const data = await r.json();
      setStatus(data.status);
      setPosts((prev) => after ? [...new Map([...prev, ...data.posts].map((p: PublicPost) => [p.id, p])).values()] : data.posts);
      setCursor(data.nextCursor);
      lastSync.current = new Date().toISOString();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Revisa tu conexión e intenta nuevamente.");
    } finally {
      inFlight.current = false;
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Tras una desconexión se pide lo creado/modificado desde la última sincronización.
  const resync = useCallback(async () => {
    try {
    const r = await fetch(`/api/posts?since=${encodeURIComponent(lastSync.current)}`);
    if (!r.ok) return;
    const data = await r.json();
    setStatus(data.status);
    setPosts((prev) => {
      const map = new Map(prev.map((p) => [p.id, p]));
      data.posts.forEach((p: PublicPost) => map.set(p.id, p));
      return [...map.values()].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    });
    lastSync.current = new Date().toISOString();
    } catch { /* El muro conserva el contenido mientras vuelve la conexión. */ }
  }, []);

  useEffect(() => {
    const timer = setInterval(() => { if (document.visibilityState === "visible") void resync(); }, 30_000);
    return () => clearInterval(timer);
  }, [resync]);

  useRealtime((m) => {
    const d = m.data;
    if (m.name === "post.created") setPosts((p) => (p.some((x) => x.id === d.post.id) ? p : [{ ...d.post, likedByMe: false }, ...p]));
    else if (m.name === "post.updated" && d.post) setPosts((p) => p.map((x) => (x.id === d.post.id ? { ...d.post, likedByMe: x.likedByMe } : x)));
    else if (m.name === "post.updated" && d.reload) load();
    else if (m.name === "post.hidden") setPosts((p) => p.filter((x) => x.id !== d.postId));
    else if (m.name === "like.updated") setPosts((p) => p.map((x) => (x.id === d.postId ? { ...x, likeCount: d.likeCount } : x)));
    else if (m.name === "comment.created") setPosts((p) => p.map((x) => (x.id === d.postId ? { ...x, commentCount: x.commentCount + 1 } : x)));
    else if (m.name === "comment.removed") setPosts((p) => p.map((x) => (x.id === d.postId ? { ...x, commentCount: Math.max(0, x.commentCount - 1) } : x)));
    else if (m.name === "event.status.changed") setStatus(d.status);
  }, resync);

  async function like(id: string) {
    if (pendingLikes.current.has(id)) return;
    pendingLikes.current.add(id);
    try {
      const r = await fetch(`/api/posts/${id}/like`, { method: "POST" });
      if (r.status === 401) { window.location.assign("/login?callbackUrl=/evento"); return; }
      if (!r.ok) throw new Error("No se pudo guardar tu reacción. Inténtalo nuevamente.");
      const { liked, likeCount } = await r.json();
      setPosts((p) => p.map((x) => x.id === id ? { ...x, likedByMe: liked, likeCount } : x));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Revisa tu conexión.");
    } finally { pendingLikes.current.delete(id); }
  }

  const readOnly = status !== "ACTIVE";

  return (
    <div className="event-feed pb-28">
      <EventIntro eyebrow="Inauguración SENATI" title="Comparte la experiencia" description="Así vivimos la inauguración. Descubre los momentos de la comunidad y comparte los tuyos." />
      <div className="relative mx-auto -mt-8 grid max-w-6xl items-start gap-6 px-4 sm:px-6 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div className="min-w-0 space-y-5 border-t-4 border-[#34c9ef] bg-[#f2f2f2] pt-6">
      <section className="flex items-center justify-between gap-4">
        <div><h2 className="text-lg font-bold tracking-tight">Muro del evento</h2><p className="mt-1 text-xs text-slate-500">Los momentos que compartimos</p></div>
        <button aria-label="Actualizar muro" className="btn btn-ghost !p-3" disabled={loading || loadingMore} onClick={() => load()}><RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /></button>
      </section>
      {error && <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">{error}<button className="ml-2 font-semibold underline" onClick={() => load()}>Reintentar</button></div>}
      {loading && posts.length === 0 && <div role="status" className="space-y-4"><span className="sr-only">Cargando fotografías</span>{[0, 1].map(i => <div key={i} className="h-64 animate-pulse rounded-2xl bg-slate-200 motion-reduce:animate-none" />)}</div>}
      {!loading && !error && status === "SCHEDULED" && <p className="card p-4 text-center text-sm">El evento aún no ha comenzado. ¡Pronto podrás compartir tus fotografías!</p>}
      {!loading && !error && status === "FINISHED" && <p className="card p-4 text-center text-sm">El evento finalizó. Este muro es ahora un álbum para ver y descargar fotografías.</p>}

      {posts.map((p, i) => (
        <div key={p.id} className="space-y-4">
          <PostCard post={p} readOnly={readOnly} onLike={like} />
          {i === 2 && (
            <Link href="https://www.senati.edu.pe/especialidades/tecnologias-de-la-informacion/ingenieria-de-software-con-inteligencia-artificial" className="card flex items-center gap-3 bg-gradient-to-r from-senati-700 to-senati-500 p-4 text-white">
              <GraduationCap className="h-8 w-8 shrink-0" />
              <div className="text-sm">
                <p className="font-bold">Ingeniería de Software con IA</p>
                <p className="opacity-90">Conoce la carrera y solicita información →</p>
              </div>
            </Link>
          )}
        </div>
      ))}

      {!loading && !error && posts.length === 0 && <section className="card px-6 py-12 text-center"><ImageIcon className="mx-auto mb-4 h-10 w-10 text-senati-500" /><h2 className="font-bold">El álbum comienza contigo</h2><p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-500">{status === "ACTIVE" ? "Comparte la primera fotografía y dale vida al muro." : "Aquí aparecerán las fotografías que comparta la comunidad durante el evento."}</p></section>}
      {cursor && <button className="btn btn-ghost w-full" disabled={loadingMore || loading} onClick={() => load(cursor)}>{loadingMore ? "Cargando…" : "Cargar más fotografías"}</button>}
      </div>
      <aside className="space-y-4 lg:sticky lg:top-40">
        <section className="event-participate border border-white/10 bg-[#071528] p-7 text-white">
          <span className="mb-4 inline-flex rounded-full bg-senati-50 px-3 py-1 text-xs font-semibold text-senati-700">{loading ? "Cargando evento" : error ? "Sin actualizar" : status === "ACTIVE" ? "Evento en curso" : status === "SCHEDULED" ? "Próximamente" : "Álbum del evento"}</span>
          <h2 className="text-lg font-bold">Tu mirada también cuenta</h2>
          <p className="mt-2 text-sm leading-6 text-slate-300">Fotos con amigos, nuevos encuentros y momentos para recordar. Este álbum lo creamos juntos.</p>
          {status === "ACTIVE" && <Link href="/evento/publicar" className="btn btn-primary mt-5 w-full"><Camera className="h-4 w-4" /> Compartir fotos</Link>}
        </section>
        <a href="https://www.senati.edu.pe/especialidades/tecnologias-de-la-informacion/ingenieria-de-software-con-inteligencia-artificial" className="block border border-slate-300 bg-white p-7 text-senati-900 transition hover:border-senati-500"><GraduationCap className="mb-4 h-7 w-7" /><p className="text-[10px] font-bold uppercase tracking-widest text-senati-600">Conoce tu próxima carrera</p><h2 className="mt-2 text-lg font-bold leading-snug">Ingeniería de Software con Inteligencia Artificial</h2><p className="mt-5 text-sm font-semibold">Descubre más en SENATI →</p></a>
      </aside>
      </div>

      {status === "ACTIVE" && (
        <Link href="/evento/publicar" className="btn btn-primary fixed bottom-5 left-1/2 z-30 -translate-x-1/2 whitespace-nowrap px-7 py-3.5 text-base shadow-xl lg:hidden">
          <Camera className="h-5 w-5" /> Publicar fotografías
        </Link>
      )}
    </div>
  );
}
