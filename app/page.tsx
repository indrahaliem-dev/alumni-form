export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-6 py-16">
      <main className="w-full max-w-3xl rounded-3xl border border-slate-200 bg-white p-10 shadow-sm">
        <div className="space-y-4">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
            Alumni Portal
          </p>
          <h1 className="text-3xl font-semibold text-slate-900">
            Form Data Alumni
          </h1>
          <p className="text-slate-600">
            Silakan isi data alumni terbaru melalui form utama. Pencarian alumni
            tersedia dengan autocomplete berdasarkan master data.
          </p>
        </div>

        <div className="mt-8">
          <a
            className="inline-flex items-center justify-center rounded-lg bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
            href="/alumni"
          >
            Buka Form Alumni
          </a>
        </div>

        <div className="mt-10 rounded-2xl border border-slate-100 bg-slate-50 p-5 text-sm text-slate-600">
          <p>
            Belum menemukan nama Anda? Hubungi admin untuk menambahkan ke master
            data alumni.
          </p>
        </div>
      </main>
    </div>
  );
}
