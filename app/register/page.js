"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { apiFetch } from "../lib/api";
import { loadAuth, saveAuth } from "../lib/auth";

const roles = [
  { value: "driver", label: "Driver" },
  { value: "provider", label: "Provider" },
  { value: "admin", label: "Admin" },
];

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    phone: "",
    password: "",
    role: "driver",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const auth = loadAuth();
    if (auth?.access_token) router.replace("/dashboard");
  }, [router]);

  const submit = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await apiFetch("/auth/register", {
        method: "POST",
        body: form,
      });
      saveAuth(data);
      router.push("/dashboard");
    } catch (e) {
      setError(e.message || "রেজিস্টার ব্যর্থ");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-emerald-50 to-white flex items-center justify-center px-6">
      <div className="w-full max-w-lg bg-white shadow-xl rounded-2xl p-8 space-y-6 border border-emerald-100">
        <div className="space-y-2 text-center">
          <p className="text-xs font-semibold text-emerald-600 uppercase tracking-[0.2em]">
            Parking Portal
          </p>
          <h1 className="text-2xl font-bold text-zinc-900">রেজিস্টার</h1>
          <p className="text-sm text-zinc-600">
            নাম, ফোন, পাসওয়ার্ড দিয়ে দ্রুত একটি অ্যাকাউন্ট বানান।
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1 sm:col-span-2">
            <label className="text-sm text-zinc-700">নাম</label>
            <input
              className="w-full rounded-lg border border-zinc-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="আপনার নাম"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm text-zinc-700">ফোন</label>
            <input
              className="w-full rounded-lg border border-zinc-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="01700000001"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
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
            />
          </div>
          <div className="space-y-1 sm:col-span-2">
            <label className="text-sm text-zinc-700">রোল</label>
            <div className="grid grid-cols-3 gap-2">
              {roles.map((r) => (
                <button
                  key={r.value}
                  type="button"
                  onClick={() => setForm({ ...form, role: r.value })}
                  className={`border rounded-lg px-3 py-2 text-sm font-semibold transition ${
                    form.role === r.value
                      ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                      : "border-zinc-200 text-zinc-700 hover:border-emerald-300"
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="space-y-3">
          <button
            onClick={submit}
            disabled={loading}
            className="w-full bg-emerald-600 text-white py-2.5 rounded-lg font-semibold shadow-lg shadow-emerald-200 hover:bg-emerald-700 transition disabled:opacity-60"
          >
            {loading ? "রেজিস্টার হচ্ছে..." : "রেজিস্টার"}
          </button>
          <button
            onClick={() => router.push("/login")}
            className="w-full border border-zinc-200 py-2.5 rounded-lg font-semibold hover:border-emerald-300 transition"
          >
            অ্যাকাউন্ট আছে? লগইন করুন
          </button>
        </div>
      </div>
    </main>
  );
}
