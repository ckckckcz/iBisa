import { getSupabaseAdmin } from "../supabase/client.js";

const BUCKET = "avatars";
const MAX_BYTES = 2 * 1024 * 1024;

function extOf(mime: string): string {
  if (mime === "image/png") return "png";
  if (mime === "image/webp") return "webp";
  if (mime === "image/gif") return "gif";
  return "jpg";
}

export async function uploadAvatar(schoolId: string, buf: Buffer, mime: string): Promise<string> {
  if (!mime.startsWith("image/")) throw new Error("File harus gambar");
  if (buf.length > MAX_BYTES) throw new Error("Maksimal 2MB");
  const admin = getSupabaseAdmin();
  if (!admin) throw new Error("Supabase not configured");
  const path = `${schoolId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${extOf(mime)}`;
  const { error } = await admin.storage.from(BUCKET).upload(path, buf, { contentType: mime, upsert: false });
  if (error) throw new Error(error.message);
  const { data } = admin.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}
