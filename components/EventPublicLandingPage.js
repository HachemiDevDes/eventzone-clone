/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useState, useEffect } from "react";
import { 
  Calendar, MapPin, Sparkles, ArrowRight, ArrowLeft, ArrowUp,
  Layers, Users, Clock, Ticket, Award, CheckCircle2, 
  ExternalLink, Share2, Compass, ShieldCheck, 
  ChevronRight, Building2, Check, Download, Mail, X, Globe, Video,
  Star, MessageSquare
} from "lucide-react";
import QRCode from "qrcode";

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
  onSubmitFormResponse,
  currentUser,
  onBackToHome,
  onViewFloorPlan,
  onRegisterForEvent,
  onOpenAuth
}) {
  const [selectedDay, setSelectedDay] = useState("All");
  const [bookmarkedSessions, setBookmarkedSessions] = useState(new Set());
  const [copiedUrl, setCopiedUrl] = useState(false);

  // Custom Form Registration State
  const [customAnswers, setCustomAnswers] = useState({});

  // Feedback Survey Modal State
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedbackAnswers, setFeedbackAnswers] = useState({});
  const [feedbackSuccess, setFeedbackSuccess] = useState(false);
  const [feedbackLoading, setFeedbackLoading] = useState(false);

  // RSVP Modal State
  const [showRsvpModal, setShowRsvpModal] = useState(false);
  const [selectedTier, setSelectedTier] = useState("Standard Admission");
  const [rsvpName, setRsvpName] = useState(currentUser?.fullName || "");
  const [rsvpEmail, setRsvpEmail] = useState(currentUser?.email || "");
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

  // Dynamic Sessions
  const eventSessions = sessions.length > 0 ? sessions : [
    {
      id: "s1",
      title: "Opening Keynote: Future Industry Landscape & Policy Directions",
      date: startDate,
      startTime: "09:00",
      endTime: "10:30",
      description: "A comprehensive executive overview of key economic opportunities, emerging technologies, and sustainability goals.",
      speakers: [{ name: "Dr. Amel Bouraoui", role: "Keynote Speaker", title: "Chief Innovation Officer" }]
    },
    {
      id: "s2",
      title: "Panel Discussion: Infrastructure, Scale & Cross-Border Collaboration",
      date: startDate,
      startTime: "11:00",
      endTime: "12:30",
      description: "Industry titans discuss supply chain modernization, regulatory frameworks, and joint venture expansion.",
      speakers: [
        { name: "Karim Benali", role: "Moderator", title: "Managing Partner, North Africa Capital" },
        { name: "Sarah Jenkins", role: "Panelist", title: "VP of Global Partnerships" }
      ]
    },
    {
      id: "s3",
      title: "Tech Showcase: Next-Gen Autonomous Systems & Cloud Architectures",
      date: endDate,
      startTime: "14:00",
      endTime: "15:30",
      description: "Live product demonstrations featuring real-world deployments and high-availability enterprise benchmarks.",
      speakers: [{ name: "Alexandre Moreau", role: "Lead Architect", title: "Principal Systems Engineer" }]
    },
    {
      id: "s4",
      title: "Executive Networking & VIP Gala Reception",
      date: endDate,
      startTime: "17:00",
      endTime: "19:00",
      description: "Exclusive evening cocktail reception for all VIP pass holders, speakers, and corporate partners.",
      speakers: [{ name: "Host Committee", role: "Special Host", title: "Eventzone Executive Board" }]
    }
  ];

  // Dynamic Speakers
  const eventSpeakers = [];
  const speakerNames = new Set();
  eventSessions.forEach(s => {
    (s.speakers || []).forEach(sp => {
      if (sp?.name && !speakerNames.has(sp.name)) {
        speakerNames.add(sp.name);
        eventSpeakers.push({
          name: sp.name,
          role: sp.role || "Speaker",
          title: sp.title || "Industry Executive",
          company: organization,
          image: sp.image || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80"
        });
      }
    });
  });

  if (eventSpeakers.length === 0) {
    eventSpeakers.push(
      { name: "Dr. Amel Bouraoui", role: "Keynote Speaker", title: "Director of Technology Strategy", company: "Global Research Institute", image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=300&q=80" },
      { name: "Karim Benali", role: "Executive Panelist", title: "Partner & Regional Lead", company: "Maghreb Ventures", image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80" },
      { name: "Sarah Jenkins", role: "Keynote Speaker", title: "VP of Enterprise Innovation", company: "Aura Technologies", image: "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=300&q=80" },
      { name: "Mohamed Arkab", role: "Distinguished Guest", title: "Senior Strategic Advisor", company: "Energy & Infrastructure Council", image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80" }
    );
  }

  // Dynamic Exhibitors
  const eventExhibitors = exhibitors.length > 0 ? exhibitors : [
    { id: "e1", name: "Sonatrach Energy Group", industry: "Energy & Hydrocarbons", booth: "Booth A-01", logo: "https://images.unsplash.com/photo-1560179707-f14e90ef3623?auto=format&fit=crop&w=200&q=80", description: "Pioneering sustainable energy transformation and continental pipeline networks." },
    { id: "e2", name: "Deutsche Industrial Tech", industry: "Engineering", booth: "Booth B-04", logo: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=200&q=80", description: "Automated process controls, high-voltage equipment, and IoT sensors." },
    { id: "e3", name: "Air Liquide & Hydrogen", industry: "Clean Tech", booth: "Booth C-12", logo: "https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=200&q=80", description: "Zero-emission industrial gas distribution and green hydrogen storage systems." },
    { id: "e4", name: "Maghreb Cloud Solutions", industry: "Software & IT", booth: "Booth D-08", logo: "https://images.unsplash.com/photo-1572021335469-31706a17aaef?auto=format&fit=crop&w=200&q=80", description: "Regional enterprise cloud hosting, data sovereign infrastructure, and AI analytics." }
  ];

  // Dynamic Sponsors
  const eventSponsors = sponsors.length > 0 ? sponsors : [
    { id: "sp1", name: "Sonatrach", tier: "Diamond", logo: "https://images.unsplash.com/photo-1560179707-f14e90ef3623?auto=format&fit=crop&w=200&q=80" },
    { id: "sp2", name: "TotalEnergies", tier: "Diamond", logo: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=200&q=80" },
    { id: "sp3", name: "Siemens Energy", tier: "Gold", logo: "https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=200&q=80" },
    { id: "sp4", name: "Société Générale", tier: "Gold", logo: "https://images.unsplash.com/photo-1572021335469-31706a17aaef?auto=format&fit=crop&w=200&q=80" },
    { id: "sp5", name: "Schneider Electric", tier: "Silver", logo: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=200&q=80" },
    { id: "sp6", name: "PwC Advisory", tier: "Silver", logo: "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=200&q=80" }
  ];

  // Dynamic Tickets
  const eventTickets = tickets.length > 0 ? tickets : [
    {
      id: "t1",
      name: "Standard Admission",
      price: 0,
      badge: "Free Pass",
      description: "Full access to keynote stages, general exhibition floor, and live sponsor showcases.",
      features: [
        "Access to Main Stage Keynotes",
        "Full Exhibition & Booths Access",
        "Digital Delegate Badge & Certificate",
        "Public Coffee & Networking Breaks"
      ]
    },
    {
      id: "t2",
      name: "VIP Access Pass",
      price: 250,
      badge: "Most Popular",
      popular: true,
      description: "Priority reserved seating, VIP lounge access, speaker networking lunch, and exclusive session recordings.",
      features: [
        "All Standard Admission Perks",
        "Front-Row Keynote Seating",
        "VIP Executive Networking Lounge",
        "Ministerial & Speaker Luncheon",
        "Full 4K Video Session Recordings"
      ]
    },
    {
      id: "t3",
      name: "Virtual Live Stream Pass",
      price: 50,
      badge: "Remote Access",
      description: "High-definition live interactive stream with real-time Q&A and digital presentation slides.",
      features: [
        "1080p HD Live Stream Feed",
        "Interactive Q&A with Panelists",
        "Downloadable Speaker Slide Decks",
        "30-Day On-Demand Archive Access"
      ]
    }
  ];

  const handleShare = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 3000);
    }
  };

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

  const handleRsvpSubmit = async (e) => {
    e.preventDefault();
    setRsvpLoading(true);

    try {
      if (onRegisterForEvent) {
        const pass = await onRegisterForEvent(eventId || eventDetails?.id, {
          name: rsvpName || currentUser?.fullName || "Attendee",
          email: rsvpEmail || currentUser?.email || "visitor@eventzone.io",
          ticketType: selectedTier,
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
            attendeeName: rsvpName,
            ticketType: selectedTier,
          });
          const url = await QRCode.toDataURL(qrData, { width: 200, margin: 1, color: { dark: "#0b5cdb", light: "#ffffff" } });
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

    try {
      await onSubmitFormResponse({
        formId: activeFeedbackForm.id,
        respondentName: currentUser?.fullName || "Conference Attendee",
        respondentEmail: currentUser?.email || "attendee@eventzone.io",
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
            <img src="https://i.imgur.com/jFDrQbM.png" alt="eventzone" className="h-7 w-auto object-contain" />
          </div>
        </div>

        {/* Center: In-Page Navigation Quick Links */}
        <nav className="hidden lg:flex items-center justify-center gap-7 text-xs font-bold text-slate-600 absolute left-1/2 -translate-x-1/2">
          <a href="#about" className="hover:text-blue-600 transition-colors">About</a>
          <a href="#speakers" className="hover:text-blue-600 transition-colors">Speakers</a>
          <a href="#schedule" className="hover:text-blue-600 transition-colors">Agenda</a>
          <a href="#floorplan" className="hover:text-blue-600 transition-colors">Floor Plan</a>
          <a href="#exhibitors" className="hover:text-blue-600 transition-colors">Exhibitors & Sponsors</a>
          <a href="#tickets" className="hover:text-blue-600 transition-colors">Tickets</a>
        </nav>

        {/* Right: Share, Feedback & Get Tickets Buttons */}
        <div className="flex items-center gap-2">
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
            onClick={() => {
              setSelectedTier(eventTickets[0]?.name || "Standard Admission");
              setShowRsvpModal(true);
              setRsvpSuccess(null);
            }}
            className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-600/20 transition-all cursor-pointer"
          >
            Get Tickets
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

          {/* Primary Call to Action Button */}
          <div className="pt-4">
            <a
              href="#tickets"
              className="inline-flex items-center gap-2.5 px-9 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-bold text-sm shadow-xl shadow-blue-600/40 transition-all cursor-pointer group"
            >
              <Ticket size={18} className="group-hover:rotate-12 transition-transform" />
              <span>Register Now</span>
              <ChevronRight size={16} />
            </a>
          </div>
        </div>
      </section>

      {/* ==================================================================== */}
      {/* 3. METRIC STATS STRIP                                                */}
      {/* ==================================================================== */}
      <section className="bg-white border-b border-slate-200 py-8">
        <div className="max-w-6xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          <div className="space-y-1">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900">{eventDetails?.capacity || 1200}+</span>
            <span className="text-xs text-slate-500 font-semibold block">Expected Delegates</span>
          </div>
          <div className="space-y-1">
            <span className="text-2xl sm:text-3xl font-extrabold text-blue-600">{eventSpeakers.length}+</span>
            <span className="text-xs text-slate-500 font-semibold block">Keynote Speakers</span>
          </div>
          <div className="space-y-1">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900">{eventExhibitors.length}+</span>
            <span className="text-xs text-slate-500 font-semibold block">Exhibitor Booths</span>
          </div>
          <div className="space-y-1">
            <span className="text-2xl sm:text-3xl font-extrabold text-blue-600">{eventSessions.length}+</span>
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
              onClick={() => {
                setSelectedTier("VIP Access Pass");
                setShowRsvpModal(true);
              }}
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
            <span className="text-xs font-extrabold text-blue-600 uppercase tracking-wider">World-Class Lineup</span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Featured Speakers & Keynotes
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 font-normal">
              Learn directly from leaders steering innovations and market strategies.
            </p>
          </div>

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
                    <span className="text-[11px] text-slate-500 block leading-tight mt-1">{speaker.title}</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200/70 w-full">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider truncate block">
                    {speaker.company}
                  </span>
                </div>
              </div>
            ))}
          </div>
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
              Curated Agenda & Sessions
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 font-normal">
              Explore keynote lectures, breakout technical panels, and networking tracks.
            </p>
          </div>

          {/* Day Filters */}
          <div className="flex items-center bg-white p-1 rounded-2xl border border-slate-200 shadow-xs">
            {["All", startDate, endDate].map((day, idx) => (
              <button
                key={idx}
                onClick={() => setSelectedDay(day)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  selectedDay === day ? "bg-blue-600 text-white shadow-xs" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {day === "All" ? "All Days" : `Day ${idx}`}
              </button>
            ))}
          </div>
        </div>

        {/* Sessions List */}
        <div className="space-y-4">
          {eventSessions
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
                        <span>{session.startTime} — {session.endTime}</span>
                      </span>

                      <span className="px-2.5 py-1 rounded-xl bg-slate-100 text-slate-600 text-xs font-semibold">
                        {session.date || startDate}
                      </span>
                    </div>

                    <h3 className="text-base sm:text-lg font-bold text-slate-900">{session.title}</h3>
                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
                      {session.description}
                    </p>

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
            })}
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
      <section id="exhibitors" className="py-16 bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-6 sm:px-8 space-y-10">
          <div className="text-center max-w-xl mx-auto space-y-2">
            <span className="text-xs font-extrabold text-blue-600 uppercase tracking-wider">Industrial Partners</span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Featured Exhibitors & Booths
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
                      {ex.booth || "Booth A1"}
                    </span>
                  </div>

                  <div>
                    <h4 className="text-sm font-bold text-slate-900">{ex.name}</h4>
                    <span className="text-[11px] text-blue-600 font-semibold block">{ex.industry || "Technology"}</span>
                    <p className="text-xs text-slate-500 line-clamp-2 mt-1.5 leading-relaxed">
                      {ex.description || "Leading solutions provider demonstrating novel enterprise architectures."}
                    </p>
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

      {/* ==================================================================== */}
      {/* 9. SPONSORS SHOWCASE                                                 */}
      {/* ==================================================================== */}
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
          {/* Diamond / Title Sponsors */}
          <div className="space-y-3">
            <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wider text-center block">
              Diamond Title Sponsors
            </span>
            <div className="flex flex-wrap items-center justify-center gap-6">
              {eventSponsors.filter(s => s.tier?.toLowerCase() === "diamond" || s.tier?.toLowerCase() === "title" || s.tier === "Diamond").map((sp, idx) => (
                <div key={idx} className="bg-white border border-slate-200 rounded-2xl px-8 py-5 flex items-center gap-3 shadow-xs hover:shadow-md transition-all">
                  <Building2 size={24} className="text-blue-600" />
                  <span className="text-sm font-extrabold text-slate-900">{sp.name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Gold & Silver Sponsors */}
          <div className="space-y-3">
            <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wider text-center block">
              Gold & Silver Partners
            </span>
            <div className="flex flex-wrap items-center justify-center gap-4">
              {eventSponsors.filter(s => s.tier?.toLowerCase() !== "diamond" && s.tier?.toLowerCase() !== "title" && s.tier !== "Diamond").map((sp, idx) => (
                <div key={idx} className="bg-white border border-slate-200 rounded-xl px-5 py-3 flex items-center gap-2 shadow-xs">
                  <span className="w-2 h-2 rounded-full bg-blue-500" />
                  <span className="text-xs font-bold text-slate-700">{sp.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

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

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {eventTickets.map((ticket, idx) => (
              <div
                key={ticket.id || idx}
                className={`rounded-3xl p-7 flex flex-col justify-between transition-all relative ${
                  ticket.popular
                    ? "bg-white border-2 border-blue-600 shadow-2xl ring-4 ring-blue-50"
                    : "bg-slate-50 border border-slate-200 hover:border-slate-300 shadow-xs"
                }`}
              >
                {ticket.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="px-3 py-1 rounded-full bg-blue-600 text-white font-extrabold text-[10px] uppercase shadow-sm">
                      {ticket.badge}
                    </span>
                  </div>
                )}

                <div className="space-y-5 text-left">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">{ticket.name}</h3>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">{ticket.description}</p>
                  </div>

                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-black text-slate-900">{ticket.price === 0 ? "Free" : `$${ticket.price}`}</span>
                    {ticket.price > 0 && <span className="text-xs text-slate-400 font-semibold">/ attendee</span>}
                  </div>

                  <div className="space-y-2.5 pt-4 border-t border-slate-200/80">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">What&apos;s Included</span>
                    {ticket.features.map((feat, fIdx) => (
                      <div key={fIdx} className="flex items-start gap-2 text-xs text-slate-700 font-medium">
                        <Check size={14} className="text-emerald-600 shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-6 mt-6 border-t border-slate-200/80">
                  <button
                    onClick={() => {
                      setSelectedTier(ticket.name);
                      setShowRsvpModal(true);
                      setRsvpSuccess(null);
                    }}
                    className={`w-full py-3.5 rounded-2xl font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer ${
                      ticket.popular
                        ? "bg-blue-600 hover:bg-blue-700 text-white shadow-blue-600/30"
                        : "bg-slate-900 hover:bg-slate-800 text-white"
                    }`}
                  >
                    <Ticket size={15} />
                    <span>Select &amp; Register</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
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
                <img src="https://i.imgur.com/jFDrQbM.png" alt="eventzone" className="h-7 w-auto object-contain brightness-0 invert" />
                <span className="px-2.5 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-[10px] font-extrabold uppercase tracking-wider">
                  Eventzone Platform
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-400 max-w-md leading-relaxed">
                Empowering world-class conferences, trade expos, and summits with interactive 2D floor plans, digital badge registrations, and real-time attendee management.
              </p>
              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 font-medium">
                <div className="flex items-center gap-1.5 text-emerald-400">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="font-bold">Live Registration Active</span>
                </div>
                <span>•</span>
                <span>ISO 27001 &amp; GDPR Compliant</span>
              </div>
            </div>

            {/* Newsletter Subscription Box */}
            <div className="lg:col-span-6 bg-slate-900/90 border border-slate-800 rounded-3xl p-6 text-left space-y-3">
              <div className="flex items-center gap-2 text-white font-bold text-sm">
                <Sparkles size={16} className="text-blue-400" />
                <span>Stay Informed on Upcoming Summits</span>
              </div>
              <p className="text-xs text-slate-400">
                Receive keynote speaker announcements, floor plan updates, and early delegate passes.
              </p>
              <form onSubmit={(e) => { e.preventDefault(); alert("Thank you for subscribing to summit updates!"); }} className="flex flex-col sm:flex-row gap-2 pt-1">
                <input
                  type="email"
                  required
                  placeholder="Enter your work email"
                  className="flex-1 px-4 py-2.5 bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl text-xs font-semibold text-white placeholder-slate-500 outline-none transition-all"
                />
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-600/30 shrink-0 cursor-pointer"
                >
                  Subscribe
                </button>
              </form>
            </div>
          </div>

          {/* Middle Row: Multi-Column Links */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-left text-xs">
            <div className="space-y-3">
              <h4 className="text-xs font-extrabold text-white uppercase tracking-wider">This Event</h4>
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
                <li><button onClick={() => { setSelectedTier("VIP Access Pass"); setShowRsvpModal(true); }} className="hover:text-white transition-colors text-left cursor-pointer">Become a Sponsor</button></li>
                <li><button onClick={() => { setSelectedTier("Standard Admission"); setShowRsvpModal(true); }} className="hover:text-white transition-colors text-left cursor-pointer">Exhibitor Inquiries</button></li>
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
      {/* 12. RSVP / REGISTRATION MODAL                                        */}
      {/* ==================================================================== */}
      {showRsvpModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fade-in font-sans">
          <div className="bg-white border border-slate-200 w-full max-w-md rounded-3xl shadow-2xl p-6 sm:p-7 text-slate-900">
            {rsvpSuccess ? (
              <div className="text-center py-4 space-y-4 animate-fade-in">
                <div className="w-14 h-14 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-200">
                  <CheckCircle2 size={32} />
                </div>
                <h3 className="text-xl font-bold text-slate-900">Registration Confirmed!</h3>
                <p className="text-xs text-slate-500 max-w-xs mx-auto">
                  Your digital pass for <strong>{title}</strong> is active.
                </p>

                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-left text-xs space-y-1.5">
                  <div className="flex justify-between"><span className="text-slate-500">Attendee:</span> <span className="font-bold text-slate-900">{rsvpName}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">Tier:</span> <span className="font-bold text-blue-600">{selectedTier}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">Badge Code:</span> <span className="font-mono font-bold text-slate-900">{rsvpSuccess.badgeCode}</span></div>
                </div>

                {qrCodeUrl && (
                  <div className="w-32 h-32 bg-white p-2 border border-slate-200 rounded-2xl mx-auto shadow-xs flex items-center justify-center">
                    <img src={qrCodeUrl} alt="QR Badge" className="w-full h-full object-contain" />
                  </div>
                )}

                <button
                  onClick={() => setShowRsvpModal(false)}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-600/20"
                >
                  Done
                </button>
              </div>
            ) : (
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
                  <div className="flex items-center gap-2">
                    <Ticket size={18} className="text-blue-600" />
                    <h3 className="text-base font-bold text-slate-900">Register for Event</h3>
                  </div>
                  <button 
                    onClick={() => setShowRsvpModal(false)}
                    className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
                  >
                    <X size={16} />
                  </button>
                </div>

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
                      Selected Pass Tier
                    </label>
                    <div className="px-3.5 py-2.5 bg-blue-50/60 border border-blue-200 rounded-xl text-xs font-bold text-blue-900">
                      {selectedTicket?.name || "General Admission"}
                    </div>
                  </div>
                  {/* Dynamic Custom Registration Questions from Form Builder */}
                  {activeTicketForm && activeTicketForm.fields && activeTicketForm.fields.length > 0 && (
                    <div className="border-t border-slate-100 pt-3 space-y-3">
                      <div className="text-[10px] font-extrabold uppercase text-blue-600 tracking-wider">
                        {activeTicketForm.title}
                      </div>

                      {activeTicketForm.fields.map(field => {
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
                            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                              {field.label} {field.required && <span className="text-rose-500">*</span>}
                            </label>

                            {["text", "email", "number"].includes(field.type) && (
                              <input
                                type={field.type}
                                required={field.required}
                                value={customAnswers[field.id] || ""}
                                onChange={(e) => setCustomAnswers(prev => ({ ...prev, [field.id]: e.target.value }))}
                                placeholder={field.placeholder || "Enter details..."}
                                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 focus:border-blue-600 focus:bg-white rounded-xl text-xs font-semibold text-slate-900 outline-none transition-all"
                              />
                            )}

                            {field.type === "textarea" && (
                              <textarea
                                required={field.required}
                                rows={2}
                                value={customAnswers[field.id] || ""}
                                onChange={(e) => setCustomAnswers(prev => ({ ...prev, [field.id]: e.target.value }))}
                                placeholder={field.placeholder || "Enter details..."}
                                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 focus:border-blue-600 focus:bg-white rounded-xl text-xs font-medium text-slate-900 outline-none transition-all"
                              />
                            )}

                            {field.type === "select" && (
                              <select
                                required={field.required}
                                value={customAnswers[field.id] || ""}
                                onChange={(e) => setCustomAnswers(prev => ({ ...prev, [field.id]: e.target.value }))}
                                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 focus:border-blue-600 rounded-xl text-xs font-semibold text-slate-900 outline-none cursor-pointer"
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

                  <button
                    type="submit"
                    disabled={rsvpLoading}
                    className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-2"
                  >
                    {rsvpLoading ? (
                      <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <span>Confirm &amp; Generate QR Pass</span>
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
    </div>
  );
}
