import { NextResponse } from "next/server";
import { ALUMNI_RESPONSE_SELECT, alumniResponseRowToClient } from "@/lib/alumni-jawaban";
import { getSupabaseServerClient } from "@/lib/supabase";
import { SUPABASE_TABLE_MASTER, SUPABASE_TABLE_RESPONSES } from "@/lib/supabase-schema";

export async function GET(
  _req: Request,
  { params }: { params: { id: string } | Promise<{ id: string }> }
) {
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

  const resolvedParams = await Promise.resolve(params);
  const id = resolvedParams?.id;
  if (!id) {
    return NextResponse.json({ message: "ID marhalah tidak ditemukan" }, { status: 400 });
  }

  const alumniId = Number(id);
  if (!Number.isInteger(alumniId)) {
    return NextResponse.json({ message: "ID marhalah tidak valid" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from(SUPABASE_TABLE_MASTER)
    .select("id, nama, nomor_id, konsulat, sudah_isi")
    .eq("id", alumniId)
    .maybeSingle();

  if (error) {
    console.error("Get alumni detail error:", error);
    return NextResponse.json(
      { message: "Gagal memuat detail marhalah." },
      { status: 500 }
    );
  }

  if (!data) {
    return NextResponse.json({ message: "Data marhalah tidak ditemukan" }, { status: 404 });
  }

  const { data: responseRows, error: responseError } = await supabase
    .from(SUPABASE_TABLE_RESPONSES)
    .select(ALUMNI_RESPONSE_SELECT)
    .eq("alumni_id", alumniId)
    .order("id", { ascending: false })
    .limit(1);

  let jawabanTerakhir = null as ReturnType<typeof alumniResponseRowToClient> | null;
  const responseRow = Array.isArray(responseRows) ? responseRows[0] : null;

  if (responseError) {
    console.error("Get alumni response error (form tetap dibuka, tanpa prapengisian):", responseError);
  } else if (responseRow) {
    jawabanTerakhir = alumniResponseRowToClient(responseRow);
  }

  return NextResponse.json({
    id: String(data.id),
    nama: data.nama ?? "",
    nomorId: data.nomor_id ?? "",
    konsulat: data.konsulat ?? "",
    sudahIsi: Boolean(data.sudah_isi),
    jawabanTerakhir,
    /** True bila query `alumni_responses` gagal (sering karena RLS + hanya anon key di server). */
    responsesQueryFailed: Boolean(responseError),
  });
}
