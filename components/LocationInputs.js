"use client";

import React, { useState, useMemo, useEffect } from "react";
import { Globe, MapPin, ChevronDown, Loader2 } from "lucide-react";
import { COUNTRIES } from "./CountryPhoneInput";
import { getCitiesForCountry, fetchCitiesForCountryOnline } from "../lib/formPresets";

export function CountrySelect({
  value = "",
  onChange,
  required = false,
  disabled = false,
  placeholder = "Select your country...",
  className = ""
}) {
  return (
    <div className={`relative ${className}`}>
      <select
        value={value}
        onChange={(e) => onChange && onChange(e.target.value)}
        required={required}
        disabled={disabled}
        className="w-full pl-3.5 pr-9 py-2.5 bg-slate-50 border border-slate-200 focus:border-blue-600 focus:bg-white rounded-xl text-xs font-semibold text-slate-900 outline-none transition-all cursor-pointer appearance-none shadow-2xs"
      >
        <option value="">{placeholder}</option>
        {COUNTRIES.map((c) => (
          <option key={c.code} value={c.name}>
            {c.name}
          </option>
        ))}
      </select>
      <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
        <ChevronDown size={14} />
      </div>
    </div>
  );
}

export function CitySelect({
  value = "",
  onChange,
  country = "",
  required = false,
  disabled = false,
  placeholder = "Select or enter your city...",
  className = ""
}) {
  const [dynamicCities, setDynamicCities] = useState([]);
  const [isLoadingCities, setIsLoadingCities] = useState(false);
  const [isCustomCity, setIsCustomCity] = useState(false);

  // Sync cities when country changes
  useEffect(() => {
    const targetCountry = country || "Algeria";
    const localList = getCitiesForCountry(targetCountry);
    setDynamicCities(localList);

    // Fetch complete catalog online if available
    let isCancelled = false;
    setIsLoadingCities(true);
    fetchCitiesForCountryOnline(targetCountry)
      .then(cities => {
        if (!isCancelled && Array.isArray(cities) && cities.length > 0) {
          setDynamicCities(cities);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!isCancelled) setIsLoadingCities(false);
      });

    return () => {
      isCancelled = true;
    };
  }, [country]);

  const cityOptions = useMemo(() => {
    return dynamicCities.length > 0 ? dynamicCities : getCitiesForCountry(country || "Algeria");
  }, [dynamicCities, country]);

  // If there are cities for the country and user hasn't switched to custom typing
  if (cityOptions.length > 0 && !isCustomCity) {
    return (
      <div className={`relative ${className}`}>
        <select
          value={value}
          onChange={(e) => {
            if (e.target.value === "Other") {
              setIsCustomCity(true);
              if (onChange) onChange("");
            } else {
              if (onChange) onChange(e.target.value);
            }
          }}
          required={required}
          disabled={disabled}
          className="w-full pl-3.5 pr-9 py-2.5 bg-slate-50 border border-slate-200 focus:border-blue-600 focus:bg-white rounded-xl text-xs font-semibold text-slate-900 outline-none transition-all cursor-pointer appearance-none shadow-2xs"
        >
          <option value="">
            {placeholder || (country ? `Select city in ${country}...` : "Select city...")}
          </option>
          {cityOptions.map((city, idx) => (
            <option key={idx} value={city}>
              {city}
            </option>
          ))}
        </select>
        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 flex items-center gap-1">
          {isLoadingCities && <Loader2 size={12} className="animate-spin text-blue-500" />}
          <ChevronDown size={14} />
        </div>
      </div>
    );
  }

  // Fallback / Custom City typing with datalist suggestions
  return (
    <div className={`relative ${className}`}>
      <input
        type="text"
        list="cities-datalist"
        value={value}
        onChange={(e) => onChange && onChange(e.target.value)}
        placeholder={placeholder || (country ? `e.g. City in ${country}` : "e.g. Algiers, Paris, New York...")}
        required={required}
        disabled={disabled}
        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 focus:border-blue-600 focus:bg-white rounded-xl text-xs font-semibold text-slate-900 outline-none transition-all shadow-2xs"
      />
      {cityOptions.length > 0 && (
        <datalist id="cities-datalist">
          {cityOptions.map((city, idx) => (
            <option key={idx} value={city} />
          ))}
        </datalist>
      )}
      {isCustomCity && (
        <button
          type="button"
          onClick={() => setIsCustomCity(false)}
          className="mt-1 text-[10px] font-bold text-blue-600 hover:underline cursor-pointer"
        >
          ← Choose from predefined list
        </button>
      )}
    </div>
  );
}
