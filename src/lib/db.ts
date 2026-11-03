import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import {
  ProblemStatement,
  Team,
  PSSelection,
  AdminSettings,
  PublicPSItem,
  DashboardStats,
  SelectionRecordItem,
  DomainCategory,
  SubDomain,
  AvailabilityStatus,
} from './types';
import { INITIAL_PROBLEM_STATEMENTS } from './constants';
import { EventEmitter } from 'events';

// Realtime Event Bus for Instant Broadcast across Connected Clients
export const realtimeEmitter = new EventEmitter();
realtimeEmitter.setMaxListeners(100);

export function notifyChange(event: string, payload: any) {
  realtimeEmitter.emit('portal-update', { event, payload, timestamp: Date.now() });
}

export interface DatabaseState {
  problem_statements: ProblemStatement[];
  teams: Team[];
  ps_selections: PSSelection[];
  admin_settings: AdminSettings;
  version: number;
}

const DATA_DIR = path.join(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'database.json');

// In-process lock to prevent concurrency race conditions during simultaneous requests
let lockPromise: Promise<void> = Promise.resolve();

async function withAtomicLock<T>(fn: () => Promise<T> | T): Promise<T> {
  let release: () => void = () => {};
  const currentLock = new Promise<void>((resolve) => {
    release = resolve;
  });
  const previousLock = lockPromise;
  lockPromise = currentLock;

  await previousLock;
  try {
    return await fn();
  } finally {
    release();
  }
}

function ensureDirectory() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function initializeDefaultState(): DatabaseState {
  const now = new Date().toISOString();

  // Exactly 30 PS Codes
  const statements: ProblemStatement[] = INITIAL_PROBLEM_STATEMENTS.map((item, index) => ({
    id: `ps-${item.ps_code.toLowerCase()}-${index + 1}`,
    ps_code: item.ps_code,
    domain: item.domain,
    sub_domain: item.sub_domain,
    is_published: true,
    is_selection_open: true,
    created_at: now,
    updated_at: now,
  }));

  const state: DatabaseState = {
    problem_statements: statements,
    teams: [],
    ps_selections: [],
    admin_settings: {
      id: 1,
      portal_published: true,
      selection_open: true,
      max_teams_per_ps: 2,
      one_ps_per_team: true,
      updated_at: now,
    },
    version: 1,
  };

  return state;
}

function readState(): DatabaseState {
  ensureDirectory();
  if (!fs.existsSync(DATA_FILE)) {
    const initialState = initializeDefaultState();
    fs.writeFileSync(DATA_FILE, JSON.stringify(initialState, null, 2), 'utf-8');
    return initialState;
  }

  try {
    const content = fs.readFileSync(DATA_FILE, 'utf-8');
    const parsed = JSON.parse(content) as DatabaseState;

    // Ensure all 30 predefined statements exist
    if (!parsed.problem_statements || parsed.problem_statements.length === 0) {
      const fresh = initializeDefaultState();
      fs.writeFileSync(DATA_FILE, JSON.stringify(fresh, null, 2), 'utf-8');
      return fresh;
    }

    return parsed;
  } catch (err) {
    console.error('Error reading database file, reinitializing pristine state:', err);
    const fresh = initializeDefaultState();
    fs.writeFileSync(DATA_FILE, JSON.stringify(fresh, null, 2), 'utf-8');
    return fresh;
  }
}

function writeState(state: DatabaseState): void {
  ensureDirectory();
  state.version = (state.version || 0) + 1;
  const tempPath = `${DATA_FILE}.tmp.${Date.now()}.${Math.random().toString(36).slice(2, 7)}`;
  fs.writeFileSync(tempPath, JSON.stringify(state, null, 2), 'utf-8');
  fs.renameSync(tempPath, DATA_FILE);
}

// ====================================================================
// PUBLIC ACCESS METHODS (STRICT PRIVACY - DISPLAY ONLY PS CODES)
// ====================================================================

/**
 * Returns strictly sanitized public problem statement items.
 * Guaranteed to NEVER reveal titles, descriptions, orgs, or confidential case study content.
 */
