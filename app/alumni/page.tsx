"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import type { JawabanTerakhirClient as JawabanTerakhir } from "@/lib/alumni-jawaban";

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
  jawabanTerakhir: JawabanTerakhir | null;
};

type FormData = {
  kesibukan: string;
  sosial_media: string;
  sosial_lainnya: string;
  instagram: string;
  tiktok: string;
  twitter: string;
  linkedin: string;
  domisili: string;
  ikut_reuni: string;
  ide_alumni: string;
  merchandise_vote: string;
  merchandise_ide_lain: string;
};

const MIN_QUERY_LENGTH = 1;
const DEBOUNCE_MS = 300;
const MERCHANDISE_OPTIONS = ["Kaos", "Polo Shirt", "Jaket", "Topi", "Mug"] as const;

type MerchKey = (typeof MERCHANDISE_OPTIONS)[number];

function emptyMerchandiseSelections(): Record<MerchKey, boolean> {
  return MERCHANDISE_OPTIONS.reduce(
    (acc, key) => {
      acc[key] = false;
      return acc;
    },
    {} as Record<MerchKey, boolean>
  );
}

function buildMerchandisePilihanCsv(selections: Record<MerchKey, boolean>): string {
  return MERCHANDISE_OPTIONS.filter((k) => selections[k]).join(", ");
}

/** Membalikkan format gabungan WA + `Label: nilai` yang disimpan di kolom sosial_media. */
function parseStoredSosialMedia(combined: string): Pick<
  FormData,
  "sosial_media" | "instagram" | "tiktok" | "twitter" | "linkedin" | "sosial_lainnya"
> {
  const out = {
    sosial_media: "",
    instagram: "",
    tiktok: "",
    twitter: "",
    linkedin: "",
    sosial_lainnya: "",
  };
  const trimmed = combined.trim();
  if (!trimmed) return out;

  const prefixes = [
    ["Instagram:", "instagram"],
    ["TikTok:", "tiktok"],
    ["X:", "twitter"],
    ["LinkedIn:", "linkedin"],
    ["Lainnya:", "sosial_lainnya"],
  ] as const;

  for (const part of trimmed.split(" | ")) {
    const p = part.trim();
    if (!p) continue;
    let labeled = false;
    for (const [prefix, key] of prefixes) {
      if (p.startsWith(prefix)) {
        out[key] = p.slice(prefix.length).trim();
        labeled = true;
        break;
      }
    }
    if (!labeled) {
      out.sosial_media = out.sosial_media ? `${out.sosial_media} | ${p}` : p;
    }
  }
  return out;
}

function parseMerchandiseSelectionsOnly(vote: string): Record<MerchKey, boolean> {
  const selections = emptyMerchandiseSelections();
  const trimmed = vote.trim();
  if (!trimmed) return selections;

  const marker = "Ide lain:";
  const mainPart = trimmed.includes(marker)
    ? trimmed.slice(0, trimmed.indexOf(marker)).replace(/,\s*$/, "").trim()
    : trimmed;
  if (!mainPart) return selections;

  for (const token of mainPart.split(", ").map((t) => t.trim()).filter(Boolean)) {
    if ((MERCHANDISE_OPTIONS as readonly string[]).includes(token)) {
      selections[token as MerchKey] = true;
    }
  }
  return selections;
}

function extractIdeFromMerchandiseVote(vote: string): string {
  const trimmed = vote.trim();
  const marker = "Ide lain:";
  const idx = trimmed.indexOf(marker);
  if (idx === -1) return "";
  return trimmed.slice(idx + marker.length).trim();
}

