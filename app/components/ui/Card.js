"use client";

export default function Card({ children, className = "", ...props }) {
  return (
    <div className={`glass card ${className}`} {...props}>
      {children}
    </div>
  );
}
