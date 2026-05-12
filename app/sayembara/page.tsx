"use client";

import { useState } from "react";

const ACCEPT = "application/pdf,image/jpeg,image/png,image/webp,image/gif,.pdf,.jpg,.jpeg,.png,.webp,.gif";

export default function SayembaraPage() {
  const [nama, setNama] = useState("");
  const [konsulat, setKonsulat] = useState("");
  const [ceritaDesain, setCeritaDesain] = useState("");
  const [files, setFiles] = useState<FileList | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!files || files.length === 0) {
      setError("Pilih minimal satu file PDF atau foto desain (bisa beberapa sekaligus).");
      return;
    }

    setLoading(true);
    try {
      const body = new FormData();
      body.set("nama", nama.trim());
      body.set("konsulat", konsulat.trim());
      body.set("cerita_desain", ceritaDesain.trim());
      for (let i = 0; i < files.length; i++) {
        body.append("files", files[i]);
      }

      const res = await fetch("/api/sayembara/submit", {
        method: "POST",
        body,
      });

      let payload: { message?: string } = {};
      try {
        const text = await res.text();
        payload = text ? (JSON.parse(text) as { message?: string }) : {};
      } catch {
        payload = {};
      }

      if (!res.ok) {
        throw new Error(payload.message ?? `Gagal mengirim (${res.status})`);
      }

      setSuccess(payload.message ?? "Terima kasih, data berhasil dikirim.");
      setNama("");
      setKonsulat("");
      setCeritaDesain("");
      setFiles(null);
      (e.target as HTMLFormElement).reset();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal mengirim data.");
    } finally {
      setLoading(false);
    }
  };

  const fileCount = files?.length ?? 0;

  return (
    <div className="min-h-screen bg-birch-100 px-4 py-10 sm:px-6">
      <main className="mx-auto flex w-full max-w-2xl flex-col gap-6">
        <section className="rounded-3xl border border-birch-200 bg-birch-50 p-6 shadow-sm sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-birch-500">
            Sayembara desain
          </p>
          <h1 className="mt-2 text-2xl font-bold text-birch-900 sm:text-3xl">
            Jaket &amp; kaos
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-birch-600 sm:text-base">
            Unggah konsep desain dalam bentuk PDF atau gambar. Satu tombol unggah bisa memilih
            beberapa file sekaligus (misalnya desain jaket dan kaos terpisah).
          </p>
        </section>

        <form
          onSubmit={handleSubmit}
          className="rounded-3xl border border-birch-200 bg-birch-50 p-6 shadow-sm sm:p-8"
        >
          <h2 className="text-lg font-semibold text-birch-900">Form pengiriman</h2>

          <div className="mt-5 grid gap-4">
            <label className="text-sm text-birch-700">
              Nama <span className="text-birch-terracotta">*</span>
              <input
                className="mt-2 w-full rounded-xl border border-birch-300 bg-birch-50 px-4 py-3 text-birch-900 shadow-sm focus:border-birch-sage focus:outline-none"
                value={nama}
                onChange={(ev) => setNama(ev.target.value)}
                required
                autoComplete="name"
              />
            </label>

            <label className="text-sm text-birch-700">
              Konsulat <span className="text-birch-terracotta">*</span>
              <input
                className="mt-2 w-full rounded-xl border border-birch-300 bg-birch-50 px-4 py-3 text-birch-900 shadow-sm focus:border-birch-sage focus:outline-none"
                value={konsulat}
                onChange={(ev) => setKonsulat(ev.target.value)}
                required
              />
            </label>

            <label className="text-sm text-birch-700">
              Cerita desain <span className="text-birch-terracotta">*</span>
              <textarea
                className="mt-2 min-h-28 w-full rounded-xl border border-birch-300 bg-birch-50 px-4 py-3 text-birch-900 shadow-sm focus:border-birch-sage focus:outline-none"
                value={ceritaDesain}
                onChange={(ev) => setCeritaDesain(ev.target.value)}
                required
                placeholder="Ide, makna, atau arahan warna/elemen yang ingin disampaikan..."
              />
            </label>

            <div className="text-sm text-birch-700">
              <span className="font-medium">
                Unggah desain (PDF / foto) <span className="text-birch-terracotta">*</span>
              </span>
              <p className="mt-1 text-xs text-birch-500">
                PDF, JPEG, PNG, WebP, atau GIF — maks. 25 MB per file, hingga 8 file. Di perangkat
                biasanya bisa memilih banyak file sekaligus (Ctrl/Cmd + klik atau Shift).
              </p>
              <input
                type="file"
                name="design_files"
                accept={ACCEPT}
                multiple
                required
                onChange={(ev) => setFiles(ev.target.files)}
                className="mt-3 block w-full text-sm text-birch-700 file:mr-4 file:rounded-lg file:border-0 file:bg-birch-bark file:px-4 file:py-2 file:text-sm file:font-semibold file:text-birch-50 hover:file:bg-birch-800"
              />
              {fileCount > 0 ? (
                <p className="mt-2 text-xs text-birch-600">
                  {fileCount} file terpilih
                </p>
              ) : null}
            </div>
          </div>

          {error ? (
            <p className="mt-4 rounded-xl border border-birch-danger-border bg-birch-danger-bg px-4 py-3 text-sm text-birch-danger-text">
              {error}
            </p>
          ) : null}

          {success ? (
            <p className="mt-4 rounded-xl border border-birch-success-border bg-birch-success-bg px-4 py-3 text-sm text-birch-success-text">
              {success}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={loading}
            className="mt-6 inline-flex w-full items-center justify-center rounded-xl bg-birch-bark px-6 py-3 text-sm font-semibold text-birch-50 transition hover:bg-birch-800 disabled:cursor-not-allowed disabled:bg-birch-300 sm:w-auto"
          >
            {loading ? "Mengunggah..." : "Kirim desain"}
          </button>
        </form>
      </main>
    </div>
  );
}
