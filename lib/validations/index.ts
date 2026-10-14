import { z } from "zod";

export const MAX_IMAGES = 5;
export const MAX_FILE_BYTES = 15 * 1024 * 1024; // 15 MB por foto
export const ALLOWED_MIME = ["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"];

const imageRef = z.object({ publicId: z.string().min(5).max(200) });

export const createPostSchema = z.object({
  message: z.string().trim().max(500).optional().default(""),
  images: z.array(imageRef).min(1, "Agrega al menos una fotografía.").max(MAX_IMAGES),
});

export const updatePostSchema = z.object({
  message: z.string().trim().max(500).optional(),
  images: z.array(imageRef).min(1).max(MAX_IMAGES).optional(),
});

export const commentSchema = z.object({ content: z.string().trim().min(1).max(300) });

export const publicNameSchema = z.object({ publicName: z.string().trim().min(2).max(40) });

export const reportSchema = z
  .object({
    postId: z.string().optional(),
    commentId: z.string().optional(),
    reason: z.string().trim().min(5).max(500),
  })
  .refine((v) => v.postId || v.commentId, "Indica qué deseas reportar.");

export const removalSchema = z.object({
  postId: z.string().optional(),
  reason: z.string().trim().min(10).max(1000),
});

export const infoRequestSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().email().max(120),
  whatsapp: z
    .string()
    .trim()
    .regex(/^\+?[0-9 ]{7,15}$/, "Número no válido")
    .optional()
    .or(z.literal("")),
  consent: z.boolean(), // false por defecto en el formulario; nunca premarcado
});

export const adminLoginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1).max(200),
});

export const eventStatusSchema = z.object({ status: z.enum(["SCHEDULED", "ACTIVE", "FINISHED"]) });

export const visibilitySchema = z.object({ visibility: z.enum(["VISIBLE", "HIDDEN"]) });

export const collaboratorSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(12).max(200),
});

export const CONSENT_TEXT =
  "Autorizo a SENATI a contactarme por correo o WhatsApp con información y comunicaciones promocionales sobre sus carreras.";
