import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export const UPLOAD_FOLDER = "senati-inauguracion";

/** Firma para subida directa desde el navegador (el API secret nunca sale del servidor). */
export function signUpload(userId: string) {
  const timestamp = Math.round(Date.now() / 1000);
  const params = {
    timestamp,
    folder: `${UPLOAD_FOLDER}/${userId}`,
    allowed_formats: "jpg,jpeg,png,webp,heic,heif",
  };
  const signature = cloudinary.utils.api_sign_request(params, process.env.CLOUDINARY_API_SECRET!);
  return {
    ...params,
    signature,
    apiKey: process.env.CLOUDINARY_API_KEY,
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
  };
}

/** Verifica en Cloudinary que el recurso existe y pertenece a la carpeta del usuario. */
export async function verifyResource(publicId: string, userId: string) {
  if (!publicId.startsWith(`${UPLOAD_FOLDER}/${userId}/`)) return null;
  try {
    const r = await cloudinary.api.resource(publicId);
    return { publicId: r.public_id as string, url: r.secure_url as string, width: r.width as number, height: r.height as number, bytes: r.bytes as number };
  } catch {
    return null;
  }
}

export async function destroyResource(publicId: string) {
  await cloudinary.uploader.destroy(publicId, { invalidate: true });
}
