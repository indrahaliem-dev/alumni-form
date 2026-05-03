import { createClient, type SupabaseClient } from "@supabase/supabase-js";

function getSupabaseEnv() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return null;
  }

  return { supabaseUrl, supabaseAnonKey };
}

export function getSupabaseClient() {
  const env = getSupabaseEnv();
  if (!env) {
    throw new Error(
      "Supabase env belum lengkap. Isi NEXT_PUBLIC_SUPABASE_URL dan NEXT_PUBLIC_SUPABASE_ANON_KEY (atau NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY)."
    );
  }

  return createClient(env.supabaseUrl, env.supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

const serverClientOptions = {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
} as const;

/**
 * Untuk **Route Handler / server only**. Memakai `SUPABASE_SERVICE_ROLE_KEY` bila ada
 * (melewati RLS); jika tidak, fallback ke anon — sama seperti `getSupabaseClient`.
 * Tanpa service role, kebijakan RLS yang menutup `alumni_responses` membuat prapengisian form kosong.
 */
export function getSupabaseServerClient(): SupabaseClient {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  const anonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ??
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim();

  if (!supabaseUrl) {
    throw new Error(
      "Supabase env belum lengkap. Isi NEXT_PUBLIC_SUPABASE_URL (dan untuk API server, disarankan SUPABASE_SERVICE_ROLE_KEY)."
    );
  }

  const key = serviceKey || anonKey;
  if (!key) {
    throw new Error(
      "Supabase env belum lengkap. Isi NEXT_PUBLIC_SUPABASE_ANON_KEY atau SUPABASE_SERVICE_ROLE_KEY."
    );
  }

  return createClient(supabaseUrl, key, serverClientOptions);
}