function jawabanToFormData(j: JawabanTerakhir): {
  form: FormData;
  selections: Record<MerchKey, boolean>;
} {
  let sosial_media = j.whatsapp;
  let instagram = j.instagram;
  let tiktok = j.tiktok;
  let twitter = j.twitter;
  let linkedin = j.linkedin;
  let sosial_lainnya = j.sosialLainnya;

  if (j.sosialMediaLegacy) {
    const parsed = parseStoredSosialMedia(j.sosialMediaLegacy);
    if (!sosial_media.trim()) sosial_media = parsed.sosial_media;
    if (!instagram.trim()) instagram = parsed.instagram;
    if (!tiktok.trim()) tiktok = parsed.tiktok;
    if (!twitter.trim()) twitter = parsed.twitter;
    if (!linkedin.trim()) linkedin = parsed.linkedin;
    if (!sosial_lainnya.trim()) sosial_lainnya = parsed.sosial_lainnya;
  }

  const selections = parseMerchandiseSelectionsOnly(j.merchandiseVote);
  const ideLain =
    (j.merchandiseIdeLain ?? "").trim() || extractIdeFromMerchandiseVote(j.merchandiseVote);

  return {
    form: {
      kesibukan: j.kesibukan,
      sosial_media,
      sosial_lainnya,
      instagram,
      tiktok,
      twitter,
      linkedin,
      domisili: j.domisili,
      ikut_reuni: j.ikutReuni,
      ide_alumni: j.ideAlumni,
      merchandise_vote: "",
      merchandise_ide_lain: ideLain,
    },
    selections,
  };
}

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
    sosial_lainnya: "",
    instagram: "",
    tiktok: "",
    twitter: "",
    linkedin: "",
    domisili: "",
    ikut_reuni: "",
    ide_alumni: "",
    merchandise_vote: "",
    merchandise_ide_lain: "",
  });
  const [merchandiseSelections, setMerchandiseSelections] = useState<
    Record<MerchKey, boolean>
  >(() => emptyMerchandiseSelections());
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

  /** Isi form dari jawaban terakhir di Supabase (setelah nama dipilih & detail termuat). */
  useEffect(() => {
    if (!detail || !selected || detail.id !== selected.id) return;
    if (detailLoading) return;
    if (!detail.jawabanTerakhir) return;
    const { form, selections } = jawabanToFormData(detail.jawabanTerakhir);
    setFormData(form);
    setMerchandiseSelections(selections);
  }, [detail, selected, detailLoading]);

  const refetchAlumniDetail = async () => {
    if (!selected) return;
    try {
      const response = await fetch(`/api/alumni/${selected.id}`, {
        cache: "no-store",
      });
      if (response.ok) {
        const data = (await response.json()) as AlumniDetail;
        setDetail(data);
      }
    } catch {
      /* biarkan detail lama */
    }
  };

  const handleSelect = (item: SearchResult) => {
    setSelected(item);
    setQuery(item.nama);
    setResults([]);
    setIsDropdownOpen(false);
    setDetail({
      id: item.id,
      nama: item.nama,
      nomorId: item.nomorId,
      konsulat: item.konsulat,
      sudahIsi: item.sudahIsi,
      jawabanTerakhir: null,
    });
    setDetailError(null);
    setThanksMessage(null);
    setFormData({
      kesibukan: "",
      sosial_media: "",
      sosial_lainnya: "",
      instagram: "",
      tiktok: "",
      twitter: "",
      linkedin: "",
      domisili: "",
      ikut_reuni: "",
      ide_alumni: "",
      merchandise_vote: "",
      merchandise_ide_lain: "",
    });
    setMerchandiseSelections(emptyMerchandiseSelections());
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!FORM_SUBMIT_ENABLED || !selected || submitLoading) return;

    const merchandise_vote = buildMerchandisePilihanCsv(merchandiseSelections);
    const merchandise_ide_lain = formData.merchandise_ide_lain.trim();
    if (!merchandise_vote && !merchandise_ide_lain) {
      setSubmitError(
        "Pilih minimal satu merchandise atau isi ide merchandise lain."
      );
      return;
    }

    setSubmitLoading(true);
    setSubmitError(null);
    setThanksMessage(null);

    try {
      const response = await fetch(`/api/alumni/${selected.id}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kesibukan: formData.kesibukan,
          sosial_media: formData.sosial_media,
          instagram: formData.instagram,
          tiktok: formData.tiktok,
          twitter: formData.twitter,
          linkedin: formData.linkedin,
          sosial_lainnya: formData.sosial_lainnya,
          domisili: formData.domisili,
          ikut_reuni: formData.ikut_reuni,
          ide_alumni: formData.ide_alumni,
          merchandise_vote,
          merchandise_ide_lain,
        }),
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
      await refetchAlumniDetail();
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : "Gagal mengirim data."
      );
    } finally {
      setSubmitLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-birch-100 px-4 py-10 sm:px-6">
      <main className="mx-auto flex w-full max-w-4xl flex-col gap-6">
        <section className="rounded-3xl border border-birch-200 bg-birch-50 p-6 shadow-sm sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-birch-500">
            Portal Alumni
          </p>
          <h1 className="mt-2 text-2xl font-bold text-birch-900 sm:text-3xl">
            Pendataan Alumni
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-birch-600 sm:text-base">
            Terima kasih telah meluangkan waktu untuk mengisi data alumni. Data ini
            digunakan untuk mempererat silaturahmi dan persiapan reuni September.
          </p>
        </section>

        <section className="relative rounded-3xl border border-birch-200 bg-birch-50 p-6 shadow-sm sm:p-8" ref={searchRef}>
          <label className="text-sm font-medium text-birch-700" htmlFor="search">
            Cari Nama Alumni
          </label>
          <input
            id="search"
            className="mt-2 w-full rounded-xl border border-birch-300 bg-birch-50 px-4 py-3 text-birch-900 shadow-sm focus:border-birch-sage focus:outline-none"
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
            <p className="mt-2 text-sm text-birch-500">Mencari data alumni...</p>
          )}
          {searchError && (
            <p className="mt-2 text-sm text-birch-terracotta">{searchError}</p>
          )}

          {isDropdownOpen && results.length > 0 && (
            <div className="absolute left-6 right-6 z-20 mt-2 overflow-hidden rounded-xl border border-birch-200 bg-birch-50 shadow-lg">
              <ul className="max-h-80 overflow-y-auto py-2">
                {results.map((item) => (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => handleSelect(item)}
                      className="flex w-full items-center justify-between gap-4 px-4 py-3 text-left hover:bg-birch-100"
                    >
                      <span className="text-sm font-medium text-birch-800">
                        {item.nama} - {item.konsulat} - {item.nomorId}
                      </span>
                      <span
                        className={`rounded-full px-2 py-1 text-xs font-semibold ${
                          item.sudahIsi
                            ? "bg-birch-success-bg text-birch-success-text"
                            : "bg-birch-warning-bg text-birch-warning-text"
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
              <div className="absolute left-6 right-6 z-20 mt-2 rounded-xl border border-birch-200 bg-birch-50 px-4 py-3 text-sm text-birch-600 shadow-lg">
                Data tidak ditemukan. Coba cek ejaan nama, konsulat, atau nomor ID.
              </div>
            )}
        </section>

        {detailLoading && (
          <div className="rounded-2xl border border-birch-200 bg-birch-50 p-5 text-sm text-birch-600 shadow-sm">
            Memuat detail alumni...
          </div>
        )}

        {detailError && (
          <div className="rounded-2xl border border-birch-danger-border bg-birch-danger-bg p-5 text-sm text-birch-danger-text shadow-sm">
            {detailError}
          </div>
        )}

        {detail && !detailLoading && (
          <section className="space-y-5">
            <div className="rounded-3xl border border-birch-200 bg-birch-50 p-6 shadow-sm sm:p-8">
              <h2 className="text-lg font-semibold text-birch-900 sm:text-xl">
                Data Alumni
              </h2>
              <div className="mt-4 grid gap-3 text-sm text-birch-700">
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
                        ? "bg-birch-success-bg text-birch-success-text"
                        : "bg-birch-warning-bg text-birch-warning-text"
                    }`}
                  >
                    {detail.sudahIsi ? "Sudah Mengisi" : "Belum Mengisi"}
                  </span>
                </p>
              </div>
            </div>

            {detail.jawabanTerakhir && (
              <div className="rounded-3xl border border-birch-info-border bg-birch-info-bg p-5 text-sm text-birch-info-text shadow-sm sm:text-base">
                Form di bawah sudah <strong>diisi otomatis dari Supabase</strong> (data
                respons terakhir untuk nama ini). Silakan lanjutkan seperti mengisi biasa:
                periksa, lengkapi, atau ubah isian lalu simpan.
              </div>
            )}
            {detail.sudahIsi && !detail.jawabanTerakhir && (
              <div className="rounded-3xl border border-birch-warning-border bg-birch-warning-bg p-5 text-sm text-birch-warning-text shadow-sm sm:text-base">
                Status menunjukkan sudah mengisi, tetapi riwayat jawaban tidak ditemukan di
                server. Silakan lengkapi formulir lalu simpan (atau hubungi admin).
              </div>
            )}

            <form
              className="rounded-3xl border border-birch-200 bg-birch-50 p-6 shadow-sm sm:p-8"
              onSubmit={handleSubmit}
            >
              <h3 className="text-lg font-semibold text-birch-900">
                Form Pendataan Alumni
              </h3>

                <div className="mt-4 grid gap-4">
                  <label className="text-sm text-birch-700">
                    Kesibukan <span className="text-birch-terracotta">*</span>
                    <input
                      className="mt-2 w-full rounded-xl border border-birch-300 px-4 py-3 text-birch-900 focus:border-birch-sage focus:outline-none"
                      type="text"
                      value={formData.kesibukan}
                      onChange={(event) =>
                        setFormData((prev) => ({ ...prev, kesibukan: event.target.value }))
                      }
                      required
                    />
                    <span className="text-xs text-birch-500">Contoh: Mahasiswa, Karyawan, Wiraswasta, Lainnya</span>
                  </label>

                  <label className="text-sm text-birch-700">
                    Nomer WhatsApp <span className="text-birch-terracotta">*</span>
                    <input
                      type="text"
                      required
                      className="mt-2 w-full rounded-xl border border-birch-300 px-4 py-3 text-birch-900 focus:border-birch-sage focus:outline-none"
                      value={formData.sosial_media}
                      onChange={(event) =>
                        setFormData((prev) => ({
                          ...prev,
                          sosial_media: event.target.value,
                        }))
                      }
                    />
                    <span className="text-xs text-birch-500">Contoh: 081234567890</span>
                  </label>

                  <label className="text-sm text-birch-700">
                    Domisili <span className="text-birch-terracotta">*</span>
                    <input
                      className="mt-2 w-full rounded-xl border border-birch-300 px-4 py-3 text-birch-900 focus:border-birch-sage focus:outline-none"
                      value={formData.domisili}
                      onChange={(event) =>
                        setFormData((prev) => ({ ...prev, domisili: event.target.value }))
                      }
                      required
                    />
                    <span className="text-xs text-birch-500">Contoh: tempat tinggal saat ini</span>
                  </label>

                  <label className="text-sm text-birch-700">
                    Sosial Media

                    <div className="mt-3 space-y-3 rounded-xl border border-birch-300 p-4">
                      {(
                        [
                          { label: "Instagram", field: "instagram" as const },
                          { label: "TikTok", field: "tiktok" as const },
                          { label: "X", field: "twitter" as const },
                          { label: "LinkedIn", field: "linkedin" as const },
                        ] as const
                      ).map(({ label, field }) => (
                        <div
                          key={field}
                          className="ml-2 flex flex-col gap-2 sm:flex-row sm:items-center"
                        >
                          <span className="w-28 text-sm text-birch-600">{label}</span>

                          <input
                            type="text"
                            placeholder={`Username / link ${label}`}
                            value={formData[field]}
                            onChange={(event) =>
                              setFormData((prev) => ({
                                ...prev,
                                [field]: event.target.value,
                              }))
                            }
                            className="flex-1 rounded-lg border border-birch-300 px-3 py-2 text-sm text-birch-900 focus:border-birch-sage focus:outline-none"
                          />
                        </div>
                      ))}

                      <div className="ml-2 flex flex-col gap-2 sm:flex-row sm:items-center">
                        <span className="w-28 text-sm text-birch-600">Lainnya</span>

                        <input
                          type="text"
                          placeholder="Platform lain yang ingin dibagikan"
                          value={formData.sosial_lainnya}
                          onChange={(event) =>
                            setFormData((prev) => ({
                              ...prev,
                              sosial_lainnya: event.target.value,
                            }))
                          }
                          className="flex-1 rounded-lg border border-birch-300 px-3 py-2 text-sm text-birch-900 focus:border-birch-sage focus:outline-none"
                        />
                      </div>
                    </div>

                    <span className="mt-2 block text-xs text-birch-500">
                      Isi akun yang berkenan untuk dibagikan kepada sesama alumni.
                    </span>
                  </label>

                  <label className="text-sm text-birch-700">
                    Ikut Reuni <span className="text-birch-terracotta">*</span>
                    <select
                      className="mt-2 w-full rounded-xl border border-birch-300 bg-birch-50 px-4 py-3 text-birch-900 focus:border-birch-sage focus:outline-none"
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
                    <span className="text-xs text-birch-500">Reuni Marhalah 100tahun gontor kemungkinan di bulan september 2026</span>
                  </label>

                  <label className="text-sm text-birch-700">
                    Saran untuk Prestigious Cares
                    <textarea
                      className="mt-2 min-h-24 w-full rounded-xl border border-birch-300 px-4 py-3 text-birch-900 focus:border-birch-sage focus:outline-none"
                      value={formData.ide_alumni}
                      onChange={(event) =>
                        setFormData((prev) => ({ ...prev, ide_alumni: event.target.value }))
                      }
                    />
                    <span className="text-xs text-birch-500">Contoh: Saran apapun sangat berharga untuk kita semua</span>
                  </label>

                  {/*<label className="text-sm text-birch-700">
                    Pilihan Merchandise <span className="text-birch-terracotta">*</span>
                    <select
                      className="mt-2 w-full rounded-xl border border-birch-300 bg-birch-50 px-4 py-3 text-birch-900 focus:border-birch-sage focus:outline-none"
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

                  <label className="text-sm text-birch-700">
                    Pilihan Merchandise <span className="text-birch-terracotta">*</span>
                  </label>
                  <div className="mt-2 rounded-xl border border-birch-300 p-4">
                    <div className="flex flex-wrap gap-4">
                      {MERCHANDISE_OPTIONS.map((item) => (
                        <label
                          key={item}
                          className="flex items-center gap-2 text-sm text-birch-700"
                        >
                          <input
                            type="checkbox"
                            checked={merchandiseSelections[item]}
                            onChange={(event) =>
                              setMerchandiseSelections((prev) => ({
                                ...prev,
                                [item]: event.target.checked,
                              }))
                            }
                            className="h-4 w-4 rounded border-birch-300"
                          />
                          <span>{item}</span>
                        </label>
                      ))}
                    </div>
                    <span className="text-xs text-birch-500">
                      Harga Merchandise akan diumumkan dengan adanya harga tambahan untuk donasi
                      acara Reuni 100tahun. Pilih minimal satu opsi atau isi ide di bawah.
                    </span>

                    <div className="mt-4">
                      <input
                        type="text"
                        placeholder="Ide merchandise lain..."
                        value={formData.merchandise_ide_lain}
                        onChange={(event) =>
                          setFormData((prev) => ({
                            ...prev,
                            merchandise_ide_lain: event.target.value,
                          }))
                        }
                        className="w-full rounded-lg border border-birch-300 px-3 py-2 text-sm text-birch-700 focus:border-birch-sage focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                {submitError && (
                  <p className="mt-4 rounded-xl border border-birch-danger-border bg-birch-danger-bg px-4 py-3 text-sm text-birch-danger-text">
                    {submitError}
                  </p>
                )}
                {thanksMessage && (
                  <p className="mt-4 rounded-xl border border-birch-success-border bg-birch-success-bg px-4 py-3 text-sm text-birch-success-text">
                    {thanksMessage}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={submitLoading || !FORM_SUBMIT_ENABLED}
                  className="mt-6 inline-flex w-full items-center justify-center rounded-xl bg-birch-bark px-6 py-3 text-sm font-semibold text-birch-50 transition hover:bg-birch-800 disabled:cursor-not-allowed disabled:bg-birch-300 sm:w-auto"
                >
                  {!FORM_SUBMIT_ENABLED
                    ? "Kirim dinonaktifkan sementara"
                    : submitLoading
                      ? "Menyimpan..."
                      : "Kirim Data"}
                  {/* hapus saat ready */}
                </button>
              </form>
          </section>
        )}
      </main>

      {toastMessage && (
        <div className="fixed bottom-4 right-4 rounded-xl bg-birch-bark px-4 py-3 text-sm font-medium text-birch-50 shadow-lg">
          {toastMessage}
        </div>
      )}
    </div>
  );
}

export default Page;
