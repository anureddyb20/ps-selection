-- ====================================================================
-- VVCE IDEATHON: PROBLEM STATEMENT SELECTION PORTAL
-- PostgreSQL / Supabase Schema & Atomic Selection Stored Procedure
-- ====================================================================

-- Enable UUID extension if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. problem_statements Table
CREATE TABLE IF NOT EXISTS public.problem_statements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ps_code VARCHAR(20) UNIQUE NOT NULL,
    domain VARCHAR(50) NOT NULL, -- 'CSE_AIML', 'ECE', 'MECH_CIVIL'
    sub_domain VARCHAR(50),      -- 'MECHANICAL', 'CIVIL' or NULL
    is_published BOOLEAN NOT NULL DEFAULT TRUE,
    is_selection_open BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. teams Table
CREATE TABLE IF NOT EXISTS public.teams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_name VARCHAR(150) UNIQUE NOT NULL,
    registration_id VARCHAR(100) UNIQUE NOT NULL,
    leader_name VARCHAR(150) NOT NULL,
    leader_email VARCHAR(200) UNIQUE NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. ps_selections Table
CREATE TABLE IF NOT EXISTS public.ps_selections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
    problem_statement_id UUID NOT NULL REFERENCES public.problem_statements(id) ON DELETE RESTRICT,
    selected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    status VARCHAR(30) NOT NULL DEFAULT 'CONFIRMED',
    CONSTRAINT uq_team_selection UNIQUE(team_id) -- Strict: 1 PS per team
);

