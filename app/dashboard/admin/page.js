"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "../../lib/api";
import { clearAuth, loadAuth } from "../../lib/auth";

export default function AdminPage() {
  const router = useRouter();
  const [auth, setAuth] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [error, setError] = useState("");
  const [spaces, setSpaces] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const existing = loadAuth();
    if (!existing?.access_token || existing?.user?.role !== "admin") {
      clearAuth();
      router.replace("/login");
      return;
    }
    setAuth(existing);
    setAuthChecked(true);
    setLoading(false);
  }, [router]);

  const loadData = useCallback(async () => {
    if (!auth?.access_token) return;
    try {
      const s = await apiFetch("/spaces/my", { token: auth.access_token });
      const b = await apiFetch("/bookings/for-my-spaces", { token: auth.access_token });
      setSpaces(s?.data || s || []);
      setBookings(b?.data || b || []);
    } catch (e) {
      setError(e.message);
    }
  }, [auth?.access_token]);

  useEffect(() => {
    if (!authChecked || !auth?.access_token) return;
    loadData();
  }, [authChecked, auth?.access_token, loadData]);

  const logout = () => {
    clearAuth();
    router.replace("/login");
  };

  if (loading || !authChecked) return null;

  return (
    <main className="min-h-screen bg-zinc-50 text-zinc-900">
      <div className="max-w-5xl mx-auto px-6 py-6 space-y-6">
        <header className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-emerald-600 font-semibold">
              Admin
            </p>
            <h1 className="text-2xl font-bold">ওভারভিউ</h1>
            <p className="text-sm text-zinc-600">
              স্পেস ও বুকিং সংখ্যার সারাংশ। প্রয়োজনে প্রোভাইডার ড্যাশবোর্ডে যান।
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => router.push("/dashboard")}
              className="px-4 py-2 rounded-lg border border-emerald-200 text-emerald-700 font-semibold hover:border-emerald-400"
            >
              প্রোভাইডার ভিউ
            </button>
            <button
              onClick={logout}
              className="px-4 py-2 rounded-lg bg-zinc-900 text-white font-semibold hover:bg-black"
            >
              লগআউট
            </button>
          </div>
        </header>

        {error && (
          <div className="p-3 rounded-xl bg-red-50 text-red-700 border border-red-100">
            {error}
          </div>
        )}

        <section className="grid md:grid-cols-3 gap-4">
          <StatCard label="স্পেস" value={spaces.length ?? "--"} />
          <StatCard label="বুকিং" value={bookings.length ?? "--"} />
          <StatCard label="ব্যবহারকারী" value="N/A" />
        </section>

        <section className="grid md:grid-cols-2 gap-4">
          <Card title="স্পেস তালিকা">
            {spaces.length === 0 && <p className="text-sm text-zinc-600">কোনো স্পেস নেই।</p>}
            <div className="space-y-3">
              {spaces.map((s) => (
                <ListItem
                  key={s.id}
                  title={s.title}
                  subtitle={s.address || s.place_label || "ঠিকানা নেই"}
                  meta={`Capacity ${s.capacity ?? 1} | Active: ${s.is_active ? "Yes" : "No"}`}
                />
              ))}
            </div>
          </Card>

          <Card title="বুকিং সারাংশ">
            {bookings.length === 0 && <p className="text-sm text-zinc-600">কোনো বুকিং নেই।</p>}
            <div className="space-y-3">
              {bookings.map((b) => (
                <ListItem
                  key={b.id}
                  title={b.space?.title}
                  subtitle={`${b.start_ts} → ${b.end_ts}`}
                  meta={`স্ট্যাটাস: ${b.status}`}
                />
              ))}
            </div>
          </Card>
        </section>
      </div>
    </main>
  );
}

function Card({ title, children }) {
  return (
    <div className="bg-white border border-zinc-200 rounded-2xl shadow-sm p-5 space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-zinc-900">{title}</h2>
      </div>
      {children}
    </div>
  );
}

function StatCard({ label, value }) {
  return (
    <div className="bg-white border border-zinc-200 rounded-2xl shadow-sm p-4">
      <p className="text-sm text-zinc-600">{label}</p>
      <p className="text-2xl font-bold text-zinc-900">{value}</p>
    </div>
  );
}

function ListItem({ title, subtitle, meta }) {
  return (
    <div className="border border-zinc-200 rounded-xl p-3 space-y-1">
      <p className="font-semibold">{title}</p>
      {subtitle && <p className="text-xs text-zinc-500">{subtitle}</p>}
      {meta && <p className="text-xs text-zinc-500">{meta}</p>}
    </div>
  );
}
