'use client';

import React from 'react';
import { TeamPublicProfile } from '@/lib/types';
import { LogOut, CheckCircle2, AlertCircle } from 'lucide-react';

interface TeamDashboardHeaderProps {
  team: TeamPublicProfile;
  onLogout: () => void;
  selectionOpen: boolean;
  portalPublished: boolean;
}

export default function TeamDashboardHeader({
  team,
  onLogout,
  selectionOpen,
  portalPublished,
}: TeamDashboardHeaderProps) {
  const hasSelected = Boolean(team.selection);

  return (
    <header className="border-b border-ops-border bg-ops-panel/90 backdrop-blur-md sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Left Title block */}
          <div>
            <div className="flex items-center gap-2 text-ops-cyan text-xs font-mono font-bold tracking-widest uppercase mb-1">
              <span>VVCE IDEATHON 2026 // SELECTION DESK</span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight uppercase font-mono">
              Problem Statement Selection Portal
            </h1>
            <p className="text-xs text-ops-textMuted mt-1 max-w-2xl font-mono">
              Review domain-wise problem statement codes and confirm your team's single reservation.
            </p>
          </div>

          {/* Right Status Badges */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Live Status Pill */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-ops-card border border-ops-border text-xs font-mono">
              <span
                className={`w-2 h-2 rounded-full ${
                  selectionOpen && portalPublished
                    ? 'bg-ops-cyan animate-pulse'
                    : 'bg-ops-magenta'
                }`}
              />
              <span className="text-slate-300">
                {selectionOpen && portalPublished ? 'Desk Online' : 'Desk Paused'}
              </span>
            </div>

            {/* Team Identity Pill */}
            <div className="flex items-center gap-2.5 px-3.5 py-1.5 rounded-xl bg-ops-card border border-ops-borderLight text-xs font-mono text-slate-200">
              <div className="w-2 h-2 rounded-full bg-ops-yellow" />
              <span className="font-bold text-ops-yellow">{team.team_id}</span>
              <span className="text-slate-400">|</span>
              <span className="text-white font-medium max-w-[150px] truncate">{team.team_name}</span>
            </div>

            {/* Selection Status Badge */}
            {hasSelected ? (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl ops-badge-emerald text-xs font-mono font-bold">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{team.selection?.ps_code} RESERVED</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl ops-badge-yellow text-xs font-mono font-bold">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>PENDING SELECTION</span>
              </div>
            )}

            {/* Switch Team button */}
            <button
              onClick={onLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-ops-card border border-ops-border text-ops-textMuted hover:text-ops-cyan hover:border-ops-cyan/40 transition-colors text-xs font-mono font-bold"
              title="Change Team ID"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>SWITCH TEAM</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
