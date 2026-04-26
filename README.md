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
```

3. Jalankan dev server:

```bash
npm run dev
```

4. Buka `http://localhost:3000/alumni`.

## Struktur Data Supabase

App menggunakan tabel:

- `alumni_master`
- `alumni_responses`
