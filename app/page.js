"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { apiFetch, getApiBase } from "./lib/api";
import { clearAuth, loadAuth } from "./lib/auth";

const MapPicker = dynamic(() => import("./components/MapPicker"), { ssr: false });

const SLIDES = [
  {
    title: "Find a spot in seconds",
    subtitle: "Live availability, verified providers, instant booking.",
    img: "https://images.unsplash.com/photo-1503736334956-4c8f8e92946d?auto=format&fit=crop&w=1200&q=80",
  },
  {
    title: "Drive, park, go",
    subtitle: "Search near you with GPS or plan ahead from home.",
    img: "https://images.unsplash.com/photo-1502877828070-33b167ad6860?auto=format&fit=crop&w=1200&q=80",
  },
  {
    title: "Hassle-free hosting",
    subtitle: "Providers manage spaces, availability, and payouts in one place.",
    img: "https://images.unsplash.com/photo-1502877338535-766e1452684a?auto=format&fit=crop&w=1200&q=80",
  },
];

const FEATURES = [
  { title: "Live GPS", desc: "Use your current location to search instantly.", icon: "GPS" },
  { title: "Smart filters", desc: "Height limits, distance, and pricing built in.", icon: "FILTER" },
  { title: "One-tap booking", desc: "Reserve or cancel in seconds, no calls needed.", icon: "FAST" },
];

const PROVIDER_TOOLS = [
  { title: "Space creator", desc: "Drop a pin, set capacity, and go live.", accent: "emerald" },
  { title: "Availability rules", desc: "Define hourly windows and pricing per slot.", accent: "amber" },
  { title: "Booking control", desc: "Confirm, check-in/out, or cancel with a click.", accent: "blue" },
];

const STEPS = [
  { title: "Search", detail: "Type an address or tap on the map to pick a spot." },
  { title: "Choose time", detail: "Set start/end and see only available spaces." },
  { title: "Book & go", detail: "Instant confirmation, live timeline, easy cancel." },
];

const TESTIMONIALS = [
  {
    name: "Ayesha - Driver",
    quote: "Found a garage near the clinic in under a minute. Booking felt effortless.",
    avatar: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=200&q=80",
  },
  {
    name: "Rahim - Provider",
    quote: "Dropping a pin and setting availability took minutes. Bookings showed up day one.",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80",
  },
];

