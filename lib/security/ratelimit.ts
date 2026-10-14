import { HttpError } from "@/lib/auth/session";

/**
 * Limitador en memoria (ventana fija). Suficiente como base, pero en Vercel cada
 * instancia serverless tiene su propia memoria: para producción real migrar a
 * Upstash Redis (@upstash/ratelimit) o similar.
 */
const buckets = new Map<string, { count: number; reset: number }>();

export function rateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  const b = buckets.get(key);
  if (!b || b.reset < now) {
    buckets.set(key, { count: 1, reset: now + windowMs });
    return;
  }
  b.count += 1;
  if (b.count > limit) throw new HttpError(429, "Demasiadas solicitudes. Inténtalo en un momento.");
}
