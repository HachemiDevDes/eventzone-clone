/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useState } from "react";
import { 
  Building2, Plus, Search, Calendar, MapPin, 
  Users, BarChart3, ArrowRight, ExternalLink, 
  Trash2, Globe, Sparkles, LayoutDashboard, Layers, Filter, CheckCircle2, Home
} from "lucide-react";

export default function OrganizerEventsHub({ 
  events = [], 
  onSelectEvent, 
  onCreateEventClick, 
  onDeleteEvent,
  onSwitchToVisitor,
  onGoToHome,
  onSignOut,
  user
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all"); // "all" | "published" | "draft"

  const filteredEvents = events.filter(ev => {
    const matchesSearch = (ev.title || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (ev.location || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (ev.category || "").toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || (ev.status || "published") === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalAttendees = events.reduce((acc, ev) => acc + (ev.attendeeCount || 4), 0);
  const totalPublished = events.filter(e => (e.status || "published") === "published").length;

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans">
      {/* Top SaaS Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-3.5 sticky top-0 z-50 flex items-center justify-between shadow-xs">
        {/* Left: Eventzone Logo in original colors + Navigation */}
        <div className="flex items-center gap-4">
          <div onClick={onGoToHome} className="cursor-pointer select-none flex items-center gap-2">
            <img src="https://i.imgur.com/jFDrQbM.png" alt="eventzone" className="h-7 w-auto object-contain" />
          </div>

          <div className="h-5 w-px bg-slate-200" />

          <button 
            onClick={onGoToHome} 
            className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-blue-600 transition-colors p-1.5 rounded-xl hover:bg-slate-50 cursor-pointer"
            title="Back to Public Home Page"
          >
            <Home size={14} />
            <span className="hidden sm:inline">Public Home</span>
          </button>
          
          <span className="text-[11px] font-extrabold uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-100">
            Organizer Hub
          </span>
        </div>

        {/* Right: User Actions & Profile */}
        <div className="flex items-center gap-3">
          <button
            onClick={onSwitchToVisitor}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition-all cursor-pointer"
            title="Switch to Attendee / Visitor portal"
          >
            <Users size={14} className="text-emerald-600" />
            <span>Switch to Visitor Mode</span>
          </button>

          <button
            onClick={onCreateEventClick}
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-600/20 transition-all cursor-pointer"
          >
            <Plus size={15} />
            <span>Create Event</span>
          </button>

          <div className="h-6 w-px bg-slate-200 mx-1" />

          {/* User Profile Pill */}
          <div className="flex items-center gap-2.5 pl-1">
            <img 
              src={user?.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80"} 
              alt={user?.fullName || "User"} 
              className="w-8 h-8 rounded-full object-cover border border-slate-200"
            />
            <div className="hidden sm:flex flex-col text-left">
              <span className="text-xs font-bold text-slate-800 leading-tight">{user?.fullName || "Organizer"}</span>
              <span className="text-[10px] text-slate-400 font-medium">Organizer</span>
            </div>
            <button
              onClick={onSignOut}
              className="text-xs text-rose-500 hover:text-rose-700 font-bold ml-2 cursor-pointer"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 sm:p-8 space-y-8">
        {/* Welcome & Top Metric Cards */}
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Organizer Event Center
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
                Manage your hosted conferences, custom floor plans, agendas, and door check-ins.
              </p>
            </div>

            <button
              onClick={onCreateEventClick}
              className="self-start sm:self-auto flex items-center gap-2 px-5 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl text-xs font-bold shadow-lg shadow-blue-600/30 transition-all cursor-pointer group"
            >
              <Sparkles size={16} className="group-hover:rotate-12 transition-transform" />
              <span>+ Host New Event</span>
            </button>
          </div>

          {/* Metric Cards Row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Hosted Events</span>
                <h3 className="text-2xl font-black text-slate-900 mt-1">{events.length}</h3>
                <span className="text-[11px] font-semibold text-blue-600 mt-0.5 inline-block">{totalPublished} Published</span>
              </div>
              <div className="w-11 h-11 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600">
                <Building2 size={20} />
              </div>
            </div>

            <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Registered</span>
                <h3 className="text-2xl font-black text-slate-900 mt-1">{totalAttendees}</h3>
                <span className="text-[11px] font-semibold text-emerald-600 mt-0.5 inline-block">Across all summits</span>
              </div>
              <div className="w-11 h-11 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                <Users size={20} />
              </div>
            </div>

            <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Est. Revenue</span>
                <h3 className="text-2xl font-black text-slate-900 mt-1">$400</h3>
                <span className="text-[11px] font-semibold text-slate-500 mt-0.5 inline-block">VIP & Standard</span>
              </div>
              <div className="w-11 h-11 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600">
                <BarChart3 size={20} />
              </div>
            </div>

            <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Active Floor Plans</span>
                <h3 className="text-2xl font-black text-slate-900 mt-1">2</h3>
                <span className="text-[11px] font-semibold text-blue-600 mt-0.5 inline-block">With 2D editor</span>
              </div>
              <div className="w-11 h-11 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600">
                <Layers size={20} />
              </div>
            </div>
          </div>
        </div>

        {/* Search & Filter Row */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
          {/* Search Bar */}
          <div className="relative w-full sm:w-80">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search events by title or city..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 placeholder-slate-400 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition-all shadow-xs"
            />
          </div>

          {/* Status Filter Tabs */}
          <div className="flex items-center bg-white p-1 rounded-xl border border-slate-200 shadow-xs self-stretch sm:self-auto">
            <button
              onClick={() => setStatusFilter("all")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                statusFilter === "all" ? "bg-blue-600 text-white shadow-xs" : "text-slate-500 hover:text-slate-800"
              }`}
            >
              All Events ({events.length})
            </button>
            <button
              onClick={() => setStatusFilter("published")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                statusFilter === "published" ? "bg-blue-600 text-white shadow-xs" : "text-slate-500 hover:text-slate-800"
              }`}
            >
              Published ({totalPublished})
            </button>
            <button
              onClick={() => setStatusFilter("draft")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                statusFilter === "draft" ? "bg-blue-600 text-white shadow-xs" : "text-slate-500 hover:text-slate-800"
              }`}
            >
              Drafts ({events.length - totalPublished})
            </button>
          </div>
        </div>

        {/* Events Grid */}
        {filteredEvents.length === 0 ? (
          <div className="bg-white border border-dashed border-slate-300 rounded-3xl p-12 text-center flex flex-col items-center justify-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-500">
              <Building2 size={28} />
            </div>
            <h3 className="text-base font-bold text-slate-800">No events found</h3>
            <p className="text-xs text-slate-400 max-w-sm">
              {searchQuery ? "Try refining your search query or filter" : "Get started by hosting your very first event conference on Eventzone!"}
            </p>
            <button
              onClick={onCreateEventClick}
              className="mt-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-600/30 transition-all cursor-pointer"
            >
              + Create Event Now
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEvents.map((ev) => (
              <div 
                key={ev.id}
                className="bg-white border border-slate-200 hover:border-blue-300 rounded-3xl overflow-hidden shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col group"
              >
                {/* Cover Image */}
                <div className="h-44 w-full relative overflow-hidden bg-slate-100">
                  <img 
                    src={ev.banner || "https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1200&q=80"} 
                    alt={ev.title} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent" />
                  
                  <div className="absolute top-3 left-3 flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-white/90 backdrop-blur-md text-blue-700 shadow-xs border border-white/50 uppercase tracking-wider">
                      {ev.type || "Hybrid"}
                    </span>
                  </div>

                  <div className="absolute top-3 right-3 flex items-center gap-1.5">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold shadow-xs ${
                      (ev.status || "published") === "published" 
                        ? "bg-emerald-500 text-white" 
                        : "bg-amber-500 text-white"
                    }`}>
                      {(ev.status || "published").toUpperCase()}
                    </span>
                  </div>

                  <div className="absolute bottom-3 left-3 right-3">
                    <span className="text-[10px] font-bold text-blue-200 uppercase tracking-wider block drop-shadow-sm">
                      {ev.category || "General"}
                    </span>
                  </div>
                </div>

                {/* Card Content */}
                <div className="p-6 flex-1 flex flex-col justify-between gap-4">
                  <div>
                    <h3 
                      onClick={() => onSelectEvent(ev.id)}
                      className="text-base font-bold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-1 cursor-pointer"
                    >
                      {ev.title}
                    </h3>
                    <p className="text-xs text-slate-500 line-clamp-2 mt-1 font-medium leading-relaxed">
                      {ev.tagline || ev.description || "The premier global industry gathering."}
                    </p>
                  </div>

                  {/* Date & Location */}
                  <div className="space-y-1.5 text-xs text-slate-600 font-medium pt-2 border-t border-slate-100">
                    <div className="flex items-center gap-2">
                      <Calendar size={13} className="text-blue-500 shrink-0" />
                      <span>{ev.startDate || "2026-10-12"} {ev.endDate ? `— ${ev.endDate}` : ""}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin size={13} className="text-blue-500 shrink-0" />
                      <span className="truncate">{ev.location || "Algiers & Online"}</span>
                    </div>
                  </div>

                  {/* Actions Footer */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500">
                      <Users size={13} className="text-slate-400" />
                      <span>{ev.attendeeCount || 4} Registered</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {onDeleteEvent && ev.id !== "c251ee33-cf10-4b11-a87f-70925f7cac2c" && (
                        <button
                          onClick={() => onDeleteEvent(ev.id)}
                          className="p-2 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                          title="Delete Event"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}

                      <button
                        onClick={() => onSelectEvent(ev.id)}
                        className="px-3.5 py-2 bg-blue-50 hover:bg-blue-600 text-blue-700 hover:text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                      >
                        <span>Open Dashboard</span>
                        <ArrowRight size={13} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
