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
      <div className="min-h-screen flex items-center justify-center p-4 bg-black text-white font-sans">
        <div className="w-full max-w-md bg-[#080808] p-8 rounded-2xl shadow-2xl relative border border-zinc-800">
          <div className="absolute top-0 left-6 right-6 h-[2px] bg-gradient-to-r from-transparent via-[#FF007F] to-transparent opacity-90" />

          <div className="text-center mb-8">
            <div className="w-14 h-14 rounded-2xl bg-[#FF007F]/12 text-[#FF007F] mx-auto flex items-center justify-center mb-4 border border-[#FF007F]/30 shadow-[0_0_20px_rgba(255,0,127,0.2)]">
              <Shield className="w-7 h-7" />
            </div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-950 border border-zinc-800 text-zinc-300 text-[11px] font-mono tracking-widest uppercase mb-3">
              <span className="w-1.5 h-1.5 rounded-full bg-[#FF007F] shadow-[0_0_6px_#FF007F]" />
              <span>COMMAND ACCESS // 2026</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight uppercase font-sans">
              Organizer Admin Desk
            </h1>
            <p className="text-xs text-zinc-400 mt-1 font-sans">
              Vice Verse Problem Statement Operations
            </p>
          </div>

          {loginError && (
            <div className="ops-alert-rejected p-3.5 rounded-xl mb-6 text-xs flex items-center gap-2.5">
              <AlertTriangle className="w-4 h-4 text-[#FF007F] shrink-0" />
              <span className="text-zinc-200 font-sans">{loginError}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-zinc-300 mb-2 font-bold">
                Organizer Access Key
              </label>
              <div className="relative">
                <Key className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  placeholder="Enter 6-digit access code"
                  value={accessCodeInput}
                  onChange={(e) => setAccessCodeInput(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-[#0d0d0f] border border-zinc-800 text-white placeholder-zinc-500 text-sm font-mono tracking-wider focus:outline-none focus:border-[#FF007F] focus:ring-1 focus:ring-[#FF007F] transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={authLoading}
              className="w-full py-3.5 px-4 rounded-xl font-bold font-sans text-xs uppercase tracking-wider bg-[#FF007F] hover:bg-[#ff1a8c] text-white shadow-[0_0_25px_rgba(255,0,127,0.4)] transition-all flex items-center justify-center gap-2 disabled:opacity-50 mt-2 active:scale-[0.99]"
            >
              <Lock className="w-4 h-4" />
              <span>{authLoading ? 'Verifying...' : 'Authorize Organizer'}</span>
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-zinc-800/80 text-center">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs text-zinc-500 hover:text-[#FF007F] transition-colors font-sans"
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
    <div className="min-h-screen flex flex-col md:flex-row bg-black text-zinc-100 font-sans">
      {/* Toast Alert */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2.5 text-xs font-mono font-bold animate-slide-up border ${
            toast.type === 'error'
              ? 'bg-[#120308] border-[#FF007F] text-[#FF007F]'
              : 'bg-emerald-950/80 border-emerald-500/40 text-emerald-400'
          }`}
        >
          {toast.type === 'error' ? <XCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
          <span>{toast.text}</span>
        </div>
      )}

      {/* Sidebar Navigation */}
      <aside className="w-full md:w-64 bg-[#080808] border-r border-zinc-800/80 flex flex-col">
        <div className="p-5 border-b border-zinc-800/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#FF007F]/12 text-[#FF007F] flex items-center justify-center border border-[#FF007F]/30 shadow-[0_0_12px_rgba(255,0,127,0.2)]">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-sans font-black text-sm tracking-tight text-white uppercase">
                Admin Desk
              </h2>
              <span className="text-[10px] text-[#FF007F] font-mono tracking-widest uppercase font-bold">
                VICE VERSE 2026
              </span>
            </div>
          </div>
        </div>

        <nav className="p-4 space-y-1.5 flex-1 font-sans text-xs">
          <button
            onClick={() => setActiveTab('overview')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-bold transition-all ${
              activeTab === 'overview'
                ? 'bg-[#12040a] text-[#FF007F] border border-[#FF007F]/40 shadow-[0_0_15px_rgba(255,0,127,0.15)]'
                : 'text-zinc-400 hover:text-white hover:bg-[#141417]'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Dashboard Overview</span>
          </button>

          <button
            onClick={() => setActiveTab('ps-management')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-bold transition-all ${
              activeTab === 'ps-management'
                ? 'bg-[#12040a] text-[#FF007F] border border-[#FF007F]/40 shadow-[0_0_15px_rgba(255,0,127,0.15)]'
                : 'text-zinc-400 hover:text-white hover:bg-[#141417]'
            }`}
          >
            <Cpu className="w-4 h-4" />
            <span>PS Code Inventory</span>
          </button>

          <button
            onClick={() => setActiveTab('selections')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-bold transition-all ${
              activeTab === 'selections'
                ? 'bg-[#12040a] text-[#FF007F] border border-[#FF007F]/40 shadow-[0_0_15px_rgba(255,0,127,0.15)]'
                : 'text-zinc-400 hover:text-white hover:bg-[#141417]'
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>Live Selections</span>
            <span className="ml-auto px-2 py-0.5 rounded text-[10px] bg-[#0d0d0f] border border-zinc-800 text-zinc-300 font-mono font-bold">
              {selections.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-bold transition-all ${
              activeTab === 'settings'
                ? 'bg-[#12040a] text-[#FF007F] border border-[#FF007F]/40 shadow-[0_0_15px_rgba(255,0,127,0.15)]'
                : 'text-zinc-400 hover:text-white hover:bg-[#141417]'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>Portal Controls</span>
          </button>
        </nav>

        {/* Bottom controls */}
        <div className="p-4 border-t border-zinc-800/80 space-y-2 font-sans text-xs">
          <Link
            href="/"
            className="w-full flex items-center gap-2 px-3.5 py-2 rounded-xl text-zinc-400 hover:text-white hover:bg-[#141417] transition-colors"
          >
            <ArrowLeft className="w-4 h-4 text-zinc-500" />
            <span>Public Team Desk</span>
          </Link>

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3.5 py-2 rounded-xl text-[#FF007F] hover:bg-[#FF007F]/10 transition-colors font-bold"
          >
            <LogOut className="w-4 h-4" />
            <span>Organizer Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-y-auto">
        <header className="h-16 border-b border-zinc-800/80 bg-[#080808] px-6 flex items-center justify-between">
          <h2 className="font-sans font-black text-xs sm:text-sm tracking-wider uppercase text-white">
            {activeTab === 'overview' && 'SYSTEM OVERVIEW // LIVE TELEMETRY'}
            {activeTab === 'ps-management' && 'INVENTORY // 30 PREDEFINED PROBLEM STATEMENTS'}
            {activeTab === 'selections' && 'LIVE SELECTION ALLOCATIONS'}
            {activeTab === 'settings' && 'SYSTEM CONTROLS & DESK POLICIES'}
          </h2>

          <button
            onClick={fetchDashboardData}
            title="Refresh Data"
            className="p-2 rounded-xl bg-[#0d0d0f] border border-zinc-800 text-zinc-400 hover:text-white hover:border-[#FF007F]/40 hover:bg-[#141417] transition-colors"
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
                <div className="bg-[#0d0d0f] border border-zinc-800 p-4 rounded-xl">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 block">
                    Total PS Codes
                  </span>
                  <div className="text-2xl font-mono font-black text-white mt-1">
                    {stats.total_ps_codes}
                  </div>
                  <span className="text-[10px] font-mono text-zinc-400">Exact 30 Preserved</span>
                </div>

                <div className="bg-[#0d0d0f] border border-zinc-800 p-4 rounded-xl">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 block">
                    Claimed Slots
                  </span>
                  <div className="text-2xl font-mono font-black text-emerald-400 mt-1">
                    {stats.total_selections}
                  </div>
                  <span className="text-[10px] font-mono text-zinc-400">Of 60 Max Capacity</span>
                </div>

                <div className="bg-[#0d0d0f] border border-zinc-800 p-4 rounded-xl">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 block">
                    Available (0/2)
                  </span>
                  <div className="text-2xl font-mono font-black text-white mt-1">
                    {stats.available_ps_codes}
                  </div>
                  <span className="text-[10px] font-mono text-zinc-400">Both Slots Open</span>
                </div>

                <div className="bg-[#0d0d0f] border border-zinc-800 p-4 rounded-xl">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 block">
                    Partial (1/2)
                  </span>
                  <div className="text-2xl font-mono font-black text-[#FF007F] mt-1">
                    {stats.partially_booked_ps_codes}
                  </div>
                  <span className="text-[10px] font-mono text-[#FF007F]">1 Slot Left</span>
                </div>

                <div className="bg-[#0d0d0f] border border-zinc-800 p-4 rounded-xl">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 block">
                    Full (2/2)
                  </span>
                  <div className="text-2xl font-mono font-black text-zinc-400 mt-1">
                    {stats.fully_booked_ps_codes}
                  </div>
                  <span className="text-[10px] font-mono text-zinc-500">Locked Capacity</span>
                </div>
              </div>

              {/* Domain Breakdown */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* CSE / AIML */}
                <div className="bg-[#080808] border border-zinc-800 p-6 rounded-2xl space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
                    <div className="flex items-center gap-2.5">
                      <Cpu className="w-5 h-5 text-[#FF007F]" />
                      <div>
                        <h4 className="font-sans font-bold text-white text-sm">CSE / AIML</h4>
                        <span className="text-[10px] font-mono text-zinc-500">CS-01 to CS-15</span>
                      </div>
                    </div>
                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-300">
                      15 Codes
                    </span>
                  </div>

                  <div className="space-y-2 text-xs font-mono">
                    <div className="flex justify-between text-zinc-300">
                      <span>Occupied Slots:</span>
                      <span className="font-bold text-white">
                        {stats.domains.CSE_AIML.selected_teams} / 30
                      </span>
                    </div>
                    <div className="flex justify-between text-zinc-300">
                      <span>Available (0/2):</span>
                      <span className="text-white font-bold">
                        {stats.domains.CSE_AIML.available_codes}
                      </span>
                    </div>
                    <div className="flex justify-between text-zinc-300">
                      <span>Fully Booked (2/2):</span>
                      <span className="text-zinc-500 font-bold">
                        {stats.domains.CSE_AIML.full_codes}
                      </span>
                    </div>
                  </div>

                  <div className="w-full bg-[#0d0d0f] h-2 rounded-full overflow-hidden border border-zinc-800">
                    <div
                      className="bg-[#FF007F] h-full transition-all"
                      style={{
                        width: `${(stats.domains.CSE_AIML.selected_teams / 30) * 100}%`,
                      }}
                    />
                  </div>
                </div>

                {/* ECE */}
                <div className="bg-[#080808] border border-zinc-800 p-6 rounded-2xl space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
                    <div className="flex items-center gap-2.5">
                      <Radio className="w-5 h-5 text-[#FF007F]" />
                      <div>
                        <h4 className="font-sans font-bold text-white text-sm">ELECTRONICS & COMM</h4>
                        <span className="text-[10px] font-mono text-zinc-500">EC-01 to EC-10</span>
                      </div>
                    </div>
                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-300">
                      10 Codes
                    </span>
                  </div>

                  <div className="space-y-2 text-xs font-mono">
                    <div className="flex justify-between text-zinc-300">
                      <span>Occupied Slots:</span>
                      <span className="font-bold text-white">
                        {stats.domains.ECE.selected_teams} / 20
                      </span>
                    </div>
                    <div className="flex justify-between text-zinc-300">
                      <span>Available (0/2):</span>
                      <span className="text-white font-bold">
                        {stats.domains.ECE.available_codes}
                      </span>
                    </div>
                    <div className="flex justify-between text-zinc-300">
                      <span>Fully Booked (2/2):</span>
                      <span className="text-zinc-500 font-bold">
                        {stats.domains.ECE.full_codes}
                      </span>
                    </div>
                  </div>

                  <div className="w-full bg-[#0d0d0f] h-2 rounded-full overflow-hidden border border-zinc-800">
                    <div
                      className="bg-[#FF007F] h-full transition-all"
                      style={{
                        width: `${(stats.domains.ECE.selected_teams / 20) * 100}%`,
                      }}
                    />
                  </div>
                </div>

                {/* Mech & Civil */}
                <div className="bg-[#080808] border border-zinc-800 p-6 rounded-2xl space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
                    <div className="flex items-center gap-2.5">
                      <Wrench className="w-5 h-5 text-[#FF007F]" />
                      <div>
                        <h4 className="font-sans font-bold text-white text-sm">MECHANICAL & CIVIL</h4>
                        <span className="text-[10px] font-mono text-zinc-500">ME (3) + CE (2)</span>
                      </div>
                    </div>
                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-300">
                      5 Codes
                    </span>
                  </div>

                  <div className="space-y-2 text-xs font-mono">
                    <div className="flex justify-between text-zinc-300">
                      <span>Occupied Slots:</span>
                      <span className="font-bold text-white">
                        {stats.domains.MECH_CIVIL.selected_teams} / 10
                      </span>
                    </div>
                    <div className="flex justify-between text-zinc-300">
                      <span>Available (0/2):</span>
                      <span className="text-white font-bold">
                        {stats.domains.MECH_CIVIL.available_codes}
                      </span>
                    </div>
                    <div className="flex justify-between text-zinc-300">
                      <span>Fully Booked (2/2):</span>
                      <span className="text-zinc-500 font-bold">
                        {stats.domains.MECH_CIVIL.full_codes}
                      </span>
                    </div>
                  </div>

                  <div className="w-full bg-[#0d0d0f] h-2 rounded-full overflow-hidden border border-zinc-800">
                    <div
                      className="bg-[#FF007F] h-full transition-all"
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
            <div className="space-y-4 font-sans">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-[#080808] border border-zinc-800">
                <div className="flex items-center gap-3">
                  <span className="text-xs text-zinc-400 font-bold uppercase font-mono">Domain Filter:</span>
                  <select
                    value={psDomainFilter}
                    onChange={(e) => setPsDomainFilter(e.target.value)}
                    className="px-3 py-1.5 rounded-lg bg-[#0d0d0f] border border-zinc-800 text-xs text-white focus:outline-none focus:border-[#FF007F]"
                  >
                    <option value="ALL">All Domains (30 Codes)</option>
                    <option value="CSE_AIML">CSE / AIML (15 Codes)</option>
                    <option value="ECE">ECE (10 Codes)</option>
                    <option value="MECH_CIVIL">Mechanical & Civil (5 Codes)</option>
                  </select>
                </div>
                <div className="text-xs text-zinc-500 font-mono">
                  Showing {filteredPSCodes.length} of 30 Predefined Codes
                </div>
              </div>

              <div className="rounded-xl bg-[#080808] border border-zinc-800 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#0d0d0f] text-zinc-400 uppercase border-b border-zinc-800 text-[10px] tracking-wider font-mono">
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
                    <tbody className="divide-y divide-zinc-800 text-zinc-200">
                      {filteredPSCodes.map((ps) => (
                        <tr key={ps.id} className="hover:bg-[#141417] transition-colors">
                          <td className="py-3 px-4 font-bold text-sm text-white font-mono">{ps.ps_code}</td>
                          <td className="py-3 px-4">{ps.domain}</td>
                          <td className="py-3 px-4">{ps.sub_domain || '—'}</td>
                          <td className="py-3 px-4">
                            <span
                              className={`px-2 py-0.5 rounded font-mono font-bold text-[11px] ${
                                ps.occupied_count >= 2
                                  ? 'bg-zinc-900 border border-zinc-800 text-zinc-500'
                                  : ps.occupied_count === 1
                                  ? 'bg-[#FF007F]/10 border border-[#FF007F]/30 text-[#FF007F]'
                                  : 'bg-white/5 border border-zinc-700/60 text-zinc-300'
                              }`}
                            >
                              {ps.occupied_count} / 2
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            {ps.teams.length > 0 ? (
                              <div className="space-y-1">
                                {ps.teams.map((t, idx) => (
                                  <div key={idx} className="font-bold text-white font-mono">
                                    • {t.team_id}
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <span className="text-zinc-600 italic">Open (0 teams)</span>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            <button
                              onClick={() =>
                                handleTogglePSToggle(ps.ps_code, 'is_published', ps.is_published)
                              }
                              className={`px-2.5 py-1 rounded text-[10px] font-bold font-mono ${
                                ps.is_published
                                  ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
                                  : 'bg-[#0d0d0f] border border-zinc-800 text-zinc-500'
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
                              className={`px-2.5 py-1 rounded text-[10px] font-bold font-mono ${
                                ps.is_selection_open
                                  ? 'bg-white/5 border border-zinc-700 text-zinc-200'
                                  : 'bg-[#FF007F]/10 border border-[#FF007F]/30 text-[#FF007F]'
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

          {/* TAB 3: SELECTIONS MANAGEMENT */}
          {activeTab === 'selections' && (
            <div className="space-y-4 font-sans">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-[#080808] border border-zinc-800">
                <div>
                  <h3 className="font-bold text-white text-xs uppercase tracking-wider font-sans">
                    Confirmed PS Allocations
                  </h3>
                  <p className="text-[11px] text-zinc-400 mt-0.5 font-sans">
                    Live record of all confirmed team selections. Cancel a selection to reopen its slot.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <a
                    href="/api/export?format=csv"
                    className="px-3 py-1.5 rounded-lg bg-[#0d0d0f] hover:bg-[#141417] border border-zinc-800 text-zinc-200 text-xs font-bold flex items-center gap-1 transition-colors"
                  >
                    <Download className="w-3.5 h-3.5 text-zinc-400" />
                    <span>CSV</span>
                  </a>

                  <a
                    href="/api/export?format=excel"
                    className="px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold text-xs flex items-center gap-1 hover:bg-emerald-500/20 transition-colors"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5" />
                    <span>Excel</span>
                  </a>

                  <button
                    onClick={() => {
                      setManualPSCode('CS-01');
                      setManualAssignModal(true);
                    }}
                    className="px-3.5 py-1.5 rounded-lg bg-[#FF007F] hover:bg-[#ff1a8c] text-white font-bold text-xs flex items-center gap-1.5 shadow-[0_0_20px_rgba(255,0,127,0.35)] transition-all active:scale-[0.99]"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>Manual Assign Slot</span>
                  </button>
                </div>
              </div>

              <div className="rounded-xl bg-[#080808] border border-zinc-800 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#0d0d0f] text-zinc-400 uppercase border-b border-zinc-800 text-[10px] tracking-wider font-mono">
                      <tr>
                        <th className="py-3 px-4">PS Code</th>
                        <th className="py-3 px-4">Domain</th>
                        <th className="py-3 px-4">Team ID</th>
                        <th className="py-3 px-4">Timestamp</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800 text-zinc-200">
                      {selections.length > 0 ? (
                        selections.map((s) => (
                          <tr key={s.id} className="hover:bg-[#141417] transition-colors">
                            <td className="py-3 px-4 font-bold text-white text-sm font-mono">{s.ps_code}</td>
                            <td className="py-3 px-4">{s.domain}</td>
                            <td className="py-3 px-4 font-bold text-white font-mono">{s.team_code}</td>
                            <td className="py-3 px-4 text-zinc-400 font-mono">
                              {new Date(s.selected_at).toLocaleTimeString('en-IN', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </td>
                            <td className="py-3 px-4">
                              <span className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-2 py-0.5 rounded text-[10px] font-mono font-bold">
                                {s.status}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <button
                                onClick={() => handleCancelSelection(s.id, s.team_code, s.ps_code)}
                                className="px-2.5 py-1 rounded-lg bg-[#120308] border border-[#FF007F]/40 text-[#FF007F] hover:bg-[#FF007F] hover:text-white transition-all text-[10px] font-mono font-bold flex items-center gap-1"
                              >
                                <Trash2 className="w-3 h-3" />
                                <span>Cancel Slot</span>
                              </button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={6} className="py-8 text-center text-zinc-500 italic font-sans">
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

          {/* TAB 4: PORTAL CONTROLS */}
          {activeTab === 'settings' && settings && (
            <div className="space-y-6 max-w-4xl font-sans">
              <div className="bg-[#080808] border border-zinc-800 p-6 rounded-2xl space-y-6">
                <div>
                  <h3 className="font-bold text-sm text-white uppercase tracking-wider">
                    Global Desk Policies
                  </h3>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Real-time toggles to publish portal or suspend submissions.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-[#0d0d0f] border border-zinc-800 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-white text-xs block uppercase">
                        Publish Entire Portal
                      </span>
                      <span className="text-[11px] text-zinc-400">
                        {settings.portal_published ? 'Portal LIVE & reachable' : 'Portal OFFLINE'}
                      </span>
                    </div>
                    <button
                      onClick={() =>
                        handleToggleSetting('portal_published', settings.portal_published)
                      }
                      className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold ${
                        settings.portal_published
                          ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
                          : 'bg-zinc-900 border border-zinc-800 text-zinc-500'
                      }`}
                    >
                      {settings.portal_published ? 'ONLINE' : 'OFFLINE'}
                    </button>
                  </div>

                  <div className="p-4 rounded-xl bg-[#0d0d0f] border border-zinc-800 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-white text-xs block uppercase">
                        PS Selection Acceptance
                      </span>
                      <span className="text-[11px] text-zinc-400">
                        {settings.selection_open ? 'Accepting reservations' : 'Reservations PAUSED'}
                      </span>
                    </div>
                    <button
                      onClick={() =>
                        handleToggleSetting('selection_open', settings.selection_open)
                      }
                      className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold ${
                        settings.selection_open
                          ? 'bg-white/5 border border-zinc-700 text-white'
                          : 'bg-[#FF007F]/10 border border-[#FF007F]/30 text-[#FF007F]'
                      }`}
                    >
                      {settings.selection_open ? 'SELECTION OPEN' : 'SELECTION CLOSED'}
                    </button>
                  </div>
                </div>

                <div className="pt-4 border-t border-zinc-800 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
                  <div className="p-3.5 rounded-xl bg-[#0d0d0f] border border-zinc-800">
                    <span className="text-zinc-500 block mb-1">Max Teams Per Code:</span>
                    <span className="font-bold text-white text-sm">
                      {settings.max_teams_per_ps} Teams (Strict limit)
                    </span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-[#0d0d0f] border border-zinc-800">
                    <span className="text-zinc-500 block mb-1">One PS Per Team Policy:</span>
                    <span className="font-bold text-emerald-400 text-sm">
                      {settings.one_ps_per_team ? 'Enforced (Active)' : 'Disabled'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Danger Zone */}
              <div className="bg-[#120308] border border-[#FF007F]/60 p-6 rounded-2xl space-y-4">
                <div>
                  <h4 className="font-bold text-sm text-[#FF007F] uppercase tracking-wider font-sans">
                    Emergency Data Reset
                  </h4>
                  <p className="text-xs text-zinc-300 mt-0.5">
                    Clears all active team selections and resets all 30 PS codes back to 0/2 available.
                  </p>
                </div>

                <button
                  onClick={handleOpenResetModal}
                  className="px-4 py-2.5 rounded-xl bg-[#FF007F] hover:bg-[#ff1a8c] text-white font-bold text-xs uppercase tracking-wider shadow-[0_0_25px_rgba(255,0,127,0.4)] flex items-center gap-2 transition-all active:scale-[0.99]"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fade-in font-sans">
          <div className="relative w-full max-w-md bg-[#080808] border border-zinc-800 rounded-2xl p-6 shadow-2xl overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#FF007F] to-transparent opacity-90" />

            <h3 className="text-base font-black text-white uppercase tracking-tight mb-1 font-sans">
              Manual PS Assignment
            </h3>
            <p className="text-xs text-zinc-400 mb-4 font-sans">
              Directly allocate a problem statement code to any participating Team ID.
            </p>

            {manualAssignError && (
              <div className="ops-alert-rejected p-3 rounded-xl mb-4 text-xs text-zinc-200 font-sans">
                {manualAssignError}
              </div>
            )}

            <form onSubmit={handleManualAssignSubmit} className="space-y-4">
              <div>
                <label className="block text-[11px] font-mono uppercase tracking-wider text-zinc-300 mb-1 font-bold">
                  Target PS Code
                </label>
                <select
                  value={manualPSCode}
                  onChange={(e) => setManualPSCode(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#0d0d0f] border border-zinc-800 text-white text-xs font-mono font-bold focus:outline-none focus:border-[#FF007F]"
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
                <label className="block text-[11px] font-mono uppercase tracking-wider text-zinc-300 mb-1 font-bold">
                  Team Identifier
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. TEAM-101 or 101"
                  value={manualTeamId}
                  onChange={(e) => setManualTeamId(e.target.value.toUpperCase())}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#0d0d0f] border border-zinc-800 text-white text-xs font-mono font-bold uppercase tracking-wider focus:outline-none focus:border-[#FF007F]"
                />
              </div>

              <div className="flex items-center gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setManualAssignModal(false)}
                  className="py-2.5 px-4 rounded-xl border border-zinc-800 bg-[#0d0d0f] text-zinc-400 hover:text-white text-xs font-bold font-sans transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!manualTeamId.trim()}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-[#FF007F] hover:bg-[#ff1a8c] text-white text-xs font-bold font-sans shadow-[0_0_20px_rgba(255,0,127,0.35)] disabled:opacity-50 transition-all active:scale-[0.99]"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fade-in font-sans">
          <div className="relative w-full max-w-md bg-[#080808] border border-zinc-800 rounded-2xl p-6 shadow-2xl overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#FF007F] to-transparent opacity-90" />

            <div className="flex items-start gap-3 mb-4">
              <div className="p-2.5 rounded-xl bg-[#120308] border border-[#FF007F]/40 shrink-0">
                <AlertTriangle className="w-5 h-5 text-[#FF007F]" />
              </div>
              <div>
                <h3 className="text-sm font-black text-white uppercase tracking-tight font-sans">
                  Cancel Problem Statement Slot
                </h3>
                <p className="text-[11px] text-zinc-400 mt-0.5 font-sans">
                  Action immediately frees this reserved slot.
                </p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-[#0d0d0f] border border-zinc-800 text-xs font-mono space-y-2 mb-5">
              <div className="flex justify-between items-center">
                <span className="text-zinc-500">Team Identifier:</span>
                <span className="font-bold text-white font-mono">{cancelModalItem.teamCode}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-zinc-500">PS Code:</span>
                <span className="font-bold text-white font-mono">{cancelModalItem.psCode}</span>
              </div>
              <div className="pt-2 border-t border-zinc-800/80 text-[11px] text-zinc-300 font-sans">
                Are you sure you want to cancel this reservation? The slot will immediately become available for other participating teams.
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setCancelModalItem(null)}
                disabled={cancelLoading}
                className="flex-1 py-2.5 px-4 rounded-xl border border-zinc-800 bg-[#0d0d0f] text-zinc-400 text-xs font-bold hover:text-white transition-colors font-sans"
              >
                Keep Slot
              </button>
              <button
                type="button"
                onClick={executeCancelSelection}
                disabled={cancelLoading}
                className="flex-1 py-2.5 px-4 rounded-xl bg-[#FF007F] hover:bg-[#ff1a8c] text-white text-xs font-bold shadow-[0_0_20px_rgba(255,0,127,0.35)] flex items-center justify-center gap-1.5 transition-all disabled:opacity-50 active:scale-[0.99] font-sans"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fade-in font-sans">
          <div className="relative w-full max-w-md bg-[#080808] border border-zinc-800 rounded-2xl p-6 shadow-2xl overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#FF007F] to-transparent opacity-90" />

            <div className="flex items-start gap-3 mb-4">
              <div className="p-2.5 rounded-xl bg-[#120308] border border-[#FF007F]/40 shrink-0">
                <Trash2 className="w-5 h-5 text-[#FF007F]" />
              </div>
              <div>
                <h3 className="text-sm font-black text-white uppercase tracking-tight font-sans">
                  Emergency Portal Reset
                </h3>
                <p className="text-[11px] text-zinc-400 mt-0.5 font-sans">
                  Destructive Organizer Operation // Irreversible
                </p>
              </div>
            </div>

            {resetError && (
              <div className="ops-alert-rejected p-3 rounded-xl mb-4 text-xs text-zinc-200 font-sans">
                {resetError}
              </div>
            )}

            <form onSubmit={executeResetAllData} className="space-y-4">
              <div className="p-3.5 rounded-xl bg-[#0d0d0f] border border-zinc-800 text-xs text-zinc-300 leading-relaxed font-sans">
                This will permanently wipe all active team selections and restore all 30 Problem Statement codes back to pristine 0/2 available capacity.
              </div>

              <div>
                <label className="block text-[11px] uppercase tracking-wider text-[#FF007F] mb-1 font-bold font-mono">
                  Type <span className="underline">RESET-PORTAL</span> to confirm:
                </label>
                <input
                  type="text"
                  required
                  placeholder="RESET-PORTAL"
                  value={resetInputPhrase}
                  onChange={(e) => setResetInputPhrase(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#0d0d0f] border border-zinc-800 text-white text-xs font-mono font-bold tracking-wider uppercase focus:outline-none focus:border-[#FF007F]"
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setResetModalOpen(false)}
                  disabled={resetModalLoading}
                  className="flex-1 py-2.5 px-4 rounded-xl border border-zinc-800 bg-[#0d0d0f] text-zinc-400 text-xs font-bold hover:text-white transition-colors font-sans"
                >
                  Abort
                </button>
                <button
                  type="submit"
                  disabled={resetModalLoading || resetInputPhrase.trim() !== 'RESET-PORTAL'}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-[#FF007F] hover:bg-[#ff1a8c] text-white text-xs font-bold shadow-[0_0_25px_rgba(255,0,127,0.4)] disabled:opacity-40 transition-all flex items-center justify-center gap-1.5 active:scale-[0.99] font-sans"
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
