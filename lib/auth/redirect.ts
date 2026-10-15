/** Solo permite volver a rutas internas de la aplicación. */
export function safeReturnPath(value?: string) {
  if (!value || !value.startsWith("/") || value.startsWith("//") || /[\\\u0000-\u0020]/.test(value)) return "/evento";
  try {
    const url = new URL(value, "https://eventshare.local");
    if (url.origin !== "https://eventshare.local" || url.pathname.startsWith("/api/") || url.pathname === "/login") return "/evento";
    return url.pathname + url.search + url.hash;
  } catch { return "/evento"; }
}
