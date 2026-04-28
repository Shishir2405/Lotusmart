"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  RiLoader4Line,
  RiErrorWarningLine,
  RiCrosshair2Line,
  RiShieldCheckLine,
  RiCloseLine,
  RiNavigationLine,
  RiCheckLine,
} from "react-icons/ri";

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

interface PostOffice {
  Name?: string;
  District?: string;
  State?: string;
  Pincode?: string;
}
interface PincodeApiResponse {
  Status?: string;
  Message?: string;
  PostOffice?: PostOffice[] | null;
}

async function lookupPincode(pincode: string): Promise<{
  city: string;
  state: string;
  area?: string;
} | null> {
  const res = await fetch(`https://api.postalpincode.in/pincode/${pincode}`);
  if (!res.ok) throw new Error("Pincode lookup failed");
  const json = (await res.json()) as PincodeApiResponse[];
  const entry = json?.[0];
  if (!entry || entry.Status !== "Success" || !entry.PostOffice?.length) return null;
  const po = entry.PostOffice[0];
  return {
    city: po.District ?? "",
    state: po.State ?? "",
    area: po.Name,
  };
}

async function reverseGeocodeOSM(lat: number, lng: number): Promise<LocationPickerValue> {
  const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&addressdetails=1`;
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  if (!res.ok) throw new Error("Reverse geocode failed");
  const data = (await res.json()) as {
    display_name?: string;
    address?: Record<string, string | undefined>;
  };
  const a = data.address ?? {};
  const line1 = [a.house_number, a.road].filter(Boolean).join(" ");
  const line2 = [a.neighbourhood, a.suburb].filter(Boolean).join(", ");
  return {
    addressLine1: line1 || data.display_name?.split(",")[0],
    addressLine2: line2 || undefined,
    city: a.city || a.town || a.village || a.county,
    state: a.state,
    pincode: a.postcode,
    coordinates: { lat, lng },
    formattedAddress: data.display_name,
  };
}

/**
 * GPS button + pincode-driven city/state auto-fill helper.
 *
 * Watches `initialValue.pincode` from the parent — whenever it becomes a valid
 * 6-digit pincode, it fetches city/state from postalpincode.in and emits via
 * `onChange`. The parent owns the pincode/city/state inputs themselves; this
 * component does NOT render its own pincode field, to avoid duplicate UI on
 * pages that already have address forms.
 */
export default function LocationPicker({ initialValue, onChange }: Props) {
  const [pincodeStatus, setPincodeStatus] = useState<
    null | "checking" | "found" | "invalid" | "error"
  >(null);
  const [resolvedArea, setResolvedArea] = useState<{
    city: string;
    state: string;
    area?: string;
  } | null>(null);

  const [gpsLoading, setGpsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resolved, setResolved] = useState<string | null>(
    initialValue?.formattedAddress ?? null,
  );
  const [permissionModal, setPermissionModal] = useState<
    null | "prompt" | "denied"
  >(null);

  // Stable refs so the pincode-watcher effect doesn't re-fire on every render.
  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);
  const lastLookupRef = useRef<string | null>(null);

  const emit = useCallback((value: LocationPickerValue) => {
    onChangeRef.current(value);
    if (value.formattedAddress) setResolved(value.formattedAddress);
  }, []);

  // Watch parent's pincode — debounce, then look up city/state and emit.
  useEffect(() => {
    const trimmed = (initialValue?.pincode ?? "").trim();
    if (!/^\d{6}$/.test(trimmed)) {
      setPincodeStatus(null);
      setResolvedArea(null);
      lastLookupRef.current = null;
      return;
    }
    if (lastLookupRef.current === trimmed) return; // already resolved this exact code

    let cancelled = false;
    setPincodeStatus("checking");
    const timer = setTimeout(async () => {
      try {
        const res = await lookupPincode(trimmed);
        if (cancelled) return;
        if (!res) {
          setPincodeStatus("invalid");
          setResolvedArea(null);
          return;
        }
        lastLookupRef.current = trimmed;
        setPincodeStatus("found");
        setResolvedArea(res);
        emit({
          pincode: trimmed,
          city: res.city,
          state: res.state,
          addressLine2: res.area,
        });
      } catch {
        if (cancelled) return;
        setPincodeStatus("error");
      }
    }, 350);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [initialValue?.pincode, emit]);

  const runGeolocation = () => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setError("Your browser does not support location access");
      return;
    }
    setError(null);
    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        try {
          const value = await reverseGeocodeOSM(latitude, longitude);
          emit(value);
          if (value.pincode) lastLookupRef.current = value.pincode;
        } catch {
          setError(
            "Could not resolve your address from GPS. Type your pincode below to auto-fill the city and state.",
          );
          emit({ coordinates: { lat: latitude, lng: longitude } });
        } finally {
          setGpsLoading(false);
        }
      },
      (err) => {
        setGpsLoading(false);
        if (err.code === err.PERMISSION_DENIED) {
          setPermissionModal("denied");
        } else if (err.code === err.TIMEOUT) {
          setError("Location request timed out. Try again, or type your pincode below.");
        } else {
          setError("Location is unavailable on this device. Type your pincode below.");
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 },
    );
  };

  const detectLocation = async () => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setError("Your browser does not support location access");
      return;
    }
    setError(null);
    let state: PermissionState = "prompt";
    try {
      if (navigator.permissions?.query) {
        const status = await navigator.permissions.query({
          name: "geolocation" as PermissionName,
        });
        state = status.state;
      }
    } catch {
      state = "prompt";
    }
    if (state === "granted") {
      runGeolocation();
    } else {
      setPermissionModal(state === "denied" ? "denied" : "prompt");
    }
  };

  const handleAllowPermission = () => {
    setPermissionModal(null);
    runGeolocation();
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 flex-wrap">
        <button
          type="button"
          onClick={detectLocation}
          disabled={gpsLoading}
          className="flex items-center gap-1.5 rounded-xl border border-[#E84672]/30 bg-[#FFF1F3] px-3 py-2 text-xs font-semibold text-[#E84672] transition hover:bg-[#FFE5EA] disabled:opacity-60"
        >
          {gpsLoading ? (
            <RiLoader4Line className="animate-spin" size={14} />
          ) : (
            <RiCrosshair2Line size={14} />
          )}
          {gpsLoading ? "Detecting…" : "Use my current location"}
        </button>

        {pincodeStatus === "checking" && (
          <span className="flex items-center gap-1 text-[0.72rem] text-neutral-500">
            <RiLoader4Line size={12} className="animate-spin" />
            Looking up pincode…
          </span>
        )}
        {pincodeStatus === "found" && resolvedArea && (
          <span className="flex items-center gap-1 text-[0.72rem] text-emerald-700">
            <RiCheckLine size={12} />
            {resolvedArea.area ? `${resolvedArea.area}, ` : ""}
            {resolvedArea.city}, {resolvedArea.state}
          </span>
        )}
        {pincodeStatus === "invalid" && (
          <span className="flex items-center gap-1 text-[0.72rem] text-amber-600">
            <RiErrorWarningLine size={12} />
            Pincode not recognised
          </span>
        )}
        {pincodeStatus === "error" && (
          <span className="flex items-center gap-1 text-[0.72rem] text-amber-600">
            <RiErrorWarningLine size={12} />
            Couldn&apos;t verify pincode just now
          </span>
        )}
      </div>

      {!pincodeStatus && !gpsLoading && !error && !resolved && (
        <p className="text-[0.72rem] text-neutral-500">
          Tap GPS to auto-fill, or type a pincode below — city &amp; state will populate.
        </p>
      )}

      {resolved && !error && (
        <p className="rounded-lg bg-emerald-50 px-2.5 py-1.5 text-[0.72rem] text-emerald-700">
          <span className="font-semibold">Detected: </span>
          {resolved}
        </p>
      )}

      {error && (
        <p className="flex items-start gap-1.5 rounded-lg bg-amber-50 px-2.5 py-1.5 text-[0.72rem] text-amber-700">
          <RiErrorWarningLine size={13} className="mt-0.5 shrink-0" />
          {error}
        </p>
      )}

      {permissionModal && (
        <LocationPermissionModal
          variant={permissionModal}
          onAllow={handleAllowPermission}
          onClose={() => setPermissionModal(null)}
        />
      )}
    </div>
  );
}

function LocationPermissionModal({
  variant,
  onAllow,
  onClose,
}: {
  variant: "prompt" | "denied";
  onAllow: () => void;
  onClose: () => void;
}) {
  const denied = variant === "denied";
  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 px-4 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Location permission"
    >
      <div
        className="relative w-full max-w-sm overflow-hidden rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-3 top-3 rounded-full p-1.5 text-neutral-400 transition hover:bg-neutral-100 hover:text-neutral-700"
        >
          <RiCloseLine size={18} />
        </button>

        <div className="flex flex-col items-center px-6 pt-8 pb-2 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-[#FFE5EA] to-[#FFF1F3]">
            <RiNavigationLine size={30} className="text-[#E84672]" />
          </div>
          <h3 className="text-lg font-semibold text-neutral-900">
            {denied ? "Location access is blocked" : "Allow LotusMart to use your location"}
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-neutral-600">
            {denied
              ? "We can't read your location because it's blocked for this site. Enable it from your browser's address bar (click the lock icon → Site settings → Location → Allow), then try again."
              : "We use your location only to pre-fill your delivery address so checkout is faster. Your location is never stored without the address you confirm."}
          </p>
        </div>

        <div className="mx-6 mb-6 mt-4 rounded-xl bg-neutral-50 p-3">
          <div className="flex items-start gap-2.5">
            <RiShieldCheckLine size={16} className="mt-0.5 shrink-0 text-emerald-600" />
            <p className="text-[0.72rem] leading-relaxed text-neutral-600">
              Used only to auto-fill this address. You can edit any field before saving.
            </p>
          </div>
        </div>

        <div className="flex gap-2 px-6 pb-6">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-xl border border-neutral-200 bg-white py-2.5 text-sm font-medium text-neutral-700 transition hover:bg-neutral-50"
          >
            Not now
          </button>
          {!denied && (
            <button
              type="button"
              onClick={onAllow}
              className="flex-1 rounded-xl bg-[#E84672] py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#d63c65]"
            >
              Give permission
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
