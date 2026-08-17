/**
 * db.js — Data Access Layer for Eventzone SaaS Platform
 *
 * Handles column-name mapping between the app's data model and the Supabase
 * schema, supporting multi-event multi-tenant isolation, user profiles, and visitor tickets.
 */

import { supabase } from './supabase';

export const DEFAULT_EVENT_ID = process.env.NEXT_PUBLIC_EVENT_ID || 'c251ee33-cf10-4b11-a87f-70925f7cac2c';

let _activeEventId = DEFAULT_EVENT_ID;

export function setActiveEventId(id) {
  if (id) _activeEventId = id;
}

export function getActiveEventId() {
  return _activeEventId;
}

// ─────────────────────────────────────────────
//  USER PROFILES & ROLES
// ─────────────────────────────────────────────

export async function fetchUserProfile(userId) {
  if (!userId) return null;
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    if (error) {
      console.warn("Could not fetch profile from Supabase:", error.message);
      return null;
    }
    return data;
  } catch (e) {
    console.warn("Profile fetch error:", e);
    return null;
  }
}

const formatPlatformForApp = (platId) => {
  if (!platId) return "Website";
  const s = platId.toLowerCase();
  if (s.includes("linkedin")) return "LinkedIn";
  if (s.includes("twitter") || s === "x" || s.includes("x (twitter)")) return "X (Twitter)";
  if (s.includes("github")) return "GitHub";
  if (s.includes("whatsapp")) return "WhatsApp";
  if (s.includes("instagram")) return "Instagram";
  if (s.includes("youtube")) return "YouTube";
  if (s.includes("telegram")) return "Telegram";
  if (s.includes("discord")) return "Discord";
  if (s.includes("medium")) return "Medium";
  if (s.includes("dribbble")) return "Dribbble";
  if (s.includes("calendly")) return "Calendly";
  if (s.includes("email") || s.includes("mail")) return "Email";
  if (s.includes("phone")) return "Phone Number";
  if (s.includes("website") || s.includes("company")) return "Company Website";
  return platId.charAt(0).toUpperCase() + platId.slice(1);
};

export async function upsertUserProfile(profile) {
  try {
    const loc = profile.location || profile.address || '';
    
    // 1. Format social links for mobile app metadata.socials: [{ platform, label, value }]
    let incomingSocials = profile.socialLinks || profile.social_links || [];
    if (!Array.isArray(incomingSocials) && typeof incomingSocials === 'object') {
      incomingSocials = Object.entries(incomingSocials).map(([k, v]) => ({
        platform: k,
        label: formatPlatformForApp(k),
        value: v
      }));
    }

    const formattedSocials = incomingSocials.map(link => {
      const plat = link.platform || "Website";
      return {
        platform: formatPlatformForApp(plat),
        label: link.title || link.label || formatPlatformForApp(plat),
        value: link.url || link.value || ""
      };
    }).filter(s => s.value && s.value.trim());

    // Build companion social_links object
    const socialLinksObj = {};
    formattedSocials.forEach(s => {
      const key = s.platform.toLowerCase().replace(/[\s\(\)]+/g, '_');
      if (key && s.value) {
        socialLinksObj[key] = s.value;
      }
    });

    // 2. Fetch existing metadata if available to preserve non-social keys (e.g. material_finish, phone, etc.)
    let existingMetadata = {};
    if (profile.metadata && typeof profile.metadata === 'object') {
      existingMetadata = profile.metadata;
    } else if (profile.id) {
      const { data: cur } = await supabase.from('profiles').select('metadata').eq('id', profile.id).single();
      if (cur?.metadata && typeof cur.metadata === 'object') {
        existingMetadata = cur.metadata;
      }
    }

    const updatedMetadata = {
      ...existingMetadata,
      socials: formattedSocials,
    };

    // 3. Format what_im_looking_for string
    let lookingForStr = "";
    if (typeof profile.what_im_looking_for === 'string') {
      lookingForStr = profile.what_im_looking_for;
    } else if (Array.isArray(profile.what_im_looking_for)) {
      lookingForStr = profile.what_im_looking_for.join(', ');
    } else if (profile.whatImLookingFor) {
      lookingForStr = Array.isArray(profile.whatImLookingFor) ? profile.whatImLookingFor.join(', ') : profile.whatImLookingFor;
    }

    const payload = {
      id: profile.id,
      email: profile.email,
      full_name: profile.fullName || profile.full_name || '',
      avatar_url: profile.avatar || profile.avatar_url || '',
      job_title: profile.jobTitle || profile.job_title || '',
      company_name: profile.companyName || profile.company_name || profile.company || '',
      company: profile.companyName || profile.company_name || profile.company || '',
      bio: profile.bio || '',
      location: loc,
      address: loc,
      phone: profile.phone || '',
      interests: Array.isArray(profile.interests) ? profile.interests : [],
      social_links: socialLinksObj,
      metadata: updatedMetadata,
      what_im_looking_for: lookingForStr,
      updated_at: new Date().toISOString()
    };

    if (profile.role) {
      payload.role = profile.role;
    }

    // 1. Try upsert by id if UUID is present
    if (payload.id) {
      const { data, error } = await supabase
        .from('profiles')
        .upsert(payload, { onConflict: 'id' })
        .select()
        .single();
      if (!error && data) return data;
      console.warn("Upsert by id warning, attempting update by email:", error);
    }

    // 2. Fallback update by email
    if (payload.email) {
      const { data, error } = await supabase
        .from('profiles')
        .update(payload)
        .eq('email', payload.email)
        .select()
        .single();
      if (!error && data) return data;
      if (error) throw error;
    }

    return payload;
  } catch (e) {
    console.error("Profile upsert error:", e);
    throw e;
  }
}

// ─────────────────────────────────────────────
//  MULTI-EVENT MANAGEMENT
// ─────────────────────────────────────────────

export async function fetchUserEvents(userId) {
  try {
    let query = supabase.from('events').select('*').order('created_at', { ascending: false });
    if (userId) {
      query = query.or(`organizer_id.eq.${userId},id.eq.${DEFAULT_EVENT_ID}`);
    }
    const { data, error } = await query;
    if (error || !data || data.length === 0) {
      return SHOWCASE_EVENTS;
    }
    return data.map(mapEventSummaryFromDb);
  } catch (err) {
    console.warn("Error fetching user events:", err);
    return SHOWCASE_EVENTS;
  }
}

