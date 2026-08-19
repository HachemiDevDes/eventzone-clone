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
      query = query.or(`organizer_id.eq.${userId},owner_id.eq.${userId}`);
    }
    const { data, error } = await query;
    if (error || !data) {
      return [];
    }
    return data.map(mapEventSummaryFromDb);
  } catch (err) {
    console.warn("Error fetching user events:", err);
    return [];
  }
}

export async function fetchPublicEvents() {
  try {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .neq('status', 'archived')
      .order('start_date', { ascending: true });
    if (error || !data) {
      return [];
    }
    return data.map(mapEventSummaryFromDb);
  } catch (err) {
    console.warn("Error fetching public events:", err);
    return [];
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
      console.warn("Supabase event insert failed:", error.message);
      return mapEventSummaryFromDb(row);
    }
    return mapEventSummaryFromDb(data || row);
  } catch (e) {
    console.warn("Create event exception:", e);
    return mapEventSummaryFromDb(row);
  }
}

export async function archiveEvent(eventId) {
  try {
    const { data, error } = await supabase
      .from('events')
      .update({ status: 'archived' })
      .eq('id', eventId)
      .select();
    if (error) throw error;
    return true;
  } catch (err) {
    console.warn("Archive event error:", err);
    return false;
  }
}

export async function unarchiveEvent(eventId) {
  try {
    const { data, error } = await supabase
      .from('events')
      .update({ status: 'published' })
      .eq('id', eventId)
      .select();
    if (error) throw error;
    return true;
  } catch (err) {
    console.warn("Unarchive event error:", err);
    return false;
  }
}

// Organizers cannot permanently delete events, only archive them
export async function deleteEvent(eventId) {
  return await archiveEvent(eventId);
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

export const SHOWCASE_EVENTS = [];

function getDefaultEventItem() {
  return null;
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
  try {
    if (!isValidUuid(targetId)) {
      return null;
    }
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('id', targetId)
      .single();
    if (error || !data) {
      return null;
    }
    return mapEventFromDb(data);
  } catch (err) {
    console.warn("fetchEventDetails error:", err.message);
    return null;
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
  try {
    const { data, error } = await supabase
      .from('sessions')
      .upsert(row, { onConflict: 'id' })
      .select()
      .single();
    if (error) {
      console.warn("upsertSession DB notice:", error.message);
      return { ...session, id: row.id };
    }
    return mapSessionFromDb(data);
  } catch (e) {
    console.warn("upsertSession error:", e);
    return { ...session, id: row.id };
  }
}

export async function archiveSession(id) {
  if (!id || !isValidUuid(id)) return;
  try {
    const { error } = await supabase.from('sessions').update({ status: 'archived' }).eq('id', id);
    if (error) console.warn("archiveSession notice:", error.message);
  } catch (e) {
    console.warn("archiveSession error:", e);
  }
}

export async function deleteSession(id) {
  return await archiveSession(id);
}

function convertTimeTo24h(timeStr) {
  if (!timeStr) return "09:00:00";
  const s = String(timeStr).trim();
  const ampmMatch = s.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM)?$/i);
  if (ampmMatch) {
    let hours = parseInt(ampmMatch[1], 10);
    const minutes = ampmMatch[2];
    const seconds = ampmMatch[3] || "00";
    const modifier = ampmMatch[4] ? ampmMatch[4].toUpperCase() : null;

    if (modifier === "PM" && hours < 12) hours += 12;
    if (modifier === "AM" && hours === 12) hours = 0;

    return `${String(hours).padStart(2, "0")}:${minutes}:${seconds}`;
  }
  if (/^\d{1,2}:\d{2}$/.test(s)) {
    const parts = s.split(":");
    return `${String(parts[0]).padStart(2, "0")}:${parts[1]}:00`;
  }
  return "09:00:00";
}

function mapSessionFromDb(row) {
  return {
    id: row.id,
    title: row.title || '',
    date: row.date ? String(row.date).substring(0, 10) : (row.start_time ? row.start_time.substring(0, 10) : ''),
    startTime: row.start_time ? row.start_time.substring(11, 16) : '',
    endTime: row.end_time ? row.end_time.substring(11, 16) : '',
    description: row.description || '',
    speakers: Array.isArray(row.speakers) ? row.speakers : [],
    moderators: Array.isArray(row.moderators) ? row.moderators : [],
    logos: Array.isArray(row.logos) ? row.logos : [],
  };
}

