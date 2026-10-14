"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { get, set, del } from "idb-keyval";
import { Camera, ImagePlus, X, Loader2 } from "lucide-react";
import { ALLOWED_MIME, MAX_FILE_BYTES, MAX_IMAGES } from "@/lib/validations";

const DRAFT_KEY = "senati-draft";

type Draft = { files: File[]; message: string };

/**
 * Estrategia de borrador: los File se guardan en IndexedDB (soporta Blobs) en el propio
 * dispositivo antes de redirigir a Google; al volver se restauran y, con ?resume=1, se publica solo.
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
  const resumed = useRef(false);

  useEffect(() => {
    (async () => {
      const draft = await get<Draft>(DRAFT_KEY);
      if (!draft) return;
      setFiles(draft.files);
      setMessage(draft.message);
      if (isAuthed && resume && !resumed.current && draft.files.length) {
        resumed.current = true;
        await publish(draft.files, draft.message);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function addFiles(list: FileList | null) {
    if (!list) return;
    setError(null);
    const next = [...files];
    for (const f of Array.from(list)) {
      if (!ALLOWED_MIME.includes(f.type)) return setError("Formato no permitido. Usa JPG, PNG, WebP o HEIC.");
      if (f.size > MAX_FILE_BYTES) return setError("Cada fotografía debe pesar menos de 15 MB.");
      if (next.length >= MAX_IMAGES) return setError(`Máximo ${MAX_IMAGES} fotografías.`);
      next.push(f);
    }
    setFiles(next);
  }

  async function onPublish() {
    if (!files.length) return setError("Agrega al menos una fotografía.");
    if (!isAuthed) {
      await set(DRAFT_KEY, { files, message } satisfies Draft);
      await signIn("google", { callbackUrl: "/evento/publicar?resume=1" });
      return;
    }
    await publish(files, message);
  }

  async function publish(toUpload: File[], msg: string) {
    setBusy(true);
    setError(null);
    try {
      const publicIds: string[] = [];
      for (const file of toUpload) {
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
      const res = await fetch("/api/posts", {
        method: "POST",
        body: JSON.stringify({ message: msg, images: publicIds.map((publicId) => ({ publicId })) }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "No se pudo publicar.");
      await del(DRAFT_KEY);
      router.push("/evento");
    } catch (e: any) {
      setError(e.message ?? "Error inesperado.");
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4 p-4">
      <div className="grid grid-cols-3 gap-2">
        {files.map((f, i) => (
          <div key={i} className="relative aspect-square overflow-hidden rounded-xl">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={URL.createObjectURL(f)} alt={`Vista previa ${i + 1}`} className="h-full w-full object-cover" />
            <button aria-label="Quitar" onClick={() => setFiles(files.filter((_, j) => j !== i))} className="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white">
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <button type="button" className="btn btn-ghost flex-1" onClick={() => cameraRef.current?.click()} disabled={files.length >= MAX_IMAGES}>
          <Camera className="h-4 w-4" /> Tomar foto
        </button>
        <button type="button" className="btn btn-ghost flex-1" onClick={() => galleryRef.current?.click()} disabled={files.length >= MAX_IMAGES}>
          <ImagePlus className="h-4 w-4" /> Galería
        </button>
      </div>
      <input ref={cameraRef} type="file" accept="image/*" capture="environment" hidden onChange={(e) => { addFiles(e.target.files); e.target.value = ""; }} />
      <input ref={galleryRef} type="file" accept={ALLOWED_MIME.join(",")} multiple hidden onChange={(e) => { addFiles(e.target.files); e.target.value = ""; }} />

      <textarea className="input min-h-24" maxLength={500} value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Escribe un mensaje (opcional)" />
      <p className="text-xs text-slate-500">{files.length}/{MAX_IMAGES} fotografías · Al publicar aceptas que se muestren en el muro y en la pantalla del evento.</p>

      {error && <p role="alert" className="rounded-xl bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}

      <button className="btn btn-primary w-full py-3" onClick={onPublish} disabled={busy}>
        {busy ? <><Loader2 className="h-4 w-4 animate-spin" /> Publicando…</> : "Publicar"}
      </button>
    </div>
  );
}
