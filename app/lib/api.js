"use client";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  process.env.NEXT_PUBLIC_API_BASE ||
  "http://127.0.0.1:8000/api/v1";

const baseHeaders = {
  "Content-Type": "application/json",
  Accept: "application/json",
};

export function getApiBase() {
  return API_BASE;
}

// generic helper
export async function apiFetch(
  path,
  { method = "GET", body, token, auth = true } = {}
) {
  const headers = { ...baseHeaders };
  if (auth && token) {
    headers.Authorization = `Bearer ${token}`;
  }

  console.log("API CALL:", method, API_BASE + path, { body, token: !!token });

  const res = await fetch(API_BASE + path, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  let data = {};
  try {
    data = await res.json();
  } catch (e) {
    console.warn("Failed to parse JSON response");
  }

  console.log("API RES:", res.status, data);

  if (!res.ok) {
    const msg =
      data?.error?.message ||
      data?.message ||
      (data?.errors && Object.values(data.errors)[0][0]) ||
      res.statusText;
    throw new Error(msg);
  }

  return data;
}
