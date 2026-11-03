'use client';

import React, { useState, useEffect, useMemo } from 'react';
import TeamLogin from '@/components/TeamLogin';
import TeamDashboardHeader from '@/components/TeamDashboardHeader';
import DomainNav from '@/components/DomainNav';
import PSCard from '@/components/PSCard';
import SelectionConfirmModal from '@/components/SelectionConfirmModal';
import LockedSelectionView from '@/components/LockedSelectionView';
import { PublicPSItem, DomainCategory, TeamPublicProfile } from '@/lib/types';
import {
  Lock,
  Layers,
  Sparkles,
  ShieldAlert,
  Search,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import confetti from 'canvas-confetti';

export default function HomePage() {
  const [currentTeam, setCurrentTeam] = useState<TeamPublicProfile | null>(null);
  const [authChecking, setAuthChecking] = useState(true);

  // PS Codes & Settings
  const [problemStatements, setProblemStatements] = useState<PublicPSItem[]>([]);
  const [portalPublished, setPortalPublished] = useState(true);
  const [selectionOpen, setSelectionOpen] = useState(true);

  // View & Filter states
  const [selectedDomain, setSelectedDomain] = useState<DomainCategory>('CSE_AIML');
  const [searchFilter, setSearchFilter] = useState('');
  const [activeModalItem, setActiveModalItem] = useState<PublicPSItem | null>(null);

  // Check team authentication session on mount
  const checkTeamAuth = async () => {
    try {
      const res = await fetch('/api/auth/team/me', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        if (data.authenticated && data.team) {
          setCurrentTeam(data.team);
          if (data.team.domain) {
            setSelectedDomain(data.team.domain);
          }
        } else {
          setCurrentTeam(null);
        }
      } else {
        setCurrentTeam(null);
      }
    } catch (err) {
      console.error('Session check error:', err);
      setCurrentTeam(null);
    } finally {
      setAuthChecking(false);
    }
  };

  // Fetch public problem statements
  const fetchPSData = async () => {
    try {
      const res = await fetch('/api/ps-codes', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setProblemStatements(data.problem_statements || []);
        setPortalPublished(data.portal_published !== false);
        setSelectionOpen(data.selection_open !== false);
      }
    } catch (err) {
      console.error('Error fetching PS codes:', err);
    }
  };

  useEffect(() => {
    checkTeamAuth();
    fetchPSData();

    // Setup Realtime SSE listener
    const eventSource = new EventSource('/api/realtime');
    eventSource.addEventListener('update', () => {
      fetchPSData();
      checkTeamAuth();
    });

    const interval = setInterval(fetchPSData, 6000);

    return () => {
      eventSource.close();
      clearInterval(interval);
    };
  }, []);

  const handleLogout = async () => {
    await fetch('/api/auth/team/logout', { method: 'POST' });
    setCurrentTeam(null);
  };

  const handleLoginSuccess = (team: TeamPublicProfile) => {
    setCurrentTeam(team);
    if (team.domain) {
      setSelectedDomain(team.domain);
    }
    fetchPSData();
  };

  const handleSelectionSuccess = (data: any) => {
    setActiveModalItem(null);
    confetti({
      particleCount: 120,
      spread: 80,
      origin: { y: 0.6 },
    });
    // Refresh state
    checkTeamAuth();
    fetchPSData();
  };

  // Domain slot counts computation
  const domainCounts = useMemo(() => {
    const getDomainOccupied = (domain: DomainCategory) => {
      return problemStatements
        .filter((p) => p.domain === domain)
        .reduce((sum, item) => sum + item.occupied_count, 0);
    };

    return {
      CSE_AIML: { total: 15, occupied: getDomainOccupied('CSE_AIML') },
      ECE: { total: 10, occupied: getDomainOccupied('ECE') },
      MECH_CIVIL: { total: 5, occupied: getDomainOccupied('MECH_CIVIL') },
    };
  }, [problemStatements]);

  // Filtered items
  const filteredItems = useMemo(() => {
    return problemStatements.filter((item) => {
      const matchesDomain = item.domain === selectedDomain;
      const matchesSearch = searchFilter
        ? item.ps_code.toLowerCase().includes(searchFilter.toLowerCase().trim())
        : true;
      return matchesDomain && matchesSearch;
    });
  }, [problemStatements, selectedDomain, searchFilter]);

  const mechanicalItems = useMemo(() => {
    return filteredItems.filter((item) => item.sub_domain === 'MECHANICAL');
  }, [filteredItems]);

  const civilItems = useMemo(() => {
    return filteredItems.filter((item) => item.sub_domain === 'CIVIL');
  }, [filteredItems]);

  // Loading screen during session check
  if (authChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-ops-bg text-white font-mono text-xs">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-6 h-6 animate-spin text-ops-cyan" />
          <span className="tracking-widest uppercase">INITIALIZING SELECTION DESK...</span>
        </div>
      </div>
    );
  }

  // FLOW STEP 1: If NOT logged in, show Team Login
  if (!currentTeam) {
    return (
      <div className="min-h-screen bg-ops-bg text-slate-100 flex flex-col justify-between">
        <div className="border-b border-ops-border py-4 px-6 bg-ops-panel/60">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-ops-cyan shadow-cyan-glow" />
              <span className="font-mono font-bold text-sm tracking-wider text-white">
                VVCE IDEATHON 2026
              </span>
            </div>
            <span className="text-[11px] font-mono text-ops-textMuted uppercase tracking-widest hidden sm:inline-block">
              Problem Statement Selection Portal
            </span>
          </div>
        </div>

        <TeamLogin onLoginSuccess={handleLoginSuccess} />

        <footer className="border-t border-ops-border py-6 px-6 text-center text-xs font-mono text-ops-textMuted bg-ops-panel/40">
          © 2026 Vidyavardhaka College of Engineering. All rights reserved. Max 2 teams per PS code.
        </footer>
      </div>
    );
  }

  // FLOW STEP 2: Team is Authenticated -> Show Team Dashboard
  const hasSelected = Boolean(currentTeam.selection);

  return (
    <div className="min-h-screen flex flex-col bg-ops-bg text-slate-100">
      <TeamDashboardHeader
        team={currentTeam}
        onLogout={handleLogout}
        selectionOpen={selectionOpen}
        portalPublished={portalPublished}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full">
        {/* If team has already selected a PS, showcase their locked selection */}
        {hasSelected && <LockedSelectionView team={currentTeam} />}

        {/* Global Notices if paused */}
        {!portalPublished ? (
          <div className="mb-6 p-4 rounded-xl ops-alert-rejected text-xs flex items-center gap-3">
            <Lock className="w-5 h-5 text-ops-magenta shrink-0" />
            <span className="font-mono text-slate-200">
              <strong className="text-ops-magenta">PORTAL UNPUBLISHED:</strong> The selection portal is currently offline. Selections are temporarily suspended.
            </span>
          </div>
        ) : !selectionOpen ? (
          <div className="mb-6 p-4 rounded-xl bg-ops-yellow/10 border border-ops-yellow/30 text-xs flex items-center gap-3">
            <ShieldAlert className="w-5 h-5 text-ops-yellow shrink-0" />
            <span className="font-mono text-slate-200">
              <strong className="text-ops-yellow">SELECTION PAUSED:</strong> Organizers have temporarily paused new reservations.
            </span>
          </div>
        ) : null}

        {/* Domain Navigation (Styling matches reference screenshot ACTIVE OPERATION MODE) */}
        <DomainNav
          selectedDomain={selectedDomain}
          onSelectDomain={(d) => {
            setSelectedDomain(d);
            setSearchFilter('');
          }}
          domainCounts={domainCounts}
        />

        {/* Section Header & Search */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-ops-border mb-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono uppercase tracking-widest text-ops-cyan">
                DOMAIN INVENTORY
              </span>
            </div>
            <h2 className="text-xl font-mono font-bold text-white uppercase tracking-wider mt-0.5">
              {selectedDomain === 'CSE_AIML' && 'CSE / AIML Problem Statements (15 Codes)'}
              {selectedDomain === 'ECE' && 'Electronics & Communication Codes (10 Codes)'}
              {selectedDomain === 'MECH_CIVIL' && 'Mechanical & Civil Codes (5 Codes)'}
            </h2>
          </div>

          {/* Search Input */}
          <div className="relative w-full sm:w-60">
            <Search className="w-4 h-4 text-ops-textMuted absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search code (e.g. CS-01)"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-ops-card border border-ops-border text-white placeholder-slate-600 text-xs font-mono focus:outline-none focus:border-ops-cyan focus:ring-1 focus:ring-ops-cyan"
            />
          </div>
        </div>

        {/* PS Cards Grid */}
        {selectedDomain === 'MECH_CIVIL' ? (
          <div className="space-y-10">
            {/* Mechanical Engineering Subcategory */}
            <div>
              <div className="flex items-center gap-2 mb-4 font-mono text-xs uppercase tracking-wider text-ops-yellow font-bold">
                <span className="w-2 h-2 rounded-full bg-ops-yellow" />
                <span>Mechanical Engineering (3 Problem Statements: ME-01, ME-02, ME-03)</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {mechanicalItems.map((item) => (
                  <PSCard
                    key={item.ps_code}
                    item={item}
                    onSelect={(it) => setActiveModalItem(it)}
                    selectionOpen={selectionOpen && portalPublished}
                    teamAlreadySelected={hasSelected}
                  />
                ))}
              </div>
            </div>

            {/* Civil Engineering Subcategory */}
            <div>
              <div className="flex items-center gap-2 mb-4 font-mono text-xs uppercase tracking-wider text-ops-cyan font-bold">
                <span className="w-2 h-2 rounded-full bg-ops-cyan" />
                <span>Civil Engineering (2 Problem Statements: CE-01, CE-02)</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {civilItems.map((item) => (
                  <PSCard
                    key={item.ps_code}
                    item={item}
                    onSelect={(it) => setActiveModalItem(it)}
                    selectionOpen={selectionOpen && portalPublished}
                    teamAlreadySelected={hasSelected}
                  />
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredItems.map((item) => (
              <PSCard
                key={item.ps_code}
                item={item}
                onSelect={(it) => setActiveModalItem(it)}
                selectionOpen={selectionOpen && portalPublished}
                teamAlreadySelected={hasSelected}
              />
            ))}
          </div>
        )}
      </main>

      {/* Confirmation Modal */}
      {activeModalItem && currentTeam && (
        <SelectionConfirmModal
          psItem={activeModalItem}
          team={currentTeam}
          onClose={() => setActiveModalItem(null)}
          onSuccess={handleSelectionSuccess}
        />
      )}

      <footer className="border-t border-ops-border py-8 px-6 text-xs font-mono text-ops-textMuted bg-ops-panel mt-16">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© 2026 Vidyavardhaka College of Engineering. VVCE Ideathon Problem Statement Selection Desk.</p>
          <p className="text-slate-500">Atomic PostgreSQL Enforced • Real-time Synchronized</p>
        </div>
      </footer>
    </div>
  );
}
