import { auth } from "@/auth";
import { Header } from "@/components/ui/Header";
import { PublishForm } from "@/components/publicaciones/PublishForm";

export const dynamic = "force-dynamic";

export default async function PublicarPage({ searchParams }: { searchParams: { resume?: string } }) {
  const session = await auth();
  return (
    <>
      <Header title="Publicar" />
      <main>
        {/* Accesible sin sesión: el borrador se conserva localmente hasta iniciar sesión. */}
        <PublishForm isAuthed={!!session?.user?.id} resume={searchParams.resume === "1"} />
      </main>
    </>
  );
}
