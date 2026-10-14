import { handle } from "@/lib/api";
import { requireUser } from "@/lib/auth/session";
import { signUpload } from "@/lib/cloudinary";
import { rateLimit } from "@/lib/security/ratelimit";

export const dynamic = "force-dynamic";

export async function POST() {
  return handle(async () => {
    const user = await requireUser();
    rateLimit(`sign:${user.id}`, 30, 60_000);
    return signUpload(user.id);
  });
}
