/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useState } from "react";
import { 
  Sparkles, Calendar, MapPin, Building2, 
  Image as ImageIcon, Users, ArrowRight, ArrowLeft, 
  CheckCircle2, X, Globe, Video, LayoutDashboard, Layers,
  ChevronRight, Compass, ShieldCheck, Tag, Info, Clock, Check, Link as LinkIcon
} from "lucide-react";

const PRESET_BANNERS = [
  {
    name: "Tech & Innovation Summit",
    category: "Technology",
    url: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1200&q=80"
  },
  {
    name: "Clean Energy & Hydrogen",
    category: "Energy",
    url: "https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=1200&q=80"
  },
  {
    name: "Trade Expo & Exhibition",
    category: "Industrial",
    url: "https://images.unsplash.com/photo-1505373877841-8d25f7d46678?auto=format&fit=crop&w=1200&q=80"
  },
  {
    name: "Keynote & Global Forum",
    category: "Business",
    url: "https://images.unsplash.com/photo-1475721027785-f74eccf877e2?auto=format&fit=crop&w=1200&q=80"
  },
  {
    name: "Executive Networking Hall",
    category: "Leadership",
    url: "https://images.unsplash.com/photo-1515187029135-18ee286d815b?auto=format&fit=crop&w=1200&q=80"
  }
];

const INDUSTRIES = [
  "Energy & Hydrocarbons",
  "Technology & Software",
  "Finance & Banking",
  "Healthcare & Pharmaceuticals",
  "Education & Academia",
  "Manufacturing & Industry",
  "Transportation & Logistics",
  "Real Estate & Construction",
  "Retail & E-commerce",
  "Government & Public Sector",
  "Sustainability & Climate",
  "Telecommunications"
];

const TIMEZONES = [
  { id: "Africa/Algiers", name: "Africa/Algiers", offset: "GMT+1", time: "1:08 PM now" },
  { id: "Africa/Lagos", name: "Africa/Lagos", offset: "GMT+1", time: "1:08 PM now" },
  { id: "Africa/Cairo", name: "Africa/Cairo", offset: "GMT+3", time: "3:08 PM now" },
  { id: "Europe/Paris", name: "Europe/Paris", offset: "GMT+2", time: "2:08 PM now" },
  { id: "Europe/London", name: "Europe/London", offset: "GMT+1", time: "1:08 PM now" },
  { id: "Asia/Dubai", name: "Asia/Dubai", offset: "GMT+4", time: "4:08 PM now" },
  { id: "America/New_York", name: "America/New_York", offset: "GMT-4", time: "8:08 AM now" },
  { id: "America/Los_Angeles", name: "America/Los_Angeles", offset: "GMT-7", time: "5:08 AM now" },
  { id: "UTC", name: "UTC (Coordinated Universal Time)", offset: "GMT+0", time: "12:08 PM now" }
];

