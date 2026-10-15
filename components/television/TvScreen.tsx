"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import { get, set } from "idb-keyval";
import { cldUrl } from "@/lib/cloudinary/urls";
import { useRealtime } from "@/lib/realtime/client";
import type { PublicPost } from "@/lib/posts";
import Link from "next/link";
import { Camera, Maximize, LogIn } from "lucide-react";
import { EVENT_LOGIN_PATH, eventLoginUrl } from "@/lib/event-links";

const SHOW_MS = 8000;
const CACHE_KEY = "tv-posts";

type Floating = { id: string; text: string; author: string; left: number };

export function TvScreen({ tvKey, appUrl }: { tvKey?: string; appUrl: string }) {
  const [posts, setPosts] = useState<PublicPost[]>([]);
  const [title, setTitle] = useState("Inauguración de la nueva sede SENATI");
  const [current, setCurrent] = useState<PublicPost | null>(null);
  const [floating, setFloating] = useState<Floating[]>([]);
  const [qr, setQr] = useState("");
  const [online, setOnline] = useState(true);
  const [screenMessage, setScreenMessage] = useState("");

  const postsRef = useRef<PublicPost[]>([]);
  const queue = useRef<string[]>([]); // FIFO de ids NUEVOS (post.created)
  const queued = useRef(new Set<string>()); // evita encolar dos veces
  const shown = useRef(new Set<string>());
  const archiveIdx = useRef(0);
  const lastSync = useRef(new Date(0).toISOString());
  postsRef.current = posts;

  useEffect(() => {
    QRCode.toDataURL(eventLoginUrl(appUrl), { margin: 4, width: 400, errorCorrectionLevel: "M" }).then(setQr).catch(() => setScreenMessage("No se pudo generar el QR. Recarga la pantalla."));
  }, [appUrl]);

  const mergePosts = useCallback((incoming: PublicPost[]) => {
    setPosts((prev) => {
      const map = new Map(prev.map((p) => [p.id, p]));
      incoming.forEach((p) => map.set(p.id, p));
      const arr = [...map.values()].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      set(CACHE_KEY, arr).catch(() => {});
      return arr;
    });
  }, []);

  const sync = useCallback(
    async (initial = false) => {
      try {
        const q = new URLSearchParams();
        if (tvKey) q.set("key", tvKey);
        if (!initial) q.set("since", lastSync.current);
        const r = await fetch(`/api/tv/posts?${q}`, { cache: "no-store" });
        if (!r.ok) throw new Error();
        const data = await r.json();
        setTitle(data.event.title);
        setOnline(true);
        lastSync.current = data.now;
        if (initial) data.posts.forEach((p: PublicPost) => shown.current.add(p.id)); // lo previo no es "nuevo"
        else
          // Recuperación tras desconexión: lo creado mientras estuvo offline entra a la cola una sola vez.
          [...data.posts].reverse().forEach((p: PublicPost) => {
            if (!postsRef.current.some((x) => x.id === p.id) && !queued.current.has(p.id)) {
              queued.current.add(p.id);
              queue.current.push(p.id);
            }
          });
        mergePosts(data.posts);
      } catch {
        setOnline(false);
      }
    },
    [tvKey, mergePosts]
  );

  // Carga inicial: primero caché local (sirve sin Internet), luego red.
  useEffect(() => {
    get<PublicPost[]>(CACHE_KEY).then((c) => c && setPosts(c)).catch(() => {});
    sync(true);
    const t = setInterval(() => sync(false), 60_000); // red de seguridad además del tiempo real
    return () => clearInterval(t);
  }, [sync]);

  useRealtime((m) => {
    const d = m.data;
    if (m.name === "post.created" && !queued.current.has(d.post.id)) {
      queued.current.add(d.post.id);
      queue.current.push(d.post.id);
      mergePosts([d.post]);
    } else if (m.name === "post.updated" && d.post) {
      mergePosts([d.post]); // edición: actualiza contenido, NO reencola
      setCurrent((c) => (c?.id === d.post.id ? d.post : c));
    } else if (m.name === "post.hidden") {
      setPosts((p) => p.filter((x) => x.id !== d.postId));
      queue.current = queue.current.filter((id) => id !== d.postId);
      setCurrent((c) => (c?.id === d.postId ? null : c));
    } else if (m.name === "like.updated") {
      setPosts((p) => p.map((x) => (x.id === d.postId ? { ...x, likeCount: d.likeCount } : x)));
      setCurrent((c) => (c && c.id === d.postId ? { ...c, likeCount: d.likeCount } : c));
    } else if (m.name === "comment.created") {
      setFloating((f) => [...f.slice(-3), { id: d.comment.id, text: d.comment.content, author: d.comment.authorName, left: 5 + Math.random() * 20 }]);
      setTimeout(() => setFloating((f) => f.filter((x) => x.id !== d.comment.id)), 6000);
    }
  }, () => sync(false));

  // Reloj de presentación: cola FIFO primero, luego archivo rotativo. Cada ítem dura 8 s.
  useEffect(() => {
    const tick = () => {
      const all = postsRef.current;
      let next: PublicPost | undefined;
      while (queue.current.length && !next) {
        const id = queue.current.shift()!;
        next = all.find((p) => p.id === id);
      }
      if (!next && all.length) {
        archiveIdx.current = (archiveIdx.current + 1) % all.length;
        next = all[archiveIdx.current];
      }
      if (next) setCurrent(next);
    };
    tick();
    const t = setInterval(tick, SHOW_MS);
    return () => clearInterval(t);
  }, []);

  const isEmpty = posts.length === 0;

  async function openFullscreen() {
    try {
      if (!document.fullscreenElement) await document.documentElement.requestFullscreen();
      else await document.exitFullscreen();
    } catch { setScreenMessage("Usa F11 para ver la pantalla completa."); }
  }

  return (
    <main className="event-theme tv-display flex min-h-screen flex-col bg-[#061426] text-white lg:h-dvh lg:overflow-hidden">
      <header className="flex items-center justify-between gap-4 bg-white px-5 py-4 text-slate-600 sm:px-8">
        <div className="flex items-center gap-5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/senati-logo.svg" alt="SENATI" width={120} height={34} className="h-8 w-auto" />
          <span className="hidden border-l border-slate-200 pl-5 text-sm sm:block">{title}</span>
        </div>
        <button onClick={openFullscreen} className="flex min-h-10 items-center gap-2 text-xs text-blue-700 sm:text-sm" aria-label="Alternar pantalla completa"><Maximize className="h-5 w-5" /><span className="hidden sm:inline">Pantalla completa</span></button>
      </header>

      <div className="grid flex-1 min-h-0 lg:grid-cols-[minmax(0,1fr)_clamp(280px,24vw,420px)]">
        <section aria-label="Fotografías del evento" className="event-hero relative min-h-[55vh] overflow-hidden lg:min-h-0">
          {isEmpty || !current ? (
            <div className="flex h-full min-h-[55vh] flex-col justify-center px-7 py-12 sm:px-14">
              <span className="mb-5 h-px w-10 bg-white" />
              <p className="text-lg uppercase tracking-wide text-white sm:text-2xl">Bienvenidos a SENATI</p>
              <h1 className="mt-3 max-w-4xl text-4xl uppercase leading-tight text-[#39c9ef] sm:text-5xl xl:text-6xl">{title}</h1>
              <p className="mt-7 max-w-xl text-lg leading-relaxed text-slate-200">Los mejores momentos se viven juntos.<br />Escanea el QR, inicia sesión y comparte tus fotografías.</p>
              <p className="mt-10 flex items-center gap-3 border-t border-white/25 pt-6 text-sm text-slate-300"><Camera className="h-5 w-5" /> Tus fotografías aparecerán en esta pantalla.</p>
            </div>
          ) : <Slide key={current.id} post={current} />}
          <div className="pointer-events-none absolute left-5 top-5 z-10 max-w-[70%] space-y-2 sm:w-80">
            {floating.map((f) => <div key={f.id} className="animate-floatUp bg-black/75 px-4 py-3 text-sm text-white sm:text-lg"><b>{f.author}:</b> {f.text}</div>)}
          </div>
        </section>

        <aside className="flex flex-col justify-center border-l border-white/10 bg-[#071528] px-7 py-8 text-white xl:px-10">
          <p className="text-sm uppercase tracking-[0.15em] text-[#39c9ef]">Sé parte del evento</p>
          <h2 className="mt-3 text-2xl leading-tight xl:text-3xl">Escanea y comparte</h2>
          <div className="mx-auto my-6 w-full max-w-[300px] bg-white p-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {qr ? <img src={qr} alt="Escanea para iniciar sesión y participar en el evento" width={400} height={400} className="aspect-square w-full" /> : <div className="grid aspect-square place-items-center text-sm text-slate-500">Preparando QR…</div>}
          </div>
          <ol className="space-y-4 text-sm text-slate-200 xl:text-base">
            <li className="flex gap-3"><span className="text-[#39c9ef]">01</span> Escanea con la cámara de tu celular.</li>
            <li className="flex gap-3"><span className="text-[#39c9ef]">02</span> Inicia sesión con tu cuenta de Google.</li>
            <li className="flex gap-3"><span className="text-[#39c9ef]">03</span> Comparte tus fotos en el evento.</li>
          </ol>
          <Link href={EVENT_LOGIN_PATH} className="btn btn-primary mt-7 w-full gap-2"><LogIn className="h-4 w-4" /> Iniciar sesión</Link>
          <p className="mt-3 text-center text-xs text-slate-400">También puedes ingresar desde este dispositivo.</p>
          {screenMessage && <p role="status" className="mt-4 text-sm text-amber-200">{screenMessage}</p>}
        </aside>
      </div>
      <footer className="flex flex-wrap items-center justify-between gap-2 border-t border-white/15 bg-[#04101f] px-5 py-3 text-xs text-slate-300 sm:px-8 sm:text-sm">
        <p>Ingeniería de Software con Inteligencia Artificial · SENATI</p>
        <p role="status">{online ? "Álbum del evento" : "Sin conexión · mostrando contenido guardado"}</p>
      </footer>
    </main>
  );
}

