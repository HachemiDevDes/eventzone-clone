"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { ChevronDown, Search, Check } from "lucide-react";

export const COUNTRIES = [
  { code: "US", name: "United States", dial: "+1", flag: "🇺🇸", sample: "(555) 000-0000" },
  { code: "CA", name: "Canada", dial: "+1", flag: "🇨🇦", sample: "(555) 000-0000" },
  { code: "GB", name: "United Kingdom", dial: "+44", flag: "🇬🇧", sample: "7911 123456" },
  { code: "DZ", name: "Algeria", dial: "+213", flag: "🇩🇿", sample: "550 12 34 56" },
  { code: "FR", name: "France", dial: "+33", flag: "🇫🇷", sample: "6 12 34 56 78" },
  { code: "DE", name: "Germany", dial: "+49", flag: "🇩🇪", sample: "151 23456789" },
  { code: "AE", name: "United Arab Emirates", dial: "+971", flag: "🇦🇪", sample: "50 123 4567" },
  { code: "SA", name: "Saudi Arabia", dial: "+966", flag: "🇸🇦", sample: "50 123 4567" },
  { code: "QA", name: "Qatar", dial: "+974", flag: "🇶🇦", sample: "3312 3456" },
  { code: "KW", name: "Kuwait", dial: "+965", flag: "🇰🇼", sample: "9123 4567" },
  { code: "BH", name: "Bahrain", dial: "+973", flag: "🇧🇭", sample: "3600 1234" },
  { code: "OM", name: "Oman", dial: "+968", flag: "🇴🇲", sample: "9123 4567" },
  { code: "EG", name: "Egypt", dial: "+20", flag: "🇪🇬", sample: "10 1234 5678" },
  { code: "MA", name: "Morocco", dial: "+212", flag: "🇲🇦", sample: "612-345678" },
  { code: "TN", name: "Tunisia", dial: "+216", flag: "🇹🇳", sample: "20 123 456" },
  { code: "TR", name: "Turkey", dial: "+90", flag: "🇹🇷", sample: "532 123 45 67" },
  { code: "ES", name: "Spain", dial: "+34", flag: "🇪🇸", sample: "612 345 678" },
  { code: "IT", name: "Italy", dial: "+39", flag: "🇮🇹", sample: "312 3456789" },
  { code: "CH", name: "Switzerland", dial: "+41", flag: "🇨🇭", sample: "78 123 45 67" },
  { code: "NL", name: "Netherlands", dial: "+31", flag: "🇳🇱", sample: "6 12345678" },
  { code: "BE", name: "Belgium", dial: "+32", flag: "🇧🇪", sample: "470 12 34 56" },
  { code: "SE", name: "Sweden", dial: "+46", flag: "🇸🇪", sample: "70-123 45 67" },
  { code: "NO", name: "Norway", dial: "+47", flag: "🇳🇴", sample: "412 34 567" },
  { code: "DK", name: "Denmark", dial: "+45", flag: "🇩🇰", sample: "32 12 34 56" },
  { code: "FI", name: "Finland", dial: "+358", flag: "🇫🇮", sample: "40 1234567" },
  { code: "PL", name: "Poland", dial: "+48", flag: "🇵🇱", sample: "512 345 678" },
  { code: "PT", name: "Portugal", dial: "+351", flag: "🇵🇹", sample: "912 345 678" },
  { code: "IE", name: "Ireland", dial: "+353", flag: "🇮🇪", sample: "85 123 4567" },
  { code: "AT", name: "Austria", dial: "+43", flag: "🇦🇹", sample: "664 1234567" },
  { code: "GR", name: "Greece", dial: "+30", flag: "🇬🇷", sample: "691 234 5678" },
  { code: "IN", name: "India", dial: "+91", flag: "🇮🇳", sample: "98765 43210" },
  { code: "CN", name: "China", dial: "+86", flag: "🇨🇳", sample: "138 0000 0000" },
  { code: "JP", name: "Japan", dial: "+81", flag: "🇯🇵", sample: "90 1234 5678" },
  { code: "KR", name: "South Korea", dial: "+82", flag: "🇰🇷", sample: "10 1234 5678" },
  { code: "AU", name: "Australia", dial: "+61", flag: "🇦🇺", sample: "412 345 678" },
  { code: "NZ", name: "New Zealand", dial: "+64", flag: "🇳🇿", sample: "21 123 4567" },
  { code: "SG", name: "Singapore", dial: "+65", flag: "🇸🇬", sample: "8123 4567" },
  { code: "MY", name: "Malaysia", dial: "+60", flag: "🇲🇾", sample: "12-345 6789" },
  { code: "ID", name: "Indonesia", dial: "+62", flag: "🇮🇩", sample: "812-3456-7890" },
  { code: "PH", name: "Philippines", dial: "+63", flag: "🇵🇭", sample: "917 123 4567" },
  { code: "TH", name: "Thailand", dial: "+66", flag: "🇹🇭", sample: "81 234 5678" },
  { code: "VN", name: "Vietnam", dial: "+84", flag: "🇻🇳", sample: "91 234 5678" },
  { code: "BR", name: "Brazil", dial: "+55", flag: "🇧🇷", sample: "11 91234-5678" },
  { code: "MX", name: "Mexico", dial: "+52", flag: "🇲🇽", sample: "55 1234 5678" },
  { code: "AR", name: "Argentina", dial: "+54", flag: "🇦🇷", sample: "11 1234-5678" },
  { code: "CL", name: "Chile", dial: "+56", flag: "🇨🇱", sample: "9 1234 5678" },
  { code: "CO", name: "Colombia", dial: "+57", flag: "🇨🇴", sample: "300 1234567" },
  { code: "ZA", name: "South Africa", dial: "+27", flag: "🇿🇦", sample: "82 123 4567" },
  { code: "NG", name: "Nigeria", dial: "+234", flag: "🇳🇬", sample: "803 123 4567" },
  { code: "KE", name: "Kenya", dial: "+254", flag: "🇰🇪", sample: "712 345678" },
  { code: "GH", name: "Ghana", dial: "+233", flag: "🇬🇭", sample: "24 123 4567" },
  { code: "RU", name: "Russia", dial: "+7", flag: "🇷🇺", sample: "912 345-67-89" }
];

