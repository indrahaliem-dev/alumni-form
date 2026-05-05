import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase-auth-server";
import { getSupabaseServerClient } from "@/lib/supabase";
import {
  SUPABASE_TABLE_MASTER,
  SUPABASE_TABLE_RESPONSES,
} from "@/lib/supabase-schema";
import DashboardTable, { type DashboardRow } from "./dashboard-table";
import LogoutButton from "./logout-button";

async function getDashboardData(): Promise<DashboardRow[]> {
  let supabase;
  try {
    supabase = getSupabaseServerClient();
  } catch {
    return [];
  }

  const { data: responses } = await supabase
    .from(SUPABASE_TABLE_RESPONSES)
    .select(
      "id, alumni_id, kesibukan, whatsapp, domisili, ikut_reuni, merchandise_vote, created_at"
    )
    .order("created_at", { ascending: false });

  const responseRows = (responses ?? []) as Array<{
    id: number | string;
    alumni_id: number | string | null;
    kesibukan: string | null;
    whatsapp: string | null;
    domisili: string | null;
    ikut_reuni: string | null;
    merchandise_vote: string | null;
    created_at: string | null;
  }>;

  const masterIds = [
    ...new Set(
      responseRows
        .map((item) => Number(item.alumni_id))
        .filter((id) => Number.isSafeInteger(id))
    ),
  ];
  const { data: masters } =
    masterIds.length > 0
      ? await supabase
          .from(SUPABASE_TABLE_MASTER)
          .select("id, nama, nomor_id, konsulat, sudah_isi")
          .in("id", masterIds)
      : { data: [] as Array<Record<string, never>> };

  const masterById = new Map(
    (masters ?? []).map((m: Record<string, unknown>) => [String(m.id), m])
  );

  return responseRows.map((item) => {
    const master = masterById.get(String(item.alumni_id)) as
      | {
          nama?: string | null;
          nomor_id?: string | null;
          konsulat?: string | null;
          sudah_isi?: boolean | null;
        }
      | undefined;

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
}

export default async function DashboardPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const data = await getDashboardData();

  return (
    <div className="min-h-screen bg-birch-100 px-4 py-10 sm:px-6">
      <main className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <section className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-birch-200 bg-birch-50 p-6 shadow-sm sm:p-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-birch-500">
              Dashboard Admin
            </p>
            <h1 className="mt-2 text-2xl font-bold text-birch-900 sm:text-3xl">
              Alumni Prestigious
            </h1>
            <p className="mt-2 text-sm text-birch-600">
              Login sebagai: <span className="font-medium">{user.email}</span>
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="rounded-xl border border-birch-300 px-4 py-2 text-sm font-medium text-birch-700"
            >
              Home
            </Link>
            <LogoutButton />
          </div>
        </section>

        <DashboardTable data={data} />
      </main>
    </div>
  );
}
