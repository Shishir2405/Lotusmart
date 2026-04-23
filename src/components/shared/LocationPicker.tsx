"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  RiMapPin2Line,
  RiLoader4Line,
  RiErrorWarningLine,
  RiSearchLine,
  RiCrosshair2Line,
  RiShieldCheckLine,
  RiCloseLine,
  RiNavigationLine,
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

type GMaps = any;

declare global {
  interface Window {
    __lotus_gmaps_cb?: () => void;
    gm_authFailure?: () => void;
  }
}

function gmaps(): any {
  return (globalThis as any).google;
}

let gmapsLoader: Promise<void> | null = null;
function loadGoogleMaps(apiKey: string): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (gmaps()?.maps?.places) return Promise.resolve();
  if (gmapsLoader) return gmapsLoader;

  gmapsLoader = new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      'script[data-lotus-gmaps="1"]',
    );
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () => reject(new Error("Google Maps failed to load")));
      return;
    }
    window.__lotus_gmaps_cb = () => {
      if (gmaps()?.maps?.places) resolve();
      else reject(new Error("Google Maps failed to load"));
    };
    const s = document.createElement("script");
    s.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&libraries=places&loading=async&callback=__lotus_gmaps_cb`;
    s.async = true;
    s.defer = true;
    s.dataset.lotusGmaps = "1";
    s.onerror = () => reject(new Error("Google Maps failed to load"));
    document.head.appendChild(s);
  });
  return gmapsLoader;
}

function parseAddressComponents(
  components: Array<{ long_name: string; short_name: string; types: string[] }>,
): Omit<LocationPickerValue, "coordinates" | "formattedAddress"> {
  const get = (...types: string[]) =>
    components.find((c) => c.types.some((t) => types.includes(t)))?.long_name;

  const streetNumber = get("street_number");
  const route = get("route");
  const premise = get("premise") || get("subpremise");
  const sublocality =
    get("sublocality_level_2") ||
    get("sublocality_level_1") ||
    get("sublocality");
  const neighborhood = get("neighborhood");
  const city =
    get("locality") ||
    get("administrative_area_level_3") ||
    get("administrative_area_level_2");
  const state = get("administrative_area_level_1");
  const pincode = get("postal_code");

  const line1Parts = [premise, streetNumber, route].filter(Boolean);
  const line1 = line1Parts.join(" ") || undefined;
  const line2Parts = [neighborhood, sublocality].filter(Boolean);
  const line2 =
    line2Parts.filter((p, i, arr) => arr.indexOf(p) === i).join(", ") || undefined;

  return {
    addressLine1: line1,
    addressLine2: line2,
    city,
    state,
    pincode,
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

const DEFAULT_CENTER = { lat: 22.7196, lng: 75.8577 }; // Indore, India

export default function LocationPicker({ initialValue, onChange }: Props) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resolved, setResolved] = useState<string | null>(
    initialValue?.formattedAddress ?? null,
  );
  const [permissionModal, setPermissionModal] = useState<
    null | "prompt" | "denied"
  >(null);

  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const mapRef = useRef<GMaps | null>(null);
  const markerRef = useRef<GMaps | null>(null);
  const geocoderRef = useRef<GMaps | null>(null);
  const autocompleteRef = useRef<GMaps | null>(null);
  const [mapsReady, setMapsReady] = useState(false);
  const [mapsLoadError, setMapsLoadError] = useState<string | null>(null);

  const emit = useCallback(
    (value: LocationPickerValue) => {
      onChange(value);
      if (value.formattedAddress) setResolved(value.formattedAddress);
    },
    [onChange],
  );

  const applyGoogleGeocode = useCallback(
    (result: {
      formatted_address: string;
      address_components: Array<{ long_name: string; short_name: string; types: string[] }>;
      geometry: { location: { lat: () => number; lng: () => number } };
    }) => {
      const parsed = parseAddressComponents(result.address_components);
      const lat = result.geometry.location.lat();
      const lng = result.geometry.location.lng();
      emit({
        ...parsed,
        coordinates: { lat, lng },
        formattedAddress: result.formatted_address,
      });
    },
    [emit],
  );

  const reverseGeocodeGoogle = useCallback(
    (lat: number, lng: number) => {
      const g = gmaps();
      if (!geocoderRef.current && g?.maps?.Geocoder) {
        geocoderRef.current = new g.maps.Geocoder();
      }
      if (!geocoderRef.current) return;
      geocoderRef.current.geocode(
        { location: { lat, lng } },
        (results: any[], status: string) => {
          if (status === "OK" && results?.[0]) {
            applyGoogleGeocode(results[0]);
          } else {
            emit({ coordinates: { lat, lng } });
          }
        },
      );
    },
    [applyGoogleGeocode, emit],
  );

  const placeMarker = useCallback(
    (lat: number, lng: number, runReverseGeocode = true) => {
      const g = gmaps();
      if (!g || !mapRef.current) return;
      const pos = new g.maps.LatLng(lat, lng);
      if (!markerRef.current) {
        markerRef.current = new g.maps.Marker({
          position: pos,
          map: mapRef.current,
          draggable: true,
          animation: g.maps.Animation.DROP,
        });
        markerRef.current.addListener("dragend", () => {
          const p = markerRef.current.getPosition();
          if (!p) return;
          const lat2 = p.lat();
          const lng2 = p.lng();
          mapRef.current.panTo({ lat: lat2, lng: lng2 });
          reverseGeocodeGoogle(lat2, lng2);
        });
      } else {
        markerRef.current.setPosition(pos);
      }
      mapRef.current.panTo(pos);
      if (mapRef.current.getZoom() < 14) mapRef.current.setZoom(15);
      if (runReverseGeocode) reverseGeocodeGoogle(lat, lng);
    },
    [reverseGeocodeGoogle],
  );

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.gm_authFailure = () => {
      setMapsLoadError(
        "The map couldn't authenticate with Google. Your address fields still work — please enter them manually.",
      );
    };
    return () => {
      if (window.gm_authFailure) delete window.gm_authFailure;
    };
  }, []);

  useEffect(() => {
    if (!apiKey) return;
    let cancelled = false;
    loadGoogleMaps(apiKey)
      .then(() => {
        if (cancelled) return;
        const g = gmaps();
        if (!g?.maps?.places || !mapContainerRef.current) return;

        const start = initialValue?.coordinates ?? DEFAULT_CENTER;
        mapRef.current = new g.maps.Map(mapContainerRef.current, {
          center: start,
          zoom: initialValue?.coordinates ? 15 : 12,
          disableDefaultUI: true,
          zoomControl: true,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
          gestureHandling: "cooperative",
        });
        geocoderRef.current = new g.maps.Geocoder();

        if (initialValue?.coordinates) {
          placeMarker(initialValue.coordinates.lat, initialValue.coordinates.lng, false);
        }

        mapRef.current.addListener("click", (e: any) => {
          if (!e?.latLng) return;
          placeMarker(e.latLng.lat(), e.latLng.lng(), true);
        });

        if (searchInputRef.current) {
          autocompleteRef.current = new g.maps.places.Autocomplete(
            searchInputRef.current,
            {
              fields: ["geometry", "formatted_address", "address_components"],
              componentRestrictions: { country: "in" },
            },
          );
          autocompleteRef.current.addListener("place_changed", () => {
            const place = autocompleteRef.current.getPlace();
            if (!place?.geometry?.location) return;
            placeMarker(place.geometry.location.lat(), place.geometry.location.lng(), false);
            applyGoogleGeocode(place);
          });
        }

        setMapsReady(true);
      })
      .catch((err) => {
        setMapsLoadError(err instanceof Error ? err.message : "Google Maps failed to load");
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiKey]);

  const runGeolocation = () => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setError("Your browser does not support location access");
      return;
    }
    setError(null);
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        try {
          if (apiKey && gmaps()?.maps) {
            placeMarker(latitude, longitude, true);
          } else {
            const value = await reverseGeocodeOSM(latitude, longitude);
            emit(value);
          }
        } catch {
          setError("Could not resolve your address. Drop the pin or enter it manually.");
          emit({ coordinates: { lat: latitude, lng: longitude } });
        } finally {
          setLoading(false);
        }
      },
      (err) => {
        setLoading(false);
        if (err.code === err.PERMISSION_DENIED) {
          setPermissionModal("denied");
        } else {
          setError("Could not get your location. Drop the pin or enter manually.");
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

  const usingGoogle = useMemo(() => Boolean(apiKey), [apiKey]);

  return (
    <div className="space-y-3">
      {usingGoogle && !mapsLoadError && (
        <div className="relative">
          <RiSearchLine
            size={15}
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-300"
          />
          <input
            ref={searchInputRef}
            type="text"
            placeholder={
              mapsReady ? "Search for an address, landmark or pincode" : "Loading map…"
            }
            disabled={!mapsReady}
            className="w-full rounded-xl border border-neutral-200 bg-white py-2.5 pl-10 pr-4 text-sm outline-none transition placeholder:text-neutral-400 focus:border-[#E84672]"
          />
        </div>
      )}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={detectLocation}
          disabled={loading}
          className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-[#E84672]/30 bg-[#FFF1F3] py-2.5 text-sm font-semibold text-[#E84672] transition hover:bg-[#FFE5EA] disabled:opacity-60"
        >
          {loading ? (
            <RiLoader4Line className="animate-spin" size={16} />
          ) : (
            <RiCrosshair2Line size={16} />
          )}
          {loading ? "Detecting…" : "Use my current location"}
        </button>
      </div>

      <div
        ref={mapContainerRef}
        aria-label="Map — drag the pin or click to adjust your address"
        className={
          usingGoogle && !mapsLoadError
            ? "h-64 w-full overflow-hidden rounded-xl border border-neutral-200 bg-neutral-100"
            : "hidden"
        }
      />

      {usingGoogle && mapsReady && !mapsLoadError && (
        <p className="flex items-center gap-1.5 text-[0.72rem] text-neutral-500">
          <RiMapPin2Line size={12} /> Drag the pin or tap the map to fine-tune.
        </p>
      )}

      {!usingGoogle && (
        <p className="rounded-lg bg-amber-50 px-2.5 py-1.5 text-[0.72rem] text-amber-700">
          Set <code>NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code> to enable the interactive map. For now we detect via browser GPS only.
        </p>
      )}

      {mapsLoadError && (
        <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-[0.72rem] text-amber-700">
          <RiErrorWarningLine size={14} className="mt-0.5 shrink-0" />
          <span>
            The interactive map couldn&apos;t load. You can still use{" "}
            <strong>Use my current location</strong> above, or enter your address manually below.
          </span>
        </div>
      )}

      {resolved && !error && (
        <p className="rounded-lg bg-emerald-50 px-2.5 py-1.5 text-[0.72rem] text-emerald-700">
          <span className="font-semibold">Detected: </span>
          {resolved}
        </p>
      )}

      {error && (
        <p className="flex items-start gap-1.5 text-[0.72rem] text-amber-600">
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
