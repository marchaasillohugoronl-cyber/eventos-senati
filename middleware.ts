import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";

/**
 * Primera barrera para /admin (redirección). La autorización real y por rol
 * se vuelve a comprobar en cada API/página mediante requireAdmin().
 */
export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (pathname === "/admin/login") return NextResponse.next();

  const token = req.cookies.get("senati_admin")?.value;
  const secret = process.env.ADMIN_SESSION_SECRET;
  let ok = false;
  if (token && secret) {
    try {
      await jwtVerify(token, new TextEncoder().encode(secret));
      ok = true;
    } catch {
      ok = false;
    }
  }
  if (!ok) return NextResponse.redirect(new URL("/admin/login", req.url));
  return NextResponse.next();
}

export const config = { matcher: ["/admin/:path*"] };
