-- ==============================================================================
-- FORMS & FORM SUBMISSIONS SCHEMA MIGRATION
-- Run this in your Supabase SQL Editor: https://supabase.com/dashboard/project/awkreadldqmidcrrqukm/sql
-- ==============================================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Create 'forms' Table
CREATE TABLE IF NOT EXISTS public.forms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
    title TEXT NOT NULL DEFAULT 'Untitled Form',
    description TEXT DEFAULT '',
    type TEXT DEFAULT 'ticket_registration',
    ticket_id TEXT DEFAULT 'all',
    fields JSONB DEFAULT '[]'::jsonb,
    settings JSONB DEFAULT '{}'::jsonb,
    status TEXT DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create 'form_submissions' Table
CREATE TABLE IF NOT EXISTS public.form_submissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    form_id UUID REFERENCES public.forms(id) ON DELETE CASCADE,
    event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
    user_id UUID,
    respondent_name TEXT DEFAULT 'Attendee',
    respondent_email TEXT DEFAULT '',
    ticket_tier TEXT DEFAULT 'Standard Admission',
    answers JSONB DEFAULT '{}'::jsonb,
    status TEXT DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create Indexes for High Performance
CREATE INDEX IF NOT EXISTS idx_forms_event_id ON public.forms(event_id);
CREATE INDEX IF NOT EXISTS idx_forms_status ON public.forms(status);
CREATE INDEX IF NOT EXISTS idx_form_submissions_form_id ON public.form_submissions(form_id);
CREATE INDEX IF NOT EXISTS idx_form_submissions_event_id ON public.form_submissions(event_id);
CREATE INDEX IF NOT EXISTS idx_form_submissions_email ON public.form_submissions(respondent_email);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.form_submissions ENABLE ROW LEVEL SECURITY;

-- 5. Create Permissive Policies for Web Platform & Mobile App
DROP POLICY IF EXISTS "Public access forms" ON public.forms;
CREATE POLICY "Public access forms" ON public.forms
    FOR ALL
    USING (true)
    WITH CHECK (true);

DROP POLICY IF EXISTS "Public access form_submissions" ON public.form_submissions;
CREATE POLICY "Public access form_submissions" ON public.form_submissions
    FOR ALL
    USING (true)
    WITH CHECK (true);
