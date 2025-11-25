"use client";

import { useEffect, useRef, useState } from "react";
import { apiFetch } from "../lib/api";

// Lightweight Leaflet loader via CDN to avoid extra installs.
function loadLeaflet() {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined") return reject();
    if (window.L && window.L.map) return resolve(window.L);

    const existingCss = document.querySelector('link[data-leaflet]');
    const existingJs = document.querySelector('script[data-leaflet]');
    if (existingCss && existingJs) {
      existingJs.addEventListener("load", () => resolve(window.L));
      return;
    }

    const css = document.createElement("link");
    css.rel = "stylesheet";
    css.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
    css.crossOrigin = "";
    css.dataset.leaflet = "true";
    document.head.appendChild(css);

    const script = document.createElement("script");
    script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
    script.crossOrigin = "";
    script.dataset.leaflet = "true";
    script.onload = () => resolve(window.L);
    script.onerror = reject;
    document.body.appendChild(script);
  });
}

/**
 * Map picker with click-to-drop marker and optional address search.
 * Props:
 *  - value: { lat, lng, address? }
 *  - onChange: fn({ lat, lng, address? })
 */
export default function MapPicker({ value, onChange, label = "লোকেশন" }) {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const markerRef = useRef(null);
  const [ready, setReady] = useState(false);
  const [search, setSearch] = useState("");
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;
    loadLeaflet()
      .then((L) => {
        if (!isMounted) return;
        setReady(true);
        const start = value?.lat && value?.lng ? [value.lat, value.lng] : [23.8103, 90.4125]; // Dhaka fallback
        mapInstance.current = L.map(mapRef.current, {
          center: start,
          zoom: 13,
        });
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: '&copy; OpenStreetMap',
        }).addTo(mapInstance.current);

        markerRef.current = L.marker(start, { draggable: true }).addTo(mapInstance.current);
        markerRef.current.on("dragend", (e) => {
          const ll = e.target.getLatLng();
          onChange?.({ lat: ll.lat, lng: ll.lng, address: value?.address });
        });

        mapInstance.current.on("click", (e) => {
          const ll = e.latlng;
          markerRef.current.setLatLng(ll);
          onChange?.({ lat: ll.lat, lng: ll.lng, address: value?.address });
        });
      })
      .catch(() => setError("মানচিত্র লোড করতে সমস্যা হয়েছে"));

    return () => {
      isMounted = false;
      if (mapInstance.current) {
        mapInstance.current.remove();
      }
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Keep marker in sync when parent changes location externally
  useEffect(() => {
    if (!ready || !value?.lat || !value?.lng || !markerRef.current || !mapInstance.current) return;
    markerRef.current.setLatLng([value.lat, value.lng]);
    mapInstance.current.setView([value.lat, value.lng], mapInstance.current.getZoom());
  }, [value, ready]);

  const runSearch = async () => {
    if (!search.trim()) return;
    setSearching(true);
    setError("");
    try {
      const res = await apiFetch("/geocode", { method: "POST", body: { query: search } });
      const next = { lat: res.lat, lng: res.lng, address: res.address };
      markerRef.current?.setLatLng([res.lat, res.lng]);
      mapInstance.current?.setView([res.lat, res.lng], 15);
      onChange?.(next);
    } catch (e) {
      setError(e.message || "সার্চ ব্যর্থ");
    } finally {
      setSearching(false);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-zinc-800">{label}</p>
        {value?.lat && value?.lng && (
          <p className="text-xs text-zinc-500">
            {value.lat.toFixed(5)}, {value.lng.toFixed(5)}
          </p>
        )}
      </div>
      <div className="flex gap-2">
        <input
          className="flex-1 border border-zinc-200 rounded-lg px-3 py-2"
          placeholder="ঠিকানা লিখে সার্চ করুন"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button
          onClick={runSearch}
          disabled={searching || !search.trim()}
          className="px-3 py-2 rounded-lg bg-emerald-600 text-white text-sm font-semibold disabled:opacity-60"
        >
          {searching ? "খুঁজছি..." : "সার্চ"}
        </button>
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
      <div
        ref={mapRef}
        className="w-full rounded-xl border border-zinc-200 overflow-hidden"
        style={{ minHeight: 280 }}
      />
    </div>
  );
}
