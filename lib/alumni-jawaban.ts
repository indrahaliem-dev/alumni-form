/**
 * Bentuk jawaban alumni untuk API klien ↔ kolom `alumni_responses` di Supabase.
 * Kolom terpisah per field form; `sosialMediaLegacy` dipakai bila data lama
 * hanya di `sosial_media` (gabungan non-WA atau format lama yang masih menyertakan WA).
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

function trimCell(v: unknown): string {
  return typeof v === "string" ? v.trim() : "";
}

/** Nilai setelah `Label:` dalam segmen `teks | teks` (impor lama kadang menaruh beberapa field di `sosial_media`). */
function labeledField(combined: string, labelPattern: RegExp): string {
  const s = combined.trim();
  if (!s) return "";
  for (const part of s.split(" | ")) {
    const m = part.trim().match(labelPattern);
    if (m?.[1]) return m[1].trim();
  }
  return "";
}

/** Segmen teks yang hanya nomor WA (bukan label Instagram/TikTok, dll.). */
function whatsappFromSegment(segment: string): string {
  const s = segment.trim();
  if (!s) return "";
  const labeledWa = /^\s*(?:WhatsApp|WA)\s*:\s*(.+)$/i.exec(s);
  if (labeledWa) return labeledWa[1].trim();
  if (s.includes(":")) return "";
  return s;
}

/** Nomor WA dari kolom `whatsapp` atau segmen pertama `sosial_media` bila belum terpisah di DB. */
function whatsappDisplayFromRow(row: AlumniResponseDbRow): string {
  const fromCol = (row.whatsapp ?? "").trim();
  if (fromCol) return fromCol;
  const leg = (row.sosial_media ?? "").trim();
  if (!leg) return "";
  if (!leg.includes(" | ")) {
    return whatsappFromSegment(leg);
  }
  const first = leg.split(" | ")[0]?.trim() ?? "";
  return whatsappFromSegment(first);
}

function hasLabeledSosialInLegacy(s: string): boolean {
  return (
    s.includes("Instagram:") ||
    s.includes("TikTok:") ||
    s.includes("X:") ||
    s.includes("LinkedIn:") ||
    s.includes("Lainnya:")
  );
}

export function alumniResponseRowToClient(row: AlumniResponseDbRow): JawabanTerakhirClient {
  const legacy = (row.sosial_media ?? "").trim();

  const kesibukan =
    trimCell(row.kesibukan) ||
    labeledField(legacy, /^(?:Kesibukan|Pekerjaan)\s*:\s*(.+)$/i);
  const domisili =
    trimCell(row.domisili) || labeledField(legacy, /^Domisili\s*:\s*(.+)$/i);
  const ikutReuni =
    trimCell(row.ikut_reuni) || labeledField(legacy, /^Ikut\s+reuni\s*:\s*(.+)$/i);
  const ideAlumni =
    trimCell(row.ide_alumni) || labeledField(legacy, /^Ide\s*alumni\s*:\s*(.+)$/i);

  const whatsapp = whatsappDisplayFromRow(row);
  const instagram = (row.instagram ?? "").trim();
  const tiktok = (row.tiktok ?? "").trim();
  const twitter = (row.twitter ?? "").trim();
  const linkedin = (row.linkedin ?? "").trim();
  const sosialLainnya = (row.sosial_lainnya ?? "").trim();

  const hasGranular =
    Boolean(whatsapp) ||
    Boolean(instagram) ||
    Boolean(tiktok) ||
    Boolean(twitter) ||
    Boolean(linkedin) ||
    Boolean(sosialLainnya);

  /**
   * String gabungan untuk parse field sosial (label), bukan untuk WA murni yang sudah dipindah ke `whatsapp`.
   */
  const sosialMediaLegacy =
    legacy && (legacy.includes(" | ") || hasLabeledSosialInLegacy(legacy))
      ? legacy
      : null;

  return {
    kesibukan,
    whatsapp,
    instagram,
    tiktok,
    twitter,
    linkedin,
    sosialLainnya,
    domisili,
    ikutReuni,
    ideAlumni,
    merchandiseVote: trimCell(row.merchandise_vote),
    merchandiseIdeLain: trimCell(row.merchandise_ide_lain),
    sosialMediaLegacy,
  };
}
