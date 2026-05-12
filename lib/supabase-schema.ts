/**
 * Nama tabel Supabase — bisa di-override lewat env bila di dashboard
 * tabel diganti (mis. marhalah_master).
 *
 * .env.local contoh:
 *   SUPABASE_TABLE_MASTER=alumni_master
 *   SUPABASE_TABLE_RESPONSES=alumni_responses
 */
export const SUPABASE_TABLE_MASTER =
  process.env.SUPABASE_TABLE_MASTER?.trim() || "alumni_master";

export const SUPABASE_TABLE_RESPONSES =
  process.env.SUPABASE_TABLE_RESPONSES?.trim() || "alumni_responses";

/** Tabel pengumpulan desain sayembara (jaket/kaos). */
export const SUPABASE_TABLE_SAYEMBARA =
  process.env.SUPABASE_TABLE_SAYEMBARA?.trim() || "sayembara_submissions";

/** Bucket Storage untuk file desain sayembara. */
export const SUPABASE_SAYEMBARA_BUCKET =
  process.env.SUPABASE_SAYEMBARA_BUCKET?.trim() || "sayembara-designs";
