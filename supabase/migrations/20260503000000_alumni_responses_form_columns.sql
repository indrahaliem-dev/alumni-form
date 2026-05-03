-- Selaraskan `alumni_responses` dengan field form (satu kolom per isian).
-- Jalankan di Supabase SQL Editor atau `supabase db push` setelah folder ini terhubung.

alter table public.alumni_responses
  add column if not exists whatsapp text,
  add column if not exists instagram text,
  add column if not exists tiktok text,
  add column if not exists twitter text,
  add column if not exists linkedin text,
  add column if not exists sosial_lainnya text,
  add column if not exists merchandise_ide_lain text;

-- Baris baru tidak wajib mengisi kolom gabungan lama.
alter table public.alumni_responses
  alter column sosial_media drop not null;

-- Opsional: salin nomor WA murni (bukan gabungan bertanda " | ") ke kolom whatsapp.
update public.alumni_responses
set whatsapp = sosial_media
where
  whatsapp is null
  and sosial_media is not null
  and sosial_media not like '% | %';
