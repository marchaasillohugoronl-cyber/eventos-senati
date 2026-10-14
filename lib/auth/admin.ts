import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import { prisma } from "@/lib/database/prisma";
import { HttpError } from "@/lib/auth/session";

export const ADMIN_COOKIE = "senati_admin";

function secret() {
  const s = process.env.ADMIN_SESSION_SECRET;
  if (!s || s.length < 32) throw new Error("ADMIN_SESSION_SECRET debe tener al menos 32 caracteres");
  return new TextEncoder().encode(s);
}

export async function createAdminSession(adminId: string) {
  const token = await new SignJWT({ sub: adminId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("12h")
    .sign(secret());
  cookies().set(ADMIN_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 60 * 60 * 12,
  });
}

export async function clearAdminSession() {
  cookies().delete(ADMIN_COOKIE);
}

export async function getCurrentAdmin() {
  const token = cookies().get(ADMIN_COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    if (!payload.sub) return null;
    return prisma.admin.findUnique({ where: { id: payload.sub } });
  } catch {
    return null;
  }
}

/** role "OWNER" para acciones sensibles (colaboradores, datos de interesados, exportaciones). */
export async function requireAdmin(role?: "OWNER") {
  const admin = await getCurrentAdmin();
  if (!admin) throw new HttpError(401, "No autenticado.");
  if (role === "OWNER" && admin.role !== "OWNER") throw new HttpError(403, "Permiso insuficiente.");
  return admin;
}

export async function audit(adminId: string, action: string, target?: string, meta?: object) {
  await prisma.auditLog.create({ data: { adminId, action, target, meta } });
}
