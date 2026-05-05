"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase-auth-browser";

export default function LoginForm({ redirectTo }: { redirectTo: string }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isLoading) return;

    setIsLoading(true);
    setError(null);

    try {
      const supabase = createSupabaseBrowserClient();
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (authError) throw authError;

      router.replace(redirectTo);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login gagal.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form className="mt-6 space-y-4" onSubmit={handleLogin}>
      <label className="block text-sm text-birch-700">
        Email
        <input
          type="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="mt-2 w-full rounded-xl border border-birch-300 bg-birch-50 px-4 py-3 text-birch-900 focus:border-birch-sage focus:outline-none"
        />
      </label>

      <label className="block text-sm text-birch-700">
        Password
        <input
          type="password"
          required
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="mt-2 w-full rounded-xl border border-birch-300 bg-birch-50 px-4 py-3 text-birch-900 focus:border-birch-sage focus:outline-none"
        />
      </label>

      {error ? (
        <p className="rounded-xl border border-birch-danger-border bg-birch-danger-bg px-4 py-3 text-sm text-birch-danger-text">
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={isLoading}
        className="w-full rounded-xl bg-birch-bark px-4 py-3 text-sm font-semibold text-birch-50 transition hover:bg-birch-800 disabled:cursor-not-allowed disabled:bg-birch-300"
      >
        {isLoading ? "Memproses..." : "Masuk"}
      </button>
    </form>
  );
}
