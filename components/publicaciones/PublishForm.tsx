"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { get, set, del } from "idb-keyval";
import { Camera, ImagePlus, X, Loader2 } from "lucide-react";
import { ALLOWED_MIME, MAX_FILE_BYTES, MAX_IMAGES } from "@/lib/validations";

function PhotoPreview({ file, index }: { file: File; index: number }) {
  const [src, setSrc] = useState("");
  useEffect(() => {
    const url = URL.createObjectURL(file);
    setSrc(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);
  // eslint-disable-next-line @next/next/no-img-element
  return src ? <img src={src} alt={`Vista previa ${index + 1}`} className="h-full w-full object-cover" /> : null;
}

const DRAFT_KEY = "senati-draft";

type Draft = { files: File[]; message: string };

/**
 * Estrategia de borrador: los File se guardan en IndexedDB (soporta Blobs) en el propio
 * dispositivo antes de redirigir a Google; al volver se restauran para que el visitante revise antes de publicar.
 * No sale nada del dispositivo hasta que el usuario está autenticado.
 */
export function PublishForm({ isAuthed, resume }: { isAuthed: boolean; resume: boolean }) {
  const router = useRouter();
  const [files, setFiles] = useState<File[]>([]);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);
  const publishing = useRef(false);
  const [progress, setProgress] = useState("");
  const [restored, setRestored] = useState(false);

  useEffect(() => {
    (async () => {
      const draft = await get<Draft>(DRAFT_KEY);
      if (!draft) return;
      setFiles(draft.files);
      setMessage(draft.message);
      setRestored(true);
    })().catch(() => setError("No pudimos recuperar el borrador de este dispositivo. Puedes seleccionar tus fotos nuevamente."));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function addFiles(list: FileList | null) {
    if (!list) return;
    setError(null);
    const next = [...files];
    const issues = new Set<string>();
    for (const f of Array.from(list)) {
      if (!ALLOWED_MIME.includes(f.type)) { issues.add("Usa JPG, PNG, WebP o HEIC."); continue; }
      if (f.size > MAX_FILE_BYTES) { issues.add("Cada fotografía debe pesar menos de 15 MB."); continue; }
      if (next.some(existing => existing.name === f.name && existing.size === f.size && existing.lastModified === f.lastModified)) continue;
      if (next.length >= MAX_IMAGES) { issues.add(`Puedes seleccionar hasta ${MAX_IMAGES} fotografías.`); continue; }
      next.push(f);
    }
    if (issues.size) setError([...issues].join(" "));

    setFiles(next);
  }

  async function onPublish() {
    if (publishing.current || busy) return;
    if (!files.length) return setError("Agrega al menos una fotografía.");
    if (!isAuthed) {
      setBusy(true);
      setError(null);
      try {
        await set(DRAFT_KEY, { files, message } satisfies Draft);
        await signIn("google", { callbackUrl: "/evento/publicar?resume=1" });
      } catch {
        setError("No se pudo iniciar sesión o guardar el borrador. Tus fotos siguen aquí; inténtalo otra vez.");
        setBusy(false);
      }
      return;
    }
    await publish(files, message);
  }

  async function publish(toUpload: File[], msg: string) {
    if (publishing.current) return;
    publishing.current = true;
    setBusy(true);
    setError(null);
    try {
      const publicIds: string[] = [];
      for (const [index, file] of toUpload.entries()) {
        setProgress(`Subiendo foto ${index + 1} de ${toUpload.length}…`);
        const sigRes = await fetch("/api/uploads/sign", { method: "POST" });
        if (!sigRes.ok) throw new Error((await sigRes.json()).error ?? "No se pudo autorizar la subida.");
        const s = await sigRes.json();
        const fd = new FormData();
        fd.append("file", file);
        fd.append("api_key", s.apiKey);
        fd.append("timestamp", String(s.timestamp));
        fd.append("signature", s.signature);
        fd.append("folder", s.folder);
        fd.append("allowed_formats", s.allowed_formats);
        const up = await fetch(`https://api.cloudinary.com/v1_1/${s.cloudName}/image/upload`, { method: "POST", body: fd });
        if (!up.ok) throw new Error("Falló la subida de una fotografía.");
        publicIds.push((await up.json()).public_id);
      }
      setProgress("Guardando tu publicación…");
      const res = await fetch("/api/posts", {
        method: "POST",
        body: JSON.stringify({ message: msg, images: publicIds.map((publicId) => ({ publicId })) }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "No se pudo publicar.");
      await del(DRAFT_KEY).catch(() => undefined);
      router.replace("/evento");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo publicar. Inténtalo nuevamente.");
      setBusy(false);
    } finally {
      publishing.current = false;
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-5 px-4 py-8 sm:px-6">
      <div className="pb-3"><p className="text-[11px] font-bold uppercase tracking-[0.2em] text-senati-600">Tu momento en el álbum</p><h1 className="mt-3 text-3xl font-bold tracking-tight">Algo bueno merece compartirse.</h1><p className="mt-3 text-sm leading-6 text-slate-500">Elige hasta cinco fotos y cuenta la historia detrás de ellas.</p></div>
      <div className="space-y-5 rounded-3xl border border-slate-200 bg-white p-5 sm:p-8">
      {restored && <p role="status" className="rounded-xl bg-senati-50 p-4 text-sm text-senati-800">{resume ? "Ya puedes continuar. " : ""}Recuperamos tu borrador. Revisa tus fotos antes de publicar.</p>}
      {!files.length && <div className="flex flex-col items-center rounded-2xl border-2 border-dashed border-blue-200 bg-senati-50/50 px-5 py-12 text-center"><span className="mb-4 rounded-2xl bg-white p-4 shadow-sm"><ImagePlus className="h-8 w-8 text-senati-500" /></span><p className="font-semibold">Empieza con una fotografía</p><p className="mt-2 max-w-xs text-sm leading-6 text-slate-500">Abre tu cámara o elige tus mejores momentos de la galería.</p></div>}
      <div className="grid grid-cols-3 gap-2">
        {files.map((f, i) => (
          <div key={i} className="relative aspect-square overflow-hidden rounded-xl">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <PhotoPreview file={f} index={i} />
            <button disabled={busy} aria-label={`Quitar fotografía ${i + 1}`} onClick={() => setFiles(files.filter((_, j) => j !== i))} className="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white">
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <button type="button" className="btn btn-ghost flex-1" onClick={() => cameraRef.current?.click()} disabled={busy || files.length >= MAX_IMAGES}>
          <Camera className="h-4 w-4" /> Tomar foto
        </button>
        <button type="button" className="btn btn-ghost flex-1" onClick={() => galleryRef.current?.click()} disabled={busy || files.length >= MAX_IMAGES}>
          <ImagePlus className="h-4 w-4" /> Galería
        </button>
      </div>
      <input ref={cameraRef} type="file" accept="image/*" capture="environment" hidden onChange={(e) => { addFiles(e.target.files); e.target.value = ""; }} />
      <input ref={galleryRef} type="file" accept={ALLOWED_MIME.join(",")} multiple hidden onChange={(e) => { addFiles(e.target.files); e.target.value = ""; }} />

      <label htmlFor="post-message" className="block text-sm font-semibold">Tu mensaje <span className="font-normal text-slate-400">(opcional)</span></label>
      <textarea id="post-message" disabled={busy} className="input min-h-32 resize-y bg-slate-50" maxLength={500} value={message} onChange={(e) => setMessage(e.target.value)} placeholder="¿Qué hizo especial este momento?" />
      <p className="text-right text-xs text-slate-400">{message.length}/500 caracteres</p>
      <p className="text-xs text-slate-500">{files.length}/{MAX_IMAGES} fotografías · Al publicar aceptas que se muestren en el muro y en la pantalla del evento.</p>

      {error && <p role="alert" className="rounded-xl bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}

      <button className="btn btn-primary w-full py-3" onClick={onPublish} disabled={busy || !files.length}>
        {busy ? <><Loader2 className="h-4 w-4 animate-spin" /> {progress || "Conectando…"}</> : isAuthed ? "Publicar fotografías" : "Continuar con Google para publicar"}
      </button>
      </div>
    </div>
  );
}
