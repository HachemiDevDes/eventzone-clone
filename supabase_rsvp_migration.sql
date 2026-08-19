-- ==============================================================================
-- EVENTZONE RSVP MODULE - DATABASE SCHEMA & MIGRATION SCRIPT
-- ==============================================================================

-- 1. Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. RSVPs Table
CREATE TABLE IF NOT EXISTS public.rsvps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  company TEXT,
  job_title TEXT,
  status TEXT NOT NULL DEFAULT 'attending', -- 'attending', 'declined', 'waitlisted', 'tentative'
  plus_ones INTEGER DEFAULT 0,
  plus_ones_names JSONB DEFAULT '[]'::jsonb,
  dietary_preference TEXT DEFAULT 'None', -- 'None', 'Vegetarian', 'Vegan', 'Halal', 'Kosher', 'Gluten-Free', 'Dairy-Free', 'Nut Allergy', 'Other'
  dietary_notes TEXT,
  notes TEXT,
  checked_in BOOLEAN DEFAULT FALSE,
  checked_in_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure all columns exist on rsvps table if pre-existing
ALTER TABLE public.rsvps ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.rsvps ADD COLUMN IF NOT EXISTS company TEXT;
ALTER TABLE public.rsvps ADD COLUMN IF NOT EXISTS job_title TEXT;
ALTER TABLE public.rsvps ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'attending';
ALTER TABLE public.rsvps ADD COLUMN IF NOT EXISTS plus_ones INTEGER DEFAULT 0;
ALTER TABLE public.rsvps ADD COLUMN IF NOT EXISTS plus_ones_names JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.rsvps ADD COLUMN IF NOT EXISTS dietary_preference TEXT DEFAULT 'None';
ALTER TABLE public.rsvps ADD COLUMN IF NOT EXISTS dietary_notes TEXT;
ALTER TABLE public.rsvps ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE public.rsvps ADD COLUMN IF NOT EXISTS checked_in BOOLEAN DEFAULT FALSE;
ALTER TABLE public.rsvps ADD COLUMN IF NOT EXISTS checked_in_at TIMESTAMPTZ;
ALTER TABLE public.rsvps ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Create Indexes for fast querying
CREATE INDEX IF NOT EXISTS idx_rsvps_event_id ON public.rsvps(event_id);
CREATE INDEX IF NOT EXISTS idx_rsvps_status ON public.rsvps(status);
CREATE INDEX IF NOT EXISTS idx_rsvps_email ON public.rsvps(email);

-- 3. RSVP Settings Table (Per-event configuration)
CREATE TABLE IF NOT EXISTS public.rsvp_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE UNIQUE,
  is_enabled BOOLEAN DEFAULT TRUE,
  capacity_limit INTEGER DEFAULT 150,
  allow_plus_ones BOOLEAN DEFAULT TRUE,
  max_plus_ones INTEGER DEFAULT 2,
  allow_waitlist BOOLEAN DEFAULT TRUE,
  deadline TIMESTAMPTZ,
  collect_dietary BOOLEAN DEFAULT TRUE,
  collect_company BOOLEAN DEFAULT TRUE,
  collect_phone BOOLEAN DEFAULT TRUE,
  confirmation_message TEXT DEFAULT 'Thank you for your RSVP! We look forward to seeing you at the event.',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.rsvp_settings ADD COLUMN IF NOT EXISTS is_enabled BOOLEAN DEFAULT TRUE;
ALTER TABLE public.rsvp_settings ADD COLUMN IF NOT EXISTS capacity_limit INTEGER DEFAULT 150;
ALTER TABLE public.rsvp_settings ADD COLUMN IF NOT EXISTS allow_plus_ones BOOLEAN DEFAULT TRUE;
ALTER TABLE public.rsvp_settings ADD COLUMN IF NOT EXISTS max_plus_ones INTEGER DEFAULT 2;
ALTER TABLE public.rsvp_settings ADD COLUMN IF NOT EXISTS allow_waitlist BOOLEAN DEFAULT TRUE;
ALTER TABLE public.rsvp_settings ADD COLUMN IF NOT EXISTS deadline TIMESTAMPTZ;
ALTER TABLE public.rsvp_settings ADD COLUMN IF NOT EXISTS collect_dietary BOOLEAN DEFAULT TRUE;
ALTER TABLE public.rsvp_settings ADD COLUMN IF NOT EXISTS collect_company BOOLEAN DEFAULT TRUE;
ALTER TABLE public.rsvp_settings ADD COLUMN IF NOT EXISTS collect_phone BOOLEAN DEFAULT TRUE;
ALTER TABLE public.rsvp_settings ADD COLUMN IF NOT EXISTS confirmation_message TEXT DEFAULT 'Thank you for your RSVP! We look forward to seeing you at the event.';
ALTER TABLE public.rsvp_settings ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 4. Enable Row Level Security (RLS) and Public Access Policies
ALTER TABLE public.rsvps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rsvp_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public access policy" ON public.rsvps;
CREATE POLICY "Public access policy" ON public.rsvps FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access policy" ON public.rsvp_settings;
CREATE POLICY "Public access policy" ON public.rsvp_settings FOR ALL USING (true) WITH CHECK (true);
