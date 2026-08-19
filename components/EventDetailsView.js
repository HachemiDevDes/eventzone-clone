"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { 
  Calendar, MapPin, Globe, Check, Loader2,
  ExternalLink, Upload, Trash2, Plus, Users, Tag, 
  Building2, Mail, Phone, FileText, Image as ImageIcon, 
  Clock, Sparkles, AlertCircle, Cloud, CheckCircle2,
  CalendarDays, CalendarRange
} from "lucide-react";
import CustomDatePicker from "./CustomDatePicker";
import CustomSchedulePicker from "./CustomSchedulePicker";

const EVENT_CATEGORIES = [
  "Technology & AI",
  "Energy, Oil & Gas",
  "FinTech & Banking",
  "Healthcare & MedTech",
  "Startup & Venture",
  "E-Commerce & Retail",
  "Manufacturing & Industry",
  "Education & EdTech",
  "CleanTech & Sustainability",
  "Creative & Design"
];

const EVENT_TYPES = [
  { id: "In-Person", label: "In-Person", desc: "Physical on-site attendance only" },
  { id: "Hybrid", label: "Hybrid", desc: "Both in-person venue & virtual live stream" },
  { id: "Virtual", label: "Virtual", desc: "100% online streaming & digital expo" }
];

export default function EventDetailsView({ 
  eventDetails, 
  onUpdateEventDetails, 
  onPreviewLandingPage,
  onUploadFile 
}) {
  // Local Form State
  const [title, setTitle] = useState(eventDetails?.title || "");
  const [tagline, setTagline] = useState(eventDetails?.tagline || "");
  const [category, setCategory] = useState(eventDetails?.category || EVENT_CATEGORIES[0]);
  const [type, setType] = useState(eventDetails?.type || "In-Person");
  
  // Date configuration
  const [startDate, setStartDate] = useState(eventDetails?.startDate || "");
  const [endDate, setEndDate] = useState(eventDetails?.endDate || "");
  const [isMultiDay, setIsMultiDay] = useState(
    Boolean(eventDetails?.endDate && eventDetails?.startDate && eventDetails.endDate !== eventDetails.startDate)
  );

  const [scheduleTime, setScheduleTime] = useState(eventDetails?.scheduleTime || "09:00 AM – 05:00 PM");
  const [location, setLocation] = useState(eventDetails?.location || "");
  const [venueAddress, setVenueAddress] = useState(eventDetails?.venueAddress || "");
  const [description, setDescription] = useState(eventDetails?.description || "");
  const [banner, setBanner] = useState(eventDetails?.banner || "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200&auto=format&fit=crop&q=80");
  const [capacity, setCapacity] = useState(eventDetails?.capacity || 500);
  const [organizerName, setOrganizerName] = useState(eventDetails?.organizerName || "Eventzone");
  const [contactEmail, setContactEmail] = useState(eventDetails?.contactEmail || "");
  const [contactPhone, setContactPhone] = useState(eventDetails?.contactPhone || "");
  const [websiteUrl, setWebsiteUrl] = useState(eventDetails?.websiteUrl || "");
  
  // Gallery images
  const [galleryImages, setGalleryImages] = useState(
    Array.isArray(eventDetails?.gallery) && eventDetails.gallery.length > 0 
      ? eventDetails.gallery 
      : [
          "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1000&auto=format&fit=crop&q=80",
          "https://images.unsplash.com/photo-1511578314322-379afb476865?w=1000&auto=format&fit=crop&q=80",
          "https://images.unsplash.com/photo-1475721027785-f74eccf877e2?w=1000&auto=format&fit=crop&q=80"
        ]
  );
  const [newGalleryUrl, setNewGalleryUrl] = useState("");

  // Tab Selection: "general" | "schedule" | "media" | "contact"
  const [activeTab, setActiveTab] = useState("general");

  // Real-Time Auto-Save Status: "idle" | "saving" | "saved"
  const [syncStatus, setSyncStatus] = useState("saved");
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [uploadingGallery, setUploadingGallery] = useState(false);

  const bannerFileInputRef = useRef(null);
  const galleryFileInputRef = useRef(null);
  const isInitialMount = useRef(true);
  const autoSaveTimerRef = useRef(null);
  const lastSavedPayloadRef = useRef("");

  // Synchronize when incoming eventDetails change externally
  useEffect(() => {
    if (eventDetails) {
      setTitle(eventDetails.title || "");
      setTagline(eventDetails.tagline || "");
      setCategory(eventDetails.category || EVENT_CATEGORIES[0]);
      setType(eventDetails.type || "In-Person");
      setStartDate(eventDetails.startDate || "");
      setEndDate(eventDetails.endDate || "");
      setIsMultiDay(Boolean(eventDetails.endDate && eventDetails.startDate && eventDetails.endDate !== eventDetails.startDate));
      setScheduleTime(eventDetails.scheduleTime || "09:00 AM – 05:00 PM");
      setLocation(eventDetails.location || "");
      setVenueAddress(eventDetails.venueAddress || "");
      setDescription(eventDetails.description || "");
      setBanner(eventDetails.banner || "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200&auto=format&fit=crop&q=80");
      setCapacity(eventDetails.capacity || 500);
      setOrganizerName(eventDetails.organizerName || "Eventzone");
      setContactEmail(eventDetails.contactEmail || "");
      setContactPhone(eventDetails.contactPhone || "");
      setWebsiteUrl(eventDetails.websiteUrl || "");
      if (Array.isArray(eventDetails.gallery) && eventDetails.gallery.length > 0) {
        setGalleryImages(eventDetails.gallery);
      }
      lastSavedPayloadRef.current = JSON.stringify({
        title: eventDetails.title || "",
        tagline: eventDetails.tagline || "",
        category: eventDetails.category || EVENT_CATEGORIES[0],
        type: eventDetails.type || "In-Person",
        startDate: eventDetails.startDate || "",
        endDate: eventDetails.endDate || "",
        scheduleTime: eventDetails.scheduleTime || "09:00 AM – 05:00 PM",
        location: eventDetails.location || "",
        venueAddress: eventDetails.venueAddress || "",
        description: eventDetails.description || "",
        banner: eventDetails.banner || "",
        capacity: Number(eventDetails.capacity) || 500,
        organizerName: eventDetails.organizerName || "Eventzone",
        contactEmail: eventDetails.contactEmail || "",
        contactPhone: eventDetails.contactPhone || "",
        websiteUrl: eventDetails.websiteUrl || "",
        gallery: eventDetails.gallery || []
      });
    }
  }, [eventDetails?.id]); // Only re-init when switching events

  // Construct current payload
  const buildPayload = useCallback(() => {
    const finalEndDate = isMultiDay ? endDate : startDate;
    return {
      ...eventDetails,
      title,
      tagline,
      category,
      type,
      startDate,
      endDate: finalEndDate,
      scheduleTime,
      location,
      venueAddress,
      description,
      banner,
      cover_url: banner,
      capacity: Number(capacity) || 500,
      organizerName,
      contactEmail,
      contactPhone,
      websiteUrl,
      gallery: galleryImages
    };
  }, [
    eventDetails, title, tagline, category, type, startDate, endDate, isMultiDay,
    scheduleTime, location, venueAddress, description, banner, 
    capacity, organizerName, contactEmail, contactPhone, websiteUrl, galleryImages
  ]);

  // Real-time Debounced Auto-Save Trigger
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    const currentPayload = buildPayload();
    const currentJson = JSON.stringify(currentPayload);

    // Skip if nothing actually changed
    if (currentJson === lastSavedPayloadRef.current) {
      return;
    }

    setSyncStatus("saving");

    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }

    autoSaveTimerRef.current = setTimeout(async () => {
      try {
        if (onUpdateEventDetails) {
          await onUpdateEventDetails(currentPayload);
        }
        lastSavedPayloadRef.current = currentJson;
        setSyncStatus("saved");
      } catch (err) {
        console.error("Real-time autosave error:", err);
        setSyncStatus("saved");
      }
    }, 450); // 450ms debounce for instantaneous feel with optimal network usage

    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [
    title, tagline, category, type, startDate, endDate, isMultiDay,
    scheduleTime, location, venueAddress, description, banner, 
    capacity, organizerName, contactEmail, contactPhone, websiteUrl, galleryImages,
    buildPayload, onUpdateEventDetails
  ]);

  // Upload Banner Photo from Computer (Immediate Auto-Save)
  const handleBannerUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingBanner(true);
    setSyncStatus("saving");
    try {
      let publicUrl = null;
      if (onUploadFile) {
        publicUrl = await onUploadFile(file, 'floor-plans');
      } else {
        publicUrl = await uploadFileToBucket(file, 'floor-plans');
      }

      if (publicUrl) {
        setBanner(publicUrl);
        const payload = { ...buildPayload(), banner: publicUrl, cover_url: publicUrl };
        if (onUpdateEventDetails) {
          await onUpdateEventDetails(payload);
        }
        lastSavedPayloadRef.current = JSON.stringify(payload);
        setSyncStatus("saved");
      }
    } catch (err) {
      console.error("Banner upload error:", err);
      alert("Failed to upload banner image. Please try again.");
    } finally {
      setUploadingBanner(false);
      if (bannerFileInputRef.current) bannerFileInputRef.current.value = "";
    }
  };

  // Upload Gallery Photo from Computer (Immediate Auto-Save)
  const handleGalleryUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingGallery(true);
    setSyncStatus("saving");
    try {
      let publicUrl = null;
      if (onUploadFile) {
        publicUrl = await onUploadFile(file, 'floor-plans');
      } else {
        publicUrl = await uploadFileToBucket(file, 'floor-plans');
      }

      if (publicUrl) {
        const updated = [...galleryImages, publicUrl];
        setGalleryImages(updated);
        const payload = { ...buildPayload(), gallery: updated };
        if (onUpdateEventDetails) {
          await onUpdateEventDetails(payload);
        }
        lastSavedPayloadRef.current = JSON.stringify(payload);
        setSyncStatus("saved");
      }
    } catch (err) {
      console.error("Gallery upload error:", err);
      alert("Failed to upload image. Please try again.");
    } finally {
      setUploadingGallery(false);
      if (galleryFileInputRef.current) galleryFileInputRef.current.value = "";
    }
  };

  // Add Gallery URL (Immediate Auto-Save)
  const handleAddGalleryUrl = async (e) => {
    e.preventDefault();
    const clean = newGalleryUrl.trim();
    if (!clean) return;
    const updated = [...galleryImages, clean];
    setGalleryImages(updated);
    setNewGalleryUrl("");
    setSyncStatus("saving");
    try {
      const payload = { ...buildPayload(), gallery: updated };
      if (onUpdateEventDetails) {
        await onUpdateEventDetails(payload);
      }
      lastSavedPayloadRef.current = JSON.stringify(payload);
      setSyncStatus("saved");
    } catch (err) {
      console.error("Gallery URL save error:", err);
    }
  };

  // Remove Gallery Image (Immediate Auto-Save)
  const handleRemoveGalleryImage = async (idxToRemove) => {
    const updated = galleryImages.filter((_, idx) => idx !== idxToRemove);
    setGalleryImages(updated);
    setSyncStatus("saving");
    try {
      const payload = { ...buildPayload(), gallery: updated };
      if (onUpdateEventDetails) {
        await onUpdateEventDetails(payload);
      }
      lastSavedPayloadRef.current = JSON.stringify(payload);
      setSyncStatus("saved");
    } catch (err) {
      console.error("Gallery remove save error:", err);
    }
  };

  return (
    <div className="space-y-6 w-full text-left pb-12 animate-fade-in font-sans">
      {/* Hidden File Inputs */}
      <input
        type="file"
        ref={bannerFileInputRef}
        accept="image/png, image/jpeg, image/jpg, image/webp"
        onChange={handleBannerUpload}
        className="hidden"
      />
      <input
        type="file"
        ref={galleryFileInputRef}
        accept="image/png, image/jpeg, image/jpg, image/webp"
        onChange={handleGalleryUpload}
        className="hidden"
      />

      {/* Top Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-1 pb-2">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Event Details
          </h1>
          <p className="text-sm text-slate-500">
            Manage your summit schedule, venue location, media assets, and event information.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Real-time sync status indicator badge */}
          <div className="flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-white border border-slate-200 text-xs font-semibold select-none shadow-2xs">
            {syncStatus === "saving" ? (
              <span className="flex items-center gap-1.5 text-blue-600">
                <Loader2 size={12} className="animate-spin" />
                <span>Saving in real time...</span>
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-emerald-700">
                <CheckCircle2 size={12} className="text-emerald-600" />
                <span>All changes saved</span>
              </span>
            )}
          </div>

          {onPreviewLandingPage && (
            <button
              type="button"
              onClick={onPreviewLandingPage}
              className="px-4 py-2.5 rounded-2xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-bold transition-all cursor-pointer shadow-2xs flex items-center gap-1.5"
            >
              <ExternalLink size={13} />
              <span>Preview Landing Page</span>
            </button>
          )}
        </div>
      </div>

      {/* Clean Segmented Tab Selector */}
      <div className="flex items-center justify-start">
        <div className="flex items-center gap-1 p-1 bg-white border border-slate-200 rounded-2xl w-full sm:w-auto shadow-2xs">
          <button
            type="button"
            onClick={() => setActiveTab("general")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === "general"
                ? "bg-blue-600 text-white shadow-xs"
                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            }`}
          >
            General Information
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("schedule")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === "schedule"
                ? "bg-blue-600 text-white shadow-xs"
                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            }`}
          >
            Date &amp; Venue
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("media")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === "media"
                ? "bg-blue-600 text-white shadow-xs"
                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            }`}
          >
            Media &amp; Gallery
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("contact")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === "contact"
                ? "bg-blue-600 text-white shadow-xs"
                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            }`}
          >
            Organizer &amp; Contact
          </button>
        </div>
      </div>

      {/* Form Content Card */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
            
            {/* TAB 1: GENERAL INFORMATION */}
            {activeTab === "general" && (
              <div className="space-y-6 animate-fade-in">
                <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                  <div>
                    <h2 className="text-sm font-bold text-slate-900">General Summit Details</h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Core event identity, title, domain category, and attendee overview.
                    </p>
                  </div>
                  <span className="text-[11px] font-medium text-slate-400">Autosaves on change</span>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-700 flex items-center gap-1">
                    <span>Event Title</span>
                    <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Algiers Tech Summit 2026"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 font-semibold placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-700">Tagline / Short Hook</label>
                  <input
                    type="text"
                    value={tagline}
                    onChange={(e) => setTagline(e.target.value)}
                    placeholder="e.g. The Premier Gathering for AI Leaders, Founders &amp; Venture Investors"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-medium placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-700">Category / Domain</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-medium focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
                    >
                      {EVENT_CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-700">Target Attendance Capacity</label>
                    <input
                      type="number"
                      min="1"
                      value={capacity}
                      onChange={(e) => setCapacity(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-medium focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
                    />
                  </div>
                </div>

                {/* Event Format / Attendance Type */}
                <div className="space-y-2">
                  <label className="text-xs font-medium text-slate-700">Attendance Format</label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {EVENT_TYPES.map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setType(t.id)}
                        className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                          type === t.id
                            ? "bg-blue-50/60 border-blue-500 text-blue-900 shadow-2xs"
                            : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        <span className="text-xs font-bold block">{t.label}</span>
                        <span className="text-[11px] text-slate-500 block mt-0.5">{t.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-700">About the Event / Full Description</label>
                  <textarea
                    rows={6}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Provide a comprehensive summary of the summit, key tracks, keynote topics, networking highlights, and attendee takeaways..."
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-medium placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition-all resize-none leading-relaxed"
                  />
                </div>
              </div>
            )}

            {/* TAB 2: DATES & VENUE */}
            {activeTab === "schedule" && (
              <div className="space-y-6 animate-fade-in">
                <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                  <div>
                    <h2 className="text-sm font-bold text-slate-900">Schedule &amp; Physical Venue</h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Define whether this event is a single day or multi-day summit, dates, and venue location.
                    </p>
                  </div>
                  <span className="text-[11px] font-medium text-slate-400">Autosaves on change</span>
                </div>

                {/* Single Date vs Multiple Dates Option */}
                <div className="space-y-2">
                  <label className="text-xs font-medium text-slate-700">Event Duration Format</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setIsMultiDay(false);
                        setEndDate(startDate);
                      }}
                      className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                        !isMultiDay
                          ? "bg-blue-50/60 border-blue-500 text-blue-900 shadow-2xs"
                          : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      <span className="text-xs font-bold block">Single Date Event</span>
                      <span className="text-[11px] text-slate-500 block mt-0.5">
                        Happens on one specific calendar day
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setIsMultiDay(true);
                      }}
                      className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                        isMultiDay
                          ? "bg-blue-50/60 border-blue-500 text-blue-900 shadow-2xs"
                          : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      <span className="text-xs font-bold block">Multiple Dates Event</span>
                      <span className="text-[11px] text-slate-500 block mt-0.5">
                        Multi-day convention spanning a date range
                      </span>
                    </button>
                  </div>
                </div>

                {/* Date Input(s) */}
                {!isMultiDay ? (
                  /* Single Day Picker */
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-700">Event Date</label>
                    <CustomDatePicker
                      value={startDate}
                      onChange={(val) => {
                        setStartDate(val);
                        setEndDate(val);
                      }}
                      placeholder="Select event date"
                    />
                  </div>
                ) : (
                  /* Multi-Day Range Pickers */
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-slate-700">Start Date</label>
                      <CustomDatePicker
                        value={startDate}
                        onChange={(val) => setStartDate(val)}
                        placeholder="Select start date"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-slate-700">End Date</label>
                      <CustomDatePicker
                        value={endDate}
                        minDate={startDate || undefined}
                        onChange={(val) => setEndDate(val)}
                        placeholder="Select end date"
                        align="right"
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-700">Daily Schedule / Working Hours</label>
                  <CustomSchedulePicker
                    value={scheduleTime}
                    onChange={(val) => setScheduleTime(val)}
                    placeholder="e.g. 09:00 AM – 05:30 PM"
                  />
                </div>

                <div className="space-y-1.5 pt-3 border-t border-slate-100">
                  <label className="text-xs font-medium text-slate-700">Venue / Convention Center Name</label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g. Algiers International Conference Center (CIC), Club des Pins"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-medium placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-700">Detailed Physical Address</label>
                  <input
                    type="text"
                    value={venueAddress}
                    onChange={(e) => setVenueAddress(e.target.value)}
                    placeholder="e.g. Route Nationale 11, Staoueli, Algiers, Algeria"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-medium placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
                  />
                </div>
              </div>
            )}

            {/* TAB 3: MEDIA & GALLERY */}
            {activeTab === "media" && (
              <div className="space-y-6 animate-fade-in">
                <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                  <div>
                    <h2 className="text-sm font-bold text-slate-900">Event Media &amp; Imagery</h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Upload your high-definition cover banner and photo gallery assets.
                    </p>
                  </div>
                  <span className="text-[11px] font-medium text-slate-400">Autosaves on change</span>
                </div>

                {/* Main Banner Cover */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-medium text-slate-700">
                      Main Banner / Cover Photo
                    </label>
                    <button
                      type="button"
                      onClick={() => bannerFileInputRef.current?.click()}
                      disabled={uploadingBanner}
                      className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-colors cursor-pointer shadow-xs disabled:opacity-50"
                    >
                      {uploadingBanner ? "Uploading..." : "Upload Desktop Image"}
                    </button>
                  </div>

                  <div className="relative h-48 sm:h-56 rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 group">
                    <img
                      src={banner || "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200&auto=format&fit=crop&q=80"}
                      alt="Banner Preview"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => bannerFileInputRef.current?.click()}
                        className="px-3.5 py-2 rounded-xl bg-white text-slate-900 text-xs font-semibold shadow-md hover:bg-slate-100 transition-colors cursor-pointer"
                      >
                        Change Photo
                      </button>
                    </div>
                  </div>

                  <input
                    type="url"
                    value={banner}
                    onChange={(e) => setBanner(e.target.value)}
                    placeholder="Or paste external banner image URL..."
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition-all font-mono"
                  />
                </div>

                {/* Event Photo Gallery */}
                <div className="space-y-4 pt-4 border-t border-slate-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-xs font-medium text-slate-700 block">
                        Event Photo Gallery ({galleryImages.length})
                      </label>
                      <span className="text-[11px] text-slate-400">
                        Photos displayed on the public landing page
                      </span>
                    </div>
                    
                    <button
                      type="button"
                      onClick={() => galleryFileInputRef.current?.click()}
                      disabled={uploadingGallery}
                      className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-colors cursor-pointer shadow-xs disabled:opacity-50"
                    >
                      {uploadingGallery ? "Uploading..." : "Upload Photo"}
                    </button>
                  </div>

                  <form onSubmit={handleAddGalleryUrl} className="flex gap-2">
                    <input
                      type="url"
                      value={newGalleryUrl}
                      onChange={(e) => setNewGalleryUrl(e.target.value)}
                      placeholder="Or paste image URL to add..."
                      className="flex-1 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
                    />
                    <button
                      type="submit"
                      className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer shrink-0"
                    >
                      Add URL
                    </button>
                  </form>

                  {/* Thumbnail Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-64 overflow-y-auto pr-1">
                    {galleryImages.map((imgUrl, idx) => (
                      <div key={idx} className="flex items-center justify-between gap-3 p-2.5 bg-slate-50 border border-slate-200 rounded-2xl">
                        <div className="flex items-center gap-3 min-w-0">
                          <img
                            src={imgUrl}
                            alt={`Gallery ${idx}`}
                            className="w-12 h-12 rounded-xl object-cover border border-slate-200 shrink-0"
                          />
                          <span className="text-xs text-slate-600 truncate font-mono">
                            {imgUrl}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveGalleryImage(idx)}
                          className="px-2 py-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl font-bold text-sm transition-colors cursor-pointer shrink-0"
                          title="Remove photo"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                    {galleryImages.length === 0 && (
                      <p className="col-span-full text-xs text-slate-400 py-6 text-center italic">
                        No gallery photos added yet.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 4: ORGANIZER & CONTACT */}
            {activeTab === "contact" && (
              <div className="space-y-6 animate-fade-in">
                <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                  <div>
                    <h2 className="text-sm font-bold text-slate-900">Organizer Entity &amp; Support Contact</h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Contact information displayed on delegate registration and passes.
                    </p>
                  </div>
                  <span className="text-[11px] font-medium text-slate-400">Autosaves on change</span>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-700">Organizer / Host Entity Name</label>
                  <input
                    type="text"
                    value={organizerName}
                    onChange={(e) => setOrganizerName(e.target.value)}
                    placeholder="e.g. Ministry of Industry / Eventzone Global"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-medium placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-700">Inquiries &amp; Support Email</label>
                    <input
                      type="email"
                      value={contactEmail}
                      onChange={(e) => setContactEmail(e.target.value)}
                      placeholder="e.g. contact@eventzone.pro"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-medium placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-700">Phone / WhatsApp Support</label>
                    <input
                      type="tel"
                      value={contactPhone}
                      onChange={(e) => setContactPhone(e.target.value)}
                      placeholder="e.g. +213 781 457 511"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-medium placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-700">Official Summit Website URL</label>
                  <input
                    type="url"
                    value={websiteUrl}
                    onChange={(e) => setWebsiteUrl(e.target.value)}
                    placeholder="e.g. https://eventzone.pro/summit-2026"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-medium placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
                  />
                </div>
              </div>
            )}

            {/* Bottom Real-Time Status Bar */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${syncStatus === "saving" ? "bg-blue-500 animate-ping" : "bg-emerald-500"}`} />
                <span className="text-xs text-slate-500 font-medium">
                  {syncStatus === "saving" 
                    ? "Saving changes in real time..." 
                    : "All changes are automatically synchronized."}
                </span>
              </div>

              <span className="text-[11px] text-slate-400">
                No manual saving needed
              </span>
            </div>
          </div>
        </div>
    );
}
