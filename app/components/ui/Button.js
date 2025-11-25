"use client";

export default function Button({ children, variant = "primary", ...props }) {
  const base = "btn";
  const variantClass = variant === "ghost" ? "btn-ghost" : "btn-primary";
  return (
    <button className={`${base} ${variantClass}`} {...props}>
      {children}
    </button>
  );
}