export function parsePhoneNumber(fullStr = "", defaultCountryCode = "US") {
  const str = (fullStr || "").trim();
  if (!str) {
    const fallback = COUNTRIES.find(c => c.code === defaultCountryCode) || COUNTRIES[0];
    return { country: fallback, nationalNumber: "" };
  }

  // If starts with +, match the longest dial code
  if (str.startsWith("+")) {
    const sorted = [...COUNTRIES].sort((a, b) => b.dial.length - a.dial.length);
    for (const c of sorted) {
      if (str.startsWith(c.dial)) {
        const national = str.slice(c.dial.length).trim();
        return { country: c, nationalNumber: national };
      }
    }
  }

  const defaultCountry = COUNTRIES.find(c => c.code === defaultCountryCode) || COUNTRIES[0];
  return { country: defaultCountry, nationalNumber: str };
}

export default function CountryPhoneInput({
  value = "",
  onChange,
  placeholder = "",
  required = false,
  disabled = false,
  id,
  name,
  className = "",
  inputClassName = "",
  defaultCountry = "US"
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const dropdownRef = useRef(null);

  // Parse current country and national number
  const parsed = useMemo(() => {
    return parsePhoneNumber(value, defaultCountry);
  }, [value, defaultCountry]);

  const [selectedCountry, setSelectedCountry] = useState(parsed.country);
  const [nationalNumber, setNationalNumber] = useState(parsed.nationalNumber);

  // Sync if value prop changes from outside
  useEffect(() => {
    const p = parsePhoneNumber(value, defaultCountry);
    setSelectedCountry(p.country);
    setNationalNumber(p.nationalNumber);
  }, [value, defaultCountry]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  const filteredCountries = useMemo(() => {
    if (!search) return COUNTRIES;
    const s = search.toLowerCase();
    return COUNTRIES.filter(
      c => c.name.toLowerCase().includes(s) || c.dial.includes(s) || c.code.toLowerCase().includes(s)
    );
  }, [search]);

  const handleCountrySelect = (country) => {
    setSelectedCountry(country);
    setIsOpen(false);
    setSearch("");
    const combined = nationalNumber.trim() ? `${country.dial} ${nationalNumber.trim()}` : "";
    if (onChange) onChange(combined);
  };

  const handleNumberChange = (e) => {
    const raw = e.target.value;

    // Check if user pasted/typed a full number starting with +
    if (raw.startsWith("+")) {
      const p = parsePhoneNumber(raw, selectedCountry.code);
      setSelectedCountry(p.country);
      setNationalNumber(p.nationalNumber);
      if (onChange) onChange(p.nationalNumber ? `${p.country.dial} ${p.nationalNumber}` : "");
      return;
    }

    setNationalNumber(raw);
    const combined = raw.trim() ? `${selectedCountry.dial} ${raw.trim()}` : "";
    if (onChange) onChange(combined);
  };

  return (
    <div className={`relative flex items-center ${className}`}>
      <div className="relative flex items-stretch w-full rounded-xl bg-slate-50 border border-slate-200 focus-within:border-blue-600 focus-within:bg-white transition-all shadow-2xs">
        {/* Country Selector Button */}
        <button
          type="button"
          disabled={disabled}
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-1.5 px-3 py-2 border-r border-slate-200/90 bg-slate-100/70 hover:bg-slate-200/60 rounded-l-xl text-xs font-bold text-slate-800 transition-colors cursor-pointer select-none shrink-0"
          title={`Selected: ${selectedCountry.name} (${selectedCountry.dial})`}
        >
          <span className="text-base leading-none">{selectedCountry.flag}</span>
          <span className="text-xs font-bold text-slate-700">{selectedCountry.dial}</span>
          <ChevronDown size={12} className={`text-slate-400 transition-transform ${isOpen ? "rotate-180" : ""}`} />
        </button>

        {/* National Number Input */}
        <input
          type="tel"
          id={id}
          name={name}
          required={required}
          disabled={disabled}
          value={nationalNumber}
          onChange={handleNumberChange}
          placeholder={placeholder || selectedCountry.sample}
          className={`flex-1 min-w-0 px-3.5 py-2 bg-transparent text-xs font-semibold text-slate-900 placeholder:text-slate-400 outline-none ${inputClassName}`}
        />
      </div>

      {/* Country Dropdown Popover */}
      {isOpen && (
        <div
          ref={dropdownRef}
          className="absolute left-0 top-full mt-1.5 w-72 max-h-72 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 flex flex-col overflow-hidden animate-scale-up"
        >
          {/* Search Header */}
          <div className="p-2 border-b border-slate-100 bg-slate-50/50">
            <div className="flex items-center gap-2 px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl">
              <Search size={13} className="text-slate-400 shrink-0" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search country or code..."
                className="w-full text-xs font-medium text-slate-800 placeholder:text-slate-400 outline-none bg-transparent"
                autoFocus
              />
            </div>
          </div>

          {/* Country List */}
          <div className="overflow-y-auto p-1.5 space-y-0.5 max-h-56">
            {filteredCountries.length === 0 ? (
              <div className="text-center py-4 text-xs text-slate-400">No country found</div>
            ) : (
              filteredCountries.map(c => {
                const isSelected = c.code === selectedCountry.code;
                return (
                  <button
                    key={`${c.code}-${c.dial}`}
                    type="button"
                    onClick={() => handleCountrySelect(c)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs text-left transition-colors cursor-pointer ${
                      isSelected
                        ? "bg-blue-50 text-blue-700 font-bold"
                        : "text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <span className="text-base">{c.flag}</span>
                      <span className="truncate">{c.name}</span>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="text-[11px] font-semibold text-slate-400">{c.dial}</span>
                      {isSelected && <Check size={13} className="text-blue-600" />}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
