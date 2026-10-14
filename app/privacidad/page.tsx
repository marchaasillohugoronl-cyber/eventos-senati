export const metadata = { title: "Privacidad · EventShare SENATI" };

/**
 * BORRADOR: debe ser revisado por el área legal de SENATI conforme a la Ley N.° 29733
 * (Protección de Datos Personales) y su reglamento antes de publicarse.
 */
export default function Privacidad() {
  return (
    <main className="prose mx-auto max-w-2xl space-y-4 p-6 text-sm leading-relaxed">
      <h1 className="text-2xl font-bold text-senati-800">Política de privacidad</h1>
      <h2 className="font-bold">Qué datos recogemos</h2>
      <p>Al iniciar sesión con Google guardamos tu nombre, nombre público, correo (privado, nunca se muestra), foto de perfil y fecha de registro.</p>
      <h2 className="font-bold">Exhibición pública de fotografías</h2>
      <p>Las fotografías y mensajes que publiques serán visibles para los asistentes autenticados y podrán proyectarse en la pantalla del evento junto a tu nombre público. Publica únicamente imágenes que puedas compartir.</p>
      <h2 className="font-bold">Menores de edad</h2>
      <p>Si una fotografía muestra a un menor de edad, debe contar con autorización de su madre, padre o tutor. Puedes solicitar su retirada en cualquier momento.</p>
      <h2 className="font-bold">Comunicaciones promocionales</h2>
      <p>Solo te contactaremos con fines promocionales si lo autorizas de forma expresa y separada en el formulario «Solicitar información». No usamos el correo de Google para publicidad.</p>
      <h2 id="retirada" className="font-bold">Retirada de fotografías o datos</h2>
      <p>Puedes solicitar la retirada desde tu perfil o escribiendo a <b>[correo de contacto de SENATI]</b>. Atenderemos tu solicitud a la brevedad.</p>
      <h2 className="font-bold">Responsable y plazos de conservación</h2>
      <p>[Completar: razón social, RUC, banco de datos registrado y plazo de retención de fotografías.]</p>
    </main>
  );
}