export default function EventCreationWizard({ onCancel, onEventCreated, userId }) {
  // Current screen state:
  // "1A": Event Name input
  // "1B": Describe "{Event Name}"? (Professional / Community / Personal) [SCREENSHOT 1]
  // "2A": What best describes your event? (Single date / Multiple dates / Appointment) [SCREENSHOT 2]
  // "2B": When is your event? (Dates / Times / Timezone) [SCREENSHOT 3]
  // "2C": Where is your event? (Venue / Hybrid / Virtual)
  // "2D": Category & Banner selection
  // "2E": Customize your event URL [SCREENSHOT 4]
  // "3":  Account information & Final Launch
  const [currentScreen, setCurrentScreen] = useState("1A");
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    slug: "myevent",
    tagline: "",
    eventTypeCategory: "Professional Event",
    structureType: "Multiple dates, times or sessions",
    category: "Technology & Software",
    type: "Hybrid",
    location: "Algiers International Conference Center (CIC), Algeria",
    startDate: "2026-11-05",
    startTime: "09:00",
    endDate: "2026-11-08",
    endTime: "18:00",
    timezone: "Africa/Algiers",
    description: "An international summit bringing together leading industry executives, regulators, and innovators.",
    banner: PRESET_BANNERS[0].url,
    capacity: 800,
    hostName: "Event Organizer",
    hostEmail: "organizer@eventzone.io",
    organization: "Eventzone Host Organization",
  });

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Determine top stepper main step number (1, 2, or 3)
  const getMainStepNumber = () => {
    if (currentScreen === "1A" || currentScreen === "1B") return 1;
    if (["2A", "2B", "2C", "2D", "2E"].includes(currentScreen)) return 2;
    return 3;
  };

  const mainStep = getMainStepNumber();

  // Navigation handlers
  const handleNextFrom1A = (e) => {
    if (e) e.preventDefault();
    if (!formData.title.trim()) {
      alert("Please enter a name for your event.");
      return;
    }
    const autoSlug = formData.title.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
    if (autoSlug && (!formData.slug || formData.slug === "myevent")) {
      handleChange("slug", autoSlug);
    }
    setCurrentScreen("1B");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleNextFrom1B = (chosenType) => {
    if (chosenType) {
      handleChange("eventTypeCategory", chosenType);
    }
    setCurrentScreen("2A");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleNextFrom2A = (chosenStructure) => {
    if (chosenStructure) {
      handleChange("structureType", chosenStructure);
    }
    setCurrentScreen("2B");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleNextFrom2B = () => {
    setCurrentScreen("2C");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSkip2B = () => {
    setCurrentScreen("2C");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleNextFrom2C = () => {
    setCurrentScreen("2D");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleNextFrom2D = () => {
    setCurrentScreen("2E");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleNextFrom2E = () => {
    setCurrentScreen("3");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleBack = () => {
    if (currentScreen === "1A") {
      if (onCancel) onCancel();
    } else if (currentScreen === "1B") {
      setCurrentScreen("1A");
    } else if (currentScreen === "2A") {
      setCurrentScreen("1B");
    } else if (currentScreen === "2B") {
      setCurrentScreen("2A");
    } else if (currentScreen === "2C") {
      setCurrentScreen("2B");
    } else if (currentScreen === "2D") {
      setCurrentScreen("2C");
    } else if (currentScreen === "2E") {
      setCurrentScreen("2D");
    } else if (currentScreen === "3") {
      setCurrentScreen("2E");
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    try {
      if (onEventCreated) {
        await onEventCreated(formData);
      }
    } catch (err) {
      console.error("Error creating event:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      {/* ==================================================================== */}
      {/* 1. TOP BAR WITH EVENTZONE LOGO & STEPPER                             */}
      {/* ==================================================================== */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 sticky top-0 z-40 flex items-center justify-between shadow-xs">
        {/* Left: Eventzone Logo (Original colors on white background) */}
        <div className="flex items-center gap-4">
          <div 
            onClick={onCancel} 
            className="cursor-pointer select-none flex items-center gap-2"
            title="Return to Events"
          >
            <img src="https://i.imgur.com/jFDrQbM.png" alt="eventzone" className="h-7 w-auto object-contain" />
          </div>

          <div className="h-5 w-px bg-slate-200" />

          <button
            onClick={onCancel}
            className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors p-1.5 rounded-xl hover:bg-slate-100 cursor-pointer"
          >
            <ArrowLeft size={15} />
            <span>Cancel</span>
          </button>
        </div>

        {/* Center: Stepper Line (1 Event name — 2 Event details — 3 Account information) */}
        <div className="flex items-center gap-3 select-none">
          {/* Step 1 */}
          <div className="flex items-center gap-2">
            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
              mainStep === 1 
                ? "bg-blue-600 text-white shadow-sm ring-4 ring-blue-100" 
                : mainStep > 1 
                  ? "bg-emerald-600 text-white" 
                  : "bg-slate-200 text-slate-600"
            }`}>
              {mainStep > 1 ? "✓" : "1"}
            </span>
            <span className={`text-xs font-bold transition-all ${
              mainStep === 1 ? "text-blue-600 font-extrabold" : mainStep > 1 ? "text-slate-800" : "text-slate-400"
            }`}>
              Event name
            </span>
          </div>

          {/* Line 1 */}
          <div className={`w-8 sm:w-16 h-0.5 transition-all ${mainStep > 1 ? "bg-emerald-500" : "bg-slate-200"}`} />

          {/* Step 2 */}
          <div className="flex items-center gap-2">
            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
              mainStep === 2 
                ? "bg-blue-600 text-white shadow-sm ring-4 ring-blue-100" 
                : mainStep > 2 
                  ? "bg-emerald-600 text-white" 
                  : "bg-slate-100 text-slate-400 border border-slate-300"
            }`}>
              {mainStep > 2 ? "✓" : "2"}
            </span>
            <span className={`text-xs font-bold transition-all ${
              mainStep === 2 ? "text-blue-600 font-extrabold" : mainStep > 2 ? "text-slate-800" : "text-slate-400"
            }`}>
              Event details
            </span>
          </div>

          {/* Line 2 */}
          <div className={`w-8 sm:w-16 h-0.5 transition-all ${mainStep > 2 ? "bg-emerald-500" : "bg-slate-200"}`} />

          {/* Step 3 */}
          <div className="flex items-center gap-2">
            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
              mainStep === 3 
                ? "bg-blue-600 text-white shadow-sm ring-4 ring-blue-100" 
                : "bg-slate-100 text-slate-400 border border-slate-300"
            }`}>
              3
            </span>
            <span className={`text-xs font-bold transition-all ${
              mainStep === 3 ? "text-blue-600 font-extrabold" : "text-slate-400"
            }`}>
              Account information
            </span>
          </div>
        </div>

        {/* Right Exit Button */}
        <div className="flex items-center gap-2">
          <button
            onClick={onCancel}
            className="text-slate-400 hover:text-slate-600 p-2 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>
      </header>

      {/* ==================================================================== */}
      {/* 2. MAIN CONTENT CONTAINER                                            */}
      {/* ==================================================================== */}
      <main className="flex-1 max-w-3xl w-full mx-auto px-6 py-12 flex flex-col items-center justify-center">
        {/* ────────────────────────────────────────────────────────────────── */}
        {/* SUB-STEP 1A: What is the name of your event?                       */}
        {/* ────────────────────────────────────────────────────────────────── */}
        {currentScreen === "1A" && (
          <div className="w-full animate-fade-in text-center">
            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              What is the name of your event?
            </h1>
            <p className="text-sm text-slate-500 font-medium mt-2 mb-8 max-w-md mx-auto">
              Give your conference, summit, or meetup a clear and memorable title.
            </p>

            <form onSubmit={handleNextFrom1A} className="space-y-6 max-w-xl mx-auto text-left">
              <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    Event Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    autoFocus
                    placeholder="e.g. Algeria job summit"
                    value={formData.title}
                    onChange={(e) => handleChange("title", e.target.value)}
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-200 focus:border-blue-600 focus:bg-white focus:ring-4 focus:ring-blue-50 rounded-2xl text-sm font-semibold text-slate-900 placeholder-slate-400 outline-none transition-all"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={onCancel}
                  className="px-6 py-3.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-600 font-bold text-xs transition-all cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="px-8 py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs shadow-lg shadow-blue-600/30 transition-all flex items-center gap-2 cursor-pointer"
                >
                  <span>Continue</span>
                  <ArrowRight size={15} />
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ────────────────────────────────────────────────────────────────── */}
        {/* SUB-STEP 1B (SCREENSHOT 1): What best describes "{Event Name}"?    */}
        {/* ────────────────────────────────────────────────────────────────── */}
        {currentScreen === "1B" && (
          <div className="w-full animate-fade-in text-center">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">
              What best describes &ldquo;{formData.title || "Algeria job summit"}&rdquo;?
            </h1>
            <p className="text-sm text-slate-500 font-medium mt-2 mb-8">
              This helps us customize your experience.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl mx-auto">
              {[
                {
                  id: "Professional Event",
                  title: "Professional Event",
                  desc: "Conferences, summits, trade expos, corporate networking"
                },
                {
                  id: "Community Event",
                  title: "Community Event",
                  desc: "Meetups, workshops, cultural gatherings, open days"
                },
                {
                  id: "Personal Event",
                  title: "Personal Event",
                  desc: "Celebrations, parties, private gatherings"
                }
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleNextFrom1B(item.id)}
                  className={`p-6 sm:p-8 rounded-2xl border text-center transition-all duration-200 cursor-pointer flex flex-col justify-center items-center gap-2 group hover:shadow-md ${
                    formData.eventTypeCategory === item.id
                      ? "bg-white border-blue-600 shadow-md ring-2 ring-blue-500/20"
                      : "bg-white border-slate-200/90 hover:border-blue-400 hover:bg-blue-50/20"
                  }`}
                >
                  <span className={`text-base font-bold transition-colors ${
                    formData.eventTypeCategory === item.id ? "text-blue-600" : "text-slate-800 group-hover:text-blue-600"
                  }`}>
                    {item.title}
                  </span>
                  <span className="text-[11px] text-slate-400 font-medium leading-relaxed">
                    {item.desc}
                  </span>
                </button>
              ))}
            </div>

            <div className="flex items-center justify-between max-w-3xl mx-auto mt-8 pt-4 border-t border-slate-200/70">
              <button
                type="button"
                onClick={handleBack}
                className="px-5 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-600 font-bold text-xs transition-all cursor-pointer flex items-center gap-1.5"
              >
                <ArrowLeft size={14} />
                <span>Back</span>
              </button>

              <button
                type="button"
                onClick={() => handleNextFrom1B(formData.eventTypeCategory)}
                className="px-7 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs shadow-md shadow-blue-600/30 transition-all flex items-center gap-2 cursor-pointer"
              >
                <span>Next: Event details</span>
                <ArrowRight size={14} />
              </button>
            </div>
          </div>
        )}

        {/* ────────────────────────────────────────────────────────────────── */}
        {/* SUB-STEP 2A (SCREENSHOT 2): What best describes your event?        */}
        {/* ────────────────────────────────────────────────────────────────── */}
        {currentScreen === "2A" && (
          <div className="w-full animate-fade-in text-center">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">
              What best describes your event?
            </h1>
            <p className="text-sm text-slate-500 font-medium mt-2 mb-8">
              This helps us customize your experience.
            </p>

            <div className="flex flex-col gap-3.5 max-w-xl mx-auto">
              {[
                {
                  id: "Single date, time and location",
                  title: "Single date, time and location",
                  desc: "A one-time gathering in a single venue or virtual room"
                },
                {
                  id: "Multiple dates, times or sessions",
                  title: "Multiple dates, times or sessions",
                  desc: "Multi-day summit, tracks, breakout workshops, and speaker panels"
                },
                {
                  id: "Appointment scheduling",
                  title: "Appointment scheduling",
                  desc: "1-on-1 meetings, demo bookings, and scheduled visitor slots"
                }
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleNextFrom2A(item.id)}
                  className={`p-5 rounded-2xl border text-center transition-all duration-200 cursor-pointer flex flex-col justify-center items-center gap-1 group ${
                    formData.structureType === item.id
                      ? "bg-white border-blue-600 shadow-md ring-2 ring-blue-500/20"
                      : "bg-white border-slate-200 hover:border-blue-400 hover:bg-blue-50/20"
                  }`}
                >
                  <span className={`text-sm sm:text-base font-bold transition-colors ${
                    formData.structureType === item.id ? "text-blue-600" : "text-slate-800 group-hover:text-blue-600"
                  }`}>
                    {item.title}
                  </span>
                  <span className="text-[11px] text-slate-400 font-medium">
                    {item.desc}
                  </span>
                </button>
              ))}
            </div>

            <div className="flex items-center justify-between max-w-xl mx-auto mt-8 pt-4 border-t border-slate-200/70">
              <button
                type="button"
                onClick={handleBack}
                className="px-5 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-600 font-bold text-xs transition-all cursor-pointer flex items-center gap-1.5"
              >
                <ArrowLeft size={14} />
                <span>Back</span>
              </button>

              <button
                type="button"
                onClick={() => handleNextFrom2A(formData.structureType)}
                className="px-7 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs shadow-md shadow-blue-600/30 transition-all flex items-center gap-2 cursor-pointer"
              >
                <span>Next: Dates & Timing</span>
                <ArrowRight size={14} />
              </button>
            </div>
          </div>
        )}

        {/* ────────────────────────────────────────────────────────────────── */}
        {/* SUB-STEP 2B (SCREENSHOT 3): When is your event?                    */}
        {/* ────────────────────────────────────────────────────────────────── */}
        {currentScreen === "2B" && (
          <div className="w-full animate-fade-in text-center">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">
              When is your event?
            </h1>
            <p className="text-sm text-slate-500 font-medium mt-2 mb-2">
              Not sure yet? You can add timing later.
            </p>

            <button
              type="button"
              onClick={handleSkip2B}
              className="text-xs font-bold text-blue-600 hover:text-blue-700 hover:underline mb-8 cursor-pointer inline-block"
            >
              Skip for now
            </button>

            <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs max-w-xl mx-auto text-left space-y-6">
              {/* EVENT START */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Event Start
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="relative">
                    <Calendar size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    <input
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => handleChange("startDate", e.target.value)}
                      className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 focus:border-blue-600 focus:bg-white rounded-2xl text-xs font-semibold text-slate-800 outline-none transition-all cursor-pointer"
                    />
                  </div>

                  <div className="relative">
                    <Clock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    <input
                      type="time"
                      value={formData.startTime}
                      onChange={(e) => handleChange("startTime", e.target.value)}
                      className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 focus:border-blue-600 focus:bg-white rounded-2xl text-xs font-semibold text-slate-800 outline-none transition-all cursor-pointer"
                    />
                  </div>
                </div>
              </div>

              {/* EVENT END */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Event End
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="relative">
                    <Calendar size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    <input
                      type="date"
                      value={formData.endDate}
                      onChange={(e) => handleChange("endDate", e.target.value)}
                      className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 focus:border-blue-600 focus:bg-white rounded-2xl text-xs font-semibold text-slate-800 outline-none transition-all cursor-pointer"
                    />
                  </div>

                  <div className="relative">
                    <Clock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    <input
                      type="time"
                      value={formData.endTime}
                      onChange={(e) => handleChange("endTime", e.target.value)}
                      className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 focus:border-blue-600 focus:bg-white rounded-2xl text-xs font-semibold text-slate-800 outline-none transition-all cursor-pointer"
                    />
                  </div>
                </div>
              </div>

              {/* TIMEZONE */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Timezone
                </label>
                <div className="relative">
                  <Globe size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  <select
                    value={formData.timezone}
                    onChange={(e) => handleChange("timezone", e.target.value)}
                    className="w-full pl-11 pr-10 py-3.5 bg-slate-50 border border-slate-200 focus:border-blue-600 focus:bg-white rounded-2xl text-xs font-semibold text-slate-800 outline-none transition-all cursor-pointer appearance-none"
                  >
                    {TIMEZONES.map(tz => (
                      <option key={tz.id} value={tz.id}>
                        {tz.name} ({tz.offset}) — {tz.time}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Action Button */}
              <button
                type="button"
                onClick={handleNextFrom2B}
                className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold text-xs shadow-lg shadow-blue-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer mt-4"
              >
                <span>Next: Event Location</span>
                <ArrowRight size={15} />
              </button>
            </div>

            <div className="flex items-center justify-start max-w-xl mx-auto mt-6">
              <button
                type="button"
                onClick={handleBack}
                className="px-5 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-600 font-bold text-xs transition-all cursor-pointer flex items-center gap-1.5"
              >
                <ArrowLeft size={14} />
                <span>Back</span>
              </button>
            </div>
          </div>
        )}

        {/* ────────────────────────────────────────────────────────────────── */}
        {/* SUB-STEP 2C: Where is your event? (Location / Hybrid / Virtual)    */}
        {/* ────────────────────────────────────────────────────────────────── */}
        {currentScreen === "2C" && (
          <div className="w-full animate-fade-in text-center">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">
              Where is your event located?
            </h1>
            <p className="text-sm text-slate-500 font-medium mt-2 mb-8">
              Select venue format and physical or virtual address.
            </p>

            <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs max-w-xl mx-auto text-left space-y-6">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-2.5">
                  Format
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { id: "In-Person", label: "Venue", desc: "Physical", icon: Building2 },
                    { id: "Hybrid", label: "Hybrid", desc: "Physical + Stream", icon: Globe },
                    { id: "Virtual", label: "Online", desc: "100% Virtual", icon: Video }
                  ].map(({ id, label, desc, icon: Icon }) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => handleChange("type", id)}
                      className={`p-3.5 rounded-2xl border text-center flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                        formData.type === id
                          ? "bg-blue-50 border-blue-600 ring-2 ring-blue-500/20 text-blue-800 shadow-sm"
                          : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                      }`}
                    >
                      <Icon size={18} className={formData.type === id ? "text-blue-600" : "text-slate-500"} />
                      <div>
                        <span className="text-xs font-bold block">{label}</span>
                        <span className="text-[10px] text-slate-400 font-medium">{desc}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Venue / Location Address
                </label>
                <div className="relative">
                  <MapPin size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="e.g. Algiers International Conference Center (CIC), Algeria"
                    value={formData.location}
                    onChange={(e) => handleChange("location", e.target.value)}
                    className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 focus:border-blue-600 focus:bg-white rounded-2xl text-xs font-semibold text-slate-900 outline-none transition-all"
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={handleNextFrom2C}
                className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold text-xs shadow-lg shadow-blue-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer mt-4"
              >
                <span>Next: Category & Banner</span>
                <ArrowRight size={15} />
              </button>
            </div>

            <div className="flex items-center justify-start max-w-xl mx-auto mt-6">
              <button
                type="button"
                onClick={handleBack}
                className="px-5 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-600 font-bold text-xs transition-all cursor-pointer flex items-center gap-1.5"
              >
                <ArrowLeft size={14} />
                <span>Back</span>
              </button>
            </div>
          </div>
        )}

        {/* ────────────────────────────────────────────────────────────────── */}
        {/* SUB-STEP 2D: Category & Cover Banner                               */}
        {/* ────────────────────────────────────────────────────────────────── */}
        {currentScreen === "2D" && (
          <div className="w-full animate-fade-in text-center">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">
              Choose industry category & cover banner
            </h1>
            <p className="text-sm text-slate-500 font-medium mt-2 mb-8">
              Customize how your event card appears on the public discovery calendar.
            </p>

            <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs max-w-2xl mx-auto text-left space-y-6">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Industry / Category
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => handleChange("category", e.target.value)}
                  className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 focus:border-blue-600 focus:bg-white rounded-2xl text-xs font-semibold text-slate-900 outline-none transition-all cursor-pointer"
                >
                  {INDUSTRIES.map(ind => (
                    <option key={ind} value={ind}>{ind}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-2.5">
                  Select Event Cover Banner
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {PRESET_BANNERS.map((preset) => (
                    <div
                      key={preset.url}
                      onClick={() => handleChange("banner", preset.url)}
                      className={`h-24 rounded-2xl overflow-hidden relative cursor-pointer border-2 transition-all group ${
                        formData.banner === preset.url ? "border-blue-600 ring-4 ring-blue-100 scale-102" : "border-slate-200 opacity-70 hover:opacity-100"
                      }`}
                    >
                      <img src={preset.url} alt={preset.name} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent flex items-end p-2">
                        <span className="text-[10px] font-bold text-white leading-tight truncate">{preset.name}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Expected Capacity
                </label>
                <div className="relative">
                  <Users size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="number"
                    min={50}
                    step={50}
                    value={formData.capacity}
                    onChange={(e) => handleChange("capacity", parseInt(e.target.value) || 100)}
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 focus:border-blue-600 focus:bg-white rounded-2xl text-xs font-semibold text-slate-900 outline-none transition-all"
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={handleNextFrom2D}
                className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold text-xs shadow-lg shadow-blue-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer mt-4"
              >
                <span>Next: Customize URL</span>
                <ArrowRight size={15} />
              </button>
            </div>

            <div className="flex items-center justify-start max-w-2xl mx-auto mt-6">
              <button
                type="button"
                onClick={handleBack}
                className="px-5 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-600 font-bold text-xs transition-all cursor-pointer flex items-center gap-1.5"
              >
                <ArrowLeft size={14} />
                <span>Back</span>
              </button>
            </div>
          </div>
        )}

        {/* ────────────────────────────────────────────────────────────────── */}
        {/* SUB-STEP 2E (NEW SCREENSHOT): Customize your event URL             */}
        {/* ────────────────────────────────────────────────────────────────── */}
        {currentScreen === "2E" && (
          <div className="w-full animate-fade-in text-center">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">
              Customize your Eventzone event URL.
            </h1>
            <p className="text-sm text-slate-500 font-medium mt-2 mb-8">
              This is the link you&apos;ll give to guests so they can register.
            </p>

            <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs max-w-xl mx-auto text-left space-y-6">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-2">
                  EVENT URL
                </label>
                <div className={`bg-white border-2 rounded-2xl p-3.5 sm:p-4 flex items-center justify-between transition-all ${
                  formData.slug.trim() 
                    ? "border-emerald-500 ring-4 ring-emerald-50 shadow-xs" 
                    : "border-slate-300"
                }`}>
                  <div className="flex items-center flex-1 overflow-hidden pr-2">
                    <input
                      type="text"
                      autoFocus
                      required
                      placeholder="myevent"
                      value={formData.slug}
                      onChange={(e) => handleChange("slug", e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                      className="w-full text-slate-900 font-bold text-base sm:text-lg outline-none bg-transparent placeholder-slate-400"
                    />
                    <span className="text-slate-500 font-semibold text-xs sm:text-sm select-none shrink-0 pl-1">
                      .eventzone.io
                    </span>
                  </div>
                  <div className="w-7 h-7 rounded-full bg-emerald-50 border border-emerald-300 text-emerald-600 flex items-center justify-center shrink-0">
                    <Check size={16} className="stroke-[2.5]" />
                  </div>
                </div>
                <p className="text-[11px] text-slate-400 font-medium mt-2">
                  Direct Guest Link: <span className="text-blue-600 font-bold">https://{formData.slug || "myevent"}.eventzone.io</span>
                </p>
              </div>

              <button
                type="button"
                onClick={handleNextFrom2E}
                className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold text-xs shadow-lg shadow-blue-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer mt-4"
              >
                <span>Next: Create Account</span>
                <ArrowRight size={15} />
              </button>
            </div>

            <div className="flex items-center justify-start max-w-xl mx-auto mt-6">
              <button
                type="button"
                onClick={handleBack}
                className="px-5 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-600 font-bold text-xs transition-all cursor-pointer flex items-center gap-1.5"
              >
                <ArrowLeft size={14} />
                <span>Back</span>
              </button>
            </div>
          </div>
        )}

        {/* ────────────────────────────────────────────────────────────────── */}
        {/* STEP 3: Account information & Review Launch                        */}
        {/* ────────────────────────────────────────────────────────────────── */}
        {currentScreen === "3" && (
          <div className="w-full animate-fade-in text-center">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">
              Account information & Summary
            </h1>
            <p className="text-sm text-slate-500 font-medium mt-2 mb-8">
              Review your setup before launching your event manager dashboard.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 max-w-3xl mx-auto text-left">
              {/* Host Fields */}
              <div className="md:col-span-7 bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs space-y-4">
                <h3 className="text-sm font-bold text-slate-800 pb-2 border-b border-slate-100 flex items-center gap-2">
                  <ShieldCheck size={16} className="text-blue-600" />
                  <span>Host Account Details</span>
                </h3>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Organizer Name
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.hostName}
                    onChange={(e) => handleChange("hostName", e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:border-blue-600 focus:bg-white rounded-xl text-xs font-semibold text-slate-900 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Contact Email
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.hostEmail}
                    onChange={(e) => handleChange("hostEmail", e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:border-blue-600 focus:bg-white rounded-xl text-xs font-semibold text-slate-900 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Organization / Host Entity
                  </label>
                  <input
                    type="text"
                    value={formData.organization}
                    onChange={(e) => handleChange("organization", e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:border-blue-600 focus:bg-white rounded-xl text-xs font-semibold text-slate-900 outline-none"
                  />
                </div>
              </div>

              {/* Live Preview Card Mini */}
              <div className="md:col-span-5 flex flex-col justify-between bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xs">
                <div className="h-32 w-full relative overflow-hidden bg-slate-900">
                  <img src={formData.banner} alt="Cover" className="w-full h-full object-cover" />
                  <div className="absolute top-2.5 left-2.5">
                    <span className="px-2.5 py-0.5 rounded-full text-[9px] font-extrabold bg-white/95 text-blue-700 uppercase">
                      {formData.type}
                    </span>
                  </div>
                </div>

                <div className="p-4 space-y-2 flex-1 flex flex-col justify-between">
                  <div>
                    <span className="text-[9px] font-bold text-blue-600 uppercase tracking-wider block">
                      {formData.category}
                    </span>
                    <h4 className="text-xs font-bold text-slate-900 line-clamp-2 mt-0.5">
                      {formData.title || "Untitled Event"}
                    </h4>
                  </div>

                  <div className="text-[11px] text-slate-500 space-y-1 pt-2 border-t border-slate-100 font-medium">
                    <div className="flex items-center gap-1.5">
                      <Calendar size={12} className="text-blue-600 shrink-0" />
                      <span>{formData.startDate} — {formData.endDate}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <MapPin size={12} className="text-blue-600 shrink-0" />
                      <span className="truncate">{formData.location}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-blue-600 font-semibold truncate pt-1">
                      <LinkIcon size={12} className="shrink-0" />
                      <span className="truncate">{formData.slug}.eventzone.io</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Launch CTA */}
            <div className="flex items-center justify-between max-w-3xl mx-auto mt-8 pt-4 border-t border-slate-200/70">
              <button
                type="button"
                onClick={handleBack}
                className="px-5 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-600 font-bold text-xs transition-all cursor-pointer flex items-center gap-1.5"
              >
                <ArrowLeft size={14} />
                <span>Back</span>
              </button>

              <button
                type="button"
                disabled={loading}
                onClick={handleSubmit}
                className="px-8 py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs shadow-lg shadow-blue-600/30 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Create Event & Launch Dashboard</span>
                    <Sparkles size={15} />
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
