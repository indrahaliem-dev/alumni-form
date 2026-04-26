import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

type SubmissionPayload = {
  kesibukan?: string;
  sosial_media?: string;
  domisili?: string;
  ikut_reuni?: string;
  ide_alumni?: string;
  merchandise_vote?: string;
};

export async function POST(
  request: Request,
  { params }: { params: { id: string } | Promise<{ id: string }> }
) {
  const resolvedParams = await Promise.resolve(params);
  const id = resolvedParams?.id;
  if (!id) {
    return NextResponse.json(
      { message: "ID alumni tidak ditemukan" },
      { status: 400 }
    );
  }
  let body: SubmissionPayload | null = null;

  try {
    body = (await request.json()) as SubmissionPayload;
  } catch {
    body = null;
  }

  const alumniId = Number(id);
  if (!Number.isInteger(alumniId)) {
    return NextResponse.json(
      { message: "ID alumni tidak valid" },
      { status: 400 }
    );
  }

  const kesibukan = typeof body?.kesibukan === "string" ? body.kesibukan.trim() : "";
  const sosialMedia =
    typeof body?.sosial_media === "string" ? body.sosial_media.trim() : "";
  const domisili = typeof body?.domisili === "string" ? body.domisili.trim() : "";
  const ikutReuni = typeof body?.ikut_reuni === "string" ? body.ikut_reuni.trim() : "";
  const ideAlumni = typeof body?.ide_alumni === "string" ? body.ide_alumni.trim() : "";
  const merchandiseVote =
    typeof body?.merchandise_vote === "string" ? body.merchandise_vote.trim() : "";

  if (!kesibukan || !domisili || !ikutReuni || !merchandiseVote) {
    return NextResponse.json(
      {
        message:
          "Kesibukan, domisili, ikut reuni, dan pilihan merchandise wajib diisi.",
      },
      { status: 400 }
    );
  }

  const { data: alumni, error: alumniError } = await supabase
    .from("alumni_master")
    .select("id, sudah_isi")
    .eq("id", alumniId)
    .maybeSingle();

  if (alumniError) {
    console.error("Get alumni before submit error:", alumniError);
    return NextResponse.json(
      { message: "Gagal memeriksa data alumni." },
      { status: 500 }
    );
  }

  if (!alumni) {
    return NextResponse.json({ message: "Alumni tidak ditemukan" }, { status: 404 });
  }

  if (alumni.sudah_isi) {
    return NextResponse.json(
      { message: "Data sudah pernah diisi. Terima kasih atas partisipasinya." },
      { status: 409 }
    );
  }

  const { error: insertError } = await supabase.from("alumni_responses").insert({
    alumni_id: alumniId,
    kesibukan,
    sosial_media: sosialMedia,
    domisili,
    ikut_reuni: ikutReuni,
    ide_alumni: ideAlumni,
    merchandise_vote: merchandiseVote,
  });

  if (insertError) {
    console.error("Insert alumni response error:", insertError);
    return NextResponse.json(
      { message: "Terjadi kesalahan saat menyimpan jawaban." },
      { status: 500 }
    );
  }

  const { error: updateError } = await supabase
    .from("alumni_master")
    .update({ sudah_isi: true })
    .eq("id", alumniId);

  if (updateError) {
    console.error("Update sudah_isi error:", updateError);
    return NextResponse.json(
      { message: "Jawaban tersimpan, tetapi status alumni gagal diperbarui." },
      { status: 500 }
    );
  }

  return NextResponse.json(
    { message: "Terima kasih, data alumni berhasil disimpan." },
    { status: 201 }
  );
}
