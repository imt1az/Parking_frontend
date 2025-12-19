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
    // If already logged in, redirect handled elsewhere.
    setChecking(false);
  }, []);

  const submit = async (e) => {
    e?.preventDefault();
    setLoading(true);
    setError("");
    try {
      const data = await apiFetch("/auth/login", {
        method: "POST",
        body: form,
        auth: false,
      });
      saveAuth(data);
      router.push("/dashboard");
    } catch (e) {
      setError(e.message || "লগইন করতে ব্যর্থ হয়েছে");
      clearAuth();
    } finally {
      setLoading(false);
    }
  };

  if (checking) return null;

  return (
    <main className="min-h-screen bg-gradient-to-b from-zinc-50 via-white to-emerald-50/30 flex items-center justify-center px-6">
      <div className="w-full max-w-5xl grid md:grid-cols-2 bg-white shadow-2xl rounded-3xl border border-zinc-100 overflow-hidden">
        <div className="hidden md:flex flex-col justify-between bg-emerald-600 text-white p-8">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] font-semibold text-emerald-100">
              Parking Platform
            </p>
            <h1 className="text-3xl font-bold mt-3 leading-tight">
              এক প্ল্যাটফর্মে পার্কিং খোঁজা, বুকিং এবং স্পেস ম্যানেজমেন্ট।
            </h1>
            <p className="mt-4 text-emerald-100">
              ঠিকানা বা ম্যাপ থেকে সার্চ, লাইভ GPS, বুকিং টাইমলাইন, এবং প্রোভাইডার ড্যাশবোর্ডে স্পেস ও অ্যাভেইলেবিলিটি ম্যানেজমেন্ট।
            </p>
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-3 text-sm">
              <span className="inline-block h-2 w-2 rounded-full bg-white/80" />
              Demo Provider: 01700000002 / password
            </div>
            <div className="flex items-center gap-3 text-sm">
              <span className="inline-block h-2 w-2 rounded-full bg-white/80" />
              Demo Driver: 01700000001 / password
            </div>
            <div className="flex items-center gap-3 text-sm">
              <span className="inline-block h-2 w-2 rounded-full bg-white/80" />
              Demo Admin: 01700000003 / password
            </div>
          </div>
        </div>

        <div className="p-8 md:p-10 flex flex-col justify-center">
          <div className="space-y-3 text-center md:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold">
              ফোন নম্বর দিয়ে লগইন
            </div>
            <h2 className="text-2xl font-bold text-zinc-900">আপনার অ্যাকাউন্টে সাইন ইন করুন</h2>
            <p className="text-sm text-zinc-600">
              রেজিস্ট্রেশনের সময় দেওয়া ফোন নম্বর ও পাসওয়ার্ড লিখুন।
            </p>
          </div>

          <form onSubmit={submit} className="space-y-4 mt-6">
            <div className="space-y-1">
              <label className="text-sm text-zinc-700">মোবাইল নম্বর</label>
              <input
                className="w-full rounded-xl border border-zinc-200 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500"
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
                className="w-full rounded-xl border border-zinc-200 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                placeholder="********"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
              />
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-red-50 text-red-700 border border-red-100 text-sm">
                {error}
              </div>
            )}

            <div className="space-y-3">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-emerald-600 text-white py-2.75 rounded-xl font-semibold shadow-lg shadow-emerald-200 hover:bg-emerald-700 transition disabled:opacity-60"
              >
                {loading ? "সাইন ইন হচ্ছে..." : "সাইন ইন করুন"}
              </button>
              <button
                type="button"
                onClick={() => router.push("/register")}
                className="w-full border border-zinc-200 py-2.75 rounded-xl font-semibold hover:border-emerald-300 transition"
              >
                নতুন একাউন্ট খুলুন
              </button>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}
