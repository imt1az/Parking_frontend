"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { apiFetch } from "../lib/api";
import { clearAuth, loadAuth } from "../lib/auth";

const MapPicker = dynamic(() => import("../components/MapPicker"), { ssr: false });

export default function DashboardPage() {
  const router = useRouter();
  const [auth, setAuth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);
  const [error, setError] = useState("");

  const [bookings, setBookings] = useState([]);
  const [providerBookings, setProviderBookings] = useState([]);
  const [spaces, setSpaces] = useState([]);

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

  // Auth check once
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

  // Data loaders
  const loadDriver = useCallback(async () => {
    try {
      const res = await apiFetch("/bookings/my", { token: auth?.access_token });
      setBookings(res?.data || res || []);
    } catch (e) {
      setError(e.message);
    }
  }, [auth?.access_token]);

  const loadSpaces = useCallback(async () => {
    try {
      const res = await apiFetch("/spaces/my", { token: auth?.access_token });
      setSpaces(res?.data || res || []);
    } catch (e) {
      setError(e.message);
    }
  }, [auth?.access_token]);

  const loadProviderBookings = useCallback(async () => {
    try {
      const res = await apiFetch("/bookings/for-my-spaces", {
        token: auth?.access_token,
      });
      setProviderBookings(res?.data || res || []);
    } catch (e) {
      setError(e.message);
    }
  }, [auth?.access_token]);

  // Run loaders when auth ready
  useEffect(() => {
    if (!authChecked || !auth?.access_token) return;
    const role = auth.user?.role;
    if (role === "driver") loadDriver();
    if (role === "provider" || role === "admin") {
      loadSpaces();
      loadProviderBookings();
    }
  }, [authChecked, auth?.access_token, auth?.user?.role, loadDriver, loadSpaces, loadProviderBookings]);

  const logout = () => {
    clearAuth();
    router.replace("/login");
  };

  const createSpace = async () => {
    try {
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
    } catch (e) {
      setError(e.message);
    }
  };

  const addAvailability = async () => {
    try {
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
      loadProviderBookings();
    } catch (e) {
      setError(e.message);
    }
  };

  const updateBookingStatus = async (id, action) => {
    try {
      await apiFetch(`/bookings/${id}/${action}`, {
        method: "PATCH",
        token: auth?.access_token,
      });
      loadDriver();
      loadProviderBookings();
    } catch (e) {
      setError(e.message);
    }
  };

  if (loading || !authChecked) return null;
  const role = auth?.user?.role;

  return (
    <main className="min-h-screen bg-zinc-50 text-zinc-900">
      <header className="flex items-center justify-between px-6 py-4 bg-white border-b border-zinc-200">
        <div className="flex items-center gap-2">
          <div className="h-10 w-10 rounded-xl bg-emerald-600 text-white grid place-items-center font-bold">
            D
          </div>
          <div>
            <p className="text-xs text-emerald-600 font-semibold uppercase tracking-[0.2em]">
              Dashboard
            </p>
            <h1 className="font-bold text-lg">Role: {role}</h1>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-zinc-600">{auth?.user?.name}</span>
          <button
            onClick={logout}
            className="px-3 py-2 rounded-lg border border-zinc-200 hover:border-emerald-300"
          >
            লগআউট
          </button>
        </div>
      </header>

      <div className="p-6 space-y-6">
        {error && (
          <div className="p-3 rounded-lg bg-red-50 text-red-700 border border-red-100">
            {error}
          </div>
        )}

        {role === "driver" && (
          <section className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">আমার বুকিং</h2>
              <button
                onClick={() => router.push("/")}
                className="text-sm text-emerald-700 font-semibold"
              >
                নতুন পার্কিং খুঁজুন
              </button>
            </div>
            <div className="grid gap-3">
              {bookings.length === 0 && (
                <p className="text-sm text-zinc-600">কোনো বুকিং নেই।</p>
              )}
              {bookings.map((b) => (
                <div
                  key={b.id}
                  className="border border-zinc-200 rounded-xl p-3 flex items-center justify-between"
                >
                  <div className="space-y-1">
                    <p className="font-semibold">{b.space?.title}</p>
                    <p className="text-xs text-zinc-500">
                      {b.start_ts} → {b.end_ts}
                    </p>
                    <p className="text-xs text-zinc-500">
                      স্ট্যাটাস: <span className="font-semibold">{b.status}</span>
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {["reserved", "confirmed"].includes(b.status) && (
                      <button
                        onClick={() => updateBookingStatus(b.id, "cancel")}
                        className="px-3 py-2 rounded-lg border border-red-200 text-red-700"
                      >
                        বাতিল
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {(role === "provider" || role === "admin") && (
          <>
            <section className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">স্পেস তৈরি করুন</h2>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <input
                  className="border border-zinc-200 rounded-lg px-3 py-2"
                  placeholder="শিরোনাম"
                  value={spaceForm.title}
                  onChange={(e) =>
                    setSpaceForm({ ...spaceForm, title: e.target.value })
                  }
                />
                <input
                  className="border border-zinc-200 rounded-lg px-3 py-2"
                  placeholder="ঠিকানা"
                  value={spaceForm.address}
                  onChange={(e) =>
                    setSpaceForm({ ...spaceForm, address: e.target.value })
                  }
                />
                <input
                  className="border border-zinc-200 rounded-lg px-3 py-2"
                  placeholder="place_query (ঠিকানা/এলাকা)"
                  value={spaceForm.place_query}
                  onChange={(e) =>
                    setSpaceForm({ ...spaceForm, place_query: e.target.value })
                  }
                />
                <input
                  type="number"
                  min="1"
                  className="border border-zinc-200 rounded-lg px-3 py-2"
                  placeholder="Capacity"
                  value={spaceForm.capacity}
                  onChange={(e) =>
                    setSpaceForm({ ...spaceForm, capacity: e.target.value })
                  }
                />
                <div className="md:col-span-2">
                  <MapPicker value={picked} onChange={setPicked} />
                </div>
              </div>
              <div className="mt-3">
                <button
                  onClick={createSpace}
                  className="px-4 py-2 rounded-lg bg-emerald-600 text-white font-semibold"
                >
                  তৈরি করুন
                </button>
              </div>
            </section>

            <section className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">আমার স্পেস</h2>
              </div>
              <div className="grid gap-3">
                {spaces.length === 0 && (
                  <p className="text-sm text-zinc-600">কোনো স্পেস নেই।</p>
                )}
                {spaces.map((s) => (
                  <div
                    key={s.id}
                    className="border border-zinc-200 rounded-xl p-3 flex items-center justify-between"
                  >
                    <div className="space-y-1">
                      <p className="font-semibold">{s.title}</p>
                      <p className="text-xs text-zinc-500">
                        {s.address || s.place_label || "ঠিকানা নেই"}
                      </p>
                      <p className="text-xs text-zinc-500">
                        Capacity {s.capacity ?? 1} | Active:{" "}
                        {s.is_active ? "Yes" : "No"}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">অ্যাভেইলেবিলিটি যোগ করুন</h2>
              </div>
              <div className="grid gap-3 md:grid-cols-4">
                <select
                  className="border border-zinc-200 rounded-lg px-3 py-2"
                  value={availabilityForm.space_id}
                  onChange={(e) =>
                    setAvailabilityForm({
                      ...availabilityForm,
                      space_id: e.target.value,
                    })
                  }
                >
                  <option value="">স্পেস নির্বাচন</option>
                  {spaces.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.title}
                    </option>
                  ))}
                </select>
                <input
                  type="datetime-local"
                  className="border border-zinc-200 rounded-lg px-3 py-2"
                  value={availabilityForm.start_ts}
                  onChange={(e) =>
                    setAvailabilityForm({
                      ...availabilityForm,
                      start_ts: e.target.value,
                    })
                  }
                />
                <input
                  type="datetime-local"
                  className="border border-zinc-200 rounded-lg px-3 py-2"
                  value={availabilityForm.end_ts}
                  onChange={(e) =>
                    setAvailabilityForm({
                      ...availabilityForm,
                      end_ts: e.target.value,
                    })
                  }
                />
                <input
                  type="number"
                  min="0"
                  className="border border-zinc-200 rounded-lg px-3 py-2"
                  placeholder="Price/hour"
                  value={availabilityForm.base_price_per_hour}
                  onChange={(e) =>
                    setAvailabilityForm({
                      ...availabilityForm,
                      base_price_per_hour: e.target.value,
                    })
                  }
                />
              </div>
              <div className="mt-3">
                <button
                  onClick={addAvailability}
                  className="px-4 py-2 rounded-lg bg-emerald-600 text-white font-semibold"
                >
                  যোগ করুন
                </button>
              </div>
            </section>

            <section className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">আমার স্পেসের বুকিং</h2>
              </div>
              <div className="grid gap-3">
                {providerBookings.length === 0 && (
                  <p className="text-sm text-zinc-600">কোনো বুকিং নেই।</p>
                )}
                {providerBookings.map((b) => (
                  <div
                    key={b.id}
                    className="border border-zinc-200 rounded-xl p-3 flex items-center justify-between"
                  >
                    <div className="space-y-1">
                      <p className="font-semibold">{b.space?.title}</p>
                      <p className="text-xs text-zinc-500">
                        {b.start_ts} → {b.end_ts}
                      </p>
                      <p className="text-xs text-zinc-500">
                        স্ট্যাটাস: <span className="font-semibold">{b.status}</span>
                      </p>
                    </div>
                    <div className="flex gap-2 flex-wrap justify-end">
                      {b.status === "reserved" && (
                        <button
                          onClick={() => updateBookingStatus(b.id, "confirm")}
                          className="px-3 py-2 rounded-lg bg-emerald-600 text-white text-sm"
                        >
                          কনফার্ম
                        </button>
                      )}
                      {["reserved", "confirmed"].includes(b.status) && (
                        <button
                          onClick={() => updateBookingStatus(b.id, "cancel")}
                          className="px-3 py-2 rounded-lg border border-red-200 text-red-700 text-sm"
                        >
                          বাতিল
                        </button>
                      )}
                      {b.status === "confirmed" && (
                        <button
                          onClick={() => updateBookingStatus(b.id, "check-in")}
                          className="px-3 py-2 rounded-lg bg-amber-500 text-white text-sm"
                        >
                          চেক-ইন
                        </button>
                      )}
                      {b.status === "checked_in" && (
                        <button
                          onClick={() => updateBookingStatus(b.id, "check-out")}
                          className="px-3 py-2 rounded-lg bg-blue-600 text-white text-sm"
                        >
                          চেক-আউট
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </>
        )}
      </div>
    </main>
  );
}
