import { auth } from "@/auth";
import { prisma } from "@/lib/database/prisma";

/** Usuario visitante autenticado o null. La verificación real siempre ocurre en el servidor. */
export async function getCurrentUser() {
  const session = await auth();
  if (!session?.user?.id) return null;
  return prisma.user.findUnique({ where: { id: session.user.id } });
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) throw new HttpError(401, "Debes iniciar sesión con Google.");
  return user;
}

export class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}
