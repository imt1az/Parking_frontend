"use client";

export default function AuthCard({ mode, form, onChange, onSubmit, onToggle }) {
  const isRegister = mode === "register";

  return (
    <div className="glass card">
      <div className="pill">{isRegister ? "Register" : "Login"}</div>
      <h3 className="section-title" style={{ marginTop: 10 }}>
        {isRegister ? "নতুন একাউন্ট খুলুন" : "একাউন্টে প্রবেশ"}
      </h3>
      {isRegister && (
        <div style={{ marginBottom: 10 }}>
          <div className="label">Name</div>
          <input
            className="input"
            value={form.name}
            onChange={(e) => onChange({ ...form, name: e.target.value })}
            placeholder="Full name"
          />
        </div>
      )}
      <div style={{ marginBottom: 10 }}>
        <div className="label">Phone</div>
        <input
          className="input"
          value={form.phone}
          onChange={(e) => onChange({ ...form, phone: e.target.value })}
          placeholder="017xxxxxxxx"
        />
      </div>
      <div style={{ marginBottom: 10 }}>
        <div className="label">Password</div>
        <input
          type="password"
          className="input"
          value={form.password}
          onChange={(e) => onChange({ ...form, password: e.target.value })}
          placeholder="••••••••"
        />
      </div>
      {isRegister && (
        <div style={{ marginBottom: 12 }}>
          <div className="label">Role</div>
          <select
            className="input"
            value={form.role}
            onChange={(e) => onChange({ ...form, role: e.target.value })}
          >
            <option value="driver">Driver</option>
            <option value="provider">Provider</option>
            <option value="admin">Admin</option>
          </select>
        </div>
      )}
      <div className="row" style={{ justifyContent: "space-between" }}>
        <button className="btn btn-primary" onClick={onSubmit}>
          {isRegister ? "Register" : "Login"}
        </button>
        <button className="btn btn-ghost" onClick={onToggle}>
          {isRegister ? "Login instead" : "Register instead"}
        </button>
      </div>
    </div>
  );
}
