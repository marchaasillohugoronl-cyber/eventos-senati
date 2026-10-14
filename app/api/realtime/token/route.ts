import { NextResponse } from "next/server";
import { createTokenRequest } from "@/lib/realtime/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const token = await createTokenRequest();
  if (!token) return NextResponse.json({ error: "Tiempo real no configurado." }, { status: 503 });
  return NextResponse.json(token);
}
