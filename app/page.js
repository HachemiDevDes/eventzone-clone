/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import dynamic from "next/dynamic";
import { 
  CheckCircle2, Ticket, ShieldAlert, ShieldCheck,
  ChevronDown, LayoutDashboard, Calendar, Clock,
  Users2, UserCheck, BarChart3, X, Globe, Map, Sparkles, Upload, Mail,
  Building2, Plus, ArrowLeft, ArrowRight, Layers, LogOut, Compass, ExternalLink, ChevronRight, Home as HomeIcon, User,
  FileText, ClipboardList, QrCode, Store, Mic2, Check
} from "lucide-react";

import MainHomePage from "../components/MainHomePage";
import Overview from "../components/Overview";
import CalendarView from "../components/CalendarView";
const FloorPlanModifier = dynamic(() => import("../components/FloorPlanModifier"), { ssr: false });
import FloorPlanGallery from "../components/FloorPlanGallery";
import GenericTableView from "../components/GenericTableView";
const LivePageBuilder = dynamic(() => import("../components/LivePageBuilder"), { ssr: false });
import EventDetailsView from "../components/EventDetailsView";
import AuthView from "../components/AuthView";
import OrganizerEventsHub from "../components/OrganizerEventsHub";
import EventCreationWizard from "../components/EventCreationWizard";
import VisitorPortal from "../components/VisitorPortal";
import EventPublicLandingPage from "../components/EventPublicLandingPage";
import ProfileView from "../components/ProfileView";
import MyTicketsPage from "../components/MyTicketsPage";
import FormsView from "../components/FormsView";
import RSVPView from "../components/RSVPView";
import PublicRSVPModal from "../components/PublicRSVPModal";
import TicketDrawer from "../components/TicketDrawer";
import { LanguageProvider, useLanguage } from "../lib/i18n";

