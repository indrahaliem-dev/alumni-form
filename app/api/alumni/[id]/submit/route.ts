import { NextResponse } from "next/server";
import {
  isExtendedSchemaUnavailable,
  mergeLegacyMerchandiseVote,
  mergeLegacySosialMedia,
} from "@/lib/alumni-response-legacy";
import { getSupabaseClient } from "@/lib/supabase";
import {
  SUPABASE_TABLE_MASTER,
  SUPABASE_TABLE_RESPONSES,
} from "@/lib/supabase-schema";

type SubmissionPayload = {
  kesibukan?: string;
  /** Nomor WhatsApp (nama field lama di form). */
  sosial_media?: string;
  whatsapp?: string;
  instagram?: string;
  tiktok?: string;
  twitter?: string;
  linkedin?: string;
  sosial_lainnya?: string;
  domisili?: string;
  ikut_reuni?: string;
  ide_alumni?: string;
  /** Hanya daftar merchandise terpilih, dipisah koma. */
  merchandise_vote?: string;
  merchandise_ide_lain?: string;
};

function trimStr(v: unknown): string {
  return typeof v === "string" ? v.trim() : "";
}

export async function POST(
  request: Request,
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

  const kesibukan = trimStr(body?.kesibukan);
  const whatsapp =
    trimStr(body?.whatsapp) || trimStr(body?.sosial_media);
  const instagram = trimStr(body?.instagram);
  const tiktok = trimStr(body?.tiktok);
  const twitter = trimStr(body?.twitter);
  const linkedin = trimStr(body?.linkedin);
  const sosialLainnya = trimStr(body?.sosial_lainnya);
  const domisili = trimStr(body?.domisili);
  const ikutReuni = trimStr(body?.ikut_reuni);
  const ideAlumni = trimStr(body?.ide_alumni);
  const merchandiseVote = trimStr(body?.merchandise_vote);
  const merchandiseIdeLain = trimStr(body?.merchandise_ide_lain);

  if (!kesibukan || !domisili || !ikutReuni) {
    return NextResponse.json(
      {
        message: "Kesibukan, domisili, dan ikut reuni wajib diisi.",
      },
      { status: 400 }
    );
  }

  if (!merchandiseVote && !merchandiseIdeLain) {
    return NextResponse.json(
      {
        message:
          "Pilih minimal satu merchandise atau isi ide merchandise lain.",
      },
      { status: 400 }
    );
  }

  const responses = SUPABASE_TABLE_RESPONSES;

  const extendedRow = {
    kesibukan,
    whatsapp,
    instagram,
    tiktok,
    twitter,
    linkedin,
    sosial_lainnya: sosialLainnya,
    domisili,
    ikut_reuni: ikutReuni,
    ide_alumni: ideAlumni,
    merchandise_vote: merchandiseVote,
    merchandise_ide_lain: merchandiseIdeLain,
  };

  const legacyRow = {
    kesibukan,
    sosial_media: mergeLegacySosialMedia({
      whatsapp,
      instagram,
      tiktok,
      twitter,
      linkedin,
      sosial_lainnya: sosialLainnya,
    }),
    domisili,
    ikut_reuni: ikutReuni,
    ide_alumni: ideAlumni,
    merchandise_vote: mergeLegacyMerchandiseVote(
      merchandiseVote,
      merchandiseIdeLain
    ),
  };

  const { data: alumni, error: alumniError } = await supabase
    .from(SUPABASE_TABLE_MASTER)
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
    let { data: updatedRows, error: updateError } = await supabase
      .from(responses)
      .update(extendedRow)
      .eq("alumni_id", alumniId)
      .select("id");

    if (updateError && isExtendedSchemaUnavailable(updateError)) {
      console.warn(
        "[alumni/submit] Skema perluasan tidak tersedia, memakai update format lama:",
        updateError.message
      );
      const second = await supabase
        .from(responses)
        .update(legacyRow)
        .eq("alumni_id", alumniId)
        .select("id");
      updatedRows = second.data;
      updateError = second.error;
    }

    if (updateError) {
      console.error("Update alumni response error:", updateError);
      return NextResponse.json(
        { message: "Terjadi kesalahan saat memperbarui jawaban." },
        { status: 500 }
      );
    }

    if (!updatedRows?.length) {
      return NextResponse.json(
        {
          message:
            "Status alumni sudah terisi, tetapi baris jawaban tidak ditemukan. Hubungi admin.",
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { message: "Data alumni berhasil diperbarui. Terima kasih." },
      { status: 200 }
    );
  }

  let { error: insertError } = await supabase.from(responses).insert({
    alumni_id: alumniId,
    ...extendedRow,
  });

  if (insertError && isExtendedSchemaUnavailable(insertError)) {
    console.warn(
      "[alumni/submit] Skema perluasan tidak tersedia, memakai insert format lama:",
      insertError.message
    );
    const second = await supabase.from(responses).insert({
      alumni_id: alumniId,
      ...legacyRow,
    });
    insertError = second.error;
  }

  if (insertError) {
    console.error("Insert alumni response error:", insertError);
    return NextResponse.json(
      {
        message:
          insertError.message?.includes("row-level security") ||
          insertError.message?.toLowerCase().includes("rls")
            ? "Akses ditolak oleh kebijakan database (RLS). Periksa policy Supabase untuk anon."
            : "Terjadi kesalahan saat menyimpan jawaban.",
      },
      { status: 500 }
    );
  }

  const { error: updateError } = await supabase
    .from(SUPABASE_TABLE_MASTER)
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
