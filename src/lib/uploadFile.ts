import { supabase } from "./supabase";

/**
 * Upload a single file to a Supabase storage bucket and return its public URL.
 * Filenames are randomized to avoid collisions.
 */
export async function uploadFile(
  bucket: "media" | "manga",
  file: File,
  prefix = ""
): Promise<{ url: string; path: string }> {
  const ext = file.name.split(".").pop() ?? "bin";
  const safeName =
    prefix +
    crypto.randomUUID() +
    "." +
    ext.toLowerCase().replace(/[^a-z0-9]/g, "");
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(safeName, file, {
      cacheControl: "3600",
      upsert: false,
      contentType: file.type || undefined,
    });
  if (error) throw error;
  const { data: pub } = supabase.storage.from(bucket).getPublicUrl(data.path);
  return { url: pub.publicUrl, path: data.path };
}

export async function deleteFile(bucket: "media" | "manga", path: string) {
  const { error } = await supabase.storage.from(bucket).remove([path]);
  if (error) throw error;
}
