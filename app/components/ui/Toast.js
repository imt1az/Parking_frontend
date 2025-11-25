"use client";

export default function Toast({ message }) {
  if (!message) return null;
  return (
    <div className="glass card" style={{ borderColor: "var(--accent)" }}>
      {message}
    </div>
  );
}