export async function getPublicProblemStatements(): Promise<{
  portal_published: boolean;
  selection_open: boolean;
  problem_statements: PublicPSItem[];
  stats: {
    total_codes: number;
    total_slots: number;
    reserved_slots: number;
    remaining_slots: number;
  };
}> {
  return withAtomicLock(() => {
    const state = readState();
    const settings = state.admin_settings;

    // Compute slot counts for each PS code
    const activeSelections = state.ps_selections.filter((s) => s.status === 'CONFIRMED');

    const publicItems: PublicPSItem[] = state.problem_statements
      .filter((ps) => ps.is_published)
      .map((ps) => {
        const occupied = activeSelections.filter((s) => s.problem_statement_id === ps.id).length;
        const maxSlots = settings.max_teams_per_ps || 2;

        let status: 'AVAILABLE' | 'ONE SLOT LEFT' | 'FULL' = 'AVAILABLE';
        if (occupied >= maxSlots) {
          status = 'FULL';
        } else if (occupied === 1) {
          status = 'ONE SLOT LEFT';
        }

        const is_available =
          settings.portal_published &&
          settings.selection_open &&
          ps.is_published &&
          ps.is_selection_open &&
          occupied < maxSlots;

        return {
          ps_code: ps.ps_code,
          domain: ps.domain,
          sub_domain: ps.sub_domain,
          occupied_count: occupied,
          max_teams: maxSlots,
          status,
          is_available,
        };
      });

    const total_codes = publicItems.length;
    const total_slots = total_codes * (settings.max_teams_per_ps || 2);
    const reserved_slots = publicItems.reduce((acc, p) => acc + p.occupied_count, 0);
    const remaining_slots = Math.max(0, total_slots - reserved_slots);

    return {
      portal_published: settings.portal_published,
      selection_open: settings.selection_open,
      problem_statements: publicItems,
      stats: {
        total_codes,
        total_slots,
        reserved_slots,
        remaining_slots,
      },
    };
  });
}

// ====================================================================
// ATOMIC RESERVATION (STRICT 2-TEAM CAPACITY & 1-PS-PER-TEAM ENFORCEMENT)
// ====================================================================

export interface ReserveInput {
  ps_code: string;
  team_name: string;
  registration_id: string;
  leader_name: string;
  leader_email: string;
  domain: DomainCategory;
}

export interface ReserveResult {
  success: boolean;
  message: string;
  team?: Team;
  selection?: PSSelection;
  ps_code?: string;
  occupied_count?: number;
  status?: string;
}

