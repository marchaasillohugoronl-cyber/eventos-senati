import { NextRequest } from "next/server";
import { handle } from "@/lib/api";
import { requireUser } from "@/lib/auth/session";
import { prisma } from "@/lib/database/prisma";
import { reportSchema } from "@/lib/validations";
import { rateLimit } from "@/lib/security/ratelimit";

export async function POST(req: NextRequest) {
  return handle(async () => {
    const user = await requireUser();
    rateLimit(`report:${user.id}`, 10, 60_000);
    const body = reportSchema.parse(await req.json());
    await prisma.report.create({ data: { reporterId: user.id, ...body } });
    return { ok: true };
  });
}
