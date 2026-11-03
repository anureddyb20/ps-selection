export type DomainCategory = 'CSE_AIML' | 'ECE' | 'MECH_CIVIL';
export type SubDomain = 'MECHANICAL' | 'CIVIL';
export type AvailabilityStatus = 'AVAILABLE' | 'ONE SLOT LEFT' | 'FULL';

export interface ProblemStatement {
  id: string;
  ps_code: string;
  domain: DomainCategory;
  sub_domain: SubDomain | null;
  is_published: boolean;
  is_selection_open: boolean;
  created_at: string;
  updated_at: string;
}

export interface Team {
  id: string;
  team_id: string;            // e.g. 'TEAM-101'
  team_name: string;          // e.g. 'Neural Knights'
  password_hash: string;      // Securely hashed password
  domain: DomainCategory;     // 'CSE_AIML' | 'ECE' | 'MECH_CIVIL'
  leader_name: string;
  leader_email: string;
  created_at: string;
}

export interface PSSelection {
  id: string;
  team_id: string;
  problem_statement_id: string;
  selected_at: string;
  status: 'CONFIRMED' | 'CANCELLED';
  team?: Team;
  problem_statement?: ProblemStatement;
}

export interface AdminSettings {
  id: number;
  portal_published: boolean;
  selection_open: boolean;
  max_teams_per_ps: number;
  one_ps_per_team: boolean;
  updated_at?: string;
}

// Sanitized public structure for participating teams:
// Strictest compliance with Section 2: ONLY PS Code, occupied count, status, selection availability.
export interface PublicPSItem {
  ps_code: string;
  domain: DomainCategory;
  sub_domain: SubDomain | null;
  occupied_count: number;     // 0, 1, or 2
  max_teams: number;          // 2
  status: AvailabilityStatus; // 'AVAILABLE' | 'ONE SLOT LEFT' | 'FULL'
  is_available: boolean;
}

export interface DomainStats {
  total: number;
  selected_teams: number;
  available_codes: number;
  full_codes: number;
}

export interface DashboardStats {
  total_ps_codes: number;
  total_registered_teams: number;
  total_selections: number;
  available_ps_codes: number;
  partially_booked_ps_codes: number;
  fully_booked_ps_codes: number;
  domains: {
    CSE_AIML: DomainStats;
    ECE: DomainStats;
    MECH_CIVIL: DomainStats;
  };
}

export interface SelectionRecordItem {
  id: string;
  ps_code: string;
  domain: DomainCategory;
  sub_domain: SubDomain | null;
  team_id: string;
  team_code: string; // The login team_id (e.g. 'TEAM-101')
  team_name: string;
  leader_name: string;
  leader_email: string;
  selected_at: string;
  status: string;
}

export interface TeamPublicProfile {
  id: string;
  team_id: string;
  team_name: string;
  domain: DomainCategory;
  leader_name: string;
  leader_email: string;
  selection: {
    id: string;
    ps_code: string;
    domain: DomainCategory;
    sub_domain: SubDomain | null;
    selected_at: string;
  } | null;
}