export async function fetchPublicEvents() {
  try {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .order('start_date', { ascending: true });
    if (error || !data || data.length === 0) {
      return SHOWCASE_EVENTS;
    }
    return data.map(mapEventSummaryFromDb);
  } catch (err) {
    console.warn("Error fetching public events:", err);
    return SHOWCASE_EVENTS;
  }
}

export async function createEvent(eventData, userId) {
  const newId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `event-${Date.now()}`;
  const row = {
    id: newId,
    name: eventData.title || 'Untitled Event',
    tagline: eventData.tagline || '',
    category: eventData.category || 'Technology & Software',
    location: eventData.location || 'Online',
    type: eventData.type || 'Hybrid',
    start_date: eventData.startDate || new Date().toISOString().split('T')[0],
    end_date: eventData.endDate || new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0],
    description: eventData.description || '',
    banner: eventData.banner || '',
    cover_url: eventData.banner || '',
    capacity: eventData.capacity || 500,
    status: eventData.status || 'published',
    organizer_id: userId || null,
    created_at: new Date().toISOString()
  };

  try {
    const { data, error } = await supabase
      .from('events')
      .insert(row)
      .select()
      .single();
    if (error) {
      console.warn("Supabase event insert failed, returning local object:", error.message);
      return mapEventSummaryFromDb(row);
    }
    return mapEventSummaryFromDb(data || row);
  } catch (e) {
    console.warn("Create event exception:", e);
    return mapEventSummaryFromDb(row);
  }
}

export async function deleteEvent(eventId) {
  try {
    const { error } = await supabase.from('events').delete().eq('id', eventId);
    if (error) throw error;
    return true;
  } catch (err) {
    console.warn("Delete event error:", err);
    return false;
  }
}

export function isValidUuid(id) {
  if (!id || typeof id !== 'string') return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
}

export function generateUuid() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

export const SHOWCASE_EVENTS = [
  {
    id: DEFAULT_EVENT_ID,
    title: "Algeria Hydrogen Law Conference 2026",
    tagline: "Global forum on legal, regulatory & financial frameworks for green hydrogen",
    category: "Energy & Hydrocarbons",
    location: "CIC, Algiers & Online",
    type: "Hybrid",
    startDate: "2026-10-12",
    endDate: "2026-10-18",
    description: "The premiere global forum covering the legal, regulatory, and financial frameworks for the developing green hydrogen sector in North Africa.",
    banner: "https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=1200&q=80",
    capacity: 1200,
    status: "published",
    attendeeCount: 1420,
    sessionsCount: 18,
  },
  {
    id: "b81f9a24-11e2-4d1a-96e5-4d693bf7a102",
    title: "North Africa AI & Tech Summit 2026",
    tagline: "Connecting 1,500+ developers, tech executives, and venture investors across MENA",
    category: "Technology & Software",
    location: "Algiers Cyber Park & Global Live Stream",
    type: "Hybrid",
    startDate: "2026-11-04",
    endDate: "2026-11-07",
    description: "Deep-dive workshops on generative AI architectures, distributed systems, fintech infra, and venture capital networking.",
    banner: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1200&q=80",
    capacity: 1800,
    status: "published",
    attendeeCount: 960,
    sessionsCount: 24,
  },
  {
    id: "a72c8e19-33d4-4f2b-87a1-5e921cf8b203",
    title: "Mediterranean Energy Transition Expo 2026",
    tagline: "The largest regional trade exhibition for renewable energy, solar & offshore wind",
    category: "Energy & Hydrocarbons",
    location: "Oran Convention Centre (CCO), Oran",
    type: "In-Person",
    startDate: "2026-11-20",
    endDate: "2026-11-24",
    description: "Showcase of 120+ international exhibitors, 2D floor plans, B2B deal rooms, and governmental bilateral panels.",
    banner: "https://images.unsplash.com/photo-1505373877841-8d25f7d46678?auto=format&fit=crop&w=1200&q=80",
    capacity: 3500,
    status: "published",
    attendeeCount: 2400,
    sessionsCount: 32,
  },
  {
    id: "f94e1d35-55a6-4c3e-b812-7f154db9c304",
    title: "MENA Banking & Future of Payments Forum",
    tagline: "Cross-border settlement, digital currencies, and regulatory sandboxes",
    category: "Finance & Banking",
    location: "Sheraton Club des Pins, Algiers",
    type: "In-Person",
    startDate: "2026-12-08",
    endDate: "2026-12-10",
    description: "Central bank governors, banking CEOs, and top fintech founders exploring the new era of sovereign digital payments.",
    banner: "https://images.unsplash.com/photo-1475721027785-f74eccf877e2?auto=format&fit=crop&w=1200&q=80",
    capacity: 850,
    status: "published",
    attendeeCount: 620,
    sessionsCount: 14,
  }
];

function getDefaultEventItem() {
  return SHOWCASE_EVENTS[0];
}

function mapEventSummaryFromDb(row) {
  return {
    id: row.id,
    title: row.name || row.title || 'Untitled Event',
    tagline: row.tagline || '',
    category: row.category || 'Technology & Software',
    location: row.location || 'Online',
    type: row.type || 'Hybrid',
    startDate: row.start_date || row.startDate || '',
    endDate: row.end_date || row.endDate || '',
    description: row.description || '',
    banner: row.banner || row.cover_url || "https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1200&q=80",
    capacity: row.capacity || 500,
    status: row.status || 'published',
    attendeeCount: row.attendee_count || 0,
    sessionsCount: row.sessions_count || 0,
    organizerId: row.organizer_id || null,
  };
}

export async function fetchEventDetails(eventId = _activeEventId) {
  const targetId = eventId || _activeEventId;
  const showcase = SHOWCASE_EVENTS.find(e => e.id === targetId);
  try {
    if (!isValidUuid(targetId)) {
      return showcase || getDefaultEventItem();
    }
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('id', targetId)
      .single();
    if (error || !data) {
      return showcase || getDefaultEventItem();
    }
    return mapEventFromDb(data);
  } catch (err) {
    console.warn("fetchEventDetails fallback to default:", err.message);
    return showcase || getDefaultEventItem();
  }
}

export async function updateEventDetails(details, eventId = _activeEventId) {
  const targetId = eventId || _activeEventId;
  const { error } = await supabase
    .from('events')
    .update(mapEventToDb(details))
    .eq('id', targetId);
  if (error) throw new Error(error.message);
}

