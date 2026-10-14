import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { Header } from "@/components/ui/Header";
import { Feed } from "@/components/muro/Feed";

export const dynamic = "force-dynamic";

export default async function EventoPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login?callbackUrl=/evento");
  return (
    <>
      <Header />
      <main>
        <Feed />
      </main>
    </>
  );
}
