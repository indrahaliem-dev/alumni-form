"use client";

import { useMemo, useState } from "react";

export type DashboardRow = {
  responseId: string;
  alumniId: string;
  nama: string;
  nomorId: string;
  konsulat: string;
  sudahIsi: boolean;
  kesibukan: string;
  whatsapp: string;
  domisili: string;
  ikutReuni: string;
  merchandiseVote: string;
  createdAt: string | null;
};

type SortKey =
  | "nama"
  | "nomorId"
  | "konsulat"
  | "whatsapp"
  | "kesibukan"
  | "domisili"
  | "ikutReuni"
  | "merchandiseVote"
  | "createdAt";
type SortDirection = "asc" | "desc";

function formatDate(value: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export default function DashboardTable({ data }: { data: DashboardRow[] }) {
  const [query, setQuery] = useState("");
  const [konsulatFilter, setKonsulatFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortKey, setSortKey] = useState<SortKey>("createdAt");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  const handleHeaderSort = (nextKey: SortKey) => {
    if (sortKey === nextKey) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
      return;
    }
    setSortKey(nextKey);
    setSortDirection("asc");
  };

  const sortIndicator = (key: SortKey) => {
    if (sortKey !== key) return "↕";
    return sortDirection === "asc" ? "↑" : "↓";
  };

  const konsulatOptions = useMemo(
    () => ["all", ...new Set(data.map((item) => item.konsulat).filter(Boolean))],
    [data]
  );

  const filteredRows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return data.filter((item) => {
      const matchesQuery =
        q.length === 0 ||
        item.nama.toLowerCase().includes(q) ||
        item.nomorId.toLowerCase().includes(q) ||
        item.whatsapp.toLowerCase().includes(q) ||
        item.konsulat.toLowerCase().includes(q);

      const matchesKonsulat =
        konsulatFilter === "all" || item.konsulat === konsulatFilter;

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "sudah" && item.sudahIsi) ||
        (statusFilter === "belum" && !item.sudahIsi);

      return matchesQuery && matchesKonsulat && matchesStatus;
    });
  }, [data, konsulatFilter, query, statusFilter]);

  const sortedRows = useMemo(() => {
    const rows = [...filteredRows];
    rows.sort((a, b) => {
      const dir = sortDirection === "asc" ? 1 : -1;
      if (sortKey === "createdAt") {
        const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return (aTime - bTime) * dir;
      }
      const aValue = (a[sortKey] ?? "").toString().toLowerCase();
      const bValue = (b[sortKey] ?? "").toString().toLowerCase();
      return aValue.localeCompare(bValue) * dir;
    });
    return rows;
  }, [filteredRows, sortDirection, sortKey]);

  return (
    <section className="rounded-3xl border border-birch-200 bg-birch-50 p-6 shadow-sm sm:p-8">
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
        <input
          className="rounded-xl border border-birch-300 bg-birch-50 px-4 py-3 text-sm text-birch-900 focus:border-birch-sage focus:outline-none"
          placeholder="Cari nama / nomor / WA / konsulat"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />

        <select
          className="rounded-xl border border-birch-300 bg-birch-50 px-4 py-3 text-sm text-birch-900 focus:border-birch-sage focus:outline-none"
          value={konsulatFilter}
          onChange={(event) => setKonsulatFilter(event.target.value)}
        >
          {konsulatOptions.map((item) => (
            <option key={item} value={item}>
              {item === "all" ? "Semua Konsulat" : item}
            </option>
          ))}
        </select>

        <select
          className="rounded-xl border border-birch-300 bg-birch-50 px-4 py-3 text-sm text-birch-900 focus:border-birch-sage focus:outline-none"
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
        >
          <option value="all">Semua Status</option>
          <option value="sudah">Sudah Isi</option>
          <option value="belum">Belum Isi</option>
        </select>

        <div className="rounded-xl border border-birch-300 bg-birch-50 px-4 py-3 text-sm text-birch-700">
          Urut dari header kolom tabel
        </div>
      </div>

      <p className="mt-4 text-sm text-birch-600">
        Menampilkan {sortedRows.length} dari {data.length} response.
      </p>

      <div className="mt-4 overflow-x-auto rounded-2xl border border-birch-200">
        <table className="min-w-full text-sm">
          <thead className="bg-birch-100 text-left text-birch-700">
            <tr>
              <th className="px-4 py-3">
                Nama{" "}
                <button type="button" onClick={() => handleHeaderSort("nama")}>
                  {sortIndicator("nama")}
                </button>
              </th>
              <th className="px-4 py-3">
                Nomor ID{" "}
                <button type="button" onClick={() => handleHeaderSort("nomorId")}>
                  {sortIndicator("nomorId")}
                </button>
              </th>
              <th className="px-4 py-3">
                Konsulat{" "}
                <button type="button" onClick={() => handleHeaderSort("konsulat")}>
                  {sortIndicator("konsulat")}
                </button>
              </th>
              <th className="px-4 py-3">
                WA{" "}
                <button type="button" onClick={() => handleHeaderSort("whatsapp")}>
                  {sortIndicator("whatsapp")}
                </button>
              </th>
              <th className="px-4 py-3">
                Kesibukan{" "}
                <button type="button" onClick={() => handleHeaderSort("kesibukan")}>
                  {sortIndicator("kesibukan")}
                </button>
              </th>
              <th className="px-4 py-3">
                Domisili{" "}
                <button type="button" onClick={() => handleHeaderSort("domisili")}>
                  {sortIndicator("domisili")}
                </button>
              </th>
              <th className="px-4 py-3">
                Ikut Reuni{" "}
                <button type="button" onClick={() => handleHeaderSort("ikutReuni")}>
                  {sortIndicator("ikutReuni")}
                </button>
              </th>
              <th className="px-4 py-3">
                Merchandise{" "}
                <button type="button" onClick={() => handleHeaderSort("merchandiseVote")}>
                  {sortIndicator("merchandiseVote")}
                </button>
              </th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">
                Submit Terakhir{" "}
                <button type="button" onClick={() => handleHeaderSort("createdAt")}>
                  {sortIndicator("createdAt")}
                </button>
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedRows.map((item) => (
              <tr key={item.responseId} className="border-t border-birch-200 text-birch-800">
                <td className="px-4 py-3">{item.nama}</td>
                <td className="px-4 py-3">{item.nomorId}</td>
                <td className="px-4 py-3">{item.konsulat}</td>
                <td className="px-4 py-3">{item.whatsapp || "-"}</td>
                <td className="px-4 py-3">{item.kesibukan || "-"}</td>
                <td className="px-4 py-3">{item.domisili || "-"}</td>
                <td className="px-4 py-3">{item.ikutReuni || "-"}</td>
                <td className="px-4 py-3">{item.merchandiseVote || "-"}</td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2 py-1 text-xs font-semibold ${
                      item.sudahIsi
                        ? "bg-birch-success-bg text-birch-success-text"
                        : "bg-birch-warning-bg text-birch-warning-text"
                    }`}
                  >
                    {item.sudahIsi ? "Sudah Isi" : "Belum Isi"}
                  </span>
                </td>
                <td className="px-4 py-3">{formatDate(item.createdAt)}</td>
              </tr>
            ))}
            {sortedRows.length === 0 ? (
              <tr>
                <td className="px-4 py-5 text-birch-600" colSpan={10}>
                  Tidak ada data yang cocok dengan filter.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </section>
  );
}
