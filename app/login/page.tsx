import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthError } from "next-auth";
import { auth, signIn } from "@/auth";
import { Camera, Images, MonitorPlay, ArrowRight } from "lucide-react";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { safeReturnPath } from "@/lib/auth/redirect";

export default async function LoginPage({ searchParams }: { searchParams: { callbackUrl?: string; error?: string } }) {
  const redirectTo = safeReturnPath(searchParams.callbackUrl);
  const session = await auth();
  if (session?.user?.id) redirect(redirectTo);
  const error = searchParams.error;
  const message = error === "AccessDenied"
    ? "No se autorizó el acceso. Puedes volver a intentarlo con tu cuenta de Google."
    : error ? "No pudimos completar el acceso con Google. Inténtalo de nuevo; si continúa, contacta al organizador." : null;
  return (
    <main className="flex min-h-screen items-center justify-center bg-senati-800 px-5 py-6 sm:py-16">
      <div className="grid w-full max-w-5xl overflow-hidden rounded-3xl bg-white shadow-2xl md:grid-cols-2">
        <section className="relative flex flex-col justify-between bg-gradient-to-br from-senati-600 to-senati-800 p-6 text-white sm:p-12">
          <Link href="/login" className="text-xl font-black tracking-widest">SENATI <span className="block text-xs font-medium tracking-normal text-blue-100">EventShare · Inauguración</span></Link>
          <div className="pt-6 md:py-16">
            <span className="mb-5 hidden rounded-full md:inline-flex border border-white/20 px-3 py-1 text-xs">Un encuentro para recordar</span>
            <h1 className="text-3xl font-black leading-tight tracking-tight sm:text-5xl">Tus momentos.<br />Nuestro álbum.</h1>
            <p className="mt-5 hidden max-w-sm text-sm md:block leading-7 text-blue-100">Vive la inauguración y comparte las fotografías que hacen especial este día.</p>
          </div>
          <div className="hidden gap-4 text-sm text-blue-50 md:grid">
            <p className="flex items-center gap-3"><Camera className="h-5 w-5 shrink-0" /> Comparte hasta cinco fotos por publicación</p>
            <p className="flex items-center gap-3"><Images className="h-5 w-5 shrink-0" /> Descubre los momentos de la comunidad</p>
            <p className="flex items-center gap-3"><MonitorPlay className="h-5 w-5 shrink-0" /> Mira tus fotos en la pantalla del evento</p>
          </div>
        </section>
        <section className="flex flex-col justify-center p-6 sm:p-12">
          <div className="mb-6 hidden h-12 w-12 items-center justify-center rounded-2xl bg-senati-50 text-senati-600 sm:flex"><Camera /></div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Sé parte del evento</h2>
          <p className="mt-3 text-sm leading-6 text-slate-500">Ingresa con Google para ver el muro, compartir fotos y conectar con otros visitantes.</p>
          {message && <p role="alert" className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">{message}</p>}
          <form className="mt-7" action={async () => {
            "use server";
            try { await signIn("google", { redirectTo }); }
            catch (error) {
              if (error instanceof AuthError) redirect(`/login?error=${encodeURIComponent(error.type)}&callbackUrl=${encodeURIComponent(redirectTo)}`);
              throw error;
            }
          }}><SubmitButton>Continuar con Google <ArrowRight className="h-4 w-4" /></SubmitButton></form>
          <p className="mt-4 text-xs leading-5 text-slate-500">Tu correo es privado. Al participar, consulta nuestra <Link className="underline underline-offset-2" href="/privacidad">política de privacidad</Link>.</p>
          <div className="mt-9 border-t border-slate-100 pt-5"><Link href="/admin/login" className="text-xs text-slate-500 hover:text-senati-700 hover:underline">Acceso administrativo</Link></div>
        </section>
      </div>
    </main>
  );
}
