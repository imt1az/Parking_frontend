"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { apiFetch, getApiBase } from "./lib/api";
import { loadAuth } from "./lib/auth";
import dynamic from "next/dynamic";

const MapPicker = dynamic(() => import("./components/MapPicker"), { ssr: false });

export default function Home() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [geo, setGeo] = useState(null);
  const [spaces, setSpaces] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [picked, setPicked] = useState(null);

  const now = useMemo(() => new Date(), []);
  const startTs = useMemo(() => now.toISOString(), [now]);
  const endTs = useMemo(
    () => new Date(now.getTime() + 60 * 60 * 1000).toISOString(),
    [now]
  );

  useEffect(() => {
    const auth = loadAuth();
    if (auth?.user?.role === "driver") {
      // Optional redirect if you want auto go to dashboard
    }
  }, []);

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
        throw new Error("লোকেশন সিলেক্ট করুন বা ঠিকানা লিখুন");
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
      <header className="flex items-center justify-between px-8 py-6">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-2xl bg-emerald-600 text-white grid place-items-center font-bold">
            P
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-emerald-600 font-semibold">
              Parking
            </p>
            <h1 className="text-lg font-bold">Flow</h1>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/login")}
            className="px-4 py-2 rounded-full border border-emerald-200 text-emerald-700 font-semibold hover:border-emerald-400"
          >
            লগইন
          </button>
          <button
            onClick={() => router.push("/register")}
            className="px-4 py-2 rounded-full bg-emerald-600 text-white font-semibold shadow-lg shadow-emerald-200 hover:bg-emerald-700"
          >
            রেজিস্টার
          </button>
        </div>
      </header>

      <section className="px-8 pb-12 grid gap-10 md:grid-cols-[1.1fr,0.9fr] items-center">
        <div className="space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white shadow border border-emerald-100 text-sm text-emerald-700">
            <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
            Real-time availability, geo search, role dashboards
          </div>
          <h2 className="text-4xl md:text-5xl font-bold leading-tight text-zinc-900">
            আপনার শহরের পার্কিং <span className="text-emerald-600">অনুসন্ধান</span> ও{" "}
            <span className="text-emerald-600">ম্যানেজ</span> করুন এক প্ল্যাটফর্মে।
          </h2>
          <p className="text-lg text-zinc-600 max-w-2xl">
            ড্রাইভাররা সহজে বুকিং করতে পারে, প্রোভাইডাররা স্পেস/অ্যাভেইলেবিলিটি পরিচালনা করতে পারে,
            আর অ্যাডমিন সবকিছু মনিটর করতে পারে।
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
                  {s.place_label || s.address || "ঠিকানা দেওয়া নেই"}
                </p>
                <p className="text-xs text-zinc-500">
                  ক্ষমতা: {s.capacity ?? 1} | উচ্চতা: {s.height_limit ?? "N/A"}
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
                <p className="text-xs text-emerald-600 font-semibold">ড্যাশবোর্ড</p>
                <h3 className="text-xl font-bold text-zinc-900">Role overview</h3>
              </div>
              <span className="text-xs bg-zinc-100 px-2 py-1 rounded-full">
                Driver / Provider / Admin
              </span>
            </div>
            <div className="grid gap-3">
              <Card title="Driver" accent="emerald">
                বুকিং, সার্চ, স্ট্যাটাস ট্র্যাক, ক্যান্সেল।
              </Card>
              <Card title="Provider" accent="amber">
                স্পেস তৈরি/এডিট, উপলব্ধতা সেট, বুকিং দেখা।
              </Card>
              <Card title="Admin" accent="cyan">
                স্বাস্থ্য, ব্যবহারকারী, স্পেস ও বুকিং মনিটর।
              </Card>
            </div>
            <button
              onClick={() => router.push("/dashboard")}
              className="w-full py-3 rounded-2xl bg-zinc-900 text-white font-semibold shadow-lg hover:bg-black"
            >
              ড্যাশবোর্ডে যান
            </button>
          </div>
        </div>
      </section>

      <section className="px-8 pb-12">
        <div className="bg-white border border-zinc-100 shadow-sm rounded-3xl p-6 space-y-4">
          <h3 className="text-xl font-semibold text-zinc-900">
            মানচিত্রে লোকেশন সিলেক্ট করুন
          </h3>
          <p className="text-sm text-zinc-600">
            মানচিত্রে ক্লিক/ড্র্যাগ করে লোকেশন নির্ধারণ করুন, অথবা ঠিকানা লিখে সার্চ করুন।
          </p>
          <MapPicker value={picked} onChange={setPicked} />
        </div>
      </section>
    </main>
  );
}

function Card({ title, accent, children }) {
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
