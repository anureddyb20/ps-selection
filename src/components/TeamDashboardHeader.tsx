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
    <header className="border-b border-zinc-800/80 bg-black/95 backdrop-blur-md sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Left Title block */}
          <div>
            <div className="flex items-center gap-2 text-xs font-mono font-bold tracking-widest uppercase mb-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#FF007F] shadow-[0_0_8px_#FF007F]" />
              <span className="text-zinc-400">VICE VERSE 2026 // SELECTION DESK</span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight uppercase font-sans">
              Problem Statement Selection
            </h1>
            <p className="text-xs text-zinc-400 mt-1 max-w-2xl font-sans">
              Review domain-wise problem statement codes and confirm your team's single reservation.
            </p>
          </div>

          {/* Right Status Badges */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Live Status Pill */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#0d0d0f] border border-zinc-800 text-xs font-sans">
              <span
                className={`w-2 h-2 rounded-full ${
                  selectionOpen && portalPublished
                    ? 'bg-emerald-400 shadow-[0_0_8px_#34d399]'
                    : 'bg-[#FF007F] shadow-[0_0_8px_#FF007F]'
                }`}
              />
              <span className="text-zinc-300 font-medium">
                {selectionOpen && portalPublished ? 'Desk Online' : 'Desk Paused'}
              </span>
            </div>

            {/* Team Identity Pill */}
            <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-[#0d0d0f] border border-zinc-800 text-xs font-sans text-zinc-200">
              <span className="w-1.5 h-1.5 rounded-full bg-[#FF007F] shadow-[0_0_6px_#FF007F]" />
              <span className="text-zinc-500 uppercase text-[10px] font-mono tracking-wider">TEAM:</span>
              <span className="font-bold text-white font-mono tracking-wider">{team.team_id}</span>
            </div>

            {/* Selection Status Badge */}
            {hasSelected ? (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono font-bold">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{team.selection?.ps_code} RESERVED</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#FF007F]/10 border border-[#FF007F]/30 text-[#FF007F] text-xs font-mono font-bold">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>PENDING SELECTION</span>
              </div>
            )}

            {/* Switch Team button */}
            <button
              onClick={onLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0d0d0f] border border-zinc-800 text-zinc-400 hover:text-white hover:border-[#FF007F]/40 hover:bg-[#141417] transition-all text-xs font-sans font-bold"
              title="Change Team ID"
            >
              <LogOut className="w-3.5 h-3.5 text-zinc-500" />
              <span>SWITCH TEAM</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
