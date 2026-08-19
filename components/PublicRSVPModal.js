/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useState, useEffect } from "react";
import { 
  CheckCircle2, X, AlertCircle, Calendar, Clock, MapPin, 
  Users, UserPlus, Utensils, Sparkles, Download, Check, 
  Send, HelpCircle, ShieldCheck, QrCode, ArrowRight, UserCheck, AlertTriangle
} from "lucide-react";
import { useLanguage } from "../lib/i18n";
import QRCode from "qrcode";

export const DIETARY_OPTIONS = [
  { id: "None", label: "Standard / No Restrictions", icon: "🍽️" },
  { id: "Halal", label: "Halal", icon: "🌙" },
  { id: "Vegetarian", label: "Vegetarian", icon: "🥗" },
  { id: "Vegan", label: "Vegan", icon: "🌱" },
  { id: "Gluten-Free", label: "Gluten-Free", icon: "🌾" },
  { id: "Dairy-Free", label: "Dairy-Free", icon: "🥛" },
  { id: "Kosher", label: "Kosher", icon: "✡️" },
  { id: "Nut Allergy", label: "Nut Allergy", icon: "🥜" },
  { id: "Other", label: "Other / Custom", icon: "✏️" },
];

export default function PublicRSVPModal({
  isOpen,
  onClose,
  event = {},
  rsvpSettings = {},
  existingHeadcount = 0,
  onSubmitRSVP,
  currentUser = null
}) {
  const { t, isRTL } = useLanguage();

  // Form State
  const [status, setStatus] = useState("attending"); // "attending" | "declined" | "tentative"
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [company, setCompany] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [plusOnes, setPlusOnes] = useState(0);
  const [plusOnesNames, setPlusOnesNames] = useState([""]);
  const [dietaryPreference, setDietaryPreference] = useState("None");
  const [dietaryNotes, setDietaryNotes] = useState("");
  const [notes, setNotes] = useState("");

  // UI Flow State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submitResult, setSubmitResult] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState("");

  // Pre-fill user profile if logged in
  useEffect(() => {
    if (currentUser && isOpen) {
      if (currentUser.fullName) setFullName(currentUser.fullName);
      if (currentUser.email) setEmail(currentUser.email);
      if (currentUser.phone) setPhone(currentUser.phone);
      if (currentUser.companyName) setCompany(currentUser.companyName);
      if (currentUser.jobTitle) setJobTitle(currentUser.jobTitle);
    }
  }, [currentUser, isOpen]);

  // Reset when opened
  useEffect(() => {
    if (isOpen) {
      setIsSubmitted(false);
      setSubmitResult(null);
      setErrorMessage("");
    }
  }, [isOpen]);

  // Settings & Capacity
  const capacityLimit = rsvpSettings?.capacityLimit || rsvpSettings?.capacity_limit || event?.capacity || 150;
  const isEnabled = rsvpSettings?.isEnabled ?? rsvpSettings?.is_enabled ?? true;
  const allowPlusOnes = rsvpSettings?.allowPlusOnes ?? rsvpSettings?.allow_plus_ones ?? true;
  const maxPlusOnes = rsvpSettings?.maxPlusOnes ?? rsvpSettings?.max_plus_ones ?? 2;
  const allowWaitlist = rsvpSettings?.allowWaitlist ?? rsvpSettings?.allow_waitlist ?? true;
  const deadline = rsvpSettings?.deadline;

  const isDeadlinePassed = deadline ? new Date(deadline) < new Date() : false;
  const isFull = existingHeadcount >= capacityLimit;
  const willBeWaitlisted = isFull && allowWaitlist && status === "attending";

  // Plus ones names handler
  const handlePlusOnesChange = (count) => {
    const num = Math.max(0, Math.min(count, maxPlusOnes));
    setPlusOnes(num);
    const newNames = [...plusOnesNames];
    while (newNames.length < num) newNames.push("");
    setPlusOnesNames(newNames.slice(0, num));
  };

  const handleCompanionNameChange = (index, val) => {
    const updated = [...plusOnesNames];
    updated[index] = val;
    setPlusOnesNames(updated);
  };

  // Generate QR Code on success
  useEffect(() => {
    if (isSubmitted && submitResult?.rsvp?.id) {
      const codePayload = JSON.stringify({
        id: submitResult.rsvp.id,
        event: event?.title || "Eventzone Event",
        guest: submitResult.rsvp.fullName,
        headcount: 1 + (submitResult.rsvp.plusOnes || 0),
        status: submitResult.rsvp.status,
      });
      QRCode.toDataURL(codePayload, { width: 180, margin: 1, color: { dark: '#0b5cdb', light: '#ffffff' } })
        .then(url => setQrCodeDataUrl(url))
        .catch(err => console.error("QR Code error:", err));
    }
  }, [isSubmitted, submitResult, event]);

  // Download .ics calendar event
  const handleDownloadIcs = () => {
    const title = event?.title || event?.name || "Eventzone Summit";
    const desc = event?.description || "Confirmed Eventzone Attendance";
    const loc = event?.location || "Algiers";
    const sDate = event?.startDate ? event.startDate.replace(/-/g, '') : "20261012";
    const eDate = event?.endDate ? event.endDate.replace(/-/g, '') : sDate;

    const icsContent = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Eventzone//RSVP Module//EN",
      "BEGIN:VEVENT",
      `SUMMARY:${title}`,
      `DESCRIPTION:${desc}`,
      `LOCATION:${loc}`,
      `DTSTART:${sDate}T090000Z`,
      `DTEND:${eDate}T180000Z`,
      "STATUS:CONFIRMED",
      "END:VEVENT",
      "END:VCALENDAR"
    ].join("\r\n");

    const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${title.replace(/\s+/g, '_')}_RSVP.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Form Submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");

    if (!fullName.trim()) {
      setErrorMessage("Please enter your full name.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim() || !emailRegex.test(email.trim())) {
      setErrorMessage("Please provide a valid email address.");
      return;
    }

    if (isDeadlinePassed) {
      setErrorMessage(t("rsvp.deadlinePassed", "The RSVP deadline for this event has passed."));
      return;
    }

    if (!isEnabled) {
      setErrorMessage("RSVP is currently closed for this event.");
      return;
    }

    if (isFull && !allowWaitlist && status === "attending") {
      setErrorMessage("This event is at maximum capacity and not accepting further responses.");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        fullName: fullName.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        company: company.trim(),
        jobTitle: jobTitle.trim(),
        status,
        plusOnes: status === "attending" ? plusOnes : 0,
        plusOnesNames: status === "attending" ? plusOnesNames.filter(n => n.trim()) : [],
        dietaryPreference: status === "attending" ? dietaryPreference : "None",
        dietaryNotes: status === "attending" ? dietaryNotes.trim() : "",
        notes: notes.trim(),
        userId: currentUser?.id || null
      };

      let result = null;
      if (onSubmitRSVP) {
        result = await onSubmitRSVP(payload);
      } else {
        // Fallback to Next.js API
        const targetEventId = event?.id || "00000000-0000-0000-0000-000000000001";
        const res = await fetch(`/api/events/${targetEventId}/rsvp`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
        result = await res.json();
        if (!res.ok) {
          throw new Error(result.error || "Failed to submit RSVP");
        }
      }

      setSubmitResult(result || { success: true, rsvp: payload, assignedStatus: status });
      setIsSubmitted(true);
    } catch (err) {
      console.error("Public RSVP submission error:", err);
      setErrorMessage(err.message || "An unexpected error occurred while submitting your RSVP.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div 
        className="relative w-full max-w-xl bg-white border border-slate-200/80 rounded-3xl shadow-2xl overflow-hidden my-8 animate-scale-up"
        dir={isRTL ? "rtl" : "ltr"}
      >
        {/* Header Ribbon / Banner */}
        <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 p-6 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center text-white transition-all cursor-pointer"
            aria-label="Close"
          >
            <X size={18} />
          </button>

          <div className="flex items-center gap-2 text-xs font-semibold text-blue-100 uppercase tracking-wider mb-1">
            <Sparkles size={14} className="text-amber-300" />
            <span>{t("rsvp.title", "Event Attendance RSVP")}</span>
          </div>

          <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white line-clamp-1">
            {event?.title || event?.name || "Algeria Hydrogen Law Conference 2026"}
          </h2>

          <div className="flex flex-wrap items-center gap-3 mt-3 text-xs text-blue-100 font-medium">
            {event?.startDate && (
              <span className="flex items-center gap-1">
                <Calendar size={13} className="text-blue-200" />
                <span>{event.startDate}</span>
              </span>
            )}
            {event?.location && (
              <span className="flex items-center gap-1">
                <MapPin size={13} className="text-blue-200" />
                <span className="truncate max-w-[200px]">{event.location}</span>
              </span>
            )}
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 max-h-[75vh] overflow-y-auto space-y-6">

          {/* Success Screen */}
          {isSubmitted ? (
            <div className="flex flex-col items-center text-center py-4 space-y-5 animate-scale-up">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
                submitResult?.assignedStatus === 'waitlisted' || submitResult?.isWaitlisted
                  ? 'bg-amber-100 text-amber-600'
                  : 'bg-emerald-100 text-emerald-600'
              }`}>
                {submitResult?.assignedStatus === 'waitlisted' || submitResult?.isWaitlisted ? (
                  <Clock size={32} />
                ) : (
                  <CheckCircle2 size={32} />
                )}
              </div>

              <div>
                <h3 className="text-xl font-black text-slate-900">
                  {submitResult?.assignedStatus === 'waitlisted' || submitResult?.isWaitlisted
                    ? t("rsvp.waitlistSuccess", "Added to Priority Waitlist!")
                    : status === "declined"
                    ? "Response Recorded"
                    : t("rsvp.submitSuccess", "RSVP Confirmed!")}
                </h3>
                <p className="text-xs text-slate-600 mt-1.5 max-w-md mx-auto leading-relaxed">
                  {submitResult?.assignedStatus === 'waitlisted' || submitResult?.isWaitlisted
                    ? t("rsvp.waitlistSuccessDesc", "The event is currently at capacity. You've been placed on the priority waitlist and we will notify you if a spot opens up.")
                    : status === "declined"
                    ? "Thank you for letting us know. We're sorry you won't be able to join us."
                    : t("rsvp.submitSuccessDesc", "Your response has been saved. We look forward to seeing you at the event.")}
                </p>
              </div>

              {/* Summary Card */}
              {status !== "declined" && (
                <div className="w-full bg-slate-50 border border-slate-200/80 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-left">
                  <div className="space-y-1.5 flex-1">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">RSVP Summary</div>
                    <div className="text-sm font-bold text-slate-900">{fullName}</div>
                    <div className="text-xs text-slate-600">{email}</div>
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700">
                        {1 + plusOnes} {1 + plusOnes === 1 ? "Guest" : "Guests (You + " + plusOnes + ")"}
                      </span>
                      {dietaryPreference !== "None" && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700">
                          {dietaryPreference}
                        </span>
                      )}
                    </div>
                  </div>

                  {qrCodeDataUrl && (
                    <div className="flex flex-col items-center shrink-0 bg-white p-2 rounded-xl border border-slate-200 shadow-xs">
                      <img src={qrCodeDataUrl} alt="RSVP QR Code" className="w-24 h-24 object-contain" />
                      <span className="text-[9px] font-mono font-bold text-slate-500 mt-1">RSVP PASS</span>
                    </div>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center gap-3 w-full pt-2">
                {status === "attending" && (
                  <button
                    type="button"
                    onClick={handleDownloadIcs}
                    className="w-full sm:flex-1 py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-xs"
                  >
                    <Download size={14} />
                    <span>{t("rsvp.addToCalendar", "Add to Calendar (.ics)")}</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full sm:flex-1 py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
                >
                  {t("common.cancel", "Close")}
                </button>
              </div>
            </div>
          ) : (
            /* Submission Form */
            <form onSubmit={handleSubmit} className="space-y-5">

              {/* Notice Banners */}
              {isDeadlinePassed && (
                <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-3 text-rose-800 text-xs">
                  <AlertCircle size={16} className="shrink-0 text-rose-600 mt-0.5" />
                  <div>
                    <span className="font-bold">RSVP Deadline Passed:</span> Submissions for this event ended on {new Date(deadline).toLocaleDateString()}.
                  </div>
                </div>
              )}

              {!isDeadlinePassed && willBeWaitlisted && (
                <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3 text-amber-900 text-xs">
                  <Clock size={16} className="shrink-0 text-amber-600 mt-0.5" />
                  <div>
                    <span className="font-bold">Capacity Notice:</span> Confirmed spots are currently filled ({existingHeadcount}/{capacityLimit}). New attendees will be placed on the <span className="font-bold">Priority Waitlist</span>.
                  </div>
                </div>
              )}

              {errorMessage && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-semibold flex items-center gap-2 animate-fade-in">
                  <AlertCircle size={14} className="shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* 1. Attendance Status Choice */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                  <span>{t("rsvp.willYouAttend", "Will you be attending?")}</span>
                  <span className="text-[10px] text-blue-600 font-semibold">* Required</span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setStatus("attending")}
                    className={`py-3 px-2 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1 ${
                      status === "attending"
                        ? "bg-blue-50/80 border-blue-600 text-blue-800 shadow-xs ring-2 ring-blue-600/20"
                        : "bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                    }`}
                  >
                    <span className="text-base">🎉</span>
                    <span className="text-xs font-extrabold">{t("rsvp.attending", "Attending")}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setStatus("tentative")}
                    className={`py-3 px-2 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1 ${
                      status === "tentative"
                        ? "bg-amber-50 border-amber-500 text-amber-800 shadow-xs ring-2 ring-amber-500/20"
                        : "bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                    }`}
                  >
                    <span className="text-base">🤔</span>
                    <span className="text-xs font-extrabold">{t("rsvp.tentative", "Tentative")}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setStatus("declined")}
                    className={`py-3 px-2 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1 ${
                      status === "declined"
                        ? "bg-rose-50 border-rose-500 text-rose-800 shadow-xs ring-2 ring-rose-500/20"
                        : "bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                    }`}
                  >
                    <span className="text-base">😢</span>
                    <span className="text-xs font-extrabold">{t("rsvp.declined", "Declined")}</span>
                  </button>
                </div>
              </div>

              {/* 2. Contact Information */}
              <div className="space-y-3 pt-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block mb-1">
                      {t("rsvp.guestName", "Full Name")} *
                    </label>
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. Dr. Elena Rostova"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:border-blue-600 focus:bg-white transition-colors"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block mb-1">
                      {t("rsvp.email", "Email Address")} *
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="e.g. elena@domain.com"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:border-blue-600 focus:bg-white transition-colors"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block mb-1">
                      {t("rsvp.phone", "Phone Number")}
                    </label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+213 ..."
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:border-blue-600 focus:bg-white transition-colors"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block mb-1">
                      {t("rsvp.company", "Company / Organization")}
                    </label>
                    <input
                      type="text"
                      value={company}
                      onChange={(e) => setCompany(e.target.value)}
                      placeholder="e.g. Energy Transition Corp"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:border-blue-600 focus:bg-white transition-colors"
                    />
                  </div>
                </div>
              </div>

              {/* 3. Plus-Ones Section (If Attending & Allowed) */}
              {status === "attending" && allowPlusOnes && maxPlusOnes > 0 && (
                <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-slate-800">{t("rsvp.bringingGuests", "Bringing Companion Guests (+1s)?")}</div>
                      <div className="text-[11px] text-slate-500">Up to {maxPlusOnes} additional guests allowed with your RSVP</div>
                    </div>
                    <div className="flex items-center gap-1 bg-white border border-slate-200 p-1 rounded-xl shadow-2xs">
                      {[...Array(maxPlusOnes + 1).keys()].map((n) => (
                        <button
                          key={n}
                          type="button"
                          onClick={() => handlePlusOnesChange(n)}
                          className={`w-7 h-7 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                            plusOnes === n
                              ? "bg-blue-600 text-white shadow-xs"
                              : "text-slate-600 hover:bg-slate-100"
                          }`}
                        >
                          {n === 0 ? "0" : `+${n}`}
                        </button>
                      ))}
                    </div>
                  </div>

                  {plusOnes > 0 && (
                    <div className="space-y-2 pt-2 border-t border-slate-200/60">
                      <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block">
                        {t("rsvp.companionNames", "Companion Full Names")}
                      </label>
                      {plusOnesNames.map((name, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 text-[10px] font-bold flex items-center justify-center shrink-0">
                            {idx + 1}
                          </span>
                          <input
                            type="text"
                            value={name}
                            onChange={(e) => handleCompanionNameChange(idx, e.target.value)}
                            placeholder={`Companion #${idx + 1} Full Name`}
                            className="flex-1 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:border-blue-600"
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* 4. Dietary Preferences (If Attending) */}
              {status === "attending" && (
                <div className="space-y-2.5 pt-1">
                  <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Utensils size={14} className="text-emerald-600" />
                      <span>{t("rsvp.dietaryPreference", "Dietary Preferences & Allergens")}</span>
                    </span>
                  </label>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {DIETARY_OPTIONS.map((diet) => (
                      <button
                        key={diet.id}
                        type="button"
                        onClick={() => setDietaryPreference(diet.id)}
                        className={`p-2 rounded-xl border text-left flex items-center gap-2 transition-all cursor-pointer text-xs ${
                          dietaryPreference === diet.id
                            ? "bg-emerald-50 border-emerald-500 text-emerald-900 font-bold shadow-2xs"
                            : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                        }`}
                      >
                        <span className="text-sm">{diet.icon}</span>
                        <span className="truncate">{diet.label}</span>
                      </button>
                    ))}
                  </div>

                  {(dietaryPreference !== "None" || dietaryNotes) && (
                    <input
                      type="text"
                      value={dietaryNotes}
                      onChange={(e) => setDietaryNotes(e.target.value)}
                      placeholder="Additional dietary notes or allergy specifics..."
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:border-blue-600 focus:bg-white transition-colors"
                    />
                  )}
                </div>
              )}

              {/* 5. Special Notes */}
              <div className="space-y-1.5 pt-1">
                <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block">
                  {t("rsvp.specialRequests", "Special Requests or Message for Organizer")}
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Accessibility needs, question for speakers, arrival notes..."
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:border-blue-600 focus:bg-white transition-colors resize-none"
                />
              </div>

              {/* Submit Buttons */}
              <div className="pt-3 border-t border-slate-150 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  {t("common.cancel", "Cancel")}
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting || isDeadlinePassed}
                  className={`px-6 py-2.5 rounded-xl text-xs font-bold text-white flex items-center gap-2 transition-all cursor-pointer shadow-xs ${
                    status === 'declined'
                      ? 'bg-slate-700 hover:bg-slate-800'
                      : 'bg-blue-600 hover:bg-blue-700'
                  } ${isSubmitting || isDeadlinePassed ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <>
                      <Send size={13} />
                      <span>
                        {status === "declined"
                          ? "Submit Decline"
                          : willBeWaitlisted
                          ? "Join Priority Waitlist"
                          : t("rsvp.publicRsvpNow", "Submit RSVP")}
                      </span>
                    </>
                  )}
                </button>
              </div>

            </form>
          )}

        </div>
      </div>
    </div>
  );
}