import {
  fetchEventDetails, updateEventDetails,
  fetchSessions, upsertSession, deleteSession, archiveSession,
  fetchAttendees, upsertAttendee, deleteAttendee, archiveParticipant,
  fetchPending, upsertPending, deletePending,
  fetchOrganizations, upsertOrganization, deleteOrganization,
  fetchSponsors, upsertSponsor, deleteSponsor,
  fetchExhibitors, upsertExhibitor, deleteExhibitor,
  fetchTickets, upsertTicket, deleteTicket, archiveTicket,
  fetchTeam, upsertTeamMember, deleteTeamMember, archiveTeamMember,
  fetchFloorPlans, upsertFloorPlan, deleteFloorPlan, archiveFloorPlan, generateUuid,
  fetchForms, upsertForm, deleteForm, archiveForm,
  fetchFormSubmissions, submitFormResponse, deleteFormSubmission,
  fetchRSVPs, fetchRSVPSettings, upsertRSVPSettings, submitGuestRSVP, updateRSVPStatus, deleteRSVP, archiveRSVP,
  uploadFileToBucket,
  fetchUserEvents, fetchPublicEvents, createEvent, deleteEvent, archiveEvent, unarchiveEvent,
  fetchVisitorRegistrations, registerVisitorForEvent, upsertUserProfile,
  setActiveEventId, getActiveEventId, DEFAULT_EVENT_ID, SHOWCASE_EVENTS,
  subscribeToRealtimeSync, broadcastRealtimeChange
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

export function HomeContent() {
  const { t, lang, setLang, isRTL, dir, languages } = useLanguage();
  const [mounted, setMounted] = useState(() => typeof window !== "undefined");

  // Authentication & Role State
  const [currentUser, setCurrentUser] = useState(null);
  const [authInitialized, setAuthInitialized] = useState(true);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalInitialMode, setAuthModalInitialMode] = useState("signin");

  // Multi-Event State
  const [publicEvents, setPublicEvents] = useState([]);
  const [userEvents, setUserEvents] = useState([]);
  const [activeEventId, setActiveEventStateId] = useState(() => {
    if (typeof window !== "undefined") {
      const searchParams = new URLSearchParams(window.location.search);
      return searchParams.get("eventId") || DEFAULT_EVENT_ID;
    }
    return DEFAULT_EVENT_ID;
  });
  const [isCreationWizardOpen, setIsCreationWizardOpen] = useState(false);
  const [eventSwitcherOpen, setEventSwitcherOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);

  // Visitor Registrations
  const [visitorRegistrations, setVisitorRegistrations] = useState([]);

  // Main UI routing view: initialized synchronously from URL query param to eliminate flash of home page
  const [currentView, setCurrentView] = useState(() => {
    if (typeof window !== "undefined") {
      const searchParams = new URLSearchParams(window.location.search);
      const viewParam = searchParams.get("view");
      const validViews = [
        "home", "auth", "profile", "my-tickets", "events-hub", "create-event", "event-landing", "register", "visitor-portal", "overview", "page-builder", "calendar", "event-details", 
        "attendees", "pending", "organizations", "sponsors", 
        "exhibitors", "speakers", "tickets", "forms", "rsvp", "check-in", 
        "my-team", "analytics", "communications", "floor-plan"
      ];
      if (viewParam && validViews.includes(viewParam)) {
        return viewParam;
      }
    }
    return "home";
  }); 
  const [participantsOpen, setParticipantsOpen] = useState(false);
  const [activeFloorPlanId, setActiveFloorPlanId] = useState(() => {
    if (typeof window !== "undefined") {
      const searchParams = new URLSearchParams(window.location.search);
      return searchParams.get("planId") || null;
    }
    return null;
  });
  const [initialPreviewMode, setInitialPreviewMode] = useState(() => {
    if (typeof window !== "undefined") {
      const searchParams = new URLSearchParams(window.location.search);
      return searchParams.get("preview") === "true";
    }
    return false;
  });
  const [saveStatus, setSaveStatus] = useState("saved");

  // Single-event data
  const [eventDetails, setEventDetails] = useState(null);

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
  const [rsvps, setRsvps] = useState([]);
  const [rsvpSettings, setRsvpSettings] = useState(null);
  const [showGlobalPublicRsvp, setShowGlobalPublicRsvp] = useState(false);

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

    const syncSupabaseSession = async (explicitSession = null) => {
      try {
        let session = explicitSession;
        if (!session) {
          const { data } = await supabase.auth.getSession();
          session = data?.session;
        }
        if (session?.user && isMounted) {
          const userId = session.user.id;
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .maybeSingle();

          const retrievedName = profile?.full_name || session.user.user_metadata?.full_name || session.user.user_metadata?.name || session.user.email?.split('@')[0] || "Eventzone User";
          const retrievedRole = profile?.role || session.user.user_metadata?.role || "organizer";
          const retrievedAvatar = profile?.avatar_url || session.user.user_metadata?.avatar_url || session.user.user_metadata?.picture || `https://ui-avatars.com/api/?name=${encodeURIComponent(retrievedName)}&background=0b5cdb&color=fff`;

          if (!profile) {
            await supabase.from('profiles').upsert({
              id: userId,
              full_name: retrievedName,
              email: session.user.email,
              avatar_url: retrievedAvatar,
              role: retrievedRole === 'attendee' ? 'attendee' : 'organizer'
            }).catch(console.error);
          }

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
          if (!profileChannel) {
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
        }
      } catch (err) {
        console.warn("Supabase live session sync:", err);
      } finally {
        if (isMounted) setAuthInitialized(true);
      }
    };

    syncSupabaseSession();

    // 3. Listen to auth state changes (e.g. login, token refresh, logout, OAuth callback)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_OUT" && isMounted) {
        if (typeof window !== "undefined") {
          localStorage.removeItem("eventzone_user");
        }
        setCurrentUser(null);
      } else if ((event === "SIGNED_IN" || event === "USER_UPDATED" || event === "TOKEN_REFRESHED") && session?.user && isMounted) {
        await syncSupabaseSession(session);
        setCurrentView(prev => (prev === "auth" ? "events-hub" : prev));
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
        setPublicEvents(pEvents || []);
        setUserEvents(uEvents || []);
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
          fetchRSVPs(activeEventId),
          fetchRSVPSettings(activeEventId),
        ]);

        const [
          eventResult, sessionsResult, attendeesResult, pendingResult,
          orgsResult, sponsorsResult, exhibitorsResult, ticketsResult,
          teamResult, floorPlansResult, formsResult, formSubsResult,
          rsvpsResult, rsvpSettingsResult
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
        if (rsvpsResult.status === "fulfilled") setRsvps(rsvpsResult.value);
        if (rsvpSettingsResult.status === "fulfilled") setRsvpSettings(rsvpSettingsResult.value);

      } catch (err) {
        console.error("Unexpected error loading data for event:", err);
      } finally {
        setIsLoading(false);
      }
    };

    loadEventData();
  }, [activeEventId]);

  // Real-time Event Subscription (Cross-tab & Multi-device Live Sync)
  useEffect(() => {
    if (!activeEventId) return;

    // 1. Cross-tab in-browser real-time broadcast listener
    const unsubscribeSync = subscribeToRealtimeSync((data) => {
      const { type, payload, eventId } = data || {};
      if (eventId && eventId !== activeEventId && eventId !== DEFAULT_EVENT_ID) return;

      if (type === "FORM_SAVED" && payload) {
        setForms(prev => {
          const exists = prev.some(f => f.id === payload.id);
          return exists ? prev.map(f => f.id === payload.id ? payload : f) : [payload, ...prev];
        });
      } else if (type === "FORM_DELETED" && payload?.id) {
        setForms(prev => prev.filter(f => f.id !== payload.id));
      } else if (type === "SUBMISSION_ADDED" && payload) {
        setFormSubmissions(prev => {
          const exists = prev.some(s => s.id === payload.id);
          return exists ? prev : [payload, ...prev];
        });
      } else if (type === "SUBMISSION_DELETED" && payload?.id) {
        setFormSubmissions(prev => prev.filter(s => s.id !== payload.id));
      } else if (type === "RSVP_SUBMITTED" && payload) {
        setRsvps(prev => {
          const exists = prev.some(r => r.id === payload.id);
          return exists ? prev.map(r => r.id === payload.id ? payload : r) : [payload, ...prev];
        });
      } else if (type === "RSVP_UPDATED" && payload) {
        setRsvps(prev => prev.map(r => r.id === payload.id ? payload : r));
      } else if (type === "RSVP_DELETED" && payload?.id) {
        setRsvps(prev => prev.filter(r => r.id !== payload.id));
      } else if (type === "RSVP_SETTINGS_SAVED" && payload) {
        setRsvpSettings(payload);
      }
    });

    // 2. Supabase Realtime Postgres Changes Channel
    let eventChannel = null;
    try {
      eventChannel = supabase
        .channel(`event-live-sync-${activeEventId}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'forms', filter: `event_id=eq.${activeEventId}` }, async () => {
          const updatedForms = await fetchForms(activeEventId);
          if (updatedForms) setForms(updatedForms);
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'form_submissions', filter: `event_id=eq.${activeEventId}` }, async () => {
          const updatedSubs = await fetchFormSubmissions(activeEventId);
          if (updatedSubs) setFormSubmissions(updatedSubs);
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'rsvps', filter: `event_id=eq.${activeEventId}` }, async () => {
          const updatedRsvps = await fetchRSVPs(activeEventId);
          if (updatedRsvps) setRsvps(updatedRsvps);
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'rsvp_settings', filter: `event_id=eq.${activeEventId}` }, async () => {
          const updatedSettings = await fetchRSVPSettings(activeEventId);
          if (updatedSettings) setRsvpSettings(updatedSettings);
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'participants', filter: `event_id=eq.${activeEventId}` }, async () => {
          const updatedAttendees = await fetchAttendees(activeEventId);
          if (updatedAttendees) setAttendees(updatedAttendees);
        })
        .on('postgres_changes', { event: '*', schema: 'tickets', table: 'tickets', filter: `event_id=eq.${activeEventId}` }, async () => {
          const updatedTickets = await fetchTickets(activeEventId);
          if (updatedTickets) setTickets(updatedTickets);
        })
        .subscribe();
    } catch (e) {
      console.warn("Supabase event channel error:", e);
    }

    return () => {
      unsubscribeSync();
      eventChannel?.unsubscribe();
    };
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
    // If ticket param is present in URL when in register view, preserve it
    if (currentView === "register" && typeof window !== "undefined") {
      const currentSearchParams = new URLSearchParams(window.location.search);
      const ticketVal = currentSearchParams.get("ticket");
      if (ticketVal) {
        params.set("ticket", ticketVal);
      }
    }

    const queryString = params.toString();
    const newUrl = queryString ? `/?${queryString}` : "/";

    if (window.location.search !== `?${queryString}` && (window.location.search !== "" || queryString !== "")) {
      window.history.pushState({}, "", newUrl);
    }
  }, [currentView, activeFloorPlanId, initialPreviewMode, activeEventId, isLoading]);

  // Parse URL query parameters on initial load & on browser Back/Forward (popstate)
  useEffect(() => {
    if (typeof window === "undefined") return;

    const syncStateFromUrl = () => {
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
            setActiveFloorPlanId(planIdParam);
            if (previewParam === "true") {
              setInitialPreviewMode(true);
            }
          }
        } else {
          const validViews = [
            "home", "auth", "profile", "my-tickets", "events-hub", "create-event", "event-landing", "register", "visitor-portal", "overview", "page-builder", "calendar", "event-details", 
            "attendees", "pending", "organizations", "sponsors", 
            "exhibitors", "speakers", "tickets", "forms", "rsvp", "check-in", 
            "my-team", "analytics", "communications", "floor-plan"
          ];
          if (validViews.includes(viewParam)) {
            setCurrentView(viewParam);
          }
        }
      } else {
        setCurrentView("home");
      }
      isInitializedRef.current = true;
    };

    syncStateFromUrl();
    setMounted(true);

    window.addEventListener("popstate", syncStateFromUrl);
    return () => window.removeEventListener("popstate", syncStateFromUrl);
  }, []);

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

  // Event Archive Handler (Soft delete - data is safe in archive)
  const handleArchiveEvent = async (id) => {
    if (confirm("Archive this event? (Data will be preserved in your archives)")) {
      await archiveEvent(id);
      setUserEvents(prev => prev.map(e => e.id === id ? { ...e, status: "archived" } : e));
      setPublicEvents(prev => prev.filter(e => e.id !== id));
      if (activeEventId === id) {
        setActiveEventStateId(DEFAULT_EVENT_ID);
      }
    }
  };

  const handleUnarchiveEvent = async (id) => {
    await unarchiveEvent(id);
    setUserEvents(prev => prev.map(e => e.id === id ? { ...e, status: "published" } : e));
  };

  const handleDeleteEvent = handleArchiveEvent;

  // Visitor RSVP Handler
  const handleVisitorRegister = async (eventId, visitorData) => {
    const newPass = await registerVisitorForEvent(eventId, visitorData);
    setVisitorRegistrations(prev => [newPass, ...prev]);
    return newPass;
  };

  // Floor Plan Save Helpers
  const saveFloorPlanWithStatus = async (plan) => {
    setSaveStatus("saving");
    try {
      await upsertFloorPlan(plan, activeEventId);
      setSaveStatus("saved");
    } catch (err) {
      console.error("Auto-save floor plan failed:", err);
      setSaveStatus("error");
    }
  };

  const handleCreateFloorPlan = async (name) => {
    const validName = (typeof name === "string" && name.trim().length > 0)
      ? name.trim()
      : `Floor Plan ${floorPlans.length + 1}`;
    const newId = generateUuid();
    const newPlan = {
      id: newId,
      name: validName,
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
      const planToSet = saved || newPlan;
      setFloorPlans(prev => [...prev.filter(p => p.id !== planToSet.id), planToSet]);
      setActiveFloorPlanId(planToSet.id);
    } catch (err) {
      console.error("Create floor plan error:", err);
      setFloorPlans(prev => [...prev, newPlan]);
      setActiveFloorPlanId(newPlan.id);
    }
  };

  const handleDuplicateFloorPlan = async (id) => {
    const source = floorPlans.find(p => p.id === id);
    if (!source) return;
    const duplicated = {
      ...source,
      id: generateUuid(),
      name: `${source.name || "Floor Plan"} (Copy)`,
      createdAt: new Date().toISOString(),
    };
    try {
      const saved = await upsertFloorPlan(duplicated, activeEventId);
      const planToSet = saved || duplicated;
      setFloorPlans(prev => [...prev.filter(p => p.id !== planToSet.id), planToSet]);
    } catch (err) {
      console.error("Duplicate floor plan error:", err);
      setFloorPlans(prev => [...prev, duplicated]);
    }
  };

  const handleArchiveFloorPlan = async (id) => {
    try {
      await archiveFloorPlan(id);
      setFloorPlans(prev => prev.map(p => p.id === id ? { ...p, status: 'archived', isArchived: true } : p));
      if (activeFloorPlanId === id) setActiveFloorPlanId(null);
    } catch (err) {
      console.error("Archive floor plan error:", err);
    }
  };

  const handleDeleteFloorPlan = handleArchiveFloorPlan;

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
  const isEditingFloorPlan = currentView === "floor-plan" && Boolean(activeFloorPlanId) && Boolean(activePlan);

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

  const handleSaveTicket = async (ticketData) => {
    try {
      const saved = await upsertTicket(ticketData, activeEventId);
      if (ticketData.isPopular) {
        // Enforce only one ticket has isPopular tag
        const otherTickets = tickets.map(t => {
          if (t.id === saved.id) return saved;
          if (t.isPopular) {
            const updatedOldPopular = { ...t, isPopular: false };
            upsertTicket(updatedOldPopular, activeEventId).catch(console.error);
            return updatedOldPopular;
          }
          return t;
        });

        if (ticketData.id) {
          setTickets(otherTickets);
        } else {
          setTickets([saved, ...otherTickets.filter(t => t.id !== saved.id)]);
        }
      } else {
        if (ticketData.id) {
          setTickets(prev => prev.map(t => t.id === saved.id ? saved : t));
        } else {
          setTickets(prev => [...prev, saved]);
        }
      }
    } catch (err) {
      console.error("Failed to save ticket:", err);
      throw err;
    }
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
  // 0.9. DEDICATED FULL-PAGE MY TICKETS & DIGITAL PASSES VIEW
  // ==========================================================================
  if (currentView === "my-tickets") {
    return (
      <MyTicketsPage
        registrations={visitorRegistrations}
        events={publicEvents}
        currentUser={currentUser}
        onGoToHome={() => setCurrentView("home")}
        onOpenAuth={(mode) => {
          setAuthModalInitialMode(mode || "signin");
          setCurrentView("auth");
        }}
        onOpenProfile={() => setCurrentView("profile")}
        onOpenCreationWizard={() => {
          if (!currentUser) {
            setAuthModalInitialMode("signup");
            setCurrentView("auth");
          } else {
            setIsCreationWizardOpen(true);
          }
        }}
        onOpenEventsHub={() => {
          if (!currentUser) {
            setAuthModalInitialMode("signup");
            setCurrentView("auth");
          } else {
            setCurrentView("events-hub");
          }
        }}
        onSignOut={handleSignOut}
        onViewFloorPlan={(eventId) => {
          setActiveEventStateId(eventId);
          setCurrentView("floor-plan");
          setInitialPreviewMode(true);
        }}
        onViewLivePage={(eventId) => {
          setActiveEventStateId(eventId);
          setCurrentView("event-landing");
        }}
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
          events={publicEvents}
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
          onOpenVisitorPasses={() => setCurrentView("my-tickets")}
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
          onOpenCreationWizard={() => {
            if (!currentUser) {
              setAuthModalInitialMode("signup");
              setCurrentView("auth");
            } else {
              setIsCreationWizardOpen(true);
            }
          }}
          onSwitchToOrganizer={() => {
            if (!currentUser) {
              setAuthModalInitialMode("signup");
              setCurrentView("auth");
            } else {
              setCurrentView("events-hub");
            }
          }}
        />
      </>
    );
  }

  // ==========================================================================
  // 1.5. EVENT PUBLIC LANDING PAGE & REGISTRATION (VISITOR & ATTENDEE VIEW)
  // ==========================================================================
  if (currentView === "event-landing" || currentView === "register") {
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
        rsvps={rsvps}
        rsvpSettings={rsvpSettings}
        onSubmitRSVP={async (rsvpData) => {
          const saved = await submitGuestRSVP(rsvpData, activeEventId);
          setRsvps(prev => {
            const exists = prev.some(r => r.id === saved.id);
            return exists ? prev.map(r => r.id === saved.id ? saved : r) : [saved, ...prev];
          });
          return { success: true, rsvp: saved, assignedStatus: saved.status };
        }}
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
        events={userEvents}
        registrations={visitorRegistrations}
        onSelectEvent={(id) => {
          setActiveEventStateId(id);
          setCurrentView("overview");
        }}
        onCreateEventClick={() => setCurrentView("create-event")}
        onDeleteEvent={handleArchiveEvent}
        onArchiveEvent={handleArchiveEvent}
        onUnarchiveEvent={handleUnarchiveEvent}
        onSwitchToVisitor={() => setCurrentView("my-tickets")}
        onGoToHome={() => setCurrentView("home")}
        onOpenProfile={() => setCurrentView("profile")}
        onOpenAuth={(mode) => {
          setAuthModalInitialMode(mode || "signin");
          setCurrentView("auth");
        }}
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
        onUploadFile={uploadFileToBucket}
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
          events={publicEvents}
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
          onSwitchToOrganizer={() => setCurrentView("events-hub")}
          onGoToHome={() => setCurrentView("home")}
          onOpenAuth={(mode) => {
            setAuthModalInitialMode(mode || "signin");
            setCurrentView("auth");
          }}
          onOpenProfile={() => setCurrentView("profile")}
          onSignOut={handleSignOut}
          user={currentUser}
        />
      </>
    );
  }

  // ==========================================================================
  // 4. SINGLE EVENT DASHBOARD (ORGANIZER VIEW)
  // ==========================================================================
  const currentEventSummary = userEvents.find(e => e.id === activeEventId) || eventDetails || {};

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans">
      {/* Sidebar Navigation — hidden while editing a floor plan */}
      {!isEditingFloorPlan && (
      <aside className="w-[320px] h-screen bg-white border-r border-slate-200 py-6 px-5 sm:px-6 flex flex-col justify-between sticky top-0 overflow-y-auto shrink-0 select-none z-40">
        <div className="space-y-5">
          {/* Top Logo & Language Selector Icon */}
          <div className="flex items-center justify-between px-1 relative">
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => setCurrentView("home")} title="Eventzone Home">
              <img src="https://i.imgur.com/jFDrQbM.png" alt="eventzone" style={{ height: '24px', width: 'auto', maxWidth: '140px' }} className="h-6 w-auto object-contain" />
            </div>

            {/* Language Selector Icon Trigger */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setLangDropdownOpen(o => !o)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 transition-colors cursor-pointer shadow-2xs"
                title={`Language: ${languages.find(l => l.code === lang)?.label || "Language"}`}
              >
                <img src={languages.find(l => l.code === lang)?.icon || "https://i.imgur.com/NXtMImD.png"} alt={lang} className="w-4 h-4 object-contain rounded-xs" />
                <ChevronDown size={11} className={`text-slate-400 transition-transform ${langDropdownOpen ? "rotate-180" : ""}`} />
              </button>

              {/* Language Dropdown Menu */}
              {langDropdownOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setLangDropdownOpen(false)} />
                  <div className="absolute right-0 top-full mt-2 w-36 bg-white border border-slate-200 rounded-2xl shadow-xl p-1.5 space-y-1 z-50 animate-scale-up">
                    {languages.map(l => (
                      <button
                        key={l.code}
                        type="button"
                        onClick={() => {
                          setLang(l.code);
                          setLangDropdownOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                          lang === l.code ? "bg-blue-50 text-blue-600" : "text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <img src={l.icon} alt={l.code} className="w-4 h-4 object-contain" />
                          <span>{l.label}</span>
                        </div>
                        {lang === l.code && <Check size={13} className="text-blue-600 shrink-0" />}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
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
                    {currentEventSummary?.title || eventDetails?.title || "Eventzone Summit"}
                  </span>
                  <span className="text-[9px] text-slate-400 font-medium truncate">
                    {currentEventSummary?.type || eventDetails?.type || "Hybrid"} Event
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
                    </button>
                  ))}
                </div>

                <div className="pt-2 border-t border-slate-100 mt-1 space-y-1">
                  <button
                    onClick={() => {
                      setEventSwitcherOpen(false);
                      setCurrentView("create-event");
                    }}
                    className="w-full text-left p-2 rounded-xl text-xs font-bold text-blue-600 hover:bg-blue-50 flex items-center cursor-pointer"
                  >
                    <span>Host New Event</span>
                  </button>

                  <button
                    onClick={() => {
                      setEventSwitcherOpen(false);
                      setCurrentView("events-hub");
                    }}
                    className="w-full text-left p-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 flex items-center cursor-pointer"
                  >
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
              className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl font-bold text-xs transition-all text-left group ${currentView === "overview" ? "bg-blue-600 text-white shadow-xs" : "text-slate-600 hover:bg-slate-50 hover:text-blue-600"}`}
            >
              <LayoutDashboard size={15} className={`shrink-0 ${currentView === "overview" ? "text-white" : "text-slate-400 group-hover:text-blue-600"}`} />
              <span>{t("dash.overview", "Overview")}</span>
            </button>

            <button 
              onClick={() => setCurrentView("event-details")}
              className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl font-bold text-xs transition-all text-left group ${["event-details", "page-builder"].includes(currentView) ? "bg-blue-600 text-white shadow-xs" : "text-slate-600 hover:bg-slate-50 hover:text-blue-600"}`}
            >
              <FileText size={15} className={`shrink-0 ${["event-details", "page-builder"].includes(currentView) ? "text-white" : "text-slate-400 group-hover:text-blue-600"}`} />
              <span>{t("dash.eventDetails", "Event Details")}</span>
            </button>

            <button 
              onClick={() => setCurrentView("calendar")}
              className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl font-bold text-xs transition-all text-left group ${currentView === "calendar" ? "bg-blue-600 text-white shadow-xs" : "text-slate-600 hover:bg-slate-50 hover:text-blue-600"}`}
            >
              <Calendar size={15} className={`shrink-0 ${currentView === "calendar" ? "text-white" : "text-slate-400 group-hover:text-blue-600"}`} />
              <span>{t("dash.calendar", "Agenda")}</span>
            </button>

            {/* Expandable Participants Submenu */}
            <div className="flex flex-col">
              <button 
                onClick={() => setParticipantsOpen(!participantsOpen)}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl font-bold text-xs transition-all text-left group ${["attendees", "pending", "organizations", "sponsors", "exhibitors", "speakers"].includes(currentView) ? "text-blue-700 bg-blue-50/50 font-extrabold" : "text-slate-600 hover:bg-slate-50"}`}
              >
                <div className="flex items-center gap-2.5">
                  <Users2 size={15} className={`shrink-0 ${["attendees", "pending", "organizations", "sponsors", "exhibitors", "speakers"].includes(currentView) ? "text-blue-600" : "text-slate-400 group-hover:text-blue-600"}`} />
                  <span>{t("dash.attendees", "All Attendees")}</span>
                </div>
                <span className="text-[10px] font-bold text-slate-400">{participantsOpen ? "−" : "+"}</span>
              </button>

              {participantsOpen && (
                <div className="flex flex-col gap-0.5 pl-4 mt-1 border-l border-slate-100 ml-5">
                  <button 
                    onClick={() => setCurrentView("attendees")}
                    className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg font-semibold text-xs text-left transition-all ${currentView === "attendees" ? "text-blue-700 bg-blue-50 font-bold" : "text-slate-500 hover:text-blue-600"}`}
                  >
                    <div className="flex items-center gap-2">
                      <UserCheck size={13} className="shrink-0" />
                      <span>{t("dash.attendees", "All Attendees")}</span>
                    </div>
                    <span className={`text-[9px] font-extrabold py-0.5 px-1.5 rounded-full ${currentView === "attendees" ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-500"}`}>{attendees.length}</span>
                  </button>

                  <button 
                    onClick={() => setCurrentView("pending")}
                    className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg font-semibold text-xs text-left transition-all ${currentView === "pending" ? "text-blue-700 bg-blue-50 font-bold" : "text-slate-500 hover:text-blue-600"}`}
                  >
                    <div className="flex items-center gap-2">
                      <Clock size={13} className="shrink-0" />
                      <span>{t("dash.pending", "Pending")}</span>
                    </div>
                    <span className={`text-[9px] font-extrabold py-0.5 px-1.5 rounded-full ${currentView === "pending" ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-500"}`}>{pending.length}</span>
                  </button>

                  <button 
                    onClick={() => setCurrentView("organizations")}
                    className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg font-semibold text-xs text-left transition-all ${currentView === "organizations" ? "text-blue-700 bg-blue-50 font-bold" : "text-slate-500 hover:text-blue-600"}`}
                  >
                    <div className="flex items-center gap-2">
                      <Building2 size={13} className="shrink-0" />
                      <span>{t("dash.organizations", "Organizations")}</span>
                    </div>
                    <span className={`text-[9px] font-extrabold py-0.5 px-1.5 rounded-full ${currentView === "organizations" ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-500"}`}>{organizations.length}</span>
                  </button>

                  <button 
                    onClick={() => setCurrentView("sponsors")}
                    className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg font-semibold text-xs text-left transition-all ${currentView === "sponsors" ? "text-blue-700 bg-blue-50 font-bold" : "text-slate-500 hover:text-blue-600"}`}
                  >
                    <div className="flex items-center gap-2">
                      <Sparkles size={13} className="shrink-0" />
                      <span>{t("dash.sponsors", "Sponsors")}</span>
                    </div>
                    <span className={`text-[9px] font-extrabold py-0.5 px-1.5 rounded-full ${currentView === "sponsors" ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-500"}`}>{sponsors.length}</span>
                  </button>

                  <button 
                    onClick={() => setCurrentView("exhibitors")}
                    className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg font-semibold text-xs text-left transition-all ${currentView === "exhibitors" ? "text-blue-700 bg-blue-50 font-bold" : "text-slate-500 hover:text-blue-600"}`}
                  >
                    <div className="flex items-center gap-2">
                      <Store size={13} className="shrink-0" />
                      <span>{t("dash.exhibitors", "Exhibitors")}</span>
                    </div>
                    <span className={`text-[9px] font-extrabold py-0.5 px-1.5 rounded-full ${currentView === "exhibitors" ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-500"}`}>{exhibitors.length}</span>
                  </button>

                  <button 
                    onClick={() => setCurrentView("speakers")}
                    className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg font-semibold text-xs text-left transition-all ${currentView === "speakers" ? "text-blue-700 bg-blue-50 font-bold" : "text-slate-500 hover:text-blue-600"}`}
                  >
                    <div className="flex items-center gap-2">
                      <Mic2 size={13} className="shrink-0" />
                      <span>{t("dash.speakers", "Speakers")}</span>
                    </div>
                    <span className={`text-[9px] font-extrabold py-0.5 px-1.5 rounded-full ${currentView === "speakers" ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-500"}`}>{getUniqueSpeakersCount()}</span>
                  </button>
                </div>
              )}
            </div>

            <button 
              onClick={() => { setCurrentView("floor-plan"); setActiveFloorPlanId(null); }}
              className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl font-bold text-xs transition-all text-left group ${currentView === "floor-plan" ? "bg-blue-600 text-white shadow-xs" : "text-slate-600 hover:bg-slate-50 hover:text-blue-600"}`}
            >
              <div className="flex items-center gap-2.5">
                <Layers size={15} className={`shrink-0 ${currentView === "floor-plan" ? "text-white" : "text-slate-400 group-hover:text-blue-600"}`} />
                <span>{t("dash.floorPlan", "Floor Plans")}</span>
              </div>
              <span className={`text-[9px] font-extrabold py-0.5 px-2 rounded-full ${currentView === "floor-plan" ? "bg-white/25 text-white" : "bg-slate-100 text-slate-500"}`}>{floorPlans.length}</span>
            </button>

            <button 
              onClick={() => setCurrentView("tickets")}
              className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl font-bold text-xs transition-all text-left group ${currentView === "tickets" ? "bg-blue-600 text-white shadow-xs" : "text-slate-600 hover:bg-slate-50 hover:text-blue-600"}`}
            >
              <Ticket size={15} className={`shrink-0 ${currentView === "tickets" ? "text-white" : "text-slate-400 group-hover:text-blue-600"}`} />
              <span>{t("dash.tickets", "Tickets")}</span>
            </button>

            <button 
              onClick={() => setCurrentView("forms")}
              className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl font-bold text-xs transition-all text-left group ${currentView === "forms" ? "bg-blue-600 text-white shadow-xs" : "text-slate-600 hover:bg-slate-50 hover:text-blue-600"}`}
            >
              <div className="flex items-center gap-2.5">
                <ClipboardList size={15} className={`shrink-0 ${currentView === "forms" ? "text-white" : "text-slate-400 group-hover:text-blue-600"}`} />
                <span>{t("dash.forms", "Forms & Surveys")}</span>
              </div>
              <span className={`text-[9px] font-extrabold py-0.5 px-2 rounded-full ${currentView === "forms" ? "bg-white/25 text-white" : "bg-slate-100 text-slate-500"}`}>{forms.length}</span>
            </button>

            <button 
              onClick={() => setCurrentView("rsvp")}
              className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl font-bold text-xs transition-all text-left group ${currentView === "rsvp" ? "bg-blue-600 text-white shadow-xs" : "text-slate-600 hover:bg-slate-50 hover:text-blue-600"}`}
            >
              <div className="flex items-center gap-2.5">
                <CheckCircle2 size={15} className={`shrink-0 ${currentView === "rsvp" ? "text-white" : "text-slate-400 group-hover:text-blue-600"}`} />
                <span>{t("dash.rsvp", "RSVP")}</span>
              </div>
              <span className={`text-[9px] font-extrabold py-0.5 px-2 rounded-full ${currentView === "rsvp" ? "bg-white/25 text-white" : "bg-slate-100 text-slate-500"}`}>{rsvps.length}</span>
            </button>

            <button 
              onClick={() => setCurrentView("check-in")}
              className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl font-bold text-xs transition-all text-left group ${currentView === "check-in" ? "bg-blue-600 text-white shadow-xs" : "text-slate-600 hover:bg-slate-50 hover:text-blue-600"}`}
            >
              <QrCode size={15} className={`shrink-0 ${currentView === "check-in" ? "text-white" : "text-slate-400 group-hover:text-blue-600"}`} />
              <span>{t("dash.checkIn", "Check In")}</span>
            </button>

            <button 
              onClick={() => setCurrentView("my-team")}
              className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl font-bold text-xs transition-all text-left group ${currentView === "my-team" ? "bg-blue-600 text-white shadow-xs" : "text-slate-600 hover:bg-slate-50 hover:text-blue-600"}`}
            >
              <ShieldCheck size={15} className={`shrink-0 ${currentView === "my-team" ? "text-white" : "text-slate-400 group-hover:text-blue-600"}`} />
              <span>{t("dash.myTeam", "My Team")}</span>
            </button>

            <button 
              onClick={() => setCurrentView("analytics")}
              className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl font-bold text-xs transition-all text-left group ${currentView === "analytics" ? "bg-blue-600 text-white shadow-xs" : "text-slate-600 hover:bg-slate-50 hover:text-blue-600"}`}
            >
              <BarChart3 size={15} className={`shrink-0 ${currentView === "analytics" ? "text-white" : "text-slate-400 group-hover:text-blue-600"}`} />
              <span>{t("dash.analytics", "Analytics")}</span>
            </button>

            <button 
              onClick={() => setCurrentView("communications")}
              className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl font-bold text-xs transition-all text-left group ${currentView === "communications" ? "bg-blue-600 text-white shadow-xs" : "text-slate-600 hover:bg-slate-50 hover:text-blue-600"}`}
            >
              <Mail size={15} className={`shrink-0 ${currentView === "communications" ? "text-white" : "text-slate-400 group-hover:text-blue-600"}`} />
              <span>{t("dash.communications", "Communications")}</span>
            </button>
          </nav>
        </div>



        {/* Sidebar Footer: User Profile Pill & Role Switcher */}
        <div className="pt-3 border-t border-slate-150 relative">
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
              {/* 1. My Profile */}
              <button
                onClick={() => {
                  setProfileDropdownOpen(false);
                  setCurrentView("profile");
                }}
                className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold text-slate-800 hover:bg-slate-50 flex items-center gap-2.5 transition-colors cursor-pointer"
              >
                <User size={14} className="text-slate-500 shrink-0" />
                <span>{t("nav.myProfile", "My Profile")}</span>
              </button>

              {/* 2. My Tickets */}
              <button
                onClick={() => {
                  setProfileDropdownOpen(false);
                  setCurrentView("visitor-portal");
                }}
                className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold text-emerald-700 hover:bg-emerald-50 flex items-center justify-between transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <Ticket size={14} className="text-emerald-600 shrink-0" />
                  <span>{t("nav.myTickets", "My Tickets")}</span>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500 text-white font-black text-[10px]">
                  {visitorRegistrations.length}
                </span>
              </button>

              {/* 3. Add an Event in Menu */}
              <button
                onClick={() => {
                  setProfileDropdownOpen(false);
                  setCurrentView("create-event");
                }}
                className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold text-blue-600 hover:bg-blue-50 flex items-center gap-2.5 transition-colors cursor-pointer"
              >
                <Plus size={14} className="text-blue-600 shrink-0 stroke-[2.5]" />
                <span>{t("nav.addEvent", "Add an Event")}</span>
              </button>

              {/* 4. Organizer Center */}
              <button
                onClick={() => {
                  setProfileDropdownOpen(false);
                  setCurrentView("events-hub");
                }}
                className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 transition-colors cursor-pointer"
              >
                <Building2 size={14} className="text-slate-500 shrink-0" />
                <span>{t("nav.organizerCenter", "Organizer Center")}</span>
              </button>

              {/* 5. Public Home */}
              <button
                onClick={() => {
                  setProfileDropdownOpen(false);
                  setCurrentView("home");
                }}
                className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 transition-colors cursor-pointer"
              >
                <HomeIcon size={14} className="text-slate-400 shrink-0" />
                <span>{t("nav.publicHome", "Public Home")}</span>
              </button>

              <div className="h-px bg-slate-100 my-1" />

              <button
                onClick={handleSignOut}
                className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 flex items-center gap-2.5 transition-colors cursor-pointer"
              >
                <LogOut size={14} className="text-rose-500 shrink-0" />
                <span>{t("nav.signOut", "Sign Out")}</span>
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
          isEditingFloorPlan
            ? "overflow-hidden h-screen flex flex-col p-0" 
            : "overflow-y-auto p-6 md:p-8"
        }`}>
          {currentView === "overview" && (
            <Overview 
              eventDetails={eventDetails}
              attendees={attendees}
              pending={pending}
              sessions={sessions}
              tickets={tickets}
              sponsors={sponsors}
              exhibitors={exhibitors}
              floorPlans={floorPlans}
              forms={forms}
              formSubmissions={formSubmissions}
              rsvps={rsvps}
              rsvpSettings={rsvpSettings}
              team={team}
              onSwitchView={setCurrentView}
              onOpenModal={handleOpenModal}
              onPreviewLandingPage={() => setCurrentView("event-landing")}
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

          {currentView === "floor-plan" && !isEditingFloorPlan && (
            <FloorPlanGallery
              floorPlans={floorPlans}
              onEdit={(id) => setActiveFloorPlanId(id)}
              onCreateNew={handleCreateFloorPlan}
              onDuplicate={handleDuplicateFloorPlan}
              onDelete={handleDeleteFloorPlan}
              onRename={handleRenameFloorPlan}
            />
          )}

          {currentView === "floor-plan" && isEditingFloorPlan && (
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
              onArchiveForm={async (formId) => {
                await archiveForm(formId);
                setForms(prev => prev.map(f => f.id === formId ? { ...f, status: 'archived', isArchived: true } : f));
              }}
              onDeleteForm={async (formId) => {
                await archiveForm(formId);
                setForms(prev => prev.map(f => f.id === formId ? { ...f, status: 'archived', isArchived: true } : f));
              }}
              onSubmitResponse={async (sub) => {
                const saved = await submitFormResponse(sub, activeEventId);
                setFormSubmissions(prev => [saved, ...prev]);
              }}
              activeEventTitle={eventDetails?.title || "Eventzone Summit"}
            />
          )}

          {currentView === "rsvp" && (
            <RSVPView
              rsvps={rsvps}
              rsvpSettings={rsvpSettings}
              eventDetails={eventDetails}
              activeEventId={activeEventId}
              onSaveRSVPSettings={async (newSettings) => {
                const saved = await upsertRSVPSettings(newSettings, activeEventId);
                setRsvpSettings(saved);
              }}
              onSubmitRSVP={async (rsvpData) => {
                const saved = await submitGuestRSVP(rsvpData, activeEventId);
                setRsvps(prev => {
                  const exists = prev.some(r => r.id === saved.id);
                  return exists ? prev.map(r => r.id === saved.id ? saved : r) : [saved, ...prev];
                });
                return { success: true, rsvp: saved, assignedStatus: saved.status };
              }}
              onUpdateRSVPStatus={async (rsvpId, newStatus, extra) => {
                const updated = await updateRSVPStatus(rsvpId, newStatus, activeEventId, extra);
                setRsvps(prev => prev.map(r => r.id === rsvpId ? { ...r, ...updated, status: newStatus || r.status } : r));
              }}
              onArchiveRSVP={async (rsvpId) => {
                await archiveRSVP(rsvpId, activeEventId);
                setRsvps(prev => prev.map(r => r.id === rsvpId ? { ...r, status: 'archived' } : r));
              }}
              onDeleteRSVP={async (rsvpId) => {
                await archiveRSVP(rsvpId, activeEventId);
                setRsvps(prev => prev.map(r => r.id === rsvpId ? { ...r, status: 'archived' } : r));
              }}
              onRefreshData={async () => {
                const [freshRsvps, freshSettings] = await Promise.all([
                  fetchRSVPs(activeEventId),
                  fetchRSVPSettings(activeEventId)
                ]);
                if (freshRsvps) setRsvps(freshRsvps);
                if (freshSettings) setRsvpSettings(freshSettings);
              }}
              onOpenPublicRSVP={() => setShowGlobalPublicRsvp(true)}
            />
          )}

          {!["overview", "calendar", "page-builder", "event-details", "forms", "rsvp"].includes(currentView) && currentView !== "floor-plan" && (
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
                forms,
                rsvps
              }}
              onUpdateState={handleUpdateState}
              onOpenModal={handleOpenModal}
              onUploadFile={uploadFileToBucket}
              onSwitchView={setCurrentView}
            />
          )}
        </div>
      </main>


      {/* Ticket Drawer Slide-Over */}
      <TicketDrawer
        isOpen={activeModalType === "ticket"}
        onClose={closeModal}
        ticket={editingItem}
        forms={forms}
        onSaveTicket={handleSaveTicket}
        onUploadFile={uploadFileToBucket}
        activeEventId={activeEventId}
        eventTitle={eventDetails?.title || "Eventzone Summit"}
        onSwitchView={setCurrentView}
      />

      {/* Record Creation Modals (Other types) */}
      {activeModalType && activeModalType !== "ticket" && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-white border border-slate-150 rounded-3xl p-8 max-w-md w-full shadow-2xl flex flex-col gap-6 relative animate-scale-up">
            <header className="flex justify-between items-center select-none">
              <h3 className="text-lg font-bold text-slate-800">
                {activeModalType === "attendee" && "Add New Attendee"}
                {activeModalType === "org" && "Add Partner Organization"}
                {activeModalType === "sponsor" && "Add Event Sponsor"}
                {activeModalType === "exhibitor" && "Register Exhibitor"}
                {activeModalType === "team" && "Invite Team Member"}
              </h3>
              <button 
                onClick={closeModal}
                className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center text-slate-400 hover:text-rose-500 hover:border-rose-100 transition-colors cursor-pointer text-sm font-bold"
              >
                ✕
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

      {/* Global Public RSVP Modal (Preview & Direct Trigger) */}
      <PublicRSVPModal
        isOpen={showGlobalPublicRsvp}
        onClose={() => setShowGlobalPublicRsvp(false)}
        event={eventDetails || { id: activeEventId, title: "Eventzone Summit" }}
        rsvpSettings={rsvpSettings}
        existingHeadcount={rsvps.filter(r => (r.status || 'attending').toLowerCase() === 'attending').reduce((sum, r) => sum + 1 + (r.plusOnes || r.plus_ones || 0), 0)}
        onSubmitRSVP={async (rsvpData) => {
          const saved = await submitGuestRSVP(rsvpData, activeEventId);
          setRsvps(prev => {
            const exists = prev.some(r => r.id === saved.id);
            return exists ? prev.map(r => r.id === saved.id ? saved : r) : [saved, ...prev];
          });
          return { success: true, rsvp: saved, assignedStatus: saved.status };
        }}
        currentUser={currentUser}
      />
    </div>
  );
}

export default function Home() {
  return (
    <LanguageProvider>
      <Suspense fallback={
        <div className="min-h-screen bg-slate-50 flex items-center justify-center font-sans">
          <img 
            src="https://i.imgur.com/jFDrQbM.png" 
            alt="eventzone" 
            style={{ width: "130px", height: "auto", maxHeight: "32px", maxWidth: "100%" }}
            className="h-8 w-auto object-contain opacity-80 animate-pulse" 
          />
        </div>
      }>
        <HomeContent />
      </Suspense>
    </LanguageProvider>
  );
}
