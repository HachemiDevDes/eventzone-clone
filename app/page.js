/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useState, useEffect, useRef } from "react";
import { 
  CheckCircle2, Ticket, ShieldAlert, 
  ChevronDown, LayoutDashboard, Calendar, 
  Users2, BarChart3, X, Globe, Map, Sparkles, Upload, Mail,
  Building2, Plus, ArrowLeft, ArrowRight, Layers, LogOut, Compass, ExternalLink, ChevronRight, Home as HomeIcon, User,
  FileText
} from "lucide-react";

import MainHomePage from "../components/MainHomePage";
import Overview from "../components/Overview";
import CalendarView from "../components/CalendarView";
import FloorPlanModifier from "../components/FloorPlanModifier";
import FloorPlanGallery from "../components/FloorPlanGallery";
import GenericTableView from "../components/GenericTableView";
import LivePageBuilder from "../components/LivePageBuilder";
import EventDetailsView from "../components/EventDetailsView";
import AuthView from "../components/AuthView";
import OrganizerEventsHub from "../components/OrganizerEventsHub";
import EventCreationWizard from "../components/EventCreationWizard";
import VisitorPortal from "../components/VisitorPortal";
import EventPublicLandingPage from "../components/EventPublicLandingPage";
import ProfileView from "../components/ProfileView";
import FormsView from "../components/FormsView";

import {
  fetchEventDetails, updateEventDetails,
  fetchSessions, upsertSession, deleteSession,
  fetchAttendees, upsertAttendee, deleteAttendee,
  fetchPending, upsertPending, deletePending,
  fetchOrganizations, upsertOrganization, deleteOrganization,
  fetchSponsors, upsertSponsor, deleteSponsor,
  fetchExhibitors, upsertExhibitor, deleteExhibitor,
  fetchTickets, upsertTicket, deleteTicket,
  fetchTeam, upsertTeamMember, deleteTeamMember,
  fetchFloorPlans, upsertFloorPlan, deleteFloorPlan,
  fetchForms, upsertForm, deleteForm,
  fetchFormSubmissions, submitFormResponse, deleteFormSubmission,
  uploadFileToBucket,
  fetchUserEvents, fetchPublicEvents, createEvent, deleteEvent,
  fetchVisitorRegistrations, registerVisitorForEvent, upsertUserProfile,
  setActiveEventId, getActiveEventId, DEFAULT_EVENT_ID, SHOWCASE_EVENTS
} from "../lib/db";
import { supabase } from "../lib/supabase";


const INDUSTRIES = [
  "Energy & Hydrocarbons",
  "Technology & Software",
  "Finance & Banking",
  "Healthcare & Pharmaceuticals",
  "Education & Academia",
  "Manufacturing & Heavy Industry",
  "Transportation & Logistics",
  "Real Estate & Construction",
  "Retail & E-commerce",
  "Media & Entertainment",
  "Agriculture & Food Production",
  "Government & Public Sector",
  "Non-Profit & NGOs",
  "Hospitality & Tourism",
  "Aerospace & Defense",
  "Automotive & Mobility",
  "Telecommunications",
  "Chemicals & Materials",
  "Environmental & Sustainability Services",
  "Consulting & Professional Services"
];

