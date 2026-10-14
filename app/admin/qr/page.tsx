import { redirect } from "next/navigation";
import { getCurrentAdmin } from "@/lib/auth/admin";
import { getEvent } from "@/lib/database/prisma";
import { PosterGenerator } from "@/components/qr/PosterGenerator";

export const dynamic = "force-dynamic";

export default async function QrPage() {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/admin/login");
  const event = await getEvent();
  return (
    <section className="card space-y-4 p-5">
      <h1 className="text-lg font-bold text-senati-800">QR y afiches</h1>
      <PosterGenerator appUrl={process.env.NEXT_PUBLIC_APP_URL ?? ""} title={event.title} />
    </section>
  );
}
