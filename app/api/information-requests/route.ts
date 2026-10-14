import { NextRequest } from "next/server";
import { handle, clientIp } from "@/lib/api";
import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/database/prisma";
import { infoRequestSchema, CONSENT_TEXT } from "@/lib/validations";
import { rateLimit } from "@/lib/security/ratelimit";

/** Solicitud voluntaria de información. El consentimiento es opcional y se guarda con evidencia. */
export async function POST(req: NextRequest) {
  return handle(async () => {
    rateLimit(`info:${clientIp(req)}`, 5, 60_000);
    const user = await getCurrentUser();
    const body = infoRequestSchema.parse(await req.json());

    await prisma.informationRequest.create({
      data: {
        userId: user?.id,
        name: body.name,
        email: body.email.toLowerCase(),
        whatsapp: body.whatsapp || null,
        consentGiven: body.consent,
        consentTimestamp: body.consent ? new Date() : null,
        consentText: body.consent ? CONSENT_TEXT : null,
        consentIp: body.consent ? clientIp(req) : null,
      },
    });
    return { ok: true };
  });
}
