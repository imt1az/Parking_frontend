"use client";

export default function Flash({ message }) {
  if (!message) return null;
  return (
    <div className="glass card" style={{ marginTop: 12, borderColor: "var(--accent)" }}>
      {message}
    </div>
  );
}
