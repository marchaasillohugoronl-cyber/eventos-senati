"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Camera, GraduationCap } from "lucide-react";
import { PostCard } from "./PostCard";
import { useRealtime } from "@/lib/realtime/client";
import type { PublicPost } from "@/lib/posts";

type Status = "SCHEDULED" | "ACTIVE" | "FINISHED";

export function Feed() {
  const [posts, setPosts] = useState<PublicPost[]>([]);
  const [status, setStatus] = useState<Status>("SCHEDULED");
  const [cursor, setCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const lastSync = useRef<string>(new Date(0).toISOString());

  const load = useCallback(async (after?: string | null) => {
    const r = await fetch(`/api/posts?limit=20${after ? `&cursor=${after}` : ""}`);
    if (!r.ok) return;
    const data = await r.json();
    setStatus(data.status);
    setPosts((prev) => (after ? [...prev, ...data.posts] : data.posts));
    setCursor(data.nextCursor);
    lastSync.current = new Date().toISOString();
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Tras una desconexión se pide lo creado/modificado desde la última sincronización.
  const resync = useCallback(async () => {
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
  }, []);

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
    setPosts((p) => p.map((x) => (x.id === id ? { ...x, likedByMe: !x.likedByMe, likeCount: x.likeCount + (x.likedByMe ? -1 : 1) } : x)));
    const r = await fetch(`/api/posts/${id}/like`, { method: "POST" });
    if (r.ok) {
      const { liked, likeCount } = await r.json();
      setPosts((p) => p.map((x) => (x.id === id ? { ...x, likedByMe: liked, likeCount } : x)));
    } else load();
  }

  const readOnly = status !== "ACTIVE";

  return (
    <div className="mx-auto max-w-2xl space-y-4 px-4 pb-28 pt-4">
      {status === "SCHEDULED" && <p className="card p-4 text-center text-sm">El evento aún no ha comenzado. ¡Pronto podrás compartir tus fotografías!</p>}
      {status === "FINISHED" && <p className="card p-4 text-center text-sm">El evento finalizó. Este muro es ahora un álbum para ver y descargar fotografías.</p>}

      {posts.map((p, i) => (
        <div key={p.id} className="space-y-4">
          <PostCard post={p} readOnly={readOnly} onLike={like} />
          {i === 2 && (
            <Link href="/ingenieria-software-ia" className="card flex items-center gap-3 bg-gradient-to-r from-senati-700 to-senati-500 p-4 text-white">
              <GraduationCap className="h-8 w-8 shrink-0" />
              <div className="text-sm">
                <p className="font-bold">Ingeniería de Software con IA</p>
                <p className="opacity-90">Conoce la carrera y solicita información →</p>
              </div>
            </Link>
          )}
        </div>
      ))}

      {!loading && posts.length === 0 && <p className="py-16 text-center text-slate-500">Aún no hay fotografías. ¡Sé el primero en publicar!</p>}
      {cursor && <button className="btn btn-ghost w-full" onClick={() => load(cursor)}>Cargar más</button>}

      {status === "ACTIVE" && (
        <Link href="/evento/publicar" className="btn btn-primary fixed bottom-5 left-1/2 z-30 -translate-x-1/2 px-7 py-3.5 text-base shadow-xl">
          <Camera className="h-5 w-5" /> Publicar fotografías
        </Link>
      )}
    </div>
  );
}
