import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase";
import {
  SUPABASE_TABLE_MASTER,
  SUPABASE_TABLE_RESPONSES,
} from "@/lib/supabase-schema";

const MIN_QUERY_LENGTH = 1;
const RESULT_LIMIT = 20;

export async function GET(request: NextRequest) {
  let supabase;
  try {
    supabase = getSupabaseServerClient();
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error ? error.message : "Konfigurasi Supabase belum lengkap.",
      },
      { status: 500 }
    );
  }

  const { searchParams } = new URL(request.url);
  const qRaw = searchParams.get("q") ?? "";
  const q = qRaw.trim();

  if (q.length < MIN_QUERY_LENGTH) {
    return NextResponse.json([]);
  }

  const { data, error } = await supabase
    .from(SUPABASE_TABLE_MASTER)
    .select("id, nama, nomor_id, konsulat, sudah_isi")
    .or(`nama.ilike.%${q}%,nomor_id.ilike.%${q}%,konsulat.ilike.%${q}%`)
    .order("nama", { ascending: true })
    .limit(RESULT_LIMIT);

  if (error) {
    console.error("Search alumni error:", error);
    return NextResponse.json(
      { message: "Gagal memuat data marhalah." },
      { status: 500 }
    );
  }

  const masterRows = data ?? [];
  const alumniIdsNumeric = [
    ...new Set(
      masterRows
        .map((item) => Number(item.id))
        .filter((n) => Number.isSafeInteger(n))
    ),
  ];

  /** Siapa saja yang punya baris di `alumni_responses` (kunci `alumni_id` → master `id`). */
  const alumniIdWithResponse = new Set<string>();
  if (alumniIdsNumeric.length > 0) {
    const { data: responseRows, error: responseError } = await supabase
      .from(SUPABASE_TABLE_RESPONSES)
      .select("alumni_id")
      .in("alumni_id", alumniIdsNumeric);

    if (responseError) {
      console.error("Search alumni_responses (badge) error:", responseError);
    } else {
      for (const row of responseRows ?? []) {
        const aid = row.alumni_id;
        if (aid !== null && aid !== undefined) {
          alumniIdWithResponse.add(String(aid));
        }
      }
    }
  }

  const results = masterRows.map((item) => ({
    id: String(item.id),
    nama: item.nama ?? "",
    nomorId: item.nomor_id ?? "",
    konsulat: item.konsulat ?? "",
    sudahIsi: Boolean(item.sudah_isi),
    punyaRiwayatJawaban: alumniIdWithResponse.has(String(item.id)),
  }));

  return NextResponse.json(results, { status: 200 });
}