export async function reserveProblemStatementAtomic(input: ReserveInput): Promise<ReserveResult> {
  return withAtomicLock(async () => {
    const state = readState();
    const settings = state.admin_settings;

    // 1. Verify Portal Status
    if (!settings.portal_published) {
      return {
        success: false,
        message: 'The selection portal is currently unpublished by administrators.',
      };
    }

    if (!settings.selection_open) {
      return {
        success: false,
        message: 'Problem Statement selection is currently closed or paused by administrators.',
      };
    }

    // 2. Validate input fields
    const team_name = (input.team_name || '').trim();
    const registration_id = (input.registration_id || '').trim();
    const leader_name = (input.leader_name || '').trim();
    const leader_email = (input.leader_email || '').trim().toLowerCase();
    const ps_code = (input.ps_code || '').trim().toUpperCase();

    if (!team_name || !registration_id || !leader_name || !leader_email || !ps_code) {
      return {
        success: false,
        message: 'All fields (Team Name, Registration ID, Leader Name, Leader Email, PS Code) are required.',
      };
    }

    // 3. Find problem statement
    const targetPS = state.problem_statements.find((ps) => ps.ps_code === ps_code);
    if (!targetPS) {
      return {
        success: false,
        message: `Invalid PS Code "${ps_code}". Please choose from the official VVCE Ideathon PS codes.`,
      };
    }

    if (!targetPS.is_published) {
      return {
        success: false,
        message: `Problem Statement ${ps_code} is not currently available for selection.`,
      };
    }

    if (!targetPS.is_selection_open) {
      return {
        success: false,
        message: `Selection for Problem Statement ${ps_code} has been paused by administrators.`,
      };
    }

    // 4. Strict One-PS-Per-Team checks (by Team Name, Registration ID, and Leader Email)
    if (settings.one_ps_per_team) {
      const existingTeamByName = state.teams.find(
        (t) => t.team_name.toLowerCase() === team_name.toLowerCase()
      );
      if (existingTeamByName) {
        return {
          success: false,
          message: `Team "${team_name}" has already registered. Each team is strictly limited to ONE Problem Statement.`,
        };
      }

      const existingTeamByReg = state.teams.find(
        (t) => t.registration_id.toLowerCase() === registration_id.toLowerCase()
      );
      if (existingTeamByReg) {
        return {
          success: false,
          message: `Registration ID "${registration_id}" has already been used to select a Problem Statement.`,
        };
      }

      const existingTeamByEmail = state.teams.find(
        (t) => t.leader_email.toLowerCase() === leader_email
      );
      if (existingTeamByEmail) {
        return {
          success: false,
          message: `Team Leader Email "${leader_email}" is already registered under team "${existingTeamByEmail.team_name}".`,
        };
      }
    }

    // 5. Strict Max-Teams-Per-PS check (Strict Limit: 2 Teams)
    const activeSelections = state.ps_selections.filter(
      (s) => s.problem_statement_id === targetPS.id && s.status === 'CONFIRMED'
    );

    const maxLimit = settings.max_teams_per_ps || 2;
    if (activeSelections.length >= maxLimit) {
      return {
        success: false,
        message: `Selection failed: ${ps_code} has already reached maximum capacity (${activeSelections.length}/${maxLimit} teams). Please choose another available code.`,
      };
    }

    // 6. Record Team and Selection
    const now = new Date().toISOString();
    const newTeamId = `team-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;
    const newTeam: Team = {
      id: newTeamId,
      team_name,
      registration_id,
      leader_name,
      leader_email,
      created_at: now,
    };

    const newSelectionId = `sel-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;
    const newSelection: PSSelection = {
      id: newSelectionId,
      team_id: newTeamId,
      problem_statement_id: targetPS.id,
      selected_at: now,
      status: 'CONFIRMED',
    };

    state.teams.push(newTeam);
    state.ps_selections.push(newSelection);
    writeState(state);

    const newCount = activeSelections.length + 1;
    let newStatus = 'AVAILABLE';
    if (newCount >= maxLimit) {
      newStatus = 'FULL';
    } else if (newCount === 1) {
      newStatus = 'ONE SLOT LEFT';
    }

    // Broadcast realtime update to all connected browser tabs & admin dashboard
    notifyChange('selection-created', {
      ps_code,
      occupied_count: newCount,
      status: newStatus,
      team_name,
    });

    return {
      success: true,
      message: `Congratulations! PS Code ${ps_code} has been successfully reserved for team "${team_name}".`,
      team: newTeam,
      selection: newSelection,
      ps_code,
      occupied_count: newCount,
      status: newStatus,
    };
  });
}

// ====================================================================
// ADMIN DATA & MANAGEMENT METHODS
// ====================================================================

