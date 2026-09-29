import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let storageClient: SupabaseClient | undefined;

export const STORAGE_BUCKET = process.env.SUPABASE_STORAGE_BUCKET ?? "submission-files";
export const MAX_UPLOAD_SIZE_BYTES = 20 * 1024 * 1024;

export function getStorageClient() {
  if (storageClient) return storageClient;

  const url = process.env.SUPABASE_URL;
  const secretKey = process.env.SUPABASE_SECRET_KEY;
  if (!url || !secretKey) {
    throw new Error("Supabase Storage is not configured. Set SUPABASE_URL and SUPABASE_SECRET_KEY in backend/.env or the backend process environment.");
  }

  storageClient = createClient(url, secretKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return storageClient;
}

export function getOwnedUploadPrefix(companyId: string, userId: string) {
  return `companies/${companyId}/users/${userId}/`;
}
