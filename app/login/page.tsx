import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthError } from "next-auth";
import { auth, signIn } from "@/auth";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { safeReturnPath } from "@/lib/auth/redirect";

function GoogleLogo() {
  return (
    <svg viewBox="0 0 48 48" className="h-6 w-6" aria-hidden="true">
      <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.8 2.4 30.3 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.9 6.1C12.4 13.6 17.7 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.6 3-2.3 5.5-4.8 7.2l7.5 5.8c4.4-4.1 7.1-10.1 7.1-17.5z" />
      <path fill="#FBBC05" d="M10.5 28.7a14.5 14.5 0 0 1 0-9.4l-7.9-6.1a24 24 0 0 0 0 21.6l7.9-6.1z" />
      <path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.5-5.8c-2.1 1.4-4.9 2.3-8.4 2.3-6.3 0-11.6-4.1-13.5-9.8l-7.9 6.1C6.5 42.6 14.6 48 24 48z" />
    </svg>
  );
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: { callbackUrl?: string; error?: string };
}) {
  const redirectTo = safeReturnPath(searchParams.callbackUrl);
  const session = await auth();
  if (session?.user?.id) redirect(redirectTo);

  const error = searchParams.error;
  const message =
    error === "AccessDenied"
      ? "No se autorizó el acceso. Puedes volver a intentarlo con tu cuenta de Google."
      : error
        ? "No pudimos completar el acceso con Google. Inténtalo de nuevo; si continúa, contacta al organizador."
        : null;

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-8">
      <div className="w-full max-w-[400px] rounded-lg bg-white px-8 py-10 shadow-md sm:px-10">
        <GoogleLogo />
        <h1 className="mt-5 text-2xl font-normal text-slate-900">Iniciar sesión</h1>
        <p className="mt-1 text-sm text-slate-700">
          para ver y compartir fotos de la inauguración
        </p>

        {message && (
          <p
            role="alert"
            className="mt-6 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900"
          >
            {message}
          </p>
        )}

        <form
          className="mt-10"
          action={async () => {
            "use server";
            try {
              await signIn("google", { redirectTo });
            } catch (error) {
              if (error instanceof AuthError) {
                redirect(
                  `/login?error=${encodeURIComponent(error.type)}&callbackUrl=${encodeURIComponent(redirectTo)}`
                );
              }
              throw error;
            }
          }}
        >
          <SubmitButton>Continuar con Google</SubmitButton>
        </form>

        <p className="mt-6 text-xs leading-5 text-slate-500">
          Tu correo es privado. Al participar, consulta nuestra{" "}
          <Link className="text-blue-600 hover:underline" href="/privacidad">
            política de privacidad
          </Link>
          .
        </p>

        <div className="mt-8 text-sm">
          <Link href="/admin/login" className="font-medium text-blue-600 hover:underline">
            Acceso administrativo
          </Link>
        </div>
      </div>
    </main>
  );
}
