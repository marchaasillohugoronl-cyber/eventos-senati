import { NextRequest } from "next/server";
import { handle } from "@/lib/api";
import { requireAdmin, audit } from "@/lib/auth/admin";
import { prisma, getEvent } from "@/lib/database/prisma";
import { eventStatusSchema } from "@/lib/validations";
import { publish } from "@/lib/realtime/server";

/** Inicio, cierre y reapertura manual del evento. Reabrir conserva todo el contenido. */
export async function PATCH(req: NextRequest) {
  return handle(async () => {
    const admin = await requireAdmin("OWNER");
    const { status } = eventStatusSchema.parse(await req.json());
    const event = await getEvent();
    const updated = await prisma.event.update({
      where: { id: event.id },
      data: {
        status,
        ...(status === "ACTIVE" && !event.startedAt ? { startedAt: new Date() } : {}),
        finishedAt: status === "FINISHED" ? new Date() : null,
      },
    });
    await audit(admin.id, "event.status", event.id, { from: event.status, to: status });
    await publish("event.status.changed", { status: updated.status });
    return { status: updated.status };
  });
}