-- 4. admin_settings Table
CREATE TABLE IF NOT EXISTS public.admin_settings (
    id INTEGER PRIMARY KEY DEFAULT 1,
    portal_published BOOLEAN NOT NULL DEFAULT TRUE,
    selection_open BOOLEAN NOT NULL DEFAULT TRUE,
    max_teams_per_ps INTEGER NOT NULL DEFAULT 2,
    one_ps_per_team BOOLEAN NOT NULL DEFAULT TRUE,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. admin_users Table
CREATE TABLE IF NOT EXISTS public.admin_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed default admin settings
INSERT INTO public.admin_settings (id, portal_published, selection_open, max_teams_per_ps, one_ps_per_team)
VALUES (1, TRUE, TRUE, 2, TRUE)
ON CONFLICT (id) DO NOTHING;

-- Seed Default Admin User (access code: 123654, hashed with sha256)
INSERT INTO public.admin_users (username, password_hash)
VALUES ('admin', encode(digest('123654', 'sha256'), 'hex'))
ON CONFLICT (username) DO NOTHING;

-- 6. SEED EXACTLY THE 30 PS CODES (From VVCE Ideathon specifications)
INSERT INTO public.problem_statements (ps_code, domain, sub_domain, is_published, is_selection_open)
VALUES
    -- DOMAIN 1: CSE / AIML (15 Codes)
    ('CS-01', 'CSE_AIML', NULL, TRUE, TRUE),
    ('CS-02', 'CSE_AIML', NULL, TRUE, TRUE),
    ('CS-03', 'CSE_AIML', NULL, TRUE, TRUE),
    ('CS-04', 'CSE_AIML', NULL, TRUE, TRUE),
    ('CS-05', 'CSE_AIML', NULL, TRUE, TRUE),
    ('CS-06', 'CSE_AIML', NULL, TRUE, TRUE),
    ('CS-07', 'CSE_AIML', NULL, TRUE, TRUE),
    ('CS-08', 'CSE_AIML', NULL, TRUE, TRUE),
    ('CS-09', 'CSE_AIML', NULL, TRUE, TRUE),
    ('CS-10', 'CSE_AIML', NULL, TRUE, TRUE),
    ('CS-11', 'CSE_AIML', NULL, TRUE, TRUE),
    ('CS-12', 'CSE_AIML', NULL, TRUE, TRUE),
    ('CS-13', 'CSE_AIML', NULL, TRUE, TRUE),
    ('CS-14', 'CSE_AIML', NULL, TRUE, TRUE),
    ('CS-15', 'CSE_AIML', NULL, TRUE, TRUE),

    -- DOMAIN 2: ELECTRONICS AND COMMUNICATION (10 Codes)
    ('EC-01', 'ECE', NULL, TRUE, TRUE),
    ('EC-02', 'ECE', NULL, TRUE, TRUE),
    ('EC-03', 'ECE', NULL, TRUE, TRUE),
    ('EC-04', 'ECE', NULL, TRUE, TRUE),
    ('EC-05', 'ECE', NULL, TRUE, TRUE),
    ('EC-06', 'ECE', NULL, TRUE, TRUE),
    ('EC-07', 'ECE', NULL, TRUE, TRUE),
    ('EC-08', 'ECE', NULL, TRUE, TRUE),
    ('EC-09', 'ECE', NULL, TRUE, TRUE),
    ('EC-10', 'ECE', NULL, TRUE, TRUE),

    -- DOMAIN 3: MECHANICAL AND CIVIL (5 Codes total)
    -- Mechanical (3 Codes)
    ('ME-01', 'MECH_CIVIL', 'MECHANICAL', TRUE, TRUE),
    ('ME-02', 'MECH_CIVIL', 'MECHANICAL', TRUE, TRUE),
    ('ME-03', 'MECH_CIVIL', 'MECHANICAL', TRUE, TRUE),
    -- Civil (2 Codes)
    ('CE-01', 'MECH_CIVIL', 'CIVIL', TRUE, TRUE),
    ('CE-02', 'MECH_CIVIL', 'CIVIL', TRUE, TRUE)
ON CONFLICT (ps_code) DO NOTHING;

-- 7. ATOMIC SELECTION FUNCTION WITH ROW-LEVEL LOCKING
-- Prevents race conditions and strictly guarantees that no more than 2 teams can select any PS code.
CREATE OR REPLACE FUNCTION public.reserve_problem_statement(
    p_ps_code VARCHAR,
    p_team_name VARCHAR,
    p_registration_id VARCHAR,
    p_leader_name VARCHAR,
    p_leader_email VARCHAR
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_ps RECORD;
    v_settings RECORD;
    v_team_id UUID;
    v_selection_id UUID;
    v_current_count INTEGER;
BEGIN
    -- 1. Check Global Settings
    SELECT * INTO v_settings FROM public.admin_settings WHERE id = 1;
    IF NOT v_settings.portal_published THEN
        RETURN jsonb_build_object('success', false, 'message', 'The selection portal is currently unpublished by administrators.');
    END IF;

    IF NOT v_settings.selection_open THEN
        RETURN jsonb_build_object('success', false, 'message', 'Problem Statement selection is currently closed.');
    END IF;

    -- 2. Lock and fetch Problem Statement row (FOR UPDATE prevents concurrency races)
    SELECT * INTO v_ps FROM public.problem_statements
    WHERE ps_code = p_ps_code
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'message', 'Invalid Problem Statement code.');
    END IF;

    IF NOT v_ps.is_published THEN
        RETURN jsonb_build_object('success', false, 'message', 'This Problem Statement is not currently published.');
    END IF;

    IF NOT v_ps.is_selection_open THEN
        RETURN jsonb_build_object('success', false, 'message', 'Selection for this Problem Statement has been paused.');
    END IF;

    -- 3. Check current slot count with strict lock
    SELECT COUNT(*) INTO v_current_count
    FROM public.ps_selections
    WHERE problem_statement_id = v_ps.id AND status = 'CONFIRMED';

    IF v_current_count >= v_settings.max_teams_per_ps THEN
        RETURN jsonb_build_object('success', false, 'message', 'This Problem Statement is FULL (maximum capacity of 2 teams reached). Please choose another available code.');
    END IF;

    -- 4. Check Duplicate Team Name, Registration ID, or Leader Email
    IF EXISTS (SELECT 1 FROM public.teams WHERE LOWER(team_name) = LOWER(p_team_name)) THEN
        RETURN jsonb_build_object('success', false, 'message', 'A team with this Team Name has already registered.');
    END IF;

    IF EXISTS (SELECT 1 FROM public.teams WHERE LOWER(registration_id) = LOWER(p_registration_id)) THEN
        RETURN jsonb_build_object('success', false, 'message', 'This Registration ID has already been used.');
    END IF;

    IF EXISTS (SELECT 1 FROM public.teams WHERE LOWER(leader_email) = LOWER(p_leader_email)) THEN
        RETURN jsonb_build_object('success', false, 'message', 'A team with this Leader Email has already registered.');
    END IF;

    -- 5. Insert Team Record
    INSERT INTO public.teams (team_name, registration_id, leader_name, leader_email)
    VALUES (p_team_name, p_registration_id, p_leader_name, LOWER(p_leader_email))
    RETURNING id INTO v_team_id;

    -- 6. Insert Selection Record
    INSERT INTO public.ps_selections (team_id, problem_statement_id, status)
    VALUES (v_team_id, v_ps.id, 'CONFIRMED')
    RETURNING id INTO v_selection_id;

    -- 7. Return success details
    RETURN jsonb_build_object(
        'success', true,
        'message', 'Problem statement successfully reserved!',
        'ps_code', v_ps.ps_code,
        'team_name', p_team_name,
        'registration_id', p_registration_id,
        'leader_name', p_leader_name,
        'leader_email', p_leader_email,
        'selection_id', v_selection_id,
        'selected_at', NOW()
    );
END;
$$;

-- 8. Enable Row Level Security (RLS)
ALTER TABLE public.problem_statements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ps_selections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- Public can read problem_statements (only code and status fields, never details)
CREATE POLICY "Public can view published problem statements"
ON public.problem_statements FOR SELECT
USING (is_published = true);

-- Public can read admin_settings
CREATE POLICY "Public can view admin settings"
ON public.admin_settings FOR SELECT
USING (true);

-- Enable Realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.problem_statements;
ALTER PUBLICATION supabase_realtime ADD TABLE public.ps_selections;
ALTER PUBLICATION supabase_realtime ADD TABLE public.admin_settings;

