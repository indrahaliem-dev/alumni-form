"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type SearchResult = {
  id: string;
  nama: string;
  nomorId: string;
  konsulat: string;
  sudahIsi: boolean;
};

type AlumniDetail = {
  id: string;
  nama: string;
  nomorId: string;
  konsulat: string;
  sudahIsi: boolean;
};

type FormData = {
  kesibukan: string;
  sosial_media: string;
  email: string;
  domisili: string;
  ikut_reuni: string;
  ide_alumni: string;
  merchandise_vote: string;
};

const MIN_QUERY_LENGTH = 1;
const DEBOUNCE_MS = 300;
const MERCHANDISE_OPTIONS = ["Kaos", "Polo Shirt", "Jaket", "Topi", "Mug"] as const;
const UKURAN_OPTIONS = ["S", "M", "L", "XL", "XXL", "XXXL"] as const;

/** Set ke `true` saat UI siap dan submit boleh dipakai lagi. */
const FORM_SUBMIT_ENABLED = false;

function Page() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement | null>(null);

  const [selected, setSelected] = useState<SearchResult | null>(null);
  const [detail, setDetail] = useState<AlumniDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [thanksMessage, setThanksMessage] = useState<string | null>(null);

  const [formData, setFormData] = useState<FormData>({
    kesibukan: "",
    sosial_media: "",
    email: "",
    domisili: "",
    ikut_reuni: "",
    ide_alumni: "",
    merchandise_vote: "",
  });
  const [merchandiseUI, setMerchandiseUI] = useState<
    Record<(typeof MERCHANDISE_OPTIONS)[number], { checked: boolean; size: string }>
  >({
    Kaos: { checked: false, size: "" },
    "Polo Shirt": { checked: false, size: "" },
    Jaket: { checked: false, size: "" },
    Topi: { checked: false, size: "" },
    Mug: { checked: false, size: "" },
  });
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const trimmedQuery = useMemo(() => query.trim(), [query]);

  useEffect(() => {
    if (trimmedQuery.length < MIN_QUERY_LENGTH) {
      setResults([]);
      setSearchError(null);
      setIsDropdownOpen(false);
      return;
    }

    let cancelled = false;
    setIsSearching(true);
    setSearchError(null);

    const handle = setTimeout(async () => {
      try {
        const response = await fetch(
          `/api/alumni/search?q=${encodeURIComponent(trimmedQuery)}`
        );
        if (!response.ok) {
          throw new Error("Gagal memuat hasil pencarian.");
        }
        const data = (await response.json()) as SearchResult[];
        if (!cancelled) {
          setResults(data);
          setIsDropdownOpen(data.length > 0);
        }
      } catch (error) {
        if (!cancelled) {
          setSearchError(
            error instanceof Error ? error.message : "Gagal memuat hasil."
          );
        }
      } finally {
        if (!cancelled) {
          setIsSearching(false);
        }
      }
    }, DEBOUNCE_MS);

    return () => {
      cancelled = true;
      clearTimeout(handle);
    };
  }, [trimmedQuery]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!searchRef.current) return;
      if (!searchRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!toastMessage) return;
    const timeout = setTimeout(() => setToastMessage(null), 3000);
    return () => clearTimeout(timeout);
  }, [toastMessage]);

  useEffect(() => {
    if (!selected) {
      setDetail(null);
      setDetailError(null);
      return;
    }

    let cancelled = false;
    setDetailLoading(true);
    setDetailError(null);
    setSubmitError(null);
    setThanksMessage(null);

    const fetchDetail = async () => {
      try {
        const response = await fetch(`/api/alumni/${selected.id}`, {
          cache: "no-store",
        });
        if (!response.ok) {
          throw new Error("Gagal memuat detail alumni.");
        }
        const data = (await response.json()) as AlumniDetail;
        if (!cancelled) {
          setDetail(data);
        }
      } catch (error) {
        if (!cancelled) {
          setDetailError(
            error instanceof Error ? error.message : "Gagal memuat detail."
          );
        }
      } finally {
        if (!cancelled) {
          setDetailLoading(false);
        }
      }
    };

    fetchDetail();

    return () => {
      cancelled = true;
    };
  }, [selected]);

  const handleSelect = (item: SearchResult) => {
    setSelected(item);
    setQuery(item.nama);
    setResults([]);
    setIsDropdownOpen(false);
    setDetail(item);
    setDetailError(null);
    setThanksMessage(null);
    setFormData({
      kesibukan: "",
      sosial_media: "",
      email: "",
      domisili: "",
      ikut_reuni: "",
      ide_alumni: "",
      merchandise_vote: "",
    });
    setMerchandiseUI({
      Kaos: { checked: false, size: "" },
      "Polo Shirt": { checked: false, size: "" },
      Jaket: { checked: false, size: "" },
      Topi: { checked: false, size: "" },
      Mug: { checked: false, size: "" },
    });
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!FORM_SUBMIT_ENABLED || !selected || submitLoading) return;

    setSubmitLoading(true);
    setSubmitError(null);
    setThanksMessage(null);

    try {
      const response = await fetch(`/api/alumni/${selected.id}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      let payload: { message?: string } = {};
      try {
        const text = await response.text();
        payload = text ? (JSON.parse(text) as { message?: string }) : {};
      } catch {
        payload = {};
      }

      if (!response.ok) {
        throw new Error(payload.message ?? `Gagal mengirim data (${response.status})`);
      }

      const successMessage = payload.message ?? "Terima kasih atas partisipasinya.";
      setThanksMessage(successMessage);
      setToastMessage("Data berhasil disimpan.");
      setDetail((prev) =>
        prev
          ? {
              ...prev,
              sudahIsi: true,
            }
          : prev
      );
      setSelected((prev) =>
        prev
          ? {
              ...prev,
              sudahIsi: true,
            }
          : prev
      );
      setResults((prev) =>
        prev.map((item) =>
          item.id === selected.id ? { ...item, sudahIsi: true } : item
        )
      );
      setFormData({
        kesibukan: "",
        sosial_media: "",
        email: "",
        domisili: "",
        ikut_reuni: "",
        ide_alumni: "",
        merchandise_vote: "",
      });
      setMerchandiseUI({
        Kaos: { checked: false, size: "" },
        "Polo Shirt": { checked: false, size: "" },
        Jaket: { checked: false, size: "" },
        Topi: { checked: false, size: "" },
        Mug: { checked: false, size: "" },
      });
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : "Gagal mengirim data."
      );
    } finally {
      setSubmitLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-10 sm:px-6">
      <main className="mx-auto flex w-full max-w-4xl flex-col gap-6">
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-500">
            Portal Alumni
          </p>
          <h1 className="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl">
            Pendataan Alumni
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-slate-600 sm:text-base">
            Terima kasih telah meluangkan waktu untuk mengisi data alumni. Data ini
            digunakan untuk mempererat silaturahmi dan persiapan reuni September.
          </p>
        </section>

        <section className="relative rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8" ref={searchRef}>
          <label className="text-sm font-medium text-slate-700" htmlFor="search">
            Cari Nama Alumni
          </label>
          <input
            id="search"
            className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 shadow-sm focus:border-slate-500 focus:outline-none"
            placeholder="Ketik nama, nomor ID, atau konsulat..."
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setSelected(null);
              setThanksMessage(null);
              setDetail(null);
              setIsDropdownOpen(true);
            }}
          />

          {isSearching && (
            <p className="mt-2 text-sm text-slate-500">Mencari data alumni...</p>
          )}
          {searchError && (
            <p className="mt-2 text-sm text-rose-600">{searchError}</p>
          )}

          {isDropdownOpen && results.length > 0 && (
            <div className="absolute left-6 right-6 z-20 mt-2 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
              <ul className="max-h-80 overflow-y-auto py-2">
                {results.map((item) => (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => handleSelect(item)}
                      className="flex w-full items-center justify-between gap-4 px-4 py-3 text-left hover:bg-slate-50"
                    >
                      <span className="text-sm font-medium text-slate-800">
                        {item.nama} - {item.konsulat} - {item.nomorId}
                      </span>
                      <span
                        className={`rounded-full px-2 py-1 text-xs font-semibold ${
                          item.sudahIsi
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-amber-100 text-amber-700"
                        }`}
                      >
                        {item.sudahIsi ? "Sudah Mengisi" : "Belum Mengisi"}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {isDropdownOpen &&
            !isSearching &&
            trimmedQuery.length >= MIN_QUERY_LENGTH &&
            results.length === 0 &&
            !searchError && (
              <div className="absolute left-6 right-6 z-20 mt-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 shadow-lg">
                Data tidak ditemukan. Coba cek ejaan nama, konsulat, atau nomor ID.
              </div>
            )}
        </section>

        {detailLoading && (
          <div className="rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-600 shadow-sm">
            Memuat detail alumni...
          </div>
        )}

        {detailError && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5 text-sm text-rose-700 shadow-sm">
            {detailError}
          </div>
        )}

        {detail && !detailLoading && (
          <section className="space-y-5">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
              <h2 className="text-lg font-semibold text-slate-900 sm:text-xl">
                Data Alumni
              </h2>
              <div className="mt-4 grid gap-3 text-sm text-slate-700">
                <p>
                  <span className="font-semibold">Nama:</span> {detail.nama}
                </p>
                <p>
                  <span className="font-semibold">Nomor Stambuk:</span> {detail.nomorId}
                </p>
                <p>
                  <span className="font-semibold">Konsulat:</span> {detail.konsulat}
                </p>
                <p className="flex items-center gap-2">
                  <span className="font-semibold">Status:</span>
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                      detail.sudahIsi
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-amber-100 text-amber-700"
                    }`}
                  >
                    {detail.sudahIsi ? "Sudah Mengisi" : "Belum Mengisi"}
                  </span>
                </p>
              </div>
            </div>

            {detail.sudahIsi ? (
              <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-6 text-sm text-emerald-700 shadow-sm sm:text-base">
                Data sudah pernah diisi. Terima kasih atas partisipasinya.
              </div>
            ) : (
              <form
                className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8"
                onSubmit={handleSubmit}
              >
                <h3 className="text-lg font-semibold text-slate-900">
                  Form Pendataan Alumni
                </h3>

                <div className="mt-4 grid gap-4">
                  <label className="text-sm text-slate-700">
                    Kesibukan <span className="text-rose-600">*</span>
                    <input
                      className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-900 focus:border-slate-500 focus:outline-none"
                      type="text"
                      value={formData.kesibukan}
                      onChange={(event) =>
                        setFormData((prev) => ({ ...prev, kesibukan: event.target.value }))
                      }
                      required
                    />
                    <span className="text-xs text-slate-500">Contoh: Mahasiswa, Karyawan, Wiraswasta, Lainnya</span>
                  </label>

                  <label className="text-sm text-slate-700">
                    Nomer WhatsApp <span className="text-rose-600">*</span>
                    <input
                      type="text"
                      className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-900 focus:border-slate-500 focus:outline-none"
                      value={formData.sosial_media}
                      onChange={(event) =>
                        setFormData((prev) => ({
                          ...prev,
                          sosial_media: event.target.value,
                        }))
                      }
                    />
                    <span className="text-xs text-slate-500">Contoh: 081234567890</span>
                  </label>

                  <label className="text-sm text-slate-700">
                    Domisili <span className="text-rose-600">*</span>
                    <input
                      className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-900 focus:border-slate-500 focus:outline-none"
                      value={formData.domisili}
                      onChange={(event) =>
                        setFormData((prev) => ({ ...prev, domisili: event.target.value }))
                      }
                      required
                    />
                    <span className="text-xs text-slate-500">Contoh: tempat tinggal saat ini</span>
                  </label>

                  <label className="text-sm text-slate-700">
  Sosial Media

                    <div className="mt-3 space-y-3 rounded-xl border border-slate-300 p-4">
                      {[
                        "Instagram",
                        "TikTok",
                        "X",
                        "LinkedIn",
                      ].map((item) => (
                        <div
                          key={item}
                          className="ml-2 flex flex-col gap-2 sm:flex-row sm:items-center"
                        >
                          <span className="w-28 text-sm text-slate-600">{item}</span>

                          <input
                            type="text"
                            placeholder={`Username / link ${item}`}
                            className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-slate-500 focus:outline-none"
                          />
                        </div>
                      ))}

                      <div className="ml-2 flex flex-col gap-2 sm:flex-row sm:items-center">
                        <span className="w-28 text-sm text-slate-600">Lainnya</span>

                        <input
                          type="text"
                          placeholder="Platform lain yang ingin   dibagikan"
                          className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-slate-500 focus:outline-none"
                        />
                      </div>
                    </div>

                    <span className="mt-2 block text-xs text-slate-500">
                      Isi akun yang berkenan untuk dibagikan kepada sesama alumni.
                    </span>
                  </label>

                  <label className="text-sm text-slate-700">
                    Ikut Reuni <span className="text-rose-600">*</span>
                    <select
                      className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 focus:border-slate-500 focus:outline-none"
                      value={formData.ikut_reuni}
                      onChange={(event) =>
                        setFormData((prev) => ({ ...prev, ikut_reuni: event.target.value }))
                      }
                      required
                    >
                      <option value="">Pilih jawaban</option>
                      <option value="Ya">Ya</option>
                      <option value="Tidak">Tidak</option>
                      <option value="Mungkin">Mungkin</option>
                    </select>
                    <span className="text-xs text-slate-500">Reuni Marhalah 100tahun gontor kemungkinan di bulan september 2026</span>
                  </label>

                  <label className="text-sm text-slate-700">
                    Saran untuk Prestigious Cares
                    <textarea
                      className="mt-2 min-h-24 w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-900 focus:border-slate-500 focus:outline-none"
                      value={formData.ide_alumni}
                      onChange={(event) =>
                        setFormData((prev) => ({ ...prev, ide_alumni: event.target.value }))
                      }
                    />
                    <span className="text-xs text-slate-500">Contoh: Saran apapun sangat berharga untuk kita semua</span>
                  </label>

                  {/*<label className="text-sm text-slate-700">
                    Pilihan Merchandise <span className="text-rose-600">*</span>
                    <select
                      className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 focus:border-slate-500 focus:outline-none"
                      value={formData.merchandise_vote}
                      onChange={(event) =>
                        setFormData((prev) => ({
                          ...prev,
                          merchandise_vote: event.target.value,
                        }))
                      }
                      required
                    >
                      <option value="">Pilih merchandise favorit</option>
                      {MERCHANDISE_OPTIONS.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </label>*/}

                  <label className="text-sm text-slate-700">
                    Pilihan Merchandise
                  </label>
                  <div className="mt-2 rounded-xl border border-slate-300 p-4">
                    <div className="flex flex-wrap gap-4">
                      {["Kaos", "Jaket", "Polo Shirt", "Topi", "Mug"].map((item) => (
                        <label
                          key={item}
                          className="flex items-center gap-2 text-sm text-slate-700"
                        >
                          <input
                            type="checkbox"
                            className="h-4 w-4 rounded border-slate-300"
                          />
                          <span>{item}</span>
                        </label>
                      ))}
                    </div>
                    <span className="text-xs text-slate-500">Harga Merchandise akan diumumkan dengan adanya harga tambahan untuk donasi acara Reuni 100tahun</span>

                    <div className="mt-4">
                      <input
                        type="text"
                        placeholder="Ide merchandise lain..."
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:border-slate-500 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                {submitError && (
                  <p className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                    {submitError}
                  </p>
                )}
                {thanksMessage && (
                  <p className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                    {thanksMessage}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={submitLoading || !FORM_SUBMIT_ENABLED}
                  className="mt-6 inline-flex w-full items-center justify-center rounded-xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400 sm:w-auto"
                >
                  {!FORM_SUBMIT_ENABLED
                    ? "Kirim dinonaktifkan sementara"
                    : submitLoading
                      ? "Menyimpan..."
                      : "Kirim Data"}
                  {/* hapus saat ready */}
                </button>
              </form>
            )}
          </section>
        )}
      </main>

      {toastMessage && (
        <div className="fixed bottom-4 right-4 rounded-xl bg-slate-900 px-4 py-3 text-sm font-medium text-white shadow-lg">
          {toastMessage}
        </div>
      )}
    </div>
  );
}

export default Page;