function mapEventFromDb(row) {
  return {
    id: row.id,
    title: row.name || row.title || '',
    tagline: row.tagline || '',
    category: row.category || 'Technology & Software',
    location: row.location || '',
    type: row.type || 'Hybrid',
    startDate: row.start_date || '',
    endDate: row.end_date || '',
    description: row.description || '',
    banner: row.banner || row.cover_url || '',
    capacity: row.capacity || 500,
    status: row.status || 'published',
  };
}

function mapEventToDb(details) {
  return {
    name: details.title,
    tagline: details.tagline,
    category: details.category,
    location: details.location,
    type: details.type,
    start_date: details.startDate,
    end_date: details.endDate,
    description: details.description,
    banner: details.banner,
    cover_url: details.banner,
    capacity: details.capacity,
    status: details.status || 'published',
  };
}

// ─────────────────────────────────────────────
//  SESSIONS
// ─────────────────────────────────────────────

export async function fetchSessions(eventId = _activeEventId) {
  const targetId = eventId || _activeEventId;
  const { data, error } = await supabase
    .from('sessions')
    .select('*')
    .eq('event_id', targetId)
    .order('start_time', { ascending: true });
  if (error) {
    console.warn("fetchSessions error:", error.message);
    return [];
  }
  return data.map(mapSessionFromDb);
}

export async function upsertSession(session, eventId = _activeEventId) {
  const targetId = eventId || _activeEventId;
  const row = mapSessionToDb(session, targetId);
  const { data, error } = await supabase
    .from('sessions')
    .upsert(row, { onConflict: 'id' })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return mapSessionFromDb(data);
}

