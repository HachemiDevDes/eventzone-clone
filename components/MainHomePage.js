/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useState, useEffect } from "react";
import { 
  Compass, Ticket, Calendar, MapPin, 
  Sparkles, ArrowRight, ChevronLeft, ChevronRight, 
  Building2, Search, Filter, Layers, ExternalLink, 
  CheckCircle2, Users, ShieldCheck, LogOut, ChevronDown, Plus, X, ArrowUp,
  Smartphone, MessageSquare, QrCode as QrIcon, Star, Download, Zap, Share2, Check, UserCheck, User
} from "lucide-react";
import QRCode from "qrcode";

export default function MainHomePage({
  events = [],
  registrations = [],
  currentUser,
  onOpenAuth,
  onSignOut,
  onSwitchRole,
  onUpdateProfile,
  onOpenProfile,
  onOpenEventsHub,
  onOpenVisitorPasses,
  onSelectEventForDashboard,
  onViewFloorPlan,
  onViewLivePage,
  onRegisterForEvent
}) {
  // Hero Carousel State
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [isAutoPlay, setIsAutoPlay] = useState(true);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedFormat, setSelectedFormat] = useState("All");

  // Profile Dropdown State
  const [profileOpen, setProfileOpen] = useState(false);

  // RSVP Modal State
  const [rsvpEvent, setRsvpEvent] = useState(null);
  const [rsvpName, setRsvpName] = useState(currentUser?.fullName || "");
  const [rsvpEmail, setRsvpEmail] = useState(currentUser?.email || "");
  const [rsvpTier, setRsvpTier] = useState("VIP Access Pass");
  const [rsvpLoading, setRsvpLoading] = useState(false);
  const [rsvpSuccess, setRsvpSuccess] = useState(null);

  // My Passes Modal
  const [showPassesModal, setShowPassesModal] = useState(false);
  const [qrCodeUrls, setQrCodeUrls] = useState({});

  const heroEvents = events.slice(0, 4);

  // Auto-rotate hero slides
  useEffect(() => {
    if (!isAutoPlay || heroEvents.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentSlideIndex(prev => (prev + 1) % heroEvents.length);
    }, 5500);
    return () => clearInterval(interval);
  }, [isAutoPlay, heroEvents.length]);

  // Generate QR codes for passes
  useEffect(() => {
    const generateQRs = async () => {
      const urls = {};
      for (const reg of registrations) {
        try {
          const qrData = JSON.stringify({
            passId: reg.id,
            badgeCode: reg.badgeCode,
            eventId: reg.eventId,
            eventTitle: reg.eventTitle,
            attendeeName: currentUser?.fullName || "Attendee",
            ticketType: reg.ticketType,
          });
          const url = await QRCode.toDataURL(qrData, {
            width: 200,
            margin: 1,
            color: { dark: "#0b5cdb", light: "#ffffff" }
          });
          urls[reg.id] = url;
        } catch (e) {
          console.warn("QR code generation error:", e);
        }
      }
      setQrCodeUrls(urls);
    };

    if (registrations.length > 0) {
      generateQRs();
    }
  }, [registrations, currentUser]);

  const categories = [
    "All",
    "Energy & Hydrocarbons",
    "Technology & Software",
    "Finance & Banking",
    "Healthcare & Pharmaceuticals"
  ];

  const filteredEvents = events.filter(ev => {
    const matchesSearch = (ev.title || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (ev.location || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (ev.category || "").toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "All" || ev.category === selectedCategory;
    const matchesFormat = selectedFormat === "All" || (ev.type || "Hybrid") === selectedFormat;
    return matchesSearch && matchesCategory && matchesFormat;
  });

  const handleRsvpSubmit = async (e) => {
    e.preventDefault();
    if (!rsvpEvent) return;
    setRsvpLoading(true);

    try {
      const pass = await onRegisterForEvent(rsvpEvent.id, {
        name: rsvpName || currentUser?.fullName || "Attendee",
        email: rsvpEmail || currentUser?.email || "visitor@eventzone.io",
        ticketType: rsvpTier,
        eventTitle: rsvpEvent.title,
        location: rsvpEvent.location,
        startDate: rsvpEvent.startDate,
        endDate: rsvpEvent.endDate,
      });

      if (pass) {
        const qrData = JSON.stringify({
          passId: pass.id,
          badgeCode: pass.badgeCode,
          eventId: pass.eventId,
          eventTitle: pass.eventTitle,
          attendeeName: rsvpName,
          ticketType: rsvpTier,
        });
        const url = await QRCode.toDataURL(qrData, { width: 200, margin: 1, color: { dark: "#0b5cdb", light: "#ffffff" } });
        setQrCodeUrls(prev => ({ ...prev, [pass.id]: url }));
        setRsvpSuccess(pass);
      }
    } catch (err) {
      console.error("RSVP error:", err);
    } finally {
      setRsvpLoading(false);
    }
  };

  const activeSlide = heroEvents[currentSlideIndex] || heroEvents[0] || {};

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      {/* ==================================================================== */}
      {/* 1. TOP BAR NAVIGATION (LIGHT MODE)                                   */}
      {/* ==================================================================== */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-xl border-b border-slate-200 px-6 sm:px-8 py-3.5 flex items-center justify-between shadow-xs">
        {/* Left: Eventzone Original Blue Logo Alone */}
        <div className="flex items-center">
          <div 
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="flex items-center cursor-pointer select-none group"
            title="Eventzone Home"
          >
            <img 
              src="https://i.imgur.com/jFDrQbM.png" 
              alt="eventzone" 
              className="h-7 w-auto object-contain transition-transform group-hover:scale-105" 
            />
          </div>
        </div>

        {/* Center: Quick Links in the middle */}
        <nav className="hidden md:flex items-center gap-7">
          <a 
            href="#explore" 
            className="text-xs font-bold text-slate-600 hover:text-blue-600 transition-colors"
          >
            Explore Events
          </a>
          <a 
            href="#featured" 
            className="text-xs font-bold text-slate-600 hover:text-blue-600 transition-colors"
          >
            Featured Summits
          </a>
          <a 
            href="#categories" 
            className="text-xs font-bold text-slate-600 hover:text-blue-600 transition-colors"
          >
            Categories
          </a>
          <a 
            href="#mobile-app" 
            className="text-xs font-bold text-blue-600 hover:text-blue-700 transition-colors flex items-center gap-1"
          >
            <Smartphone size={13} />
            <span>Mobile App</span>
          </a>
          <button 
            onClick={() => {
              if (!currentUser) {
                onOpenAuth("signup");
              } else {
                onOpenEventsHub();
              }
            }}
            className="text-xs font-bold text-slate-600 hover:text-blue-600 transition-colors cursor-pointer bg-transparent border-0"
          >
            For Organizers
          </button>
        </nav>

        {/* Right: Auth / Profile Controls */}
        <div className="flex items-center gap-3">
          {currentUser ? (
            <div className="relative">
              <button
                onClick={() => setProfileOpen(o => !o)}
                className="flex items-center gap-2.5 p-1.5 pr-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-full transition-all cursor-pointer shadow-xs"
              >
                <img 
                  src={currentUser.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80"} 
                  alt="Avatar" 
                  className="w-7 h-7 rounded-full object-cover border border-blue-500/40"
                />
                <div className="hidden sm:flex flex-col text-left">
                  <span className="text-xs font-bold text-slate-800 leading-tight truncate max-w-[120px]">{currentUser.fullName}</span>
                  <span className="text-[9px] font-semibold text-blue-600 uppercase tracking-wider">
                    {currentUser.role === "organizer" ? "Organizer" : "Visitor"}
                  </span>
                </div>
                <ChevronDown size={13} className={`text-slate-400 transition-transform ${profileOpen ? "rotate-180" : ""}`} />
              </button>

              {/* Profile Dropdown */}
              {profileOpen && (
                <div className="absolute top-full right-0 mt-2 w-64 bg-white border border-slate-200 rounded-2xl shadow-xl p-2 z-50 animate-scale-up space-y-1">
                  <div className="px-3 py-2 border-b border-slate-100 mb-1">
                    <span className="text-xs font-bold text-slate-900 block truncate">{currentUser.fullName}</span>
                    <span className="text-[10px] text-slate-400 truncate block">{currentUser.email}</span>
                  </div>

                  {/* My Networking Profile Button */}
                  <button
                    onClick={() => {
                      setProfileOpen(false);
                      if (onOpenProfile) onOpenProfile();
                    }}
                    className="w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold text-slate-800 hover:bg-slate-100 flex items-center gap-2.5 transition-colors cursor-pointer"
                  >
                    <User size={15} className="text-blue-600" />
                    <span>My Networking Profile</span>
                  </button>

                  {/* Organizer Center Button */}
                  <button
                    onClick={() => {
                      setProfileOpen(false);
                      onOpenEventsHub();
                    }}
                    className="w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold text-blue-700 hover:bg-blue-50 flex items-center gap-2.5 transition-colors cursor-pointer"
                  >
                    <Building2 size={15} />
                    <span>Event Manager Center</span>
                  </button>

                  {/* My Passes Button */}
                  <button
                    onClick={() => {
                      setProfileOpen(false);
                      setShowPassesModal(true);
                    }}
                    className="w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold text-emerald-700 hover:bg-emerald-50 flex items-center justify-between transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5">
                      <Ticket size={15} />
                      <span>My Digital Passes</span>
                    </div>
                    <span className="px-1.5 py-0.2 rounded-full bg-emerald-500 text-white font-black text-[10px]">
                      {registrations.length}
                    </span>
                  </button>

                  {/* Switch Role Toggle */}
                  <button
                    onClick={() => {
                      setProfileOpen(false);
                      onSwitchRole(currentUser.role === "organizer" ? "visitor" : "organizer");
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 transition-colors cursor-pointer"
                  >
                    <Users size={15} className="text-slate-400" />
                    <span>Switch to {currentUser.role === "organizer" ? "Visitor Mode" : "Organizer Mode"}</span>
                  </button>

                  <div className="h-px bg-slate-100 my-1" />

                  {/* Sign Out */}
                  <button
                    onClick={() => {
                      setProfileOpen(false);
                      onSignOut();
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 flex items-center gap-2.5 transition-colors cursor-pointer"
                  >
                    <LogOut size={15} />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => onOpenAuth("signin")}
                className="px-3.5 py-2 text-xs font-bold text-slate-700 hover:text-blue-600 rounded-xl transition-colors cursor-pointer"
              >
                Sign In
              </button>

              <button
                onClick={() => onOpenAuth("signup")}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-600/20 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Plus size={14} />
                <span>Create Account</span>
              </button>
            </div>
          )}
        </div>
      </header>

      {/* ==================================================================== */}
      {/* 2. ROLLING HERO SECTION (CINEMATIC DARK OVERLAY CAROUSEL)            */}
      {/* ==================================================================== */}
      <section 
        id="featured"
        className="relative overflow-hidden bg-slate-950 text-white border-b border-slate-800 min-h-[480px] sm:min-h-[520px] flex items-center"
        onMouseEnter={() => setIsAutoPlay(false)}
        onMouseLeave={() => setIsAutoPlay(true)}
      >
        {/* Background Image Accent with Dark Overlay */}
        <div className="absolute inset-0 z-0">
          <img 
            src={activeSlide.banner || "https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=1600&q=80"} 
            alt={activeSlide.title || "Event Banner"} 
            className="w-full h-full object-cover opacity-35 filter blur-xs scale-105 transition-all duration-1000"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/85 to-slate-900/80" />
        </div>

        {/* Ambient Subtle Blue Glow Accent */}
        <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />

        {/* Hero Content Container */}
        <div className="relative z-10 max-w-7xl w-full mx-auto px-6 sm:px-8 py-12 flex flex-col md:flex-row items-center justify-between gap-10">
          {/* Left Slide Details */}
          <div className="max-w-2xl space-y-5 text-left">
            {/* Badges */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-blue-600/20 text-blue-400 border border-blue-500/30 text-xs font-extrabold uppercase tracking-wider flex items-center gap-1.5 shadow-xs backdrop-blur-md">
                <Sparkles size={12} className="text-blue-400" />
                <span>Featured Summit</span>
              </span>

              <span className="px-2.5 py-1 rounded-full bg-slate-900/80 border border-slate-800 text-slate-200 text-xs font-bold uppercase tracking-wider shadow-xs">
                {activeSlide.type || "Hybrid"}
              </span>

              <span className="px-2.5 py-1 rounded-full bg-slate-900/60 border border-slate-800 text-slate-300 text-xs font-semibold">
                {activeSlide.category || "Technology & Software"}
              </span>
            </div>

            {/* Title & Tagline */}
            <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
              {activeSlide.title}
            </h1>

            <p className="text-slate-300 text-sm sm:text-base font-normal leading-relaxed max-w-xl">
              {activeSlide.tagline || activeSlide.description}
            </p>

            {/* Meta: Dates & Location */}
            <div className="flex flex-wrap items-center gap-4 text-xs sm:text-sm text-slate-200 font-medium pt-1">
              <div className="flex items-center gap-2 bg-slate-900/80 backdrop-blur-md px-3.5 py-2 rounded-xl border border-slate-800 shadow-sm">
                <Calendar size={15} className="text-blue-400 shrink-0" />
                <span>{activeSlide.startDate} — {activeSlide.endDate}</span>
              </div>

              <div className="flex items-center gap-2 bg-slate-900/80 backdrop-blur-md px-3.5 py-2 rounded-xl border border-slate-800 shadow-sm">
                <MapPin size={15} className="text-blue-400 shrink-0" />
                <span>{activeSlide.location}</span>
              </div>
            </div>

            {/* CTA */}
            <div className="pt-3">
              <button
                onClick={() => onViewLivePage(activeSlide.id)}
                className="px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-bold text-sm shadow-xl shadow-blue-600/40 transition-all flex items-center gap-2 cursor-pointer group"
              >
                <span>View Event</span>
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

          {/* Right Hero Event Showcase Card */}
          <div className="hidden lg:block w-96 shrink-0 animate-fade-in">
            <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
              <div className="h-48 w-full relative overflow-hidden bg-slate-950">
                <img 
                  src={activeSlide.banner} 
                  alt={activeSlide.title} 
                  className="w-full h-full object-cover" 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />
                <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-xs">
                  <span className="px-2.5 py-1 rounded-full bg-blue-600 text-white font-extrabold text-[10px] uppercase shadow-xs">
                    {activeSlide.status || "Live Summit"}
                  </span>
                  <span className="text-white font-bold text-xs backdrop-blur-md bg-black/60 px-2 py-0.5 rounded-lg border border-white/10">
                    {activeSlide.attendeeCount || 1200}+ Attendees
                  </span>
                </div>
              </div>

              <div className="p-5 space-y-3 text-left">
                <h4 className="text-sm font-bold text-white line-clamp-1">{activeSlide.title}</h4>
                <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed font-normal">{activeSlide.description}</p>
                <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400 font-medium">
                  <span>Capacity: {activeSlide.capacity || 1500}</span>
                  <span className="text-blue-400 font-bold">18 Sessions</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Carousel Slide Navigation Controls */}
        <div className="absolute bottom-4 left-0 right-0 z-20 flex items-center justify-between max-w-7xl mx-auto px-6 sm:px-8">
          {/* Slide Indicator Dots */}
          <div className="flex items-center gap-2">
            {heroEvents.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentSlideIndex(idx)}
                className={`h-2 rounded-full transition-all cursor-pointer ${
                  currentSlideIndex === idx 
                    ? "w-8 bg-blue-500 shadow-sm shadow-blue-500/50" 
                    : "w-2 bg-slate-700 hover:bg-slate-600"
                }`}
                title={`Slide ${idx + 1}`}
              />
            ))}
          </div>

          {/* Prev / Next Arrows */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentSlideIndex(prev => (prev - 1 + heroEvents.length) % heroEvents.length)}
              className="w-9 h-9 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 flex items-center justify-center transition-all cursor-pointer shadow-sm"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={() => setCurrentSlideIndex(prev => (prev + 1) % heroEvents.length)}
              className="w-9 h-9 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 flex items-center justify-center transition-all cursor-pointer shadow-sm"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </section>

      {/* ==================================================================== */}
      {/* 3. EVENT DISCOVERY & CATALOG SECTION (LIGHT MODE)                    */}
      {/* ==================================================================== */}
      <main id="explore" className="flex-1 max-w-7xl w-full mx-auto px-6 sm:px-8 py-12 space-y-8">
        {/* Section Header & Filters */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-blue-700 text-xs font-bold mb-2">
              <Compass size={13} />
              <span>Explore All Gatherings</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Upcoming Conferences & Expos
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 font-normal mt-1">
              Browse premier summits, claim attendee passes, and preview floor plans.
            </p>
          </div>

          {/* Search Bar */}
          <div className="relative w-full md:w-80">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by topic, city, or event..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-2xl text-xs font-semibold text-slate-900 placeholder-slate-400 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition-all shadow-xs"
            />
          </div>
        </div>

        {/* Category & Format Filter Bar */}
        <div id="categories" className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-1 scroll-mt-20">
          {/* Categories */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none max-w-full">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  selectedCategory === cat 
                    ? "bg-blue-600 text-white shadow-md shadow-blue-600/20" 
                    : "bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Format Toggle */}
          <div className="flex items-center bg-white p-1 rounded-xl border border-slate-200 text-xs shrink-0 shadow-xs">
            {["All", "Hybrid", "In-Person"].map(fmt => (
              <button
                key={fmt}
                onClick={() => setSelectedFormat(fmt)}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                  selectedFormat === fmt ? "bg-blue-600 text-white shadow-xs" : "text-slate-500 hover:text-slate-900"
                }`}
              >
                {fmt}
              </button>
            ))}
          </div>
        </div>

        {/* Event Cards Grid */}
        {filteredEvents.length === 0 ? (
          <div className="bg-white border border-dashed border-slate-300 rounded-3xl p-12 text-center flex flex-col items-center justify-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600">
              <Compass size={28} />
            </div>
            <h3 className="text-base font-bold text-slate-900">No events match your criteria</h3>
            <p className="text-xs text-slate-400 max-w-sm">
              Try adjusting your search query or selecting a different category filter.
            </p>
            <button
              onClick={() => { setSearchQuery(""); setSelectedCategory("All"); setSelectedFormat("All"); }}
              className="mt-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEvents.map(ev => {
              const isRegistered = registrations.some(r => r.eventId === ev.id);

              return (
                <div
                  key={ev.id}
                  className="bg-white border border-slate-200/90 hover:border-blue-300 rounded-3xl overflow-hidden shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col justify-between group"
                >
                  <div>
                    {/* Cover Banner */}
                    <div className="h-44 w-full relative overflow-hidden bg-slate-100">
                      <img 
                        src={ev.banner || "https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1200&q=80"} 
                        alt={ev.title} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent" />
                      
                      <div className="absolute top-3 left-3">
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-white/90 backdrop-blur-md text-blue-700 border border-white/40 uppercase tracking-wider shadow-xs">
                          {ev.type || "Hybrid"}
                        </span>
                      </div>

                      {isRegistered && (
                        <div className="absolute top-3 right-3">
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-emerald-500 text-white shadow-xs flex items-center gap-1">
                            <CheckCircle2 size={11} />
                            <span>Registered</span>
                          </span>
                        </div>
                      )}

                      <div className="absolute bottom-3 left-3 right-3">
                        <span className="text-[10px] font-bold text-blue-200 uppercase tracking-wider block drop-shadow-sm">
                          {ev.category || "Technology & Software"}
                        </span>
                      </div>
                    </div>

                    {/* Card Content */}
                    <div className="p-6 space-y-3 text-left">
                      <h3 
                        onClick={() => onViewLivePage(ev.id)}
                        className="text-base font-bold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-1 leading-snug cursor-pointer"
                      >
                        {ev.title}
                      </h3>
                      <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed font-normal">
                        {ev.tagline || ev.description || "Join leading delegates for keynotes, workshops, and exhibitions."}
                      </p>

                      <div className="space-y-1.5 pt-2 text-xs text-slate-600 font-medium border-t border-slate-100">
                        <div className="flex items-center gap-2">
                          <Calendar size={13} className="text-blue-600 shrink-0" />
                          <span>{ev.startDate} — {ev.endDate}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin size={13} className="text-blue-600 shrink-0" />
                          <span className="truncate">{ev.location}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Card Footer Action: Single View Event Button */}
                  <div className="p-6 pt-0">
                    <button
                      onClick={() => onViewLivePage(ev.id)}
                      className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-xs font-bold flex items-center justify-center gap-2 shadow-md shadow-blue-600/20 hover:shadow-lg hover:shadow-blue-600/30 transition-all cursor-pointer group"
                    >
                      <span>View Event</span>
                      <ChevronRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* ==================================================================== */}
      {/* 3.5. EVENTZONE MOBILE NETWORKING APP SHOWCASE SECTION                */}
      {/* ==================================================================== */}
      <section id="mobile-app" className="max-w-7xl w-full mx-auto px-6 sm:px-8 my-8 sm:my-16 scroll-mt-24">
        <div className="relative overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950/70 border border-slate-800 rounded-3xl p-8 sm:p-14 text-white shadow-2xl">
          {/* Ambient Blue Background Glows */}
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-blue-500/15 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Content Column */}
            <div className="lg:col-span-7 space-y-4 text-left">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight">
                Connect, Network &amp; Scan in Real Time.
              </h2>

              <p className="text-slate-300 text-sm sm:text-base leading-relaxed font-normal max-w-xl">
                The Eventzone companion app transforms every summit into a high-powered networking hub. Meet verified founders, schedule 1-on-1 meetings, scan badge QR codes, and navigate floor plans seamlessly.
              </p>
            </div>

            {/* Right Visual Showcase: Real Phone Mockup Image (Scaled down & bottom-aligned) */}
            <div className="lg:col-span-5 flex justify-center items-end self-end -mb-8 sm:-mb-14">
              <div className="relative w-full max-w-[250px] flex justify-center items-end">
                <img 
                  src="/phonemockup.png" 
                  alt="Eventzone Networking Mobile App" 
                  className="w-full h-auto object-contain drop-shadow-[0_20px_30px_rgba(0,0,0,0.65)] block" 
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ==================================================================== */}
      {/* 4. MODERN FOOTER (LIGHT MODE)                                        */}
      {/* ==================================================================== */}
      <footer className="bg-white border-t border-slate-200 pt-16 pb-12 mt-16 text-slate-600 text-xs font-sans">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 space-y-12">
          {/* Top Row: Brand & Value + Newsletter */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pb-12 border-b border-slate-100 items-start">
            <div className="lg:col-span-6 space-y-4 text-left">
              <div className="flex items-center gap-3">
                <img src="https://i.imgur.com/jFDrQbM.png" alt="eventzone" className="h-7 w-auto object-contain" />
                <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-extrabold uppercase tracking-wider">
                  Event SaaS Platform
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 max-w-md leading-relaxed">
                The modern event management operating system for international summits, conferences, and hybrid exhibitions with real-time 2D floor plans and attendee badge tracking.
              </p>
              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 font-medium">
                <div className="flex items-center gap-1.5 text-emerald-600">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="font-bold">Platform Status: All Systems Operational</span>
                </div>
                <span>•</span>
                <span>SOC2 &amp; GDPR Compliant</span>
              </div>
            </div>

            {/* Newsletter Box */}
            <div className="lg:col-span-6 bg-slate-50 border border-slate-200/90 rounded-3xl p-6 text-left space-y-3 shadow-xs">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                <Sparkles size={16} className="text-blue-600" />
                <span>Get Early Access &amp; Summit Bulletins</span>
              </div>
              <p className="text-xs text-slate-500">
                Subscribe to receive upcoming event schedules, keynote announcements, and VIP pass releases.
              </p>
              <form onSubmit={(e) => { e.preventDefault(); alert("Subscribed to Eventzone bulletins!"); }} className="flex flex-col sm:flex-row gap-2 pt-1">
                <input
                  type="email"
                  required
                  placeholder="Enter your business email"
                  className="flex-1 px-4 py-2.5 bg-white border border-slate-200 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 rounded-xl text-xs font-semibold text-slate-900 placeholder-slate-400 outline-none transition-all"
                />
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-600/20 shrink-0 cursor-pointer"
                >
                  Subscribe
                </button>
              </form>
            </div>
          </div>

          {/* Middle Row: Links Columns */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-left text-xs">
            <div className="space-y-3">
              <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">Explore Gatherings</h4>
              <ul className="space-y-2 text-slate-500 font-medium">
                <li><a href="#explore" className="hover:text-blue-600 transition-colors">Upcoming Conferences</a></li>
                <li><a href="#explore" className="hover:text-blue-600 transition-colors">Tech &amp; AI Summits</a></li>
                <li><a href="#explore" className="hover:text-blue-600 transition-colors">Clean Energy Forums</a></li>
                <li><a href="#explore" className="hover:text-blue-600 transition-colors">Finance &amp; Banking Expos</a></li>
                <li><a href="#explore" className="hover:text-blue-600 transition-colors">Healthcare &amp; Bio Congresses</a></li>
              </ul>
            </div>

            <div className="space-y-3">
              <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">For Organizers</h4>
              <ul className="space-y-2 text-slate-500 font-medium">
                <li><button onClick={() => onOpenEventsHub()} className="hover:text-blue-600 transition-colors text-left cursor-pointer">Event Manager Center</button></li>
                <li><button onClick={() => onOpenEventsHub()} className="hover:text-blue-600 transition-colors text-left cursor-pointer">2D Floor Plan Modifier</button></li>
                <li><button onClick={() => onOpenEventsHub()} className="hover:text-blue-600 transition-colors text-left cursor-pointer">Badge &amp; QR Check-In</button></li>
                <li><button onClick={() => onOpenEventsHub()} className="hover:text-blue-600 transition-colors text-left cursor-pointer">Speaker &amp; Agenda Manager</button></li>
                <li><button onClick={() => onOpenEventsHub()} className="hover:text-blue-600 transition-colors text-left cursor-pointer">Exhibitor Booth Sales</button></li>
              </ul>
            </div>

            <div className="space-y-3">
              <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">For Attendees</h4>
              <ul className="space-y-2 text-slate-500 font-medium">
                <li><button onClick={() => setShowPassesModal(true)} className="hover:text-blue-600 transition-colors text-left cursor-pointer">My Digital Passes</button></li>
                <li><button onClick={() => setShowPassesModal(true)} className="hover:text-blue-600 transition-colors text-left cursor-pointer">QR Code Badge Download</button></li>
                <li><a href="#explore" className="hover:text-blue-600 transition-colors">Claim Free Admission</a></li>
                <li><a href="#explore" className="hover:text-blue-600 transition-colors">VIP Networking Lounges</a></li>
                <li><a href="#explore" className="hover:text-blue-600 transition-colors">Venue Directions &amp; Transit</a></li>
              </ul>
            </div>

            <div className="space-y-3">
              <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">Security &amp; Legal</h4>
              <ul className="space-y-2 text-slate-500 font-medium">
                <li><span className="hover:text-slate-900 cursor-pointer">Privacy Policy</span></li>
                <li><span className="hover:text-slate-900 cursor-pointer">Terms of Service</span></li>
                <li><span className="hover:text-slate-900 cursor-pointer">Cookie Settings</span></li>
                <li><span className="hover:text-slate-900 cursor-pointer">Enterprise Security</span></li>
                <li><span className="hover:text-slate-900 cursor-pointer">Compliance &amp; GDPR</span></li>
              </ul>
            </div>
          </div>

          {/* Bottom Row */}
          <div className="pt-8 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
            <span className="text-slate-400">© 2026 Eventzone SaaS Platform. All rights reserved.</span>

            <button
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              className="px-3.5 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200 transition-all flex items-center gap-1.5 font-bold cursor-pointer shadow-xs"
            >
              <span>Back to Top</span>
              <ArrowUp size={14} />
            </button>
          </div>
        </div>
      </footer>

      {/* ==================================================================== */}
      {/* 5. RSVP MODAL (LIGHT MODE)                                           */}
      {/* ==================================================================== */}
      {rsvpEvent && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fade-in font-sans">
          <div className="bg-white border border-slate-200 w-full max-w-md rounded-3xl shadow-2xl p-6 sm:p-7 text-slate-900">
            {rsvpSuccess ? (
              <div className="text-center py-4 space-y-4 animate-fade-in">
                <div className="w-14 h-14 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-200">
                  <CheckCircle2 size={32} />
                </div>
                <h3 className="text-xl font-bold text-slate-900">Pass Confirmed!</h3>
                <p className="text-xs text-slate-500 max-w-xs mx-auto">
                  Your digital ticket has been issued for <strong>{rsvpSuccess.eventTitle}</strong>.
                </p>

                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-left text-xs space-y-1.5">
                  <div className="flex justify-between"><span className="text-slate-500">Badge ID:</span> <span className="font-mono font-bold text-blue-600">{rsvpSuccess.badgeCode}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">Tier:</span> <span className="font-bold text-slate-900">{rsvpSuccess.ticketType}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">Status:</span> <span className="font-bold text-emerald-600">Confirmed</span></div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setRsvpEvent(null);
                      setShowPassesModal(true);
                    }}
                    className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-md shadow-blue-600/20"
                  >
                    View in My Passes
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
                  <div className="flex items-center gap-2">
                    <Ticket size={18} className="text-blue-600" />
                    <h3 className="text-base font-bold text-slate-900">Claim Summit Pass</h3>
                  </div>
                  <button 
                    onClick={() => setRsvpEvent(null)}
                    className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
                  >
                    <X size={16} />
                  </button>
                </div>

                <p className="text-xs text-slate-500 font-medium mb-4">
                  Registering for: <strong className="text-slate-900">{rsvpEvent.title}</strong>
                </p>

                <form onSubmit={handleRsvpSubmit} className="space-y-4 text-left">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Your Full Name
                    </label>
                    <input
                      type="text"
                      required
                      value={rsvpName}
                      onChange={(e) => setRsvpName(e.target.value)}
                      placeholder="e.g. Alex Morgan"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 focus:border-blue-600 focus:bg-white rounded-xl text-xs font-semibold text-slate-900 outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Email Address for QR Badge
                    </label>
                    <input
                      type="email"
                      required
                      value={rsvpEmail}
                      onChange={(e) => setRsvpEmail(e.target.value)}
                      placeholder="alex@company.com"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 focus:border-blue-600 focus:bg-white rounded-xl text-xs font-semibold text-slate-900 outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Select Access Tier
                    </label>
                    <select
                      value={rsvpTier}
                      onChange={(e) => setRsvpTier(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 focus:border-blue-600 rounded-xl text-xs font-semibold text-slate-900 outline-none transition-all cursor-pointer"
                    >
                      <option value="VIP Access Pass">VIP Access Pass (Full floor plan + networking)</option>
                      <option value="Standard Admission">Standard Admission (Keynotes + Expo Hall)</option>
                      <option value="Online Only">Online Stream Pass</option>
                    </select>
                  </div>

                  <button
                    type="submit"
                    disabled={rsvpLoading}
                    className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-2"
                  >
                    {rsvpLoading ? (
                      <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <span>Generate Digital Pass</span>
                        <Sparkles size={14} />
                      </>
                    )}
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* 6. MY PASSES MODAL (LIGHT MODE)                                      */}
      {/* ==================================================================== */}
      {showPassesModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fade-in font-sans">
          <div className="bg-white border border-slate-200 w-full max-w-3xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] text-slate-900">
            <div className="p-6 border-b border-slate-150 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Ticket size={20} className="text-blue-600" />
                <h3 className="text-lg font-bold text-slate-900">My Digital Tickets & QR Passes</h3>
              </div>
              <button 
                onClick={() => setShowPassesModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4">
              {registrations.length === 0 ? (
                <div className="py-12 text-center space-y-3">
                  <Ticket size={32} className="text-slate-400 mx-auto" />
                  <p className="text-xs text-slate-500">You haven&apos;t claimed any tickets yet.</p>
                  <button 
                    onClick={() => setShowPassesModal(false)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold"
                  >
                    Explore Summits
                  </button>
                </div>
              ) : (
                registrations.map(reg => (
                  <div key={reg.id} className="bg-slate-50 border border-slate-200 rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="space-y-1 text-left flex-1">
                      <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-100">
                        {reg.ticketType}
                      </span>
                      <h4 className="text-sm font-bold text-slate-900">{reg.eventTitle}</h4>
                      <p className="text-xs text-slate-500">{reg.startDate} — {reg.location}</p>
                      <span className="text-[11px] font-mono text-blue-600 font-bold block pt-1">{reg.badgeCode}</span>
                    </div>

                    <div className="w-28 h-28 bg-white p-2 border border-slate-200 rounded-xl shrink-0 flex items-center justify-center shadow-xs">
                      {qrCodeUrls[reg.id] ? (
                        <img src={qrCodeUrls[reg.id]} alt="QR" className="w-full h-full object-contain" />
                      ) : (
                        <QRCode value={reg.badgeCode} className="w-full h-full" />
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
