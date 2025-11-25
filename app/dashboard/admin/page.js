"use client";

import { useEffect, useState } from "react";
import Card from "../../components/ui/Card";
import { api, session } from "../../../lib/api";

export default function AdminPage() {
  const [auth] = useState(() => session.get());
  const [stats, setStats] = useState(null);
  const [flash, setFlash] = useState("");

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    try {
      const spaces = await api.mySpaces(auth.token);
      const bookings = await api.bookingsForSpaces(auth.token);
      setStats({
        spaces: (spaces.data || spaces || []).length,
        bookings: (bookings.data || bookings || []).length,
      });
    } catch (e) {
      setFlash(e.message);
    }
  };

  return (
    <div className="grid" style={{ gap: 16 }}>
      <Card className="hero">
        <div className="badge">Admin</div>
        <h2 className="section-title">সিস্টেম ওভারভিউ</h2>
        <p className="muted">দ্রুত স্ট্যাট: স্পেস ও বুকিং সংখ্যা (ব্যাকএন্ড ইউজার তালিকা এখানে নেই)।</p>
      </Card>
      {flash && <Card style={{ borderColor: "var(--danger)" }}>{flash}</Card>}
      <Card className="grid two">
        <div>
          <div className="label">Spaces (owned/admin view)</div>
          <h3 className="title" style={{ fontSize: 28 }}>{stats?.spaces ?? "--"}</h3>
        </div>
        <div>
          <div className="label">Bookings (for spaces)</div>
          <h3 className="title" style={{ fontSize: 28 }}>{stats?.bookings ?? "--"}</h3>
        </div>
      </Card>
    </div>
  );
}