export async function deleteSession(id) {
  const { error } = await supabase.from('sessions').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

function mapSessionFromDb(row) {
  return {
    id: row.id,
    title: row.title || '',
    date: row.date || '',
    startTime: row.start_time ? row.start_time.substring(11, 16) : '',
    endTime: row.end_time ? row.end_time.substring(11, 16) : '',
    description: row.description || '',
    speakers: row.speakers || [],
    moderators: row.moderators || [],
    logos: row.logos || [],
  };
}

function mapSessionToDb(session, eventId = _activeEventId) {
  const dateStr = session.date || new Date().toISOString().split('T')[0];
  return {
    id: session.id,
    event_id: eventId,
    title: session.title,
    date: session.date,
    start_time: session.startTime ? `${dateStr}T${session.startTime}:00+00:00` : null,
    end_time: session.endTime ? `${dateStr}T${session.endTime}:00+00:00` : null,
    description: session.description,
    speakers: session.speakers || [],
    moderators: session.moderators || [],
    logos: session.logos || [],
  };
}

// ─────────────────────────────────────────────
//  ATTENDEES (participants)
// ─────────────────────────────────────────────

export async function fetchAttendees(eventId = _activeEventId) {
  const targetId = eventId || _activeEventId;
  const { data, error } = await supabase
    .from('participants')
    .select('*')
    .eq('event_id', targetId)
    .order('registered_at', { ascending: true });
  if (error) {
    console.warn("fetchAttendees error:", error.message);
    return [];
  }
  return data.map(mapAttendeeFromDb);
}

export async function upsertAttendee(attendee, eventId = _activeEventId) {
  const targetId = eventId || _activeEventId;
  const row = mapAttendeeToDb(attendee, targetId);
  const { data, error } = await supabase
    .from('participants')
    .upsert(row, { onConflict: 'id' })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return mapAttendeeFromDb(data);
}

export async function deleteAttendee(id) {
  const { error } = await supabase.from('participants').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

function mapAttendeeFromDb(row) {
  return {
    id: row.id,
    name: `${row.first_name || ''} ${row.last_name || ''}`.trim(),
    email: row.email || '',
    ticketType: row.ticket_type || 'Standard Admission',
    status: row.status_participation || 'registered',
    registeredDate: row.registered_at ? row.registered_at.split('T')[0] : '',
    image: row.image || '',
    isSpeaker: !!row.is_speaker,
  };
}

function mapAttendeeToDb(attendee, eventId = _activeEventId) {
  const nameParts = (attendee.name || '').trim().split(' ');
  const firstName = nameParts[0] || '';
  const lastName = nameParts.slice(1).join(' ') || '';
  return {
    id: attendee.id,
    event_id: eventId,
    first_name: firstName,
    last_name: lastName,
    email: attendee.email,
    ticket_type: attendee.ticketType,
    status_participation: attendee.status,
    registered_at: attendee.registeredDate
      ? new Date(attendee.registeredDate).toISOString()
      : new Date().toISOString(),
    image: attendee.image || '',
    is_speaker: !!attendee.isSpeaker,
  };
}

// ─────────────────────────────────────────────
//  PENDING REGISTRATIONS
// ─────────────────────────────────────────────

export async function fetchPending(eventId = _activeEventId) {
  const targetId = eventId || _activeEventId;
  const { data, error } = await supabase
    .from('pending_registrations')
    .select('*')
    .eq('event_id', targetId)
    .order('created_at', { ascending: true });
  if (error) {
    console.warn("fetchPending error:", error.message);
    return [];
  }
  return data.map(mapPendingFromDb);
}

export async function upsertPending(item, eventId = _activeEventId) {
  const targetId = eventId || _activeEventId;
  const row = {
    id: item.id,
    event_id: targetId,
    name: item.name,
    email: item.email,
    note: item.note || '',
    date: item.date || new Date().toISOString().split('T')[0],
  };
  const { data, error } = await supabase
    .from('pending_registrations')
    .upsert(row, { onConflict: 'id' })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return mapPendingFromDb(data);
}

export async function deletePending(id) {
  const { error } = await supabase.from('pending_registrations').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

function mapPendingFromDb(row) {
  return {
    id: row.id,
    name: row.name || '',
    email: row.email || '',
    note: row.note || '',
    date: row.date || '',
  };
}

// ─────────────────────────────────────────────
//  ORGANIZATIONS
// ─────────────────────────────────────────────

export async function fetchOrganizations() {
  const { data, error } = await supabase
    .from('organizations')
    .select('*')
    .order('created_at', { ascending: true });
  if (error) {
    console.warn("fetchOrganizations error:", error.message);
    return [];
  }
  return data.map(mapOrgFromDb);
}

export async function upsertOrganization(org) {
  const row = mapOrgToDb(org);
  const { data, error } = await supabase
    .from('organizations')
    .upsert(row, { onConflict: 'id' })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return mapOrgFromDb(data);
}

export async function deleteOrganization(id) {
  const { error } = await supabase.from('organizations').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

function mapOrgFromDb(row) {
  return {
    id: row.id,
    name: row.name || '',
    industry: row.industry || '',
    address: row.address || '',
    logo: row.logo || '',
  };
}

function mapOrgToDb(org) {
  return {
    id: org.id,
    name: org.name,
    industry: org.industry,
    address: org.address,
    logo: org.logo || '',
  };
}

// ─────────────────────────────────────────────
//  SPONSORS
// ─────────────────────────────────────────────

export async function fetchSponsors(eventId = _activeEventId) {
  const targetId = eventId || _activeEventId;
  const { data, error } = await supabase
    .from('sponsors')
    .select('*')
    .eq('event_id', targetId)
    .order('created_at', { ascending: true });
  if (error) {
    console.warn("fetchSponsors error:", error.message);
    return [];
  }
  return data.map(mapSponsorFromDb);
}

export async function upsertSponsor(sponsor, eventId = _activeEventId) {
  const targetId = eventId || _activeEventId;
  const row = mapSponsorToDb(sponsor, targetId);
  const { data, error } = await supabase
    .from('sponsors')
    .upsert(row, { onConflict: 'id' })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return mapSponsorFromDb(data);
}

export async function deleteSponsor(id) {
  const { error } = await supabase.from('sponsors').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

function mapSponsorFromDb(row) {
  return {
    id: row.id,
    name: row.name || '',
    tier: row.tier || 'Silver',
    industry: row.industry || '',
    website: row.website || '',
    logo: row.logo || '',
    orgId: row.org_id || null,
  };
}

function mapSponsorToDb(sponsor, eventId = _activeEventId) {
  return {
    id: sponsor.id,
    event_id: eventId,
    name: sponsor.name,
    tier: sponsor.tier,
    industry: sponsor.industry,
    website: sponsor.website,
    logo: sponsor.logo || '',
    org_id: sponsor.orgId || null,
  };
}

// ─────────────────────────────────────────────
//  EXHIBITORS
// ─────────────────────────────────────────────

export async function fetchExhibitors(eventId = _activeEventId) {
  const targetId = eventId || _activeEventId;
  const { data, error } = await supabase
    .from('exhibitors')
    .select('*')
    .eq('event_id', targetId)
    .order('created_at', { ascending: true });
  if (error) {
    console.warn("fetchExhibitors error:", error.message);
    return [];
  }
  return data.map(mapExhibitorFromDb);
}

export async function upsertExhibitor(exhibitor, eventId = _activeEventId) {
  const targetId = eventId || _activeEventId;
  const row = mapExhibitorToDb(exhibitor, targetId);
  const { data, error } = await supabase
    .from('exhibitors')
    .upsert(row, { onConflict: 'id' })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return mapExhibitorFromDb(data);
}

export async function deleteExhibitor(id) {
  const { error } = await supabase.from('exhibitors').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

function mapExhibitorFromDb(row) {
  return {
    id: row.id,
    name: row.name || '',
    boothNumber: row.booth_number || '',
    industry: row.industry || '',
    contactEmail: row.contact_email || '',
    logo: row.logo_url || row.logo || '',
    orgId: row.org_id || null,
  };
}

function mapExhibitorToDb(exhibitor, eventId = _activeEventId) {
  return {
    id: exhibitor.id,
    event_id: eventId,
    name: exhibitor.name,
    booth_number: exhibitor.boothNumber,
    industry: exhibitor.industry,
    contact_email: exhibitor.contactEmail,
    logo_url: exhibitor.logo || '',
    org_id: exhibitor.orgId || null,
  };
}

// ─────────────────────────────────────────────
//  TICKETS
// ─────────────────────────────────────────────

export async function fetchTickets(eventId = _activeEventId) {
  const targetId = eventId || _activeEventId;
  const { data, error } = await supabase
    .from('tickets')
    .select('*')
    .eq('event_id', targetId)
    .order('created_at', { ascending: true });
  if (error) {
    console.warn("fetchTickets error:", error.message);
    return [];
  }
  return data.map(mapTicketFromDb);
}

export async function upsertTicket(ticket, eventId = _activeEventId) {
  const targetId = eventId || _activeEventId;
  const row = mapTicketToDb(ticket, targetId);
  const { data, error } = await supabase
    .from('tickets')
    .upsert(row, { onConflict: 'id' })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return mapTicketFromDb(data);
}

export async function deleteTicket(id) {
  const { error } = await supabase.from('tickets').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

function mapTicketFromDb(row) {
  return {
    id: row.id,
    tier: row.name || '',
    price: row.price != null ? `$${row.price}` : '$0',
    available: row.total_quantity || 0,
    sold: row.sold_quantity || 0,
    status: row.is_active ? 'Active' : 'Draft',
    description: row.description || '',
    color: row.color || 'blue',
  };
}

function mapTicketToDb(ticket, eventId = _activeEventId) {
  const priceNum = parseFloat(String(ticket.price).replace(/[^0-9.]/g, '')) || 0;
  return {
    id: ticket.id,
    event_id: eventId,
    name: ticket.tier,
    price: priceNum,
    total_quantity: parseInt(ticket.available) || 0,
    sold_quantity: parseInt(ticket.sold) || 0,
    is_active: ticket.status === 'Active',
    description: ticket.description || '',
    color: ticket.color || 'blue',
  };
}

// ─────────────────────────────────────────────
//  TEAM MEMBERS
// ─────────────────────────────────────────────

export async function fetchTeam(eventId = _activeEventId) {
  const targetId = eventId || _activeEventId;
  const { data, error } = await supabase
    .from('team_members')
    .select('*')
    .eq('event_id', targetId)
    .order('created_at', { ascending: true });
  if (error) {
    console.warn("fetchTeam error:", error.message);
    return [];
  }
  return data.map(mapTeamFromDb);
}

export async function upsertTeamMember(member, eventId = _activeEventId) {
  const targetId = eventId || _activeEventId;
  const row = mapTeamToDb(member, targetId);
  const { data, error } = await supabase
    .from('team_members')
    .upsert(row, { onConflict: 'id' })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return mapTeamFromDb(data);
}

export async function deleteTeamMember(id) {
  const { error } = await supabase.from('team_members').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

function mapTeamFromDb(row) {
  return {
    id: row.id,
    name: `${row.first_name} ${row.last_name}`.trim(),
    email: row.email || '',
    role: row.role || 'Member',
    avatar: row.avatar || '',
  };
}

function mapTeamToDb(member, eventId = _activeEventId) {
  const nameParts = (member.name || '').trim().split(' ');
  const firstName = nameParts[0] || '';
  const lastName = nameParts.slice(1).join(' ') || '';
  return {
    id: member.id,
    event_id: eventId,
    first_name: firstName,
    last_name: lastName,
    email: member.email,
    role: member.role,
    avatar: member.avatar || '',
  };
}

// ─────────────────────────────────────────────
//  FLOOR PLANS
// ─────────────────────────────────────────────

export async function fetchFloorPlans(eventId = _activeEventId) {
  const targetId = eventId || _activeEventId;
  const { data, error } = await supabase
    .from('floor_plans')
    .select('*')
    .eq('event_id', targetId)
    .order('created_at', { ascending: true });
  if (error) {
    console.warn("fetchFloorPlans error:", error.message);
    return [];
  }
  return data.map(mapFloorPlanFromDb);
}

export async function upsertFloorPlan(plan, eventId = _activeEventId) {
  const targetId = eventId || _activeEventId;
  const row = {
    id: plan.id,
    event_id: targetId,
    name: plan.name,
    elements: plan.elements || [],
    blueprint: plan.blueprint || null,
    font_family: plan.fontFamily || 'Inter',
    floors: plan.floors ? JSON.stringify(plan.floors) : null,
  };
  const { data, error } = await supabase
    .from('floor_plans')
    .upsert(row, { onConflict: 'id' })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return mapFloorPlanFromDb(data);
}

export async function deleteFloorPlan(id) {
  const { error } = await supabase.from('floor_plans').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

function mapFloorPlanFromDb(row) {
  const elements = row.elements || [];
  const blueprint = row.blueprint || {
    url: '', name: 'Venue Blueprint', opacity: 0.8,
    x: 0, y: 0, width: 800, height: 600, rotation: 0, isLocked: false,
  };
  
  let rawFloors = row.floors;
  if (typeof rawFloors === 'string') {
    try {
      rawFloors = JSON.parse(rawFloors);
    } catch (e) {
      rawFloors = null;
    }
  }

  const floors = rawFloors && Array.isArray(rawFloors) && rawFloors.length > 0 ? rawFloors : [
    {
      id: 'default-floor-id',
      name: row.name || 'Ground Floor',
      elements: elements,
      blueprint: blueprint,
    }
  ];

  return {
    id: row.id,
    name: row.name || 'Unnamed Plan',
    createdAt: row.created_at,
    elements: elements,
    blueprint: blueprint,
    fontFamily: row.font_family || 'Inter',
    floors: floors,
  };
}

// ─────────────────────────────────────────────
//  VISITOR PASSES & REGISTRATIONS
// ─────────────────────────────────────────────

export async function fetchVisitorRegistrations(userEmail) {
  try {
    let query = supabase.from('participants').select('*');
    if (userEmail) {
      query = query.eq('email', userEmail);
    }
    const { data, error } = await query;
    if (error || !data || data.length === 0) {
      return [
        {
          id: "reg-demo-1",
          eventId: DEFAULT_EVENT_ID,
          eventTitle: "Algeria Hydrogen Law Conference 2026",
          ticketType: "VIP Access Pass",
          status: "confirmed",
          registeredDate: "2026-09-15",
          location: "CIC, Algiers & Online",
          startDate: "2026-10-12",
          endDate: "2026-10-18",
          badgeCode: `PASS-VIP-9824XA`,
        }
      ];
    }
    return data.map(row => ({
      id: row.id,
      eventId: row.event_id || DEFAULT_EVENT_ID,
      eventTitle: "Algeria Hydrogen Law Conference 2026",
      ticketType: row.ticket_type || 'Standard Admission',
      status: row.status_participation || 'registered',
      registeredDate: row.registered_at ? row.registered_at.split('T')[0] : '',
      location: "Algiers International Conference Center",
      startDate: "2026-10-12",
      endDate: "2026-10-18",
      badgeCode: `PASS-${(row.id || '').toString().slice(-6).toUpperCase()}`,
    }));
  } catch (err) {
    console.warn("fetchVisitorRegistrations fallback:", err);
    return [];
  }
}

export async function registerVisitorForEvent(eventId, visitorData) {
  const newId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `part-${Date.now()}`;
  const badgeCode = `PASS-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
  const nameParts = (visitorData.name || 'Guest Attendee').trim().split(' ');
  const row = {
    id: newId,
    event_id: eventId || DEFAULT_EVENT_ID,
    first_name: nameParts[0] || 'Guest',
    last_name: nameParts.slice(1).join(' ') || 'Attendee',
    email: visitorData.email || 'visitor@eventzone.io',
    ticket_type: visitorData.ticketType || 'Standard Admission',
    status_participation: 'registered',
    registered_at: new Date().toISOString(),
  };

  try {
    await supabase.from('participants').insert(row);
  } catch (e) {
    console.warn("Supabase participant insert exception:", e);
  }

  return {
    id: newId,
    eventId: eventId,
    eventTitle: visitorData.eventTitle || 'Eventzone Summit',
    ticketType: visitorData.ticketType || 'Standard Admission',
    status: 'confirmed',
    registeredDate: new Date().toISOString().split('T')[0],
    location: visitorData.location || 'Online',
    startDate: visitorData.startDate || new Date().toISOString().split('T')[0],
    endDate: visitorData.endDate || new Date().toISOString().split('T')[0],
    badgeCode: badgeCode,
  };
}

// ─────────────────────────────────────────────
//  STORAGE UPLOAD
// ─────────────────────────────────────────────

export async function uploadProfileAvatar(file, userId) {
  if (!file) return null;
  const fileExt = file.name ? file.name.split('.').pop() : 'jpg';
  const fileName = `avatar_${userId || 'user'}_${Date.now()}.${fileExt}`;
  const filePath = `${fileName}`;

  try {
    // 1. Upload to public 'avatars' bucket
    const { data, error } = await supabase.storage
      .from('avatars')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true
      });

    if (!error) {
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);
      return publicUrl;
    }
    console.warn("Avatars bucket upload warning, trying floor-plans:", error);
  } catch (e) {
    console.warn("Avatars bucket error:", e);
  }

  // 2. Fallback to 'floor-plans' public bucket
  try {
    const fallbackPath = `avatars/${fileName}`;
    const { data: fbData, error: fbError } = await supabase.storage
      .from('floor-plans')
      .upload(fallbackPath, file, {
        cacheControl: '3600',
        upsert: true
      });

    if (fbError) throw fbError;

    const { data: { publicUrl } } = supabase.storage
      .from('floor-plans')
      .getPublicUrl(fallbackPath);

    return publicUrl;
  } catch (err) {
    console.error("Storage avatar upload failed:", err);
    throw err;
  }
}

export async function uploadFileToBucket(file, bucket = 'floor-plans', eventId = _activeEventId) {
  if (!file) return null;
  const targetId = eventId || _activeEventId;
  const fileExt = file.name.split('.').pop();
  const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
  const filePath = `${targetId}/${fileName}`;

  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: true
    });

  if (error) {
    console.error("Storage upload error:", error);
    throw new Error(error.message);
  }

  const { data: { publicUrl } } = supabase.storage
    .from(bucket)
    .getPublicUrl(filePath);

  return publicUrl;
}

// ─────────────────────────────────────────────
//  COMMUNICATIONS
// ─────────────────────────────────────────────

export async function logCommunication({ subject, body, recipientCount }, eventId = _activeEventId) {
  const targetId = eventId || _activeEventId;
  const row = {
    event_id: targetId,
    subject: subject,
    body: body,
    recipient_count: recipientCount,
    status: 'Sent',
    sent_at: new Date().toISOString(),
  };
  const { data, error } = await supabase
    .from('communications')
    .insert(row)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function fetchCommunications(eventId = _activeEventId) {
  const targetId = eventId || _activeEventId;
  if (!isValidUuid(targetId)) return [];
  try {
    const { data, error } = await supabase
      .from('communications')
      .select('*')
      .eq('event_id', targetId)
      .order('sent_at', { ascending: false });
    if (error) {
      console.warn("fetchCommunications error:", error.message);
      return [];
    }
    return data || [];
  } catch (e) {
    console.warn("fetchCommunications exception:", e);
    return [];
  }
}

// ─────────────────────────────────────────────
//  FORMS & SURVEYS BUILDER
// ─────────────────────────────────────────────

export const STARTER_FORMS = [
  {
    id: "form-ticket-reg-001",
    eventId: DEFAULT_EVENT_ID,
    title: "Attendee Registration & Badge Intake",
    description: "Required registration questions to issue your official conference credential, badge, and track assignments.",
    type: "ticket_registration", // 'ticket_registration' | 'feedback_survey' | 'session_survey' | 'general_inquiry'
    ticketId: "all", // 'all' or ticket tier name/id
    status: "active", // 'active' | 'draft' | 'archived'
    settings: {
      submitButtonText: "Complete Registration",
      successMessage: "Registration complete! Your official digital pass has been generated with custom badge credentials.",
      allowAnonymous: false,
      accentColor: "blue",
    },
    fields: [
      {
        id: "field_job_title",
        type: "text",
        label: "Job Title / Professional Role",
        placeholder: "e.g. Senior Legal Counsel or Energy Director",
        helpText: "Will be printed on your physical conference badge",
        required: true,
        options: [],
      },
      {
        id: "field_company",
        type: "text",
        label: "Organization / Company Name",
        placeholder: "e.g. Sonatrach Energy, Clifford Chance LLP",
        helpText: "Your affiliated enterprise or institution",
        required: true,
        options: [],
      },
      {
        id: "field_track_interest",
        type: "select",
        label: "Primary Focus & Workshop Track",
        placeholder: "Select your main interest...",
        helpText: "Helps us reserve priority seating for breakout rooms",
        required: true,
        options: [
          "Green Hydrogen & Electrolysis Infrastructure",
          "Trans-Mediterranean Energy Law & Regulatory Compliance",
          "Project Financing, Sovereign Funds & Bilateral Offtake",
          "Port Terminal Logistics & Cryogenic Transport"
        ],
      },
      {
        id: "field_dietary",
        type: "radio",
        label: "Dietary Preferences (Executive Catering)",
        helpText: "Executive luncheon and VIP networking reception",
        required: false,
        options: [
          "Standard Catering (Halal)",
          "Vegetarian / Plant-based",
          "Gluten-Free / Celiac",
          "No Dietary Restrictions"
        ],
      },
      {
        id: "field_tshirt",
        type: "select",
        label: "Welcome Swag Pack T-Shirt Size",
        helpText: "Complimentary sustainable cotton summit polo",
        required: false,
        options: ["Small (S)", "Medium (M)", "Large (L)", "Extra Large (XL)", "2XL"],
      },
      {
        id: "field_linkedin",
        type: "text",
        label: "LinkedIn Profile URL",
        placeholder: "https://linkedin.com/in/your-profile",
        helpText: "Optional for attendee matchmaking directory",
        required: false,
        options: [],
      },
      {
        id: "field_networking_optin",
        type: "switch",
        label: "Include profile in B2B Attendee Matchmaking Directory",
        helpText: "Allows registered delegates and sponsors to request 1-on-1 meetings with you",
        required: false,
        defaultValue: true,
        options: [],
      }
    ],
    createdAt: "2026-06-15T10:00:00Z",
    updatedAt: "2026-08-10T14:30:00Z"
  },
  {
    id: "form-feedback-csat-002",
    eventId: DEFAULT_EVENT_ID,
    title: "Post-Summit Attendee Experience & CSAT Survey",
    description: "We value your insight. Please take 2 minutes to rate our keynotes, venue logistics, and suggest topics for 2027.",
    type: "feedback_survey",
    ticketId: "all",
    status: "active",
    settings: {
      submitButtonText: "Submit Official Feedback",
      successMessage: "Thank you for shaping the future of Eventzone Summits! Your rating has been recorded.",
      allowAnonymous: true,
      accentColor: "indigo",
    },
    fields: [
      {
        id: "field_overall_rating",
        type: "rating",
        label: "Overall Summit Experience Rating",
        helpText: "Overall satisfaction with speaker selection, organization, and value",
        maxRating: 5,
        required: true,
        options: [],
      },
      {
        id: "field_keynotes_quality",
        type: "rating",
        label: "Quality of Keynote Panels & Technical Sessions",
        helpText: "Clarity, depth of research, and relevance of speaker presentations",
        maxRating: 5,
        required: true,
        options: [],
      },
      {
        id: "field_venue_catering",
        type: "rating",
        label: "Venue Comfort, CIC Facilities & Logistics",
        helpText: "Registration flow, audio-visual quality, catering and exhibition layout",
        maxRating: 5,
        required: false,
        options: [],
      },
      {
        id: "field_nps_score",
        type: "nps",
        label: "How likely are you to recommend this summit to a colleague in your sector?",
        helpText: "Score from 0 (Not at all likely) to 10 (Extremely likely)",
        required: true,
        options: [],
      },
      {
        id: "field_highlight_takeaway",
        type: "textarea",
        label: "What was the most valuable keynote or session for your team?",
        placeholder: "e.g. The comparative analysis on bilateral hydrogen contracts and off-taker guarantees...",
        required: false,
        options: [],
      },
      {
        id: "field_expansion_topics",
        type: "checkbox",
        label: "What topics would you like to see expanded in next year's agenda?",
        helpText: "Select all areas of interest",
        required: false,
        options: [
          "Cross-border pipeline legal frameworks",
          "Commercial banking & green bond financing",
          "Carbon capture and blue hydrogen transition",
          "Maritime ammonia carrier safety standards",
          "AI-driven pipeline maintenance & leak prevention"
        ],
      },
      {
        id: "field_suggestions",
        type: "textarea",
        label: "Any additional recommendations or feedback for the organizers?",
        placeholder: "Share your candid feedback...",
        required: false,
        options: [],
      }
    ],
    createdAt: "2026-06-20T12:00:00Z",
    updatedAt: "2026-08-12T09:15:00Z"
  },
  {
    id: "form-speaker-cfp-003",
    eventId: DEFAULT_EVENT_ID,
    title: "Call for Papers & Keynote Presentation Proposal",
    description: "Submit your abstract or technical study to present before international energy ministers and enterprise delegates.",
    type: "general_inquiry",
    ticketId: "all",
    status: "active",
    settings: {
      submitButtonText: "Submit Presentation Abstract",
      successMessage: "Abstract received! The Scientific & Legal Committee will review and notify you within 7 days.",
      allowAnonymous: false,
      accentColor: "emerald",
    },
    fields: [
      {
        id: "field_speaker_name",
        type: "text",
        label: "Lead Presenter Full Name",
        placeholder: "e.g. Dr. Amina Benali",
        required: true,
        options: [],
      },
      {
        id: "field_speaker_org",
        type: "text",
        label: "Institution / Organization",
        placeholder: "e.g. National Institute of Applied Energy Research",
        required: true,
        options: [],
      },
      {
        id: "field_talk_title",
        type: "text",
        label: "Proposed Session / Keynote Title",
        placeholder: "e.g. Regulatory Arbitrage in Multi-Jurisdiction Hydrogen Grids",
        required: true,
        options: [],
      },
      {
        id: "field_talk_abstract",
        type: "textarea",
        label: "Abstract / Executive Summary (200-400 words)",
        placeholder: "Summarize findings, case studies, and relevance to convention attendees...",
        required: true,
        options: [],
      },
      {
        id: "field_talk_track",
        type: "select",
        label: "Target Session Track",
        required: true,
        options: [
          "Track A: Legal & Cross-Border Frameworks",
          "Track B: Engineering & Electrolysis Scale",
          "Track C: Project Finance & Insurance Structuring"
        ],
      }
    ],
    createdAt: "2026-07-01T08:00:00Z",
    updatedAt: "2026-08-01T11:00:00Z"
  }
];

export const STARTER_SUBMISSIONS = [
  {
    id: "sub-001",
    formId: "form-feedback-csat-002",
    eventId: DEFAULT_EVENT_ID,
    respondentName: "Sarah Al-Mansoor",
    respondentEmail: "sarah.m@energyventures.com",
    ticketTier: "VIP Access Pass",
    createdAt: "2026-08-14T14:22:00Z",
    answers: {
      field_overall_rating: 5,
      field_keynotes_quality: 5,
      field_venue_catering: 4,
      field_nps_score: 10,
      field_highlight_takeaway: "The bilateral off-take contract structuring session with ministry delegates was world class.",
      field_expansion_topics: ["Cross-border pipeline legal frameworks", "Commercial banking & green bond financing"],
      field_suggestions: "More dedicated 1-on-1 networking pods near the VIP lounge would be fantastic."
    }
  },
  {
    id: "sub-002",
    formId: "form-feedback-csat-002",
    eventId: DEFAULT_EVENT_ID,
    respondentName: "Marcus Vance",
    respondentEmail: "m.vance@infralaw.uk",
    ticketTier: "Delegate Pass",
    createdAt: "2026-08-14T16:45:00Z",
    answers: {
      field_overall_rating: 5,
      field_keynotes_quality: 4,
      field_venue_catering: 5,
      field_nps_score: 9,
      field_highlight_takeaway: "Exceptional venue management at CIC Algiers. The audio visual setup was flawless.",
      field_expansion_topics: ["Cross-border pipeline legal frameworks", "Carbon capture and blue hydrogen transition"],
      field_suggestions: "Include downloadable presentation slides in the app within 24 hours of each session."
    }
  },
  {
    id: "sub-003",
    formId: "form-feedback-csat-002",
    eventId: DEFAULT_EVENT_ID,
    respondentName: "Elena Rostova",
    respondentEmail: "e.rostova@greentechcap.de",
    ticketTier: "Delegate Pass",
    createdAt: "2026-08-15T09:10:00Z",
    answers: {
      field_overall_rating: 4,
      field_keynotes_quality: 5,
      field_venue_catering: 4,
      field_nps_score: 8,
      field_highlight_takeaway: "Great insights on EU import regulations and standard certification for North African green ammonia.",
      field_expansion_topics: ["Maritime ammonia carrier safety standards", "AI-driven pipeline maintenance & leak prevention"],
      field_suggestions: "Keep up the great work!"
    }
  },
  {
    id: "sub-004",
    formId: "form-ticket-reg-001",
    eventId: DEFAULT_EVENT_ID,
    respondentName: "Dr. Karim Mansouri",
    respondentEmail: "karim.mansouri@sonatrach.dz",
    ticketTier: "VIP Access Pass",
    createdAt: "2026-08-15T11:30:00Z",
    answers: {
      field_job_title: "Head of Transnational Pipelines",
      field_company: "Sonatrach Infrastructure",
      field_track_interest: "Trans-Mediterranean Energy Law & Regulatory Compliance",
      field_dietary: "Standard Catering (Halal)",
      field_tshirt: "Large (L)",
      field_linkedin: "https://linkedin.com/in/karim-mansouri-energy",
      field_networking_optin: true
    }
  },
  {
    id: "sub-005",
    formId: "form-ticket-reg-001",
    eventId: DEFAULT_EVENT_ID,
    respondentName: "Amira Khellaf",
    respondentEmail: "amira.khellaf@h2algerie.org",
    ticketTier: "VIP Access Pass",
    createdAt: "2026-08-15T13:40:00Z",
    answers: {
      field_job_title: "Policy Director",
      field_company: "National Green Hydrogen Alliance",
      field_track_interest: "Green Hydrogen & Electrolysis Infrastructure",
      field_dietary: "Vegetarian / Plant-based",
      field_tshirt: "Medium (M)",
      field_linkedin: "https://linkedin.com/in/amira-khellaf",
      field_networking_optin: true
    }
  }
];

// In-memory cache for fallback and offline operation
let _cachedForms = [...STARTER_FORMS];
let _cachedSubmissions = [...STARTER_SUBMISSIONS];

export async function fetchForms(eventId = _activeEventId) {
  const targetId = eventId || _activeEventId;
  
  if (isValidUuid(targetId)) {
    try {
      const { data, error } = await supabase
        .from('forms')
        .select('*')
        .eq('event_id', targetId)
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        return data.map(mapFormFromDb);
      }
    } catch (e) {
      console.warn("fetchForms DB query fallback:", e);
    }
  }

  // Filter cached forms for this event or return starter forms
  const matching = _cachedForms.filter(f => f.eventId === targetId || f.eventId === DEFAULT_EVENT_ID);
  return matching.length > 0 ? matching : STARTER_FORMS;
}

export async function upsertForm(form, eventId = _activeEventId) {
  const targetId = eventId || _activeEventId;
  const formId = form.id || `form-${Date.now()}`;
  const now = new Date().toISOString();

  const formattedForm = {
    ...form,
    id: formId,
    eventId: targetId,
    updatedAt: now,
    createdAt: form.createdAt || now,
  };

  // 1. Try upserting to Supabase
  if (isValidUuid(targetId)) {
    try {
      const row = {
        id: isValidUuid(formId) ? formId : undefined,
        event_id: targetId,
        title: form.title || 'Untitled Form',
        description: form.description || '',
        type: form.type || 'ticket_registration',
        ticket_id: form.ticketId || 'all',
        fields: form.fields || [],
        settings: form.settings || {},
        status: form.status || 'active',
        updated_at: now,
      };

      const { data, error } = await supabase
        .from('forms')
        .upsert(row, { onConflict: 'id' })
        .select()
        .single();

      if (!error && data) {
        const saved = mapFormFromDb(data);
        // Sync cache
        _cachedForms = [saved, ..._cachedForms.filter(f => f.id !== saved.id)];
        return saved;
      }
    } catch (e) {
      console.warn("upsertForm DB exception, using local cache:", e);
    }
  }

  // 2. Fallback in-memory update
  _cachedForms = [formattedForm, ..._cachedForms.filter(f => f.id !== formId)];
  return formattedForm;
}

export async function deleteForm(id) {
  if (!id) return;
  _cachedForms = _cachedForms.filter(f => f.id !== id);
  _cachedSubmissions = _cachedSubmissions.filter(s => s.formId !== id);

  if (isValidUuid(id)) {
    try {
      await supabase.from('forms').delete().eq('id', id);
    } catch (e) {
      console.warn("deleteForm DB exception:", e);
    }
  }
}

export async function fetchFormSubmissions(eventId = _activeEventId, formId = null) {
  const targetId = eventId || _activeEventId;

  if (isValidUuid(targetId)) {
    try {
      let query = supabase
        .from('form_submissions')
        .select('*')
        .eq('event_id', targetId)
        .order('created_at', { ascending: false });

      if (formId && isValidUuid(formId)) {
        query = query.eq('form_id', formId);
      }

      const { data, error } = await query;
      if (!error && data && data.length > 0) {
        return data.map(mapSubmissionFromDb);
      }
    } catch (e) {
      console.warn("fetchFormSubmissions DB query exception:", e);
    }
  }

  // Filter in-memory cache
  return _cachedSubmissions.filter(s => {
    const matchEvent = s.eventId === targetId || s.eventId === DEFAULT_EVENT_ID;
    const matchForm = formId ? s.formId === formId : true;
    return matchEvent && matchForm;
  });
}

export async function submitFormResponse(submission, eventId = _activeEventId) {
  const targetId = eventId || _activeEventId;
  const newSubId = submission.id || `sub-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
  const now = new Date().toISOString();

  const formattedSub = {
    ...submission,
    id: newSubId,
    eventId: targetId,
    createdAt: now,
  };

  // 1. Try saving to Supabase
  if (isValidUuid(targetId)) {
    try {
      const row = {
        id: isValidUuid(newSubId) ? newSubId : undefined,
        form_id: isValidUuid(submission.formId) ? submission.formId : undefined,
        event_id: targetId,
        user_id: submission.userId || null,
        respondent_name: submission.respondentName || 'Attendee',
        respondent_email: submission.respondentEmail || 'attendee@eventzone.io',
        ticket_tier: submission.ticketTier || 'Standard Admission',
        answers: submission.answers || {},
        created_at: now,
      };

      const { data, error } = await supabase
        .from('form_submissions')
        .insert(row)
        .select()
        .single();

      if (!error && data) {
        const saved = mapSubmissionFromDb(data);
        _cachedSubmissions = [saved, ..._cachedSubmissions];
        return saved;
      }
    } catch (e) {
      console.warn("submitFormResponse DB exception, saving to cache:", e);
    }
  }

  // 2. Save in cache
  _cachedSubmissions = [formattedSub, ..._cachedSubmissions];
  return formattedSub;
}

export async function deleteFormSubmission(id) {
  if (!id) return;
  _cachedSubmissions = _cachedSubmissions.filter(s => s.id !== id);

  if (isValidUuid(id)) {
    try {
      await supabase.from('form_submissions').delete().eq('id', id);
    } catch (e) {
      console.warn("deleteFormSubmission DB exception:", e);
    }
  }
}

function mapFormFromDb(row) {
  return {
    id: row.id,
    eventId: row.event_id,
    title: row.title || 'Untitled Form',
    description: row.description || '',
    type: row.type || 'ticket_registration',
    ticketId: row.ticket_id || 'all',
    fields: row.fields || [],
    settings: row.settings || {},
    status: row.status || 'active',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapSubmissionFromDb(row) {
  return {
    id: row.id,
    formId: row.form_id,
    eventId: row.event_id,
    userId: row.user_id,
    respondentName: row.respondent_name || 'Attendee',
    respondentEmail: row.respondent_email || '',
    ticketTier: row.ticket_tier || 'Standard Admission',
    answers: row.answers || {},
    createdAt: row.created_at,
  };
}

