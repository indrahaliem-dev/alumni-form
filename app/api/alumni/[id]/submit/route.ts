import { NextResponse } from "next/server";
import {
  isExtendedSchemaUnavailable,
  mergeLegacyMerchandiseVote,
  mergeLegacySosialMedia,
} from "@/lib/alumni-response-legacy";
import { getSupabaseServerClient } from "@/lib/supabase";
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
    return NextResponse.json(
      { message: "ID marhalah tidak ditemukan" },
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
      { message: "ID marhalah tidak valid" },
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

  const sosialMediaGabungan = mergeLegacySosialMedia({
    instagram,
    tiktok,
    twitter,
    linkedin,
    sosial_lainnya: sosialLainnya,
  });

  /** Hanya untuk DB tanpa kolom `whatsapp` / terpisah: WA tetap digabung ke `sosial_media`. */
  const sosialMediaLegacySchema = (() => {
    const base = sosialMediaGabungan;
    const wa = whatsapp.trim();
    if (!base) return wa;
    return wa ? `${wa} | ${base}` : base;
  })();

  const extendedRow = {
    kesibukan,
    whatsapp,
    instagram,
    tiktok,
    twitter,
    linkedin,
    sosial_lainnya: sosialLainnya,
    /** Tanpa nomor WA; WA hanya di `whatsapp`. */
    sosial_media: sosialMediaGabungan,
    domisili,
    ikut_reuni: ikutReuni,
    ide_alumni: ideAlumni,
    merchandise_vote: merchandiseVote,
    merchandise_ide_lain: merchandiseIdeLain,
  };

  const legacyRow = {
    kesibukan,
    sosial_media: sosialMediaLegacySchema,
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
      { message: "Gagal memeriksa data marhalah." },
      { status: 500 }
    );
  }

  if (!alumni) {
    return NextResponse.json({ message: "Data marhalah tidak ditemukan" }, { status: 404 });
  }

  const { count: responseCount, error: countError } = await supabase
    .from(responses)
    .select("*", { count: "exact", head: true })
    .eq("alumni_id", alumniId);

  if (countError) {
    console.error("Count alumni responses before submit:", countError);
    return NextResponse.json(
      { message: "Gagal memeriksa data jawaban." },
      { status: 500 }
    );
  }

  const hasResponse = (responseCount ?? 0) > 0;

  /** Resmi selesai: master `sudah_isi` dan sudah ada jawaban — tidak boleh ubah lagi. */
  if (alumni.sudah_isi && hasResponse) {
    return NextResponse.json(
      {
        message:
          "Form pendataan untuk marhalah ini sudah dikirim. Pengisian ulang tidak diperlukan.",
      },
      { status: 403 }
    );
  }

  /**
   * Orphan: `sudah_isi` true di master tapi belum ada baris respons (impor/manual).
   * Satu kali insert perbaikan — tanpa mengubah `sudah_isi` (tetap true).
   */
  if (alumni.sudah_isi) {
    let { error: healInsertError } = await supabase.from(responses).insert({
      alumni_id: alumniId,
      ...extendedRow,
    });

    if (healInsertError && isExtendedSchemaUnavailable(healInsertError)) {
      const healed = await supabase.from(responses).insert({
        alumni_id: alumniId,
        ...legacyRow,
      });
      healInsertError = healed.error;
    }

    if (healInsertError) {
      console.error("[alumni/submit] Orphan sudah_isi: insert jawaban gagal:", healInsertError);
      return NextResponse.json(
        {
          message:
            healInsertError.message?.includes("row-level security") ||
            healInsertError.message?.toLowerCase().includes("rls")
              ? "Akses ditolak oleh kebijakan database (RLS). Periksa policy Supabase untuk anon."
              : "Gagal menyimpan jawaban. Hubungi admin.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: "Data marhalah berhasil disimpan. Terima kasih." },
      { status: 201 }
    );
  }

  /**
   * Sudah ada baris `alumni_responses` (pra-isi admin/draft), master `sudah_isi` false:
   * simpan perubahan dari form lalu tandai alumni sebagai selesai di master.
   */
  if (hasResponse) {
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
            "Data jawaban tidak ditemukan untuk diperbarui. Hubungi admin.",
        },
        { status: 404 }
      );
    }

    const { error: masterDoneError } = await supabase
      .from(SUPABASE_TABLE_MASTER)
      .update({ sudah_isi: true })
      .eq("id", alumniId);

    if (masterDoneError) {
      console.error("Update sudah_isi after response update:", masterDoneError);
      return NextResponse.json(
        {
          message:
            "Jawaban tersimpan, tetapi status marhalah gagal diperbarui. Hubungi admin.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: "Terima kasih, data marhalah berhasil disimpan." },
      { status: 201 }
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
      { message: "Jawaban tersimpan, tetapi status marhalah gagal diperbarui." },
      { status: 500 }
    );
  }

  return NextResponse.json(
    { message: "Terima kasih, data marhalah berhasil disimpan." },
    { status: 201 }
  );
}
