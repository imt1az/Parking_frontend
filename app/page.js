"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { apiFetch, getApiBase } from "./lib/api";
import { clearAuth, loadAuth } from "./lib/auth";

const MapPicker = dynamic(() => import("./components/MapPicker"), { ssr: false });

export default function Home() {
  const router = useRouter();
  const [auth, setAuth] = useState(null);
  const [query, setQuery] = useState("");
  const [picked, setPicked] = useState(null);
  const [geo, setGeo] = useState(null);
  const [spaces, setSpaces] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const now = useMemo(() => new Date(), []);
  const startTs = useMemo(() => now.toISOString(), [now]);
  const endTs = useMemo(
    () => new Date(now.getTime() + 60 * 60 * 1000).toISOString(),
    [now]
  );

  useEffect(() => {
    const existing = loadAuth();
    if (existing?.access_token) setAuth(existing);
  }, []);

  const logout = () => {
    clearAuth();
    setAuth(null);
    router.refresh();
  };

  const search = async () => {
    setLoading(true);
    setError("");
    setSpaces([]);
    setGeo(null);
    try {
      let target = picked;
      if (!target && query.trim()) {
        const ge = await apiFetch("/geocode", { method: "POST", body: { query } });
        target = ge;
        setGeo(ge);
      }
      if (!target?.lat || !target?.lng) {
        throw new Error("ম্যাপে লোকেশন সিলেক্ট করুন বা ঠিকানা লিখে সার্চ করুন।");
      }
      const res = await fetch(
        `${getApiBase()}/search?lat=${target.lat}&lng=${target.lng}&start_ts=${startTs}&end_ts=${endTs}&radius_m=1500`
      );
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setSpaces(data.items ?? []);
    } catch (e) {
      setError(e.message || "সার্চ ব্যর্থ");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-emerald-50 via-white to-white text-zinc-900">
      <div className="max-w-6xl mx-auto px-6">
        <header className="flex items-center justify-between py-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push("/")}
              className="h-10 w-10 rounded-2xl bg-emerald-600 text-white grid place-items-center font-bold"
            >
              P
            </button>
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-emerald-600 font-semibold">
                Parking
              </p>
              <h1 className="text-lg font-bold">Flow</h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {auth ? (
              <>
                <button
                  onClick={() => router.push("/dashboard")}
                  className="px-4 py-2 rounded-full border border-emerald-200 text-emerald-700 font-semibold hover:border-emerald-400 transition"
                >
                  ড্যাশবোর্ড
                </button>
                <button
                  onClick={logout}
                  className="px-4 py-2 rounded-full bg-zinc-900 text-white font-semibold hover:bg-black transition"
                >
                  লগআউট
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => router.push("/login")}
                  className="px-4 py-2 rounded-full border border-emerald-200 text-emerald-700 font-semibold hover:border-emerald-400 transition"
                >
                  লগইন
                </button>
                <button
                  onClick={() => router.push("/register")}
                  className="px-4 py-2 rounded-full bg-emerald-600 text-white font-semibold shadow-lg shadow-emerald-200 hover:bg-emerald-700 transition"
                >
                  রেজিস্টার
                </button>
              </>
            )}
          </div>
        </header>

        <section className="pb-12 grid gap-10 md:grid-cols-[1.1fr,0.9fr] items-center">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white shadow border border-emerald-100 text-sm text-emerald-700">
              <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
              Real-time availability, geo search, role dashboards
            </div>
            <h2 className="text-4xl md:text-5xl font-bold leading-tight text-zinc-900">
              শহরের পার্কিং খুঁজুন, বুক করুন, আর ম্যানেজ করুন এক জায়গায়।
            </h2>
            <p className="text-lg text-zinc-600 max-w-2xl">
              ড্রাইভাররা দ্রুত বুকিং পায়, প্রোভাইডাররা সহজে স্পেস ও অ্যাভেইলেবিলিটি সেট করে, অ্যাডমিন সবকিছু মনিটর করতে পারে।
            </p>
            <div className="flex flex-col md:flex-row gap-3 md:items-center">
              <div className="flex flex-1 items-center gap-2 bg-white border border-zinc-200 rounded-2xl px-4 py-3 shadow-sm">
                <span className="text-zinc-500">📍</span>
                <input
                  className="w-full outline-none text-base"
                  placeholder="ঠিকানা বা এলাকা লিখুন (যেমন: Dhanmondi Lake)"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>
              <button
                onClick={search}
                disabled={loading}
                className="px-5 py-3 rounded-2xl bg-emerald-600 text-white font-semibold shadow-lg shadow-emerald-200 hover:bg-emerald-700 disabled:opacity-60"
              >
                {loading ? "খুঁজছি..." : "সার্চ"}
              </button>
            </div>
            {error && <p className="text-red-600 text-sm">{error}</p>}
            {geo && (
              <p className="text-sm text-zinc-700">
                পাওয়া কোঅর্ডিনেট: {geo.lat}, {geo.lng} — {geo.address}
              </p>
            )}
            <div className="grid gap-4">
              {spaces.length === 0 && geo && (
                <p className="text-sm text-zinc-600">কোনো স্পেস পাওয়া যায়নি।</p>
              )}
              {spaces.map((s) => (
                <div
                  key={s.id}
                  className="bg-white border border-zinc-100 rounded-2xl p-4 shadow-sm flex flex-col gap-1"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-lg">{s.title}</h3>
                    <span className="text-xs bg-emerald-50 text-emerald-700 px-2 py-1 rounded-full">
                      {Math.round(s.distance_m)} মিটার
                    </span>
                  </div>
                  <p className="text-sm text-zinc-700">
                    {s.place_label || s.address || "ঠিকানা নেই"}
                  </p>
                  <p className="text-xs text-zinc-500">
                    ক্ষমতা: {s.capacity ?? 1} | উচ্চতা সীমা: {s.height_limit ?? "N/A"}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-0 blur-3xl bg-emerald-200/50 rounded-full"></div>
            <div className="relative bg-white border border-emerald-100 shadow-xl rounded-3xl p-6 space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-emerald-600 font-semibold">রোল হাইলাইট</p>
                  <h3 className="text-xl font-bold text-zinc-900">Driver / Provider / Admin</h3>
                </div>
                <span className="text-xs bg-zinc-100 px-2 py-1 rounded-full">রিয়েল-টাইম</span>
              </div>
              <div className="grid gap-3">
                <RoleCard title="Driver" accent="emerald">
                  পার্কিং সার্চ, বুকিং, স্ট্যাটাস ট্র্যাক, বাতিল।
                </RoleCard>
                <RoleCard title="Provider" accent="amber">
                  স্পেস তৈরি/এডিট, অ্যাভেইলেবিলিটি সেট, বুকিং ম্যানেজ।
                </RoleCard>
                <RoleCard title="Admin" accent="cyan">
                  সার্ভিস হেলথ, ব্যবহারকারী/স্পেস/বুকিং পর্যবেক্ষণ।
                </RoleCard>
              </div>
              <button
                onClick={() => router.push(auth ? "/dashboard" : "/login")}
                className="w-full py-3 rounded-2xl bg-zinc-900 text-white font-semibold shadow-lg hover:bg-black transition"
              >
                {auth ? "ড্যাশবোর্ডে যান" : "লগইন করুন"}
              </button>
            </div>
          </div>
        </section>

        <section className="pb-12">
          <div className="bg-white border border-zinc-100 shadow-sm rounded-3xl p-6 space-y-4">
            <h3 className="text-xl font-semibold text-zinc-900">ম্যাপে লোকেশন সিলেক্ট করুন</h3>
            <p className="text-sm text-zinc-600">
              ম্যাপে ক্লিক/ড্র্যাগ করে পিন বসান; ঠিকানা ও কোঅর্ডিনেট অটো আপডেট হবে। প্রোভাইডার ফর্মেও এই লোকেশন পাঠানো যায়।
            </p>
            <MapPicker value={picked} onChange={setPicked} />
          </div>
        </section>
      </div>
    </main>
  );
}

function RoleCard({ title, accent, children }) {
  const color =
    accent === "emerald"
      ? "bg-emerald-50 text-emerald-800 border-emerald-100"
      : accent === "amber"
      ? "bg-amber-50 text-amber-800 border-amber-100"
      : "bg-cyan-50 text-cyan-800 border-cyan-100";

  return (
    <div className={`rounded-2xl border ${color} p-4`}>
      <h4 className="font-semibold">{title}</h4>
      <p className="text-sm mt-1">{children}</p>
    </div>
  );
}
