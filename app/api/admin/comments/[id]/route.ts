import { handle } from "@/lib/api";
import { requireAdmin, audit } from "@/lib/auth/admin";
import { prisma } from "@/lib/database/prisma";
import { publish } from "@/lib/realtime/server";

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  return handle(async () => {
    const admin = await requireAdmin();
    const c = await prisma.comment.update({ where: { id: params.id }, data: { removed: true } });
    await audit(admin.id, "comment.remove", params.id);
    await publish("comment.removed", { postId: c.postId, commentId: c.id });
    return { ok: true };
  });
}
