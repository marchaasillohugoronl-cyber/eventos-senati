"use client";

import { useState } from "react";
import { Heart, MessageCircle, Download, Flag } from "lucide-react";
import { cldUrl } from "@/lib/cloudinary/urls";
import type { PublicPost } from "@/lib/posts";

type Comment = { id: string; content: string; createdAt: string; authorName: string };

export function PostCard({ post, readOnly, onLike }: { post: PublicPost; readOnly: boolean; onLike: (id: string) => void }) {
  const [open, setOpen] = useState(false);
  const [comments, setComments] = useState<Comment[] | null>(null);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);

  async function toggleComments() {
    setOpen((o) => !o);
    if (!comments) {
      const r = await fetch(`/api/posts/${post.id}/comments`);
      if (r.ok) setComments((await r.json()).comments);
    }
  }

  async function sendComment(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    setBusy(true);
    const r = await fetch(`/api/posts/${post.id}/comments`, { method: "POST", body: JSON.stringify({ content: text }) });
    setBusy(false);
    if (r.ok) {
      const { comment } = await r.json();
      setComments((c) => (c?.some((x) => x.id === comment.id) ? c : [...(c ?? []), comment]));
      setText("");
    }
  }

  async function report() {
    const reason = prompt("¿Por qué reportas esta publicación?");
    if (!reason || reason.length < 5) return;
    await fetch("/api/reports", { method: "POST", body: JSON.stringify({ postId: post.id, reason }) });
    alert("Gracias, revisaremos tu reporte.");
  }

  const cols = post.images.length === 1 ? "grid-cols-1" : "grid-cols-2";

  return (
    <article className="card animate-fadeIn overflow-hidden">
      <div className="flex items-center gap-3 p-4">
        {post.author.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={post.author.avatarUrl} alt="" className="h-10 w-10 rounded-full" referrerPolicy="no-referrer" />
        ) : (
          <div className="grid h-10 w-10 place-items-center rounded-full bg-senati-100 font-bold text-senati-700">{post.author.publicName[0]}</div>
        )}
        <div>
          <p className="text-sm font-semibold">{post.author.publicName}</p>
          <p className="text-xs text-slate-500">
            {new Date(post.createdAt).toLocaleString("es-PE", { dateStyle: "medium", timeStyle: "short" })}
            {post.editedAt && " · editada"}
          </p>
        </div>
        <button onClick={report} aria-label="Reportar" className="ml-auto rounded-full p-2 text-slate-400 hover:bg-slate-100">
          <Flag className="h-4 w-4" />
        </button>
      </div>

      {post.message && <p className="px-4 pb-3 text-sm">{post.message}</p>}

      <div className={`grid gap-0.5 ${cols}`}>
        {post.images.map((img, i) => (
          <a key={img.id} href={`/api/photos/${img.id}/download`} className={`relative block ${post.images.length === 3 && i === 0 ? "col-span-2" : ""}`} aria-label="Descargar original">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={cldUrl(img.publicId, "mobile")} alt={`Fotografía de ${post.author.publicName}`} loading="lazy" className="aspect-square w-full object-cover" />
            <Download className="absolute bottom-2 right-2 h-7 w-7 rounded-full bg-black/50 p-1.5 text-white" />
          </a>
        ))}
      </div>

      <div className="flex items-center gap-5 px-4 py-3 text-sm">
        <button disabled={readOnly} onClick={() => onLike(post.id)} className={`flex items-center gap-1.5 ${post.likedByMe ? "text-rose-600" : "text-slate-600"} disabled:opacity-50`}>
          <Heart className={`h-5 w-5 ${post.likedByMe ? "fill-current" : ""}`} /> {post.likeCount}
        </button>
        <button onClick={toggleComments} className="flex items-center gap-1.5 text-slate-600">
          <MessageCircle className="h-5 w-5" /> {post.commentCount}
        </button>
      </div>

      {open && (
        <div className="border-t border-slate-100 px-4 py-3">
          <ul className="space-y-2 text-sm">
            {(comments ?? []).map((c) => (
              <li key={c.id}>
                <span className="font-semibold">{c.authorName}</span> {c.content}
              </li>
            ))}
          </ul>
          {!readOnly && (
            <form onSubmit={sendComment} className="mt-3 flex gap-2">
              <input className="input" maxLength={300} value={text} onChange={(e) => setText(e.target.value)} placeholder="Escribe un comentario…" />
              <button disabled={busy} className="btn btn-primary">Enviar</button>
            </form>
          )}
        </div>
      )}
    </article>
  );
}
