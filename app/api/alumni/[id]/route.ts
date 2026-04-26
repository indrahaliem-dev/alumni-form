import { NextResponse } from "next/server";
import { getSupabaseClient } from "@/lib/supabase";

export async function GET(
  _req: Request,
  { params }: { params: { id: string } | Promise<{ id: string }> }
) {
  let supabase;
  try {
    supabase = getSupabaseClient();
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
    return NextResponse.json({ message: "ID alumni tidak ditemukan" }, { status: 400 });
  }

  const alumniId = Number(id);
  if (!Number.isInteger(alumniId)) {
    return NextResponse.json({ message: "ID alumni tidak valid" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("alumni_master")
    .select("id, nama, nomor_id, konsulat, sudah_isi")
    .eq("id", alumniId)
    .maybeSingle();

  if (error) {
    console.error("Get alumni detail error:", error);
    return NextResponse.json(
      { message: "Gagal memuat detail alumni." },
      { status: 500 }
    );
  }

  if (!data) {
    return NextResponse.json({ message: "Data alumni tidak ditemukan" }, { status: 404 });
  }

  return NextResponse.json({
    id: String(data.id),
    nama: data.nama ?? "",
    nomorId: data.nomor_id ?? "",
    konsulat: data.konsulat ?? "",
    sudahIsi: Boolean(data.sudah_isi),
  });
}
