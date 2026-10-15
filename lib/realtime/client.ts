"use client";

import { useEffect, useRef } from "react";
import * as Ably from "ably";

export type RealtimeMessage = { name: string; data: Record<string, any> };

/**
 * Se suscribe al canal del evento con deduplicación por eventId.
 * onReconnect se invoca al recuperar la conexión para que la vista re-sincronice (recupera eventos perdidos).
 */
export function useRealtime(onMessage: (m: RealtimeMessage) => void, onReconnect?: () => void) {
  const handler = useRef(onMessage);
  const reconnect = useRef(onReconnect);
  handler.current = onMessage;
  reconnect.current = onReconnect;

  useEffect(() => {
    let disposed = false;
    let disconnect: (() => void) | undefined;
    async function connect() {
    const available = await fetch("/api/realtime/token");
    if (!available.ok || disposed) return;
    const seen = new Set<string>();
    const client = new Ably.Realtime({ authUrl: "/api/realtime/token", autoConnect: true });
    const channel = client.channels.get("senati-evento");
    let wasDisconnected = false;

    channel.subscribe((msg) => {
      const id = msg.data?.eventId as string | undefined;
      if (id) {
        if (seen.has(id)) return;
        seen.add(id);
        if (seen.size > 500) seen.delete(seen.values().next().value as string);
      }
      handler.current({ name: msg.name ?? "", data: msg.data ?? {} });
    });

    client.connection.on((change) => {
      if (change.current === "disconnected" || change.current === "suspended") wasDisconnected = true;
      if (change.current === "connected" && wasDisconnected) {
        wasDisconnected = false;
        reconnect.current?.();
      }
    });

    disconnect = () => {
      channel.unsubscribe();
      client.close();
    };
    }
    void connect().catch(() => { /* La vista permite actualizar sin tiempo real. */ });
    return () => { disposed = true; disconnect?.(); };
  }, []);
}
