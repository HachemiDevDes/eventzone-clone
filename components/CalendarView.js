"use client";

import React, { useState, useEffect, useRef } from "react";
import { Plus, X, Calendar, Clock, Edit2, Trash2, Image, User } from "lucide-react";

export default function CalendarView({
  sessions,
  attendees = [],
  onSaveSessions,
  onClearAllSessions,
  onUploadFile
}) {
  // Database states
  const [editingSessionId, setEditingSessionId] = useState(null);
  const [activeFilter, setActiveFilter] = useState("all");

  // Form states
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [description, setDescription] = useState("");
  
  // Person input states
  const [speakerName, setSpeakerName] = useState("");
  const [speakerImg, setSpeakerImg] = useState("");
  const [speakersList, setSpeakersList] = useState([]);
  
  const [moderatorName, setModeratorName] = useState("");
  const [moderatorImg, setModeratorImg] = useState("");
  const [moderatorsList, setModeratorsList] = useState([]);

  // Logo input states
  const [logoLabel, setLogoLabel] = useState("");
  const [logoImg, setLogoImg] = useState("");
  const [logosList, setLogosList] = useState([]);

  // Sidebar Resizing state
  const [sidebarWidth, setSidebarWidth] = useState(450);
  const isResizing = useRef(false);

  // Initialize sidebar width from local storage
  useEffect(() => {
    const savedWidth = localStorage.getItem("sidebar_width");
    if (savedWidth) {
      setSidebarWidth(parseInt(savedWidth));
    }
  }, []);

  // Handle resizing mouse events
  const startResizing = (e) => {
    isResizing.current = true;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isResizing.current) return;
      const newWidth = e.clientX - 260; // offset the Eventzone nav-sidebar (260px)
      if (newWidth > 320 && newWidth < 800) {
        setSidebarWidth(newWidth);
        localStorage.setItem("sidebar_width", newWidth);
      }
    };

    const handleMouseUp = () => {
      if (isResizing.current) {
        isResizing.current = false;
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
      }
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, []);

  // Base64 file converter or storage uploader
  const handleImageUpload = async (e, type) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const publicUrl = onUploadFile 
        ? await onUploadFile(file, 'floor-plans')
        : await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.readAsDataURL(file);
          });

      if (publicUrl) {
        if (type === "speaker") {
          setSpeakerImg(publicUrl);
        } else if (type === "moderator") {
          setModeratorImg(publicUrl);
        } else if (type === "logo") {
          setLogoImg(publicUrl);
        }
      }
    } catch (err) {
      console.error("Failed to upload image:", err);
      alert("Failed to upload image to Supabase Storage");
    }
  };

  // Add person to list
  const addPerson = (type) => {
    if (type === "speaker") {
      if (!speakerName.trim()) return;
      const newSpeaker = {
        id: Date.now(),
        name: speakerName,
        image: speakerImg || `https://ui-avatars.com/api/?name=${encodeURIComponent(speakerName)}&background=random`
      };
      setSpeakersList([...speakersList, newSpeaker]);
      setSpeakerName("");
      setSpeakerImg("");
    } else {
      if (!moderatorName.trim()) return;
      const newModerator = {
        id: Date.now(),
        name: moderatorName,
        image: moderatorImg || `https://ui-avatars.com/api/?name=${encodeURIComponent(moderatorName)}&background=random`
      };
      setModeratorsList([...moderatorsList, newModerator]);
      setModeratorName("");
      setModeratorImg("");
    }
  };

  const removePerson = (id, type) => {
    if (type === "speaker") {
      setSpeakersList(speakersList.filter(s => s.id !== id));
    } else {
      setModeratorsList(moderatorsList.filter(m => m.id !== id));
    }
  };

  const addLogo = () => {
    if (!logoImg) {
      alert("Please upload a logo image first.");
      return;
    }
    const newLogo = {
      id: Date.now(),
      label: logoLabel.trim() || "Sponsor",
      image: logoImg
    };
    setLogosList([...logosList, newLogo]);
    setLogoImg("");
  };

  const removeLogo = (id) => {
    setLogosList(logosList.filter(l => l.id !== id));
  };


  // Form submission: create or edit
  const handleSubmit = (e) => {
    e.preventDefault();

    if (speakersList.length === 0) {
      alert("Please add at least one speaker.");
      return;
    }

    if (editingSessionId) {
      // Edit mode
      const updated = sessions.map(s => {
        if (s.id === editingSessionId) {
          return {
            ...s,
            title,
            date,
            startTime,
            endTime,
            description,
            speakers: speakersList,
            moderators: moderatorsList,
            logos: logosList
          };
        }
        return s;
      });
      onSaveSessions(updated);
      setEditingSessionId(null);
    } else {
      // Create mode
      const newSession = {
        id: Date.now(),
        title,
        date,
        startTime,
        endTime,
        description,
        speakers: speakersList,
        moderators: moderatorsList,
        logos: logosList
      };
      onSaveSessions([newSession, ...sessions]);
    }

    resetForm();
  };

  const resetForm = () => {
    setTitle("");
    setDate("");
    setStartTime("");
    setEndTime("");
    setDescription("");
    setSpeakersList([]);
    setModeratorsList([]);
    setSpeakerName("");
    setSpeakerImg("");
    setModeratorName("");
    setModeratorImg("");
    setLogosList([]);
    setLogoLabel("");
    setLogoImg("");
    setEditingSessionId(null);
  };

  const startEdit = (session) => {
    setEditingSessionId(session.id);
    setTitle(session.title);
    setDate(session.date);
    setStartTime(session.startTime);
    setEndTime(session.endTime);
    setDescription(session.description);
    setSpeakersList(session.speakers || []);
    setModeratorsList(session.moderators || []);
    setLogosList(session.logos || []);
  };

  const handleDelete = (id) => {
    if (confirm("Delete this session?")) {
      onSaveSessions(sessions.filter(s => s.id !== id));
      if (editingSessionId === id) resetForm();
    }
  };

  // Timeline separation logic
  const uniqueDates = [...new Set(sessions.map(s => s.date))].sort();

  const filteredSessions = sessions
    .filter(s => activeFilter === "all" || s.date === activeFilter)
    .sort((a, b) => {
      // Sort by date then by start time
      const dateA = new Date(`${a.date}T${a.startTime}`);
      const dateB = new Date(`${b.date}T${b.startTime}`);
      return dateA - dateB;
    });

  const formatDateLabel = (dateStr) => {
    const options = { weekday: 'short', month: 'short', day: 'numeric' };
    return new Date(dateStr).toLocaleDateString('en-US', options);
  };

  const formatFullDate = (dateStr) => {
    const options = { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' };
    return new Date(dateStr).toLocaleDateString('en-US', options);
  };

  // Google Calendar integration URL helper
  const getGoogleCalendarLink = (session) => {
    const baseUrl = 'https://www.google.com/calendar/render?action=TEMPLATE';
    const titleText = encodeURIComponent(session.title);
    const speakersText = session.speakers.map(s => s.name).join(', ');
    const moderatorsText = session.moderators.map(m => m.name).join(', ');
    const descText = encodeURIComponent(
      `${session.description || ""}\n\nSpeakers: ${speakersText}${moderatorsText ? '\nModerators: ' + moderatorsText : ''}`
    );
    const start = new Date(`${session.date}T${session.startTime}`);
    const end = new Date(`${session.date}T${session.endTime}`);
    const formatGCalDate = (date) => date.toISOString().replace(/-|:|\.\d\d\d/g, "");
    const dates = `${formatGCalDate(start)}/${formatGCalDate(end)}`;
    return `${baseUrl}&text=${titleText}&details=${descText}&dates=${dates}`;
  };

  return (
    <div className="flex flex-1 w-full h-[calc(100vh-80px)] overflow-hidden">
      {/* Resizable Sidebar (SessionEditor) */}
      <aside 
        className="bg-white border-r border-slate-150 p-8 flex flex-col gap-6 overflow-y-auto shrink-0 select-none"
        style={{ width: `${sidebarWidth}px` }}
      >
        <div className="flex flex-col gap-1">
          <h1 className="text-xl font-bold text-slate-800">
            Session<span className="text-indigo-650">Editor</span>
          </h1>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            {editingSessionId ? "Modify Session" : "Add New Session"}
          </p>
          <p className="text-xs text-slate-500 mt-1">
            {editingSessionId ? "Edit the details below to update the session." : "Fill in the details to create a new event session."}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Session Title</label>
            <input 
              type="text" 
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Opening Keynote" 
              required
              className="px-4 py-3 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-indigo-600 focus:ring-4 focus:ring-indigo-50 text-sm"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Date</label>
            <input 
              type="date" 
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              className="px-4 py-3 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-indigo-600 focus:ring-4 focus:ring-indigo-50 text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Start Time</label>
              <input 
                type="time" 
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                required
                className="px-4 py-3 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-indigo-600 focus:ring-4 focus:ring-indigo-50 text-sm"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">End Time</label>
              <input 
                type="time" 
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                required
                className="px-4 py-3 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-indigo-600 focus:ring-4 focus:ring-indigo-50 text-sm"
              />
            </div>
          </div>

          {/* Speakers Section */}
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Speakers</label>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col gap-3">
              {attendees && attendees.length > 0 && (
                <div className="flex flex-col gap-1">
                  <span className="text-[9px] font-bold text-slate-400 uppercase">Select from Attendees</span>
                  <select
                    value=""
                    onChange={(e) => {
                      if (e.target.value) {
                        const att = attendees.find(a => String(a.id) === e.target.value);
                        if (att) {
                          setSpeakerName(att.name);
                          setSpeakerImg(att.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(att.name)}&background=random`);
                        }
                      }
                    }}
                    className="w-full px-3 py-2 border border-slate-200 bg-white rounded-xl text-xs font-semibold text-slate-800 focus:outline-none"
                  >
                    <option value="">-- Choose Attendee --</option>
                    {attendees.map(a => (
                      <option key={a.id} value={a.id}>{a.name} ({a.company || "Guest"})</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex items-center gap-2">
                {speakerImg ? (
                  <div className="w-8 h-8 rounded-full border-2 border-indigo-200 bg-cover bg-center shrink-0" style={{ backgroundImage: `url(${speakerImg})` }} />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-400 shrink-0"><User size={14} /></div>
                )}
                
                <input 
                  type="text" 
                  value={speakerName}
                  onChange={(e) => setSpeakerName(e.target.value)}
                  placeholder="Speaker Name"
                  className="flex-1 bg-transparent border-none py-1 text-slate-800 placeholder-slate-400 focus:outline-none text-xs font-semibold"
                />

                <label className="w-8 h-8 rounded-full flex items-center justify-center bg-white border border-slate-200 text-slate-500 hover:text-indigo-600 hover:border-indigo-150 cursor-pointer transition-colors duration-200" title="Upload Image">
                  <Image size={14} />
                  <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, "speaker")} className="hidden" />
                </label>

                <button 
                  type="button" 
                  onClick={() => addPerson("speaker")}
                  className="w-8 h-8 rounded-full flex items-center justify-center bg-indigo-600 hover:bg-indigo-700 text-white transition-all shadow-sm duration-200 shrink-0 cursor-pointer"
                  title="Add Speaker"
                >
                  <Plus size={16} />
                </button>
              </div>

              {speakersList.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-2.5 border-t border-slate-100">
                  {speakersList.map(s => (
                    <div key={s.id} className="flex items-center gap-1.5 pl-1.5 pr-2.5 py-1 bg-white border border-slate-150 rounded-full text-[11px] font-semibold text-slate-700 shadow-sm">
                      <img src={s.image} className="w-5 h-5 rounded-full object-cover" alt="" />
                      <span>{s.name}</span>
                      <button type="button" onClick={() => removePerson(s.id, "speaker")} className="text-slate-400 hover:text-rose-500 ml-1 font-bold">×</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Moderators Section */}
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Moderators</label>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col gap-3">
              {attendees && attendees.length > 0 && (
                <div className="flex flex-col gap-1">
                  <span className="text-[9px] font-bold text-slate-400 uppercase">Select from Attendees</span>
                  <select
                    value=""
                    onChange={(e) => {
                      if (e.target.value) {
                        const att = attendees.find(a => String(a.id) === e.target.value);
                        if (att) {
                          setModeratorName(att.name);
                          setModeratorImg(att.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(att.name)}&background=random`);
                        }
                      }
                    }}
                    className="w-full px-3 py-2 border border-slate-200 bg-white rounded-xl text-xs font-semibold text-slate-800 focus:outline-none"
                  >
                    <option value="">-- Choose Attendee --</option>
                    {attendees.map(a => (
                      <option key={a.id} value={a.id}>{a.name} ({a.company || "Guest"})</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex items-center gap-2">
                {moderatorImg ? (
                  <div className="w-8 h-8 rounded-full border-2 border-indigo-200 bg-cover bg-center shrink-0" style={{ backgroundImage: `url(${moderatorImg})` }} />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-400 shrink-0"><User size={14} /></div>
                )}
                
                <input 
                  type="text" 
                  value={moderatorName}
                  onChange={(e) => setModeratorName(e.target.value)}
                  placeholder="Moderator Name"
                  className="flex-1 bg-transparent border-none py-1 text-slate-800 placeholder-slate-400 focus:outline-none text-xs font-semibold"
                />

                <label className="w-8 h-8 rounded-full flex items-center justify-center bg-white border border-slate-200 text-slate-500 hover:text-indigo-600 hover:border-indigo-150 cursor-pointer transition-colors duration-200" title="Upload Image">
                  <Image size={14} />
                  <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, "moderator")} className="hidden" />
                </label>

                <button 
                  type="button" 
                  onClick={() => addPerson("moderator")}
                  className="w-8 h-8 rounded-full flex items-center justify-center bg-indigo-600 hover:bg-indigo-700 text-white transition-all shadow-sm duration-200 shrink-0 cursor-pointer"
                  title="Add Moderator"
                >
                  <Plus size={16} />
                </button>
              </div>

              {moderatorsList.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-2.5 border-t border-slate-100">
                  {moderatorsList.map(m => (
                    <div key={m.id} className="flex items-center gap-1.5 pl-1.5 pr-2.5 py-1 bg-white border border-slate-150 rounded-full text-[11px] font-semibold text-slate-700 shadow-sm">
                      <img src={m.image} className="w-5 h-5 rounded-full object-cover" alt="" />
                      <span>{m.name}</span>
                      <button type="button" onClick={() => removePerson(m.id, "moderator")} className="text-slate-400 hover:text-rose-500 ml-1 font-bold">×</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Logos Section */}
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Logos & Partners</label>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col gap-3">
              <div className="flex flex-col gap-1">
                <span className="text-[9px] font-bold text-slate-400 uppercase">Label / Grouping Header</span>
                <input 
                  type="text" 
                  value={logoLabel}
                  onChange={(e) => setLogoLabel(e.target.value)}
                  placeholder="e.g. Sponsors, Co-Host, Partners"
                  className="w-full px-3 py-2 border border-slate-200 bg-white rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-indigo-600 focus:ring-4 focus:ring-indigo-50"
                />
              </div>

              <div className="flex items-center gap-2">
                {logoImg ? (
                  <div className="w-8 h-8 rounded-lg border-2 border-indigo-200 bg-contain bg-center bg-no-repeat shrink-0 bg-white" style={{ backgroundImage: `url(${logoImg})` }} />
                ) : (
                  <div className="w-8 h-8 rounded-lg bg-slate-200 flex items-center justify-center text-slate-400 shrink-0"><Image size={14} /></div>
                )}
                
                <span className="text-xs text-slate-500 flex-1 truncate">
                  {logoImg ? "Logo uploaded" : "Upload logo image..."}
                </span>

                <label className="w-8 h-8 rounded-full flex items-center justify-center bg-white border border-slate-200 text-slate-500 hover:text-indigo-600 hover:border-indigo-150 cursor-pointer transition-colors duration-200" title="Upload Logo">
                  <Image size={14} />
                  <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, "logo")} className="hidden" />
                </label>

                <button 
                  type="button" 
                  onClick={addLogo}
                  className="w-8 h-8 rounded-full flex items-center justify-center bg-indigo-600 hover:bg-indigo-700 text-white transition-all shadow-sm duration-200 shrink-0 cursor-pointer"
                  title="Add Logo"
                >
                  <Plus size={16} />
                </button>
              </div>

              {logosList.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-2.5 border-t border-slate-100">
                  {logosList.map(l => (
                    <div key={l.id} className="flex items-center gap-1.5 pl-1.5 pr-2 py-1 bg-white border border-slate-150 rounded-xl text-[10px] font-semibold text-slate-700 shadow-sm">
                      <img src={l.image} className="h-4 object-contain max-w-[60px]" alt="" />
                      <span className="text-[9px] text-slate-400 font-bold bg-slate-100 px-1.5 py-0.5 rounded truncate max-w-[80px]">{l.label}</span>
                      <button type="button" onClick={() => removeLogo(l.id)} className="text-slate-400 hover:text-rose-500 ml-1 font-bold text-xs">×</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Description</label>
            <textarea 
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Tell us about this session..."
              className="px-4 py-3 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-indigo-600 focus:ring-4 focus:ring-indigo-50 text-sm resize-none"
            />
          </div>

          <div className="flex flex-col gap-2.5 mt-2">
            <button 
              type="submit"
              className="w-full bg-indigo-650 hover:bg-indigo-700 text-white py-3.5 px-4 rounded-xl font-semibold text-sm transition-all hover:shadow-lg hover:-translate-y-0.5 duration-200 cursor-pointer"
            >
              {editingSessionId ? "✓ Update Session" : "+ Create Session"}
            </button>

            {editingSessionId && (
              <button 
                type="button"
                onClick={resetForm}
                className="w-full bg-white border border-slate-250 hover:bg-slate-50 text-slate-700 py-3.5 px-4 rounded-xl font-semibold text-sm transition-all duration-200 cursor-pointer"
              >
                Cancel Edit
              </button>
            )}
          </div>
        </form>
      </aside>

      {/* Resizer Divider Bar */}
      <div 
        className="w-1.5 hover:bg-indigo-500 active:bg-indigo-600 cursor-col-resize transition-all duration-150 shrink-0 self-stretch z-10 bg-slate-100 flex items-center justify-center" 
        onMouseDown={startResizing}
      >
        <div className="w-0.5 h-8 bg-slate-300 rounded-full"></div>
      </div>

      {/* Main Sessions Timeline Area */}
      <section className="flex-1 bg-slate-50 p-10 flex flex-col overflow-y-auto">
        <header className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Event Timeline & Sessions</h2>
            <p className="text-sm text-slate-500">Sort, view, edit, and organize scheduled sessions by day.</p>
          </div>
          {sessions.length > 0 && (
            <button 
              onClick={onClearAllSessions}
              className="px-4 py-2 bg-white border border-slate-200 hover:border-rose-450 hover:text-rose-500 text-slate-650 rounded-xl font-semibold text-sm transition-all duration-200 cursor-pointer"
            >
              Clear All
            </button>
          )}
        </header>

        {/* Dynamic Day Filter Tabs */}
        {uniqueDates.length > 1 && (
          <div className="flex gap-2 p-1.5 bg-slate-150 rounded-2xl w-fit mb-8 max-w-full overflow-x-auto shrink-0 scrollbar-none">
            <button
              onClick={() => setActiveFilter("all")}
              className={`px-5 py-2.5 rounded-xl font-semibold text-xs transition-all duration-200 cursor-pointer whitespace-nowrap ${activeFilter === "all" ? "bg-white text-indigo-650 shadow-sm" : "text-slate-500 hover:text-indigo-600"}`}
            >
              All Dates
            </button>
            {uniqueDates.map((date, i) => (
              <button
                key={date}
                onClick={() => setActiveFilter(date)}
                className={`px-5 py-2.5 rounded-xl font-semibold text-xs transition-all duration-200 cursor-pointer whitespace-nowrap ${activeFilter === date ? "bg-white text-indigo-650 shadow-sm" : "text-slate-500 hover:text-indigo-600"}`}
              >
                Day {i + 1} ({formatDateLabel(date)})
              </button>
            ))}
          </div>
        )}

        {/* Sessions list */}
        <div className="flex flex-col gap-6 max-w-4xl">
          {filteredSessions.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center p-20 bg-white border border-slate-150 rounded-3xl gap-4 text-slate-400">
              <Calendar size={64} className="opacity-30" />
              <div>
                <h3 className="text-lg font-bold text-slate-700">No sessions scheduled</h3>
                <p className="text-sm text-slate-400 mt-1">Use the sidebar on the left to add your first session details.</p>
              </div>
            </div>
          ) : (
            (() => {
              let lastDate = null;
              return filteredSessions.map(session => {
                // Render Day Separator if date changes in "All Dates" view
                const renderSeparator = activeFilter === "all" && session.date !== lastDate;
                if (renderSeparator) {
                  lastDate = session.date;
                }

                return (
                  <React.Fragment key={session.id}>
                    {renderSeparator && (
                      <div className="flex items-center gap-4 mt-6 mb-4 select-none">
                        <h3 className="text-xs font-bold text-indigo-650 tracking-widest uppercase shrink-0">
                          {formatFullDate(session.date)}
                        </h3>
                        <div className="h-px bg-slate-200 flex-1"></div>
                      </div>
                    )}

                    <div className="bg-white border border-slate-150 rounded-3xl p-8 flex flex-col gap-5 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 relative group overflow-hidden">
                      <div className="flex justify-between items-start gap-4">
                        <div className="flex items-center gap-2 text-indigo-600 font-bold text-xs select-none">
                          <Clock size={14} />
                          <span>{session.startTime} - {session.endTime}</span>
                        </div>
                        <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                          <button 
                            onClick={() => startEdit(session)}
                            className="p-2 bg-slate-50 border border-slate-200 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 hover:border-indigo-100 rounded-xl transition-all duration-200 cursor-pointer"
                            title="Edit Session"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button 
                            onClick={() => handleDelete(session.id)}
                            className="p-2 bg-rose-50 border border-rose-100 text-rose-550 hover:text-white hover:bg-rose-500 hover:border-rose-500 rounded-xl transition-all duration-200 cursor-pointer"
                            title="Delete Session"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>

                      <h3 className="text-xl font-bold text-slate-800 leading-snug">{session.title}</h3>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex flex-col gap-2">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider select-none">Speakers</span>
                          <div className="flex flex-wrap gap-2.5">
                            {Array.isArray(session.speakers) && session.speakers.map((s, idx) => (
                              s ? (
                                <div key={idx} className="flex items-center gap-2 bg-slate-50 border border-slate-150 pl-1.5 pr-3 py-1.5 rounded-full text-xs font-semibold text-slate-700 shadow-sm">
                                  <img src={s.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(s.name || "User")}`} className="w-6 h-6 rounded-full object-cover shrink-0" alt="" />
                                  <span className="truncate max-w-[120px]">{s.name || "Unknown"}</span>
                                </div>
                              ) : null
                            ))}
                          </div>
                        </div>

                        {Array.isArray(session.moderators) && session.moderators.length > 0 && (
                          <div className="flex flex-col gap-2">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider select-none">Moderators</span>
                            <div className="flex flex-wrap gap-2.5">
                              {session.moderators.map((m, idx) => (
                                m ? (
                                  <div key={idx} className="flex items-center gap-2 bg-slate-50 border border-slate-150 pl-1.5 pr-3 py-1.5 rounded-full text-xs font-semibold text-slate-700 shadow-sm">
                                    <img src={m.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(m.name || "User")}`} className="w-6 h-6 rounded-full object-cover shrink-0" alt="" />
                                    <span className="truncate max-w-[120px]">{m.name || "Unknown"}</span>
                                  </div>
                                ) : null
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Session Logos Section */}
                      {Array.isArray(session.logos) && session.logos.length > 0 && (
                        <div className="flex flex-col gap-4 border-t border-slate-100 pt-4 mt-2">
                          {Object.entries(
                            session.logos.reduce((acc, item) => {
                              if (!item) return acc;
                              const label = item.label || "Sponsor";
                              if (!acc[label]) acc[label] = [];
                              acc[label].push(item);
                              return acc;
                            }, {})
                          ).map(([label, items]) => (
                            <div key={label} className="flex flex-col gap-2">
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider select-none">
                                {label}
                              </span>
                              <div className="flex flex-wrap gap-3 items-center">
                                {items.map((logo, idx) => (
                                  logo && logo.image ? (
                                    <div key={idx} className="flex items-center justify-center bg-white border border-slate-150 px-3 py-2 rounded-2xl h-12 min-w-[48px] shadow-sm select-none">
                                      <img src={logo.image} className="h-7 object-contain max-w-[150px]" alt="logo" />
                                    </div>
                                  ) : null
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Description - wrapping text, scrollbar if too long */}
                      <p className="text-xs text-slate-500 leading-relaxed max-h-[120px] overflow-y-auto pr-2 whitespace-pre-wrap break-words border-t border-slate-100 pt-4">
                        {session.description || "No description provided."}
                      </p>

                      <div className="flex border-t border-slate-100 pt-4 mt-1 justify-start">
                        <a 
                          href={getGoogleCalendarLink(session)} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-650 bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-150 hover:text-indigo-650 px-4 py-2 rounded-xl transition-all duration-200"
                        >
                          <img src="https://www.gstatic.com/calendar/images/dynamiclogo_2020q4/calendar_31_2x.png" className="w-4.5 h-4.5 object-contain" alt="" />
                          Add to Google Calendar
                        </a>
                      </div>
                    </div>
                  </React.Fragment>
                );
              });
            })()
          )}
        </div>
      </section>
    </div>
  );
}
