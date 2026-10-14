import { NextRequest } from "next/server";
import { z } from "zod";
import { handle } from "@/lib/api";
import { requireAdmin, audit } from "@/lib/auth/admin";
import { prisma } from "@/lib/database/prisma";

const schema = z.object({ status: z.enum(["RESOLVED", "DISMISSED"]) });

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  return handle(async () => {
    const admin = await requireAdmin();
    const { status } = schema.parse(await req.json());
    await prisma.report.update({ where: { id: params.id }, data: { status } });
    await audit(admin.id, "report.update", params.id, { status });
    return { ok: true };
  });
}
