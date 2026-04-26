export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-6 py-16">
      <main className="w-full max-w-3xl rounded-3xl border border-slate-200 bg-white p-10 shadow-sm">
        <div className="space-y-4">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
            Portal Alumni
          </p>

          <h1 className="text-3xl font-semibold text-slate-900">
            Pendataan Alumni Reuni 100 Tahun Gontor
          </h1>

          <p className="text-slate-600 leading-relaxed">
            Assalamu’alaikum warahmatullahi wabarakatuh.
          </p>

          <p className="text-slate-600 leading-relaxed">
            Dengan hormat, kami mengundang seluruh alumni untuk berpartisipasi
            dalam pendataan alumni sebagai bagian dari persiapan acara{" "}
            <span className="font-medium text-slate-800">
              Reuni 100 Tahun Gontor
            </span>{" "}
            yang insyaAllah akan dilaksanakan pada bulan{" "}
            <span className="font-medium text-slate-800">
              September 2026
            </span>.
          </p>

          <p className="text-slate-600 leading-relaxed">
            Data yang Antum isi akan sangat membantu dalam
            mempererat silaturahmi antar alumni, penyusunan informasi peserta,
            serta menjadi bahan pertimbangan untuk berbagai kebutuhan acara,
            termasuk usulan dan minat terhadap merchandise alumni.
          </p>

          <p className="text-slate-600 leading-relaxed">
            Kami mengucapkan terima kasih atas waktu dan perhatian yang
            diberikan. Semoga partisipasi ini menjadi bagian dari ikhtiar
            kebaikan bersama.
          </p>
        </div>

        <div className="mt-8">
          <a
            className="inline-flex items-center justify-center rounded-lg bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
            href="/alumni"
          >
            Isi Form Pendataan Alumni
          </a>
        </div>

        <div className="mt-10 rounded-2xl border border-slate-100 bg-slate-50 p-5 text-sm text-slate-600 leading-relaxed">
          <p>
            Apabila nama Antum belum tersedia pada daftar alumni, silakan hubungi 
            <a href="https://wa.me/082111836455" className="text-blue-500"> admin</a> agar dapat ditambahkan ke master data.
          </p>
        </div>
      </main>
    </div>
  );
}