-- ====================================================================
-- VICE VERSE 2026: PROBLEM STATEMENT SELECTION PORTAL
-- PostgreSQL / Supabase Schema & Atomic Selection Stored Procedure
-- ====================================================================

-- 1. Enable Required Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Drop existing views/functions if updating
DROP FUNCTION IF EXISTS public.reserve_problem_statement(VARCHAR, VARCHAR, VARCHAR, VARCHAR, VARCHAR);
DROP FUNCTION IF EXISTS public.reserve_problem_statement_atomic(VARCHAR, VARCHAR);

-- 3. problem_statements Table (Exactly 30 Codes)
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

-- 4. teams Table (Only Team ID - No dummy data, no passwords, no leader info)
CREATE TABLE IF NOT EXISTS public.teams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id VARCHAR(50) UNIQUE NOT NULL,
    domain VARCHAR(50) DEFAULT 'CSE_AIML',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. ps_selections Table (Strict 1 PS per team, Max 2 teams per PS)
CREATE TABLE IF NOT EXISTS public.ps_selections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
    problem_statement_id UUID NOT NULL REFERENCES public.problem_statements(id) ON DELETE RESTRICT,
    selected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    status VARCHAR(30) NOT NULL DEFAULT 'CONFIRMED',
    CONSTRAINT uq_team_selection UNIQUE(team_id) -- Strict: 1 PS per team
);