function mapSessionToDb(session, eventId = _activeEventId) {
  const dateStr = session.date || new Date().toISOString().split('T')[0];
  const validId = isValidUuid(session.id) ? session.id : generateUuid();
  const startTime24 = session.startTime ? convertTimeTo24h(session.startTime) : null;
  const endTime24 = session.endTime ? convertTimeTo24h(session.endTime) : null;

  return {
    id: validId,
    event_id: isValidUuid(eventId) ? eventId : undefined,
    title: session.title || 'Untitled Session',
    date: session.date || dateStr,
    start_time: startTime24 ? `${dateStr}T${startTime24}+00:00` : null,
    end_time: endTime24 ? `${dateStr}T${endTime24}+00:00` : null,
    description: session.description || '',
    speakers: Array.isArray(session.speakers) ? session.speakers : [],
    moderators: Array.isArray(session.moderators) ? session.moderators : [],
    logos: Array.isArray(session.logos) ? session.logos : [],
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
  try {
    const { data, error } = await supabase
      .from('participants')
      .upsert(row, { onConflict: 'id' })
      .select()
      .single();
    if (error) {
      console.warn("upsertAttendee DB notice:", error.message);
      return { ...attendee, id: row.id };
    }
    return mapAttendeeFromDb(data);
  } catch (e) {
    console.warn("upsertAttendee error:", e);
    return { ...attendee, id: row.id };
  }
}

export async function archiveAttendee(id) {
  if (!id || !isValidUuid(id)) return;
  try {
    const { error } = await supabase.from('participants').update({ status_participation: 'archived' }).eq('id', id);
    if (error) console.warn("archiveAttendee notice:", error.message);
  } catch (e) {
    console.warn("archiveAttendee error:", e);
  }
}
export const deleteAttendee = archiveAttendee;

function mapAttendeeFromDb(row) {
  return {
    id: row.id,
    name: `${row.first_name || ''} ${row.last_name || ''}`.trim(),
    email: row.email || '',
    ticketType: row.ticket_type || 'Standard Admission',
    status: row.status_participation || 'registered',
    isArchived: row.status_participation === 'archived',
    registeredDate: row.registered_at ? row.registered_at.split('T')[0] : '',
    image: row.image || '',
    isSpeaker: !!row.is_speaker,
  };
}

function mapAttendeeToDb(attendee, eventId = _activeEventId) {
  const nameParts = (attendee.name || '').trim().split(' ');
  const firstName = nameParts[0] || '';
  const lastName = nameParts.slice(1).join(' ') || '';
  const validId = isValidUuid(attendee.id) ? attendee.id : generateUuid();
  return {
    id: validId,
    event_id: isValidUuid(eventId) ? eventId : undefined,
    first_name: firstName,
    last_name: lastName,
    email: attendee.email,
    ticket_type: attendee.ticketType,
    status_participation: attendee.isArchived ? 'archived' : (attendee.status || 'registered'),
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
  const validId = isValidUuid(item.id) ? item.id : generateUuid();
  const row = {
    id: validId,
    event_id: isValidUuid(targetId) ? targetId : undefined,
    name: item.name,
    email: item.email,
    note: item.note || '',
    date: item.date || new Date().toISOString().split('T')[0],
  };
  try {
    const { data, error } = await supabase
      .from('pending_registrations')
      .upsert(row, { onConflict: 'id' })
      .select()
      .single();
    if (error) {
      console.warn("upsertPending DB notice:", error.message);
      return { ...item, id: validId };
    }
    return mapPendingFromDb(data);
  } catch (e) {
    console.warn("upsertPending error:", e);
    return { ...item, id: validId };
  }
}

export async function archivePending(id) {
  if (!id || !isValidUuid(id)) return;
  try {
    const { error } = await supabase.from('pending_registrations').update({ status: 'archived' }).eq('id', id);
    if (error) console.warn("archivePending notice:", error.message);
  } catch (e) {
    console.warn("archivePending error:", e);
  }
}
export const deletePending = archivePending;

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
  try {
    const { data, error } = await supabase
      .from('organizations')
      .upsert(row, { onConflict: 'id' })
      .select()
      .single();
    if (error) {
      console.warn("upsertOrganization DB notice:", error.message);
      return { ...org, id: row.id };
    }
    return mapOrgFromDb(data);
  } catch (e) {
    console.warn("upsertOrganization error:", e);
    return { ...org, id: row.id };
  }
}

export async function archiveOrganization(id) {
  if (!id || !isValidUuid(id)) return;
  try {
    const { error } = await supabase.from('organizations').update({ status: 'archived' }).eq('id', id);
    if (error) console.warn("archiveOrganization notice:", error.message);
  } catch (e) {
    console.warn("archiveOrganization error:", e);
  }
}
export const deleteOrganization = archiveOrganization;

function mapOrgFromDb(row) {
  return {
    id: row.id,
    name: row.name || '',
    industry: row.industry || '',
    address: row.address || '',
    logo: row.logo || '',
    isArchived: row.status === 'archived',
    status: row.status || 'active',
  };
}

function mapOrgToDb(org) {
  const validId = isValidUuid(org.id) ? org.id : generateUuid();
  return {
    id: validId,
    name: org.name,
    industry: org.industry,
    address: org.address,
    logo: org.logo || '',
    status: org.isArchived ? 'archived' : (org.status || 'active'),
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
  try {
    const { data, error } = await supabase
      .from('sponsors')
      .upsert(row, { onConflict: 'id' })
      .select()
      .single();
    if (error) {
      console.warn("upsertSponsor DB notice:", error.message);
      return { ...sponsor, id: row.id };
    }
    return mapSponsorFromDb(data);
  } catch (e) {
    console.warn("upsertSponsor error:", e);
    return { ...sponsor, id: row.id };
  }
}

export async function archiveSponsor(id) {
  if (!id || !isValidUuid(id)) return;
  try {
    const { error } = await supabase.from('sponsors').update({ status: 'archived' }).eq('id', id);
    if (error) console.warn("archiveSponsor notice:", error.message);
  } catch (e) {
    console.warn("archiveSponsor error:", e);
  }
}
export const deleteSponsor = archiveSponsor;

function mapSponsorFromDb(row) {
  return {
    id: row.id,
    name: row.name || '',
    tier: row.tier || 'Silver',
    industry: row.industry || '',
    website: row.website || '',
    logo: row.logo || '',
    orgId: row.org_id || null,
    isArchived: row.status === 'archived',
    status: row.status || 'active',
  };
}

function mapSponsorToDb(sponsor, eventId = _activeEventId) {
  const validId = isValidUuid(sponsor.id) ? sponsor.id : generateUuid();
  return {
    id: validId,
    event_id: isValidUuid(eventId) ? eventId : undefined,
    name: sponsor.name,
    tier: sponsor.tier,
    industry: sponsor.industry,
    website: sponsor.website,
    logo: sponsor.logo || '',
    org_id: isValidUuid(sponsor.orgId) ? sponsor.orgId : null,
    status: sponsor.isArchived ? 'archived' : (sponsor.status || 'active'),
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
  try {
    const { data, error } = await supabase
      .from('exhibitors')
      .upsert(row, { onConflict: 'id' })
      .select()
      .single();
    if (error) {
      console.warn("upsertExhibitor DB notice:", error.message);
      return { ...exhibitor, id: row.id };
    }
    return mapExhibitorFromDb(data);
  } catch (e) {
    console.warn("upsertExhibitor error:", e);
    return { ...exhibitor, id: row.id };
  }
}

export async function archiveExhibitor(id) {
  if (!id || !isValidUuid(id)) return;
  try {
    const { error } = await supabase.from('exhibitors').update({ status: 'archived' }).eq('id', id);
    if (error) console.warn("archiveExhibitor notice:", error.message);
  } catch (e) {
    console.warn("archiveExhibitor error:", e);
  }
}
export const deleteExhibitor = archiveExhibitor;

function mapExhibitorFromDb(row) {
  return {
    id: row.id,
    name: row.name || '',
    boothNumber: row.booth_number || '',
    industry: row.industry || '',
    contactEmail: row.contact_email || '',
    logo: row.logo_url || row.logo || '',
    orgId: row.org_id || null,
    isArchived: row.status === 'archived',
    status: row.status || 'active',
  };
}

function mapExhibitorToDb(exhibitor, eventId = _activeEventId) {
  const validId = isValidUuid(exhibitor.id) ? exhibitor.id : generateUuid();
  return {
    id: validId,
    event_id: isValidUuid(eventId) ? eventId : undefined,
    name: exhibitor.name,
    booth_number: exhibitor.boothNumber,
    industry: exhibitor.industry,
    contact_email: exhibitor.contactEmail,
    logo_url: exhibitor.logo || '',
    org_id: isValidUuid(exhibitor.orgId) ? exhibitor.orgId : null,
    status: exhibitor.isArchived ? 'archived' : (exhibitor.status || 'active'),
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
  try {
    const { data, error } = await supabase
      .from('tickets')
      .upsert(row, { onConflict: 'id' })
      .select()
      .single();
    if (error) {
      console.warn("upsertTicket DB notice:", error.message);
      return { ...ticket, id: row.id };
    }
    return mapTicketFromDb(data);
  } catch (e) {
    console.warn("upsertTicket error:", e);
    return { ...ticket, id: row.id };
  }
}

export async function archiveTicket(id) {
  if (!id || !isValidUuid(id)) return;
  try {
    const { error } = await supabase.from('tickets').update({ status: 'archived', is_active: false }).eq('id', id);
    if (error) console.warn("archiveTicket notice:", error.message);
  } catch (e) {
    console.warn("archiveTicket error:", e);
  }
}

export async function deleteTicket(id) {
  return await archiveTicket(id);
}

function mapTicketFromDb(row) {
  const priceNum = typeof row.price === 'number' ? row.price : parseFloat(String(row.price).replace(/[^0-9.]/g, '')) || 0;
  const qty = row.total_quantity || row.quantity_available || 100;
  return {
    id: row.id,
    name: row.name || '',
    tier: row.name || '',
    price: priceNum,
    available: qty,
    maxQty: qty,
    sold: row.sold_quantity || 0,
    status: row.status === 'archived' ? 'Archived' : (row.is_active ? 'Active' : 'Draft'),
    isArchived: row.status === 'archived',
    description: row.description || '',
    color: row.color || 'indigo',
    features: Array.isArray(row.features) ? row.features : [],
    badgeType: row.badge_type || 'thermal_qr',
    badgeUrl: row.badge_url || '',
    badgeSettings: row.badge_settings || {},
    formId: row.form_id || null,
    requiresApproval: Boolean(row.requires_approval),
    isPopular: Boolean(row.is_popular),
  };
}

function mapTicketToDb(ticket, eventId = _activeEventId) {
  const priceNum = typeof ticket.price === 'number' ? ticket.price : parseFloat(String(ticket.price).replace(/[^0-9.]/g, '')) || 0;
  const qty = parseInt(ticket.maxQty || ticket.available || ticket.total_quantity) || 100;
  const validId = isValidUuid(ticket.id) ? ticket.id : generateUuid();
  return {
    id: validId,
    event_id: isValidUuid(eventId) ? eventId : undefined,
    name: ticket.name || ticket.tier || '',
    price: priceNum,
    total_quantity: qty,
    quantity_available: qty,
    sold_quantity: parseInt(ticket.sold) || 0,
    is_active: ticket.status !== 'Draft' && ticket.status !== 'Archived',
    status: ticket.isArchived || ticket.status === 'Archived' ? 'archived' : (ticket.status || 'published'),
    description: ticket.description || '',
    color: ticket.color || 'indigo',
    features: Array.isArray(ticket.features) ? ticket.features : [],
    badge_type: ticket.badgeType || 'thermal_qr',
    badge_url: ticket.badgeUrl || null,
    badge_settings: ticket.badgeSettings || {},
    form_id: isValidUuid(ticket.formId) ? ticket.formId : null,
    requires_approval: Boolean(ticket.requiresApproval),
    is_popular: Boolean(ticket.isPopular),
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
  try {
    const { data, error } = await supabase
      .from('team_members')
      .upsert(row, { onConflict: 'id' })
      .select()
      .single();
    if (error) {
      console.warn("upsertTeamMember DB notice:", error.message);
      return { ...member, id: row.id };
    }
    return mapTeamFromDb(data);
  } catch (e) {
    console.warn("upsertTeamMember error:", e);
    return { ...member, id: row.id };
  }
}

export async function archiveTeamMember(id) {
  if (!id || !isValidUuid(id)) return;
  try {
    const { error } = await supabase.from('team_members').update({ status: 'archived' }).eq('id', id);
    if (error) console.warn("archiveTeamMember notice:", error.message);
  } catch (e) {
    console.warn("archiveTeamMember error:", e);
  }
}

export async function deleteTeamMember(id) {
  return await archiveTeamMember(id);
}

function mapTeamFromDb(row) {
  return {
    id: row.id,
    name: `${row.first_name} ${row.last_name}`.trim(),
    email: row.email || '',
    role: row.role || 'Member',
    avatar: row.avatar || '',
    status: row.status || 'active',
    isArchived: row.status === 'archived'
  };
}

function mapTeamToDb(member, eventId = _activeEventId) {
  const nameParts = (member.name || '').trim().split(' ');
  const firstName = nameParts[0] || '';
  const lastName = nameParts.slice(1).join(' ') || '';
  const validId = isValidUuid(member.id) ? member.id : generateUuid();
  return {
    id: validId,
    event_id: isValidUuid(eventId) ? eventId : undefined,
    first_name: firstName,
    last_name: lastName,
    email: member.email,
    role: member.role,
    avatar: member.avatar || '',
    status: member.isArchived ? 'archived' : 'active'
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
  const validId = isValidUuid(plan.id) ? plan.id : generateUuid();
  const planName = (typeof plan.name === 'string' && plan.name.trim().length > 0) ? plan.name.trim() : 'Floor Plan';
  const row = {
    id: validId,
    event_id: isValidUuid(targetId) ? targetId : undefined,
    name: planName,
    elements: plan.elements || [],
    blueprint: plan.blueprint || null,
    font_family: plan.fontFamily || 'Inter',
    floors: plan.floors ? JSON.stringify(plan.floors) : null,
    status: plan.isArchived ? 'archived' : (plan.status || 'published')
  };
  try {
    const { data, error } = await supabase
      .from('floor_plans')
      .upsert(row, { onConflict: 'id' })
      .select()
      .single();
    if (error) {
      console.warn("upsertFloorPlan DB notice:", error.message);
      return { ...plan, id: validId, name: planName };
    }
    return mapFloorPlanFromDb(data);
  } catch (e) {
    console.warn("upsertFloorPlan error:", e);
    return { ...plan, id: validId, name: planName };
  }
}

export async function archiveFloorPlan(id) {
  if (!id || !isValidUuid(id)) return;
  try {
    const { error } = await supabase.from('floor_plans').update({ status: 'archived' }).eq('id', id);
    if (error) console.warn("archiveFloorPlan notice:", error.message);
  } catch (e) {
    console.warn("archiveFloorPlan error:", e);
  }
}

export async function deleteFloorPlan(id) {
  return await archiveFloorPlan(id);
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
  if (!userEmail) return [];
  try {
    const { data: participants, error: pErr } = await supabase
      .from('participants')
      .select('*')
      .eq('email', userEmail)
      .order('registered_at', { ascending: false });

    if (pErr || !participants || participants.length === 0) {
      return [];
    }

    // Fetch matching real events for event details
    const eventIds = [...new Set(participants.map(p => p.event_id).filter(Boolean))];
    let eventsMap = {};
    if (eventIds.length > 0) {
      const { data: eventsList } = await supabase
        .from('events')
        .select('id, name, location, start_date, end_date')
        .in('id', eventIds);
      if (eventsList) {
        eventsList.forEach(ev => {
          eventsMap[ev.id] = ev;
        });
      }
    }

    return participants.map(row => {
      const ev = eventsMap[row.event_id] || {};
      return {
        id: row.id,
        eventId: row.event_id,
        eventTitle: ev.name || "Event Registration",
        ticketType: row.ticket_type || 'Standard Admission',
        status: row.status_participation || 'registered',
        registeredDate: row.registered_at ? row.registered_at.split('T')[0] : '',
        location: ev.location || "Venue TBA",
        startDate: ev.start_date || "",
        endDate: ev.end_date || "",
        badgeCode: `PASS-${(row.id || '').toString().slice(-6).toUpperCase()}`,
      };
    });
  } catch (err) {
    console.warn("fetchVisitorRegistrations error:", err);
    return [];
  }
}


export async function registerVisitorForEvent(eventId, visitorData) {
  const newId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `part-${Date.now()}`;
  const badgeCode = `PASS-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
  const nameParts = (visitorData.name || 'Guest Attendee').trim().split(' ');
  const isPending = Boolean(visitorData.requiresApproval);

  if (isPending) {
    // 1. Insert into pending_registrations queue
    try {
      await supabase.from('pending_registrations').insert({
        id: newId,
        event_id: eventId || DEFAULT_EVENT_ID,
        name: visitorData.name || 'Guest Attendee',
        email: visitorData.email || 'visitor@eventzone.io',
        ticket_type: visitorData.ticketType || 'Standard Admission',
        note: `Applied for ${visitorData.ticketType || 'Standard Admission'} (Pending Approval)`,
        date: new Date().toISOString().split('T')[0]
      });
    } catch (e) {
      console.warn("Supabase pending_registrations insert notice:", e);
    }

    return {
      id: newId,
      eventId: eventId,
      eventTitle: visitorData.eventTitle || 'Eventzone Summit',
      ticketType: visitorData.ticketType || 'Standard Admission',
      status: 'pending',
      registeredDate: new Date().toISOString().split('T')[0],
      location: visitorData.location || 'Online',
      startDate: visitorData.startDate || new Date().toISOString().split('T')[0],
      endDate: visitorData.endDate || new Date().toISOString().split('T')[0],
      badgeCode: badgeCode,
    };
  }

  // 2. Direct Auto-Approval
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

// Core locked and required fields for all forms
export const CORE_LOCKED_FIELDS = [
  {
    id: "f_core_name",
    type: "text",
    label: "Full Name",
    placeholder: "e.g. Alex Morgan",
    required: true,
    isLocked: true,
    options: []
  },
  {
    id: "f_core_email",
    type: "email",
    label: "Email Address",
    placeholder: "alex@company.com",
    required: true,
    isLocked: true,
    options: []
  },
  {
    id: "f_core_phone",
    type: "phone",
    label: "Phone Number",
    placeholder: "550 12 34 56",
    required: true,
    isLocked: true,
    options: []
  }
];

export function ensureCoreLockedFields(fields = []) {
  const current = Array.isArray(fields) ? [...fields] : [];
  
  const hasName = current.some(f => f.id === "f_core_name" || (f.isLocked && f.label?.toLowerCase().includes("name")));
  const hasEmail = current.some(f => f.id === "f_core_email" || (f.isLocked && f.type === "email"));
  const hasPhone = current.some(f => f.id === "f_core_phone" || (f.isLocked && (f.type === "phone" || f.label?.toLowerCase().includes("phone"))));

  const missing = [];
  if (!hasName) missing.push({ ...CORE_LOCKED_FIELDS[0] });
  if (!hasEmail) missing.push({ ...CORE_LOCKED_FIELDS[1] });
  if (!hasPhone) missing.push({ ...CORE_LOCKED_FIELDS[2] });

  const sanitized = current.map(f => {
    if (f.id === "f_core_name" || f.id === "f_core_email") {
      return { ...f, isLocked: true, required: true };
    }
    if (f.id === "f_core_phone") {
      return { ...f, type: "phone", isLocked: true, required: true };
    }
    return f;
  });

  return [...missing, ...sanitized];
}

export const STARTER_FORMS = [];
export const STARTER_SUBMISSIONS = [];

// In-memory cache for created forms and offline operation
let _cachedForms = [];
let _cachedSubmissions = [];

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
      console.warn("fetchForms DB query:", e);
    }
  }

  const matching = _cachedForms.filter(f => f.eventId === targetId);
  return matching;
}


export async function upsertForm(form, eventId = _activeEventId) {
  const targetId = eventId || _activeEventId;
  const formId = form.id || `form-${Date.now()}`;
  const now = new Date().toISOString();

  const formattedForm = {
    ...form,
    id: formId,
    eventId: targetId,
    fields: ensureCoreLockedFields(form.fields),
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
        broadcastRealtimeChange('FORM_SAVED', saved, targetId);
        return saved;
      }
    } catch (e) {
      console.warn("upsertForm DB exception, using local cache:", e);
    }
  }

  // 2. Fallback in-memory update
  _cachedForms = [formattedForm, ..._cachedForms.filter(f => f.id !== formId)];
  broadcastRealtimeChange('FORM_SAVED', formattedForm, targetId);
  return formattedForm;
}

export async function archiveForm(id, eventId = _activeEventId) {
  if (!id) return;
  const targetId = eventId || _activeEventId;
  _cachedForms = _cachedForms.map(f => f.id === id ? { ...f, status: 'archived', isArchived: true } : f);
  broadcastRealtimeChange('FORM_SAVED', { id, status: 'archived', isArchived: true }, targetId);

  if (isValidUuid(id)) {
    try {
      await supabase.from('forms').update({ status: 'archived' }).eq('id', id);
    } catch (e) {
      console.warn("archiveForm DB exception:", e);
    }
  }
}

export async function deleteForm(id, eventId = _activeEventId) {
  return await archiveForm(id, eventId);
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
        broadcastRealtimeChange('SUBMISSION_ADDED', saved, targetId);
        return saved;
      }
    } catch (e) {
      console.warn("submitFormResponse DB exception, saving to cache:", e);
    }
  }

  // 2. Save in cache
  _cachedSubmissions = [formattedSub, ..._cachedSubmissions];
  broadcastRealtimeChange('SUBMISSION_ADDED', formattedSub, targetId);
  return formattedSub;
}

export async function archiveFormSubmission(id, eventId = _activeEventId) {
  if (!id) return;
  const targetId = eventId || _activeEventId;
  _cachedSubmissions = _cachedSubmissions.map(s => s.id === id ? { ...s, status: 'archived', isArchived: true } : s);
  broadcastRealtimeChange('SUBMISSION_ARCHIVED', { id }, targetId);

  if (isValidUuid(id)) {
    try {
      await supabase.from('form_submissions').update({ status: 'archived' }).eq('id', id);
    } catch (e) {
      console.warn("archiveFormSubmission DB exception:", e);
    }
  }
}
export const deleteFormSubmission = archiveFormSubmission;

function mapFormFromDb(row) {
  return {
    id: row.id,
    eventId: row.event_id,
    title: row.title || 'Untitled Form',
    description: row.description || '',
    type: row.type || 'ticket_registration',
    ticketId: row.ticket_id || 'all',
    fields: ensureCoreLockedFields(row.fields || []),
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

// ─────────────────────────────────────────────
//  RSVP & ATTENDANCE MANAGEMENT
// ─────────────────────────────────────────────

export const STARTER_RSVPS = [
  {
    id: "rsvp-starter-1",
    eventId: DEFAULT_EVENT_ID,
    fullName: "Dr. Samira Hadj",
    email: "samira.hadj@algeria-energy.org",
    phone: "+213 550 12 34 56",
    company: "National Renewable Energy Center",
    jobTitle: "Chief Research Officer",
    status: "attending",
    plusOnes: 1,
    plusOnesNames: ["Karim Hadj"],
    dietaryPreference: "Halal",
    dietaryNotes: "No dairy products",
    notes: "Arriving for keynote session early",
    checkedIn: false,
    createdAt: new Date(Date.now() - 3600000 * 24 * 3).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 24 * 3).toISOString(),
  },
  {
    id: "rsvp-starter-2",
    eventId: DEFAULT_EVENT_ID,
    fullName: "Marc Dumont",
    email: "m.dumont@greenhydrogen-eu.com",
    phone: "+33 6 12 34 56 78",
    company: "EuroHydrogen Infrastructure SAS",
    jobTitle: "Managing Director",
    status: "attending",
    plusOnes: 0,
    plusOnesNames: [],
    dietaryPreference: "Vegetarian",
    dietaryNotes: "Strict vegetarian",
    notes: "Requires wheelchair-accessible seating if available",
    checkedIn: true,
    createdAt: new Date(Date.now() - 3600000 * 24 * 2).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 24 * 2).toISOString(),
  },
  {
    id: "rsvp-starter-3",
    eventId: DEFAULT_EVENT_ID,
    fullName: "Yasmine Belkacem",
    email: "yasmine.b@maghreb-law.com",
    phone: "+213 661 98 76 54",
    company: "Maghreb Energy Legal Partners",
    jobTitle: "Senior Partner",
    status: "attending",
    plusOnes: 2,
    plusOnesNames: ["Amine Belkacem", "Sarah Belkacem"],
    dietaryPreference: "Gluten-Free",
    dietaryNotes: "Gluten intolerance / celiac safe",
    notes: "Looking forward to bilateral offtake panel",
    checkedIn: false,
    createdAt: new Date(Date.now() - 3600000 * 20).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 20).toISOString(),
  },
  {
    id: "rsvp-starter-4",
    eventId: DEFAULT_EVENT_ID,
    fullName: "Tariq Mansoor",
    email: "t.mansoor@gulf-invest.ae",
    phone: "+971 50 112 2334",
    company: "Emirates Sustainable Capital",
    jobTitle: "Investment Director",
    status: "waitlisted",
    plusOnes: 1,
    plusOnesNames: ["Rashid Al-Nuaimi"],
    dietaryPreference: "Halal",
    dietaryNotes: "",
    notes: "Please notify immediately if priority seats clear",
    checkedIn: false,
    createdAt: new Date(Date.now() - 3600000 * 12).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 12).toISOString(),
  },
  {
    id: "rsvp-starter-5",
    eventId: DEFAULT_EVENT_ID,
    fullName: "Elena Rostova",
    email: "elena.r@nordic-transition.se",
    phone: "+46 70 123 4567",
    company: "Nordic Clean Transition Hub",
    jobTitle: "Policy Advisor",
    status: "declined",
    plusOnes: 0,
    plusOnesNames: [],
    dietaryPreference: "None",
    dietaryNotes: "",
    notes: "Conflicting overseas delegation, send post-event deck",
    checkedIn: false,
    createdAt: new Date(Date.now() - 3600000 * 8).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 8).toISOString(),
  }
];

let _cachedRsvps = [...STARTER_RSVPS];
let _cachedRsvpSettings = {};

export async function fetchRSVPs(eventId = _activeEventId) {
  const targetId = eventId || _activeEventId;
  
  if (isValidUuid(targetId)) {
    try {
      const { data, error } = await supabase
        .from('rsvps')
        .select('*')
        .eq('event_id', targetId)
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        return data.map(mapRsvpFromDb);
      }
    } catch (e) {
      console.warn("fetchRSVPs DB query exception:", e);
    }
  }

  const matching = _cachedRsvps.filter(r => r.eventId === targetId || r.eventId === DEFAULT_EVENT_ID);
  return matching;
}

export async function fetchRSVPSettings(eventId = _activeEventId) {
  const targetId = eventId || _activeEventId;

  const defaultSettings = {
    id: `set-${targetId}`,
    eventId: targetId,
    isEnabled: true,
    capacityLimit: 150,
    allowPlusOnes: true,
    maxPlusOnes: 2,
    allowWaitlist: true,
    deadline: null,
    collectDietary: true,
    collectCompany: true,
    collectPhone: true,
    confirmationMessage: "Thank you for your RSVP! We look forward to seeing you at the event.",
  };

  if (isValidUuid(targetId)) {
    try {
      const { data, error } = await supabase
        .from('rsvp_settings')
        .select('*')
        .eq('event_id', targetId)
        .maybeSingle();

      if (!error && data) {
        return mapRsvpSettingsFromDb(data);
      }
    } catch (e) {
      console.warn("fetchRSVPSettings DB query exception:", e);
    }
  }

  return _cachedRsvpSettings[targetId] || defaultSettings;
}

export async function upsertRSVPSettings(settings, eventId = _activeEventId) {
  const targetId = eventId || _activeEventId;
  const now = new Date().toISOString();

  const formatted = {
    ...settings,
    eventId: targetId,
    updatedAt: now,
  };

  if (isValidUuid(targetId)) {
    try {
      const row = {
        event_id: targetId,
        is_enabled: settings.isEnabled ?? true,
        capacity_limit: settings.capacityLimit ?? 150,
        allow_plus_ones: settings.allowPlusOnes ?? true,
        max_plus_ones: settings.maxPlusOnes ?? 2,
        allow_waitlist: settings.allowWaitlist ?? true,
        deadline: settings.deadline || null,
        collect_dietary: settings.collectDietary ?? true,
        collect_company: settings.collectCompany ?? true,
        collect_phone: settings.collectPhone ?? true,
        confirmation_message: settings.confirmationMessage || 'Thank you for your RSVP!',
        updated_at: now,
      };

      const { data, error } = await supabase
        .from('rsvp_settings')
        .upsert(row, { onConflict: 'event_id' })
        .select()
        .single();

      if (!error && data) {
        const saved = mapRsvpSettingsFromDb(data);
        _cachedRsvpSettings[targetId] = saved;
        broadcastRealtimeChange('RSVP_SETTINGS_SAVED', saved, targetId);
        return saved;
      }
    } catch (e) {
      console.warn("upsertRSVPSettings DB exception:", e);
    }
  }

  _cachedRsvpSettings[targetId] = formatted;
  broadcastRealtimeChange('RSVP_SETTINGS_SAVED', formatted, targetId);
  return formatted;
}

export async function submitGuestRSVP(rsvpData, eventId = _activeEventId) {
  const targetId = eventId || _activeEventId;
  const newId = rsvpData.id || `rsvp-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
  const now = new Date().toISOString();

  const plusOnes = Math.max(0, parseInt(rsvpData.plusOnes || 0, 10));

  const formattedRsvp = {
    id: newId,
    eventId: targetId,
    userId: rsvpData.userId || null,
    fullName: rsvpData.fullName || 'Guest',
    email: (rsvpData.email || '').trim().toLowerCase(),
    phone: rsvpData.phone || '',
    company: rsvpData.company || '',
    jobTitle: rsvpData.jobTitle || '',
    status: rsvpData.status || 'attending',
    plusOnes: plusOnes,
    plusOnesNames: Array.isArray(rsvpData.plusOnesNames) ? rsvpData.plusOnesNames : [],
    dietaryPreference: rsvpData.dietaryPreference || 'None',
    dietaryNotes: rsvpData.dietaryNotes || '',
    notes: rsvpData.notes || '',
    checkedIn: !!rsvpData.checkedIn,
    checkedInAt: rsvpData.checkedIn ? now : null,
    createdAt: now,
    updatedAt: now,
  };

  if (isValidUuid(targetId)) {
    try {
      const row = {
        id: isValidUuid(newId) ? newId : undefined,
        event_id: targetId,
        user_id: isValidUuid(rsvpData.userId) ? rsvpData.userId : null,
        full_name: formattedRsvp.fullName,
        email: formattedRsvp.email,
        phone: formattedRsvp.phone,
        company: formattedRsvp.company,
        job_title: formattedRsvp.jobTitle,
        status: formattedRsvp.status,
        plus_ones: formattedRsvp.plusOnes,
        plus_ones_names: formattedRsvp.plusOnesNames,
        dietary_preference: formattedRsvp.dietaryPreference,
        dietary_notes: formattedRsvp.dietaryNotes,
        notes: formattedRsvp.notes,
        checked_in: formattedRsvp.checkedIn,
        checked_in_at: formattedRsvp.checkedInAt,
        created_at: now,
        updated_at: now,
      };

      const { data, error } = await supabase
        .from('rsvps')
        .insert(row)
        .select()
        .single();

      if (!error && data) {
        const saved = mapRsvpFromDb(data);
        _cachedRsvps = [saved, ..._cachedRsvps.filter(r => r.id !== saved.id)];
        broadcastRealtimeChange('RSVP_SUBMITTED', saved, targetId);
        return saved;
      }
    } catch (e) {
      console.warn("submitGuestRSVP DB exception, saving to local cache:", e);
    }
  }

  _cachedRsvps = [formattedRsvp, ..._cachedRsvps.filter(r => r.id !== newId)];
  broadcastRealtimeChange('RSVP_SUBMITTED', formattedRsvp, targetId);
  return formattedRsvp;
}

export async function updateRSVPStatus(rsvpId, newStatus, eventId = _activeEventId, extraUpdates = {}) {
  const targetId = eventId || _activeEventId;
  const now = new Date().toISOString();

  // Local cache update
  _cachedRsvps = _cachedRsvps.map(r => {
    if (r.id === rsvpId) {
      return {
        ...r,
        status: newStatus || r.status,
        ...extraUpdates,
        updatedAt: now,
      };
    }
    return r;
  });

  const updatedRsvp = _cachedRsvps.find(r => r.id === rsvpId);
  if (updatedRsvp) {
    broadcastRealtimeChange('RSVP_UPDATED', updatedRsvp, targetId);
  }

  if (isValidUuid(rsvpId)) {
    try {
      const dbUpdates = {
        updated_at: now,
      };
      if (newStatus) dbUpdates.status = newStatus;
      if (extraUpdates.checkedIn !== undefined) {
        dbUpdates.checked_in = !!extraUpdates.checkedIn;
        dbUpdates.checked_in_at = extraUpdates.checkedIn ? now : null;
      }
      if (extraUpdates.dietaryPreference !== undefined) dbUpdates.dietary_preference = extraUpdates.dietaryPreference;
      if (extraUpdates.dietaryNotes !== undefined) dbUpdates.dietary_notes = extraUpdates.dietaryNotes;
      if (extraUpdates.plusOnes !== undefined) dbUpdates.plus_ones = extraUpdates.plusOnes;
      if (extraUpdates.notes !== undefined) dbUpdates.notes = extraUpdates.notes;

      const { data, error } = await supabase
        .from('rsvps')
        .update(dbUpdates)
        .eq('id', rsvpId)
        .select()
        .single();

      if (!error && data) {
        return mapRsvpFromDb(data);
      }
    } catch (e) {
      console.warn("updateRSVPStatus DB exception:", e);
    }
  }

  return updatedRsvp;
}

export async function archiveRSVP(rsvpId, eventId = _activeEventId) {
  if (!rsvpId) return;
  const targetId = eventId || _activeEventId;
  _cachedRsvps = _cachedRsvps.map(r => r.id === rsvpId ? { ...r, status: 'archived' } : r);
  broadcastRealtimeChange('RSVP_UPDATED', { id: rsvpId, status: 'archived' }, targetId);

  if (isValidUuid(rsvpId)) {
    try {
      await supabase.from('rsvps').update({ status: 'archived' }).eq('id', rsvpId);
    } catch (e) {
      console.warn("archiveRSVP DB exception:", e);
    }
  }
}

export async function deleteRSVP(rsvpId, eventId = _activeEventId) {
  return await archiveRSVP(rsvpId, eventId);
}

function mapRsvpFromDb(row) {
  return {
    id: row.id,
    eventId: row.event_id,
    userId: row.user_id,
    fullName: row.full_name || '',
    email: row.email || '',
    phone: row.phone || '',
    company: row.company || '',
    jobTitle: row.job_title || '',
    status: row.status || 'attending',
    plusOnes: row.plus_ones || 0,
    plusOnesNames: row.plus_ones_names || [],
    dietaryPreference: row.dietary_preference || 'None',
    dietaryNotes: row.dietary_notes || '',
    notes: row.notes || '',
    checkedIn: !!row.checked_in,
    checkedInAt: row.checked_in_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapRsvpSettingsFromDb(row) {
  return {
    id: row.id,
    eventId: row.event_id,
    isEnabled: row.is_enabled ?? true,
    capacityLimit: row.capacity_limit ?? 150,
    allowPlusOnes: row.allow_plus_ones ?? true,
    maxPlusOnes: row.max_plus_ones ?? 2,
    allowWaitlist: row.allow_waitlist ?? true,
    deadline: row.deadline,
    collectDietary: row.collect_dietary ?? true,
    collectCompany: row.collect_company ?? true,
    collectPhone: row.collect_phone ?? true,
    confirmationMessage: row.confirmation_message || "Thank you for your RSVP!",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// ─────────────────────────────────────────────
//  REAL-TIME CLIENT-SIDE SYNCHRONIZATION ENGINE
// ─────────────────────────────────────────────

const _realtimeSubscribers = new Set();
let _eventzoneBroadcastChannel = null;

if (typeof window !== 'undefined' && typeof window.BroadcastChannel !== 'undefined') {
  try {
    _eventzoneBroadcastChannel = new BroadcastChannel('eventzone_realtime_channel');
    _eventzoneBroadcastChannel.onmessage = (event) => {
      const data = event.data || {};
      _realtimeSubscribers.forEach(cb => {
        try { cb(data); } catch (e) { console.warn("Realtime sync callback error:", e); }
      });
    };
  } catch (e) {
    console.warn("BroadcastChannel initialization notice:", e);
  }
}

export function broadcastRealtimeChange(type, payload, eventId = _activeEventId) {
  const message = { type, payload, eventId, timestamp: Date.now() };

  // 1. Notify local within-tab subscribers
  _realtimeSubscribers.forEach(cb => {
    try { cb(message); } catch (e) { console.warn("Local sync callback error:", e); }
  });

  // 2. Broadcast across browser tabs and windows
  if (_eventzoneBroadcastChannel) {
    try {
      _eventzoneBroadcastChannel.postMessage(message);
    } catch (e) {
      console.warn("Broadcast postMessage notice:", e);
    }
  }
}

export function subscribeToRealtimeSync(callback) {
  _realtimeSubscribers.add(callback);
  return () => {
    _realtimeSubscribers.delete(callback);
  };
}


