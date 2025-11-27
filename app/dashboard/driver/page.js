"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "../../lib/api";
import { clearAuth, loadAuth } from "../../lib/auth";

export default function DriverPage() {
  const router = useRouter();
  const [auth, setAuth] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [bookings, setBookings] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const existing = loadAuth();
    if (!existing?.access_token || existing?.user?.role !== "driver") {
      clearAuth();
      router.replace("/login");
      return;
    }
    setAuth(existing);
    setAuthChecked(true);
    setLoading(false);
  }, [router]);

  const loadBookings = useCallback(async () => {
    if (!auth?.access_token) return;
    try {
      const res = await apiFetch("/bookings/my", { token: auth.access_token });
      setBookings(res?.data || res || []);
    } catch (e) {
      setError(e.message);
    }
  }, [auth?.access_token]);

  useEffect(() => {
    if (!authChecked || !auth?.access_token) return;
    loadBookings();
  }, [authChecked, auth?.access_token, loadBookings]);

  const updateBookingStatus = async (id, action) => {
    try {
      await apiFetch(`/bookings/${id}/${action}`, {
        method: "PATCH",
        token: auth?.access_token,
      });
      loadBookings();
    } catch (e) {
      setError(e.message);
    }
  };

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
              Driver
            </p>
            <h1 className="text-2xl font-bold">আমার বুকিং</h1>
            <p className="text-sm text-zinc-600">
              দ্রুত বুকিং দেখুন, বাতিল করুন, নতুন সার্চের জন্য হোমে যান।
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => router.push("/")}
              className="px-4 py-2 rounded-lg border border-emerald-200 text-emerald-700 font-semibold hover:border-emerald-400"
            >
              পার্কিং সার্চ
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

        <section className="bg-white border border-zinc-200 rounded-2xl shadow-sm p-5 space-y-3">
          {bookings.length === 0 && (
            <p className="text-sm text-zinc-600">কোনো বুকিং নেই।</p>
          )}
          {bookings.map((b) => (
            <div
              key={b.id}
              className="border border-zinc-200 rounded-xl p-3 flex items-center justify-between gap-3"
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
                {["reserved", "confirmed"].includes(b.status) && (
                  <button
                    onClick={() => updateBookingStatus(b.id, "cancel")}
                    className="px-3 py-2 rounded-lg border border-red-200 text-red-700 text-sm hover:bg-red-50"
                  >
                    বাতিল
                  </button>
                )}
              </div>
            </div>
          ))}
        </section>
      </div>
    </main>
  );
}
