'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  Shield,
  Key,
  Lock,
  Unlock,
  Users,
  FileSpreadsheet,
  Download,
  Trash2,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  ArrowLeft,
  Search,
  Settings,
  Bell,
  Cpu,
  Radio,
  Wrench,
  BarChart3,
  Sliders,
  UserPlus,
  Eye,
  EyeOff,
  LogOut,
  XCircle,
  Clock,
  Mail,
  Hash,
} from 'lucide-react';
import {
  DashboardStats,
  ProblemStatement,
  Team,
  SelectionRecordItem,
  AdminSettings,
  DomainCategory,
} from '@/lib/types';

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [accessCodeInput, setAccessCodeInput] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);

  // Admin Data
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [problemStatements, setProblemStatements] = useState<
    (ProblemStatement & {
      occupied_count: number;
      teams: Team[];
      status: string;
    })[]
  >([]);
  const [teams, setTeams] = useState<
    (Team & {
      ps_code: string;
      domain: DomainCategory;
      selected_at: string;
      selection_id: string;
    })[]
  >([]);
  const [selections, setSelections] = useState<SelectionRecordItem[]>([]);
  const [settings, setSettings] = useState<AdminSettings | null>(null);

  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<
    'overview' | 'ps-management' | 'teams' | 'selections' | 'settings'
  >('overview');

  // Filters & search
  const [teamSearch, setTeamSearch] = useState('');
  const [teamDomainFilter, setTeamDomainFilter] = useState<string>('ALL');
  const [psDomainFilter, setPsDomainFilter] = useState<string>('ALL');

  // Manual Assignment Modal State
  const [manualAssignModal, setManualAssignModal] = useState(false);
  const [manualPSCode, setManualPSCode] = useState('');
  const [manualTeamName, setManualTeamName] = useState('');
  const [manualRegId, setManualRegId] = useState('');
  const [manualLeaderName, setManualLeaderName] = useState('');
  const [manualLeaderEmail, setManualLeaderEmail] = useState('');
  const [manualAssignError, setManualAssignError] = useState<string | null>(null);

  // Notification Banner
  const [toast, setToast] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Fetch admin dashboard data
  const fetchDashboardData = async () => {
    try {
      const res = await fetch('/api/admin', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setStats(data.stats);
        setProblemStatements(data.problem_statements || []);
        setTeams(data.teams || []);
        setSelections(data.selections || []);
        setSettings(data.settings);
        setIsAuthenticated(true);
      } else if (res.status === 401) {
        setIsAuthenticated(false);
      }
    } catch (err) {
      console.error('Error fetching admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();

    // Listen to real-time events
    const eventSource = new EventSource('/api/realtime');
    eventSource.addEventListener('update', () => {
      fetchDashboardData();
    });

    return () => {
      eventSource.close();
    };
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setAuthLoading(true);

    try {
      const res = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'login', accessCode: accessCodeInput }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setIsAuthenticated(true);
        setAccessCodeInput('');
        fetchDashboardData();
        showToast('Organizer access granted. Welcome to the Admin Portal.');
      } else {
        setLoginError(data.message || 'Invalid Organizer Access Code. Access Denied.');
      }
    } catch {
      setLoginError('Authentication service unreachable. Please try again.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/admin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'logout' }),
    });
    setIsAuthenticated(false);
    showToast('Logged out securely.');
  };

  // Admin Actions
  const handleTogglePSToggle = async (
    psCode: string,
    field: 'is_published' | 'is_selection_open',
    currentVal: boolean
  ) => {
    try {
      const res = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update-ps',
          ps_code: psCode,
          [field]: !currentVal,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast(`PS Code ${psCode} ${field === 'is_published' ? 'visibility' : 'selection'} updated.`);
        fetchDashboardData();
      } else {
        showToast(data.message || 'Failed to update PS code.', 'error');
      }
    } catch {
      showToast('Action failed.', 'error');
    }
  };

  const handleCancelSelection = async (selectionId: string, teamName: string, psCode: string) => {
    if (
      !window.confirm(
        `Are you sure you want to cancel the reservation for "${teamName}" on PS Code ${psCode}? The slot will be reopened immediately.`
      )
    ) {
      return;
    }

    try {
      const res = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'cancel-selection',
          selection_id: selectionId,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast(data.message);
        fetchDashboardData();
      } else {
        showToast(data.message || 'Failed to cancel selection.', 'error');
      }
    } catch {
      showToast('Network error while cancelling selection.', 'error');
    }
  };

  const handleToggleSetting = async (field: keyof AdminSettings, currentVal: boolean) => {
    try {
      const res = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update-settings',
          [field]: !currentVal,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSettings(data.settings);
        showToast(`Portal setting "${field}" updated.`);
        fetchDashboardData();
      }
    } catch {
      showToast('Failed to update setting.', 'error');
    }
  };

  const handleManualAssignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setManualAssignError(null);

    try {
      const res = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'manual-assign',
          ps_code: manualPSCode,
          team_name: manualTeamName,
          registration_id: manualRegId,
          leader_name: manualLeaderName,
          leader_email: manualLeaderEmail,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        showToast(data.message);
        setManualAssignModal(false);
        setManualTeamName('');
        setManualRegId('');
        setManualLeaderName('');
        setManualLeaderEmail('');
        fetchDashboardData();
      } else {
        setManualAssignError(data.message || 'Failed to manually assign.');
      }
    } catch {
      setManualAssignError('Network error while assigning.');
    }
  };

  const handleResetAllData = async () => {
    const confirmation = window.prompt(
      'DANGER ZONE: Type "RESET-PORTAL" to wipe all selections and restore all 30 PS codes to 0/2 available.'
    );
    if (confirmation !== 'RESET-PORTAL') {
      alert('Reset cancelled. Incorrect confirmation phrase.');
      return;
    }

    try {
      const res = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reset-all' }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast(data.message);
        fetchDashboardData();
      }
    } catch {
      showToast('Failed to reset portal data.', 'error');
    }
  };

  // Filtered Teams
  const filteredTeams = useMemo(() => {
    return teams.filter((t) => {
      const matchesDomain = teamDomainFilter === 'ALL' || t.domain === teamDomainFilter;
      const q = teamSearch.toLowerCase().trim();
      const matchesSearch = q
        ? t.team_name.toLowerCase().includes(q) ||
          t.registration_id.toLowerCase().includes(q) ||
          t.leader_name.toLowerCase().includes(q) ||
          t.leader_email.toLowerCase().includes(q) ||
          t.ps_code.toLowerCase().includes(q)
        : true;
      return matchesDomain && matchesSearch;
    });
  }, [teams, teamDomainFilter, teamSearch]);

  // Filtered PS Codes
  const filteredPSCodes = useMemo(() => {
    return problemStatements.filter((p) => {
      if (psDomainFilter === 'ALL') return true;
      return p.domain === psDomainFilter;
    });
  }, [problemStatements, psDomainFilter]);

  // If not logged in: Show organizer login
  if (!isAuthenticated && !loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-slate-950">
        <div className="w-full max-w-md p-8 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl relative">
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-blue-600/20 text-blue-400 mx-auto flex items-center justify-center mb-4 border border-blue-500/30">
              <Shield className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight">Admin Portal</h1>
            <p className="text-xs text-slate-400 mt-1">
              VVCE Ideathon 2026 – Organizer Access
            </p>
          </div>

          {loginError && (
            <div className="mb-6 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2.5">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{loginError}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Organizer Access Code
              </label>
              <div className="relative">
                <Key className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  placeholder="Enter 6-digit access code"
                  value={accessCodeInput}
                  onChange={(e) => setAccessCodeInput(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 tracking-wider"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={authLoading}
              className="w-full py-3.5 px-4 rounded-xl font-bold text-sm bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Lock className="w-4 h-4" />
              <span>{authLoading ? 'Verifying...' : 'Authenticate Organizer'}</span>
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-800 text-center">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Return to Public Website</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-950 text-slate-100">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2.5 text-xs font-semibold animate-slide-up ${
            toast.type === 'error'
              ? 'bg-rose-600 text-white'
              : 'bg-emerald-600 text-white'
          }`}
        >
          {toast.type === 'error' ? (
            <XCircle className="w-4 h-4" />
          ) : (
            <CheckCircle2 className="w-4 h-4" />
          )}
          <span>{toast.text}</span>
        </div>
      )}

      {/* Admin Sidebar Navigation */}
      <aside className="w-full md:w-64 bg-slate-900 border-r border-slate-800 flex flex-col">
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-sm tracking-tight text-white">Admin Portal</h2>
              <span className="text-[10px] text-blue-400 font-semibold uppercase">
                VVCE Ideathon 2026
              </span>
            </div>
          </div>
        </div>

        <nav className="p-4 space-y-1.5 flex-1">
          <button
            onClick={() => setActiveTab('overview')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-colors ${
              activeTab === 'overview'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Dashboard Overview</span>
          </button>

          <button
            onClick={() => setActiveTab('ps-management')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-colors ${
              activeTab === 'ps-management'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Cpu className="w-4 h-4" />
            <span>PS Code Management</span>
          </button>

          <button
            onClick={() => setActiveTab('teams')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-colors ${
              activeTab === 'teams'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Team Management</span>
            <span className="ml-auto px-2 py-0.5 rounded-full text-[10px] bg-slate-800 text-slate-300">
              {teams.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('selections')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-colors ${
              activeTab === 'selections'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>Selection Records</span>
            <span className="ml-auto px-2 py-0.5 rounded-full text-[10px] bg-slate-800 text-slate-300">
              {selections.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-colors ${
              activeTab === 'settings'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>Portal Controls</span>
          </button>
        </nav>

        {/* Bottom controls */}
        <div className="p-4 border-t border-slate-800 space-y-2">
          <Link
            href="/"
            className="w-full flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Public Website</span>
          </Link>

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Organizer Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-y-auto">
        {/* Top bar */}
        <header className="h-16 border-b border-slate-800 bg-slate-900/40 px-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h2 className="font-bold text-lg text-white">
              {activeTab === 'overview' && 'Dashboard Overview & Statistics'}
              {activeTab === 'ps-management' && 'Problem Statement Management (All 30 Predefined Codes)'}
              {activeTab === 'teams' && 'Registered Teams'}
              {activeTab === 'selections' && 'Problem Statement Selections'}
              {activeTab === 'settings' && 'Portal Controls & Configuration'}
            </h2>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchDashboardData}
              title="Refresh Data"
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </header>

        <div className="p-6 flex-1 space-y-6">
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && stats && (
            <div className="space-y-6">
              {/* Primary Metric Cards */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    Total PS Codes
                  </span>
                  <div className="text-2xl font-black text-white mt-1">
                    {stats.total_ps_codes}
                  </div>
                  <span className="text-[10px] text-slate-400">Exact 30 Initialized</span>
                </div>

                <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    Registered Teams
                  </span>
                  <div className="text-2xl font-black text-blue-400 mt-1">
                    {stats.total_registered_teams}
                  </div>
                  <span className="text-[10px] text-slate-400">Unique Team IDs</span>
                </div>

                <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    Successful Selections
                  </span>
                  <div className="text-2xl font-black text-emerald-400 mt-1">
                    {stats.total_selections}
                  </div>
                  <span className="text-[10px] text-slate-400">Out of 60 Max Slots</span>
                </div>

                <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    Available Codes
                  </span>
                  <div className="text-2xl font-black text-emerald-400 mt-1">
                    {stats.available_ps_codes}
                  </div>
                  <span className="text-[10px] text-emerald-400/80">0 of 2 Filled</span>
                </div>

                <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    Partially Booked
                  </span>
                  <div className="text-2xl font-black text-amber-400 mt-1">
                    {stats.partially_booked_ps_codes}
                  </div>
                  <span className="text-[10px] text-amber-400/80">1 of 2 Filled</span>
                </div>

                <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    Fully Booked
                  </span>
                  <div className="text-2xl font-black text-rose-400 mt-1">
                    {stats.fully_booked_ps_codes}
                  </div>
                  <span className="text-[10px] text-rose-400/80">2 of 2 Full</span>
                </div>
              </div>

              {/* Domain-wise Statistics (Section 7) */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Domain 1: CSE / AIML */}
                <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
                        <Cpu className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-white text-sm">CSE / AIML</h4>
                        <span className="text-[11px] text-slate-400">CS-01 to CS-15</span>
                      </div>
                    </div>
                    <span className="text-xs font-bold font-mono px-2 py-0.5 rounded bg-slate-800 text-blue-300">
                      15 Codes
                    </span>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between text-slate-300">
                      <span>Selected Teams:</span>
                      <span className="font-bold text-white">
                        {stats.domains.CSE_AIML.selected_teams} / 30 Slots
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-300">
                      <span>Available Codes (0/2):</span>
                      <span className="font-semibold text-emerald-400">
                        {stats.domains.CSE_AIML.available_codes}
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-300">
                      <span>Full Codes (2/2):</span>
                      <span className="font-semibold text-rose-400">
                        {stats.domains.CSE_AIML.full_codes}
                      </span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-blue-500 h-full rounded-full transition-all"
                      style={{
                        width: `${(stats.domains.CSE_AIML.selected_teams / 30) * 100}%`,
                      }}
                    />
                  </div>
                </div>

                {/* Domain 2: ECE */}
                <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                        <Radio className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-white text-sm">Electronics & Comm</h4>
                        <span className="text-[11px] text-slate-400">EC-01 to EC-10</span>
                      </div>
                    </div>
                    <span className="text-xs font-bold font-mono px-2 py-0.5 rounded bg-slate-800 text-indigo-300">
                      10 Codes
                    </span>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between text-slate-300">
                      <span>Selected Teams:</span>
                      <span className="font-bold text-white">
                        {stats.domains.ECE.selected_teams} / 20 Slots
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-300">
                      <span>Available Codes (0/2):</span>
                      <span className="font-semibold text-emerald-400">
                        {stats.domains.ECE.available_codes}
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-300">
                      <span>Full Codes (2/2):</span>
                      <span className="font-semibold text-rose-400">
                        {stats.domains.ECE.full_codes}
                      </span>
                    </div>
                  </div>

                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-indigo-500 h-full rounded-full transition-all"
                      style={{
                        width: `${(stats.domains.ECE.selected_teams / 20) * 100}%`,
                      }}
                    />
                  </div>
                </div>

                {/* Domain 3: Mechanical and Civil */}
                <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                        <Wrench className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-white text-sm">Mechanical & Civil</h4>
                        <span className="text-[11px] text-slate-400">ME (3) + CE (2)</span>
                      </div>
                    </div>
                    <span className="text-xs font-bold font-mono px-2 py-0.5 rounded bg-slate-800 text-amber-300">
                      5 Codes
                    </span>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between text-slate-300">
                      <span>Selected Teams:</span>
                      <span className="font-bold text-white">
                        {stats.domains.MECH_CIVIL.selected_teams} / 10 Slots
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-300">
                      <span>Available Codes (0/2):</span>
                      <span className="font-semibold text-emerald-400">
                        {stats.domains.MECH_CIVIL.available_codes}
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-300">
                      <span>Full Codes (2/2):</span>
                      <span className="font-semibold text-rose-400">
                        {stats.domains.MECH_CIVIL.full_codes}
                      </span>
                    </div>
                  </div>

                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-amber-500 h-full rounded-full transition-all"
                      style={{
                        width: `${(stats.domains.MECH_CIVIL.selected_teams / 10) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: PS CODE MANAGEMENT (Section 8) */}
          {activeTab === 'ps-management' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-slate-900 border border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-300">Filter by Domain:</span>
                  <select
                    value={psDomainFilter}
                    onChange={(e) => setPsDomainFilter(e.target.value)}
                    className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white"
                  >
                    <option value="ALL">All Domains (30 Codes)</option>
                    <option value="CSE_AIML">CSE / AIML (15 Codes)</option>
                    <option value="ECE">ECE (10 Codes)</option>
                    <option value="MECH_CIVIL">Mechanical & Civil (5 Codes)</option>
                  </select>
                </div>

                <div className="text-xs text-slate-400">
                  Showing {filteredPSCodes.length} of {problemStatements.length} predefined PS codes
                </div>
              </div>

              {/* PS Code Table */}
              <div className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider border-b border-slate-800">
                      <tr>
                        <th className="py-3 px-4">PS Code</th>
                        <th className="py-3 px-4">Domain</th>
                        <th className="py-3 px-4">Sub Domain</th>
                        <th className="py-3 px-4">Occupancy</th>
                        <th className="py-3 px-4">Assigned Teams</th>
                        <th className="py-3 px-4">Visibility</th>
                        <th className="py-3 px-4">Selection</th>
                        <th className="py-3 px-4">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 text-slate-200">
                      {filteredPSCodes.map((ps) => (
                        <tr key={ps.id} className="hover:bg-slate-800/40 transition-colors">
                          <td className="py-3 px-4 font-mono font-bold text-sm text-blue-400">
                            {ps.ps_code}
                          </td>
                          <td className="py-3 px-4">{ps.domain}</td>
                          <td className="py-3 px-4">{ps.sub_domain || '—'}</td>
                          <td className="py-3 px-4">
                            <span
                              className={`px-2 py-0.5 rounded font-mono font-semibold ${
                                ps.occupied_count >= 2
                                  ? 'bg-rose-500/10 text-rose-400'
                                  : ps.occupied_count === 1
                                  ? 'bg-amber-500/10 text-amber-300'
                                  : 'bg-emerald-500/10 text-emerald-400'
                              }`}
                            >
                              {ps.occupied_count} / 2
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            {ps.teams.length > 0 ? (
                              <div className="space-y-1">
                                {ps.teams.map((t, idx) => (
                                  <div key={idx} className="font-semibold text-white">
                                    • {t.team_name} ({t.registration_id})
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <span className="text-slate-400 italic">No teams assigned</span>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            <button
                              onClick={() =>
                                handleTogglePSToggle(ps.ps_code, 'is_published', ps.is_published)
                              }
                              className={`px-2.5 py-1 rounded text-[11px] font-semibold flex items-center gap-1 ${
                                ps.is_published
                                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                  : 'bg-slate-800 text-slate-400 border border-slate-700'
                              }`}
                            >
                              {ps.is_published ? 'Published' : 'Hidden'}
                            </button>
                          </td>
                          <td className="py-3 px-4">
                            <button
                              onClick={() =>
                                handleTogglePSToggle(
                                  ps.ps_code,
                                  'is_selection_open',
                                  ps.is_selection_open
                                )
                              }
                              className={`px-2.5 py-1 rounded text-[11px] font-semibold flex items-center gap-1 ${
                                ps.is_selection_open
                                  ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                                  : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                              }`}
                            >
                              {ps.is_selection_open ? 'Open' : 'Paused'}
                            </button>
                          </td>
                          <td className="py-3 px-4">
                            {ps.occupied_count < 2 && (
                              <button
                                onClick={() => {
                                  setManualPSCode(ps.ps_code);
                                  setManualAssignModal(true);
                                }}
                                className="px-2.5 py-1 rounded bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 font-semibold text-[11px] border border-indigo-500/30 flex items-center gap-1"
                              >
                                <UserPlus className="w-3 h-3" />
                                <span>Assign</span>
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: TEAM MANAGEMENT (Section 9) */}
          {activeTab === 'teams' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-slate-900 border border-slate-800">
                <div className="flex flex-wrap items-center gap-3 flex-1">
                  <div className="relative flex-1 max-w-xs">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Search team, reg ID, leader..."
                      value={teamSearch}
                      onChange={(e) => setTeamSearch(e.target.value)}
                      className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-500"
                    />
                  </div>

                  <select
                    value={teamDomainFilter}
                    onChange={(e) => setTeamDomainFilter(e.target.value)}
                    className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white"
                  >
                    <option value="ALL">All Domains</option>
                    <option value="CSE_AIML">CSE / AIML</option>
                    <option value="ECE">ECE</option>
                    <option value="MECH_CIVIL">Mech & Civil</option>
                  </select>
                </div>

                {/* CSV & Excel Exports (Prompt Section 9) */}
                <div className="flex items-center gap-2">
                  <a
                    href="/api/export?format=csv"
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 border border-slate-700 transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Export CSV</span>
                  </a>

                  <a
                    href="/api/export?format=excel"
                    className="px-3 py-1.5 rounded-lg bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-300 text-xs font-semibold flex items-center gap-1.5 border border-emerald-500/30 transition-colors"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5" />
                    <span>Export Excel</span>
                  </a>
                </div>
              </div>

              {/* Team Table */}
              <div className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider border-b border-slate-800">
                      <tr>
                        <th className="py-3 px-4">Team Name</th>
                        <th className="py-3 px-4">Registration ID</th>
                        <th className="py-3 px-4">Leader Name</th>
                        <th className="py-3 px-4">Leader Email</th>
                        <th className="py-3 px-4">Domain</th>
                        <th className="py-3 px-4">PS Code</th>
                        <th className="py-3 px-4">Timestamp</th>
                        <th className="py-3 px-4">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 text-slate-200">
                      {filteredTeams.length > 0 ? (
                        filteredTeams.map((t) => (
                          <tr key={t.id} className="hover:bg-slate-800/40 transition-colors">
                            <td className="py-3 px-4 font-bold text-white">{t.team_name}</td>
                            <td className="py-3 px-4 font-mono font-semibold text-blue-300">
                              {t.registration_id}
                            </td>
                            <td className="py-3 px-4">{t.leader_name}</td>
                            <td className="py-3 px-4 font-mono text-slate-300">{t.leader_email}</td>
                            <td className="py-3 px-4">{t.domain}</td>
                            <td className="py-3 px-4 font-mono font-bold text-blue-400">
                              {t.ps_code}
                            </td>
                            <td className="py-3 px-4 font-mono text-slate-400">
                              {new Date(t.selected_at).toLocaleTimeString('en-IN', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </td>
                            <td className="py-3 px-4">
                              <button
                                onClick={() =>
                                  handleCancelSelection(t.selection_id, t.team_name, t.ps_code)
                                }
                                className="px-2 py-1 rounded bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-[11px] font-semibold border border-rose-500/20 flex items-center gap-1"
                              >
                                <Trash2 className="w-3 h-3" />
                                <span>Cancel</span>
                              </button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={8} className="py-8 text-center text-slate-400 italic">
                            No registered teams found.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: SELECTION MANAGEMENT (Section 10) */}
          {activeTab === 'selections' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-900 border border-slate-800">
                <div>
                  <h3 className="font-bold text-white text-sm">Problem Statement Selections</h3>
                  <p className="text-xs text-slate-400">
                    Active allocations. Admin can cancel a team selection to reopen slots or manually assign teams.
                  </p>
                </div>

                <button
                  onClick={() => {
                    setManualPSCode('CS-01');
                    setManualAssignModal(true);
                  }}
                  className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs flex items-center gap-2 shadow-md shadow-blue-500/20"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Manual Assign Team</span>
                </button>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider border-b border-slate-800">
                      <tr>
                        <th className="py-3 px-4">PS Code</th>
                        <th className="py-3 px-4">Domain</th>
                        <th className="py-3 px-4">Team Name</th>
                        <th className="py-3 px-4">Registration ID</th>
                        <th className="py-3 px-4">Leader Name</th>
                        <th className="py-3 px-4">Leader Email</th>
                        <th className="py-3 px-4">Timestamp</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 text-slate-200">
                      {selections.length > 0 ? (
                        selections.map((s) => (
                          <tr key={s.id} className="hover:bg-slate-800/40 transition-colors">
                            <td className="py-3 px-4 font-mono font-bold text-blue-400 text-sm">
                              {s.ps_code}
                            </td>
                            <td className="py-3 px-4">{s.domain}</td>
                            <td className="py-3 px-4 font-bold text-white">{s.team_name}</td>
                            <td className="py-3 px-4 font-mono text-blue-300">
                              {s.registration_id}
                            </td>
                            <td className="py-3 px-4">{s.leader_name}</td>
                            <td className="py-3 px-4 font-mono text-slate-300">{s.leader_email}</td>
                            <td className="py-3 px-4 font-mono text-slate-400">
                              {new Date(s.selected_at).toLocaleString('en-IN', {
                                timeZone: 'Asia/Kolkata',
                              })}
                            </td>
                            <td className="py-3 px-4">
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                {s.status}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <button
                                onClick={() => handleCancelSelection(s.id, s.team_name, s.ps_code)}
                                className="px-2.5 py-1 rounded bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-[11px] font-semibold border border-rose-500/20 flex items-center gap-1"
                              >
                                <Trash2 className="w-3 h-3" />
                                <span>Cancel Slot</span>
                              </button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={9} className="py-8 text-center text-slate-400 italic">
                            No confirmed selections yet.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: PORTAL CONTROLS & SETTINGS (Section 11) */}
          {activeTab === 'settings' && settings && (
            <div className="space-y-6 max-w-4xl">
              {/* Global Controls */}
              <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-6">
                <div>
                  <h3 className="font-bold text-base text-white">Global Portal Controls</h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Toggle portal availability and submission acceptance in real-time.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Publish Portal */}
                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-white text-sm block">
                        Publish Entire Portal
                      </span>
                      <span className="text-xs text-slate-400">
                        {settings.portal_published
                          ? 'Portal is currently LIVE and visible'
                          : 'Portal is currently UNPUBLISHED'}
                      </span>
                    </div>
                    <button
                      onClick={() =>
                        handleToggleSetting('portal_published', settings.portal_published)
                      }
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                        settings.portal_published
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {settings.portal_published ? 'Published' : 'Unpublished'}
                    </button>
                  </div>

                  {/* Selection Open / Closed */}
                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-white text-sm block">
                        Problem Statement Selection
                      </span>
                      <span className="text-xs text-slate-400">
                        {settings.selection_open
                          ? 'Accepting team reservations'
                          : 'Reservations are PAUSED'}
                      </span>
                    </div>
                    <button
                      onClick={() =>
                        handleToggleSetting('selection_open', settings.selection_open)
                      }
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                        settings.selection_open
                          ? 'bg-blue-600 text-white'
                          : 'bg-rose-600 text-white'
                      }`}
                    >
                      {settings.selection_open ? 'Selection Open' : 'Selection Closed'}
                    </button>
                  </div>
                </div>

                {/* Rules Display */}
                <div className="pt-4 border-t border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                    <span className="text-slate-400 block mb-1">Max Teams Per PS Code:</span>
                    <span className="font-bold font-mono text-amber-400 text-base">
                      {settings.max_teams_per_ps} Teams (Hardcoded strict limit)
                    </span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                    <span className="text-slate-400 block mb-1">One PS Per Team:</span>
                    <span className="font-bold font-mono text-emerald-400 text-base">
                      {settings.one_ps_per_team ? 'Enabled (Strict)' : 'Disabled'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Danger Zone: Reset Portal Data */}
              <div className="p-6 rounded-2xl bg-rose-500/5 border border-rose-500/20 space-y-4">
                <div>
                  <h4 className="font-bold text-base text-rose-400">Danger Zone</h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Wipes all team registrations and selections. Reverts all 30 PS codes to 0/2 available.
                  </p>
                </div>

                <button
                  onClick={handleResetAllData}
                  className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-rose-600/20"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Reset All Selections & Restore Initial State</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Manual Assignment Modal */}
      {manualAssignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-lg bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden p-6">
            <h3 className="text-lg font-bold text-white mb-1">Manual Team Assignment</h3>
            <p className="text-xs text-slate-400 mb-4">
              Manually assign an authorized team to an available Problem Statement slot.
            </p>

            {manualAssignError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
                {manualAssignError}
              </div>
            )}

            <form onSubmit={handleManualAssignSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Select PS Code
                </label>
                <select
                  value={manualPSCode}
                  onChange={(e) => setManualPSCode(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs font-mono font-bold"
                >
                  {problemStatements
                    .filter((p) => p.occupied_count < 2)
                    .map((p) => (
                      <option key={p.ps_code} value={p.ps_code}>
                        {p.ps_code} ({p.domain}) – {p.occupied_count}/2 filled
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Team Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Phoenix"
                  value={manualTeamName}
                  onChange={(e) => setManualTeamName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Registration ID
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. VVCE-REG-501"
                  value={manualRegId}
                  onChange={(e) => setManualRegId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Leader Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Leader Full Name"
                    value={manualLeaderName}
                    onChange={(e) => setManualLeaderName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Leader Email
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="leader@vvce.ac.in"
                    value={manualLeaderEmail}
                    onChange={(e) => setManualLeaderEmail(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setManualAssignModal(false)}
                  className="py-2.5 px-4 rounded-xl border border-slate-700 bg-slate-800 text-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md shadow-blue-500/20"
                >
                  Confirm Manual Assignment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

