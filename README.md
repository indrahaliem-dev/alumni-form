# Alumni Form

Form data alumni berbasis master Excel dengan autocomplete, status sudah mengisi, dan submit sekali saja.

## Setup

1. Install dependencies:

```bash
npm install
```

2. Buat file `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL="https://YOUR-PROJECT.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="YOUR_ANON_KEY"
# Disarankan untuk route API (baca/tulis `alumni_responses` bila RLS tidak mengizinkan anon):
# SUPABASE_SERVICE_ROLE_KEY="…dari Dashboard → Settings → API → service_role (tanpa prefix NEXT_PUBLIC)"
# Prisma (skrip import/count) — Postgres Supabase, bukan file Excel:
# Dashboard → Settings → Database → Connection string → URI (biasanya port 5432).
DATABASE_URL="postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres"
```

`npm install` menjalankan `prisma generate` otomatis (`postinstall`).

3. Jalankan dev server:

```bash
npm run dev
```

4. Buka `http://localhost:3000/alumni`.

Route API memakai **`getSupabaseServerClient`**: memilih **`SUPABASE_SERVICE_ROLE_KEY`** bila di-set (melewati RLS), selain itu **anon key**. Tanpa service role, RLS yang menutup `SELECT` pada `alumni_responses` membuat prapengisian form kosong. **Prisma** dipakai hanya untuk skrip lokal ke Postgres lewat `DATABASE_URL`.

**Skrip opsional (Excel → sumber baca: Postgres Supabase)**

- `npm run import:master -- ./data/master.xlsx` — baca Excel, tulis ke tabel `alumni_master` via Prisma. Kolom sheet: `nomer_induk` / `nomor_id`, `nama_lengkap` / `nama`, `asal` / `konsulat`.
- `npm run count:master` — hitung baris `alumni_master` via Prisma.

Model Prisma memetakan ke tabel yang sama seperti migrasi SQL di `supabase/migrations/` (nama tabel default `alumni_master` / `alumni_responses`). Jika kamu mengganti nama tabel lewat `SUPABASE_TABLE_*`, skrip Prisma ini tetap memakai nama default — sesuaikan `schema.prisma` atau pakai tabel default di Supabase.

## Struktur Data Supabase

App memakai tabel `alumni_master` dan `alumni_responses` (nama bisa di-override lewat env, lihat `lib/supabase-schema.ts`).

**Membuat / menyelaraskan tabel di Supabase**

- **Tanpa CLI:** buka Supabase Dashboard → **SQL** → tempel isi file migrasi (urut dari tanggal di nama file). `20260504000000_alumni_schema_complete.sql` untuk skema penuh. Jika tabel `alumni_responses` sudah ada tetapi **belum ada kolom `whatsapp`**, jalankan juga `20260506000000_add_whatsapp_column_alumni_responses.sql`.
- **Dengan CLI:** dari root repo, `supabase link` lalu `supabase db push` agar semua file di `supabase/migrations/` diterapkan berurutan.

**Kolom ↔ form**

| Tabel `alumni_master` | Dipakai untuk |
| --- | --- |
| `id` | ID di URL API (`/api/alumni/[id]`) |
| `nama`, `nomor_id`, `konsulat` | Autocomplete & detail |
| `sudah_isi` | Badge “sudah isi”; di-set API setelah simpan |

| Tabel `alumni_responses` | Field form / API |
| --- | --- |
| `alumni_id` | FK ke `alumni_master.id` |
| `kesibukan` | Kesibukan |
| `whatsapp` (+ `sosial_media` legacy) | WA & gabungan sosial lama |
| `instagram`, `tiktok`, `twitter`, `linkedin`, `sosial_lainnya` | Sosial |
| `domisili`, `ikut_reuni`, `ide_alumni` | Domisili, reuni, ide |
| `merchandise_vote`, `merchandise_ide_lain` | Pilihan merch + ide lain |