export async function getAdminDashboardData(): Promise<{
  stats: DashboardStats;
  problem_statements: (ProblemStatement & {
    occupied_count: number;
    teams: Team[];
    status: AvailabilityStatus;
  })[];
  teams: (Team & {
    ps_code: string;
    domain: DomainCategory;
    sub_domain: SubDomain | null;
    selected_at: string;
    selection_id: string;
  })[];
  selections: SelectionRecordItem[];
  settings: AdminSettings;
}> {
  return withAtomicLock(() => {
    const state = readState();
    const settings = state.admin_settings;
    const activeSelections = state.ps_selections.filter((s) => s.status === 'CONFIRMED');

    // Build PS statements with assigned teams
    const psWithDetails = state.problem_statements.map((ps) => {
      const selectionsForPS = activeSelections.filter((s) => s.problem_statement_id === ps.id);
      const assignedTeams = selectionsForPS
        .map((s) => state.teams.find((t) => t.id === s.team_id))
        .filter((t): t is Team => !!t);

      const count = selectionsForPS.length;
      let status: AvailabilityStatus = 'AVAILABLE';
      if (count >= settings.max_teams_per_ps) {
        status = 'FULL';
      } else if (count === 1) {
        status = 'ONE SLOT LEFT';
      }

      return {
        ...ps,
        occupied_count: count,
        teams: assignedTeams,
        status,
      };
    });

    // Build flat selection records
    const flatSelections: SelectionRecordItem[] = [];
    for (const s of activeSelections) {
      const ps = state.problem_statements.find((p) => p.id === s.problem_statement_id);
      const team = state.teams.find((t) => t.id === s.team_id);
      if (ps && team) {
        flatSelections.push({
          id: s.id,
          ps_code: ps.ps_code,
          domain: ps.domain,
          sub_domain: ps.sub_domain,
          team_id: team.id,
          team_name: team.team_name,
          registration_id: team.registration_id,
          leader_name: team.leader_name,
          leader_email: team.leader_email,
          selected_at: s.selected_at,
          status: s.status,
        });
      }
    }

    // Build teams with selection metadata
    const teamsWithDetails = state.teams.map((team) => {
      const sel = activeSelections.find((s) => s.team_id === team.id);
      const ps = sel ? state.problem_statements.find((p) => p.id === sel.problem_statement_id) : null;

      return {
        ...team,
        ps_code: ps ? ps.ps_code : 'N/A',
        domain: ps ? ps.domain : ('CSE_AIML' as DomainCategory),
        sub_domain: ps ? ps.sub_domain : null,
        selected_at: sel ? sel.selected_at : team.created_at,
        selection_id: sel ? sel.id : '',
      };
    });

    // Domain-wise stats computation
    const getDomainStats = (domain: DomainCategory) => {
      const codes = psWithDetails.filter((p) => p.domain === domain);
      const total = codes.length;
      const selected_teams = codes.reduce((sum, c) => sum + c.occupied_count, 0);
      const available_codes = codes.filter((c) => c.occupied_count === 0).length;
      const full_codes = codes.filter((c) => c.occupied_count >= settings.max_teams_per_ps).length;

      return {
        total,
        selected_teams,
        available_codes,
        full_codes,
      };
    };

    const cseStats = getDomainStats('CSE_AIML');
    const eceStats = getDomainStats('ECE');
    const mechCivilStats = getDomainStats('MECH_CIVIL');

    const total_ps_codes = state.problem_statements.length;
    const total_registered_teams = state.teams.length;
    const total_selections = activeSelections.length;
    const available_ps_codes = psWithDetails.filter((p) => p.occupied_count === 0).length;
    const partially_booked_ps_codes = psWithDetails.filter(
      (p) => p.occupied_count > 0 && p.occupied_count < settings.max_teams_per_ps
    ).length;
    const fully_booked_ps_codes = psWithDetails.filter(
      (p) => p.occupied_count >= settings.max_teams_per_ps
    ).length;

    const stats: DashboardStats = {
      total_ps_codes,
      total_registered_teams,
      total_selections,
      available_ps_codes,
      partially_booked_ps_codes,
      fully_booked_ps_codes,
      domains: {
        CSE_AIML: cseStats,
        ECE: eceStats,
        MECH_CIVIL: mechCivilStats,
      },
    };

    return {
      stats,
      problem_statements: psWithDetails,
      teams: teamsWithDetails,
      selections: flatSelections,
      settings,
    };
  });
}

export async function adminCancelSelection(selectionId: string): Promise<{ success: boolean; message: string }> {
  return withAtomicLock(() => {
    const state = readState();
    const selIndex = state.ps_selections.findIndex((s) => s.id === selectionId);
    if (selIndex === -1) {
      return { success: false, message: 'Selection record not found.' };
    }

    const [removedSelection] = state.ps_selections.splice(selIndex, 1);
    const targetPS = state.problem_statements.find((p) => p.id === removedSelection.problem_statement_id);

    // Also remove or unlink the team so they can re-select or be reassigned
    const teamIndex = state.teams.findIndex((t) => t.id === removedSelection.team_id);
    let teamName = 'Team';
    if (teamIndex !== -1) {
      teamName = state.teams[teamIndex].team_name;
      state.teams.splice(teamIndex, 1);
    }

    writeState(state);
    notifyChange('selection-cancelled', {
      ps_code: targetPS?.ps_code,
      team_name: teamName,
    });

    return {
      success: true,
      message: `Selection for team "${teamName}" on PS Code ${targetPS?.ps_code || ''} has been cancelled. The slot is reopened immediately.`,
    };
  });
}

