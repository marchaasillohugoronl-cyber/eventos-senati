export const EVENT_LOGIN_PATH = "/login?callbackUrl=%2Fevento";

// Un QR escaneado desde un teléfono no puede apuntar al localhost de la TV.
export function eventLoginUrl(appUrl: string) {
  const fallback = "https://eventshare-senati.vercel.app";
  try {
    const url = new URL(appUrl);
    if (!["http:", "https:"].includes(url.protocol) || ["localhost", "127.0.0.1", "[::1]", "0.0.0.0"].includes(url.hostname)) {
      return `${fallback}${EVENT_LOGIN_PATH}`;
    }
    return `${url.origin}${EVENT_LOGIN_PATH}`;
  } catch {
    return `${fallback}${EVENT_LOGIN_PATH}`;
  }
}
