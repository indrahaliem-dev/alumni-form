-- =============================================================================
-- Sayembara: tabel `sayembara_submissions` + Storage bucket `sayembara-designs`
-- =============================================================================
-- Jalankan SELURUH file ini di Supabase → SQL Editor (role postgres, bukan dari
-- client JS). Membuat bucket lewat API anon akan gagal RLS pada storage.buckets.
--
-- Alternatif bucket: Dashboard → Storage → New bucket → id: sayembara-designs
-- → centang "Public bucket" (agar URL di kolom file_urls bisa dibuka).
--
-- Aplikasi Next.js: upload + insert dari route API (anon atau service role).
--
-- Peringatan keamanan (sengaja longgar agar RLS tidak memblokir):
-- - storage.objects: siapa pun yang punya key (anon/service) boleh tulis HANYA
--   ke bucket `sayembara-designs`. Jangan pakai bucket ini untuk data sensitif lain.
-- - sayembara_submissions: INSERT dibolehkan untuk semua key (spam lewat REST mungkin
--   bila anon key tersebar). Tidak ada policy SELECT untuk anon — baca via Dashboard
--   SQL atau client service_role (bypass RLS).
-- =============================================================================

-- --- Tabel -----------------------------------------------------------------
create table if not exists public.sayembara_submissions (
  id uuid primary key default gen_random_uuid(),
  nama text not null,
  konsulat text not null,
  cerita_desain text not null,
  file_urls text[] not null default '{}',
  created_at timestamptz not null default now()
);

comment on table public.sayembara_submissions is 'Pengumpulan desain sayembara jaket/kaos; file di bucket storage sayembara-designs.';

create index if not exists sayembara_submissions_created_at_idx
  on public.sayembara_submissions (created_at desc);

alter table public.sayembara_submissions enable row level security;

-- --- Storage: bucket (sama dengan membuat bucket di Dashboard) --------------
insert into storage.buckets (id, name, public, file_size_limit)
values ('sayembara-designs', 'sayembara-designs', true, 52428800)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit;

-- --- Storage: policy baca file (URL publik) ---------------------------------
drop policy if exists "sayembara_designs_public_read" on storage.objects;

create policy "sayembara_designs_public_read"
on storage.objects
for select
to public
using (bucket_id = 'sayembara-designs');

-- --- Storage: upload / ubah / hapus (hanya bucket ini; tanpa cek auth.role) --
drop policy if exists "sayembara_objects_insert_service" on storage.objects;
drop policy if exists "sayembara_objects_update_service" on storage.objects;
drop policy if exists "sayembara_objects_delete_service" on storage.objects;
drop policy if exists "sayembara_objects_insert" on storage.objects;
drop policy if exists "sayembara_objects_update" on storage.objects;
drop policy if exists "sayembara_objects_delete" on storage.objects;

create policy "sayembara_objects_insert"
on storage.objects
for insert
with check (bucket_id = 'sayembara-designs');

create policy "sayembara_objects_update"
on storage.objects
for update
using (bucket_id = 'sayembara-designs')
with check (bucket_id = 'sayembara-designs');

create policy "sayembara_objects_delete"
on storage.objects
for delete
using (bucket_id = 'sayembara-designs');

-- --- Tabel: INSERT longgar (anon/service dari API Next); tanpa policy SELECT anon
drop policy if exists "sayembara_submissions_all_service" on public.sayembara_submissions;
drop policy if exists "sayembara_submissions_insert_service" on public.sayembara_submissions;
drop policy if exists "sayembara_submissions_select_service" on public.sayembara_submissions;
drop policy if exists "sayembara_submissions_insert" on public.sayembara_submissions;

create policy "sayembara_submissions_insert"
on public.sayembara_submissions
for insert
with check (true);
