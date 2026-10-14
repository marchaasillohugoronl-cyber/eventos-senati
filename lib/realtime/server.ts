import Ably from "ably";
import { randomUUID } from "crypto";

export const CHANNEL = "senati-evento";

export type RealtimeEventName =
  | "post.created"
  | "post.updated"
  | "post.hidden"
  | "comment.created"
  | "comment.removed"
  | "like.updated"
  | "event.status.changed";

let rest: Ably.Rest | null = null;
function client() {
  if (!process.env.ABLY_API_KEY) return null;
  return (rest ??= new Ably.Rest(process.env.ABLY_API_KEY));
}

/**
 * Publica un evento. Cada evento lleva un eventId único para que los clientes
 * puedan deduplicar. Si Ably no está configurado, no rompe la operación principal.
 */
export async function publish(name: RealtimeEventName, data: Record<string, unknown>) {
  const c = client();
  if (!c) return;
  try {
    await c.channels.get(CHANNEL).publish(name, { ...data, eventId: randomUUID(), at: Date.now() });
  } catch (e) {
    console.error("Realtime publish falló", e);
  }
}

export async function createTokenRequest() {
  const c = client();
  if (!c) return null;
  return c.auth.createTokenRequest({ capability: { [CHANNEL]: ["subscribe"] }, ttl: 60 * 60 * 1000 });
}