function Slide({ post }: { post: PublicPost }) {
  const n = post.images.length;
  const layout =
    n === 1 ? "grid-cols-1" : n === 2 ? "grid-cols-2" : n === 3 ? "grid-cols-3 grid-rows-2" : n === 4 ? "grid-cols-2 grid-rows-2" : "grid-cols-3 grid-rows-2";
  return (
    <div className="animate-fadeIn absolute inset-0 flex flex-col p-4 sm:p-7">
      <div className={`grid min-h-0 flex-1 gap-3 ${layout}`}>
        {post.images.map((img, i) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={img.id}
            src={cldUrl(img.publicId, "tv")}
            alt={`Fotografía de ${post.author.publicName}`}
            className={`min-h-0 h-full w-full object-contain bg-black/30 ${n === 3 && i === 0 ? "row-span-2" : ""} ${n === 5 && i === 0 ? "col-span-2" : ""}`}
            style={{ animation: `fadeIn .8s ${i * 0.15}s both` }}
          />
        ))}
      </div>
      <div className="mt-4 flex items-end justify-between gap-4 text-white">
        <div>
          <p className="text-xl font-medium sm:text-3xl">{post.author.publicName}</p>
          {post.message && <p className="mt-1 line-clamp-2 max-w-4xl break-words text-sm text-slate-200 sm:text-xl">{post.message}</p>}
        </div>
        <p className="shrink-0 text-xl text-[#39c9ef] sm:text-3xl">♥ {post.likeCount}</p>
      </div>
    </div>
  );
}
