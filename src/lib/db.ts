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
  TeamPublicProfile,
  DomainCategory,
  SubDomain,
  AvailabilityStatus,
} from './types';
import { INITIAL_PROBLEM_STATEMENTS } from './constants';
import { hashPassword, verifyPassword } from './auth';
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

// Generate pre-seeded sample teams with secure hashed passwords
function generateInitialTeams(): Team[] {
  const now = new Date().toISOString();
  const defaultHash = hashPassword('vvce@2026');

  return [
    // CSE / AIML
    {
      id: 'team-cs-101',
      team_id: 'TEAM-101',
      team_name: 'Neural Knights',
      password_hash: defaultHash,
      domain: 'CSE_AIML',
      leader_name: 'Rahul Sharma',
      leader_email: 'rahul.cs101@vvce.ac.in',
      created_at: now,
    },
    {
      id: 'team-cs-102',
      team_id: 'TEAM-102',
      team_name: 'CyberPulse',
      password_hash: defaultHash,
      domain: 'CSE_AIML',
      leader_name: 'Ananya Rao',
      leader_email: 'ananya.cs102@vvce.ac.in',
      created_at: now,
    },
    {
      id: 'team-cs-103',
      team_id: 'TEAM-103',
      team_name: 'DataCrafters',
      password_hash: defaultHash,
      domain: 'CSE_AIML',
      leader_name: 'Pooja Hegde',
      leader_email: 'pooja.cs103@vvce.ac.in',
      created_at: now,
    },
    {
      id: 'team-cs-104',
      team_id: 'TEAM-104',
      team_name: 'AlgoRhythms',
      password_hash: defaultHash,
      domain: 'CSE_AIML',
      leader_name: 'Kiran Kumar',
      leader_email: 'kiran.cs104@vvce.ac.in',
      created_at: now,
    },
    {
      id: 'team-cs-105',
      team_id: 'TEAM-105',
      team_name: 'CodeMatrix',
      password_hash: defaultHash,
      domain: 'CSE_AIML',
      leader_name: 'Deepak M',
      leader_email: 'deepak.cs105@vvce.ac.in',
      created_at: now,
    },

    // ECE
    {
      id: 'team-ec-201',
      team_id: 'TEAM-201',
      team_name: 'Silicon Spark',
      password_hash: defaultHash,
      domain: 'ECE',
      leader_name: 'Manish Gowda',
      leader_email: 'manish.ec201@vvce.ac.in',
      created_at: now,
    },
    {
      id: 'team-ec-202',
      team_id: 'TEAM-202',
      team_name: 'WaveRiders',
      password_hash: defaultHash,
      domain: 'ECE',
      leader_name: 'Suhas K',
      leader_email: 'suhas.ec202@vvce.ac.in',
      created_at: now,
    },
    {
      id: 'team-ec-203',
      team_id: 'TEAM-203',
      team_name: 'IoT Mavericks',
      password_hash: defaultHash,
      domain: 'ECE',
      leader_name: 'Meghana R',
      leader_email: 'meghana.ec203@vvce.ac.in',
      created_at: now,
    },

    // Mech & Civil
    {
      id: 'team-mc-301',
      team_id: 'TEAM-301',
      team_name: 'Titan Dynamics',
      password_hash: defaultHash,
      domain: 'MECH_CIVIL',
      leader_name: 'Nikhil Patil',
      leader_email: 'nikhil.mc301@vvce.ac.in',
      created_at: now,
    },
    {
      id: 'team-mc-302',
      team_id: 'TEAM-302',
      team_name: 'TerraStructures',
      password_hash: defaultHash,
      domain: 'MECH_CIVIL',
      leader_name: 'Bhavana S',
      leader_email: 'bhavana.mc302@vvce.ac.in',
      created_at: now,
    },
  ];
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
    teams: generateInitialTeams(),
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

    if (!parsed.problem_statements || parsed.problem_statements.length === 0) {
      const fresh = initializeDefaultState();
      fs.writeFileSync(DATA_FILE, JSON.stringify(fresh, null, 2), 'utf-8');
      return fresh;
    }

    // Ensure teams array exists
    if (!parsed.teams) {
      parsed.teams = generateInitialTeams();
      writeState(parsed);
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
// TEAM AUTHENTICATION METHODS
// ====================================================================

export async function authenticateTeam(teamIdInput: string, passwordInput: string): Promise<{
  success: boolean;
  message: string;
  team?: Team;
}> {
  return withAtomicLock(() => {
    const state = readState();
    const cleanId = (teamIdInput || '').trim().toUpperCase();
    const cleanPass = (passwordInput || '').trim();

    if (!cleanId || !cleanPass) {
      return { success: false, message: 'Team ID and Password are required.' };
    }

    const team = state.teams.find((t) => t.team_id.toUpperCase() === cleanId);
    if (!team) {
      return { success: false, message: 'Invalid Team ID or credentials. Contact event organizers.' };
    }

    if (!verifyPassword(cleanPass, team.password_hash)) {
      return { success: false, message: 'Invalid Team ID or credentials. Access denied.' };
    }

    return {
      success: true,
      message: 'Authentication successful.',
      team,
    };
  });
}

export async function getTeamProfile(teamId: string): Promise<TeamPublicProfile | null> {
  return withAtomicLock(() => {
    const state = readState();
    const team = state.teams.find((t) => t.id === teamId || t.team_id.toUpperCase() === teamId.toUpperCase());
    if (!team) return null;

    const selection = state.ps_selections.find(
      (s) => s.team_id === team.id && s.status === 'CONFIRMED'
    );

    let selData = null;
    if (selection) {
      const ps = state.problem_statements.find((p) => p.id === selection.problem_statement_id);
      if (ps) {
        selData = {
          id: selection.id,
          ps_code: ps.ps_code,
          domain: ps.domain,
          sub_domain: ps.sub_domain,
          selected_at: selection.selected_at,
        };
      }
    }

    return {
      id: team.id,
      team_id: team.team_id,
      team_name: team.team_name,
      domain: team.domain,
      leader_name: team.leader_name,
      leader_email: team.leader_email,
      selection: selData,
    };
  });
}

// ====================================================================
// PUBLIC PS CODES VIEW (STRICT PRIVACY - DISPLAY ONLY PS CODES)
// ====================================================================

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

export interface TeamReservationInput {
  team_id: string; // Authenticated team's internal ID
  ps_code: string;
}

export interface ReserveResult {
  success: boolean;
  message: string;
  ps_code?: string;
  selection_id?: string;
  selected_at?: string;
  occupied_count?: number;
  status?: string;
}

export async function reserveProblemStatementAtomic(
  input: TeamReservationInput
): Promise<ReserveResult> {
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
        message: 'Problem statement selection is currently closed or paused by administrators.',
      };
    }

    // 2. Verify Authenticated Team
    const team = state.teams.find((t) => t.id === input.team_id || t.team_id === input.team_id);
    if (!team) {
      return {
        success: false,
        message: 'Invalid team authentication. Please sign in again.',
      };
    }

    // 3. Strict Check: Team already selected a PS
    const existingSelection = state.ps_selections.find(
      (s) => s.team_id === team.id && s.status === 'CONFIRMED'
    );
    if (existingSelection) {
      const existingPS = state.problem_statements.find(
        (p) => p.id === existingSelection.problem_statement_id
      );
      return {
        success: false,
        message: `Your team "${team.team_name}" has already reserved PS Code ${existingPS?.ps_code || ''}. Each team can select only ONE problem statement.`,
      };
    }

    // 4. Find target Problem Statement
    const ps_code = (input.ps_code || '').trim().toUpperCase();
    const targetPS = state.problem_statements.find((ps) => ps.ps_code === ps_code);
    if (!targetPS) {
      return {
        success: false,
        message: `Invalid PS Code "${ps_code}". Please select from the official VVCE Ideathon PS codes.`,
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

    // 5. Strict Max-Teams-Per-PS check (Strict Limit: 2 Teams)
    const activeSelectionsForPS = state.ps_selections.filter(
      (s) => s.problem_statement_id === targetPS.id && s.status === 'CONFIRMED'
    );

    const maxLimit = settings.max_teams_per_ps || 2;
    if (activeSelectionsForPS.length >= maxLimit) {
      return {
        success: false,
        message: `This PS has just been filled (${activeSelectionsForPS.length}/${maxLimit} teams). Please select another available code.`,
      };
    }

    // 6. Record Selection atomically
    const now = new Date().toISOString();
    const newSelectionId = `sel-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;
    const newSelection: PSSelection = {
      id: newSelectionId,
      team_id: team.id,
      problem_statement_id: targetPS.id,
      selected_at: now,
      status: 'CONFIRMED',
    };

    state.ps_selections.push(newSelection);
    writeState(state);

    const newCount = activeSelectionsForPS.length + 1;
    let newStatus = 'AVAILABLE';
    if (newCount >= maxLimit) {
      newStatus = 'FULL';
    } else if (newCount === 1) {
      newStatus = 'ONE SLOT LEFT';
    }

    // Broadcast realtime event
    notifyChange('selection-created', {
      ps_code,
      occupied_count: newCount,
      status: newStatus,
      team_name: team.team_name,
      team_id: team.team_id,
    });

    return {
      success: true,
      message: `Congratulations! PS Code ${ps_code} has been successfully reserved for team "${team.team_name}".`,
      ps_code,
      selection_id: newSelectionId,
      selected_at: now,
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
          team_code: team.team_id,
          team_name: team.team_name,
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
    const team = state.teams.find((t) => t.id === removedSelection.team_id);

    writeState(state);
    notifyChange('selection-cancelled', {
      ps_code: targetPS?.ps_code,
      team_name: team?.team_name,
    });

    return {
      success: true,
      message: `Selection for team "${team?.team_name || ''}" on PS Code ${targetPS?.ps_code || ''} has been cancelled. The slot is reopened immediately.`,
    };
  });
}

export async function adminCreateTeam(params: {
  team_id: string;
  team_name: string;
  password: string;
  domain: DomainCategory;
  leader_name?: string;
  leader_email?: string;
}): Promise<{ success: boolean; message: string; team?: Team }> {
  return withAtomicLock(() => {
    const state = readState();
    const cleanId = params.team_id.trim().toUpperCase();
    const cleanName = params.team_name.trim();

    if (!cleanId || !cleanName || !params.password) {
      return { success: false, message: 'Team ID, Team Name, and Password are required.' };
    }

    if (state.teams.some((t) => t.team_id.toUpperCase() === cleanId)) {
      return { success: false, message: `Team ID "${cleanId}" already exists.` };
    }

    if (state.teams.some((t) => t.team_name.toLowerCase() === cleanName.toLowerCase())) {
      return { success: false, message: `Team Name "${cleanName}" already exists.` };
    }

    const newTeam: Team = {
      id: `team-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`,
      team_id: cleanId,
      team_name: cleanName,
      password_hash: hashPassword(params.password),
      domain: params.domain,
      leader_name: params.leader_name?.trim() || 'Team Leader',
      leader_email: params.leader_email?.trim().toLowerCase() || `${cleanId.toLowerCase()}@vvce.ac.in`,
      created_at: new Date().toISOString(),
    };

    state.teams.push(newTeam);
    writeState(state);
    notifyChange('team-created', { team_id: newTeam.team_id });

    return {
      success: true,
      message: `Team account "${newTeam.team_id}" (${newTeam.team_name}) created successfully.`,
      team: newTeam,
    };
  });
}

export async function adminSeedTeams(): Promise<{ success: boolean; message: string; count: number }> {
  return withAtomicLock(() => {
    const state = readState();
    const fresh = generateInitialTeams();
    let added = 0;

    for (const t of fresh) {
      if (!state.teams.some((existing) => existing.team_id.toUpperCase() === t.team_id.toUpperCase())) {
        state.teams.push(t);
        added++;
      }
    }

    writeState(state);
    return {
      success: true,
      message: `Added ${added} initial team accounts.`,
      count: state.teams.length,
    };
  });
}

export async function adminManualAssign(params: {
  team_id: string; // login ID or internal ID
  ps_code: string;
}): Promise<ReserveResult> {
  return withAtomicLock(() => {
    const state = readState();
    const ps = state.problem_statements.find((p) => p.ps_code === params.ps_code.toUpperCase());
    if (!ps) {
      return { success: false, message: `PS Code ${params.ps_code} does not exist.` };
    }

    const team = state.teams.find(
      (t) => t.team_id.toUpperCase() === params.team_id.toUpperCase() || t.id === params.team_id
    );
    if (!team) {
      return { success: false, message: `Team "${params.team_id}" does not exist.` };
    }

    // Check if team already has a confirmed selection
    if (state.ps_selections.some((s) => s.team_id === team.id && s.status === 'CONFIRMED')) {
      return { success: false, message: `Team "${team.team_name}" already has an active PS selection.` };
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

    const now = new Date().toISOString();
    const selId = `sel-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;
    const newSel: PSSelection = {
      id: selId,
      team_id: team.id,
      problem_statement_id: ps.id,
      selected_at: now,
      status: 'CONFIRMED',
    };

    state.ps_selections.push(newSel);
    writeState(state);

    notifyChange('selection-assigned', { ps_code: ps.ps_code, team_id: team.team_id });

    return {
      success: true,
      message: `Manually assigned team "${team.team_name}" to PS Code ${ps.ps_code}.`,
      ps_code: ps.ps_code,
      selection_id: selId,
      selected_at: now,
      occupied_count: currentCount + 1,
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
