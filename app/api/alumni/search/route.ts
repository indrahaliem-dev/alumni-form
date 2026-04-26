import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

const MIN_QUERY_LENGTH = 2;
const RESULT_LIMIT = 20;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const qRaw = searchParams.get("q") ?? "";
  const q = qRaw.trim();

  if (q.length < MIN_QUERY_LENGTH) {
    return NextResponse.json([]);
  }

  const { data, error } = await supabase
    .from("alumni_master")
    .select("id, nama, nomor_id, konsulat, sudah_isi")
    .ilike("nama", `%${q}%`)
    .order("nama", { ascending: true })
    .limit(RESULT_LIMIT);

  if (error) {
    console.error("Search alumni error:", error);
    return NextResponse.json(
      { message: "Gagal memuat data alumni." },
      { status: 500 }
    );
  }

  const results = (data ?? []).map((item) => ({
    id: String(item.id),
    nama: item.nama ?? "",
    nomorId: item.nomor_id ?? "",
    konsulat: item.konsulat ?? "",
    sudahIsi: Boolean(item.sudah_isi),
  }));

  return NextResponse.json(results, { status: 200 });
}
