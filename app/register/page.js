"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api, session } from "../../lib/api";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import Select from "../components/ui/Select";
import Card from "../components/ui/Card";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    phone: "",
    password: "",
    role: "driver",
  });
  const [flash, setFlash] = useState("");

  const submit = async () => {
    try {
      const data = await api.register(form);
      session.set(data.access_token, data.user);
      setFlash("Registered & logged in");
      router.push("/dashboard");
    } catch (e) {
      setFlash(e.message);
    }
  };

  return (
    <main className="shell">
      <div className="hero">
        <div className="badge">Parking Chai</div>
        <h1 className="title">Register</h1>
        <p className="muted">Driver / Provider / Admin যে কোনো রোলে জয়েন করুন।</p>
      </div>
      {flash && <Card style={{ borderColor: "var(--accent)" }}>{flash}</Card>}
      <Card className="grid" style={{ gap: 12, maxWidth: 480, marginTop: 12 }}>
        <div>
          <div className="label">Name</div>
          <Input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Full name"
          />
        </div>
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
        <div>
          <div className="label">Role</div>
          <Select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
            <option value="driver">Driver</option>
            <option value="provider">Provider</option>
            <option value="admin">Admin</option>
          </Select>
        </div>
        <Button onClick={submit}>Register</Button>
        <Button variant="ghost" onClick={() => router.push("/login")}>
          Already have account? Login
        </Button>
      </Card>
    </main>
  );
}
