"use client";

import { useState, useEffect, useMemo } from "react";
import { State, City } from "country-state-city";
import type { IState, ICity } from "country-state-city";

interface LocationSelectorProps {
  countryCode?: string;
  state: string;
  city: string;
  onStateChange: (state: string) => void;
  onCityChange: (city: string) => void;
  stateError?: string;
  cityError?: string;
}

export function LocationSelector({
  countryCode = "IN",
  state,
  city,
  onStateChange,
  onCityChange,
  stateError,
  cityError,
}: LocationSelectorProps) {
  const [selectedStateCode, setSelectedStateCode] = useState("");

  const states: IState[] = useMemo(
    () => State.getStatesOfCountry(countryCode),
    [countryCode],
  );

  const cities: ICity[] = useMemo(
    () =>
      selectedStateCode
        ? City.getCitiesOfState(countryCode, selectedStateCode)
        : [],
    [countryCode, selectedStateCode],
  );

  // Sync initial state name to state code
  useEffect(() => {
    if (state && !selectedStateCode) {
      const match = states.find(
        (s) => s.name.toLowerCase() === state.toLowerCase(),
      );
      if (match) setSelectedStateCode(match.isoCode);
    }
  }, [state, states, selectedStateCode]);

  const handleStateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const code = e.target.value;
    setSelectedStateCode(code);
    const stateObj = states.find((s) => s.isoCode === code);
    onStateChange(stateObj?.name ?? "");
    onCityChange(""); // reset city when state changes
  };

  const handleCityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onCityChange(e.target.value);
  };

  const selectClass = (hasError?: string) =>
    `w-full border rounded-xl px-3 py-2.5 text-sm outline-none transition-colors bg-white ${
      hasError
        ? "border-red-300 focus:border-red-500"
        : "border-neutral-200 focus:border-[#E84672]"
    }`;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-1.5">
          State *
        </label>
        <select
          value={selectedStateCode}
          onChange={handleStateChange}
          className={selectClass(stateError)}
        >
          <option value="">Select State</option>
          {states.map((s) => (
            <option key={s.isoCode} value={s.isoCode}>
              {s.name}
            </option>
          ))}
        </select>
        {stateError && (
          <p className="text-xs text-red-500 mt-1">{stateError}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-1.5">
          City *
        </label>
        {cities.length > 0 ? (
          <select
            value={city}
            onChange={handleCityChange}
            className={selectClass(cityError)}
          >
            <option value="">Select City</option>
            {cities.map((c, i) => (
              <option key={`${c.name}-${i}`} value={c.name}>
                {c.name}
              </option>
            ))}
          </select>
        ) : (
          <input
            type="text"
            value={city}
            onChange={(e) => onCityChange(e.target.value)}
            placeholder="Enter city"
            className={selectClass(cityError)}
          />
        )}
        {cityError && (
          <p className="text-xs text-red-500 mt-1">{cityError}</p>
        )}
      </div>
    </div>
  );
}