export default function Home() {
  // Authentication & Role State
  const [currentUser, setCurrentUser] = useState(null);
  const [authInitialized, setAuthInitialized] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalInitialMode, setAuthModalInitialMode] = useState("signin");

  // Multi-Event State
  const [publicEvents, setPublicEvents] = useState(SHOWCASE_EVENTS);
  const [userEvents, setUserEvents] = useState(SHOWCASE_EVENTS);
  const [activeEventId, setActiveEventStateId] = useState(DEFAULT_EVENT_ID);
  const [isCreationWizardOpen, setIsCreationWizardOpen] = useState(false);
  const [eventSwitcherOpen, setEventSwitcherOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  // Visitor Registrations
  const [visitorRegistrations, setVisitorRegistrations] = useState([]);

  // Main UI routing view: 'home' is the default public browse landing page!
  const [currentView, setCurrentView] = useState("home"); 
  const [participantsOpen, setParticipantsOpen] = useState(false);
  const [activeFloorPlanId, setActiveFloorPlanId] = useState(null);
  const [initialPreviewMode, setInitialPreviewMode] = useState(false);
  const [saveStatus, setSaveStatus] = useState("Saved");

  // Single-event data
  const [eventDetails, setEventDetails] = useState(SHOWCASE_EVENTS[0]);
  const [sessions, setSessions] = useState([]);
  const [attendees, setAttendees] = useState([]);
  const [pending, setPending] = useState([]);
  const [organizations, setOrganizations] = useState([]);
  const [sponsors, setSponsors] = useState([]);
  const [exhibitors, setExhibitors] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [team, setTeam] = useState([]);
  const [floorPlans, setFloorPlans] = useState([]);
  const [forms, setForms] = useState([]);
  const [formSubmissions, setFormSubmissions] = useState([]);

  const [isLoading, setIsLoading] = useState(true);
  const isInitializedRef = useRef(false);

  // Modal State
  const [activeModalType, setActiveModalType] = useState(null);
  const [editingItem, setEditingItem] = useState(null);
  const [modalName, setModalName] = useState("");
  const [modalEmail, setModalEmail] = useState("");
  const [modalTicket, setModalTicket] = useState("Standard Admission");
  const [modalSector, setModalSector] = useState("");
  const [modalContact, setModalContact] = useState("");
  const [modalWebsite, setModalWebsite] = useState("");
  const [modalTier, setModalTier] = useState("silver");
  const [modalBooth, setModalBooth] = useState("");
  const [modalPrice, setModalPrice] = useState("");
  const [modalMax, setModalMax] = useState("");
  const [modalFeatures, setModalFeatures] = useState("");
  const [modalRole, setModalRole] = useState("Staff");
  const [modalLogo, setModalLogo] = useState("");
  const [modalOrgId, setModalOrgId] = useState("");
  const [industrySearch, setIndustrySearch] = useState("");
  const [industryDropdownOpen, setIndustryDropdownOpen] = useState(false);
  const [showGlobalProfileModal, setShowGlobalProfileModal] = useState(false);

  // Check Local Auth Session and Supabase Auth State on mount
  useEffect(() => {
    let isMounted = true;

    // 1. Initial check from LocalStorage for instant rendering
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("eventzone_user");
        if (stored) {
          const parsed = JSON.parse(stored);
          setCurrentUser(parsed);
        }
      } catch (e) {
        console.warn("Session restore error:", e);
      }
    }

    // 2. Validate with live Supabase session & real-time sync
    let profileChannel = null;

    const syncSupabaseSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user && isMounted) {
          const userId = session.user.id;
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();

          const retrievedName = profile?.full_name || session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || "Eventzone User";
          const retrievedRole = profile?.role || session.user.user_metadata?.role || "organizer";
          const retrievedAvatar = profile?.avatar_url || session.user.user_metadata?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(retrievedName)}&background=0b5cdb&color=fff`;

          const syncedUser = {
            id: userId,
            email: session.user.email,
            fullName: retrievedName,
            role: retrievedRole === 'attendee' ? 'visitor' : retrievedRole,
            companyName: profile?.company_name || session.user.user_metadata?.company_name || "",
            jobTitle: profile?.job_title || session.user.user_metadata?.job_title || "",
            phone: profile?.phone || "",
            bio: profile?.bio || "",
            location: profile?.location || "",
            interests: Array.isArray(profile?.interests) ? profile.interests : [],
            socialLinks: profile?.social_links || [],
            metadata: profile?.metadata || {},
            what_im_looking_for: profile?.what_im_looking_for || "",
            whatImLookingFor: profile?.what_im_looking_for || "",
            avatar: retrievedAvatar,
            isAdmin: !!profile?.is_admin,
          };

          setCurrentUser(syncedUser);
          if (typeof window !== "undefined") {
            localStorage.setItem("eventzone_user", JSON.stringify(syncedUser));
          }

          // Cross-device / App <-> Web Real-time Database Subscription
          profileChannel = supabase
            .channel(`public-profiles-sync-${userId}`)
            .on(
              'postgres_changes',
              { event: '*', schema: 'public', table: 'profiles', filter: `id=eq.${userId}` },
              (payload) => {
                if (payload.new && isMounted) {
                  const updated = payload.new;
                  const updatedName = updated.full_name || "Eventzone User";
                  const updatedRole = updated.role || "organizer";
                  const updatedAvatar = updated.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(updatedName)}&background=0b5cdb&color=fff`;

                  const updatedUser = {
                    id: userId,
                    email: updated.email || session.user.email,
                    fullName: updatedName,
                    role: updatedRole === 'attendee' ? 'visitor' : updatedRole,
                    companyName: updated.company_name || "",
                    jobTitle: updated.job_title || "",
                    phone: updated.phone || "",
                    bio: updated.bio || "",
                    location: updated.location || "",
                    interests: Array.isArray(updated.interests) ? updated.interests : [],
                    socialLinks: updated.social_links || [],
                    metadata: updated.metadata || {},
                    what_im_looking_for: updated.what_im_looking_for || "",
                    whatImLookingFor: updated.what_im_looking_for || "",
                    avatar: updatedAvatar,
                    isAdmin: !!updated.is_admin,
                  };

                  setCurrentUser(updatedUser);
                  if (typeof window !== "undefined") {
                    localStorage.setItem("eventzone_user", JSON.stringify(updatedUser));
                  }
                }
              }
            )
            .subscribe();
        }
      } catch (err) {
        console.warn("Supabase live session sync:", err);
      } finally {
        if (isMounted) setAuthInitialized(true);
      }
    };

    syncSupabaseSession();

    // 3. Listen to auth state changes (e.g. login, token refresh, logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_OUT" && isMounted) {
        if (typeof window !== "undefined") {
          localStorage.removeItem("eventzone_user");
        }
        setCurrentUser(null);
      }
    });

    return () => {
      isMounted = false;
      subscription?.unsubscribe();
      profileChannel?.unsubscribe();
    };
  }, []);


  // Load User Events & Public Events
  useEffect(() => {
    const loadEventsData = async () => {
      try {
        const [pEvents, uEvents, vRegs] = await Promise.all([
          fetchPublicEvents(),
          currentUser ? fetchUserEvents(currentUser.id) : fetchUserEvents(null),
          fetchVisitorRegistrations(currentUser?.email),
        ]);
        if (pEvents && pEvents.length > 0) setPublicEvents(pEvents);
        if (uEvents && uEvents.length > 0) setUserEvents(uEvents);
        setVisitorRegistrations(vRegs || []);
      } catch (err) {
        console.error("Error loading events hub:", err);
      }
    };

    loadEventsData();
  }, [currentUser]);

  // Load single-event data whenever activeEventId changes
  useEffect(() => {
    if (!activeEventId) return;

    const loadEventData = async () => {
      setIsLoading(true);
      setActiveEventId(activeEventId);
      try {
        const results = await Promise.allSettled([
          fetchEventDetails(activeEventId),
          fetchSessions(activeEventId),
          fetchAttendees(activeEventId),
          fetchPending(activeEventId),
          fetchOrganizations(),
          fetchSponsors(activeEventId),
          fetchExhibitors(activeEventId),
          fetchTickets(activeEventId),
          fetchTeam(activeEventId),
          fetchFloorPlans(activeEventId),
          fetchForms(activeEventId),
          fetchFormSubmissions(activeEventId),
        ]);

        const [
          eventResult, sessionsResult, attendeesResult, pendingResult,
          orgsResult, sponsorsResult, exhibitorsResult, ticketsResult,
          teamResult, floorPlansResult, formsResult, formSubsResult
        ] = results;

        if (eventResult.status === "fulfilled") setEventDetails(eventResult.value);
        if (sessionsResult.status === "fulfilled") setSessions(sessionsResult.value);
        if (attendeesResult.status === "fulfilled") setAttendees(attendeesResult.value);
        if (pendingResult.status === "fulfilled") setPending(pendingResult.value);
        if (orgsResult.status === "fulfilled") setOrganizations(orgsResult.value);
        if (sponsorsResult.status === "fulfilled") setSponsors(sponsorsResult.value);
        if (exhibitorsResult.status === "fulfilled") setExhibitors(exhibitorsResult.value);
        if (ticketsResult.status === "fulfilled") setTickets(ticketsResult.value);
        if (teamResult.status === "fulfilled") setTeam(teamResult.value);
        if (floorPlansResult.status === "fulfilled") setFloorPlans(floorPlansResult.value);
        if (formsResult.status === "fulfilled") setForms(formsResult.value);
        if (formSubsResult.status === "fulfilled") setFormSubmissions(formSubsResult.value);

      } catch (err) {
        console.error("Unexpected error loading data for event:", err);
      } finally {
        setIsLoading(false);
      }
    };

    loadEventData();
  }, [activeEventId]);

  // Synchronize state variables to URL query parameters
  useEffect(() => {
    if (isLoading || typeof window === "undefined" || !isInitializedRef.current) return;

    const params = new URLSearchParams();
    if (currentView !== "home") {
      params.set("view", currentView);
    }
    if (activeEventId && activeEventId !== DEFAULT_EVENT_ID) {
      params.set("eventId", activeEventId);
    }
    if (currentView === "floor-plan" && activeFloorPlanId) {
      params.set("planId", activeFloorPlanId);
      if (initialPreviewMode) {
        params.set("preview", "true");
      }
    }

    const queryString = params.toString();
    const newUrl = queryString ? `/?${queryString}` : "/";

    if (window.location.search !== `?${queryString}` && (window.location.search !== "" || queryString !== "")) {
      window.history.pushState({}, "", newUrl);
    }
  }, [currentView, activeFloorPlanId, initialPreviewMode, activeEventId, isLoading]);

  // Parse URL query parameters on initial load
  useEffect(() => {
    if (!isLoading && typeof window !== "undefined") {
      const searchParams = new URLSearchParams(window.location.search);
      const viewParam = searchParams.get("view");
      const eventIdParam = searchParams.get("eventId");
      const planIdParam = searchParams.get("planId");
      const previewParam = searchParams.get("preview");

      if (eventIdParam && eventIdParam !== activeEventId) {
        setActiveEventStateId(eventIdParam);
      }
      
      if (viewParam) {
        if (viewParam === "floor-plan") {
          setCurrentView("floor-plan");
          if (planIdParam) {
            const planExists = floorPlans.some(p => p.id === planIdParam || String(p.id) === String(planIdParam));
            if (planExists) {
              setActiveFloorPlanId(planIdParam);
              if (previewParam === "true") {
                setInitialPreviewMode(true);
              }
            } else {
              setActiveFloorPlanId(null);
            }
          } else {
            setActiveFloorPlanId(null);
          }
        } else {
          const validViews = [
            "home", "auth", "profile", "events-hub", "create-event", "event-landing", "visitor-portal", "overview", "page-builder", "calendar", "event-details", 
            "attendees", "pending", "organizations", "sponsors", 
            "exhibitors", "speakers", "tickets", "check-in", 
            "my-team", "analytics", "communications"
          ];
          if (validViews.includes(viewParam)) {
            setCurrentView(viewParam);
          }
        }
      }
      isInitializedRef.current = true;
    }
  }, [isLoading, floorPlans, activeEventId]);

  // Auth Success Handler
  const handleAuthSuccess = (user) => {
    setCurrentUser(user);
    setAuthModalOpen(false);
    if (user.role === "organizer") {
      setCurrentView("events-hub");
    } else {
      setCurrentView("home");
    }
  };

  // Sign Out Handler
  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.warn("Supabase signout exception:", e);
    }
    if (typeof window !== "undefined") {
      localStorage.removeItem("eventzone_user");
    }
    setCurrentUser(null);
    setCurrentView("home");
  };


  // Switch Role Handler
  const handleToggleRole = (targetRole) => {
    const updated = { ...currentUser, role: targetRole };
    setCurrentUser(updated);
    if (typeof window !== "undefined") {
      localStorage.setItem("eventzone_user", JSON.stringify(updated));
    }
    if (targetRole === "visitor") {
      setCurrentView("home");
    } else {
      setCurrentView("events-hub");
    }
    setProfileDropdownOpen(false);
  };

  // Profile Update Handler (Supabase Multi-device & App Sync)
  const handleUpdateProfile = async (profileData) => {
    try {
      const updated = await upsertUserProfile(profileData);
      const retrievedName = updated?.full_name || profileData.fullName || "Eventzone User";
      const retrievedRole = updated?.role || profileData.role || "organizer";
      const retrievedAvatar = updated?.avatar_url || profileData.avatar;

      const syncedUser = {
        id: profileData.id,
        email: profileData.email,
        fullName: retrievedName,
        role: retrievedRole === 'attendee' ? 'visitor' : retrievedRole,
        companyName: updated?.company_name || profileData.companyName || "",
        jobTitle: updated?.job_title || profileData.jobTitle || "",
        phone: updated?.phone || profileData.phone || "",
        bio: updated?.bio || profileData.bio || "",
        location: updated?.location || profileData.location || "",
        interests: Array.isArray(updated?.interests) ? updated.interests : (profileData.interests || []),
        socialLinks: updated?.social_links || profileData.socialLinks || [],
        metadata: updated?.metadata || profileData.metadata || {},
        what_im_looking_for: updated?.what_im_looking_for || profileData.what_im_looking_for || profileData.whatImLookingFor || "",
        whatImLookingFor: updated?.what_im_looking_for || profileData.what_im_looking_for || profileData.whatImLookingFor || "",
        avatar: retrievedAvatar,
        isAdmin: !!profileData.isAdmin,
      };

      setCurrentUser(syncedUser);
      if (typeof window !== "undefined") {
        localStorage.setItem("eventzone_user", JSON.stringify(syncedUser));
      }
      return { success: true };
    } catch (err) {
      console.error("Profile update error:", err);
      throw err;
    }
  };

  // Event Creation Handler
  const handleEventCreated = async (formData) => {
    try {
      const created = await createEvent(formData, currentUser?.id);
      setUserEvents(prev => [created, ...prev]);
      setPublicEvents(prev => [created, ...prev]);
      setActiveEventStateId(created.id);
      setIsCreationWizardOpen(false);
      setCurrentView("overview");
    } catch (err) {
      console.error("Failed to create event:", err);
    }
  };

  // Event Delete Handler
  const handleDeleteEvent = async (id) => {
    if (confirm("Are you sure you want to delete this event?")) {
      await deleteEvent(id);
      setUserEvents(prev => prev.filter(e => e.id !== id));
      setPublicEvents(prev => prev.filter(e => e.id !== id));
      if (activeEventId === id) {
        setActiveEventStateId(DEFAULT_EVENT_ID);
      }
    }
  };

  // Visitor RSVP Handler
  const handleVisitorRegister = async (eventId, visitorData) => {
    const newPass = await registerVisitorForEvent(eventId, visitorData);
    setVisitorRegistrations(prev => [newPass, ...prev]);
    return newPass;
  };

  // Floor Plan Save Helpers
  const saveFloorPlanWithStatus = async (plan) => {
    setSaveStatus("Saving...");
    try {
      await upsertFloorPlan(plan, activeEventId);
      setSaveStatus("Saved");
    } catch (err) {
      console.error("Auto-save floor plan failed:", err);
      setSaveStatus("Error saving");
    }
  };

  const handleCreateFloorPlan = async (name) => {
    const newId = `plan-${Date.now()}`;
    const newPlan = {
      id: newId,
      name: name || `Floor Plan ${floorPlans.length + 1}`,
      createdAt: new Date().toISOString(),
      elements: [],
      blueprint: {
        url: '', name: 'Venue Blueprint', opacity: 0.8,
        x: 0, y: 0, width: 800, height: 600, rotation: 0, isLocked: false
      },
      fontFamily: 'Inter',
      floors: [
        {
          id: `floor-${Date.now()}`,
          name: 'Ground Floor',
          elements: [],
          blueprint: {
            url: '', name: 'Venue Blueprint', opacity: 0.8,
            x: 0, y: 0, width: 800, height: 600, rotation: 0, isLocked: false
          }
        }
      ]
    };
    try {
      const saved = await upsertFloorPlan(newPlan, activeEventId);
      setFloorPlans(prev => [...prev, saved]);
      setActiveFloorPlanId(saved.id);
    } catch (err) {
      console.error("Create floor plan error:", err);
    }
  };

  const handleDuplicateFloorPlan = async (id) => {
    const source = floorPlans.find(p => p.id === id);
    if (!source) return;
    const duplicated = {
      ...source,
      id: `plan-${Date.now()}`,
      name: `${source.name} (Copy)`,
      createdAt: new Date().toISOString(),
    };
    try {
      const saved = await upsertFloorPlan(duplicated, activeEventId);
      setFloorPlans(prev => [...prev, saved]);
    } catch (err) {
      console.error("Duplicate floor plan error:", err);
    }
  };

  const handleDeleteFloorPlan = async (id) => {
    try {
      await deleteFloorPlan(id);
      setFloorPlans(prev => prev.filter(p => p.id !== id));
      if (activeFloorPlanId === id) setActiveFloorPlanId(null);
    } catch (err) {
      console.error("Delete floor plan error:", err);
    }
  };

  const handleRenameFloorPlan = async (id, newName) => {
    setFloorPlans(prev => {
      const updated = prev.map(p => p.id === id ? { ...p, name: newName } : p);
      const target = updated.find(p => p.id === id);
      if (target) saveFloorPlanWithStatus(target);
      return updated;
    });
  };

  const handleSaveFloorPlanElements = (id, elements) => {
    const updatedFloorPlans = floorPlans.map(p => p.id === id ? { ...p, elements } : p);
    setFloorPlans(updatedFloorPlans);
    const savedPlan = updatedFloorPlans.find(p => p.id === id);
    if (savedPlan) saveFloorPlanWithStatus(savedPlan);
  };

  const handleSaveFloorPlanFloors = (id, floors) => {
    const firstFloor = floors[0] || { elements: [], blueprint: {} };
    const updatedFloorPlans = floorPlans.map(p => p.id === id ? { 
      ...p, 
      floors,
      elements: firstFloor.elements || [],
      blueprint: firstFloor.blueprint || {}
    } : p);
    
    setFloorPlans(updatedFloorPlans);
    const savedPlan = updatedFloorPlans.find(p => p.id === id);
    if (savedPlan) saveFloorPlanWithStatus(savedPlan);
  };

  const handleSaveFloorPlanBlueprint = (id, blueprintState) => {
    setFloorPlans(prev => {
      const updated = prev.map(p => p.id === id ? { ...p, blueprint: blueprintState } : p);
      const merged = updated.find(p => p.id === id);
      if (merged) saveFloorPlanWithStatus(merged);
      return updated;
    });
  };

  const handleSaveFloorPlanFontFamily = (id, fontFamily) => {
    setFloorPlans(prev => {
      const updated = prev.map(p => p.id === id ? { ...p, fontFamily } : p);
      const merged = updated.find(p => p.id === id);
      if (merged) saveFloorPlanWithStatus(merged);
      return updated;
    });
  };

  const activePlan = floorPlans.find(p => p.id === activeFloorPlanId) ?? null;

  // Diff sync helper
  const syncArrayToDb = (oldArr, newArr, upsertFn, deleteFn) => {
    const newIds = new Set(newArr.map(i => String(i.id)));
    for (const item of oldArr) {
      if (!newIds.has(String(item.id))) {
        deleteFn(item.id).catch(e => console.error('Delete failed:', e));
      }
    }
    for (const item of newArr) {
      const oldItem = oldArr.find(i => String(i.id) === String(item.id));
      if (!oldItem || JSON.stringify(oldItem) !== JSON.stringify(item)) {
        upsertFn(item, activeEventId).catch(e => console.error('Upsert failed:', e));
      }
    }
  };

  const handleUpdateState = (key, val) => {
    switch (key) {
      case "eventDetails":
        setEventDetails(val);
        updateEventDetails(val, activeEventId).catch(console.error);
        break;
      case "sessions":
        syncArrayToDb(sessions, val, upsertSession, deleteSession);
        setSessions(val);
        break;
      case "attendees":
        syncArrayToDb(attendees, val, upsertAttendee, deleteAttendee);
        setAttendees(val);
        break;
      case "pending":
        syncArrayToDb(pending, val, upsertPending, deletePending);
        setPending(val);
        break;
      case "organizations":
        syncArrayToDb(organizations, val, upsertOrganization, deleteOrganization);
        setOrganizations(val);
        break;
      case "sponsors":
        syncArrayToDb(sponsors, val, upsertSponsor, deleteSponsor);
        setSponsors(val);
        break;
      case "exhibitors":
        syncArrayToDb(exhibitors, val, upsertExhibitor, deleteExhibitor);
        setExhibitors(val);
        break;
      case "tickets":
        syncArrayToDb(tickets, val, upsertTicket, deleteTicket);
        setTickets(val);
        break;
      case "team":
        syncArrayToDb(team, val, upsertTeamMember, deleteTeamMember);
        setTeam(val);
        break;
      case "floorPlans":
        syncArrayToDb(floorPlans, val, upsertFloorPlan, deleteFloorPlan);
        setFloorPlans(val);
        break;
    }
  };

  const getUniqueSpeakersCount = () => {
    const seen = new Set();
    sessions.forEach(s => {
      (s.speakers || []).forEach(sp => seen.add(sp.name));
      (s.moderators || []).forEach(mo => seen.add(mo.name));
    });
    return seen.size;
  };

  // Modals Save submission handler
  const handleModalSubmit = async (e) => {
    e.preventDefault();

    if (editingItem) {
      switch (activeModalType) {
        case "attendee": {
          const updated = { ...editingItem, name: modalName, email: modalEmail, ticketType: modalTicket, image: modalLogo };
          setAttendees(attendees.map(a => a.id === editingItem.id ? updated : a));
          upsertAttendee(updated, activeEventId).catch(console.error);
          break;
        }
        case "org": {
          const updated = { ...editingItem, name: modalName, industry: modalSector, contact: modalContact, website: modalWebsite || "https://", logo: modalLogo };
          setOrganizations(organizations.map(o => o.id === editingItem.id ? updated : o));
          upsertOrganization(updated).catch(console.error);
          break;
        }
        case "sponsor": {
          const updated = { ...editingItem, name: modalName, tier: modalTier, website: modalWebsite || "#", image: modalLogo || "" };
          setSponsors(sponsors.map(s => s.id === editingItem.id ? updated : s));
          upsertSponsor(updated, activeEventId).catch(console.error);
          break;
        }
        case "exhibitor": {
          const editOrg = organizations.find(o => String(o.id) === String(modalOrgId));
          if (editOrg) {
            const updated = { ...editingItem, name: editOrg.name, logo: editOrg.logo || "", contact: editOrg.contact || "", email: modalEmail, org_id: editOrg.id };
            setExhibitors(exhibitors.map(ex => ex.id === editingItem.id ? updated : ex));
            upsertExhibitor(updated, activeEventId).catch(console.error);
          }
          break;
        }
        case "ticket": {
          const updated = { ...editingItem, name: modalName, price: parseInt(modalPrice) || 0, maxQty: parseInt(modalMax) || 100, features: modalFeatures.split(",").map(f => f.trim()) };
          setTickets(tickets.map(t => t.id === editingItem.id ? updated : t));
          upsertTicket(updated, activeEventId).catch(console.error);
          break;
        }
        case "team": {
          const updated = { ...editingItem, name: modalName, email: modalEmail, role: modalRole };
          setTeam(team.map(tm => tm.id === editingItem.id ? updated : tm));
          upsertTeamMember(updated, activeEventId).catch(console.error);
          break;
        }
      }
    } else {
      try {
        switch (activeModalType) {
          case "attendee": {
            const saved = await upsertAttendee({
              name: modalName, email: modalEmail, ticketType: modalTicket, image: modalLogo,
              status: "registered", registeredDate: new Date().toISOString().split("T")[0],
            }, activeEventId);
            setAttendees(prev => [...prev, saved]);
            break;
          }
          case "org": {
            const saved = await upsertOrganization({
              name: modalName, industry: modalSector, contact: modalContact,
              website: modalWebsite || "https://", logo: modalLogo,
            });
            setOrganizations(prev => [...prev, saved]);
            break;
          }
          case "sponsor": {
            const saved = await upsertSponsor({
              name: modalName, tier: modalTier,
              website: modalWebsite || "#", image: modalLogo || "",
            }, activeEventId);
            setSponsors(prev => [...prev, saved]);
            break;
          }
          case "exhibitor": {
            const org = organizations.find(o => String(o.id) === String(modalOrgId));
            if (org) {
              const saved = await upsertExhibitor({
                org_id: org.id, name: org.name,
                logo: org.logo || "", contact: org.contact || "", booth: "Not Assigned",
                email: modalEmail,
              }, activeEventId);
              setExhibitors(prev => [...prev, saved]);
            }
            break;
          }
          case "ticket": {
            const saved = await upsertTicket({
              name: modalName, price: parseInt(modalPrice) || 0,
              maxQty: parseInt(modalMax) || 100,
              features: modalFeatures.split(",").map(f => f.trim()),
            }, activeEventId);
            setTickets(prev => [...prev, saved]);
            break;
          }
          case "team": {
            const saved = await upsertTeamMember({
              name: modalName, email: modalEmail, role: modalRole, status: "Pending Invite",
            }, activeEventId);
            setTeam(prev => [...prev, saved]);
            break;
          }
        }
      } catch (err) {
        console.error("Failed to save record:", err);
      }
    }

    closeModal();
  };

  const closeModal = () => {
    setActiveModalType(null);
    setEditingItem(null);
    setModalName("");
    setModalEmail("");
    setModalSector("");
    setModalContact("");
    setModalWebsite("");
    setModalBooth("");
    setModalPrice("");
    setModalMax("");
    setModalFeatures("");
    setModalLogo("");
    setModalOrgId("");
    setIndustrySearch("");
    setIndustryDropdownOpen(false);
  };

  const handleOpenModal = (type, item = null) => {
    setActiveModalType(type);
    if (item) {
      setEditingItem(item);
      setModalName(item.name || "");
      if (type === "attendee") {
        setModalEmail(item.email || "");
        setModalTicket(item.ticketType || "Standard Admission");
        setModalLogo(item.image || "");
      } else if (type === "org") {
        setModalSector(item.industry || "");
        setIndustrySearch(item.industry || "");
        setModalContact(item.contact || "");
        setModalWebsite(item.website || "");
        setModalLogo(item.logo || "");
      } else if (type === "sponsor") {
        setModalName(item.name || "");
        setModalTier(item.tier || "silver");
        setModalWebsite(item.website || "");
        setModalLogo(item.image || "");
      } else if (type === "exhibitor") {
        setModalOrgId(item.org_id || "");
        setModalEmail(item.email || "");
      } else if (type === "ticket") {
        setModalName(item.name || "");
        setModalPrice(item.price || "");
        setModalMax(item.maxQty || "");
        setModalFeatures(Array.isArray(item.features) ? item.features.join(", ") : "");
      } else if (type === "team") {
        setModalName(item.name || "");
        setModalEmail(item.email || "");
        setModalRole(item.role || "Staff");
      }
    }
  };

  const handleLogoFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const publicUrl = await uploadFileToBucket(file, 'floor-plans', activeEventId);
      if (publicUrl) setModalLogo(publicUrl);
    } catch (err) {
      console.error("Logo upload failed:", err);
    }
  };

  // If session is checking
  if (!authInitialized) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <span className="w-8 h-8 border-3 border-blue-500 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  // ==========================================================================
  // 0.5. DEDICATED FULL-PAGE AUTHENTICATION VIEW (SIGN IN / SIGN UP)
  // ==========================================================================
  if (currentView === "auth") {
    return (
      <AuthView
        initialMode={authModalInitialMode || "signin"}
        onAuthSuccess={handleAuthSuccess}
        onClose={() => setCurrentView("home")}
        onGoToHome={() => setCurrentView("home")}
      />
    );
  }

  // ==========================================================================
  // 0.8. DEDICATED FULL-PAGE PROFESSIONAL NETWORKING PROFILE VIEW
  // ==========================================================================
  if (currentView === "profile") {
    return (
      <ProfileView
        currentUser={currentUser}
        onSaveProfile={handleUpdateProfile}
        onGoToHome={() => setCurrentView("home")}
        onOpenAuth={(mode) => {
          setAuthModalInitialMode(mode || "signin");
          setCurrentView("auth");
        }}
        onSignOut={handleSignOut}
        registrations={visitorRegistrations}
      />
    );
  }

  // ==========================================================================
  // 1. DEFAULT PUBLIC HOME PAGE (BROWSE & ROLLING HERO)
  // ==========================================================================
  if (currentView === "home") {
    return (
      <>
        <MainHomePage
          events={publicEvents.length > 0 ? publicEvents : SHOWCASE_EVENTS}
          registrations={visitorRegistrations}
          currentUser={currentUser}
          onOpenAuth={(mode) => {
            setAuthModalInitialMode(mode || "signin");
            setCurrentView("auth");
          }}
          onSignOut={handleSignOut}
          onSwitchRole={handleToggleRole}
          onUpdateProfile={handleUpdateProfile}
          onOpenProfile={() => setCurrentView("profile")}
          onOpenEventsHub={() => {
            if (!currentUser) {
              setAuthModalInitialMode("signup");
              setCurrentView("auth");
            } else {
              setCurrentView("events-hub");
            }
          }}
          onOpenVisitorPasses={() => setCurrentView("visitor-portal")}
          onSelectEventForDashboard={(eventId) => {
            setActiveEventStateId(eventId);
            setCurrentView("overview");
          }}
          onViewFloorPlan={(eventId) => {
            setActiveEventStateId(eventId);
            setCurrentView("floor-plan");
            setInitialPreviewMode(true);
          }}
          onViewLivePage={(eventId) => {
            setActiveEventStateId(eventId);
            setCurrentView("event-landing");
          }}
          onRegisterForEvent={handleVisitorRegister}
        />
      </>
    );
  }

  // ==========================================================================
  // 1.5. EVENT PUBLIC LANDING PAGE (VISITOR & ATTENDEE VIEW)
  // ==========================================================================
  if (currentView === "event-landing") {
    const landingEventDetails = publicEvents.find(e => e.id === activeEventId) || userEvents.find(e => e.id === activeEventId) || eventDetails;
    return (
      <EventPublicLandingPage
        eventId={activeEventId}
        eventDetails={landingEventDetails}
        sessions={sessions}
        sponsors={sponsors}
        exhibitors={exhibitors.map(ex => {
          const org = organizations.find(o => String(o.id) === String(ex.org_id));
          return {
            ...ex,
            logo: ex.logo || org?.logo || '',
          };
        })}
        attendees={attendees}
        tickets={tickets}
        forms={forms}
        formSubmissions={formSubmissions}
        onSubmitFormResponse={async (sub) => {
          const saved = await submitFormResponse(sub, activeEventId);
          setFormSubmissions(prev => [saved, ...prev]);
          return saved;
        }}
        currentUser={currentUser}
        onBackToHome={() => setCurrentView("home")}
        onViewFloorPlan={(eventId) => {
          setActiveEventStateId(eventId || activeEventId);
          setCurrentView("floor-plan");
          setInitialPreviewMode(true);
        }}
        onRegisterForEvent={handleVisitorRegister}
        onOpenAuth={(mode) => {
          setAuthModalInitialMode(mode || "signup");
          setCurrentView("auth");
        }}
      />
    );
  }

  // ==========================================================================
  // 2. ORGANIZER EVENTS HUB VIEW
  // ==========================================================================
  if (currentView === "events-hub") {
    return (
      <OrganizerEventsHub
        events={userEvents.length > 0 ? userEvents : SHOWCASE_EVENTS}
        onSelectEvent={(id) => {
          setActiveEventStateId(id);
          setCurrentView("overview");
        }}
        onCreateEventClick={() => setCurrentView("create-event")}
        onDeleteEvent={handleDeleteEvent}
        onSwitchToVisitor={() => handleToggleRole("visitor")}
        onGoToHome={() => setCurrentView("home")}
        onSignOut={handleSignOut}
        user={currentUser}
      />
    );
  }

  // ==========================================================================
  // 2.5. CREATE NEW EVENT (DEDICATED FULL-PAGE VIEW)
  // ==========================================================================
  if (currentView === "create-event") {
    return (
      <EventCreationWizard
        onCancel={() => setCurrentView("events-hub")}
        onEventCreated={handleEventCreated}
        userId={currentUser?.id}
      />
    );
  }

  // ==========================================================================
  // 3. VISITOR PORTAL
  // ==========================================================================
  if (currentView === "visitor-portal") {
    return (
      <>
        <VisitorPortal
          events={publicEvents.length > 0 ? publicEvents : SHOWCASE_EVENTS}
          registrations={visitorRegistrations}
          onRegisterForEvent={handleVisitorRegister}
          onViewFloorPlan={(eventId) => {
            setActiveEventStateId(eventId);
            setCurrentView("floor-plan");
            setInitialPreviewMode(true);
          }}
          onViewLivePage={(eventId) => {
            setActiveEventStateId(eventId);
            setCurrentView("event-landing");
          }}
          onSwitchToOrganizer={() => handleToggleRole("organizer")}
          onSignOut={handleSignOut}
          onOpenProfile={() => setCurrentView("profile")}
          user={currentUser}
        />
      </>
    );
  }

  // ==========================================================================
  // 4. SINGLE EVENT DASHBOARD (ORGANIZER VIEW)
  // ==========================================================================
  const currentEventSummary = userEvents.find(e => e.id === activeEventId) || eventDetails;

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans">
      {/* Sidebar Navigation — hidden while editing a floor plan in full preview */}
      {!(currentView === "floor-plan" && activeFloorPlanId !== null && initialPreviewMode) && (
      <aside className="w-[260px] h-screen bg-white border-r border-slate-200 py-6 px-4 flex flex-col justify-between sticky top-0 overflow-y-auto shrink-0 select-none z-40">
        <div className="space-y-5">
          {/* Top Logo & Back to Public Home */}
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => setCurrentView("home")}>
              <img src="https://i.imgur.com/jFDrQbM.png" alt="eventzone" className="h-6 w-auto object-contain" />
            </div>

            <button
              onClick={() => setCurrentView("home")}
              className="p-1.5 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-slate-50 transition-colors"
              title="Return to Public Home"
            >
              <HomeIcon size={16} />
            </button>
          </div>

          {/* Active Event Selector Box */}
          <div className="relative">
            <div 
              onClick={() => setEventSwitcherOpen(o => !o)}
              className="p-2.5 bg-slate-50 hover:bg-blue-50/50 border border-slate-200 hover:border-blue-200 rounded-2xl cursor-pointer transition-all flex items-center justify-between group"
            >
              <div className="flex items-center gap-2 overflow-hidden">
                <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs shrink-0">
                  <Building2 size={15} />
                </div>
                <div className="flex flex-col text-left overflow-hidden">
                  <span className="text-[11px] font-bold text-slate-900 truncate leading-tight">
                    {currentEventSummary.title || eventDetails.title}
                  </span>
                  <span className="text-[9px] text-slate-400 font-medium truncate">
                    {currentEventSummary.type || "Hybrid"} Event
                  </span>
                </div>
              </div>
              <ChevronDown size={13} className={`text-slate-400 group-hover:text-slate-600 transition-transform ${eventSwitcherOpen ? "rotate-180" : ""}`} />
            </div>

            {/* Event Switcher Dropdown */}
            {eventSwitcherOpen && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 p-2 space-y-1 animate-scale-up">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider px-2 py-1 block">
                  Switch Event
                </span>
                <div className="max-h-48 overflow-y-auto space-y-0.5">
                  {userEvents.map(ev => (
                    <button
                      key={ev.id}
                      onClick={() => {
                        setActiveEventStateId(ev.id);
                        setEventSwitcherOpen(false);
                      }}
                      className={`w-full text-left p-2 rounded-xl text-xs font-bold transition-all flex items-center justify-between ${
                        ev.id === activeEventId ? "bg-blue-50 text-blue-700" : "text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      <span className="truncate">{ev.title}</span>
                      {ev.id === activeEventId && <CheckCircle2 size={12} className="text-blue-600 shrink-0" />}
                    </button>
                  ))}
                </div>

                <div className="pt-2 border-t border-slate-100 mt-1 space-y-1">
                  <button
                    onClick={() => {
                      setEventSwitcherOpen(false);
                      setCurrentView("create-event");
                    }}
                    className="w-full text-left p-2 rounded-xl text-xs font-bold text-blue-600 hover:bg-blue-50 flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus size={13} />
                    <span>+ Host New Event</span>
                  </button>

                  <button
                    onClick={() => {
                      setEventSwitcherOpen(false);
                      setCurrentView("events-hub");
                    }}
                    className="w-full text-left p-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 flex items-center gap-1.5 cursor-pointer"
                  >
                    <Layers size={13} />
                    <span>All Events Hub</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Navigation Links */}
          <nav className="flex flex-col gap-1">
            <button 
              onClick={() => setCurrentView("overview")}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-xl font-bold text-xs transition-all text-left ${currentView === "overview" ? "bg-blue-600 text-white shadow-xs" : "text-slate-500 hover:bg-slate-50 hover:text-blue-600"}`}
            >
              <LayoutDashboard size={15} />
              <span>Overview</span>
            </button>

            <button 
              onClick={() => setCurrentView("event-details")}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-xl font-bold text-xs transition-all text-left ${["event-details", "page-builder"].includes(currentView) ? "bg-blue-600 text-white shadow-xs" : "text-slate-500 hover:bg-slate-50 hover:text-blue-600"}`}
            >
              <Globe size={15} />
              <span>Event Details</span>
            </button>

            <button 
              onClick={() => setCurrentView("calendar")}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-xl font-bold text-xs transition-all text-left ${currentView === "calendar" ? "bg-blue-600 text-white shadow-xs" : "text-slate-500 hover:bg-slate-50 hover:text-blue-600"}`}
            >
              <Calendar size={15} />
              <span>Timeline</span>
            </button>

            {/* Expandable Participants Submenu */}
            <div className="flex flex-col">
              <button 
                onClick={() => setParticipantsOpen(!participantsOpen)}
                className={`flex items-center justify-between px-4 py-2.5 rounded-xl font-bold text-xs transition-all text-left ${["attendees", "pending", "organizations", "sponsors", "exhibitors", "speakers"].includes(currentView) ? "text-blue-700 bg-blue-50/50 font-extrabold" : "text-slate-500 hover:bg-slate-50"}`}
              >
                <div className="flex items-center gap-3">
                  <Users2 size={15} />
                  <span>Participants</span>
                </div>
                <ChevronDown size={13} className={`transition-transform duration-200 ${participantsOpen ? "rotate-180" : ""}`} />
              </button>

              {participantsOpen && (
                <div className="flex flex-col gap-0.5 pl-6 mt-1 border-l border-slate-100 ml-6">
                  <button 
                    onClick={() => setCurrentView("attendees")}
                    className={`flex items-center justify-between px-3 py-1.5 rounded-lg font-semibold text-xs text-left transition-all ${currentView === "attendees" ? "text-blue-700 bg-blue-50 font-bold" : "text-slate-400 hover:text-blue-600"}`}
                  >
                    <span>All Attendees</span>
                    <span className={`text-[9px] font-extrabold py-0.5 px-2 rounded-full ${currentView === "attendees" ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-500"}`}>{attendees.length}</span>
                  </button>

                  <button 
                    onClick={() => setCurrentView("pending")}
                    className={`flex items-center justify-between px-3 py-1.5 rounded-lg font-semibold text-xs text-left transition-all ${currentView === "pending" ? "text-blue-700 bg-blue-50 font-bold" : "text-slate-400 hover:text-blue-600"}`}
                  >
                    <span>Pending</span>
                    <span className={`text-[9px] font-extrabold py-0.5 px-2 rounded-full ${currentView === "pending" ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-500"}`}>{pending.length}</span>
                  </button>

                  <button 
                    onClick={() => setCurrentView("organizations")}
                    className={`flex items-center justify-between px-3 py-1.5 rounded-lg font-semibold text-xs text-left transition-all ${currentView === "organizations" ? "text-blue-700 bg-blue-50 font-bold" : "text-slate-400 hover:text-blue-600"}`}
                  >
                    <span>Organizations</span>
                    <span className={`text-[9px] font-extrabold py-0.5 px-2 rounded-full ${currentView === "organizations" ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-500"}`}>{organizations.length}</span>
                  </button>

                  <button 
                    onClick={() => setCurrentView("sponsors")}
                    className={`flex items-center justify-between px-3 py-1.5 rounded-lg font-semibold text-xs text-left transition-all ${currentView === "sponsors" ? "text-blue-700 bg-blue-50 font-bold" : "text-slate-400 hover:text-blue-600"}`}
                  >
                    <span>Sponsors</span>
                    <span className={`text-[9px] font-extrabold py-0.5 px-2 rounded-full ${currentView === "sponsors" ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-500"}`}>{sponsors.length}</span>
                  </button>

                  <button 
                    onClick={() => setCurrentView("exhibitors")}
                    className={`flex items-center justify-between px-3 py-1.5 rounded-lg font-semibold text-xs text-left transition-all ${currentView === "exhibitors" ? "text-blue-700 bg-blue-50 font-bold" : "text-slate-400 hover:text-blue-600"}`}
                  >
                    <span>Exhibitors</span>
                    <span className={`text-[9px] font-extrabold py-0.5 px-2 rounded-full ${currentView === "exhibitors" ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-500"}`}>{exhibitors.length}</span>
                  </button>

                  <button 
                    onClick={() => setCurrentView("speakers")}
                    className={`flex items-center justify-between px-3 py-1.5 rounded-lg font-semibold text-xs text-left transition-all ${currentView === "speakers" ? "text-blue-700 bg-blue-50 font-bold" : "text-slate-400 hover:text-blue-600"}`}
                  >
                    <span>Speakers</span>
                    <span className={`text-[9px] font-extrabold py-0.5 px-2 rounded-full ${currentView === "speakers" ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-500"}`}>{getUniqueSpeakersCount()}</span>
                  </button>
                </div>
              )}
            </div>

            <button 
              onClick={() => { setCurrentView("floor-plan"); setActiveFloorPlanId(null); }}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-xl font-bold text-xs transition-all text-left ${currentView === "floor-plan" ? "bg-blue-600 text-white shadow-xs" : "text-slate-500 hover:bg-slate-50 hover:text-blue-600"}`}
            >
              <Map size={15} />
              <span>Floor Plans</span>
              <span className={`ml-auto text-[9px] font-extrabold py-0.5 px-2 rounded-full ${currentView === "floor-plan" ? "bg-white/25 text-white" : "bg-slate-100 text-slate-500"}`}>{floorPlans.length}</span>
            </button>

            <button 
              onClick={() => setCurrentView("tickets")}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-xl font-bold text-xs transition-all text-left ${currentView === "tickets" ? "bg-blue-600 text-white shadow-xs" : "text-slate-500 hover:bg-slate-50 hover:text-blue-600"}`}
            >
              <Ticket size={15} />
              <span>Tickets</span>
            </button>

            <button 
              onClick={() => setCurrentView("forms")}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-xl font-bold text-xs transition-all text-left ${currentView === "forms" ? "bg-blue-600 text-white shadow-xs" : "text-slate-500 hover:bg-slate-50 hover:text-blue-600"}`}
            >
              <FileText size={15} />
              <span>Forms & Surveys</span>
              <span className={`ml-auto text-[9px] font-extrabold py-0.5 px-2 rounded-full ${currentView === "forms" ? "bg-white/25 text-white" : "bg-slate-100 text-slate-500"}`}>{forms.length}</span>
            </button>

            <button 
              onClick={() => setCurrentView("check-in")}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-xl font-bold text-xs transition-all text-left ${currentView === "check-in" ? "bg-blue-600 text-white shadow-xs" : "text-slate-500 hover:bg-slate-50 hover:text-blue-600"}`}
            >
              <CheckCircle2 size={15} />
              <span>Check In</span>
            </button>

            <button 
              onClick={() => setCurrentView("my-team")}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-xl font-bold text-xs transition-all text-left ${currentView === "my-team" ? "bg-blue-600 text-white shadow-xs" : "text-slate-500 hover:bg-slate-50 hover:text-blue-600"}`}
            >
              <ShieldAlert size={15} />
              <span>My Team</span>
            </button>

            <button 
              onClick={() => setCurrentView("analytics")}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-xl font-bold text-xs transition-all text-left ${currentView === "analytics" ? "bg-blue-600 text-white shadow-xs" : "text-slate-500 hover:bg-slate-50 hover:text-blue-600"}`}
            >
              <BarChart3 size={15} />
              <span>Analytics</span>
            </button>

            <button 
              onClick={() => setCurrentView("communications")}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-xl font-bold text-xs transition-all text-left ${currentView === "communications" ? "bg-blue-600 text-white shadow-xs" : "text-slate-500 hover:bg-slate-50 hover:text-blue-600"}`}
            >
              <Mail size={15} />
              <span>Communications</span>
            </button>
          </nav>
        </div>

        {/* Sidebar Footer: User Profile Pill & Role Switcher */}
        <div className="pt-4 border-t border-slate-150 relative">
          <div 
            onClick={() => setProfileDropdownOpen(o => !o)}
            className="flex items-center justify-between p-2 rounded-2xl hover:bg-slate-50 cursor-pointer transition-colors"
          >
            <div className="flex items-center gap-2.5 overflow-hidden">
              <img 
                src={currentUser?.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80"} 
                alt="Avatar" 
                className="w-8 h-8 rounded-full object-cover border border-slate-200 shrink-0" 
              />
              <div className="flex flex-col text-left overflow-hidden">
                <span className="text-xs font-bold text-slate-800 truncate leading-tight">{currentUser?.fullName || "Organizer"}</span>
                <span className="text-[9px] font-semibold text-blue-600">Organizer Mode</span>
              </div>
            </div>
            <ChevronDown size={13} className="text-slate-400 shrink-0" />
          </div>

          {/* Profile Dropdown */}
          {profileDropdownOpen && (
            <div className="absolute bottom-full left-0 right-0 mb-2 bg-white border border-slate-200 rounded-2xl shadow-xl p-2 space-y-1 z-50 animate-scale-up">
              <button
                onClick={() => {
                  setProfileDropdownOpen(false);
                  setCurrentView("profile");
                }}
                className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold text-slate-800 hover:bg-slate-50 flex items-center gap-2 transition-colors cursor-pointer"
              >
                <User size={14} className="text-blue-600" />
                <span>My Networking Profile</span>
              </button>

              <button
                onClick={() => setCurrentView("home")}
                className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-2 transition-colors cursor-pointer"
              >
                <HomeIcon size={14} />
                <span>Public Home</span>
              </button>

              <button
                onClick={() => {
                  setProfileDropdownOpen(false);
                  setCurrentView("events-hub");
                }}
                className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold text-blue-700 hover:bg-blue-50 flex items-center gap-2 transition-colors cursor-pointer"
              >
                <Layers size={14} />
                <span>Organizer Center</span>
              </button>

              <button
                onClick={() => handleToggleRole("visitor")}
                className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold text-emerald-700 hover:bg-emerald-50 flex items-center gap-2 transition-colors cursor-pointer"
              >
                <Compass size={14} />
                <span>Switch to Visitor Mode</span>
              </button>

              <div className="h-px bg-slate-100 my-1" />

              <button
                onClick={handleSignOut}
                className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 flex items-center gap-2 transition-colors cursor-pointer"
              >
                <LogOut size={14} />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </aside>
      )}

      {/* Main Viewport */}
      <main className="flex-1 min-w-0 flex flex-col">
        {/* Dynamic content views router */}
        <div className={`flex-1 ${
          currentView === "floor-plan" && activeFloorPlanId !== null && initialPreviewMode 
            ? "overflow-hidden h-[100dvh] flex flex-col p-0" 
            : `overflow-y-auto ${currentView === "floor-plan" && activeFloorPlanId !== null ? "p-4" : "p-8 md:p-12"}`
        }`}>
          {currentView === "overview" && (
            <Overview 
              eventDetails={eventDetails}
              attendees={attendees}
              sessions={sessions}
              tickets={tickets}
              onSwitchView={setCurrentView}
              onOpenModal={handleOpenModal}
            />
          )}

          {currentView === "calendar" && (
            <CalendarView 
              sessions={sessions}
              attendees={attendees}
              onSaveSessions={(newSessions) => {
                syncArrayToDb(sessions, newSessions, upsertSession, deleteSession);
                setSessions(newSessions);
              }}
              onClearAllSessions={async () => {
                if (confirm("Are you sure you want to clear all sessions?")) {
                  await Promise.all(sessions.map(s => deleteSession(s.id).catch(console.error)));
                  setSessions([]);
                }
              }}
              onUploadFile={uploadFileToBucket}
            />
          )}

          {currentView === "floor-plan" && activeFloorPlanId === null && (
            <FloorPlanGallery
              floorPlans={floorPlans}
              onEdit={(id) => setActiveFloorPlanId(id)}
              onCreateNew={handleCreateFloorPlan}
              onDuplicate={handleDuplicateFloorPlan}
              onDelete={handleDeleteFloorPlan}
              onRename={handleRenameFloorPlan}
            />
          )}

          {currentView === "floor-plan" && activeFloorPlanId !== null && activePlan && (
            <FloorPlanModifier 
              exhibitors={exhibitors.map(ex => {
                const org = organizations.find(o => String(o.id) === String(ex.org_id));
                return {
                  ...ex,
                  logo: ex.logo || org?.logo || '',
                };
              })}
              attendees={attendees}
              initialLayout={activePlan.elements}
              initialBlueprintState={activePlan.blueprint}
              initialFloors={activePlan.floors || []}
              fontFamily={activePlan.fontFamily || "Inter"}
              planName={activePlan.name}
              floorPlanId={activeFloorPlanId}
              onSaveLayout={(elements) => handleSaveFloorPlanElements(activeFloorPlanId, elements)}
              onSaveBlueprintState={(bp) => handleSaveFloorPlanBlueprint(activeFloorPlanId, bp)}
              onSaveFloors={(floors) => handleSaveFloorPlanFloors(activeFloorPlanId, floors)}
              onSaveFontFamily={(font) => handleSaveFloorPlanFontFamily(activeFloorPlanId, font)}
              onBack={() => {
                setActiveFloorPlanId(null);
                setInitialPreviewMode(false);
              }}
              onRename={(newName) => handleRenameFloorPlan(activeFloorPlanId, newName)}
              onUploadFile={uploadFileToBucket}
              saveStatus={saveStatus}
              initialPreviewMode={initialPreviewMode}
            />
          )}

          {(currentView === "page-builder" || currentView === "event-details") && (
            <EventDetailsView 
              eventDetails={eventDetails}
              onUpdateEventDetails={(val) => handleUpdateState("eventDetails", val)}
              sessions={sessions}
              sponsors={sponsors}
              exhibitors={exhibitors.map(ex => {
                const org = organizations.find(o => String(o.id) === String(ex.org_id));
                return {
                  ...ex,
                  logo: ex.logo || org?.logo || '',
                };
              })}
              tickets={tickets}
              onPreviewLandingPage={() => setCurrentView("event-landing")}
              onUploadFile={uploadFileToBucket}
            />
          )}

          {currentView === "forms" && (
            <FormsView
              forms={forms}
              submissions={formSubmissions}
              tickets={tickets}
              onSaveForm={async (form) => {
                const saved = await upsertForm(form, activeEventId);
                setForms(prev => {
                  const exists = prev.some(f => f.id === saved.id);
                  return exists ? prev.map(f => f.id === saved.id ? saved : f) : [saved, ...prev];
                });
              }}
              onDeleteForm={async (formId) => {
                await deleteForm(formId);
                setForms(prev => prev.filter(f => f.id !== formId));
                setFormSubmissions(prev => prev.filter(s => s.formId !== formId));
              }}
              onSubmitResponse={async (sub) => {
                const saved = await submitFormResponse(sub, activeEventId);
                setFormSubmissions(prev => [saved, ...prev]);
              }}
              activeEventTitle={eventDetails?.title || "Eventzone Summit"}
            />
          )}

          {!["overview", "calendar", "page-builder", "event-details", "forms"].includes(currentView) && currentView !== "floor-plan" && (
            <GenericTableView 
              viewName={currentView}
              state={{
                eventDetails,
                attendees,
                pending,
                organizations,
                sponsors,
                exhibitors,
                tickets,
                team,
                sessions,
                forms
              }}
              onUpdateState={handleUpdateState}
              onOpenModal={handleOpenModal}
              onUploadFile={uploadFileToBucket}
              onSwitchView={setCurrentView}
            />
          )}
        </div>
      </main>


      {/* Record Creation Modals */}
      {activeModalType && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-white border border-slate-150 rounded-3xl p-8 max-w-md w-full shadow-2xl flex flex-col gap-6 relative animate-scale-up">
            <header className="flex justify-between items-center select-none">
              <h3 className="text-lg font-bold text-slate-800">
                {activeModalType === "attendee" && "Add New Attendee"}
                {activeModalType === "org" && "Add Partner Organization"}
                {activeModalType === "sponsor" && "Add Event Sponsor"}
                {activeModalType === "exhibitor" && "Register Exhibitor"}
                {activeModalType === "ticket" && "Create Ticket Tier"}
                {activeModalType === "team" && "Invite Team Member"}
              </h3>
              <button 
                onClick={closeModal}
                className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center text-slate-400 hover:text-rose-500 hover:border-rose-100 transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </header>

            <form onSubmit={handleModalSubmit} className="flex flex-col gap-5">
              {activeModalType === "attendee" && (
                <>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Full Name</label>
                    <input type="text" required value={modalName} onChange={(e) => setModalName(e.target.value)} placeholder="e.g. Elena Rostova" className="px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-600" />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Email Address</label>
                    <input type="email" required value={modalEmail} onChange={(e) => setModalEmail(e.target.value)} placeholder="elena@example.com" className="px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-600" />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Ticket Type</label>
                    <select value={modalTicket} onChange={(e) => setModalTicket(e.target.value)} className="px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs font-semibold bg-white focus:outline-none focus:border-blue-600">
                      <option value="VIP Access Pass">VIP Access Pass</option>
                      <option value="Standard Admission">Standard Admission</option>
                      <option value="Online Only">Online Only</option>
                    </select>
                  </div>
                </>
              )}

              {activeModalType === "org" && (
                <>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Organization Name</label>
                    <input type="text" required value={modalName} onChange={(e) => setModalName(e.target.value)} placeholder="e.g. Sonatrach" className="px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-600" />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Sector / Industry</label>
                    <input type="text" required value={modalSector} onChange={(e) => setModalSector(e.target.value)} placeholder="e.g. Energy" className="px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-600" />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Contact Person</label>
                    <input type="text" required value={modalContact} onChange={(e) => setModalContact(e.target.value)} placeholder="e.g. Ahmed B." className="px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-600" />
                  </div>
                </>
              )}

              {activeModalType === "sponsor" && (
                <>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Sponsor Name</label>
                    <input type="text" required value={modalName} onChange={(e) => setModalName(e.target.value)} placeholder="e.g. Air Liquide" className="px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-600" />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tier</label>
                    <select value={modalTier} onChange={(e) => setModalTier(e.target.value)} className="px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs font-semibold bg-white focus:outline-none focus:border-blue-600">
                      <option value="diamond">Diamond Tier</option>
                      <option value="gold">Gold Tier</option>
                      <option value="silver">Silver Tier</option>
                    </select>
                  </div>
                </>
              )}

              {activeModalType === "exhibitor" && (
                <>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Select Organization</label>
                    <select value={modalOrgId} onChange={(e) => setModalOrgId(e.target.value)} required className="px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs font-semibold bg-white focus:outline-none focus:border-blue-600">
                      <option value="">-- Choose Organization --</option>
                      {organizations.map(org => (
                        <option key={org.id} value={org.id}>{org.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Contact Email</label>
                    <input type="email" required value={modalEmail} onChange={(e) => setModalEmail(e.target.value)} placeholder="exhibitor@domain.com" className="px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-600" />
                  </div>
                </>
              )}

              {activeModalType === "ticket" && (
                <>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Ticket Tier Name</label>
                    <input type="text" required value={modalName} onChange={(e) => setModalName(e.target.value)} placeholder="e.g. VIP Access Pass" className="px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-600" />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Price ($ USD)</label>
                    <input type="number" required value={modalPrice} onChange={(e) => setModalPrice(e.target.value)} placeholder="199" className="px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-600" />
                  </div>
                </>
              )}

              {activeModalType === "team" && (
                <>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Member Name</label>
                    <input type="text" required value={modalName} onChange={(e) => setModalName(e.target.value)} placeholder="e.g. Sarah K." className="px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-600" />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Email Address</label>
                    <input type="email" required value={modalEmail} onChange={(e) => setModalEmail(e.target.value)} placeholder="sarah@eventzone.io" className="px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-600" />
                  </div>
                </>
              )}
              
              <button 
                type="submit" 
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3.5 px-4 rounded-xl text-xs transition-all hover:shadow hover:-translate-y-0.5 mt-3 cursor-pointer"
              >
                Save Entry
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
