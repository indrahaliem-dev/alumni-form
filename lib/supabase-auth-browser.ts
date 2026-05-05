import { createBrowserClient } from "@supabase/ssr";
import { getSupabaseAuthEnv } from "@/lib/supabase-auth";

export function createSupabaseBrowserClient() {
  const { supabaseUrl, supabaseAnonKey } = getSupabaseAuthEnv();
  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}
