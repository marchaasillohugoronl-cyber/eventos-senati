import { auth } from "@/auth";
import { Header } from "@/components/ui/Header";
import { PublishForm } from "@/components/publicaciones/PublishForm";
import { getEvent } from "@/lib/database/prisma";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function PublicarPage({ searchParams }: { searchParams: { resume?: string } }) {
  const session = await auth();
  const event = await getEvent();
  return (
    <div className="event-theme min-h-screen">
      <Header title="Publicar" />
      <main>
        {/* Accesible sin sesión: el borrador se conserva localmente hasta iniciar sesión. */}
        {event.status === "ACTIVE" ? <PublishForm isAuthed={!!session?.user?.id} resume={searchParams.resume === "1"} /> : <section className="card mx-auto my-8 max-w-lg space-y-4 p-8 text-center"><h1 className="text-2xl font-bold">{event.status === "SCHEDULED" ? "Nos preparamos para comenzar" : "Gracias por ser parte del evento"}</h1><p className="text-sm leading-6 text-slate-500">{event.status === "SCHEDULED" ? "Podrás publicar fotografías cuando el organizador dé inicio al evento." : "El evento terminó y ya no recibe nuevas publicaciones. Puedes seguir disfrutando del álbum."}</p><Link className="btn btn-primary" href="/evento">Volver al muro</Link></section>}
      </main>
    </div>
  );
}