export async function adminManualAssign(params: {
  ps_code: string;
  team_name: string;
  registration_id: string;
  leader_name: string;
  leader_email: string;
}): Promise<ReserveResult> {
  return withAtomicLock(() => {
    const state = readState();
    const ps = state.problem_statements.find((p) => p.ps_code === params.ps_code.toUpperCase());
    if (!ps) {
      return { success: false, message: `PS Code ${params.ps_code} does not exist.` };
    }

    const currentCount = state.ps_selections.filter(
      (s) => s.problem_statement_id === ps.id && s.status === 'CONFIRMED'
    ).length;

    if (currentCount >= state.admin_settings.max_teams_per_ps) {
      return {
        success: false,
        message: `PS Code ${ps.ps_code} already has ${currentCount}/${state.admin_settings.max_teams_per_ps} teams.`,
      };
    }

    // Check duplicate team name or reg id
    if (state.teams.some((t) => t.team_name.toLowerCase() === params.team_name.trim().toLowerCase())) {
      return { success: false, message: `Team "${params.team_name}" already exists.` };
    }

    if (state.teams.some((t) => t.registration_id.toLowerCase() === params.registration_id.trim().toLowerCase())) {
      return { success: false, message: `Registration ID "${params.registration_id}" already exists.` };
    }

    const now = new Date().toISOString();
    const teamId = `team-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;
    const newTeam: Team = {
      id: teamId,
      team_name: params.team_name.trim(),
      registration_id: params.registration_id.trim(),
      leader_name: params.leader_name.trim(),
      leader_email: params.leader_email.trim().toLowerCase(),
      created_at: now,
    };

    const selId = `sel-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;
    const newSel: PSSelection = {
      id: selId,
      team_id: teamId,
      problem_statement_id: ps.id,
      selected_at: now,
      status: 'CONFIRMED',
    };

    state.teams.push(newTeam);
    state.ps_selections.push(newSel);
    writeState(state);

    notifyChange('selection-assigned', { ps_code: ps.ps_code });

    return {
      success: true,
      message: `Manually assigned team "${newTeam.team_name}" to PS Code ${ps.ps_code}.`,
      team: newTeam,
      selection: newSel,
      ps_code: ps.ps_code,
    };
  });
}

export async function adminUpdatePSCode(params: {
  ps_code: string;
  is_published?: boolean;
  is_selection_open?: boolean;
}): Promise<{ success: boolean; message: string; ps?: ProblemStatement }> {
  return withAtomicLock(() => {
    const state = readState();
    const ps = state.problem_statements.find((p) => p.ps_code === params.ps_code);
    if (!ps) {
      return { success: false, message: 'Problem Statement not found.' };
    }

    if (params.is_published !== undefined) {
      ps.is_published = params.is_published;
    }
    if (params.is_selection_open !== undefined) {
      ps.is_selection_open = params.is_selection_open;
    }
    ps.updated_at = new Date().toISOString();

    writeState(state);
    notifyChange('ps-updated', { ps_code: ps.ps_code });

    return {
      success: true,
      message: `Updated status for PS Code ${ps.ps_code}.`,
      ps,
    };
  });
}

export async function adminUpdateSettings(newSettings: Partial<AdminSettings>): Promise<AdminSettings> {
  return withAtomicLock(() => {
    const state = readState();
    state.admin_settings = {
      ...state.admin_settings,
      ...newSettings,
      updated_at: new Date().toISOString(),
    };
    writeState(state);
    notifyChange('settings-updated', state.admin_settings);
    return state.admin_settings;
  });
}

export async function adminResetAllData(): Promise<{ success: boolean; message: string }> {
  return withAtomicLock(() => {
    const fresh = initializeDefaultState();
    writeState(fresh);
    notifyChange('data-reset', {});
    return {
      success: true,
      message: 'Portal completely reset to initial pristine state with all 30 PS codes available.',
    };
  });
}
