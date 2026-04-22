"use client";

import { useState } from "react";
import { RiMapPin2Line, RiLoader4Line, RiErrorWarningLine } from "react-icons/ri";

export interface LocationPickerValue {
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  pincode?: string;
  coordinates?: { lat: number; lng: number };
  formattedAddress?: string;
}

interface Props {
  initialValue?: LocationPickerValue;
  onChange: (value: LocationPickerValue) => void;
}

// Minimal location picker (Task 1 stub):
// - "Use my current location" uses browser Geolocation
// - Reverse-geocodes via OpenStreetMap Nominatim (no API key)
// Task 2 upgrades this to Google Maps with a draggable pin + Places search.

async function reverseGeocodeOSM(lat: number, lng: number): Promise<LocationPickerValue> {
  const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&addressdetails=1`;
  const res = await fetch(url, {
    headers: { Accept: "application/json" },
  });
  if (!res.ok) throw new Error("Reverse geocode failed");
  const data = (await res.json()) as {
    display_name?: string;
    address?: Record<string, string | undefined>;
  };
  const a = data.address ?? {};
  const line1 = [a.house_number, a.road].filter(Boolean).join(" ");
  const line2 = [a.neighbourhood, a.suburb].filter(Boolean).join(", ");
  const city = a.city || a.town || a.village || a.county;
  const state = a.state;
  const pincode = a.postcode;
  return {
    addressLine1: line1 || data.display_name?.split(",")[0],
    addressLine2: line2 || undefined,
    city,
    state,
    pincode,
    coordinates: { lat, lng },
    formattedAddress: data.display_name,
  };
}

export default function LocationPicker({ onChange }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resolved, setResolved] = useState<string | null>(null);

  const detectLocation = () => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setError("Your browser does not support location access");
      return;
    }
    setError(null);
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const value = await reverseGeocodeOSM(pos.coords.latitude, pos.coords.longitude);
          onChange(value);
          setResolved(value.formattedAddress ?? `Lat ${pos.coords.latitude.toFixed(4)}, Lng ${pos.coords.longitude.toFixed(4)}`);
        } catch {
          setError("Could not resolve your address. Please enter it manually.");
          onChange({
            coordinates: { lat: pos.coords.latitude, lng: pos.coords.longitude },
          });
        } finally {
          setLoading(false);
        }
      },
      (err) => {
        setLoading(false);
        setError(
          err.code === err.PERMISSION_DENIED
            ? "Location permission denied. Allow access or enter your address manually."
            : "Could not get your location. Please enter address manually.",
        );
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 },
    );
  };

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={detectLocation}
        disabled={loading}
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-[#E84672]/30 bg-[#FFF1F3] py-2.5 text-sm font-semibold text-[#E84672] transition hover:bg-[#FFE5EA] disabled:opacity-60"
      >
        {loading ? (
          <RiLoader4Line className="animate-spin" size={16} />
        ) : (
          <RiMapPin2Line size={16} />
        )}
        {loading ? "Detecting your location…" : "Use my current location"}
      </button>
      {resolved && !error && (
        <p className="text-[0.72rem] text-neutral-500">Detected: {resolved}</p>
      )}
      {error && (
        <p className="flex items-start gap-1.5 text-[0.72rem] text-amber-600">
          <RiErrorWarningLine size={13} className="mt-0.5 shrink-0" />
          {error}
        </p>
      )}
    </div>
  );
}
