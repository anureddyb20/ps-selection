'use client';

import React from 'react';
import { TeamPublicProfile } from '@/lib/types';
import { CheckCircle2, Lock, Printer, ShieldCheck, Sparkles, Copy } from 'lucide-react';

interface LockedSelectionViewProps {
  team: TeamPublicProfile;
}

export default function LockedSelectionView({ team }: LockedSelectionViewProps) {
  const selection = team.selection;
  if (!selection) return null;

  const handlePrint = () => {
    window.print();
  };

  const copyRefId = () => {
    navigator.clipboard.writeText(selection.id);
    alert('Selection Reference ID copied!');
  };

  return (
    <div className="ops-panel rounded-2xl p-6 sm:p-8 mb-10 shadow-2xl relative overflow-hidden border-ops-cyan/30">
      {/* Cyan top accent line */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-ops-cyan to-transparent" />

      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 text-ops-cyan text-xs font-mono font-bold tracking-widest uppercase mb-2">
            <ShieldCheck className="w-4 h-4" />
            <span>CONFIRMED // SELECTION PERMANENTLY LOCKED</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight uppercase">
            Your Problem Statement Allocation
          </h2>
          <p className="text-xs text-ops-textMuted mt-1 max-w-xl font-mono">
            Your team has completed PS selection. Your allocation has been recorded in the database.
          </p>
        </div>

        <div className="flex items-center gap-3 print:hidden">
          <button
            onClick={handlePrint}
            className="px-4 py-2.5 rounded-xl bg-ops-card hover:bg-ops-cardHover border border-ops-border text-slate-200 text-xs font-mono font-bold flex items-center gap-2 transition-colors"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Receipt</span>
          </button>
        </div>
      </div>

      {/* Main Showcase Card */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
        {/* Big Code Block */}
        <div className="p-6 rounded-xl bg-ops-card border border-ops-border text-center">
          <span className="text-[10px] font-mono uppercase tracking-widest text-ops-textMuted block mb-1">
            Allocated PS Code
          </span>
          <div className="text-5xl font-mono font-black text-ops-cyan tracking-wider my-2">
            {selection.ps_code}
          </div>
          <span className="inline-block px-3 py-1 rounded-full text-xs font-mono font-bold ops-badge-emerald">
            RESERVATION CONFIRMED
          </span>
        </div>

        {/* Allocation Details */}
        <div className="md:col-span-2 p-6 rounded-xl bg-ops-card border border-ops-border text-xs font-mono space-y-3">
          <div className="flex justify-between items-center pb-2 border-b border-ops-border/60">
            <span className="text-ops-textMuted">Team Identifier:</span>
            <span className="font-bold text-ops-yellow">{team.team_id}</span>
          </div>
          <div className="flex justify-between items-center pb-2 border-b border-ops-border/60">
            <span className="text-ops-textMuted">Team Name:</span>
            <span className="font-bold text-white">{team.team_name}</span>
          </div>
          <div className="flex justify-between items-center pb-2 border-b border-ops-border/60">
            <span className="text-ops-textMuted">Domain Category:</span>
            <span className="text-slate-300 font-semibold">{selection.domain}</span>
          </div>
          <div className="flex justify-between items-center pb-2 border-b border-ops-border/60">
            <span className="text-ops-textMuted">Timestamp:</span>
            <span className="text-slate-300">
              {new Date(selection.selected_at).toLocaleString('en-IN', {
                timeZone: 'Asia/Kolkata',
              })}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-ops-textMuted">Selection ID:</span>
            <div className="flex items-center gap-1.5 text-ops-cyan font-bold">
              <span>{selection.id}</span>
              <button
                onClick={copyRefId}
                title="Copy ID"
                className="hover:text-white transition-colors print:hidden"
              >
                <Copy className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
