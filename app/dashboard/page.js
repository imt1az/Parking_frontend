"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
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

  const [providerTab, setProviderTab] = useState("spaces"); // spaces | availability | bookings

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

  // Prefill address from map pick
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

  const role = auth?.user?.role;

  const sidebar = useMemo(() => {
    const items = [];
    if (role === "driver") items.push({ label: "ড্রাইভার", onClick: () => {} });
    if (role === "provider") items.push({ label: "প্রোভাইডার", onClick: () => {} });
    if (role === "admin") items.push({ label: "অ্যাডমিন", onClick: () => {} });
    return items;
  }, [role]);

  if (loading || !authChecked) return null;

  return (
    <main className="min-h-screen bg-gradient-to-br from-zinc-50 via-white to-emerald-50/20 text-zinc-900">
      <div className="max-w-6xl mx-auto p-6 grid md:grid-cols-[240px,1fr] gap-6">
        <aside className="bg-white border border-zinc-200 rounded-2xl shadow-sm p-4 space-y-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-emerald-600 text-white grid place-items-center font-bold">
              P
            </div>
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
              লগআউট
            </button>
          </div>
        </aside>

        <section className="space-y-6">
          {error && (
            <div className="p-3 rounded-xl bg-red-50 text-red-700 border border-red-100">
              {error}
            </div>
          )}

          {role === "driver" && (
            <Card title="আমার বুকিং" actions={<Button onClick={() => router.push("/")}>নতুন পার্কিং খুঁজুন</Button>}>
              <Empty show={bookings.length === 0} text="কোনো বুকিং নেই।" />
              <div className="space-y-3">
                {bookings.map((b) => (
                  <ListItem
                    key={b.id}
                    title={b.space?.title}
                    subtitle={`${b.start_ts} → ${b.end_ts}`}
                    meta={`স্ট্যাটাস: ${b.status}`}
                    actions={
                      ["reserved", "confirmed"].includes(b.status) ? (
                        <Button variant="danger" onClick={() => updateBookingStatus(b.id, "cancel")}>
                          বাতিল
                        </Button>
                      ) : null
                    }
                  />
                ))}
              </div>
            </Card>
          )}

          {(role === "provider" || role === "admin") && (
            <>
              <div className="flex flex-wrap gap-2">
                {[
                  { key: "spaces", label: "স্পেস" },
                  { key: "availability", label: "অ্যাভেইলেবিলিটি" },
                  { key: "bookings", label: "বুকিং" },
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

              {providerTab === "spaces" && (
                <>
                  <Card title="স্পেস তৈরি করুন">
                    <div className="grid gap-3 md:grid-cols-2">
                      <Input
                        label="শিরোনাম"
                        value={spaceForm.title}
                        onChange={(v) => setSpaceForm({ ...spaceForm, title: v })}
                      />
                      <Input
                        label="ঠিকানা"
                        value={spaceForm.address}
                        onChange={(v) => setSpaceForm({ ...spaceForm, address: v })}
                      />
                      <Input
                        label="place_query (ঠিকানা/এলাকা)"
                        value={spaceForm.place_query}
                        onChange={(v) => setSpaceForm({ ...spaceForm, place_query: v })}
                      />
                      <Input
                        label="Capacity"
                        type="number"
                        min="1"
                        value={spaceForm.capacity}
                        onChange={(v) => setSpaceForm({ ...spaceForm, capacity: v })}
                      />
                      <div className="md:col-span-2">
                        <MapPicker value={picked} onChange={setPicked} />
                      </div>
                    </div>
                    <div className="mt-3">
                      <Button onClick={createSpace}>তৈরি করুন</Button>
                    </div>
                  </Card>

                  <Card title="আমার স্পেস">
                    <Empty show={spaces.length === 0} text="কোনো স্পেস নেই।" />
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
                </>
              )}

              {providerTab === "availability" && (
                <Card title="অ্যাভেইলেবিলিটি যোগ করুন">
                  <div className="grid gap-3 md:grid-cols-4">
                    <Select
                      label="স্পেস নির্বাচন"
                      value={availabilityForm.space_id}
                      onChange={(v) => setAvailabilityForm({ ...availabilityForm, space_id: v })}
                      options={spaces.map((s) => ({ value: s.id, label: s.title }))}
                    />
                    <Input
                      label="শুরুর সময়"
                      type="datetime-local"
                      value={availabilityForm.start_ts}
                      onChange={(v) => setAvailabilityForm({ ...availabilityForm, start_ts: v })}
                    />
                    <Input
                      label="শেষ সময়"
                      type="datetime-local"
                      value={availabilityForm.end_ts}
                      onChange={(v) => setAvailabilityForm({ ...availabilityForm, end_ts: v })}
                    />
                    <Input
                      label="Price/hour"
                      type="number"
                      min="0"
                      value={availabilityForm.base_price_per_hour}
                      onChange={(v) =>
                        setAvailabilityForm({ ...availabilityForm, base_price_per_hour: v })
                      }
                    />
                  </div>
                  <div className="mt-3">
                    <Button onClick={addAvailability}>যোগ করুন</Button>
                  </div>
                </Card>
              )}

              {providerTab === "bookings" && (
                <Card title="আমার স্পেসের বুকিং">
                  <Empty show={providerBookings.length === 0} text="কোনো বুকিং নেই।" />
                  <div className="space-y-3">
                    {providerBookings.map((b) => (
                      <ListItem
                        key={b.id}
                        title={b.space?.title}
                        subtitle={`${b.start_ts} → ${b.end_ts}`}
                        meta={`স্ট্যাটাস: ${b.status}`}
                        actions={
                          <div className="flex gap-2 flex-wrap">
                            {b.status === "reserved" && (
                              <Button onClick={() => updateBookingStatus(b.id, "confirm")}>
                                কনফার্ম
                              </Button>
                            )}
                            {["reserved", "confirmed"].includes(b.status) && (
                              <Button variant="danger" onClick={() => updateBookingStatus(b.id, "cancel")}>
                                বাতিল
                              </Button>
                            )}
                            {b.status === "confirmed" && (
                              <Button variant="amber" onClick={() => updateBookingStatus(b.id, "check-in")}>
                                চেক-ইন
                              </Button>
                            )}
                            {b.status === "checked_in" && (
                              <Button variant="blue" onClick={() => updateBookingStatus(b.id, "check-out")}>
                                চেক-আউট
                              </Button>
                            )}
                          </div>
                        }
                      />
                    ))}
                  </div>
                </Card>
              )}
            </>
          )}
        </section>
      </div>
    </main>
  );
}

// UI helpers
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
    <button
      onClick={onClick}
      className={`px-3 py-2 rounded-lg text-sm font-semibold transition ${styles}`}
    >
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
        <option value="">-- নির্বাচন করুন --</option>
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
