"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { apiFetch } from "../lib/api";
import { clearAuth, loadAuth, saveAuth } from "../lib/auth";

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ phone: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const existing = loadAuth();
    if (existing?.access_token) {
      // আগে থেকে লগইন থাকলে চাইলে সরাসরি পাঠিয়ে দিতে পারো:
      // router.replace("/dashboard");
    }
    setChecking(false);
  }, [router]);

  const submit = async (e) => {
    e?.preventDefault();
    setLoading(true);
    setError("");

    try {
      const data = await apiFetch("/auth/login", {
        method: "POST",
        body: form,
        auth: false, // login এ token লাগবে না
      });

      // data = { user, access_token, token_type, expires_in, ... }
      saveAuth(data);
      router.push("/dashboard");
    } catch (e) {
      console.error(e);
      setError(e.message || "লগইন ব্যর্থ");
      clearAuth();
    } finally {
      setLoading(false);
    }
  };

  if (checking) return null;

  return (
    <main className="min-h-screen bg-gradient-to-b from-zinc-50 to-white flex items-center justify-center px-6">
      <div className="w-full max-w-md bg-white shadow-xl rounded-2xl p-8 space-y-6 border border-zinc-100">
        <div className="space-y-2 text-center">
          <p className="text-xs font-semibold text-emerald-600 uppercase tracking-[0.2em]">
            Parking Portal
          </p>
          <h1 className="text-2xl font-bold text-zinc-900">লগইন</h1>
          <p className="text-sm text-zinc-600">
            ফোন নম্বর ও পাসওয়ার্ড দিন। নতুন হলে রেজিস্টার করুন।
          </p>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-sm text-zinc-700">ফোন</label>
            <input
              className="w-full rounded-lg border border-zinc-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="01700000001"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              required
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm text-zinc-700">পাসওয়ার্ড</label>
            <input
              type="password"
              className="w-full rounded-lg border border-zinc-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="••••••••"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
            />
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-red-50 text-red-700 border border-red-100 text-sm">
              {error}
            </div>
          )}

          <div className="space-y-3">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-600 text-white py-2.5 rounded-lg font-semibold shadow-lg shadow-emerald-200 hover:bg-emerald-700 transition disabled:opacity-60"
            >
              {loading ? "লগইন হচ্ছে..." : "লগইন"}
            </button>
            <button
              type="button"
              onClick={() => router.push("/register")}
              className="w-full border border-zinc-200 py-2.5 rounded-lg font-semibold hover:border-emerald-300 transition"
            >
              নতুন? রেজিস্টার করুন
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
