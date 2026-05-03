/**
 * Bentuk jawaban alumni untuk API klien ↔ kolom `alumni_responses` di Supabase.
 * Kolom terpisah per field form; `sosialMediaLegacy` dipakai bila data lama
 * hanya tersimpan di `sosial_media` (gabungan).
 */

export type JawabanTerakhirClient = {
  kesibukan: string;
  whatsapp: string;
  instagram: string;
  tiktok: string;
  twitter: string;
  linkedin: string;
  sosialLainnya: string;
  domisili: string;
  ikutReuni: string;
  ideAlumni: string;
  merchandiseVote: string;
  merchandiseIdeLain: string;
  sosialMediaLegacy: string | null;
};

/** Baca semua kolom yang ada di baris (aman sebelum & sesudah migrasi kolom baru). */
export const ALUMNI_RESPONSE_SELECT = "*";

export type AlumniResponseDbRow = {
  kesibukan?: string | null;
  whatsapp?: string | null;
  instagram?: string | null;
  tiktok?: string | null;
  twitter?: string | null;
  linkedin?: string | null;
  sosial_lainnya?: string | null;
  sosial_media?: string | null;
  domisili?: string | null;
  ikut_reuni?: string | null;
  ide_alumni?: string | null;
  merchandise_vote?: string | null;
  merchandise_ide_lain?: string | null;
};

export function alumniResponseRowToClient(row: AlumniResponseDbRow): JawabanTerakhirClient {
  const whatsapp = (row.whatsapp ?? "").trim();
  const instagram = (row.instagram ?? "").trim();
  const tiktok = (row.tiktok ?? "").trim();
  const twitter = (row.twitter ?? "").trim();
  const linkedin = (row.linkedin ?? "").trim();
  const sosialLainnya = (row.sosial_lainnya ?? "").trim();
  const legacy = (row.sosial_media ?? "").trim();

  const hasGranular =
    Boolean(whatsapp) ||
    Boolean(instagram) ||
    Boolean(tiktok) ||
    Boolean(twitter) ||
    Boolean(linkedin) ||
    Boolean(sosialLainnya);

  /** Tetap kirim gabungan lama bila perlu mengisi field yang belum punya kolom terpisah. */
  const sosialMediaLegacy =
    legacy && (!hasGranular || legacy.includes(" | ")) ? legacy : null;

  return {
    kesibukan: row.kesibukan ?? "",
    whatsapp,
    instagram,
    tiktok,
    twitter,
    linkedin,
    sosialLainnya,
    domisili: row.domisili ?? "",
    ikutReuni: row.ikut_reuni ?? "",
    ideAlumni: row.ide_alumni ?? "",
    merchandiseVote: row.merchandise_vote ?? "",
    merchandiseIdeLain: row.merchandise_ide_lain ?? "",
    sosialMediaLegacy,
  };
}