-- 6. admin_settings Table
CREATE TABLE IF NOT EXISTS public.admin_settings (
    id INTEGER PRIMARY KEY DEFAULT 1,
    portal_published BOOLEAN NOT NULL DEFAULT TRUE,
    selection_open BOOLEAN NOT NULL DEFAULT TRUE,
    max_teams_per_ps INTEGER NOT NULL DEFAULT 2,
    one_ps_per_team BOOLEAN NOT NULL DEFAULT TRUE,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed default admin settings
INSERT INTO public.admin_settings (id, portal_published, selection_open, max_teams_per_ps, one_ps_per_team)
VALUES (1, TRUE, TRUE, 2, TRUE)
ON CONFLICT (id) DO UPDATE SET
    portal_published = EXCLUDED.portal_published,
    selection_open = EXCLUDED.selection_open,
    max_teams_per_ps = EXCLUDED.max_teams_per_ps,
    one_ps_per_team = EXCLUDED.one_ps_per_team;

-- 7. SEED EXACTLY THE 30 PS CODES (Verified with Ideathon Case Studies)
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

    -- DOMAIN 3: MECHANICAL AND CIVIL (5 Codes)
    -- Mechanical (3 Codes)
    ('ME-01', 'MECH_CIVIL', 'MECHANICAL', TRUE, TRUE),
    ('ME-02', 'MECH_CIVIL', 'MECHANICAL', TRUE, TRUE),
    ('ME-03', 'MECH_CIVIL', 'MECHANICAL', TRUE, TRUE),
    -- Civil (2 Codes)
    ('CE-01', 'MECH_CIVIL', 'CIVIL', TRUE, TRUE),
    ('CE-02', 'MECH_CIVIL', 'CIVIL', TRUE, TRUE)
ON CONFLICT (ps_code) DO NOTHING;

-- 8. ATOMIC SELECTION FUNCTION WITH ROW-LEVEL LOCKING
-- Accepts any Team ID dynamically, creates team on-the-fly, enforces 2-team cap & 1-PS per team
CREATE OR REPLACE FUNCTION public.reserve_problem_statement_atomic(
    p_team_id VARCHAR,
    p_ps_code VARCHAR
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_ps RECORD;
    v_settings RECORD;
    v_team RECORD;
    v_selection_id UUID;
    v_current_count INTEGER;
    v_clean_team_id VARCHAR;
    v_clean_ps_code VARCHAR;
BEGIN
    v_clean_team_id := UPPER(TRIM(p_team_id));
    v_clean_ps_code := UPPER(TRIM(p_ps_code));

    IF v_clean_team_id IS NULL OR v_clean_team_id = '' THEN
        RETURN jsonb_build_object('success', false, 'message', 'Please enter a valid Team ID.');
    END IF;

    -- 1. Check Global Settings
    SELECT * INTO v_settings FROM public.admin_settings WHERE id = 1;
    IF NOT v_settings.portal_published THEN
        RETURN jsonb_build_object('success', false, 'message', 'The selection portal is currently unpublished by administrators.');
    END IF;

    IF NOT v_settings.selection_open THEN
        RETURN jsonb_build_object('success', false, 'message', 'Problem statement selection is currently closed or paused.');
    END IF;

    -- 2. Lock and fetch Problem Statement row (FOR UPDATE guarantees race condition safety)
    SELECT * INTO v_ps FROM public.problem_statements
    WHERE UPPER(ps_code) = v_clean_ps_code
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'message', 'Invalid PS code: ' || p_ps_code);
    END IF;

    IF NOT v_ps.is_published THEN
        RETURN jsonb_build_object('success', false, 'message', 'This problem statement is not currently published.');
    END IF;

    IF NOT v_ps.is_selection_open THEN
        RETURN jsonb_build_object('success', false, 'message', 'Selection for PS ' || v_ps.ps_code || ' has been paused.');
    END IF;

    -- 3. Check or Create Team Dynamically
    SELECT * INTO v_team FROM public.teams WHERE UPPER(team_id) = v_clean_team_id;
    IF NOT FOUND THEN
        INSERT INTO public.teams (team_id, domain)
        VALUES (v_clean_team_id, v_ps.domain)
        RETURNING * INTO v_team;
    ELSE
        -- Update team domain to match chosen PS domain
        UPDATE public.teams SET domain = v_ps.domain WHERE id = v_team.id;
    END IF;

    -- 4. Check if Team already has a confirmed selection (Strict: 1 PS per team)
    IF EXISTS (
        SELECT 1 FROM public.ps_selections
        WHERE team_id = v_team.id AND status = 'CONFIRMED'
    ) THEN
        RETURN jsonb_build_object('success', false, 'message', 'Your team has already confirmed a PS selection. Each team can select only ONE problem statement.');
    END IF;

    -- 5. Check current occupancy count with lock
    SELECT COUNT(*) INTO v_current_count
    FROM public.ps_selections
    WHERE problem_statement_id = v_ps.id AND status = 'CONFIRMED';

    IF v_current_count >= v_settings.max_teams_per_ps THEN
        RETURN jsonb_build_object('success', false, 'message', 'This PS has just been filled (' || v_current_count || '/' || v_settings.max_teams_per_ps || ' teams). Please select another available code.');
    END IF;

    -- 6. Insert Selection Record
    INSERT INTO public.ps_selections (team_id, problem_statement_id, status)
    VALUES (v_team.id, v_ps.id, 'CONFIRMED')
    RETURNING id INTO v_selection_id;

    -- 7. Return Result
    RETURN jsonb_build_object(
        'success', true,
        'message', 'Congratulations! PS Code ' || v_ps.ps_code || ' has been successfully reserved for team ' || v_clean_team_id || '.',
        'ps_code', v_ps.ps_code,
        'team_id', v_clean_team_id,
        'selection_id', v_selection_id,
        'occupied_count', v_current_count + 1,
        'status', CASE WHEN v_current_count + 1 >= v_settings.max_teams_per_ps THEN 'FULL' ELSE 'ONE SLOT LEFT' END,
        'selected_at', NOW()
    );
END;
$$;

-- 9. Enable Row Level Security (RLS)
ALTER TABLE public.problem_statements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ps_selections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_settings ENABLE ROW LEVEL SECURITY;

-- 10. RLS Policies
-- Public can view published problem statements (Only codes & metadata, never confidential titles/descriptions)
DROP POLICY IF EXISTS "Public can view published problem statements" ON public.problem_statements;
CREATE POLICY "Public can view published problem statements"
ON public.problem_statements FOR SELECT
USING (is_published = true);

-- Public can view admin settings
DROP POLICY IF EXISTS "Public can view admin settings" ON public.admin_settings;
CREATE POLICY "Public can view admin settings"
ON public.admin_settings FOR SELECT
USING (true);

-- Public can view teams
DROP POLICY IF EXISTS "Public can view teams" ON public.teams;
CREATE POLICY "Public can view teams"
ON public.teams FOR SELECT
USING (true);

-- Public can view confirmed selections (for counting slots)
DROP POLICY IF EXISTS "Public can view selections" ON public.ps_selections;
CREATE POLICY "Public can view selections"
ON public.ps_selections FOR SELECT
USING (status = 'CONFIRMED');

-- Service role / Backend has full read/write access
DROP POLICY IF EXISTS "Service role full access on problem_statements" ON public.problem_statements;
CREATE POLICY "Service role full access on problem_statements"
ON public.problem_statements FOR ALL
TO service_role
USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Service role full access on teams" ON public.teams;
CREATE POLICY "Service role full access on teams"
ON public.teams FOR ALL
TO service_role
USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Service role full access on ps_selections" ON public.ps_selections;
CREATE POLICY "Service role full access on ps_selections"
ON public.ps_selections FOR ALL
TO service_role
USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Service role full access on admin_settings" ON public.admin_settings;
CREATE POLICY "Service role full access on admin_settings"
ON public.admin_settings FOR ALL
TO service_role
USING (true) WITH CHECK (true);

-- 11. Enable Supabase Realtime for live UI updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.problem_statements;
ALTER PUBLICATION supabase_realtime ADD TABLE public.teams;
ALTER PUBLICATION supabase_realtime ADD TABLE public.ps_selections;
ALTER PUBLICATION supabase_realtime ADD TABLE public.admin_settings;
