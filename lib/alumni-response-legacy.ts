/** Format lama: satu kolom `sosial_media` + `merchandise_vote` berisi "Ide lain:" */

export function mergeLegacySosialMedia(parts: {
  whatsapp: string;
  instagram: string;
  tiktok: string;
  twitter: string;
  linkedin: string;
  sosial_lainnya: string;
}): string {
  const rows: [string, string][] = [
    ["Instagram", parts.instagram],
    ["TikTok", parts.tiktok],
    ["X", parts.twitter],
    ["LinkedIn", parts.linkedin],
    ["Lainnya", parts.sosial_lainnya],
  ];
  const tambahan = rows
    .filter(([, v]) => v.trim())
    .map(([label, v]) => `${label}: ${v.trim()}`)
    .join(" | ");
  const wa = parts.whatsapp.trim();
  if (!tambahan) return wa;
  return wa ? `${wa} | ${tambahan}` : tambahan;
}

export function mergeLegacyMerchandiseVote(vote: string, ideLain: string): string {
  const v = vote.trim();
  const i = ideLain.trim();
  if (v && i) return `${v}, Ide lain: ${i}`;
  if (v) return v;
  if (i) return `Ide lain: ${i}`;
  return "";
}

/** PostgREST / Postgres: kolom baru belum ada di DB. */
export function isExtendedSchemaUnavailable(error: {
  message?: string;
  code?: string;
  details?: string;
} | null): boolean {
  if (!error?.message) return false;
  const m = error.message.toLowerCase();
  if (m.includes("could not find") && m.includes("column")) return true;
  if (m.includes("schema cache")) return true;
  if (error.code === "PGRST204") return true;
  return false;
}
