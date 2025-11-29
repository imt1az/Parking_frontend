"use client";

import { useEffect, useRef, useState } from "react";

function loadLeaflet() {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined") return reject();
    if (window.L && window.L.map) return resolve(window.L);

    const css = document.createElement("link");
    css.rel = "stylesheet";
    css.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
    css.crossOrigin = "";
    document.head.appendChild(css);

    const script = document.createElement("script");
    script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
    script.crossOrigin = "";
    script.onload = () => resolve(window.L);
    script.onerror = reject;
    document.body.appendChild(script);
  });
}

async function reverseGeocode(lat, lng) {
  const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`;
  const res = await fetch(url, { headers: { "User-Agent": "parking-app/1.0" } });
  if (!res.ok) throw new Error("Reverse geocode failed");
  const data = await res.json();
  return data.display_name || "";
}

// Live map showing current location + added places
export default function LiveMap({
  current,
  places = [],
  results = [],
  onAdd,
  focus,
  radius,
}) {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const currentMarker = useRef(null);
  const placesLayer = useRef(null);
  const resultsLayer = useRef(null);
  const radiusCircle = useRef(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;
    loadLeaflet()
      .then((L) => {
        if (!mounted) return;
        setReady(true);
        const start = current?.lat && current?.lng ? [current.lat, current.lng] : [23.8103, 90.4125];
        mapInstance.current = L.map(mapRef.current, { center: start, zoom: 14 });
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: "&copy; OpenStreetMap",
        }).addTo(mapInstance.current);

        placesLayer.current = L.layerGroup().addTo(mapInstance.current);
        resultsLayer.current = L.layerGroup().addTo(mapInstance.current);
        currentMarker.current = L.circleMarker(start, {
          radius: 7,
          color: "#2563eb",
          fillColor: "#3b82f6",
          fillOpacity: 0.8,
        }).addTo(mapInstance.current);

        mapInstance.current.on("click", async (e) => {
          const ll = e.latlng;
          let label = "";
          try {
            label = await reverseGeocode(ll.lat, ll.lng);
          } catch {
            label = "Custom place";
          }
          onAdd?.({ lat: ll.lat, lng: ll.lng, address: label });
        });
      })
      .catch(() => setError("Map failed to load"));

    return () => {
      mounted = false;
      if (mapInstance.current) mapInstance.current.remove();
      resultsLayer.current = null;
      placesLayer.current = null;
      currentMarker.current = null;
      radiusCircle.current = null;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Update current marker
  useEffect(() => {
    if (!ready || !currentMarker.current || !mapInstance.current || !current?.lat || !current?.lng) return;
    const ll = [current.lat, current.lng];
    try {
      currentMarker.current.setLatLng(ll);
      const map = mapInstance.current;
      if (map?._loaded && map?._container?._leaflet_pos) {
        map.setView(ll, Math.max(map.getZoom(), 14));
      }
    } catch (err) {
      console.warn("Failed to update current location on map", err);
    }
  }, [current, ready]);

  // Render places
  useEffect(() => {
    if (!ready || !placesLayer.current) return;
    placesLayer.current.clearLayers();
    places.forEach((p) => {
      const lat = Number(p?.lat);
      const lng = Number(p?.lng);
      if (Number.isNaN(lat) || Number.isNaN(lng)) return; // skip invalid points
      const label = p?.address || p?.title || "Selected place";
      placesLayer.current.addLayer(
        window.L.circleMarker([lat, lng], {
          radius: 6,
          color: "#16a34a",
          fillColor: "#22c55e",
          fillOpacity: 0.9,
        }).bindPopup(label)
      );
    });
  }, [places, ready]);

  // Render search results in orange
  useEffect(() => {
    if (!ready || !resultsLayer.current) return;
    resultsLayer.current.clearLayers();
    const markers = [];
    results.forEach((p) => {
      const lat = Number(p?.lat);
      const lng = Number(p?.lng);
      if (Number.isNaN(lat) || Number.isNaN(lng)) return;
      const m = window.L.circleMarker([lat, lng], {
        radius: 7,
        color: "#f59e0b",
        fillColor: "#fbbf24",
        fillOpacity: 0.9,
      }).bindPopup(p?.title || p?.address || "Result");
      resultsLayer.current.addLayer(m);
      markers.push(m);
    });
    if (markers.length && mapInstance.current) {
      const group = window.L.featureGroup(markers);
      mapInstance.current.fitBounds(group.getBounds().pad(0.2));
    }
  }, [results, ready]);

  // Focus + radius ring
  useEffect(() => {
    if (!ready || !mapInstance.current) return;
    if (radiusCircle.current) {
      mapInstance.current.removeLayer(radiusCircle.current);
      radiusCircle.current = null;
    }
    if (focus?.lat && focus?.lng) {
      const ll = [focus.lat, focus.lng];
      try {
        mapInstance.current.setView(ll, Math.max(mapInstance.current.getZoom(), 14));
      } catch (err) {
        console.warn("Failed to focus map", err);
      }
      if (radius) {
        radiusCircle.current = window.L.circle(ll, {
          radius: Number(radius),
          color: "#0ea5e9",
          fillColor: "#38bdf8",
          fillOpacity: 0.08,
          weight: 1.5,
          dashArray: "6 4",
        }).addTo(mapInstance.current);
      }
    }
  }, [focus, radius, ready]);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-zinc-800">Live map</p>
        {current?.lat && current?.lng && (
          <p className="text-xs text-zinc-500">
            You: {current.lat.toFixed(5)}, {current.lng.toFixed(5)}
          </p>
        )}
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
      <p className="text-xs text-zinc-500">Tap on map to add a place marker. Current location updates live.</p>
      <div
        ref={mapRef}
        className="w-full rounded-xl border border-zinc-200 overflow-hidden"
        style={{ minHeight: 320 }}
      />
    </div>
  );
}
