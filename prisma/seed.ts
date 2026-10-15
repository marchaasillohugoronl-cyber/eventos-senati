import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { loadEnvConfig } from "@next/env";

loadEnvConfig(process.cwd());

const prisma = new PrismaClient();

async function main() {
  await prisma.event.upsert({
    where: { slug: "inauguracion-senati" },
    update: {},
    create: {
      slug: "inauguracion-senati",
      title: "Inauguración de la nueva sede SENATI",
      description: "Comparte tus mejores momentos de la inauguración.",
      status: "SCHEDULED",
    },
  });

  const email = process.env.SEED_ADMIN_EMAIL;
  const password = process.env.SEED_ADMIN_PASSWORD;
  if (email && password) {
    if (password.length < 6) throw new Error("SEED_ADMIN_PASSWORD debe tener al menos 6 caracteres");
    const passwordHash = await bcrypt.hash(password, 12);
    const resetPassword = process.argv.includes("--reset-password");
    await prisma.admin.upsert({
      where: { email: email.toLowerCase() },
      update: resetPassword ? { passwordHash } : {},
      create: { email: email.toLowerCase(), passwordHash, role: "OWNER" },
    });
    console.log(resetPassword ? "Credenciales del administrador guardadas:" : "Administrador disponible:", email);
  } else {
    console.log("Define SEED_ADMIN_EMAIL y SEED_ADMIN_PASSWORD para crear el administrador.");
  }
}

main().finally(() => prisma.$disconnect());
