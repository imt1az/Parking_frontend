"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api, session } from "../../lib/api";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import Card from "../components/ui/Card";

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ phone: "", password: "" });
  const [flash, setFlash] = useState("");

  const submit = async () => {
    try {
      const data = await api.login(form);
      session.set(data.access_token, data.user);
      setFlash("Logged in");
      router.push("/dashboard");
    } catch (e) {
      setFlash(e.message);
    }
  };

  return (
    <main className="shell">
      <div className="hero">
        <div className="badge">Parking Chai</div>
        <h1 className="title">Login</h1>
        <p className="muted">ফোন ও পাসওয়ার্ড দিয়ে লগইন করুন।</p>
      </div>
      {flash && <Card style={{ borderColor: "var(--accent)" }}>{flash}</Card>}
      <Card className="grid" style={{ gap: 12, maxWidth: 480, marginTop: 12 }}>
        <div>
          <div className="label">Phone</div>
          <Input
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            placeholder="01700000001"
          />
        </div>
        <div>
          <div className="label">Password</div>
          <Input
            type="password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            placeholder="password"
          />
        </div>
        <Button onClick={submit}>Login</Button>
        <Button variant="ghost" onClick={() => router.push("/register")}>
          Need an account? Register
        </Button>
      </Card>
    </main>
  );
}