export default function Home() {
  const router = useRouter();
  const [auth, setAuth] = useState(null);
  const [query, setQuery] = useState("");
  const [picked, setPicked] = useState(null);
  const [geo, setGeo] = useState(null);
  const [spaces, setSpaces] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [slide, setSlide] = useState(0);

  const now = useMemo(() => new Date(), []);
  const startTs = useMemo(() => now.toISOString(), [now]);
  const endTs = useMemo(() => new Date(now.getTime() + 60 * 60 * 1000).toISOString(), [now]);

  useEffect(() => {
    const existing = loadAuth();
    if (existing?.access_token) setAuth(existing);
  }, []);

  useEffect(() => {
    const id = setInterval(() => setSlide((s) => (s + 1) % SLIDES.length), 5000);
    return () => clearInterval(id);
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
        throw new Error("Please enter a location or pick on the map.");
      }
      const res = await fetch(
        `${getApiBase()}/search?lat=${target.lat}&lng=${target.lng}&start_ts=${startTs}&end_ts=${endTs}&radius_m=1500`
      );
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setSpaces(data.items ?? []);
    } catch (e) {
      setError(e.message || "Search failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-indigo-50 via-white to-emerald-50 text-zinc-900">
      <div className="max-w-6xl mx-auto px-6">
        <header className="flex items-center justify-between py-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push("/")}
              className="h-10 w-10 rounded-2xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-white grid place-items-center font-bold shadow-lg shadow-emerald-200"
            >
              P
            </button>
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-emerald-600 font-semibold">Parking</p>
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
                  Dashboard
                </button>
                <button
                  onClick={logout}
                  className="px-4 py-2 rounded-full bg-zinc-900 text-white font-semibold hover:bg-black transition"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => router.push("/login")}
                  className="px-4 py-2 rounded-full border border-emerald-200 text-emerald-700 font-semibold hover:border-emerald-400 transition"
                >
                  Login
                </button>
                <button
                  onClick={() => router.push("/register")}
                  className="px-4 py-2 rounded-full bg-emerald-600 text-white font-semibold shadow-lg shadow-emerald-200 hover:bg-emerald-700 transition"
                >
                  Get started
                </button>
              </>
            )}
          </div>
        </header>

        <section className="pb-12 grid gap-10 md:grid-cols-[1.1fr,0.9fr] items-center">
          <div className="space-y-6">
            <div className="relative overflow-hidden rounded-3xl border border-emerald-100 bg-white shadow-2xl">
              <div
                className="absolute inset-0 bg-cover bg-center transition-all duration-500 scale-105"
                style={{ backgroundImage: `url(${SLIDES[slide].img})`, filter: "brightness(0.75)" }}
              ></div>
              <div className="relative p-6 md:p-8 space-y-4 text-white">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 text-xs font-semibold backdrop-blur">
                    <span className="h-2 w-2 rounded-full bg-emerald-300 animate-pulse"></span>
                    Live parking network
                  </span>
                  <div className="flex -space-x-2">
                    {TESTIMONIALS.map((t, idx) => (
                      <img
                        key={idx}
                        src={t.avatar}
                        alt={t.name}
                        className="h-8 w-8 rounded-full border-2 border-white shadow"
                      />
                    ))}
                    <span className="text-xs bg-white/20 px-2 py-1 rounded-full backdrop-blur">Trusted users</span>
                  </div>
                </div>
                <h2 className="text-3xl md:text-4xl font-bold leading-tight drop-shadow-md">{SLIDES[slide].title}</h2>
                <p className="text-sm md:text-base text-white/90">{SLIDES[slide].subtitle}</p>
                <div className="flex flex-wrap gap-2">
                  {SLIDES.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSlide(idx)}
                      className={`h-2 w-8 rounded-full transition duration-300 ${idx === slide ? "bg-white" : "bg-white/50"}`}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-white border border-emerald-100 rounded-3xl shadow-lg p-5 flex flex-col gap-3">
              <p className="text-lg text-zinc-800 max-w-2xl">
                Search by address or use live GPS, see nearby garages with live availability, and manage bookings with role-specific dashboards for drivers and providers.
              </p>
              <div className="flex items-center gap-3 text-sm text-emerald-700">
                <span className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-emerald-100 text-emerald-700 font-semibold">24/7</span>
                <p>Always-on availability checks with instant confirmation.</p>
              </div>
            </div>

            <div className="flex flex-col md:flex-row gap-3 md:items-center">
              <div className="flex flex-1 items-center gap-2 bg-white border border-zinc-200 rounded-2xl px-4 py-3 shadow-sm">
                <span className="text-zinc-500">Search</span>
                <input
                  className="w-full outline-none text-base"
                  placeholder="Search an area or drop a pin on the map"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>
              <button
                onClick={search}
                disabled={loading}
                className="px-5 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-semibold shadow-lg shadow-emerald-200 hover:from-emerald-600 hover:to-cyan-600 disabled:opacity-60"
              >
                {loading ? "Searching..." : "Search nearby"}
              </button>
            </div>
            {error && <p className="text-red-600 text-sm">{error}</p>}
            {geo && (
              <p className="text-sm text-zinc-700">
                Resolved: {geo.lat}, {geo.lng} - {geo.address}
              </p>
            )}
            <div className="grid gap-4">
              {spaces.length === 0 && geo && <p className="text-sm text-zinc-600">No spaces found near this location yet.</p>}
              {spaces.map((s) => (
                <div key={s.id} className="bg-white border border-zinc-100 rounded-2xl p-4 shadow-sm flex flex-col gap-1 hover:-translate-y-0.5 transition">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-lg">{s.title}</h3>
                    <span className="text-xs bg-emerald-50 text-emerald-700 px-2 py-1 rounded-full">{Math.round(s.distance_m)} m away</span>
                  </div>
                  <p className="text-sm text-zinc-700">{s.place_label || s.address || "No address set"}</p>
                  <p className="text-xs text-zinc-500">Capacity: {s.capacity ?? 1} | Height limit: {s.height_limit ?? "N/A"}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-0 blur-3xl bg-gradient-to-br from-emerald-300/40 via-sky-200/50 to-amber-200/40 rounded-full"></div>
            <div className="relative bg-white border border-emerald-100 shadow-xl rounded-3xl p-6 space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-emerald-600 font-semibold">Role-based control</p>
                  <h3 className="text-xl font-bold text-zinc-900">Driver / Provider / Admin</h3>
                </div>
                <span className="text-xs bg-zinc-100 px-2 py-1 rounded-full">Access & actions</span>
              </div>
              <div className="grid gap-3">
                <RoleCard title="Driver" accent="emerald">
                  Search, view live availability, book instantly, and manage your trip timeline with easy cancel/check-in/out.
                </RoleCard>
                <RoleCard title="Provider" accent="amber">
                  Create spaces, set availability, track bookings, and view income snapshots from your dashboard.
                </RoleCard>
                <RoleCard title="Admin" accent="cyan">
                  Monitor bookings and spaces, oversee roles, and keep the platform running smoothly.
                </RoleCard>
              </div>
              <button
                onClick={() => router.push(auth ? "/dashboard" : "/login")}
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-zinc-900 to-zinc-800 text-white font-semibold shadow-lg hover:from-black hover:to-zinc-900 transition"
              >
                {auth ? "Go to dashboard" : "Login to continue"}
              </button>
            </div>
          </div>
        </section>

        <section className="pb-12">
          <div className="grid gap-4 md:grid-cols-3">
            {FEATURES.map((f, idx) => (
              <div key={idx} className="bg-white border border-zinc-100 rounded-2xl p-4 shadow-sm hover:-translate-y-1 transition">
                <div className="h-10 w-10 rounded-xl bg-emerald-50 text-2xl grid place-items-center text-emerald-700">
                  {f.icon}
                </div>
                <h4 className="mt-3 font-semibold text-zinc-900">{f.title}</h4>
                <p className="text-sm text-zinc-600 mt-1">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="pb-12 grid gap-6 md:grid-cols-[1.2fr,0.8fr] items-start">
          <div className="bg-white border border-zinc-100 rounded-3xl p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2 text-sm text-emerald-700">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
              How it works
            </div>
            <h3 className="text-2xl font-semibold text-zinc-900">Book a spot in three simple steps</h3>
            <div className="grid gap-3 md:grid-cols-3">
              {STEPS.map((s, idx) => (
                <div key={idx} className="rounded-2xl border border-zinc-100 p-4 bg-zinc-50/60 hover:bg-white transition">
                  <div className="h-9 w-9 rounded-full bg-emerald-100 text-emerald-700 font-semibold grid place-items-center">{idx + 1}</div>
                  <h4 className="mt-3 font-semibold text-zinc-900">{s.title}</h4>
                  <p className="text-sm text-zinc-600 mt-1">{s.detail}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white border border-emerald-100 rounded-3xl p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2 text-sm text-emerald-700">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Provider toolkit
            </div>
            <h3 className="text-xl font-semibold text-zinc-900">Operate spaces like a pro</h3>
            <div className="grid gap-3">
              {PROVIDER_TOOLS.map((tool, idx) => (
                <RoleCard key={idx} title={tool.title} accent={tool.accent}>
                  {tool.desc}
                </RoleCard>
              ))}
            </div>
            <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 text-sm text-emerald-800">
              Drop a pin to create a space, then add hourly windows. Confirm or check-in/out bookings in one dashboard.
            </div>
          </div>
        </section>

        <section className="pb-12">
          <div className="bg-white border border-zinc-100 rounded-3xl p-6 shadow-sm grid md:grid-cols-[1.1fr,0.9fr] gap-6 items-center">
            <div className="space-y-4">
              <h3 className="text-2xl font-semibold text-zinc-900">People already parking with Flow</h3>
              <p className="text-sm text-zinc-600">
                Trusted by drivers and providers across the city for quick, reliable parking that just works.
              </p>
              <div className="grid gap-4">
                {TESTIMONIALS.map((t, idx) => (
                  <div key={idx} className="flex gap-3 p-3 rounded-2xl border border-zinc-100 bg-zinc-50/60">
                    <img src={t.avatar} alt={t.name} className="h-12 w-12 rounded-full object-cover border border-white shadow" />
                    <div>
                      <p className="font-semibold text-zinc-900">{t.name}</p>
                      <p className="text-sm text-zinc-600">{t.quote}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-gradient-to-br from-emerald-500/90 to-cyan-500/90 text-white rounded-3xl p-6 shadow-lg space-y-4">
              <p className="text-xs uppercase tracking-[0.2em] font-semibold text-white/80">Why it feels fast</p>
              <h4 className="text-2xl font-bold leading-tight">Instant search + live availability</h4>
              <ul className="space-y-2 text-sm text-white/90">
                <li>• Results ranked by distance with meters-away badges.</li>
                <li>• Live windows from providers so you never overbook.</li>
                <li>• One-tap booking and cancel flows for drivers.</li>
                <li>• Check-in/out controls to keep timelines clean.</li>
              </ul>
              <button
                onClick={() => router.push(auth ? "/dashboard" : "/login")}
                className="mt-2 w-full py-3 rounded-2xl bg-white text-emerald-700 font-semibold hover:shadow-lg transition"
              >
                {auth ? "Open dashboard" : "Login to get started"}
              </button>
            </div>
          </div>
        </section>

        <section className="pb-12">
          <div className="bg-white border border-zinc-100 shadow-sm rounded-3xl p-6 space-y-4">
            <h3 className="text-xl font-semibold text-zinc-900">Drop a pin to save a spot</h3>
            <p className="text-sm text-zinc-600">Use the map picker to set a precise location for your search or to add a new provider space.</p>
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

















