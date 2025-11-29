
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { apiFetch } from "../lib/api";
import { clearAuth, loadAuth } from "../lib/auth";

const MapPicker = dynamic(() => import("../components/MapPicker"), { ssr: false });
const LiveMap = dynamic(() => import("../components/LiveMap"), { ssr: false });

export default function DashboardPage() {
  const router = useRouter();
  const [auth, setAuth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [bookings, setBookings] = useState([]);
  const [providerBookings, setProviderBookings] = useState([]);
  const [spaces, setSpaces] = useState([]);
  const [report, setReport] = useState({ months: [], total_income: 0 });
  const [reportLoading, setReportLoading] = useState(false);

  const [spaceForm, setSpaceForm] = useState({
    title: "",
    address: "",
    place_query: "",
    capacity: 1,
  });
  const [picked, setPicked] = useState(null);

  const [availabilityForm, setAvailabilityForm] = useState({
    space_id: "",
    start_ts: "",
    end_ts: "",
    base_price_per_hour: 0,
  });
  const [availabilityList, setAvailabilityList] = useState([]);
  const [availabilityLoading, setAvailabilityLoading] = useState(false);

  const [searchForm, setSearchForm] = useState({
    query: "",
    lat: "",
    lng: "",
    start_ts: "",
    end_ts: "",
    radius_m: 1500,
  });
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);

  const [nearbyForm, setNearbyForm] = useState({
    start_ts: "",
    end_ts: "",
    radius_m: 1500,
  });
  const [nearbyResults, setNearbyResults] = useState([]);
  const [nearbyLoading, setNearbyLoading] = useState(false);
  const [locationSaved, setLocationSaved] = useState(false);

  const [mapResults, setMapResults] = useState([]);
  const [mapFocus, setMapFocus] = useState(null);
  const [mapRadius, setMapRadius] = useState(null);

  const [liveCurrent, setLiveCurrent] = useState(null);
  const [customPlaces, setCustomPlaces] = useState([]);
  const [selectedResult, setSelectedResult] = useState(null);

  const [driverTab, setDriverTab] = useState("map");
  const [providerTab, setProviderTab] = useState("overview");
  const [clock, setClock] = useState(Date.now());

  const friendlyError = (e) => {
    const msg = e?.message || "Something went wrong";
    if (msg.includes("NO_AVAILABILITY")) return "No slot available for that time";
    if (msg.includes("ALREADY_BOOKED") || msg.includes("overlaps another booking")) return "Already booked for that time";
    if (msg.toLowerCase().includes("forbidden")) return "You do not have permission";
    if (msg.toLowerCase().includes("unauth")) {
      // session expired: logout and go home
      clearAuth();
      router.replace("/");
      return "Session expired. Redirecting...";
    }
    return msg;
  };

  const toLocalInput = (date) => {
    const d = new Date(date);
    const offset = d.getTimezoneOffset();
    const local = new Date(d.getTime() - offset * 60 * 1000);
    return local.toISOString().slice(0, 16);
  };

  const parseDate = (val) => {
    if (!val) return null;
    const normalized = typeof val === "string" && val.includes(" ") ? val.replace(" ", "T") : val;
    const d = new Date(normalized);
    return Number.isNaN(d.getTime()) ? null : d;
  };

  const formatDateTime = (val) => {
    const d = parseDate(val);
    if (!d) return val || "";
    return d.toLocaleString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const countdownForBooking = (b) => {
    if (!b || b.status !== "checked_in") return "";
    const end = parseDate(b.end_ts);
    if (!end) return "";
    const diffMs = end.getTime() - clock;
    if (diffMs <= 0) return "Time over";
    const total = Math.floor(diffMs / 1000);
    const h = Math.floor(total / 3600);
    const m = Math.floor((total % 3600) / 60);
    const s = total % 60;
    return `${h}h ${m}m ${s}s`;
  };
  useEffect(() => {
    const now = new Date();
    const later = new Date(now.getTime() + 60 * 60 * 1000);
    setNearbyForm((prev) => ({
      ...prev,
      start_ts: toLocalInput(now),
      end_ts: toLocalInput(later),
    }));
    setSearchForm((prev) => ({
      ...prev,
      start_ts: toLocalInput(now),
      end_ts: toLocalInput(later),
    }));
  }, []);

  useEffect(() => {
    const id = setInterval(() => setClock(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const existing = loadAuth();
    if (!existing?.access_token) {
      clearAuth();
      setAuthChecked(true);
      setLoading(false);
      router.replace("/login");
      return;
    }
    setAuth(existing);
    setAuthChecked(true);
    setLoading(false);
  }, [router]);

  useEffect(() => {
    if (!picked) return;
    setSpaceForm((prev) => ({
      ...prev,
      address: picked.address || prev.address,
      place_query: picked.address || prev.place_query,
    }));
  }, [picked]);

  const loadDriver = useCallback(async () => {
    try {
      const res = await apiFetch("/bookings/my", { token: auth?.access_token });
      setBookings(res?.data || res || []);
    } catch (e) {
      setError(friendlyError(e));
    }
  }, [auth?.access_token]);

  useEffect(() => {
    if (typeof window === "undefined" || !navigator?.geolocation) return;
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        setLiveCurrent({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      },
      (err) => setError(err.message || "Failed to read location"),
      { enableHighAccuracy: true }
    );
    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  const loadSpaces = useCallback(async () => {
    try {
      const res = await apiFetch("/spaces/my", { token: auth?.access_token });
      setSpaces(res?.data || res || []);
    } catch (e) {
      setError(friendlyError(e));
    }
  }, [auth?.access_token]);

  const loadProviderBookings = useCallback(async () => {
    try {
      const res = await apiFetch("/bookings/for-my-spaces", {
        token: auth?.access_token,
      });
      setProviderBookings(res?.data || res || []);
    } catch (e) {
      setError(friendlyError(e));
    }
  }, [auth?.access_token]);

  const loadReport = useCallback(async () => {
    try {
      setReportLoading(true);
      const res = await apiFetch("/reports/provider/monthly", {
        token: auth?.access_token,
      });
      setReport({
        months: res?.months || [],
        total_income: res?.total_income || 0,
      });
    } catch (e) {
      setError(friendlyError(e));
    } finally {
      setReportLoading(false);
    }
  }, [auth?.access_token]);

  const loadAvailability = useCallback(
    async (spaceId) => {
      if (!spaceId) return;
      setAvailabilityLoading(true);
      try {
        const res = await apiFetch(`/spaces/${spaceId}/availability`, {
          token: auth?.access_token,
        });
        setAvailabilityList(res?.items || res || []);
      } catch (e) {
        setError(friendlyError(e));
      } finally {
        setAvailabilityLoading(false);
      }
    },
    [auth?.access_token]
  );
  const runSearch = async ({ useLive = false } = {}) => {
    try {
      setSearchLoading(true);
      setError("");
      setSuccess("");
      const params = new URLSearchParams();
      const startVal = searchForm.start_ts || null;
      const endVal = searchForm.end_ts || null;
      if (!startVal || !endVal) throw new Error("Start and end time required");
      params.set("start_ts", startVal);
      params.set("end_ts", endVal);
      if (searchForm.radius_m) params.set("radius_m", searchForm.radius_m);

      let lat = searchForm.lat;
      let lng = searchForm.lng;
      let query = searchForm.query?.trim() || "";

      if (useLive) {
        if (!liveCurrent?.lat || !liveCurrent?.lng) throw new Error("Turn on GPS to search around you");
        lat = liveCurrent.lat;
        lng = liveCurrent.lng;
        query = "";
      }

      if (!query && (!lat || !lng)) {
        throw new Error("Give an address or lat/lng to search");
      }

      if (query) params.set("query", query);
      if (lat && lng) {
        params.set("lat", lat);
        params.set("lng", lng);
      }

      const res = await apiFetch(`/search?${params.toString()}`, { auth: false });
      const items = res?.items || [];
      setSearchResults(items);
      setMapResults(items);
      const focusLat = res?.requested?.lat ?? (lat ? Number(lat) : null);
      const focusLng = res?.requested?.lng ?? (lng ? Number(lng) : null);
      if (focusLat && focusLng) setMapFocus({ lat: focusLat, lng: focusLng });
      setMapRadius(res?.requested?.radius_m ?? searchForm.radius_m);
      setSuccess("Search completed");
    } catch (e) {
      setError(friendlyError(e));
      setSuccess("");
    } finally {
      setSearchLoading(false);
    }
  };

  const searchNearby = async () => {
    try {
      setNearbyLoading(true);
      setError("");
      setSuccess("");
      if (!nearbyForm.start_ts || !nearbyForm.end_ts) {
        throw new Error("Start and end time required");
      }
      const params = new URLSearchParams();
      if (nearbyForm.start_ts) params.set("start_ts", nearbyForm.start_ts);
      if (nearbyForm.end_ts) params.set("end_ts", nearbyForm.end_ts);
      if (nearbyForm.radius_m) {
        params.set("radius_m", nearbyForm.radius_m);
      }

      const res = await apiFetch(`/search/nearby?${params.toString()}`, {
        token: auth?.access_token,
      });
      const items = res?.items || [];
      setNearbyResults(items);
      setMapResults(items);
      if (res?.requested?.lat && res?.requested?.lng) {
        setMapFocus({ lat: res.requested.lat, lng: res.requested.lng });
      }
      setMapRadius(res?.requested?.radius_m ?? nearbyForm.radius_m);
      setSuccess("Nearby search completed");
    } catch (e) {
      setError(friendlyError(e));
      setSuccess("");
    } finally {
      setNearbyLoading(false);
    }
  };

  const saveMyLocation = () => {
    if (!navigator?.geolocation) {
      setError("Geolocation not available in this browser.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          setError("");
          await apiFetch("/me/location", {
            method: "POST",
            token: auth?.access_token,
            body: {
              lat: pos.coords.latitude,
              lng: pos.coords.longitude,
            },
          });
          setLocationSaved(true);
          setLiveCurrent({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          setMapFocus({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          setMapRadius(null);
          setSuccess("GPS location saved");
        } catch (e) {
          setError(friendlyError(e));
          setSuccess("");
        }
      },
      (err) => setError(err.message || "Failed to read location")
    );
  };

  const createBooking = async (spaceId, start, end) => {
    const startVal = start || null;
    const endVal = end || null;
    if (!startVal || !endVal) {
      throw new Error("Start and end time required to book");
    }
    try {
      setError("");
      setSuccess("");
      await apiFetch("/bookings", {
        method: "POST",
        token: auth?.access_token,
        body: {
          space_id: spaceId,
          start_ts: startVal,
          end_ts: endVal,
        },
      });
      await loadDriver();
      setNearbyResults([]);
      setSearchResults([]);
      setMapResults([]);
      setSuccess("Booking created");
    } catch (e) {
      setError(friendlyError(e));
      setSuccess("");
    }
  };

  const bookFromNearby = async (spaceId) => {
    await createBooking(spaceId, nearbyForm.start_ts, nearbyForm.end_ts);
  };

  const bookFromSearch = async (spaceId) => {
    await createBooking(spaceId, searchForm.start_ts, searchForm.end_ts);
  };

  const addCustomPlace = (place) => {
    setCustomPlaces((prev) => [...prev, place]);
  };

  const reverseGeocode = async (lat, lng) => {
    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`;
    const res = await fetch(url, { headers: { "User-Agent": "parking-app/1.0" } });
    if (!res.ok) throw new Error("Reverse geocode failed");
    const data = await res.json();
    return data.display_name || "";
  };

  const useLiveForSpace = async () => {
    if (!liveCurrent?.lat || !liveCurrent?.lng) {
      setError("Turn on GPS to use your live location");
      return;
    }
    setError("");
    setSuccess("");
    let label = "My current location";
    try {
      label = await reverseGeocode(liveCurrent.lat, liveCurrent.lng);
    } catch (e) {
      // fallback
    }
    const chosen = {
      lat: liveCurrent.lat,
      lng: liveCurrent.lng,
      address: label,
    };
    setPicked(chosen);
    setSpaceForm((prev) => ({
      ...prev,
      address: chosen.address || prev.address,
      place_query: chosen.address || prev.place_query,
    }));
    setSuccess("Location selected from GPS");
  };

  const viewResult = (item) => {
    if (!item) return;
    setSelectedResult(item);
    if (item.lat && item.lng) {
      const lat = Number(item.lat);
      const lng = Number(item.lng);
      if (!Number.isNaN(lat) && !Number.isNaN(lng)) {
        setMapFocus({ lat, lng });
        setMapResults([item]);
        if (item.distance_m) {
          // add a bit of padding for radius ring
          setMapRadius(Number(item.distance_m) * 1.2);
        }
      }
    }
  };

  useEffect(() => {
    if (!authChecked || !auth?.access_token) return;
    const role = auth.user?.role;
    if (role === "driver") loadDriver();
    if (role === "provider" || role === "admin") {
      loadSpaces();
      loadProviderBookings();
      loadReport();
    }
  }, [authChecked, auth?.access_token, auth?.user?.role, loadDriver, loadSpaces, loadProviderBookings, loadReport]);

  useEffect(() => {
    if (availabilityForm.space_id) {
      loadAvailability(availabilityForm.space_id);
    } else {
      setAvailabilityList([]);
    }
  }, [availabilityForm.space_id, loadAvailability]);

  useEffect(() => {
    if (spaces.length > 0 && !availabilityForm.space_id) {
      setAvailabilityForm((prev) => ({ ...prev, space_id: String(spaces[0].id) }));
    }
  }, [spaces, availabilityForm.space_id]);

  const logout = () => {
    clearAuth();
    router.replace("/login");
  };

  const createSpace = async () => {
    try {
      setError("");
      setSuccess("");
      await apiFetch("/spaces", {
        method: "POST",
        token: auth?.access_token,
        body: {
          ...spaceForm,
          capacity: Number(spaceForm.capacity || 1),
          lat: picked?.lat,
          lng: picked?.lng,
          place_label: picked?.address,
        },
      });
      setSpaceForm({ title: "", address: "", place_query: "", capacity: 1 });
      setPicked(null);
      loadSpaces();
      setSuccess("Space created");
    } catch (e) {
      setError(friendlyError(e));
      setSuccess("");
    }
  };

  const addAvailability = async () => {
    try {
      setError("");
      setSuccess("");
      await apiFetch(`/spaces/${availabilityForm.space_id}/availability`, {
        method: "POST",
        token: auth?.access_token,
        body: {
          start_ts: availabilityForm.start_ts,
          end_ts: availabilityForm.end_ts,
          base_price_per_hour: Number(availabilityForm.base_price_per_hour || 0),
          is_active: true,
        },
      });
      setAvailabilityForm({
        space_id: "",
        start_ts: "",
        end_ts: "",
        base_price_per_hour: 0,
      });
      loadAvailability(availabilityForm.space_id);
      loadProviderBookings();
      setSuccess("Availability added");
    } catch (e) {
      setError(friendlyError(e));
      setSuccess("");
    }
  };

  const updateBookingStatus = async (id, action) => {
    try {
      setError("");
      setSuccess("");
      await apiFetch(`/bookings/${id}/${action}`, {
        method: "PATCH",
        token: auth?.access_token,
      });
      if (auth?.user?.role === "driver") {
        loadDriver();
      }
      if (auth?.user?.role === "provider" || auth?.user?.role === "admin") {
        loadProviderBookings();
      }
      setSuccess("Booking updated");
    } catch (e) {
      setError(friendlyError(e));
      setSuccess("");
    }
  };

  const role = auth?.user?.role;

  const sidebar = useMemo(() => {
    const items = [];
    if (role === "driver") items.push({ label: "Driver", onClick: () => setDriverTab("map") });
    if (role === "provider") items.push({ label: "Provider", onClick: () => setProviderTab("overview") });
    if (role === "admin") items.push({ label: "Admin", onClick: () => {} });
    return items;
  }, [role]);

  if (loading || !authChecked) return null;

  const providerStats = {
    spaces: spaces.length,
    activeSpaces: spaces.filter((s) => s.is_active).length,
    bookings: providerBookings.length,
    upcoming: providerBookings.filter((b) => ["reserved", "confirmed"].includes(b.status)).length,
  };
  return (
    <main className="min-h-screen bg-gradient-to-br from-zinc-50 via-white to-emerald-50/20 text-zinc-900">
      <div className="max-w-6xl mx-auto p-6 grid md:grid-cols-[240px,1fr] gap-6">
        <aside className="bg-white border border-zinc-200 rounded-2xl shadow-sm p-4 space-y-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push("/")}
              className="h-10 w-10 rounded-xl bg-emerald-600 text-white grid place-items-center font-bold"
              aria-label="Home"
            >
              P
            </button>
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-emerald-600 font-semibold">Dashboard</p>
              <p className="text-sm font-semibold">{auth?.user?.name}</p>
              <p className="text-xs text-zinc-500">{role}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {sidebar.map((item, idx) => (
              <button
                key={idx}
                onClick={item.onClick}
                className="px-3 py-2 rounded-xl border border-zinc-100 hover:border-emerald-300 hover:bg-emerald-50 text-sm font-semibold"
              >
                {item.label}
              </button>
            ))}
            <button
              onClick={logout}
              className="px-3 py-2 rounded-xl border border-red-100 text-red-700 hover:bg-red-50 text-sm font-semibold"
            >
              Logout
            </button>
          </div>
        </aside>

        <section className="space-y-6">
          {error && (
            <div className="p-3 rounded-xl bg-red-50 text-red-700 border border-red-100">{error}</div>
          )}
          {success && (
            <div className="p-3 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-100">{success}</div>
          )}

          <div className="relative overflow-hidden rounded-3xl border border-emerald-100 bg-gradient-to-r from-emerald-500/90 via-cyan-500/80 to-indigo-500/70 text-white shadow-lg">
            <div
              className="absolute inset-0 bg-cover bg-center opacity-40"
              style={{
                backgroundImage:
                  "url(https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=1400&q=80)",
              }}
            ></div>
            <div className="relative p-6 md:p-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="space-y-2">
                <p className="text-xs uppercase tracking-[0.2em] text-white/80">Dashboard spotlight</p>
                <h2 className="text-2xl md:text-3xl font-bold">Track bookings, income, and spaces at a glance</h2>
                <p className="text-sm text-white/90 max-w-2xl">
                  Live map for drivers, income reports for providers, and quick actions to confirm, cancel, or check-in/out.
                </p>
              </div>
              <div className="flex gap-2 flex-wrap">
                <Button variant="blue" onClick={() => setProviderTab("overview")}>View overview</Button>
                <Button onClick={() => setDriverTab("search")}>Start searching</Button>
              </div>
            </div>
          </div>

          {role === "driver" && (
            <>
              <div className="flex flex-wrap gap-2">
                {[{ key: "map", label: "Map" }, { key: "search", label: "Search" }, { key: "bookings", label: "Bookings" }].map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setDriverTab(tab.key)}
                    className={`px-4 py-2 rounded-xl text-sm font-semibold border transition ${
                      driverTab === tab.key
                        ? "border-emerald-500 bg-emerald-50 text-emerald-800"
                        : "border-zinc-200 text-zinc-700 hover:border-emerald-300"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {driverTab === "map" && (
                <Card title="Live map & add places" actions={<Button onClick={saveMyLocation}>Save current GPS</Button>}>
                  <div className="grid gap-3 md:grid-cols-3">
                    <div className="md:col-span-2">
                      <LiveMap current={liveCurrent} places={customPlaces} results={mapResults} focus={mapFocus} radius={mapRadius} onAdd={addCustomPlace} />
                    </div>
                    <div className="space-y-3">
                      <p className="text-sm text-zinc-700">Current location real-time (blue). Tap map to add places (green). Search results show in orange with radius ring.</p>
                      <div className="space-y-2 border border-zinc-200 rounded-lg p-2 max-h-64 overflow-auto">
                        <p className="text-xs font-semibold text-zinc-700">Places</p>
                        {customPlaces.length === 0 && <p className="text-xs text-zinc-500">No places yet</p>}
                        {customPlaces.map((p, i) => (
                          <div key={`${p.lat}-${p.lng}-${i}`} className="text-xs text-zinc-700">
                            {p.address || "Custom"} ? {p.lat.toFixed(4)}, {p.lng.toFixed(4)}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </Card>
              )}

              {driverTab === "search" && (
                <>
                  <Card
                    title="Search garages (address or live GPS)"
                    actions={<Button variant="blue" onClick={() => runSearch({ useLive: true })}>Search around me</Button>}
                  >
                    <div className="grid gap-3 md:grid-cols-3">
                      <Input label="Address / area" value={searchForm.query} onChange={(v) => setSearchForm({ ...searchForm, query: v })} />
                      <Input label="Latitude (optional)" value={searchForm.lat} onChange={(v) => setSearchForm({ ...searchForm, lat: v })} />
                      <Input label="Longitude (optional)" value={searchForm.lng} onChange={(v) => setSearchForm({ ...searchForm, lng: v })} />
                      <Input label="Start time" type="datetime-local" value={searchForm.start_ts} onChange={(v) => setSearchForm({ ...searchForm, start_ts: v })} />
                      <Input label="End time" type="datetime-local" value={searchForm.end_ts} onChange={(v) => setSearchForm({ ...searchForm, end_ts: v })} />
                      <Input label="Radius (m)" type="number" min="100" max="5000" value={searchForm.radius_m} onChange={(v) => setSearchForm({ ...searchForm, radius_m: v })} />
                    </div>
                    <div className="mt-3 flex gap-2 flex-wrap">
                      <Button onClick={() => runSearch({ useLive: false })}>{searchLoading ? "Searching..." : "Search by address/lat"}</Button>
                      <Button variant="blue" onClick={() => runSearch({ useLive: true })}>Use live GPS</Button>
                      <Button
                        variant="danger"
                        onClick={() => {
                          setSearchResults([]);
                          setMapResults([]);
                          setMapFocus(null);
                          setMapRadius(null);
                        }}
                      >
                        Clear
                      </Button>
                    </div>
                    <Empty show={!searchLoading && searchResults.length === 0} text="No results yet" />
                    {searchResults.length > 0 && (
                      <div className="overflow-auto border border-zinc-200 rounded-xl">
                        <table className="w-full text-sm">
                          <thead className="bg-zinc-50">
                            <tr className="text-left">
                              <th className="px-3 py-2">Title</th>
                              <th className="px-3 py-2">Address</th>
                              <th className="px-3 py-2">Distance</th>
                              <th className="px-3 py-2 text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {searchResults.map((s) => (
                              <tr key={s.id} className="border-t border-zinc-100">
                                <td className="px-3 py-2 font-semibold">{s.title}</td>
                                <td className="px-3 py-2 text-zinc-600">{s.place_label || s.address}</td>
                                <td className="px-3 py-2">{Math.round(s.distance_m)} m</td>
                                <td className="px-3 py-2 text-right space-x-2">
                                  <Button variant="blue" onClick={() => viewResult(s)}>View</Button>
                                  <Button onClick={() => bookFromSearch(s.id)} variant="primary">Book</Button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                    {mapResults.length > 0 && (
                      <div className="mt-4">
                        <Card title="Map view of results">
                          <LiveMap current={liveCurrent} places={[]} results={mapResults} focus={mapFocus} radius={mapRadius} />
                          <p className="text-xs text-zinc-600 mt-2">Orange markers = found garages; blue = your live location.</p>
                        </Card>
                      </div>
                    )}
                  </Card>

                  <Card
                    title="Nearby search (saved location)"
                    actions={<Button variant="blue" onClick={saveMyLocation}>Save current GPS</Button>}
                  >
                    <div className="grid gap-3 md:grid-cols-3">
                      <Input label="Start time" type="datetime-local" value={nearbyForm.start_ts} onChange={(v) => setNearbyForm({ ...nearbyForm, start_ts: v })} />
                      <Input label="End time" type="datetime-local" value={nearbyForm.end_ts} onChange={(v) => setNearbyForm({ ...nearbyForm, end_ts: v })} />
                      <Input label="Radius (m)" type="number" min="100" max="5000" value={nearbyForm.radius_m} onChange={(v) => setNearbyForm({ ...nearbyForm, radius_m: v })} />
                    </div>
                    {locationSaved && <p className="text-xs text-emerald-700">Location saved. You can search now.</p>}
                    <div className="mt-3 flex gap-2">
                      <Button onClick={searchNearby} variant="amber">{nearbyLoading ? "Searching..." : "Search nearby"}</Button>
                      <Button
                        onClick={() => {
                          setNearbyResults([]);
                          setMapResults([]);
                          setMapFocus(null);
                          setMapRadius(null);
                        }}
                        variant="danger"
                      >
                        Clear
                      </Button>
                    </div>
                    <Empty show={!nearbyLoading && nearbyResults.length === 0} text="No nearby results yet" />
                    {nearbyResults.length > 0 && (
                      <div className="overflow-auto border border-zinc-200 rounded-xl">
                        <table className="w-full text-sm">
                          <thead className="bg-zinc-50">
                            <tr className="text-left">
                              <th className="px-3 py-2">Title</th>
                              <th className="px-3 py-2">Address</th>
                              <th className="px-3 py-2">Distance</th>
                              <th className="px-3 py-2 text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {nearbyResults.map((s) => (
                              <tr key={s.id} className="border-t border-zinc-100">
                                <td className="px-3 py-2 font-semibold">{s.title}</td>
                                <td className="px-3 py-2 text-zinc-600">{s.place_label || s.address}</td>
                                <td className="px-3 py-2">{Math.round(s.distance_m)} m</td>
                                <td className="px-3 py-2 text-right space-x-2">
                                  <Button variant="blue" onClick={() => viewResult(s)}>View</Button>
                                  <Button onClick={() => bookFromNearby(s.id)} variant="primary">Book</Button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </Card>
                </>
              )}

              {driverTab === "bookings" && (
                <Card title="My bookings" actions={<Button onClick={() => router.push("/")}>Search more</Button>}>
                  <Empty show={bookings.length === 0} text="No bookings yet" />
                  <div className="space-y-3">
                    {bookings.map((b) => (
                      <ListItem
                        key={b.id}
                        title={b.space?.title}
                        subtitle={`${b.start_ts} ? ${b.end_ts}`}
                        meta={`Status: ${b.status}${countdownForBooking(b) ? " | Time left: " + countdownForBooking(b) : ""}`}
                        actions={
                          ["reserved", "confirmed"].includes(b.status) ? (
                            <Button variant="danger" onClick={() => updateBookingStatus(b.id, "cancel")}>
                              Cancel
                            </Button>
                          ) : null
                        }
                      />
                    ))}
                  </div>
                </Card>
              )}
            </>
          )}
          {(role === "provider" || role === "admin") && (
            <>
              <div className="flex flex-wrap gap-2">
                {[
                  { key: "overview", label: "Overview" },
                  { key: "spaces", label: "Spaces" },
                  { key: "availability", label: "Availability" },
                  { key: "bookings", label: "Bookings" },
                  { key: "analytics", label: "Analytics" },
                ].map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setProviderTab(tab.key)}
                    className={`px-4 py-2 rounded-xl text-sm font-semibold border transition ${
                      providerTab === tab.key
                        ? "border-emerald-500 bg-emerald-50 text-emerald-800"
                        : "border-zinc-200 text-zinc-700 hover:border-emerald-300"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {providerTab === "overview" && (
                <Card title="Overview">
                  <div className="grid gap-3 md:grid-cols-4">
                    <Stat label="Spaces" value={providerStats.spaces} />
                    <Stat label="Active spaces" value={providerStats.activeSpaces} />
                    <Stat label="Total bookings" value={providerStats.bookings} />
                    <Stat label="Upcoming" value={providerStats.upcoming} />
                  </div>
                  <div className="mt-4">
                    <BarChart
                      title="Snapshot"
                      data={[
                        { label: "Spaces", value: providerStats.spaces },
                        { label: "Active", value: providerStats.activeSpaces },
                        { label: "Bookings", value: providerStats.bookings },
                        { label: "Upcoming", value: providerStats.upcoming },
                      ]}
                    />
                  </div>
                  <div className="mt-4 grid md:grid-cols-[1.2fr,0.8fr] gap-3">
                    <Card title="Monthly income (last 12)" actions={reportLoading ? <p className="text-xs text-zinc-500">Loading...</p> : null}>
                      <Empty show={!reportLoading && (report?.months?.length || 0) === 0} text="No completed bookings yet" />
                      {report?.months?.length > 0 && (
                        <table className="w-full text-sm">
                          <thead className="bg-zinc-50">
                            <tr className="text-left">
                              <th className="px-2 py-1">Month</th>
                              <th className="px-2 py-1 text-right">Count</th>
                              <th className="px-2 py-1 text-right">Income</th>
                            </tr>
                          </thead>
                          <tbody>
                            {report.months.map((m) => (
                              <tr key={m.month} className="border-t border-zinc-100">
                                <td className="px-2 py-1">{m.month}</td>
                                <td className="px-2 py-1 text-right">{m.count}</td>
                                <td className="px-2 py-1 text-right">{Number(m.total).toFixed(2)}</td>
                              </tr>
                            ))}
                          </tbody>
                          <tfoot>
                            <tr className="border-t border-zinc-200 font-semibold">
                              <td className="px-2 py-1">Total</td>
                              <td className="px-2 py-1 text-right">â€”</td>
                              <td className="px-2 py-1 text-right">{Number(report.total_income || 0).toFixed(2)}</td>
                            </tr>
                          </tfoot>
                        </table>
                      )}
                    </Card>
                    <Card title="Income chart" actions={reportLoading ? <p className="text-xs text-zinc-500">Loading...</p> : null}>
                      <BarChart
                        title="Completed bookings income"
                        data={(report?.months || []).map((m) => ({ label: m.month, value: Number(m.total) }))}
                      />
                    </Card>
                  </div>
                </Card>
              )}

              {providerTab === "spaces" && (
                <>
                  <Card title="Create parking space">
                    <div className="grid gap-3 md:grid-cols-2">
                      <div className="md:col-span-2">
                        <p className="text-sm text-zinc-700">Use your live GPS or tap on the map to set the parking location. Blue = you, green = selected spot.</p>
                      </div>
                      <div className="md:col-span-2">
                        <LiveMap
                          current={liveCurrent}
                          places={
                            picked?.lat && picked?.lng
                              ? [
                                  { lat: picked.lat, lng: picked.lng, address: picked.address || spaceForm.address || "Selected location" },
                                ]
                              : []
                          }
                          onAdd={(place) => {
                            setPicked(place);
                            setSpaceForm((prev) => ({
                              ...prev,
                              address: place.address || prev.address,
                              place_query: place.address || prev.place_query,
                            }));
                          }}
                        />
                      </div>
                      <div className="md:col-span-2 flex gap-2">
                        <Button onClick={useLiveForSpace}>Use my live GPS</Button>
                        <Button variant="danger" onClick={() => setPicked(null)}>
                          Clear selection
                        </Button>
                      </div>
                    </div>
                    <div className="grid gap-3 md:grid-cols-2">
                      <Input label="Title" value={spaceForm.title} onChange={(v) => setSpaceForm({ ...spaceForm, title: v })} />
                      <Input label="Address" value={spaceForm.address} onChange={(v) => setSpaceForm({ ...spaceForm, address: v })} />
                      <Input label="Place query (optional)" value={spaceForm.place_query} onChange={(v) => setSpaceForm({ ...spaceForm, place_query: v })} />
                      <Input label="Capacity" type="number" min="1" value={spaceForm.capacity} onChange={(v) => setSpaceForm({ ...spaceForm, capacity: v })} />
                      <div className="md:col-span-2">
                        <MapPicker value={picked} onChange={setPicked} />
                      </div>
                    </div>
                    <div className="mt-3">
                      <Button onClick={createSpace}>Create space</Button>
                    </div>
                  </Card>

                  <Card title="My spaces">
                    <Empty show={spaces.length === 0} text="No spaces yet" />
                    <div className="space-y-3">
                      {spaces.map((s) => (
                        <ListItem
                          key={s.id}
                          title={s.title}
                          subtitle={s.address || s.place_label || "No address set"}
                          meta={`Capacity ${s.capacity ?? 1} | Active: ${s.is_active ? "Yes" : "No"}`}
                        />
                      ))}
                    </div>
                  </Card>
                </>
              )}

              {providerTab === "availability" && (
                <Card title="Create availability window">
                  <div className="grid gap-3 md:grid-cols-4">
                    <Select
                      label="Select space"
                      value={availabilityForm.space_id}
                      onChange={(v) => setAvailabilityForm({ ...availabilityForm, space_id: v })}
                      options={spaces.map((s) => ({ value: s.id, label: s.title }))}
                    />
                    <Input label="Start time" type="datetime-local" value={availabilityForm.start_ts} onChange={(v) => setAvailabilityForm({ ...availabilityForm, start_ts: v })} />
                    <Input label="End time" type="datetime-local" value={availabilityForm.end_ts} onChange={(v) => setAvailabilityForm({ ...availabilityForm, end_ts: v })} />
                    <Input label="Price/hour" type="number" min="0" value={availabilityForm.base_price_per_hour} onChange={(v) => setAvailabilityForm({ ...availabilityForm, base_price_per_hour: v })} />
                  </div>
                  <div className="mt-3">
                    <Button onClick={addAvailability}>Add availability</Button>
                  </div>
                  <div className="mt-4 space-y-2">
                    <p className="text-sm font-semibold text-zinc-700">Active availability</p>
                    {availabilityLoading && <p className="text-sm text-zinc-500">Loading...</p>}
                    <Empty show={!availabilityLoading && availabilityList.length === 0} text="No active windows" />
                    <div className="space-y-2">
                      {availabilityList.map((av) => (
                        <ListItem
                          key={av.id}
                          title={`${formatDateTime(av.start_ts)} â†’ ${formatDateTime(av.end_ts)}`}
                          subtitle={`Price/hour: ${av.base_price_per_hour}`}
                          meta={av.is_active ? "Active" : "Inactive"}
                        />
                      ))}
                    </div>
                  </div>
                </Card>
              )}

              {providerTab === "bookings" && (
                <Card title="My spaces bookings">
                  <Empty show={providerBookings.length === 0} text="No bookings yet" />
                  <div className="space-y-3">
                    {providerBookings.map((b) => (
                      <ListItem
                        key={b.id}
                        title={b.space?.title}
                        subtitle={`${b.start_ts} ? ${b.end_ts}`}
                        meta={`Status: ${b.status}${countdownForBooking(b) ? " | Time left: " + countdownForBooking(b) : ""}`}
                        actions={
                          <div className="flex gap-2 flex-wrap">
                            {b.status === "reserved" && <Button onClick={() => updateBookingStatus(b.id, "confirm")}>Confirm</Button>}
                            {["reserved", "confirmed"].includes(b.status) && (
                              <Button variant="danger" onClick={() => updateBookingStatus(b.id, "cancel")}>
                                Cancel
                              </Button>
                            )}
                            {b.status === "confirmed" && (
                              <Button variant="amber" onClick={() => updateBookingStatus(b.id, "check-in")}>
                                Check-in
                              </Button>
                            )}
                            {b.status === "checked_in" && (
                              <Button variant="blue" onClick={() => updateBookingStatus(b.id, "check-out")}>
                                Check-out
                              </Button>
                            )}
                          </div>
                        }
                      />
                    ))}
                  </div>
                </Card>
              )}

              {providerTab === "analytics" && (
                <Card title="Analytics (quick view)">
                  <p className="text-sm text-zinc-600">Quick snapshot: {providerStats.bookings} bookings, {providerStats.upcoming} upcoming, {providerStats.activeSpaces} active spaces.</p>
                </Card>
              )}
            </>
          )}
        </section>
      </div>
    </main>
  );
}
function Stat({ label, value }) {
  return (
    <div className="border border-zinc-200 rounded-xl p-3 bg-white shadow-sm">
      <p className="text-xs text-zinc-500">{label}</p>
      <p className="text-lg font-semibold text-zinc-900">{value}</p>
    </div>
  );
}

function BarChart({ title, data = [] }) {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div className="border border-zinc-200 rounded-xl p-3 bg-white shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-semibold text-zinc-900">{title}</p>
        <p className="text-xs text-zinc-500">Simple bar view</p>
      </div>
      <div className="flex items-end gap-3">
        {data.map((d) => (
          <div key={d.label} className="flex-1 text-center">
            <div
              className="bg-emerald-500/80 rounded-t-md mx-auto"
              style={{
                height: `${(d.value / max) * 120 || 4}px`,
                minHeight: d.value > 0 ? "8px" : "4px",
              }}
              title={`${d.label}: ${d.value}`}
            ></div>
            <p className="text-xs text-zinc-600 mt-1">{d.label}</p>
            <p className="text-xs font-semibold text-zinc-800">{d.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function Card({ title, actions, children }) {
  return (
    <div className="bg-white border border-zinc-200 rounded-2xl shadow-sm p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-zinc-900">{title}</h2>
        {actions}
      </div>
      {children}
    </div>
  );
}

function Button({ children, onClick, variant = "primary" }) {
  const styles =
    variant === "danger"
      ? "border border-red-200 text-red-700 hover:bg-red-50"
      : variant === "amber"
      ? "bg-amber-500 text-white hover:bg-amber-600"
      : variant === "blue"
      ? "bg-blue-600 text-white hover:bg-blue-700"
      : "bg-emerald-600 text-white hover:bg-emerald-700";
  return (
    <button onClick={onClick} className={`px-3 py-2 rounded-lg text-sm font-semibold transition ${styles}`}>
      {children}
    </button>
  );
}

function Input({ label, value, onChange, ...props }) {
  return (
    <label className="space-y-1 text-sm text-zinc-700">
      <span>{label}</span>
      <input
        {...props}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-zinc-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
      />
    </label>
  );
}

function Select({ label, value, onChange, options }) {
  return (
    <label className="space-y-1 text-sm text-zinc-700">
      <span>{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-zinc-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
      >
        <option value="">-- select --</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function ListItem({ title, subtitle, meta, actions }) {
  return (
    <div className="border border-zinc-200 rounded-xl p-3 flex items-center justify-between gap-3">
      <div className="space-y-1">
        <p className="font-semibold">{title}</p>
        {subtitle && <p className="text-xs text-zinc-500">{subtitle}</p>}
        {meta && <p className="text-xs text-zinc-500">{meta}</p>}
      </div>
      {actions && <div className="flex gap-2 flex-wrap">{actions}</div>}
    </div>
  );
}

function Empty({ show, text }) {
  if (!show) return null;
  return <p className="text-sm text-zinc-600">{text}</p>;
}

