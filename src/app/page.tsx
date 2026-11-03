'use client';

import React, { useState, useEffect, useMemo } from 'react';
import TeamEntry from '@/components/TeamEntry';
import TeamDashboardHeader from '@/components/TeamDashboardHeader';
import DomainNav from '@/components/DomainNav';
import PSCard from '@/components/PSCard';
import SelectionConfirmModal from '@/components/SelectionConfirmModal';
import LockedSelectionView from '@/components/LockedSelectionView';
import { PublicPSItem, DomainCategory, TeamPublicProfile } from '@/lib/types';
import {
  Lock,
  ShieldAlert,
  Search,
  Loader2,
} from 'lucide-react';

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

  // Check team session on mount
  const checkTeamSession = async () => {
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

  // Fetch problem statements
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
    checkTeamSession();
    fetchPSData();

    const eventSource = new EventSource('/api/realtime');
    eventSource.addEventListener('update', () => {
      fetchPSData();
      checkTeamSession();
    });

    const interval = setInterval(fetchPSData, 6000);

    return () => {
      eventSource.close();
      clearInterval(interval);
    };
  }, []);

  const handleSwitchTeam = async () => {
    await fetch('/api/auth/team/logout', { method: 'POST' });
    setCurrentTeam(null);
  };

  const handleTeamVerified = (team: TeamPublicProfile) => {
    setCurrentTeam(team);
    if (team.domain) {
      setSelectedDomain(team.domain);
    }
    fetchPSData();
  };

  const handleSelectionSuccess = (data: any) => {
    setActiveModalItem(null);
    if (data?.team) {
      setCurrentTeam(data.team);
    }
    checkTeamSession();
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

  // Loading screen during initial check
  if (authChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white font-sans text-xs">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-6 h-6 animate-spin text-[#FF007F]" />
          <span className="tracking-widest uppercase font-mono text-zinc-400">CONNECTING TO SELECTION DESK...</span>
        </div>
      </div>
    );
  }

  // FLOW STEP 1: If NO team entered, display Team ID Entry Screen
  if (!currentTeam) {
    return (
      <div className="min-h-screen bg-black text-zinc-100 flex flex-col justify-between">
        <div className="border-b border-zinc-800/80 py-4 px-6 bg-[#080808]">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="w-2 h-2 rounded-full bg-[#FF007F] shadow-[0_0_8px_#FF007F]" />
              <span className="font-sans font-black text-sm tracking-wide text-white uppercase">
                PROBLEM STATEMENT SELECTION
              </span>
            </div>
            <span className="text-[11px] font-mono text-zinc-400 uppercase tracking-widest hidden sm:inline-block">
              VICE VERSE 2026
            </span>
          </div>
        </div>

        <TeamEntry onTeamVerified={handleTeamVerified} />

        <footer className="border-t border-zinc-800/80 py-6 px-6 text-center text-xs font-sans text-zinc-500 bg-[#080808]">
          © 2026 Vice Verse Ideathon. All rights reserved. Max 2 teams per PS code.
        </footer>
      </div>
    );
  }

  // FLOW STEP 2: Team ID is verified -> Display Team Dashboard
  // If team has already confirmed a PS, immediately display locked confirmation receipt
  // The catalog of PS codes is completely hidden so team cannot select again
  if (currentTeam.selection) {
    return (
      <div className="min-h-screen flex flex-col bg-black text-zinc-100">
        <TeamDashboardHeader
          team={currentTeam}
          onLogout={handleSwitchTeam}
          selectionOpen={selectionOpen}
          portalPublished={portalPublished}
        />

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex-1 w-full">
          <LockedSelectionView team={currentTeam} />
        </main>

        <footer className="border-t border-zinc-800/80 py-8 px-6 text-xs font-sans text-zinc-500 bg-[#080808] mt-16">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
            <p>© 2026 Vice Verse Problem Statement Selection Desk.</p>
            <p className="text-zinc-600 font-mono text-[11px]">Atomic PostgreSQL Enforced • Real-time Synchronized</p>
          </div>
        </footer>
      </div>
    );
  }

  const hasSelected = false;

  return (
    <div className="min-h-screen flex flex-col bg-black text-zinc-100">
      <TeamDashboardHeader
        team={currentTeam}
        onLogout={handleSwitchTeam}
        selectionOpen={selectionOpen}
        portalPublished={portalPublished}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full">

        {/* Global Notices if paused */}
        {!portalPublished ? (
          <div className="mb-6 p-4 rounded-xl ops-alert-rejected text-xs flex items-center gap-3">
            <Lock className="w-5 h-5 text-[#FF007F] shrink-0" />
            <span className="font-sans text-zinc-200">
              <strong className="text-[#FF007F]">PORTAL UNPUBLISHED:</strong> The selection portal is currently offline. Selections are temporarily suspended.
            </span>
          </div>
        ) : !selectionOpen ? (
          <div className="mb-6 p-4 rounded-xl bg-[#120308] border border-[#FF007F]/40 text-xs flex items-center gap-3">
            <ShieldAlert className="w-5 h-5 text-[#FF007F] shrink-0" />
            <span className="font-sans text-zinc-200">
              <strong className="text-[#FF007F]">SELECTION PAUSED:</strong> Organizers have temporarily paused new reservations.
            </span>
          </div>
        ) : null}

        {/* Domain Navigation */}
        <DomainNav
          selectedDomain={selectedDomain}
          onSelectDomain={(d) => {
            setSelectedDomain(d);
            setSearchFilter('');
          }}
          domainCounts={domainCounts}
        />

        {/* Section Header & Search */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800/80 mb-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#FF007F] shadow-[0_0_6px_#FF007F]" />
              <span className="text-[11px] font-mono uppercase tracking-widest text-zinc-400 font-bold">
                DOMAIN INVENTORY
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white uppercase tracking-tight font-sans mt-0.5">
              {selectedDomain === 'CSE_AIML' && 'CSE / AIML Problem Statements (15 Codes)'}
              {selectedDomain === 'ECE' && 'Electronics & Communication Codes (10 Codes)'}
              {selectedDomain === 'MECH_CIVIL' && 'Mechanical & Civil Codes (5 Codes)'}
            </h2>
          </div>

          {/* Search Input */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search code (e.g. CS-01)"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-[#0d0d0f] border border-zinc-800 text-white placeholder-zinc-500 text-xs font-mono focus:outline-none focus:border-[#FF007F] focus:ring-1 focus:ring-[#FF007F] uppercase tracking-wider transition-colors"
            />
          </div>
        </div>

        {/* PS Cards Grid */}
        {selectedDomain === 'MECH_CIVIL' ? (
          <div className="space-y-10">
            {/* Mechanical Engineering Subcategory */}
            <div>
              <div className="flex items-center gap-2 mb-4 font-sans text-xs uppercase tracking-wider text-white font-bold">
                <span className="w-2 h-2 rounded-full bg-[#FF007F] shadow-[0_0_8px_#FF007F]" />
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
              <div className="flex items-center gap-2 mb-4 font-sans text-xs uppercase tracking-wider text-white font-bold">
                <span className="w-2 h-2 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.6)]" />
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

      <footer className="border-t border-zinc-800/80 py-8 px-6 text-xs font-sans text-zinc-500 bg-[#080808] mt-16">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© 2026 Vice Verse Problem Statement Selection Desk.</p>
          <p className="text-zinc-600 font-mono text-[11px]">Atomic PostgreSQL Enforced • Real-time Synchronized</p>
        </div>
      </footer>
    </div>
  );
}
