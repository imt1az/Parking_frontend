"use client";

export default function Loader({ label = "Loading..." }) {
  return (
    <div className="row muted" style={{ gap: 8 }}>
      <span className="badge" style={{ background: "rgba(255,255,255,0.08)" }}>●</span>
      {label}
    </div>
  );
}
