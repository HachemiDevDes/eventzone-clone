"use client";

import React, { useState, useMemo } from "react";
import { Globe, MapPin, ChevronDown } from "lucide-react";
import { COUNTRIES } from "./CountryPhoneInput";
import { getCitiesForCountry } from "../lib/formPresets";

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
            {c.flag} {c.name}
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
  const citySuggestions = useMemo(() => {
    return getCitiesForCountry(country);
  }, [country]);

  const [isCustomCity, setIsCustomCity] = useState(false);

  // If there are preset cities for the country and user hasn't switched to custom typing
  if (citySuggestions.length > 0 && !isCustomCity) {
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
          <option value="">{placeholder || (country ? `Select city in ${country}...` : "Select city...")}</option>
          {citySuggestions.map((city, idx) => (
            <option key={idx} value={city}>
              {city}
            </option>
          ))}
        </select>
        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
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
      {citySuggestions.length > 0 && (
        <datalist id="cities-datalist">
          {citySuggestions.map((city, idx) => (
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
