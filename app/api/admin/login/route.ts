import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { handle, clientIp } from "@/lib/api";
import { HttpError } from "@/lib/auth/session";
import { prisma } from "@/lib/database/prisma";
import { adminLoginSchema } from "@/lib/validations";
import { createAdminSession, clearAdminSession, audit } from "@/lib/auth/admin";
import { rateLimit } from "@/lib/security/ratelimit";

// Hash ficticio para igualar tiempos de respuesta cuando el correo no existe.
const DUMMY_HASH = "$2a$12$C6UzMDM.H6dfI/f/IKcEeO5Xxk7Zf2g0y0o0Y0y0y0y0y0y0y0y0y";

export async function POST(req: NextRequest) {
  return handle(async () => {
    rateLimit(`admin-login:${clientIp(req)}`, 8, 15 * 60_000);
    const { email, password } = adminLoginSchema.parse(await req.json());
    const admin = await prisma.admin.findUnique({ where: { email: email.toLowerCase() } });
    const ok = await bcrypt.compare(password, admin?.passwordHash ?? DUMMY_HASH);
    if (!admin || !ok) throw new HttpError(401, "Credenciales incorrectas.");
    await createAdminSession(admin.id);
    await audit(admin.id, "admin.login", undefined, { ip: clientIp(req) });
    return { ok: true };
  });
}

export async function DELETE() {
  return handle(async () => {
    await clearAdminSession();
    return { ok: true };
  });
}
