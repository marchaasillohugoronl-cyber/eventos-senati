/** Utilidades seguras para el cliente: construyen URLs optimizadas a partir del publicId. */
const CLOUD = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;

const PRESETS = {
  thumb: "c_fill,w_200,h_200,g_auto,f_auto,q_auto",
  mobile: "c_limit,w_900,f_auto,q_auto",
  gallery: "c_limit,w_1400,f_auto,q_auto",
  tv: "c_limit,w_2560,f_auto,q_auto:good",
} as const;

export type ImagePreset = keyof typeof PRESETS;

export function cldUrl(publicId: string, preset: ImagePreset = "mobile") {
  return `https://res.cloudinary.com/${CLOUD}/image/upload/${PRESETS[preset]}/${publicId}`;
}

/** Descarga de la original sin transformaciones ni marca de agua. */
export function cldOriginalDownloadUrl(publicId: string) {
  return `https://res.cloudinary.com/${CLOUD}/image/upload/fl_attachment/${publicId}`;
}
