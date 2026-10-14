"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { infoRequestSchema, CONSENT_TEXT } from "@/lib/validations";

type Values = z.infer<typeof infoRequestSchema>;

export function InfoRequestForm() {
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<Values>({
    resolver: zodResolver(infoRequestSchema),
    defaultValues: { name: "", email: "", whatsapp: "", consent: false }, // consentimiento NO premarcado
  });

  async function onSubmit(values: Values) {
    setError(null);
    const r = await fetch("/api/information-requests", { method: "POST", body: JSON.stringify(values) });
    if (r.ok) setDone(true);
    else setError((await r.json()).error ?? "No se pudo enviar.");
  }

  if (done) return <p className="card p-5 text-center text-senati-700">¡Gracias! Hemos registrado tu solicitud.</p>;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="card space-y-3 p-5" id="solicitar">
      <h2 className="font-bold text-senati-800">Solicitar información</h2>
      <div>
        <input className="input" placeholder="Nombre" {...register("name")} />
        {errors.name && <p className="text-xs text-rose-600">{errors.name.message}</p>}
      </div>
      <div>
        <input className="input" type="email" placeholder="Correo electrónico" {...register("email")} />
        {errors.email && <p className="text-xs text-rose-600">{errors.email.message}</p>}
      </div>
      <div>
        <input className="input" placeholder="WhatsApp (opcional)" {...register("whatsapp")} />
        {errors.whatsapp && <p className="text-xs text-rose-600">{errors.whatsapp.message}</p>}
      </div>
      <input className="input bg-slate-50" value="Ingeniería de Software con Inteligencia Artificial" readOnly aria-label="Carrera de interés" />
      <label className="flex items-start gap-2 text-xs text-slate-600">
        <input type="checkbox" className="mt-0.5" {...register("consent")} />
        <span>{CONSENT_TEXT} (opcional)</span>
      </label>
      {error && <p role="alert" className="text-sm text-rose-600">{error}</p>}
      <button className="btn btn-primary w-full" disabled={isSubmitting}>Enviar solicitud</button>
    </form>
  );
}
