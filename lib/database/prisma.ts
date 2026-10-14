import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

/** Devuelve el único evento de SENATI (lo crea si no existe). */
export async function getEvent() {
  return prisma.event.upsert({
    where: { slug: "inauguracion-senati" },
    update: {},
    create: {
      slug: "inauguracion-senati",
      title: "Inauguración de la nueva sede SENATI",
      description: "Comparte tus mejores momentos de la inauguración.",
    },
  });
}
