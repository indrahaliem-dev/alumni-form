import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase";
import {
  SUPABASE_TABLE_MASTER,
  SUPABASE_TABLE_RESPONSES,
} from "@/lib/supabase-schema";

type MasterRow = {
  id: number | string;
  nama: string | null;
  nomor_id: string | null;
  konsulat: string | null;
  sudah_isi: boolean | null;
};

type ResponseRow = {
  id: number | string;
  alumni_id: number | string | null;
  kesibukan: string | null;
  whatsapp: string | null;
  domisili: string | null;
  ikut_reuni: string | null;
  merchandise_vote: string | null;
  created_at: string | null;
};

export async function GET() {
  let supabase;
  try {
    supabase = getSupabaseServerClient();
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Supabase env invalid." },
      { status: 500 }
    );
  }

  const { data: responses, error: responseError } = await supabase
    .from(SUPABASE_TABLE_RESPONSES)
    .select(
      "id, alumni_id, kesibukan, whatsapp, domisili, ikut_reuni, merchandise_vote, created_at"
    )
    .order("created_at", { ascending: false });

  if (responseError) {
    console.error("Dashboard response query error:", responseError);
    return NextResponse.json(
      { message: "Gagal mengambil data responses." },
      { status: 500 }
    );
  }

  const responsesList = (responses ?? []) as ResponseRow[];
  const masterIds = [
    ...new Set(
      responsesList
        .map((item) => Number(item.alumni_id))
        .filter((id) => Number.isSafeInteger(id))
    ),
  ];

  let masterById = new Map<string, MasterRow>();
  if (masterIds.length > 0) {
    const { data: masters, error: masterError } = await supabase
      .from(SUPABASE_TABLE_MASTER)
      .select("id, nama, nomor_id, konsulat, sudah_isi")
      .in("id", masterIds);

    if (masterError) {
      console.error("Dashboard master query error:", masterError);
      return NextResponse.json(
        { message: "Gagal mengambil data master alumni." },
        { status: 500 }
      );
    }

    masterById = new Map(
      ((masters ?? []) as MasterRow[]).map((m) => [String(m.id), m])
    );
  }

  const data = responsesList.map((item) => {
    const master = masterById.get(String(item.alumni_id));
    return {
      responseId: String(item.id),
      alumniId: String(item.alumni_id ?? ""),
      nama: master?.nama ?? "-",
      nomorId: master?.nomor_id ?? "-",
      konsulat: master?.konsulat ?? "-",
      sudahIsi: Boolean(master?.sudah_isi),
      kesibukan: item.kesibukan ?? "",
      whatsapp: item.whatsapp ?? "",
      domisili: item.domisili ?? "",
      ikutReuni: item.ikut_reuni ?? "",
      merchandiseVote: item.merchandise_vote ?? "",
      createdAt: item.created_at ?? null,
    };
  });

  return NextResponse.json(data);
}
