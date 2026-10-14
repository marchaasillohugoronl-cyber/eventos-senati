import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { handle } from "@/lib/api";
import { requireAdmin, audit } from "@/lib/auth/admin";
import { prisma } from "@/lib/database/prisma";
import { collaboratorSchema } from "@/lib/validations";

/** Solo el administrador principal puede crear colaboradores (moderación y estadísticas). */
export async function POST(req: NextRequest) {
  return handle(async () => {
    const owner = await requireAdmin("OWNER");
    const { email, password } = collaboratorSchema.parse(await req.json());
    const created = await prisma.admin.create({
      data: { email: email.toLowerCase(), passwordHash: await bcrypt.hash(password, 12), role: "COLLABORATOR" },
      select: { id: true, email: true, role: true },
    });
    await audit(owner.id, "collaborator.create", created.id);
    return { collaborator: created };
  });
}
