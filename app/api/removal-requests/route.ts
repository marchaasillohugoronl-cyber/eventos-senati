import { NextRequest } from "next/server";
import { handle } from "@/lib/api";
import { requireUser } from "@/lib/auth/session";
import { prisma } from "@/lib/database/prisma";
import { removalSchema } from "@/lib/validations";
import { rateLimit } from "@/lib/security/ratelimit";

/** Solicitud de retirada de fotografías o datos personales (privacidad). */
export async function POST(req: NextRequest) {
  return handle(async () => {
    const user = await requireUser();
    rateLimit(`removal:${user.id}`, 5, 60_000);
    const body = removalSchema.parse(await req.json());
    await prisma.removalRequest.create({ data: { userId: user.id, ...body } });
    return { ok: true };
  });
}
