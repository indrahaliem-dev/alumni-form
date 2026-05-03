export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center px-6 py-16">
      <main className="w-full max-w-3xl rounded-3xl border border-birch-200 bg-birch-50 p-10 shadow-sm">
        <div className="space-y-4">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-birch-400">
            Portal Marhalah
          </p>

          <h1 className="text-3xl font-semibold text-birch-900">
            Pendataan Marhalah Reuni 100 Tahun Gontor
          </h1>

          <p className="text-birch-600 leading-relaxed">
            Assalamu’alaikum warahmatullahi wabarakatuh.
          </p>

          <p className="text-birch-600 leading-relaxed">
            Dalam rangka menyambut{" "}
            <span className="font-medium text-birch-800">
              Reuni 100 Tahun Gontor
            </span>{" "}
            yang insyaAllah akan dilaksanakan pada bulan{" "}
            <span className="font-medium text-birch-800">
              September 2026
            </span>
            , kami mengajak seluruh marhalah untuk berpartisipasi dalam pendataan
            marhalah secara terpusat.
          </p>

          <p className="text-birch-600 leading-relaxed">
            Pendataan ini tidak hanya digunakan untuk kebutuhan acara,
            tetapi juga akan menjadi bagian dari{" "}
            <span className="font-medium text-birch-800">
              sistem database marhalah terintegrasi
            </span>{" "}
            yang dapat dimanfaatkan bersama oleh seluruh marhalah ke depannya.
          </p>

          <p className="text-birch-600 leading-relaxed">
            Data yang Antum isi akan digunakan untuk:
          </p>

          <ul className="list-disc pl-5 text-birch-600 space-y-1">
            <li>Mempererat jaringan dan silaturahmi antar marhalah</li>
            <li>Penyusunan informasi dan kehadiran peserta reuni</li>
            <li>Pengembangan platform marhalah berbasis data</li>
            <li>Kebutuhan komunikasi dan program marhalah ke depan</li>
          </ul>

          <p className="text-birch-600 leading-relaxed">
            Bagi Antum yang sebelumnya sudah pernah mengisi data,
            sistem akan menampilkan data tersebut secara otomatis dan
            dapat diperbarui jika terdapat perubahan.
          </p>

          <p className="text-birch-600 leading-relaxed">
            Kami mengucapkan terima kasih atas partisipasi Antum.
            Semoga ini menjadi bagian dari ikhtiar dalam menjaga ukhuwah
            dan kontribusi untuk Pondok tercinta.
          </p>
        </div>

        <div className="mt-8">
          <a
            className="inline-flex items-center justify-center rounded-lg bg-birch-bark px-6 py-3 text-sm font-semibold text-birch-50 transition hover:bg-birch-800"
            href="/alumni"
          >
            Isi / Perbarui Data Marhalah
          </a>
        </div>

        <div className="mt-10 rounded-2xl border border-birch-200 bg-birch-100 p-5 text-sm text-birch-600 leading-relaxed">
          <p>
            Apabila nama Antum belum tersedia pada daftar marhalah, silakan
            hubungi{" "}
            <a
              href="https://wa.me/082111836455"
              className="font-medium text-birch-link underline decoration-birch-300 underline-offset-2 transition hover:text-birch-700"
            >
              admin
            </a>{" "}
            untuk proses penambahan ke dalam master data sebelum melakukan
            pengisian form.
          </p>
        </div>
      </main>
    </div>
  );
}
