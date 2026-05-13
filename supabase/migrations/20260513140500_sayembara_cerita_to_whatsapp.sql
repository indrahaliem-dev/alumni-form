-- Upgrade: kolom `cerita_desain` → `whatsapp` (proyek yang sudah menjalankan migrasi lama).
-- Instal baru hanya punya `whatsapp` dari migrasi 20260513140000; blok ini no-op.

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'sayembara_submissions'
      and column_name = 'cerita_desain'
  ) then
    alter table public.sayembara_submissions
      rename column cerita_desain to whatsapp;
  end if;
end $$;

comment on table public.sayembara_submissions is 'Pengumpulan desain sayembara jaket/kaos (nomor WhatsApp + file); bucket sayembara-designs.';
