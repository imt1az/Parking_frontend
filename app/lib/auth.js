"use client";

const STORAGE_KEY = "parking_auth";

export function loadAuth() {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch (e) {
    return null;
  }
}

export function saveAuth(auth) {
  if (typeof window === "undefined") return;
  // auth = { user, access_token, token_type, expires_in, ... }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(auth));
}

export function clearAuth() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
}
