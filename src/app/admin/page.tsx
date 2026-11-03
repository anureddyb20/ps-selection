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
  LogOut,
  XCircle,
  Clock,
  Mail,
  Hash,
  Sparkles,
  Layers,
  KeyRound,
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
      selected_at: string;
      selection_id: string;
    })[]
  >([]);
  const [selections, setSelections] = useState<SelectionRecordItem[]>([]);
  const [settings, setSettings] = useState<AdminSettings | null>(null);

  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<
    'overview' | 'ps-management' | 'selections' | 'settings'
  >('overview');

  // Filters & search
  const [psDomainFilter, setPsDomainFilter] = useState<string>('ALL');

  // Manual Assign Modal
  const [manualAssignModal, setManualAssignModal] = useState(false);
  const [manualPSCode, setManualPSCode] = useState('');
  const [manualTeamId, setManualTeamId] = useState('');
  const [manualAssignError, setManualAssignError] = useState<string | null>(null);

  // Custom UI Modals (Zero native browser popups)
  const [cancelModalItem, setCancelModalItem] = useState<{
    selectionId: string;
    teamCode: string;
    psCode: string;
  } | null>(null);
  const [cancelLoading, setCancelLoading] = useState(false);

  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [resetInputPhrase, setResetInputPhrase] = useState('');
  const [resetModalLoading, setResetModalLoading] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);

  // Notification Toast
  const [toast, setToast] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 4000);
  };

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
    if (!isAuthenticated) return;

    fetchDashboardData();

    const eventSource = new EventSource('/api/realtime');
    eventSource.addEventListener('update', () => {
      fetchDashboardData();
    });

    return () => {
      eventSource.close();
    };
  }, [isAuthenticated]);

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
        showToast('Organizer access granted. Welcome to Command Desk.');
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
      }
    } catch {
      showToast('Action failed.', 'error');
    }
  };

  const handleCancelSelection = (selectionId: string, teamCode: string, psCode: string) => {
    setCancelModalItem({ selectionId, teamCode, psCode });
  };

  const executeCancelSelection = async () => {
    if (!cancelModalItem) return;
    setCancelLoading(true);

    try {
      const res = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'cancel-selection',
          selection_id: cancelModalItem.selectionId,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast(data.message || `Slot cancelled for Team ${cancelModalItem.teamCode}.`);
        setCancelModalItem(null);
        fetchDashboardData();
      } else {
        showToast(data.message || 'Failed to cancel slot.', 'error');
      }
    } catch {
      showToast('Network error while cancelling selection.', 'error');
    } finally {
      setCancelLoading(false);
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
          team_id: manualTeamId,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        showToast(data.message);
        setManualAssignModal(false);
        setManualTeamId('');
        fetchDashboardData();
      } else {
        setManualAssignError(data.message || 'Failed to assign team.');
      }
    } catch {
      setManualAssignError('Network error while assigning.');
    }
  };

  const handleOpenResetModal = () => {
    setResetModalOpen(true);
    setResetInputPhrase('');
    setResetError(null);
  };

  const executeResetAllData = async (e: React.FormEvent) => {
    e.preventDefault();
    if (resetInputPhrase.trim() !== 'RESET-PORTAL') {
      setResetError('Incorrect phrase. You must type "RESET-PORTAL" in uppercase to confirm.');
      return;
    }

    setResetModalLoading(true);
    setResetError(null);

    try {
      const res = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reset-all' }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast(data.message || 'All selections wiped and restored to clean initial state.');
        setResetModalOpen(false);
        setResetInputPhrase('');
        fetchDashboardData();
      } else {
        setResetError(data.message || 'Failed to reset portal data.');
      }
    } catch {
      setResetError('Network error while resetting portal data.');
    } finally {
      setResetModalLoading(false);
    }
  };

  const filteredPSCodes = useMemo(() => {
    return problemStatements.filter((p) => {
      if (psDomainFilter === 'ALL') return true;
      return p.domain === psDomainFilter;
    });
  }, [problemStatements, psDomainFilter]);

  // LOGIN SCREEN
  if (!isAuthenticated && !loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-ops-bg text-white font-mono">
        <div className="w-full max-w-md ops-panel p-8 rounded-2xl shadow-2xl relative border-ops-border">
          <div className="absolute top-0 left-6 right-6 h-[2px] bg-gradient-to-r from-transparent via-ops-cyan to-transparent" />

          <div className="text-center mb-8">
            <div className="w-14 h-14 rounded-2xl bg-ops-cyan/15 text-ops-cyan mx-auto flex items-center justify-center mb-4 border border-ops-cyan/30">
              <Shield className="w-7 h-7" />
            </div>
            <span className="text-[11px] font-mono tracking-widest text-ops-cyan uppercase block mb-1">
              COMMAND ACCESS // 2026
            </span>
            <h1 className="text-2xl font-black text-white tracking-tight uppercase">
              Organizer Admin Desk
            </h1>
            <p className="text-xs text-ops-textMuted mt-1">
              Vice Verse Problem Statement Operations
            </p>
          </div>

          {loginError && (
            <div className="ops-alert-rejected p-3.5 rounded-xl mb-6 text-xs flex items-center gap-2.5">
              <AlertTriangle className="w-4 h-4 text-ops-magenta shrink-0" />
              <span className="text-slate-200">{loginError}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-ops-cyan mb-2">
                Organizer Access Key
              </label>
              <div className="relative">
                <Key className="w-4 h-4 text-ops-textMuted absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  placeholder="Enter 6-digit access code"
                  value={accessCodeInput}
                  onChange={(e) => setAccessCodeInput(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-ops-card border border-ops-border text-white placeholder-slate-600 text-sm font-mono tracking-wider focus:outline-none focus:border-ops-cyan"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={authLoading}
              className="w-full py-3.5 px-4 rounded-xl font-bold font-mono text-xs uppercase tracking-wider bg-ops-cyan hover:bg-cyan-300 text-slate-950 shadow-cyan-glow transition-all flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
            >
              <Lock className="w-4 h-4" />
              <span>{authLoading ? 'Verifying...' : 'Authorize Organizer'}</span>
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-ops-border text-center">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs text-ops-textMuted hover:text-ops-cyan transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Return to Public Desk</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-ops-bg text-slate-100 font-sans">
      {/* Toast Alert */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2.5 text-xs font-mono font-bold animate-slide-up ${
            toast.type === 'error' ? 'ops-badge-magenta bg-ops-panel' : 'ops-badge-emerald bg-ops-panel'
          }`}
        >
          {toast.type === 'error' ? <XCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
          <span>{toast.text}</span>
        </div>
      )}

      {/* Sidebar Navigation */}
      <aside className="w-full md:w-64 bg-ops-panel border-r border-ops-border flex flex-col">
        <div className="p-5 border-b border-ops-border flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-ops-cyan/15 text-ops-cyan flex items-center justify-center border border-ops-cyan/30">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-mono font-bold text-sm tracking-tight text-white uppercase">
                Admin Desk
              </h2>
              <span className="text-[10px] text-ops-cyan font-mono tracking-widest uppercase">
                VICE VERSE 2026
              </span>
            </div>
          </div>
        </div>

        <nav className="p-4 space-y-1.5 flex-1 font-mono text-xs">
          <button
            onClick={() => setActiveTab('overview')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-bold transition-all ${
              activeTab === 'overview'
                ? 'ops-card-active text-ops-yellow'
                : 'text-ops-textMuted hover:text-white hover:bg-ops-card'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Dashboard Overview</span>
          </button>

          <button
            onClick={() => setActiveTab('ps-management')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-bold transition-all ${
              activeTab === 'ps-management'
                ? 'ops-card-active text-ops-yellow'
                : 'text-ops-textMuted hover:text-white hover:bg-ops-card'
            }`}
          >
            <Cpu className="w-4 h-4" />
            <span>PS Code Inventory</span>
          </button>

          <button
            onClick={() => setActiveTab('selections')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-bold transition-all ${
              activeTab === 'selections'
                ? 'ops-card-active text-ops-yellow'
                : 'text-ops-textMuted hover:text-white hover:bg-ops-card'
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>Live Selections</span>
            <span className="ml-auto px-2 py-0.5 rounded text-[10px] bg-ops-card border border-ops-border text-ops-emerald font-bold">
              {selections.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-bold transition-all ${
              activeTab === 'settings'
                ? 'ops-card-active text-ops-yellow'
                : 'text-ops-textMuted hover:text-white hover:bg-ops-card'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>Portal Controls</span>
          </button>
        </nav>

        {/* Bottom controls */}
        <div className="p-4 border-t border-ops-border space-y-2 font-mono text-xs">
          <Link
            href="/"
            className="w-full flex items-center gap-2 px-3.5 py-2 rounded-xl text-ops-textMuted hover:text-white hover:bg-ops-card transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Public Team Desk</span>
          </Link>

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3.5 py-2 rounded-xl text-ops-magenta hover:bg-ops-magenta/10 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Organizer Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-y-auto">
        <header className="h-16 border-b border-ops-border bg-ops-panel/60 px-6 flex items-center justify-between">
          <h2 className="font-mono font-bold text-sm tracking-wider uppercase text-white">
            {activeTab === 'overview' && 'SYSTEM OVERVIEW // LIVE TELEMETRY'}
            {activeTab === 'ps-management' && 'INVENTORY // 30 PREDEFINED PROBLEM STATEMENTS'}
            {activeTab === 'selections' && 'LIVE SELECTION ALLOCATIONS'}
            {activeTab === 'settings' && 'SYSTEM CONTROLS & DESK POLICIES'}
          </h2>

          <button
            onClick={fetchDashboardData}
            title="Refresh Data"
            className="p-2 rounded-xl bg-ops-card border border-ops-border text-ops-textMuted hover:text-white hover:border-ops-cyan transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </header>

        <div className="p-6 sm:p-8 flex-1 space-y-6">
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && stats && (
            <div className="space-y-6">
              {/* Primary Metric Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                <div className="ops-card p-4 rounded-xl border">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-ops-textMuted">
                    Total PS Codes
                  </span>
                  <div className="text-2xl font-mono font-black text-white mt-1">
                    {stats.total_ps_codes}
                  </div>
                  <span className="text-[10px] font-mono text-ops-cyan">Exact 30 Preserved</span>
                </div>

                <div className="ops-card p-4 rounded-xl border">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-ops-textMuted">
                    Claimed Slots
                  </span>
                  <div className="text-2xl font-mono font-black text-ops-emerald mt-1">
                    {stats.total_selections}
                  </div>
                  <span className="text-[10px] font-mono text-slate-400">Of 60 Max Capacity</span>
                </div>

                <div className="ops-card p-4 rounded-xl border">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-ops-textMuted">
                    Available (0/2)
                  </span>
                  <div className="text-2xl font-mono font-black text-ops-cyan mt-1">
                    {stats.available_ps_codes}
                  </div>
                  <span className="text-[10px] font-mono text-ops-cyan">Both Slots Open</span>
                </div>

                <div className="ops-card p-4 rounded-xl border">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-ops-textMuted">
                    Partial (1/2)
                  </span>
                  <div className="text-2xl font-mono font-black text-ops-yellow mt-1">
                    {stats.partially_booked_ps_codes}
                  </div>
                  <span className="text-[10px] font-mono text-ops-yellow">1 Slot Left</span>
                </div>

                <div className="ops-card p-4 rounded-xl border">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-ops-textMuted">
                    Full (2/2)
                  </span>
                  <div className="text-2xl font-mono font-black text-ops-magenta mt-1">
                    {stats.fully_booked_ps_codes}
                  </div>
                  <span className="text-[10px] font-mono text-ops-magenta">Locked Capacity</span>
                </div>
              </div>

              {/* Domain Breakdown */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* CSE / AIML */}
                <div className="ops-panel p-6 rounded-2xl border space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-ops-border">
                    <div className="flex items-center gap-2.5">
                      <Cpu className="w-5 h-5 text-ops-cyan" />
                      <div>
                        <h4 className="font-mono font-bold text-white text-sm">CSE / AIML</h4>
                        <span className="text-[10px] font-mono text-ops-textMuted">CS-01 to CS-15</span>
                      </div>
                    </div>
                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded ops-badge-cyan">
                      15 Codes
                    </span>
                  </div>

                  <div className="space-y-2 text-xs font-mono">
                    <div className="flex justify-between text-slate-300">
                      <span>Occupied Slots:</span>
                      <span className="font-bold text-white">
                        {stats.domains.CSE_AIML.selected_teams} / 30
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-300">
                      <span>Available (0/2):</span>
                      <span className="text-ops-cyan font-bold">
                        {stats.domains.CSE_AIML.available_codes}
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-300">
                      <span>Fully Booked (2/2):</span>
                      <span className="text-ops-magenta font-bold">
                        {stats.domains.CSE_AIML.full_codes}
                      </span>
                    </div>
                  </div>

                  <div className="w-full bg-ops-card h-2 rounded-full overflow-hidden border border-ops-border/60">
                    <div
                      className="bg-ops-cyan h-full transition-all"
                      style={{
                        width: `${(stats.domains.CSE_AIML.selected_teams / 30) * 100}%`,
                      }}
                    />
                  </div>
                </div>

                {/* ECE */}
                <div className="ops-panel p-6 rounded-2xl border space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-ops-border">
                    <div className="flex items-center gap-2.5">
                      <Radio className="w-5 h-5 text-ops-cyan" />
                      <div>
                        <h4 className="font-mono font-bold text-white text-sm">ELECTRONICS & COMM</h4>
                        <span className="text-[10px] font-mono text-ops-textMuted">EC-01 to EC-10</span>
                      </div>
                    </div>
                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded ops-badge-cyan">
                      10 Codes
                    </span>
                  </div>

                  <div className="space-y-2 text-xs font-mono">
                    <div className="flex justify-between text-slate-300">
                      <span>Occupied Slots:</span>
                      <span className="font-bold text-white">
                        {stats.domains.ECE.selected_teams} / 20
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-300">
                      <span>Available (0/2):</span>
                      <span className="text-ops-cyan font-bold">
                        {stats.domains.ECE.available_codes}
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-300">
                      <span>Fully Booked (2/2):</span>
                      <span className="text-ops-magenta font-bold">
                        {stats.domains.ECE.full_codes}
                      </span>
                    </div>
                  </div>

                  <div className="w-full bg-ops-card h-2 rounded-full overflow-hidden border border-ops-border/60">
                    <div
                      className="bg-ops-cyan h-full transition-all"
                      style={{
                        width: `${(stats.domains.ECE.selected_teams / 20) * 100}%`,
                      }}
                    />
                  </div>
                </div>

                {/* Mech & Civil */}
                <div className="ops-panel p-6 rounded-2xl border space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-ops-border">
                    <div className="flex items-center gap-2.5">
                      <Wrench className="w-5 h-5 text-ops-yellow" />
                      <div>
                        <h4 className="font-mono font-bold text-white text-sm">MECHANICAL & CIVIL</h4>
                        <span className="text-[10px] font-mono text-ops-textMuted">ME (3) + CE (2)</span>
                      </div>
                    </div>
                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded ops-badge-yellow">
                      5 Codes
                    </span>
                  </div>

                  <div className="space-y-2 text-xs font-mono">
                    <div className="flex justify-between text-slate-300">
                      <span>Occupied Slots:</span>
                      <span className="font-bold text-white">
                        {stats.domains.MECH_CIVIL.selected_teams} / 10
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-300">
                      <span>Available (0/2):</span>
                      <span className="text-ops-cyan font-bold">
                        {stats.domains.MECH_CIVIL.available_codes}
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-300">
                      <span>Fully Booked (2/2):</span>
                      <span className="text-ops-magenta font-bold">
                        {stats.domains.MECH_CIVIL.full_codes}
                      </span>
                    </div>
                  </div>

                  <div className="w-full bg-ops-card h-2 rounded-full overflow-hidden border border-ops-border/60">
                    <div
                      className="bg-ops-yellow h-full transition-all"
                      style={{
                        width: `${(stats.domains.MECH_CIVIL.selected_teams / 10) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: PS CODE MANAGEMENT */}
          {activeTab === 'ps-management' && (
            <div className="space-y-4 font-mono">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl ops-panel border">
                <div className="flex items-center gap-3">
                  <span className="text-xs text-ops-cyan font-bold uppercase">Domain Filter:</span>
                  <select
                    value={psDomainFilter}
                    onChange={(e) => setPsDomainFilter(e.target.value)}
                    className="px-3 py-1.5 rounded-lg bg-ops-card border border-ops-border text-xs text-white"
                  >
                    <option value="ALL">All Domains (30 Codes)</option>
                    <option value="CSE_AIML">CSE / AIML (15 Codes)</option>
                    <option value="ECE">ECE (10 Codes)</option>
                    <option value="MECH_CIVIL">Mechanical & Civil (5 Codes)</option>
                  </select>
                </div>
                <div className="text-xs text-ops-textMuted">
                  Showing {filteredPSCodes.length} of 30 Predefined Codes
                </div>
              </div>

              <div className="rounded-xl ops-panel border overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-ops-card text-ops-textMuted uppercase border-b border-ops-border text-[10px] tracking-wider">
                      <tr>
                        <th className="py-3 px-4">Code</th>
                        <th className="py-3 px-4">Domain</th>
                        <th className="py-3 px-4">Sub Domain</th>
                        <th className="py-3 px-4">Occupancy</th>
                        <th className="py-3 px-4">Assigned Teams</th>
                        <th className="py-3 px-4">Visibility</th>
                        <th className="py-3 px-4">Selection</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-ops-border text-slate-200">
                      {filteredPSCodes.map((ps) => (
                        <tr key={ps.id} className="hover:bg-ops-card/40 transition-colors">
                          <td className="py-3 px-4 font-bold text-sm text-ops-cyan">{ps.ps_code}</td>
                          <td className="py-3 px-4">{ps.domain}</td>
                          <td className="py-3 px-4">{ps.sub_domain || '—'}</td>
                          <td className="py-3 px-4">
                            <span
                              className={`px-2 py-0.5 rounded font-bold ${
                                ps.occupied_count >= 2
                                  ? 'ops-badge-magenta'
                                  : ps.occupied_count === 1
                                  ? 'ops-badge-yellow'
                                  : 'ops-badge-cyan'
                              }`}
                            >
                              {ps.occupied_count} / 2
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            {ps.teams.length > 0 ? (
                              <div className="space-y-1">
                                {ps.teams.map((t, idx) => (
                                  <div key={idx} className="font-bold text-white">
                                    • {t.team_id}
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <span className="text-slate-600 italic">Open (0 teams)</span>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            <button
                              onClick={() =>
                                handleTogglePSToggle(ps.ps_code, 'is_published', ps.is_published)
                              }
                              className={`px-2.5 py-1 rounded text-[10px] font-bold ${
                                ps.is_published ? 'ops-badge-emerald' : 'bg-ops-card text-slate-500'
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
                              className={`px-2.5 py-1 rounded text-[10px] font-bold ${
                                ps.is_selection_open ? 'ops-badge-cyan' : 'ops-badge-magenta'
                              }`}
                            >
                              {ps.is_selection_open ? 'Active' : 'Paused'}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB: SELECTIONS MANAGEMENT */}
          {activeTab === 'selections' && (
            <div className="space-y-4 font-mono">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl ops-panel border">
                <div>
                  <h3 className="font-bold text-white text-xs uppercase tracking-wider">
                    Confirmed PS Allocations
                  </h3>
                  <p className="text-[11px] text-ops-textMuted mt-0.5">
                    Live record of all confirmed team selections. Cancel a selection to reopen its slot.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <a
                    href="/api/export?format=csv"
                    className="px-3 py-1.5 rounded-lg bg-ops-card hover:bg-ops-cardHover border border-ops-border text-slate-200 text-xs font-bold flex items-center gap-1"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>CSV</span>
                  </a>

                  <a
                    href="/api/export?format=excel"
                    className="px-3 py-1.5 rounded-lg ops-badge-emerald font-bold text-xs flex items-center gap-1"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5" />
                    <span>Excel</span>
                  </a>

                  <button
                    onClick={() => {
                      setManualPSCode('CS-01');
                      setManualAssignModal(true);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-ops-cyan text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-cyan-glow"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>Manual Assign Slot</span>
                  </button>
                </div>
              </div>

              <div className="rounded-xl ops-panel border overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-ops-card text-ops-textMuted uppercase border-b border-ops-border text-[10px] tracking-wider">
                      <tr>
                        <th className="py-3 px-4">PS Code</th>
                        <th className="py-3 px-4">Domain</th>
                        <th className="py-3 px-4">Team ID</th>
                        <th className="py-3 px-4">Timestamp</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-ops-border text-slate-200">
                      {selections.length > 0 ? (
                        selections.map((s) => (
                          <tr key={s.id} className="hover:bg-ops-card/40 transition-colors">
                            <td className="py-3 px-4 font-bold text-ops-cyan text-sm">{s.ps_code}</td>
                            <td className="py-3 px-4">{s.domain}</td>
                            <td className="py-3 px-4 font-bold text-ops-yellow">{s.team_code}</td>
                            <td className="py-3 px-4 text-slate-400">
                              {new Date(s.selected_at).toLocaleTimeString('en-IN', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </td>
                            <td className="py-3 px-4">
                              <span className="ops-badge-emerald px-2 py-0.5 rounded text-[10px] font-bold">
                                {s.status}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <button
                                onClick={() => handleCancelSelection(s.id, s.team_code, s.ps_code)}
                                className="px-2 py-1 rounded ops-badge-magenta text-[10px] font-bold flex items-center gap-1"
                              >
                                <Trash2 className="w-3 h-3" />
                                <span>Cancel Slot</span>
                              </button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={6} className="py-8 text-center text-slate-500 italic">
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

          {/* TAB 5: PORTAL CONTROLS */}
          {activeTab === 'settings' && settings && (
            <div className="space-y-6 max-w-4xl font-mono">
              <div className="ops-panel p-6 rounded-2xl border space-y-6">
                <div>
                  <h3 className="font-bold text-sm text-white uppercase tracking-wider">
                    Global Desk Policies
                  </h3>
                  <p className="text-xs text-ops-textMuted mt-0.5">
                    Real-time toggles to publish portal or suspend submissions.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-ops-card border border-ops-border flex items-center justify-between">
                    <div>
                      <span className="font-bold text-white text-xs block uppercase">
                        Publish Entire Portal
                      </span>
                      <span className="text-[11px] text-ops-textMuted">
                        {settings.portal_published ? 'Portal LIVE & reachable' : 'Portal OFFLINE'}
                      </span>
                    </div>
                    <button
                      onClick={() =>
                        handleToggleSetting('portal_published', settings.portal_published)
                      }
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold ${
                        settings.portal_published
                          ? 'ops-badge-emerald'
                          : 'bg-ops-panel text-slate-500'
                      }`}
                    >
                      {settings.portal_published ? 'ONLINE' : 'OFFLINE'}
                    </button>
                  </div>

                  <div className="p-4 rounded-xl bg-ops-card border border-ops-border flex items-center justify-between">
                    <div>
                      <span className="font-bold text-white text-xs block uppercase">
                        PS Selection Acceptance
                      </span>
                      <span className="text-[11px] text-ops-textMuted">
                        {settings.selection_open ? 'Accepting reservations' : 'Reservations PAUSED'}
                      </span>
                    </div>
                    <button
                      onClick={() =>
                        handleToggleSetting('selection_open', settings.selection_open)
                      }
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold ${
                        settings.selection_open
                          ? 'ops-badge-cyan'
                          : 'ops-badge-magenta'
                      }`}
                    >
                      {settings.selection_open ? 'SELECTION OPEN' : 'SELECTION CLOSED'}
                    </button>
                  </div>
                </div>

                <div className="pt-4 border-t border-ops-border grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="p-3.5 rounded-xl bg-ops-card border border-ops-border">
                    <span className="text-ops-textMuted block mb-1">Max Teams Per Code:</span>
                    <span className="font-bold text-ops-yellow text-sm">
                      {settings.max_teams_per_ps} Teams (Strict limit)
                    </span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-ops-card border border-ops-border">
                    <span className="text-ops-textMuted block mb-1">One PS Per Team Policy:</span>
                    <span className="font-bold text-ops-emerald text-sm">
                      {settings.one_ps_per_team ? 'Enforced (Active)' : 'Disabled'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Danger Zone */}
              <div className="ops-alert-rejected p-6 rounded-2xl space-y-4">
                <div>
                  <h4 className="font-bold text-sm text-ops-magenta uppercase tracking-wider">
                    Emergency Data Reset
                  </h4>
                  <p className="text-xs text-slate-300 mt-0.5">
                    Clears all active team selections and resets all 30 PS codes back to 0/2 available.
                  </p>
                </div>

                <button
                  onClick={handleOpenResetModal}
                  className="px-4 py-2.5 rounded-xl bg-ops-magenta text-white font-bold text-xs uppercase tracking-wider shadow-magenta-glow flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Wipe Selections & Restore Clean State</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* MANUAL ASSIGN MODAL */}
      {manualAssignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="relative w-full max-w-md ops-panel border border-ops-border rounded-2xl p-6 font-mono">
            <h3 className="text-base font-bold text-white uppercase tracking-wider mb-1">
              Manual PS Assignment
            </h3>
            <p className="text-xs text-ops-textMuted mb-4">
              Directly allocate a problem statement code to any participating Team ID.
            </p>

            {manualAssignError && (
              <div className="ops-alert-rejected p-3 rounded-xl mb-4 text-xs text-slate-200">
                {manualAssignError}
              </div>
            )}

            <form onSubmit={handleManualAssignSubmit} className="space-y-3">
              <div>
                <label className="block text-[11px] uppercase tracking-wider text-ops-cyan mb-1">
                  Target PS Code
                </label>
                <select
                  value={manualPSCode}
                  onChange={(e) => setManualPSCode(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-ops-card border border-ops-border text-white text-xs font-bold text-ops-cyan"
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
                <label className="block text-[11px] uppercase tracking-wider text-ops-cyan mb-1">
                  Team Identifier
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. TEAM-101 or 101"
                  value={manualTeamId}
                  onChange={(e) => setManualTeamId(e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 rounded-xl bg-ops-card border border-ops-border text-white text-xs font-bold"
                />
              </div>

              <div className="flex items-center gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setManualAssignModal(false)}
                  className="py-2.5 px-4 rounded-xl border border-ops-border bg-ops-card text-ops-textMuted text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!manualTeamId.trim()}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-ops-cyan text-slate-950 text-xs font-bold shadow-cyan-glow disabled:opacity-50"
                >
                  Confirm Assignment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CUSTOM UI CONFIRM CANCEL SELECTION MODAL (Zero browser popups) */}
      {cancelModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in font-mono">
          <div className="relative w-full max-w-md ops-panel border border-ops-border rounded-2xl p-6 shadow-2xl overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-ops-magenta to-transparent" />

            <div className="flex items-start gap-3 mb-4">
              <div className="p-2.5 rounded-xl ops-alert-rejected shrink-0">
                <AlertTriangle className="w-5 h-5 text-ops-magenta" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  Cancel Problem Statement Slot
                </h3>
                <p className="text-[11px] text-ops-textMuted mt-0.5">
                  Action immediately frees this reserved slot.
                </p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-ops-card border border-ops-border text-xs space-y-2 mb-5">
              <div className="flex justify-between items-center">
                <span className="text-ops-textMuted">Team Identifier:</span>
                <span className="font-bold text-ops-yellow">{cancelModalItem.teamCode}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-ops-textMuted">PS Code:</span>
                <span className="font-bold text-ops-cyan">{cancelModalItem.psCode}</span>
              </div>
              <div className="pt-2 border-t border-ops-border/60 text-[11px] text-slate-300">
                Are you sure you want to cancel this reservation? The slot will immediately become available for other participating teams.
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setCancelModalItem(null)}
                disabled={cancelLoading}
                className="flex-1 py-2.5 px-4 rounded-xl border border-ops-border bg-ops-card text-ops-textMuted text-xs font-bold hover:text-white transition-colors"
              >
                Keep Slot
              </button>
              <button
                type="button"
                onClick={executeCancelSelection}
                disabled={cancelLoading}
                className="flex-1 py-2.5 px-4 rounded-xl bg-ops-magenta text-white text-xs font-bold shadow-magenta-glow flex items-center justify-center gap-1.5 transition-all disabled:opacity-50"
              >
                {cancelLoading ? (
                  <span>Cancelling...</span>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Confirm Cancel</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CUSTOM UI EMERGENCY RESET MODAL (Zero browser popups) */}
      {resetModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in font-mono">
          <div className="relative w-full max-w-md ops-panel border border-ops-border rounded-2xl p-6 shadow-2xl overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-ops-magenta to-transparent" />

            <div className="flex items-start gap-3 mb-4">
              <div className="p-2.5 rounded-xl ops-alert-rejected shrink-0">
                <Trash2 className="w-5 h-5 text-ops-magenta" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  Emergency Portal Reset
                </h3>
                <p className="text-[11px] text-ops-textMuted mt-0.5">
                  Destructive Organizer Operation // Irreversible
                </p>
              </div>
            </div>

            {resetError && (
              <div className="ops-alert-rejected p-3 rounded-xl mb-4 text-xs text-slate-200">
                {resetError}
              </div>
            )}

            <form onSubmit={executeResetAllData} className="space-y-4">
              <div className="p-3.5 rounded-xl bg-ops-card border border-ops-border text-xs text-slate-300 leading-relaxed">
                This will permanently wipe all active team selections and restore all 30 Problem Statement codes back to pristine 0/2 available capacity.
              </div>

              <div>
                <label className="block text-[11px] uppercase tracking-wider text-ops-magenta mb-1 font-bold">
                  Type <span className="underline">RESET-PORTAL</span> to confirm:
                </label>
                <input
                  type="text"
                  required
                  placeholder="RESET-PORTAL"
                  value={resetInputPhrase}
                  onChange={(e) => setResetInputPhrase(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-ops-card border border-ops-border text-white text-xs font-bold tracking-wider"
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setResetModalOpen(false)}
                  disabled={resetModalLoading}
                  className="flex-1 py-2.5 px-4 rounded-xl border border-ops-border bg-ops-card text-ops-textMuted text-xs font-bold hover:text-white transition-colors"
                >
                  Abort
                </button>
                <button
                  type="submit"
                  disabled={resetModalLoading || resetInputPhrase.trim() !== 'RESET-PORTAL'}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-ops-magenta text-white text-xs font-bold shadow-magenta-glow disabled:opacity-40 transition-all flex items-center justify-center gap-1.5"
                >
                  {resetModalLoading ? <span>Wiping...</span> : <span>Confirm Wipe</span>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
