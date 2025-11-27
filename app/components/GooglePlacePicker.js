"use client";

import { useEffect, useRef, useState } from "react";

// Load Google Maps JS API (Maps + Places)
function loadGoogle(apiKey) {
  return new Promise((resolve, reject) => {
    if (!apiKey) return reject(new Error("Google Maps API key missing"));
    if (typeof window === "undefined") return reject(new Error("No window"));
    if (window.google && window.google.maps) return resolve(window.google);

    const existing = document.querySelector('script[data-google-maps="true"]');
    if (existing) {
      existing.addEventListener("load", () => resolve(window.google));
      existing.addEventListener("error", reject);
      return;
    }

    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.dataset.googleMaps = "true";
    script.onload = () => resolve(window.google);
    script.onerror = reject;
    document.body.appendChild(script);
  });
}

/**
 * Google Maps picker with Places autocomplete.
 * Props:
 *  - value: { lat, lng, address? }
 *  - onChange: fn({ lat, lng, address? })
 */
export default function GooglePlacePicker({ value, onChange, label = "লোকেশন" }) {
  const mapRef = useRef(null);
  const inputRef = useRef(null);
  const mapInstance = useRef(null);
  const markerRef = useRef(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  useEffect(() => {
    let mounted = true;
    loadGoogle(apiKey)
      .then((google) => {
        if (!mounted) return;
        const start = value?.lat && value?.lng ? { lat: value.lat, lng: value.lng } : { lat: 23.8103, lng: 90.4125 }; // Dhaka
        mapInstance.current = new google.maps.Map(mapRef.current, {
          center: start,
          zoom: 14,
        });
        markerRef.current = new google.maps.Marker({
          position: start,
          map: mapInstance.current,
          draggable: true,
        });

        markerRef.current.addListener("dragend", (e) => {
          const pos = e.latLng.toJSON();
          onChange?.({ lat: pos.lat, lng: pos.lng, address: value?.address });
        });

        mapInstance.current.addListener("click", (e) => {
          const pos = e.latLng.toJSON();
          markerRef.current.setPosition(pos);
          onChange?.({ lat: pos.lat, lng: pos.lng, address: value?.address });
        });

        if (inputRef.current) {
          const autocomplete = new google.maps.places.Autocomplete(inputRef.current, {
            fields: ["formatted_address", "geometry"],
          });
          autocomplete.addListener("place_changed", () => {
            const place = autocomplete.getPlace();
            if (!place.geometry || !place.geometry.location) return;
            const pos = place.geometry.location.toJSON();
            markerRef.current.setPosition(pos);
            mapInstance.current.panTo(pos);
            mapInstance.current.setZoom(15);
            onChange?.({ lat: pos.lat, lng: pos.lng, address: place.formatted_address });
          });
        }

        setReady(true);
      })
      .catch((err) => setError(err.message || "Google Maps লোড হয়নি"));

    return () => {
      mounted = false;
    };
  }, [apiKey]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!ready || !value?.lat || !value?.lng || !mapInstance.current || !markerRef.current) return;
    const pos = { lat: value.lat, lng: value.lng };
    markerRef.current.setPosition(pos);
    mapInstance.current.panTo(pos);
  }, [value, ready]);

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
      <input
        ref={inputRef}
        className="w-full border border-zinc-200 rounded-lg px-3 py-2"
        placeholder="ঠিকানা/প্লেস সার্চ করুন"
      />
      {error && <p className="text-xs text-red-600">{error}</p>}
      <div
        ref={mapRef}
        className="w-full rounded-xl border border-zinc-200 overflow-hidden"
        style={{ minHeight: 320 }}
      />
      {!apiKey && (
        <p className="text-xs text-red-600">
          NEXT_PUBLIC_GOOGLE_MAPS_API_KEY সেট করুন।
        </p>
      )}
    </div>
  );
}
