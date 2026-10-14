"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import { get, set } from "idb-keyval";
import { cldUrl } from "@/lib/cloudinary/urls";
import { useRealtime } from "@/lib/realtime/client";
import type { PublicPost } from "@/lib/posts";

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

  const postsRef = useRef<PublicPost[]>([]);
  const queue = useRef<string[]>([]); // FIFO de ids NUEVOS (post.created)
  const queued = useRef(new Set<string>()); // evita encolar dos veces
  const shown = useRef(new Set<string>());
  const archiveIdx = useRef(0);
  const lastSync = useRef(new Date(0).toISOString());
  postsRef.current = posts;

  useEffect(() => {
    QRCode.toDataURL(`${appUrl}/evento`, { margin: 2, width: 400, errorCorrectionLevel: "M" }).then(setQr);
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
    get<PublicPost[]>(CACHE_KEY).then((c) => c && setPosts(c));
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
      setCurrent((c) => (c?.id === d.postId ? { ...c, likeCount: d.likeCount } : c));
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

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-gradient-to-br from-senati-900 via-senati-800 to-senati-600 text-white">
      {isEmpty || !current ? (
        <div className="grid h-full place-items-center text-center">
          <div>
            <h1 className="text-8xl font-black tracking-widest">SENATI</h1>
            <p className="mt-4 text-4xl opacity-90">{title}</p>
            <p className="mt-10 text-3xl">¡Bienvenido! Escanea el QR y comparte tus fotografías.</p>
          </div>
        </div>
      ) : (
        <Slide key={current.id} post={current} />
      )}

      {/* QR permanente (esquina inferior derecha) */}
      <div className="absolute bottom-6 right-6 z-20 rounded-2xl bg-white p-3 text-center text-senati-800 shadow-2xl">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {qr && <img src={qr} alt="QR del muro" className="h-44 w-44" />}
        <p className="text-sm font-bold">Comparte tus fotos</p>
      </div>

      {/* Banner discreto de la carrera (esquina inferior izquierda) */}
      <div className="absolute bottom-6 left-6 z-20 rounded-full bg-white/15 px-6 py-2 text-lg backdrop-blur">
        Ingeniería de Software con IA · SENATI
      </div>

      {/* Comentarios flotantes: columna izquierda alta, lejos del QR y de la zona central de rostros */}
      <div className="pointer-events-none absolute left-6 top-24 z-10 w-80 space-y-2">
        {floating.map((f) => (
          <div key={f.id} className="animate-floatUp rounded-2xl bg-black/50 px-4 py-2 text-lg backdrop-blur">
            <b>{f.author}:</b> {f.text}
          </div>
        ))}
      </div>

      {!online && <div className="absolute right-6 top-6 z-30 rounded-full bg-amber-500 px-4 py-1 text-sm font-semibold text-black">Sin conexión · mostrando contenido guardado</div>}
    </div>
  );
}

function Slide({ post }: { post: PublicPost }) {
  const n = post.images.length;
  const layout =
    n === 1 ? "grid-cols-1" : n === 2 ? "grid-cols-2" : n === 3 ? "grid-cols-3 grid-rows-2" : n === 4 ? "grid-cols-2 grid-rows-2" : "grid-cols-3 grid-rows-2";
  return (
    <div className="animate-fadeIn absolute inset-0 flex flex-col p-10 pb-52">
      <div className={`grid min-h-0 flex-1 gap-3 ${layout}`}>
        {post.images.map((img, i) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={img.id}
            src={cldUrl(img.publicId, "tv")}
            alt=""
            className={`h-full w-full rounded-2xl object-cover shadow-2xl ${n === 3 && i === 0 ? "row-span-2" : ""} ${n === 5 && i === 0 ? "col-span-2" : ""}`}
            style={{ animation: `fadeIn .8s ${i * 0.15}s both` }}
          />
        ))}
      </div>
      <div className="mt-5 flex items-end justify-between">
        <div>
          <p className="text-4xl font-bold">{post.author.publicName}</p>
          {post.message && <p className="mt-1 max-w-4xl text-2xl opacity-90">{post.message}</p>}
        </div>
        <p className="mr-72 text-4xl">♥ {post.likeCount}</p>
      </div>
    </div>
  );
}
