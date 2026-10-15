"use client";
import { useFormStatus } from "react-dom";
import { Loader2 } from "lucide-react";

export function SubmitButton({ children }: { children: React.ReactNode }) {
  const { pending } = useFormStatus();
  return <button type="submit" className="btn btn-primary w-full py-3.5" disabled={pending}>
    {pending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
    {pending ? "Conectando…" : children}
  </button>;
}
