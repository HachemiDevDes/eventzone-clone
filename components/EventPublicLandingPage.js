/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useState, useEffect } from "react";
import { 
  Calendar, MapPin, Sparkles, ArrowRight, ArrowLeft, ArrowUp,
  Layers, Users, Clock, Ticket, Award, CheckCircle2, 
  ExternalLink, Share2, Compass, ShieldCheck, 
  ChevronRight, Building2, Check, Download, Mail, X, Globe, Video,
  Star, MessageSquare, Printer, User, Briefcase, Phone, QrCode as QrIcon, FileText,
  Tag, AlertCircle, RefreshCw, Smartphone, ChevronDown
} from "lucide-react";
import QRCode from "qrcode";
import { useLanguage } from "../lib/i18n";
import PublicRSVPModal from "./PublicRSVPModal";
import CountryPhoneInput from "./CountryPhoneInput";
import { CountrySelect, CitySelect } from "./LocationInputs";
import FormImageUploader from "./FormImageUploader";

export default function EventPublicLandingPage({
  eventId,
  eventDetails,
  sessions = [],
  sponsors = [],
  exhibitors = [],
  attendees = [],
  tickets = [],
  forms = [],
  formSubmissions = [],
  rsvps = [],
  rsvpSettings = {},
  onSubmitRSVP,
  onSubmitFormResponse,
  currentUser,
  onBackToHome,
  onViewFloorPlan,
  onRegisterForEvent,
  onOpenAuth
}) {
  const { t, lang, setLang, isRTL, languages } = useLanguage();
  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const [selectedDay, setSelectedDay] = useState("All");
  const [bookmarkedSessions, setBookmarkedSessions] = useState(new Set());
  const [copiedUrl, setCopiedUrl] = useState(false);

  // Dedicated RSVP Modal State
  const [showPublicRsvpModal, setShowPublicRsvpModal] = useState(false);

  // Custom Form Registration State
  const [customAnswers, setCustomAnswers] = useState({});

  // Feedback Survey Modal State
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedbackAnswers, setFeedbackAnswers] = useState({});
  const [feedbackSuccess, setFeedbackSuccess] = useState(false);
  const [feedbackLoading, setFeedbackLoading] = useState(false);

  // RSVP / Full-Page Registration State
  const [showRsvpModal, setShowRsvpModal] = useState(false);
  const [selectedTier, setSelectedTier] = useState("Standard Admission");
  const [rsvpName, setRsvpName] = useState(currentUser?.fullName || "");
  const [rsvpEmail, setRsvpEmail] = useState(currentUser?.email || "");
  const [rsvpCompany, setRsvpCompany] = useState(currentUser?.organization || currentUser?.company || "");
  const [rsvpJobTitle, setRsvpJobTitle] = useState(currentUser?.jobTitle || "");
  const [rsvpPhone, setRsvpPhone] = useState("");
  const [rsvpLoading, setRsvpLoading] = useState(false);
  const [rsvpSuccess, setRsvpSuccess] = useState(null);
  const [qrCodeUrl, setQrCodeUrl] = useState(null);

  // Fallback data if event doesn't have custom sessions/exhibitors/sponsors yet
  const title = eventDetails?.title || "International Summit 2026";
  const tagline = eventDetails?.tagline || eventDetails?.description || "Bringing together visionary leaders, executives, and pioneers to shape the future of the industry.";
  const location = eventDetails?.location || "Algiers International Conference Center (CIC), Algeria";
  const startDate = eventDetails?.startDate || "2026-11-05";
  const endDate = eventDetails?.endDate || "2026-11-08";
  const category = eventDetails?.category || "Technology & Software";
  const type = eventDetails?.type || "Hybrid";
  const banner = eventDetails?.banner || "https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1600&q=80";
  const hostName = eventDetails?.hostName || "Eventzone Executive Committee";
  const organization = eventDetails?.organization || "Global Industry Forum";

  // Event Countdown Timer State
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    status: "upcoming" // "upcoming" | "live" | "concluded"
  });

  useEffect(() => {
    if (!startDate) return;

    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      
      const startParts = String(startDate).split('-');
      const startYear = parseInt(startParts[0], 10);
      const startMonth = parseInt(startParts[1], 10) - 1;
      const startDay = parseInt(startParts[2], 10);
      const eventStartTime = new Date(startYear, isNaN(startMonth) ? 0 : startMonth, isNaN(startDay) ? 1 : startDay, 9, 0, 0).getTime();

      let eventEndTime = eventStartTime + (24 * 60 * 60 * 1000);
      if (endDate) {
        const endParts = String(endDate).split('-');
        const endYear = parseInt(endParts[0], 10);
        const endMonth = parseInt(endParts[1], 10) - 1;
        const endDay = parseInt(endParts[2], 10);
        eventEndTime = new Date(endYear, isNaN(endMonth) ? 0 : endMonth, isNaN(endDay) ? 1 : endDay, 20, 0, 0).getTime();
      }

      if (now >= eventStartTime && now <= eventEndTime) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, status: "live" });
        return;
      }

      if (now > eventEndTime) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, status: "concluded" });
        return;
      }

      const difference = eventStartTime - now;
      if (difference > 0) {
        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);
        setTimeLeft({ days, hours, minutes, seconds, status: "upcoming" });
      }
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(interval);
  }, [startDate, endDate]);

  // Real Database Sessions
  const eventSessions = sessions || [];

  // Real Database Speakers extracted from real sessions
  const eventSpeakers = [];
  const speakerNames = new Set();
  eventSessions.forEach(s => {
    (s.speakers || []).forEach(sp => {
      if (sp?.name && !speakerNames.has(sp.name)) {
        speakerNames.add(sp.name);
        eventSpeakers.push({
          name: sp.name,
          role: sp.role || "Speaker",
          title: sp.title || "",
          company: sp.company || organization || "",
          image: sp.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(sp.name)}&background=2563eb&color=fff`
        });
      }
    });
  });

  // Real Database Exhibitors, Sponsors & Tickets
  const eventExhibitors = exhibitors || [];
  const eventSponsors = sponsors || [];
  const eventTickets = tickets || [];

  const handleShare = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 3000);
    }
  };

  // Find active selected ticket object
  const selectedTicket = eventTickets.find(t => t.name === selectedTier || t.tier === selectedTier || t.id === selectedTier);

  // Find active ticket registration form
  const activeTicketForm = forms.find(f => 
    f.status === "active" && 
    f.type === "ticket_registration" && 
    (f.ticketId === "all" || f.ticketId === selectedTier)
  );

  // Find active feedback survey form
  const activeFeedbackForm = forms.find(f => 
    f.status === "active" && 
    (f.type === "feedback_survey" || f.type === "session_survey")
  );

  // Lock body scroll when registration is open to eliminate background double-scroll
  useEffect(() => {
    if (typeof document !== "undefined") {
      if (showRsvpModal) {
        document.body.style.overflow = "hidden";
      } else {
        document.body.style.overflow = "";
      }
    }
    return () => {
      if (typeof document !== "undefined") {
        document.body.style.overflow = "";
      }
    };
  }, [showRsvpModal]);

  // Synchronize URL parameters on initial load, direct link navigation & browser Back/Forward (popstate)
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handlePopState = () => {
      const searchParams = new URLSearchParams(window.location.search);
      const view = searchParams.get("view");
      const registerParam = searchParams.get("register");
      const ticketParam = searchParams.get("ticket");

      if (view === "rsvp") {
        setShowPublicRsvpModal(true);
      } else if (view === "register" || registerParam === "true") {
        setShowRsvpModal(true);
        if (ticketParam) {
          setSelectedTier(decodeURIComponent(ticketParam));
        } else if (eventTickets && eventTickets.length > 0) {
          setSelectedTier(eventTickets[0].name || eventTickets[0].tier || "Standard Admission");
        }
      } else {
        setShowRsvpModal(false);
        setShowPublicRsvpModal(false);
        setRsvpSuccess(null);
      }
    };

    handlePopState();

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [eventTickets]);

  const openRSVP = () => {
    setShowPublicRsvpModal(true);
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      params.set("view", "rsvp");
      if (eventId) params.set("eventId", eventId);
      const newUrl = `/?${params.toString()}`;
      window.history.pushState({}, "", newUrl);
    }
  };

  const closeRSVP = () => {
    setShowPublicRsvpModal(false);
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      params.set("view", "event-landing");
      if (eventId) params.set("eventId", eventId);
      const newUrl = `/?${params.toString()}`;
      window.history.pushState({}, "", newUrl);
    }
  };

  const openRegistration = (tierName) => {
    const chosenTier = tierName || selectedTier || (eventTickets[0]?.name || eventTickets[0]?.tier || "Standard Admission");
    setSelectedTier(chosenTier);
    setShowRsvpModal(true);
    setRsvpSuccess(null);

    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      params.set("view", "register");
      if (eventId) params.set("eventId", eventId);
      params.set("ticket", chosenTier);
      const newUrl = `/?${params.toString()}`;
      window.history.pushState({}, "", newUrl);
    }
  };

  const closeRegistration = () => {
    setShowRsvpModal(false);
    setRsvpSuccess(null);

    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      params.set("view", "event-landing");
      if (eventId) params.set("eventId", eventId);
      params.delete("ticket");
      params.delete("register");
      const newUrl = `/?${params.toString()}`;
      window.history.pushState({}, "", newUrl);
    }
  };

  const switchTicketTier = (tierName) => {
    setSelectedTier(tierName);
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      params.set("view", "register");
      if (eventId) params.set("eventId", eventId);
      params.set("ticket", tierName);
      const newUrl = `/?${params.toString()}`;
      window.history.replaceState({}, "", newUrl);
    }
  };

  const handleRsvpSubmit = async (e) => {
    e.preventDefault();
    setRsvpLoading(true);

    try {
      if (onRegisterForEvent) {
        const pass = await onRegisterForEvent(eventId || eventDetails?.id, {
          name: rsvpName || currentUser?.fullName || "Attendee",
          email: rsvpEmail || currentUser?.email || "visitor@eventzone.io",
          company: rsvpCompany || currentUser?.organization || "",
          jobTitle: rsvpJobTitle || currentUser?.jobTitle || "",
          phone: rsvpPhone || "",
          ticketType: selectedTier,
          requiresApproval: Boolean(selectedTicket?.requiresApproval),
          eventTitle: title,
          location: location,
          startDate: startDate,
          endDate: endDate,
        });

        // Submit custom form questions if form is configured
        if (activeTicketForm && onSubmitFormResponse) {
          try {
            await onSubmitFormResponse({
              formId: activeTicketForm.id,
              respondentName: rsvpName || currentUser?.fullName || "Attendee",
              respondentEmail: rsvpEmail || currentUser?.email || "visitor@eventzone.io",
              ticketTier: selectedTier,
              answers: customAnswers
            });
          } catch (formErr) {
            console.warn("Could not save form answers:", formErr);
          }
        }

        if (pass) {
          const qrData = JSON.stringify({
            passId: pass.id,
            badgeCode: pass.badgeCode,
            eventId: pass.eventId || eventId,
            eventTitle: title,
            attendeeName: rsvpName || "Attendee",
            company: rsvpCompany || "",
            jobTitle: rsvpJobTitle || "",
            ticketType: selectedTier,
          });
          const url = await QRCode.toDataURL(qrData, { 
            width: 280, 
            margin: 1, 
            color: { dark: "#0f172a", light: "#ffffff" } 
          });
          setQrCodeUrl(url);
          setRsvpSuccess(pass);
        }
      }
    } catch (err) {
      console.error("Registration error:", err);
    } finally {
      setRsvpLoading(false);
    }
  };

  const handleFeedbackSubmit = async (e) => {
    e.preventDefault();
    if (!activeFeedbackForm || !onSubmitFormResponse) return;
    setFeedbackLoading(true);

    const name = feedbackAnswers["f_core_name"] || currentUser?.fullName || "Conference Attendee";
    const email = feedbackAnswers["f_core_email"] || currentUser?.email || "attendee@eventzone.io";

    try {
      await onSubmitFormResponse({
        formId: activeFeedbackForm.id,
        respondentName: name,
        respondentEmail: email,
        ticketTier: "Delegate Pass",
        answers: feedbackAnswers
      });
      setFeedbackSuccess(true);
    } catch (err) {
      console.error("Feedback submit error:", err);
    } finally {
      setFeedbackLoading(false);
    }
  };

  const toggleBookmark = (sessionId) => {
    setBookmarkedSessions(prev => {
      const next = new Set(prev);
      if (next.has(sessionId)) next.delete(sessionId);
      else next.add(sessionId);
      return next;
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-blue-600 selection:text-white flex flex-col">
      {/* ==================================================================== */}
      {/* 1. STICKY TOP NAVBAR (LIGHT MODE)                                    */}
      {/* ==================================================================== */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-xl border-b border-slate-200 px-6 py-3.5 flex items-center justify-between shadow-xs relative">
        {/* Left: Brand Logo on its own */}
        <div className="flex items-center">
          <div onClick={onBackToHome} className="cursor-pointer select-none flex items-center" title="Return to Explore Events">
            <img src="https://i.imgur.com/jFDrQbM.png" alt="eventzone" style={{ height: '28px', width: 'auto', maxWidth: '160px' }} className="h-7 w-auto object-contain" />
          </div>
        </div>

        {/* Center: In-Page Navigation Quick Links */}
        <nav className="hidden lg:flex items-center justify-center gap-7 text-xs font-bold text-slate-600 absolute left-1/2 -translate-x-1/2">
          <a href="#about" className="hover:text-blue-600 transition-colors">{t("event.about", "About")}</a>
          <a href="#speakers" className="hover:text-blue-600 transition-colors">{t("event.speakers", "Speakers")}</a>
          <a href="#schedule" className="hover:text-blue-600 transition-colors">{t("event.agenda", "Agenda")}</a>
          <a href="#floorplan" className="hover:text-blue-600 transition-colors">{t("event.floorPlan", "Floor Plan")}</a>
          <a href="#exhibitors" className="hover:text-blue-600 transition-colors">{t("event.exhibitors", "Exhibitors & Sponsors")}</a>
          <a href="#tickets" className="hover:text-blue-600 transition-colors">{t("event.tickets", "Tickets")}</a>
        </nav>

        {/* Right: Language Selector, Share, Feedback & Get Tickets Buttons */}
        <div className="flex items-center gap-2">
          {/* Language Selector */}
          <div className="relative">
            {(() => {
              const curLang = languages.find(l => l.code === lang) || languages[0];
              return (
                <button
                  onClick={() => setLangMenuOpen(o => !o)}
                  className="flex items-center gap-2 px-2.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all cursor-pointer shadow-xs"
                  title="Change Language"
                >
                  {curLang?.icon ? (
                    <img src={curLang.icon} alt={lang} className="w-5 h-5 object-contain shrink-0" />
                  ) : (
                    <Globe size={13} className="text-slate-500" />
                  )}
                  <span className="uppercase tracking-wide font-extrabold text-[11px]">{lang}</span>
                  <ChevronDown size={11} className={`text-slate-400 transition-transform ${langMenuOpen ? "rotate-180" : ""}`} />
                </button>
              );
            })()}

            {langMenuOpen && (
              <div className="absolute top-full right-0 mt-1.5 w-36 bg-white border border-slate-200 rounded-xl shadow-xl p-1 z-50 animate-scale-up space-y-0.5">
                {languages.map(item => (
                  <button
                    key={item.code}
                    onClick={() => {
                      setLang(item.code);
                      setLangMenuOpen(false);
                    }}
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer ${
                      lang === item.code 
                        ? "bg-blue-50 text-blue-600 font-bold" 
                        : "text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <img src={item.icon} alt={item.code} className="w-5 h-5 object-contain shrink-0" />
                      <span>{item.label}</span>
                    </div>
                    {lang === item.code && <Check size={12} className="text-blue-600 shrink-0" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {activeFeedbackForm && (
            <button
              onClick={() => {
                setShowFeedbackModal(true);
                setFeedbackSuccess(false);
              }}
              className="px-3.5 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 transition-all cursor-pointer text-xs font-bold flex items-center gap-1.5 border border-amber-200/60"
            >
              <Star size={13} className="text-amber-500 fill-amber-500" />
              <span>Event Survey</span>
            </button>
          )}

          <button
            onClick={handleShare}
            className="px-3.5 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-all cursor-pointer text-xs font-bold shadow-xs"
            title="Copy event link"
          >
            {copiedUrl ? "Link Copied!" : "Share"}
          </button>

          <button
            onClick={openRSVP}
            className="px-3.5 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs border border-indigo-200/80 transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs"
          >
            <CheckCircle2 size={13} className="text-indigo-600" />
            <span>RSVP</span>
          </button>

          <button
            onClick={() => openRegistration(eventTickets[0]?.name || "Standard Admission")}
            className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-600/20 transition-all cursor-pointer"
          >
            {t("event.getPass", "Get Tickets")}
          </button>
        </div>
      </header>

      {/* ==================================================================== */}
      {/* 2. HERO SECTION (CINEMATIC DARK OVERLAY)                             */}
      {/* ==================================================================== */}
      <section className="relative overflow-hidden bg-slate-950 text-white border-b border-slate-800 py-16 sm:py-24">
        {/* Background Cover Image with Dark Overlay */}
        <div className="absolute inset-0 z-0">
          <img src={banner} alt={title} className="w-full h-full object-cover opacity-35 filter blur-xs scale-105" />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/85 to-slate-900/80" />
        </div>

        {/* Ambient Subtle Blue Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-4xl mx-auto px-6 sm:px-8 text-center space-y-6 flex flex-col items-center">
          {/* Main Event Title */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-tight max-w-3xl">
            {title}
          </h1>

          {/* Event Narrative / Tagline */}
          <p className="text-slate-300 text-base sm:text-lg font-normal leading-relaxed max-w-2xl mx-auto">
            {tagline}
          </p>

          {/* Date & Location Metadata */}
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs sm:text-sm font-semibold text-slate-200 pt-1">
            <div className="flex items-center gap-2 bg-slate-900/80 backdrop-blur-md px-4 py-2 rounded-2xl border border-slate-800 shadow-sm">
              <Calendar size={16} className="text-blue-400 shrink-0" />
              <span>{startDate} — {endDate}</span>
            </div>

            <div className="flex items-center gap-2 bg-slate-900/80 backdrop-blur-md px-4 py-2 rounded-2xl border border-slate-800 shadow-sm">
              <MapPin size={16} className="text-blue-400 shrink-0" />
              <span className="truncate max-w-xs sm:max-w-md">{location}</span>
            </div>
          </div>

          {/* Live Countdown Timer Widget */}
          {timeLeft.status === "upcoming" && (
            <div className="pt-2 pb-1 space-y-2.5 animate-fade-in">
              <div className="text-[11px] font-extrabold uppercase tracking-widest text-blue-400/90 flex items-center justify-center gap-1.5">
                <Clock size={13} className="text-blue-400" />
                <span>{t("event.startsIn", "Event Starts In")}</span>
              </div>

              <div className="flex items-center justify-center gap-2 sm:gap-3.5">
                {/* Days */}
                <div className="flex flex-col items-center justify-center min-w-[62px] sm:min-w-[74px] py-2.5 px-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 shadow-lg">
                  <span className="text-2xl sm:text-3xl font-black text-white font-mono tracking-tight">
                    {String(timeLeft.days).padStart(2, '0')}
                  </span>
                  <span className="text-[10px] sm:text-[11px] uppercase font-bold text-blue-300 tracking-wider mt-0.5">
                    {t("event.days", "Days")}
                  </span>
                </div>

                <span className="text-lg sm:text-2xl font-bold text-white/40 -mt-3">:</span>

                {/* Hours */}
                <div className="flex flex-col items-center justify-center min-w-[62px] sm:min-w-[74px] py-2.5 px-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 shadow-lg">
                  <span className="text-2xl sm:text-3xl font-black text-white font-mono tracking-tight">
                    {String(timeLeft.hours).padStart(2, '0')}
                  </span>
                  <span className="text-[10px] sm:text-[11px] uppercase font-bold text-blue-300 tracking-wider mt-0.5">
                    {t("event.hours", "Hours")}
                  </span>
                </div>

                <span className="text-lg sm:text-2xl font-bold text-white/40 -mt-3">:</span>

                {/* Minutes */}
                <div className="flex flex-col items-center justify-center min-w-[62px] sm:min-w-[74px] py-2.5 px-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 shadow-lg">
                  <span className="text-2xl sm:text-3xl font-black text-white font-mono tracking-tight">
                    {String(timeLeft.minutes).padStart(2, '0')}
                  </span>
                  <span className="text-[10px] sm:text-[11px] uppercase font-bold text-blue-300 tracking-wider mt-0.5">
                    {t("event.minutes", "Min")}
                  </span>
                </div>

                <span className="text-lg sm:text-2xl font-bold text-white/40 -mt-3">:</span>

                {/* Seconds */}
                <div className="flex flex-col items-center justify-center min-w-[62px] sm:min-w-[74px] py-2.5 px-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 shadow-lg">
                  <span className="text-2xl sm:text-3xl font-black text-white font-mono tracking-tight">
                    {String(timeLeft.seconds).padStart(2, '0')}
                  </span>
                  <span className="text-[10px] sm:text-[11px] uppercase font-bold text-blue-300 tracking-wider mt-0.5">
                    {t("event.seconds", "Sec")}
                  </span>
                </div>
              </div>
            </div>
          )}

          {timeLeft.status === "live" && (
            <div className="pt-2 pb-1 animate-fade-in">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-extrabold backdrop-blur-md">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span>{t("event.eventLiveNow", "EVENT IS LIVE NOW — JOIN SESSIONS & EXPO")}</span>
              </div>
            </div>
          )}

          {timeLeft.status === "concluded" && (
            <div className="pt-2 pb-1 animate-fade-in">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-white/10 border border-white/15 text-slate-300 text-xs font-bold backdrop-blur-md">
                <span>{t("event.soldOut", "Event Concluded")}</span>
              </div>
            </div>
          )}

          {/* Primary Call to Action Buttons */}
          <div className="pt-4 flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={openRSVP}
              className="inline-flex items-center gap-2.5 px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-2xl font-bold text-sm shadow-xl shadow-blue-600/40 transition-all cursor-pointer group"
            >
              <CheckCircle2 size={18} className="group-hover:scale-110 transition-transform text-blue-200" />
              <span>{t("rsvp.publicRsvpNow", "RSVP Attendance")}</span>
              <ChevronRight size={16} />
            </button>

            <a
              href="#tickets"
              className="inline-flex items-center gap-2 px-6 py-4 bg-white/10 hover:bg-white/20 text-white rounded-2xl font-bold text-sm backdrop-blur-md border border-white/15 transition-all cursor-pointer"
            >
              <Ticket size={16} />
              <span>{t("event.registerNow", "View Passes")}</span>
            </a>
          </div>
        </div>
      </section>

      {/* ==================================================================== */}
      {/* 3. METRIC STATS STRIP                                                */}
      {/* ==================================================================== */}
      {/* ==================================================================== */}
      {/* 3. METRIC STATS STRIP                                                */}
      {/* ==================================================================== */}
      <section className="bg-white border-b border-slate-200 py-8">
        <div className="max-w-6xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          <div className="space-y-1">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900">{eventDetails?.capacity || 0}</span>
            <span className="text-xs text-slate-500 font-semibold block">Expected Delegates</span>
          </div>
          <div className="space-y-1">
            <span className="text-2xl sm:text-3xl font-extrabold text-blue-600">{eventSpeakers.length}</span>
            <span className="text-xs text-slate-500 font-semibold block">Keynote Speakers</span>
          </div>
          <div className="space-y-1">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900">{eventExhibitors.length}</span>
            <span className="text-xs text-slate-500 font-semibold block">Exhibitor Booths</span>
          </div>
          <div className="space-y-1">
            <span className="text-2xl sm:text-3xl font-extrabold text-blue-600">{eventSessions.length}</span>
            <span className="text-xs text-slate-500 font-semibold block">Curated Sessions</span>
          </div>
        </div>
      </section>

      {/* ==================================================================== */}
      {/* 4. ABOUT THE EVENT                                                   */}
      {/* ==================================================================== */}
      <section id="about" className="py-16 max-w-6xl mx-auto px-6 sm:px-8 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          <div className="lg:col-span-7 space-y-6 text-left">
            <div>
              <span className="text-xs font-extrabold text-blue-600 uppercase tracking-wider">Event Overview</span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
                About &ldquo;{title}&rdquo;
              </h2>
            </div>

            <p className="text-slate-600 text-sm sm:text-base leading-relaxed font-normal">
              {eventDetails?.description || "This premier summit gathers international executives, technical pioneers, and regulatory leaders for in-depth keynote presentations, exhibition showcases, and high-level networking sessions."}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1.5">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Users size={16} />
                </div>
                <h4 className="text-xs font-bold text-slate-900">Executive Networking</h4>
                <p className="text-[11px] text-slate-500">Connect with founders, investors, and enterprise decision-makers.</p>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1.5">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Layers size={16} />
                </div>
                <h4 className="text-xs font-bold text-slate-900">Interactive Floor Plan</h4>
                <p className="text-[11px] text-slate-500">Explore exhibitors, keynote stages, and VIP lounges in real-time 2D.</p>
              </div>
            </div>
          </div>

          {/* Organizer Card */}
          <div className="lg:col-span-5 bg-white border border-slate-200 rounded-3xl p-6 sm:p-7 shadow-xs space-y-5 text-left">
            <div className="flex items-center gap-3.5 pb-4 border-b border-slate-100">
              <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white font-extrabold text-lg flex items-center justify-center shadow-md shadow-blue-600/20">
                {organization.charAt(0)}
              </div>
              <div>
                <span className="text-[10px] font-extrabold text-blue-600 uppercase tracking-wider block">Presented By</span>
                <h4 className="text-sm font-bold text-slate-900">{organization}</h4>
                <span className="text-xs text-slate-400 font-medium">{hostName}</span>
              </div>
            </div>

            <div className="space-y-2.5 text-xs text-slate-600 font-medium">
              <div className="flex items-center gap-2">
                <ShieldCheck size={15} className="text-emerald-600 shrink-0" />
                <span>Officially Registered Organizer</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail size={15} className="text-blue-600 shrink-0" />
                <span>{eventDetails?.hostEmail || "organizer@eventzone.io"}</span>
              </div>
              <div className="flex items-center gap-2">
                <Globe size={15} className="text-blue-600 shrink-0" />
                <span>https://{eventDetails?.slug || "myevent"}.eventzone.io</span>
              </div>
            </div>

            <button
              onClick={() => openRegistration(eventTickets[0]?.name || eventTickets[0]?.tier || "Standard Admission")}
              className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              Contact Event Organizers
            </button>
          </div>
        </div>
      </section>

      {/* ==================================================================== */}
      {/* 5. FEATURED SPEAKERS & PRESENTERS                                     */}
      {/* ==================================================================== */}
      <section id="speakers" className="py-16 bg-white border-y border-slate-200">
        <div className="max-w-6xl mx-auto px-6 sm:px-8 space-y-10">
          <div className="text-center max-w-xl mx-auto space-y-2">
            <span className="text-xs font-extrabold text-blue-600 uppercase tracking-wider">Speaker Lineup</span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Featured Speakers &amp; Keynotes
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 font-normal">
              Learn directly from leaders steering innovations and market strategies.
            </p>
          </div>

          {eventSpeakers.length === 0 ? (
            <div className="text-center py-12 bg-slate-50 border border-slate-200/80 rounded-3xl text-slate-400 space-y-2 max-w-xl mx-auto">
              <Users size={32} className="mx-auto opacity-40 text-slate-400" />
              <p className="text-xs font-semibold">Keynote speakers will be announced soon.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {eventSpeakers.map((speaker, idx) => (
                <div 
                  key={idx} 
                  className="bg-slate-50 border border-slate-200/90 rounded-3xl p-5 text-center flex flex-col items-center justify-between space-y-4 hover:shadow-lg hover:border-blue-300 transition-all group"
                >
                  <div className="space-y-3">
                    <div className="w-24 h-24 rounded-full overflow-hidden mx-auto border-2 border-blue-500/30 group-hover:border-blue-600 transition-colors shadow-sm">
                      <img src={speaker.image} alt={speaker.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors">{speaker.name}</h4>
                      <span className="text-xs text-blue-600 font-semibold block">{speaker.role}</span>
                      {speaker.title && <span className="text-[11px] text-slate-500 block leading-tight mt-1">{speaker.title}</span>}
                    </div>
                  </div>

                  {speaker.company && (
                    <div className="pt-2 border-t border-slate-200/70 w-full">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider truncate block">
                        {speaker.company}
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ==================================================================== */}
      {/* 6. INTERACTIVE AGENDA & SCHEDULE SESSIONS                            */}
      {/* ==================================================================== */}
      <section id="schedule" className="py-16 max-w-6xl mx-auto px-6 sm:px-8 w-full space-y-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 text-left">
          <div>
            <span className="text-xs font-extrabold text-blue-600 uppercase tracking-wider">Event Schedule</span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
              Curated Agenda &amp; Sessions
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 font-normal">
              Explore keynote lectures, breakout technical panels, and networking tracks.
            </p>
          </div>

          {/* Day Filters */}
          {startDate && (
            <div className="flex items-center bg-white p-1 rounded-2xl border border-slate-200 shadow-xs">
              {["All", startDate, endDate].filter((v, i, a) => v && a.indexOf(v) === i).map((day, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedDay(day)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    selectedDay === day ? "bg-blue-600 text-white shadow-xs" : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  {day === "All" ? "All Days" : (idx === 1 ? "Day 1" : "Day 2")}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Sessions List */}
        <div className="space-y-4">
          {eventSessions.length === 0 ? (
            <div className="text-center py-12 bg-white border border-slate-200/80 rounded-3xl text-slate-400 space-y-2 max-w-xl mx-auto">
              <Calendar size={32} className="mx-auto opacity-40 text-slate-400" />
              <p className="text-xs font-semibold">Agenda schedule will be published soon by the organizers.</p>
            </div>
          ) : (
            eventSessions
              .filter(s => selectedDay === "All" || s.date === selectedDay)
              .map((session, idx) => {
                const isBookmarked = bookmarkedSessions.has(session.id);

                return (
                  <div
                    key={session.id || idx}
                    className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-7 shadow-xs hover:shadow-md transition-all flex flex-col md:flex-row md:items-center justify-between gap-6 text-left"
                  >
                    <div className="space-y-2 flex-1">
                      <div className="flex flex-wrap items-center gap-2.5">
                        <span className="px-3 py-1 rounded-xl bg-blue-50 text-blue-700 text-xs font-bold flex items-center gap-1.5">
                          <Clock size={13} />
                          <span>{session.startTime || "09:00"} — {session.endTime || "10:00"}</span>
                        </span>

                        {session.date && (
                          <span className="px-2.5 py-1 rounded-xl bg-slate-100 text-slate-600 text-xs font-semibold">
                            {session.date}
                          </span>
                        )}
                      </div>

                      <h3 className="text-base sm:text-lg font-bold text-slate-900">{session.title}</h3>
                      {session.description && (
                        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
                          {session.description}
                        </p>
                      )}

                      {/* Speakers Tags */}
                      {session.speakers && session.speakers.length > 0 && (
                        <div className="flex flex-wrap items-center gap-2 pt-2">
                          {session.speakers.map((sp, i) => (
                            <span key={i} className="px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200 text-slate-700 text-[11px] font-medium flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                              <span>{sp.name}</span>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="shrink-0 flex items-center gap-2">
                      <button
                        onClick={() => toggleBookmark(session.id)}
                        className={`px-4 py-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                          isBookmarked
                            ? "bg-blue-50 border-blue-300 text-blue-700"
                            : "border-slate-200 text-slate-600 hover:bg-slate-50"
                        }`}
                      >
                        <span>{isBookmarked ? "Saved to Agenda" : "Bookmark Session"}</span>
                      </button>
                    </div>
                  </div>
                );
              })
          )}
        </div>
      </section>

      {/* ==================================================================== */}
      {/* 7. INTERACTIVE 2D FLOOR PLAN BANNER SECTION                          */}
      {/* ==================================================================== */}
      <section id="floorplan" className="py-12 bg-blue-600 text-white relative overflow-hidden">
        <div className="max-w-6xl mx-auto px-6 sm:px-8 relative z-10 flex flex-col md:flex-row items-center justify-between gap-8 text-left">
          <div className="space-y-3 max-w-xl">
            <span className="px-3 py-1 rounded-full bg-white/20 text-white text-[10px] font-extrabold uppercase tracking-wider backdrop-blur-md">
              Venue Navigation
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Explore the Interactive 2D Floor Plan
            </h2>
            <p className="text-blue-100 text-xs sm:text-sm leading-relaxed font-normal">
              Locate exhibitor booths, keynote main stages, food zones, and sponsor suites before arriving at the venue.
            </p>
          </div>

          <button
            onClick={() => onViewFloorPlan && onViewFloorPlan(eventId || eventDetails?.id)}
            className="px-8 py-4 bg-white hover:bg-blue-50 text-blue-700 rounded-2xl font-extrabold text-xs sm:text-sm shadow-xl transition-all flex items-center gap-2.5 cursor-pointer shrink-0"
          >
            <Layers size={18} className="text-blue-600" />
            <span>Launch 2D Floor Plan</span>
            <ArrowRight size={16} />
          </button>
        </div>
      </section>

      {/* ==================================================================== */}
      {/* 8. EXHIBITORS SHOWCASE                                               */}
      {/* ==================================================================== */}
      {eventExhibitors.length > 0 && (
        <section id="exhibitors" className="py-16 bg-white border-b border-slate-200">
          <div className="max-w-6xl mx-auto px-6 sm:px-8 space-y-10">
            <div className="text-center max-w-xl mx-auto space-y-2">
              <span className="text-xs font-extrabold text-blue-600 uppercase tracking-wider">Industrial Partners</span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Featured Exhibitors &amp; Booths
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 font-normal">
                Discover industry vendors displaying breakthrough technology and product demonstrations.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {eventExhibitors.map((ex, idx) => (
                <div 
                  key={ex.id || idx}
                  className="bg-slate-50 border border-slate-200 rounded-3xl p-5 text-left flex flex-col justify-between space-y-4 hover:shadow-md hover:border-blue-300 transition-all"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="w-12 h-12 rounded-xl bg-white border border-slate-200 overflow-hidden p-1 flex items-center justify-center">
                        <img src={ex.logo || "https://images.unsplash.com/photo-1560179707-f14e90ef3623?auto=format&fit=crop&w=200&q=80"} alt={ex.name} className="w-full h-full object-contain" />
                      </div>
                      <span className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 text-[10px] font-extrabold uppercase">
                        {ex.booth || ex.boothNumber || "Booth"}
                      </span>
                    </div>

                    <div>
                      <h4 className="text-sm font-bold text-slate-900">{ex.name}</h4>
                      <span className="text-[11px] text-blue-600 font-semibold block">{ex.industry || "Industry Partner"}</span>
                      {ex.description && (
                        <p className="text-xs text-slate-500 line-clamp-2 mt-1.5 leading-relaxed">
                          {ex.description}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-xs text-slate-400">
                    <span>Exhibition Hall</span>
                    <span className="text-blue-600 font-bold">View Booth →</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ==================================================================== */}
      {/* 9. SPONSORS SHOWCASE                                                 */}
      {/* ==================================================================== */}
      {eventSponsors.length > 0 && (
        <section className="py-16 max-w-6xl mx-auto px-6 sm:px-8 w-full space-y-10">
          <div className="text-center max-w-xl mx-auto space-y-2">
            <span className="text-xs font-extrabold text-blue-600 uppercase tracking-wider">Corporate Backers</span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Official Event Sponsors
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 font-normal">
              Special thanks to the premier global institutions making this event possible.
            </p>
          </div>

          <div className="space-y-8">
            <div className="flex flex-wrap items-center justify-center gap-6">
              {eventSponsors.map((sp, idx) => (
                <div key={idx} className="bg-white border border-slate-200 rounded-2xl px-8 py-5 flex items-center gap-3 shadow-xs hover:shadow-md transition-all">
                  <Building2 size={24} className="text-blue-600" />
                  <div>
                    <span className="text-sm font-extrabold text-slate-900 block">{sp.name}</span>
                    <span className="text-[10px] uppercase font-bold text-slate-400">{sp.tier || "Partner"}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ==================================================================== */}
      {/* 10. TICKETS & REGISTRATION PASSES SECTION                            */}
      {/* ==================================================================== */}
      <section id="tickets" className="py-16 bg-white border-t border-slate-200">
        <div className="max-w-6xl mx-auto px-6 sm:px-8 space-y-12">
          <div className="text-center max-w-xl mx-auto space-y-2">
            <span className="text-xs font-extrabold text-blue-600 uppercase tracking-wider">Registration Passes</span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Claim Your Summit Pass
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 font-normal">
              Select your access tier and receive an instant digital QR badge.
            </p>
          </div>

          {eventTickets.length === 0 ? (
            <div className="text-center py-12 bg-slate-50 border border-slate-200 rounded-3xl text-slate-400 space-y-2 max-w-xl mx-auto">
              <Ticket size={32} className="mx-auto opacity-40 text-slate-400" />
              <p className="text-xs font-semibold">Registration ticket tiers will open soon.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {eventTickets.map((ticket, idx) => {
                const priceNum = typeof ticket.price === 'number' ? ticket.price : parseFloat(ticket.price) || 0;
                const isPop = Boolean(ticket.isPopular || ticket.popular);
                return (
                  <div
                    key={ticket.id || idx}
                    className={`rounded-3xl p-7 flex flex-col justify-between transition-all relative ${
                      isPop
                        ? "bg-white border-2 border-amber-500 shadow-2xl ring-4 ring-amber-500/10"
                        : "bg-slate-50 border border-slate-200 hover:border-slate-300 shadow-xs"
                    }`}
                  >
                    {isPop && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                        <span className="px-3.5 py-1 rounded-full bg-amber-500 text-white font-extrabold text-[10px] uppercase shadow-sm flex items-center gap-1">
                          ★ Most Popular
                        </span>
                      </div>
                    )}

                    <div className="space-y-5 text-left">
                      <div>
                        <h3 className="text-lg font-bold text-slate-900">{ticket.name || ticket.tier}</h3>
                        {ticket.description && <p className="text-xs text-slate-500 mt-1 leading-relaxed">{ticket.description}</p>}
                      </div>

                      <div className="flex items-baseline gap-1.5">
                        <span className="text-3xl font-black text-slate-900">{priceNum === 0 ? "Free" : `${priceNum.toLocaleString()} DZD`}</span>
                        {priceNum > 0 && <span className="text-xs text-slate-400 font-semibold">/ attendee</span>}
                      </div>

                      {ticket.features && ticket.features.length > 0 && (
                        <div className="space-y-2.5 pt-4 border-t border-slate-200/80">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">What&apos;s Included</span>
                          {ticket.features.map((feat, fIdx) => (
                            <div key={fIdx} className="flex items-start gap-2 text-xs text-slate-700 font-medium">
                              <Check size={14} className="text-emerald-600 shrink-0 mt-0.5" />
                              <span>{feat}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="pt-6 mt-6 border-t border-slate-200/80">
                      <button
                        onClick={() => openRegistration(ticket.name || ticket.tier)}
                        className={`w-full py-3.5 rounded-2xl font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer ${
                          isPop
                            ? "bg-amber-500 hover:bg-amber-600 text-white shadow-amber-500/30"
                            : "bg-slate-900 hover:bg-slate-800 text-white"
                        }`}
                      >
                        <Ticket size={15} />
                        <span>Select &amp; Register</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* ==================================================================== */}
      {/* 11. MODERN PREMIUM FOOTER                                            */}
      {/* ==================================================================== */}
      <footer className="bg-slate-950 text-slate-400 pt-16 pb-12 border-t border-slate-800 mt-auto font-sans">
        <div className="max-w-6xl mx-auto px-6 sm:px-8 space-y-12">
          {/* Top Row: Brand & Quick Newsletter */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pb-12 border-b border-slate-800/80 items-start">
            <div className="lg:col-span-6 space-y-4 text-left">
              <div className="flex items-center gap-3">
                <img src="https://i.imgur.com/jFDrQbM.png" alt="eventzone" style={{ height: '28px', width: 'auto', maxWidth: '160px', objectFit: 'contain' }} className="h-7 w-auto object-contain brightness-0 invert" />
                <span className="px-2.5 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-[10px] font-extrabold uppercase tracking-wider">
                  Official Event Portal
                </span>
              </div>
              <p className="text-xs text-slate-400 max-w-md leading-relaxed">
                {tagline}
              </p>
              <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                <ShieldCheck size={14} className="text-emerald-500" />
                <span>Verified by Eventzone Decentralized Verification Infrastructure</span>
              </div>
            </div>

            {/* Quick Stats Banner on Footer */}
            <div className="lg:col-span-6 bg-slate-900/80 rounded-2xl border border-slate-800 p-5 flex items-center justify-between gap-4">
              <div>
                <div className="text-xs font-bold text-white">Need Customized Delegation Passes?</div>
                <div className="text-[11px] text-slate-400 mt-0.5">Corporate bundles and VIP passes with dedicated registration desks.</div>
              </div>
              <button
                onClick={() => openRegistration("VIP Access Pass")}
                className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shrink-0 transition-colors cursor-pointer"
              >
                Inquire
              </button>
            </div>
          </div>

          {/* Bottom Grid: Navigation Links */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-xs text-left">
            <div className="space-y-3">
              <h4 className="text-xs font-extrabold text-white uppercase tracking-wider">Navigation</h4>
              <ul className="space-y-2 text-slate-400">
                <li><a href="#about" className="hover:text-white transition-colors">About &amp; Overview</a></li>
                <li><a href="#speakers" className="hover:text-white transition-colors">Keynote Speakers</a></li>
                <li><a href="#schedule" className="hover:text-white transition-colors">Agenda &amp; Sessions</a></li>
                <li><a href="#floorplan" className="hover:text-white transition-colors">Interactive Floor Plan</a></li>
                <li><a href="#tickets" className="hover:text-white transition-colors">Passes &amp; Pricing</a></li>
              </ul>
            </div>

            <div className="space-y-3">
              <h4 className="text-xs font-extrabold text-white uppercase tracking-wider">Partners &amp; Expo</h4>
              <ul className="space-y-2 text-slate-400">
                <li><a href="#exhibitors" className="hover:text-white transition-colors">Exhibitor Directory</a></li>
                <li><a href="#exhibitors" className="hover:text-white transition-colors">Booth Locations</a></li>
                <li><a href="#sponsors" className="hover:text-white transition-colors">Diamond &amp; Gold Sponsors</a></li>
                <li><button onClick={() => openRegistration("VIP Access Pass")} className="hover:text-white transition-colors text-left cursor-pointer">Become a Sponsor</button></li>
                <li><button onClick={() => openRegistration("Standard Admission")} className="hover:text-white transition-colors text-left cursor-pointer">Exhibitor Inquiries</button></li>
              </ul>
            </div>

            <div className="space-y-3">
              <h4 className="text-xs font-extrabold text-white uppercase tracking-wider">Platform Features</h4>
              <ul className="space-y-2 text-slate-400">
                <li><button onClick={onBackToHome} className="hover:text-white transition-colors text-left cursor-pointer">Explore All Summits</button></li>
                <li><span className="text-slate-500">2D Drag-and-Drop Floor Plan</span></li>
                <li><span className="text-slate-500">Instant QR Badge Generation</span></li>
                <li><span className="text-slate-500">Real-Time Attendee Analytics</span></li>
                <li><span className="text-slate-500">Broadcast Live Streaming</span></li>
              </ul>
            </div>

            <div className="space-y-3">
              <h4 className="text-xs font-extrabold text-white uppercase tracking-wider">Support &amp; Trust</h4>
              <ul className="space-y-2 text-slate-400">
                <li><span className="text-slate-300">Host: {organization}</span></li>
                <li><span className="text-slate-300">Contact: {eventDetails?.hostEmail || "support@eventzone.io"}</span></li>
                <li><span className="text-slate-500">Privacy &amp; Data Rights</span></li>
                <li><span className="text-slate-500">Terms of Attendance</span></li>
                <li><span className="text-slate-500">Delegate Support 24/7</span></li>
              </ul>
            </div>
          </div>

          {/* Bottom Row: Copyright, Legal & Back to Top */}
          <div className="pt-8 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
            <div className="flex flex-wrap items-center gap-4 text-slate-500">
              <span>© 2026 {title}. Powered by <strong className="text-slate-400">Eventzone SaaS Platform</strong>.</span>
            </div>

            <button
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition-all flex items-center gap-1.5 font-bold cursor-pointer"
            >
              <span>Back to Top</span>
              <ArrowUp size={14} />
            </button>
          </div>
        </div>
      </footer>

      {/* ==================================================================== */}
      {/* 12. FULL-PAGE REGISTRATION VIEW (WHITE BG, FORM LEFT, A6 BADGE RIGHT) */}
      {/* ==================================================================== */}
      {showRsvpModal && (
        <div className="fixed inset-0 z-[200] bg-slate-50 overflow-y-auto flex flex-col font-sans selection:bg-blue-600 selection:text-white">
          {/* Top Bar Header with Back button and Language Switcher */}
          <header className="bg-white border-b border-slate-200/80 px-6 py-3.5 sticky top-0 z-30 flex items-center justify-between shadow-2xs">
            <button
              type="button"
              onClick={closeRegistration}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all cursor-pointer shadow-2xs"
            >
              <ArrowLeft size={14} />
              <span>{t("event.backToEvent", "Back to Event")}</span>
            </button>

            {/* Language Selector in Registration View */}
            <div className="relative">
              {(() => {
                const curLang = languages.find(l => l.code === lang) || languages[0];
                return (
                  <button
                    onClick={() => setLangMenuOpen(o => !o)}
                    className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all cursor-pointer shadow-xs"
                    title="Change Language"
                  >
                    {curLang?.icon ? (
                      <img src={curLang.icon} alt={lang} className="w-5 h-5 object-contain shrink-0" />
                    ) : (
                      <Globe size={13} className="text-slate-500" />
                    )}
                    <span className="uppercase tracking-wide font-extrabold text-[11px]">{lang}</span>
                    <ChevronDown size={11} className={`text-slate-400 transition-transform ${langMenuOpen ? "rotate-180" : ""}`} />
                  </button>
                );
              })()}

              {langMenuOpen && (
                <div className="absolute top-full right-0 mt-1.5 w-36 bg-white border border-slate-200 rounded-xl shadow-xl p-1 z-50 animate-scale-up space-y-0.5">
                  {languages.map(item => (
                    <button
                      key={item.code}
                      onClick={() => {
                        setLang(item.code);
                        setLangMenuOpen(false);
                      }}
                      className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer ${
                        lang === item.code 
                          ? "bg-blue-50 text-blue-600 font-bold" 
                          : "text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <img src={item.icon} alt={item.code} className="w-5 h-5 object-contain shrink-0" />
                        <span>{item.label}</span>
                      </div>
                      {lang === item.code && <Check size={12} className="text-blue-600 shrink-0" />}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </header>

          {/* Main Registration Layout */}
          <main className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 py-6 sm:py-8">
            {rsvpSuccess ? (
              /* ============================================================ */
              /* SUCCESS STATE: OFFICIAL BADGE ISSUED OR PENDING REVIEW       */
              /* ============================================================ */
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                {/* LEFT COLUMN: Confirmation Message & Action Suite */}
                <div className="lg:col-span-7 bg-white border border-slate-200 rounded-3xl p-6 sm:p-10 shadow-xs text-left space-y-6">
                  {rsvpSuccess.status === "pending" ? (
                    <div className="space-y-2">
                      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-xs font-extrabold">
                        <Clock size={15} />
                        <span>Application Under Review</span>
                      </div>
                      <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                        Registration Submitted for Approval
                      </h2>
                      <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                        Your registration for <strong>{selectedTier}</strong> has been received and is currently in the organizer review queue for <strong>{title}</strong>. You will be notified via email once the organizer accepts your application.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-extrabold">
                        <CheckCircle2 size={15} />
                        <span>Registration Confirmed</span>
                      </div>
                      <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                        Your Official Pass is Ready!
                      </h2>
                      <p className="text-xs sm:text-sm text-slate-600">
                        Your digital conference pass has been generated and activated for <strong>{title}</strong>. Your credential badge with entrance QR code is shown on the right.
                      </p>
                    </div>
                  )}

                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2.5 text-xs">
                    <div className="flex justify-between py-1 border-b border-slate-200/60">
                      <span className="text-slate-500 font-medium">Attendee Name</span>
                      <span className="font-bold text-slate-900">{rsvpName}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-200/60">
                      <span className="text-slate-500 font-medium">Registered Email</span>
                      <span className="font-bold text-slate-900">{rsvpEmail}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-200/60">
                      <span className="text-slate-500 font-medium">Pass Tier</span>
                      <span className="font-bold text-blue-600">{selectedTier}</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-slate-500 font-medium">Digital Badge ID</span>
                      <span className="font-mono font-bold text-emerald-700">{rsvpSuccess.badgeCode || "EZ-2026"}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        if (typeof window !== "undefined") window.print();
                      }}
                      className="py-3.5 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs"
                    >
                      <Printer size={15} />
                      <span>Print / Save Badge PDF</span>
                    </button>

                    {qrCodeUrl && (
                      <a
                        href={qrCodeUrl}
                        download={`${(rsvpName || 'event').replace(/\s+/g, '_')}_qr_pass.png`}
                        className="py-3.5 px-4 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-2xs"
                      >
                        <Download size={15} />
                        <span>Download QR Code</span>
                      </a>
                    )}
                  </div>

                  <div className="pt-2 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={closeRegistration}
                      className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold text-xs shadow-md shadow-blue-600/20 transition-all cursor-pointer text-center"
                    >
                      Done &amp; Return to Event Page
                    </button>
                  </div>
                </div>

                {/* RIGHT COLUMN: The Issued A6 Conference Badge */}
                <div className="lg:col-span-5 flex flex-col items-center sticky top-24">
                  <div className="w-16 h-3.5 bg-slate-300 rounded-full mx-auto border-2 border-slate-400 shadow-inner flex items-center justify-center -mb-2 z-10 relative">
                    <div className="w-10 h-1.5 bg-slate-800 rounded-full" />
                  </div>

                  {/* A6 Proportions Badge Card */}
                  <div className="w-full max-w-[340px] sm:max-w-[360px] bg-white rounded-3xl border-2 border-emerald-500 shadow-2xl overflow-hidden flex flex-col relative ring-8 ring-emerald-500/10">
                    {/* Header Banner */}
                    <div className="relative h-28 w-full overflow-hidden bg-slate-950 flex flex-col justify-between p-4">
                      <img src={banner} alt="Cover" className="absolute inset-0 w-full h-full object-cover opacity-60" />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent" />
                      <div className="relative z-10 flex items-center justify-between">
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-white/20 text-white uppercase backdrop-blur-xs">
                          {category}
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-emerald-500 text-white uppercase flex items-center gap-1 shadow-xs">
                          <CheckCircle2 size={10} />
                          <span>CONFIRMED PASS</span>
                        </span>
                      </div>
                      <div className="relative z-10">
                        <h4 className="text-xs font-black text-white line-clamp-1">{title}</h4>
                      </div>
                    </div>

                    {/* Tier Ribbon */}
                    <div className={`py-1.5 px-4 text-center text-xs font-black uppercase tracking-wider ${
                      selectedTier.toLowerCase().includes("vip")
                        ? "bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-500 text-slate-950"
                        : selectedTier.toLowerCase().includes("online")
                        ? "bg-gradient-to-r from-purple-600 to-indigo-700 text-white"
                        : "bg-gradient-to-r from-blue-600 to-indigo-700 text-white"
                    }`}>
                      {selectedTier}
                    </div>

                    {/* Badge Body */}
                    <div className="p-6 pt-2 text-center flex-1 flex flex-col items-center">
                      <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-700 text-white flex items-center justify-center text-2xl font-black shadow-lg mx-auto border-4 border-white -mt-10 mb-2">
                        {(rsvpName.trim() || "HM").split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase() || "AM"}
                      </div>

                      <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight uppercase break-words px-2 leading-tight">
                        {rsvpName}
                      </h2>

                      {rsvpJobTitle && (
                        <p className="text-xs font-extrabold text-blue-600 uppercase tracking-wide mt-1">
                          {rsvpJobTitle}
                        </p>
                      )}

                      <p className="text-xs font-bold text-slate-700 mt-0.5">
                        {rsvpCompany || organization}
                      </p>

                      <p className="text-[11px] text-slate-400 font-mono mt-0.5 truncate max-w-xs">
                        {rsvpEmail}
                      </p>

                      {/* Official QR Code Box */}
                      <div className="w-full bg-slate-50 rounded-2xl border border-slate-200 p-3 mt-4 flex items-center justify-between gap-3">
                        {qrCodeUrl ? (
                          <div className="w-20 h-20 bg-white p-1 rounded-xl border border-slate-200 shadow-2xs shrink-0 flex items-center justify-center">
                            <img src={qrCodeUrl} alt="QR Code" className="w-full h-full object-contain" />
                          </div>
                        ) : (
                          <div className="w-20 h-20 bg-slate-200 rounded-xl animate-pulse shrink-0" />
                        )}

                        <div className="text-left flex-1 space-y-1">
                          <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase">
                            <ShieldCheck size={11} />
                            <span>VERIFIED AT DOOR</span>
                          </div>
                          <div className="text-[10px] text-slate-500 font-mono font-bold">
                            CODE: <span className="text-slate-900 font-extrabold">{rsvpSuccess.badgeCode || "EZ-PASS"}</span>
                          </div>
                          <div className="text-[9px] text-slate-400">
                            Present QR upon check-in
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Badge Footer */}
                    <div className="px-4 py-2.5 bg-slate-900 text-white flex items-center justify-between text-[10px] font-semibold">
                      <span>{startDate}</span>
                      <span className="truncate max-w-[160px] text-slate-400">{location.split(',')[0]}</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* ============================================================ */
              /* REGISTRATION IN PROGRESS: CLEAN FORM LEFT, A6 BADGE RIGHT    */
              /* ============================================================ */
              <div>
                <div className="mb-6 space-y-1.5 text-left">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-xs font-extrabold uppercase tracking-wider">
                    <Sparkles size={13} />
                    <span>{t("reg.passGenBadge", "Attendee Pass & Credential Generator")}</span>
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                    {t("reg.title", "Event Registration")}
                  </h1>
                  <p className="text-xs sm:text-sm text-slate-500 font-medium max-w-xl">
                    {t("reg.subtitle", "Fill in your attendee credentials on the left. Your official A6 conference badge updates in real-time on the right.")}
                  </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                  {/* ======================================================== */}
                  {/* LEFT COLUMN: CLEAN MODERN FORM                           */}
                  {/* ======================================================== */}
                  <div className="lg:col-span-7 bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-7 shadow-xs text-left">
                    <form onSubmit={handleRsvpSubmit} className="space-y-5">
                      {/* 1. TICKET PASS TIER SELECTION */}
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-2.5">
                          {t("reg.selectPassTier", "1. Select Your Pass Tier")}
                        </label>

                        {eventTickets.length > 0 ? (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {eventTickets.map((t, idx) => {
                              const tierName = t.name || t.tier || "General Admission";
                              const isSelected = selectedTier === tierName || selectedTier === t.id;
                              const price = parseFloat(t.price) || 0;
                              return (
                                <div
                                  key={idx}
                                  onClick={() => switchTicketTier(tierName)}
                                  className={`p-3.5 rounded-2xl border-2 cursor-pointer transition-all ${
                                    isSelected
                                      ? "border-blue-600 bg-blue-50/50 ring-4 ring-blue-100 shadow-2xs"
                                      : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                                  }`}
                                >
                                  <div className="flex items-center justify-between">
                                    <span className="text-xs font-extrabold text-slate-900">{tierName}</span>
                                    <span className="text-xs font-black text-blue-600">
                                      {price === 0 ? "Free" : `$${price}`}
                                    </span>
                                  </div>
                                  <p className="text-[11px] text-slate-500 mt-1 line-clamp-1">
                                    {t.description || "Full access to keynotes, sessions & networking hall"}
                                  </p>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {["Standard Admission", "VIP Access Pass"].map((tierName) => {
                              const isSelected = selectedTier === tierName;
                              return (
                                <div
                                  key={tierName}
                                  onClick={() => switchTicketTier(tierName)}
                                  className={`p-3.5 rounded-2xl border-2 cursor-pointer transition-all ${
                                    isSelected
                                      ? "border-blue-600 bg-blue-50/50 ring-4 ring-blue-100 shadow-2xs"
                                      : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                                  }`}
                                >
                                  <div className="flex items-center justify-between">
                                    <span className="text-xs font-extrabold text-slate-900">{tierName}</span>
                                    <span className="text-xs font-black text-blue-600">Free</span>
                                  </div>
                                  <p className="text-[11px] text-slate-500 mt-1">
                                    {tierName.includes("VIP") ? "Includes executive lounge & priority front seating" : "Standard delegate floor badge"}
                                  </p>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      {/* 2. ATTENDEE CREDENTIALS */}
                      <div className="space-y-4 pt-2 border-t border-slate-100">
                        <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                          {t("reg.badgeCredentials", "2. Attendee Badge Credentials")}
                        </label>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 mb-1">
                            {t("reg.fullName", "Your Full Name")} <span className="text-rose-500">*</span>
                          </label>
                          <input
                            type="text"
                            required
                            value={rsvpName}
                            onChange={(e) => setRsvpName(e.target.value)}
                            placeholder="e.g. Sarah Jenkins"
                            className="w-full px-3.5 py-3 bg-slate-50 border border-slate-200 focus:border-blue-600 focus:bg-white rounded-xl text-xs font-semibold text-slate-900 outline-none transition-all"
                          />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 mb-1">
                              {t("reg.email", "Your Email Address")} <span className="text-rose-500">*</span>
                            </label>
                            <input
                              type="email"
                              required
                              value={rsvpEmail}
                              onChange={(e) => setRsvpEmail(e.target.value)}
                              placeholder="e.g. alex@company.com"
                              className="w-full px-3.5 py-3 bg-slate-50 border border-slate-200 focus:border-blue-600 focus:bg-white rounded-xl text-xs font-semibold text-slate-900 outline-none transition-all"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 mb-1">
                              {t("reg.phone", "Phone Number")} <span className="text-rose-500">*</span>
                            </label>
                            <CountryPhoneInput
                              value={rsvpPhone}
                              onChange={setRsvpPhone}
                              required
                              inputClassName="py-3"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 mb-1">
                              {t("reg.organization", "Company / Organization")}
                            </label>
                            <input
                              type="text"
                              value={rsvpCompany}
                              onChange={(e) => setRsvpCompany(e.target.value)}
                              placeholder="e.g. Sonatrach, Microsoft..."
                              className="w-full px-3.5 py-3 bg-slate-50 border border-slate-200 focus:border-blue-600 focus:bg-white rounded-xl text-xs font-semibold text-slate-900 outline-none transition-all"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 mb-1">
                              {t("reg.jobTitle", "Job Title / Role")}
                            </label>
                            <input
                              type="text"
                              value={rsvpJobTitle}
                              onChange={(e) => setRsvpJobTitle(e.target.value)}
                              placeholder="e.g. Chief Innovation Officer"
                              className="w-full px-3.5 py-3 bg-slate-50 border border-slate-200 focus:border-blue-600 focus:bg-white rounded-xl text-xs font-semibold text-slate-900 outline-none transition-all"
                            />
                          </div>
                        </div>
                      </div>

                      {/* 3. DYNAMIC CUSTOM REGISTRATION QUESTIONS (IF CONFIGURED) */}
                      {activeTicketForm && activeTicketForm.fields && activeTicketForm.fields.length > 0 && (
                        <div className="border-t border-slate-100 pt-4 space-y-3">
                          <div className="text-[11px] font-bold uppercase text-blue-600 tracking-wider">
                            {t("reg.additionalQuestions", "3. Additional Registration Questions")}
                          </div>

                          {activeTicketForm.fields
                            .filter(f => !["f_core_name", "f_core_email", "f_core_phone"].includes(f.id))
                            .map(field => {
                            if (field.type === "section") {
                              return (
                                <div key={field.id} className="pt-2">
                                  <div className="text-xs font-bold text-slate-800">{field.label}</div>
                                  {field.helpText && <div className="text-[10px] text-slate-400">{field.helpText}</div>}
                                </div>
                              );
                            }

                            return (
                              <div key={field.id}>
                                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                                  {field.label} {field.required && <span className="text-rose-500">*</span>}
                                </label>

                                {(field.type === "phone" || field.id === "f_core_phone") && (
                                  <CountryPhoneInput
                                    value={customAnswers[field.id] || ""}
                                    onChange={(val) => setCustomAnswers(prev => ({ ...prev, [field.id]: val }))}
                                    placeholder={field.placeholder || ""}
                                    required={field.required}
                                  />
                                )}

                                {field.type === "country" && (
                                  <CountrySelect
                                    value={customAnswers[field.id] || ""}
                                    onChange={(val) => setCustomAnswers(prev => ({ ...prev, [field.id]: val }))}
                                    placeholder={field.placeholder || "Select your country..."}
                                    required={field.required}
                                  />
                                )}

                                {field.type === "city" && (
                                  <CitySelect
                                    value={customAnswers[field.id] || ""}
                                    country={
                                      customAnswers["f_country"] || 
                                      customAnswers["country"] || 
                                      Object.entries(customAnswers).find(([k]) => k.toLowerCase().includes("country"))?.[1] || 
                                      ""
                                    }
                                    onChange={(val) => setCustomAnswers(prev => ({ ...prev, [field.id]: val }))}
                                    placeholder={field.placeholder || "Select or enter your city..."}
                                    required={field.required}
                                  />
                                )}

                                {field.type === "picture" && (
                                  <FormImageUploader
                                    value={customAnswers[field.id] || ""}
                                    onChange={(val) => setCustomAnswers(prev => ({ ...prev, [field.id]: val }))}
                                    placeholder={field.placeholder || "Upload your photo from phone or computer"}
                                    required={field.required}
                                  />
                                )}

                                {["text", "email", "number"].includes(field.type) && field.id !== "f_core_phone" && (
                                  <input
                                    type={field.type}
                                    required={field.required}
                                    value={customAnswers[field.id] || ""}
                                    onChange={(e) => setCustomAnswers(prev => ({ ...prev, [field.id]: e.target.value }))}
                                    placeholder={field.placeholder || "Enter details..."}
                                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 focus:border-blue-600 focus:bg-white rounded-xl text-xs font-semibold text-slate-900 outline-none transition-all"
                                  />
                                )}

                                {field.type === "textarea" && (
                                  <textarea
                                    required={field.required}
                                    rows={2}
                                    value={customAnswers[field.id] || ""}
                                    onChange={(e) => setCustomAnswers(prev => ({ ...prev, [field.id]: e.target.value }))}
                                    placeholder={field.placeholder || "Enter details..."}
                                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 focus:border-blue-600 focus:bg-white rounded-xl text-xs font-medium text-slate-900 outline-none transition-all"
                                  />
                                )}

                                {field.type === "select" && (
                                  <select
                                    required={field.required}
                                    value={customAnswers[field.id] || ""}
                                    onChange={(e) => setCustomAnswers(prev => ({ ...prev, [field.id]: e.target.value }))}
                                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 focus:border-blue-600 rounded-xl text-xs font-semibold text-slate-900 outline-none cursor-pointer"
                                  >
                                    <option value="">Select option...</option>
                                    {(field.options || []).map((opt, i) => (
                                      <option key={i} value={opt}>{opt}</option>
                                    ))}
                                  </select>
                                )}

                                {field.type === "radio" && (
                                  <div className="flex flex-col gap-1.5 mt-1">
                                    {(field.options || []).map((opt, i) => (
                                      <label key={i} className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                                        <input
                                          type="radio"
                                          name={field.id}
                                          required={field.required}
                                          checked={customAnswers[field.id] === opt}
                                          onChange={() => setCustomAnswers(prev => ({ ...prev, [field.id]: opt }))}
                                          className="text-blue-600 focus:ring-blue-500 h-3.5 w-3.5"
                                        />
                                        <span>{opt}</span>
                                      </label>
                                    ))}
                                  </div>
                                )}

                                {field.type === "checkbox" && (
                                  <div className="flex flex-col gap-1.5 mt-1">
                                    {(field.options || []).map((opt, i) => {
                                      const currentList = Array.isArray(customAnswers[field.id]) ? customAnswers[field.id] : [];
                                      const isChecked = currentList.includes(opt);
                                      return (
                                        <label key={i} className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                                          <input
                                            type="checkbox"
                                            checked={isChecked}
                                            onChange={(e) => {
                                              const updated = e.target.checked
                                                ? [...currentList, opt]
                                                : currentList.filter(x => x !== opt);
                                              setCustomAnswers(prev => ({ ...prev, [field.id]: updated }));
                                            }}
                                            className="text-blue-600 focus:ring-blue-500 rounded h-3.5 w-3.5"
                                          />
                                          <span>{opt}</span>
                                        </label>
                                      );
                                    })}
                                  </div>
                                )}

                                {field.type === "switch" && (
                                  <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer mt-1">
                                    <input
                                      type="checkbox"
                                      checked={customAnswers[field.id] ?? field.defaultValue ?? false}
                                      onChange={(e) => setCustomAnswers(prev => ({ ...prev, [field.id]: e.target.checked }))}
                                      className="rounded text-blue-600 focus:ring-blue-500 h-4 w-4"
                                    />
                                    <span>{field.helpText || "Yes, opt-in"}</span>
                                  </label>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* SUBMIT BUTTON */}
                      <div className="pt-4 border-t border-slate-100">
                        <button
                          type="submit"
                          disabled={rsvpLoading}
                          className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-extrabold text-xs sm:text-sm shadow-lg shadow-blue-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                        >
                          {rsvpLoading ? (
                            <>
                              <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                              <span>{t("reg.processing", "Generating Official Badge...")}</span>
                            </>
                          ) : (
                            <>
                              <span>{t("reg.completeRegistration", "Confirm Registration & Generate Badge")}</span>
                              <Sparkles size={16} />
                            </>
                          )}
                        </button>
                        <p className="text-center text-[11px] text-slate-400 mt-2 font-medium">
                          🔒 Instant verified access • Digital pass delivered immediately
                        </p>
                      </div>
                    </form>
                  </div>

                  {/* ======================================================== */}
                  {/* RIGHT COLUMN: REALISTIC A6 CONFERENCE BADGE              */}
                  {/* ======================================================== */}
                  <div className="lg:col-span-5 flex flex-col items-center sticky top-24">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 -ml-4.5" />
                      <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-600">
                        Live A6 Badge Preview (Real-time)
                      </span>
                    </div>

                    {/* Physical Lanyard Clip Slot */}
                    <div className="w-16 h-3.5 bg-slate-300 rounded-full mx-auto border-2 border-slate-400 shadow-inner flex items-center justify-center -mb-2 z-10 relative">
                      <div className="w-10 h-1.5 bg-slate-800 rounded-full" />
                    </div>

                    {/* Standard A6 Badge Container (105mm x 148mm ratio) */}
                    <div className="w-full max-w-[340px] sm:max-w-[360px] bg-white rounded-3xl border-2 border-slate-200 shadow-xl overflow-hidden flex flex-col relative transition-all duration-300 hover:shadow-2xl">
                      {/* Top Header with Event Cover Graphic */}
                      <div className="relative h-28 w-full overflow-hidden bg-slate-950 flex flex-col justify-between p-4">
                        <img src={banner} alt="Cover" className="absolute inset-0 w-full h-full object-cover opacity-60" />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent" />
                        <div className="relative z-10 flex items-center justify-between">
                          <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black bg-white/20 text-white uppercase backdrop-blur-xs">
                            {category}
                          </span>
                          <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black bg-blue-600 text-white uppercase shadow-xs">
                            {type}
                          </span>
                        </div>
                        <div className="relative z-10">
                          <h4 className="text-xs font-black text-white line-clamp-1">{title}</h4>
                        </div>
                      </div>

                      {/* Tier Ribbon */}
                      <div className={`py-1.5 px-4 text-center text-xs font-black uppercase tracking-wider transition-all duration-300 ${
                        selectedTier.toLowerCase().includes("vip")
                          ? "bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-500 text-slate-950"
                          : selectedTier.toLowerCase().includes("online")
                          ? "bg-gradient-to-r from-purple-600 to-indigo-700 text-white"
                          : "bg-gradient-to-r from-blue-600 to-indigo-700 text-white"
                      }`}>
                        {selectedTier}
                      </div>

                      {/* Badge Body */}
                      <div className="p-6 pt-2 text-center flex-1 flex flex-col items-center">
                        <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-700 text-white flex items-center justify-center text-2xl font-black shadow-lg mx-auto border-4 border-white -mt-10 mb-2 transition-transform duration-200">
                          {(rsvpName.trim() || "HM").split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase() || "AM"}
                        </div>

                        <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight uppercase break-words px-2 leading-tight min-h-[28px]">
                          {rsvpName.trim() || "YOUR FULL NAME"}
                        </h2>

                        <p className="text-xs font-extrabold text-blue-600 uppercase tracking-wide mt-1 min-h-[16px]">
                          {rsvpJobTitle.trim() || "DELEGATE / ATTENDEE"}
                        </p>

                        <p className="text-xs font-bold text-slate-700 mt-0.5 min-h-[16px]">
                          {rsvpCompany.trim() || organization}
                        </p>

                        <p className="text-[11px] text-slate-400 font-mono mt-0.5 truncate max-w-xs">
                          {rsvpEmail.trim() || "attendee@email.com"}
                        </p>

                        {/* Simulated QR Code / Hologram Strip */}
                        <div className="w-full bg-slate-50 rounded-2xl border border-slate-200 p-3 mt-4 flex items-center justify-between gap-3">
                          <div className="w-16 h-16 bg-white p-1 rounded-xl border border-slate-200 shadow-2xs shrink-0 flex items-center justify-center relative overflow-hidden">
                            <div className="grid grid-cols-4 gap-1 w-full h-full p-1 opacity-80">
                              <div className="bg-slate-900 rounded-xs" />
                              <div className="bg-slate-900 rounded-xs" />
                              <div className="bg-slate-200 rounded-xs" />
                              <div className="bg-slate-900 rounded-xs" />
                              <div className="bg-slate-900 rounded-xs" />
                              <div className="bg-blue-600 rounded-xs" />
                              <div className="bg-slate-900 rounded-xs" />
                              <div className="bg-slate-200 rounded-xs" />
                              <div className="bg-slate-200 rounded-xs" />
                              <div className="bg-slate-900 rounded-xs" />
                              <div className="bg-blue-600 rounded-xs" />
                              <div className="bg-slate-900 rounded-xs" />
                              <div className="bg-slate-900 rounded-xs" />
                              <div className="bg-slate-200 rounded-xs" />
                              <div className="bg-slate-900 rounded-xs" />
                              <div className="bg-slate-900 rounded-xs" />
                            </div>
                          </div>

                          <div className="text-left flex-1 space-y-1">
                            <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase">
                              <ShieldCheck size={11} />
                              <span>LIVE CREDENTIAL</span>
                            </div>
                            <div className="text-[10px] text-slate-500 font-mono font-bold">
                              PASS ID: <span className="text-slate-900 font-extrabold">EZ-2026-LIVE</span>
                            </div>
                            <div className="text-[9px] text-slate-400">
                              QR activates upon confirmation
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Badge Footer */}
                      <div className="px-4 py-2.5 bg-slate-900 text-white flex items-center justify-between text-[10px] font-semibold">
                        <span>{startDate}</span>
                        <span className="truncate max-w-[160px] text-slate-400">{location.split(',')[0]}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </main>
        </div>
      )}

      {/* Standalone Event Feedback & CSAT Survey Modal */}
      {showFeedbackModal && activeFeedbackForm && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-slate-200 rounded-3xl p-7 max-w-lg w-full shadow-2xl flex flex-col gap-5 animate-scale-up max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Star size={16} className="text-amber-500 fill-amber-500" />
                  <span>{activeFeedbackForm.title}</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">{title}</p>
              </div>
              <button
                onClick={() => setShowFeedbackModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X size={16} />
              </button>
            </div>

            {feedbackSuccess ? (
              <div className="py-8 text-center flex flex-col items-center gap-3 animate-scale-up">
                <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                  <Check size={24} />
                </div>
                <h4 className="text-sm font-bold text-slate-900">Thank You for Your Feedback!</h4>
                <p className="text-xs text-slate-500 max-w-xs">
                  {activeFeedbackForm.settings?.successMessage || "Your response has been saved and helps us elevate future editions."}
                </p>
                <button
                  onClick={() => setShowFeedbackModal(false)}
                  className="mt-3 px-5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold"
                >
                  Close Window
                </button>
              </div>
            ) : (
              <form onSubmit={handleFeedbackSubmit} className="space-y-4 text-left">
                {activeFeedbackForm.fields.map(field => {
                  if (field.type === "section") {
                    return (
                      <div key={field.id} className="pt-2 border-t border-slate-100">
                        <div className="text-xs font-bold text-slate-800">{field.label}</div>
                      </div>
                    );
                  }

                  return (
                    <div key={field.id} className="space-y-1">
                      <label className="block text-xs font-bold text-slate-800">
                        {field.label} {field.required && <span className="text-rose-500">*</span>}
                      </label>
                      {field.helpText && <p className="text-[11px] text-slate-400">{field.helpText}</p>}

                      {(field.type === "phone" || field.id === "f_core_phone") && (
                        <CountryPhoneInput
                          value={feedbackAnswers[field.id] || ""}
                          onChange={(val) => setFeedbackAnswers(prev => ({ ...prev, [field.id]: val }))}
                          placeholder={field.placeholder || ""}
                          required={field.required}
                        />
                      )}

                      {field.type === "country" && (
                        <CountrySelect
                          value={feedbackAnswers[field.id] || ""}
                          onChange={(val) => setFeedbackAnswers(prev => ({ ...prev, [field.id]: val }))}
                          placeholder={field.placeholder || "Select your country..."}
                          required={field.required}
                        />
                      )}

                      {field.type === "city" && (
                        <CitySelect
                          value={feedbackAnswers[field.id] || ""}
                          country={
                            feedbackAnswers["f_country"] || 
                            feedbackAnswers["country"] || 
                            Object.entries(feedbackAnswers).find(([k]) => k.toLowerCase().includes("country"))?.[1] || 
                            ""
                          }
                          onChange={(val) => setFeedbackAnswers(prev => ({ ...prev, [field.id]: val }))}
                          placeholder={field.placeholder || "Select or enter your city..."}
                          required={field.required}
                        />
                      )}

                      {field.type === "picture" && (
                        <FormImageUploader
                          value={feedbackAnswers[field.id] || ""}
                          onChange={(val) => setFeedbackAnswers(prev => ({ ...prev, [field.id]: val }))}
                          placeholder={field.placeholder || "Upload your photo from phone or computer"}
                          required={field.required}
                        />
                      )}

                      {["text", "email", "number"].includes(field.type) && field.id !== "f_core_phone" && (
                        <input
                          type={field.type}
                          required={field.required}
                          value={feedbackAnswers[field.id] || ""}
                          onChange={(e) => setFeedbackAnswers(prev => ({ ...prev, [field.id]: e.target.value }))}
                          placeholder={field.placeholder || "Enter details..."}
                          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 focus:border-blue-600 focus:bg-white rounded-xl text-xs font-semibold text-slate-900 outline-none transition-all"
                        />
                      )}

                      {field.type === "select" && (
                        <select
                          required={field.required}
                          value={feedbackAnswers[field.id] || ""}
                          onChange={(e) => setFeedbackAnswers(prev => ({ ...prev, [field.id]: e.target.value }))}
                          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 focus:border-blue-600 focus:bg-white rounded-xl text-xs font-semibold text-slate-900 outline-none transition-all cursor-pointer"
                        >
                          <option value="">Select an option...</option>
                          {(field.options || []).map((opt, idx) => (
                            <option key={idx} value={opt}>{opt}</option>
                          ))}
                        </select>
                      )}

                      {field.type === "rating" && (
                        <div className="flex items-center gap-2 py-1">
                          {[1, 2, 3, 4, 5].map(star => (
                            <button
                              type="button"
                              key={star}
                              onClick={() => setFeedbackAnswers(prev => ({ ...prev, [field.id]: star }))}
                              className="p-1 cursor-pointer transition-transform hover:scale-125"
                            >
                              <Star
                                size={24}
                                className={star <= (feedbackAnswers[field.id] || 0) ? "text-amber-500 fill-amber-500" : "text-slate-300"}
                              />
                            </button>
                          ))}
                        </div>
                      )}

                      {field.type === "nps" && (
                        <div className="flex items-center justify-between gap-1 overflow-x-auto py-1">
                          {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
                            <button
                              type="button"
                              key={n}
                              onClick={() => setFeedbackAnswers(prev => ({ ...prev, [field.id]: n }))}
                              className={`w-7 h-7 rounded-lg text-xs font-bold transition-all ${
                                feedbackAnswers[field.id] === n
                                  ? "bg-blue-600 text-white scale-110"
                                  : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                              }`}
                            >
                              {n}
                            </button>
                          ))}
                        </div>
                      )}

                      {field.type === "textarea" && (
                        <textarea
                          required={field.required}
                          rows={3}
                          value={feedbackAnswers[field.id] || ""}
                          onChange={(e) => setFeedbackAnswers(prev => ({ ...prev, [field.id]: e.target.value }))}
                          placeholder={field.placeholder || "Share your candid thoughts..."}
                          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 focus:border-blue-600 focus:bg-white rounded-xl text-xs font-medium text-slate-900 outline-none transition-all"
                        />
                      )}
                    </div>
                  );
                })}

                <button
                  type="submit"
                  disabled={feedbackLoading}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-3"
                >
                  {feedbackLoading ? "Saving..." : (activeFeedbackForm.settings?.submitButtonText || "Submit Feedback")}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Public RSVP Modal */}
      <PublicRSVPModal
        isOpen={showPublicRsvpModal}
        onClose={closeRSVP}
        event={eventDetails || { id: eventId, title }}
        rsvpSettings={rsvpSettings}
        existingHeadcount={rsvps.filter(r => (r.status || 'attending').toLowerCase() === 'attending').reduce((sum, r) => sum + 1 + (r.plusOnes || r.plus_ones || 0), 0)}
        onSubmitRSVP={onSubmitRSVP}
        currentUser={currentUser}
      />
    </div>
  );
}
