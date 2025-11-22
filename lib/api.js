"use client";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000/api/v1";

const baseHeaders = { "Content-Type": "application/json" };

const request = async (path, { method = "GET", body, token, auth = true } = {}) => {
  const headers = { ...baseHeaders };
  if (auth && token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  let data = {};
  try {
    data = await res.json();
  } catch (_) {}

  if (!res.ok) {
    const msg =
      data?.error?.message ||
      data?.message ||
      Object.values(data?.errors || {})[0]?.[0] ||
      res.statusText;
    throw new Error(msg);
  }
  return data;
};

export const api = {
  login: (body) => request("/auth/login", { method: "POST", body, auth: false }),
  register: (body) => request("/auth/register", { method: "POST", body, auth: false }),
  search: (query) => request(`/search?${new URLSearchParams(query).toString()}`, { auth: false }),

  myBookings: (token) => request("/bookings/my", { token }),
  bookingsForSpaces: (token) => request("/bookings/for-my-spaces", { token }),
  bookingAction: (id, action, token) =>
    request(`/bookings/${id}/${action}`, { method: "PATCH", token }),

  createBooking: (body, token) => request("/bookings", { method: "POST", body, token }),

  mySpaces: (token) => request("/spaces/my", { token }),
  createSpace: (body, token) => request("/spaces", { method: "POST", body, token }),
  addAvailability: (spaceId, body, token) =>
    request(`/spaces/${spaceId}/availability`, { method: "POST", body, token }),
};

export const session = {
  get() {
    if (typeof localStorage === "undefined") return { token: "", user: null };
    try {
      const saved = JSON.parse(localStorage.getItem("parking_session") || "{}");
      return { token: saved.token || "", user: saved.user || null };
    } catch (_) {
      return { token: "", user: null };
    }
  },
  set(token, user) {
    localStorage.setItem("parking_session", JSON.stringify({ token, user }));
  },
  clear() {
    localStorage.removeItem("parking_session");
  },
};
