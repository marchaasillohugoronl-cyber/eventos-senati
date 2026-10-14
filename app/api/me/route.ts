import { NextRequest } from "next/server";
import { handle } from "@/lib/api";
import { requireUser } from "@/lib/auth/session";
import { prisma } from "@/lib/database/prisma";
import { publicNameSchema } from "@/lib/validations";

export async function PATCH(req: NextRequest) {
  return handle(async () => {
    const user = await requireUser();
    const { publicName } = publicNameSchema.parse(await req.json());
    const updated = await prisma.user.update({ where: { id: user.id }, data: { publicName } });
    return { publicName: updated.publicName };
  });
}
