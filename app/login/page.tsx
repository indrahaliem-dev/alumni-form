import Link from "next/link";
import LoginForm from "@/app/login/login-form";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ redirectTo?: string }>;
}) {
  const params = await searchParams;
  const redirectTo = params.redirectTo || "/dashboard";
  return (
    <div className="flex min-h-screen items-center justify-center px-6 py-16">
      <main className="w-full max-w-md rounded-3xl border border-birch-200 bg-birch-50 p-8 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-birch-400">
          Dashboard Prestigious Cores
        </p>
        <h1 className="mt-2 text-2xl font-semibold text-birch-900">Login Admin</h1>
        <p className="mt-3 text-sm text-birch-600">
          Silahkan login untuk mengakses dashboard prestigious cores.
        </p>

        <LoginForm redirectTo={redirectTo} />

        <div className="mt-4 text-center">
          <Link
            href="/"
            className="text-sm font-medium text-birch-link underline decoration-birch-300 underline-offset-2"
          >
            Kembali ke halaman utama
          </Link>
        </div>
      </main>
    </div>
  );
}
