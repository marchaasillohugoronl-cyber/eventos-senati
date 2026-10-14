import { signIn } from "@/auth";
import { Camera } from "lucide-react";

export default function LoginPage({ searchParams }: { searchParams: { callbackUrl?: string } }) {
  const redirectTo = searchParams.callbackUrl?.startsWith("/") ? searchParams.callbackUrl : "/evento";
  return (
    <main className="grid min-h-screen place-items-center bg-gradient-to-b from-senati-800 to-senati-600 p-6">
      <div className="card w-full max-w-sm p-8 text-center">
        <Camera className="mx-auto mb-3 h-10 w-10 text-senati-600" />
        <h1 className="text-xl font-bold text-senati-800">EventShare SENATI</h1>
        <p className="mt-2 text-sm text-slate-600">Inicia sesión con Google para ver el muro y compartir tus fotografías.</p>
        <form
          className="mt-6"
          action={async () => {
            "use server";
            await signIn("google", { redirectTo });
          }}
        >
          <button className="btn btn-primary w-full">Continuar con Google</button>
        </form>
        <p className="mt-4 text-xs text-slate-500">
          Tu correo es privado y no se mostrará. Lee nuestra <a className="underline" href="/privacidad">política de privacidad</a>.
        </p>
      </div>
    </main>
  );
}
