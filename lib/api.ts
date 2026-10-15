import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { HttpError } from "@/lib/auth/session";
import { Prisma } from "@prisma/client";

/** Envuelve un handler para devolver errores JSON consistentes. */
export async function handle<T>(fn: () => Promise<T>) {
  try {
    const data = await fn();
    return NextResponse.json(data);
  } catch (err) {
    if (err instanceof HttpError) return NextResponse.json({ error: err.message }, { status: err.status });
    if (err instanceof ZodError)
      return NextResponse.json({ error: "Datos inválidos.", details: err.flatten() }, { status: 400 });
    console.error(err);
    if (err instanceof Prisma.PrismaClientInitializationError ||
      (err instanceof Prisma.PrismaClientKnownRequestError && ["P1001", "P1002", "P1017", "P2024"].includes(err.code))) {
      return NextResponse.json({ error: "No pudimos conectar con el servicio. Inténtalo nuevamente en unos momentos." }, { status: 503 });
    }
    return NextResponse.json({ error: "Error interno del servidor." }, { status: 500 });
  }
}

export function clientIp(req: Request) {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
}
