import { NextResponse } from "next/server";

import { getSupabaseServerClient } from "@/lib/supabase";
import {
  SUPABASE_SAYEMBARA_BUCKET,
  SUPABASE_TABLE_SAYEMBARA,
} from "@/lib/supabase-schema";

const MAX_FILES = 8;
const MAX_BYTES_PER_FILE = 25 * 1024 * 1024; // 25 MiB

const ALLOWED_MIME = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

function sanitizeFileName(name: string): string {
  const base = name
    .replace(/^.*[/\\]/, "")
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .slice(0, 180);
  return base.length > 0 ? base : "file";
}

export async function POST(request: Request) {
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

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ message: "Body form tidak valid." }, { status: 400 });
  }

  const nama = String(formData.get("nama") ?? "").trim();
  const konsulat = String(formData.get("konsulat") ?? "").trim();
  const whatsapp = String(formData.get("whatsapp") ?? "").trim();

  if (!nama || !konsulat || !whatsapp) {
    return NextResponse.json(
      { message: "Nama, konsulat, dan nomor WhatsApp wajib diisi." },
      { status: 400 }
    );
  }

  const filesRaw = formData.getAll("files");
  const files: File[] = filesRaw.filter((f): f is File => f instanceof File && f.size > 0);

  if (files.length === 0) {
    return NextResponse.json(
      { message: "Unggah minimal satu file PDF atau gambar desain." },
      { status: 400 }
    );
  }

  if (files.length > MAX_FILES) {
    return NextResponse.json(
      { message: `Maksimal ${MAX_FILES} file per pengiriman.` },
      { status: 400 }
    );
  }

  for (const file of files) {
    if (file.size > MAX_BYTES_PER_FILE) {
      return NextResponse.json(
        { message: `File "${file.name}" melebihi batas ukuran (25 MB).` },
        { status: 400 }
      );
    }
    const type = (file.type || "").toLowerCase();
    if (!ALLOWED_MIME.has(type)) {
      return NextResponse.json(
        {
          message: `Tipe file tidak didukung: "${file.name}". Gunakan PDF, JPEG, PNG, WebP, atau GIF.`,
        },
        { status: 400 }
      );
    }
  }

  const submissionId = crypto.randomUUID();
  const bucket = SUPABASE_SAYEMBARA_BUCKET;
  const fileUrls: string[] = [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const safeName = sanitizeFileName(file.name);
    const objectPath = `${submissionId}/${i + 1}-${safeName}`;

    const buffer = Buffer.from(await file.arrayBuffer());
    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(objectPath, buffer, {
        contentType: file.type || "application/octet-stream",
        upsert: false,
      });

    if (uploadError) {
      const low = uploadError.message.toLowerCase();
      const rls = low.includes("row-level security");
      const hint =
        low.includes("bucket") || low.includes("not found")
          ? ` Buat bucket "${bucket}" di Supabase → Storage (nama persis, bisa Public) atau jalankan migrasi SQL di repo.`
          : rls
            ? ` Di Supabase → SQL Editor, jalankan ulang file migrasi sayembara (policy storage.objects: hanya cek bucket_id = '${bucket}').`
            : " Pastikan NEXT_PUBLIC_SUPABASE_URL mengarah ke project yang benar.";
      return NextResponse.json(
        {
          message: `Gagal mengunggah file: ${uploadError.message}.${hint}`,
        },
        { status: 502 }
      );
    }

    const { data: pub } = supabase.storage.from(bucket).getPublicUrl(objectPath);
    if (pub?.publicUrl) {
      fileUrls.push(pub.publicUrl);
    }
  }

  const { error: insertError } = await supabase.from(SUPABASE_TABLE_SAYEMBARA).insert({
    id: submissionId,
    nama,
    konsulat,
    whatsapp,
    file_urls: fileUrls,
  });

  if (insertError) {
    const rlsHint = insertError.message.toLowerCase().includes("row-level security")
      ? " Jalankan ulang migrasi SQL sayembara (policy INSERT tabel dengan WITH CHECK (true))."
      : "";
    return NextResponse.json(
      {
        message: `Gagal menyimpan data: ${insertError.message}.${rlsHint} Pastikan tabel "${SUPABASE_TABLE_SAYEMBARA}" ada.`,
      },
      { status: 502 }
    );
  }

  return NextResponse.json(
    {
      message: "Terima kasih, desain antum telah kami terima.",
      id: submissionId,
    },
    { status: 201 }
  );
}
