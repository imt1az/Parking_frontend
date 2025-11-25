"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { session } from "../../lib/api";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";

export default function DashboardLayout({ children }) {
  const router = useRouter();
  const [state, setState] = useState({ token: "", user: null });

  useEffect(() => {
    const s = session.get();
    if (!s.token) {
      router.replace("/login");
    } else {
      setState(s);
    }
  }, [router]);

  if (!state.token) return null;

  return (
    <main className="shell">
      <Card className="row" style={{ justifyContent: "space-between", alignItems: "center" }}>
        <div className="row" style={{ gap: 12 }}>
          <div className="badge">Dashboard</div>
          <strong>{state.user?.name}</strong>
          <span className="chip">{state.user?.role}</span>
        </div>
        <div className="row" style={{ gap: 8 }}>
          <Button variant="ghost" onClick={() => router.push("/dashboard")}>
            Home
          </Button>
          <Button variant="ghost" onClick={() => router.push("/dashboard/driver")}>
            Driver
          </Button>
          <Button variant="ghost" onClick={() => router.push("/dashboard/provider")}>
            Provider
          </Button>
          <Button variant="ghost" onClick={() => router.push("/dashboard/admin")}>
            Admin
          </Button>
        </div>
      </Card>
      <div style={{ marginTop: 16 }}>{children}</div>
    </main>
  );
}
