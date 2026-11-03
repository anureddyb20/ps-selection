'use client';

import React, { useState } from 'react';
import { TeamPublicProfile } from '@/lib/types';
import { CheckCircle2, Lock, Printer, ShieldCheck, Sparkles, Copy, Check } from 'lucide-react';

interface LockedSelectionViewProps {
  team: TeamPublicProfile;
}

export default function LockedSelectionView({ team }: LockedSelectionViewProps) {
  const [copied, setCopied] = useState(false);
  const selection = team.selection;
  if (!selection) return null;

  const handlePrint = () => {
    window.print();
  };

  const copyRefId = () => {
    navigator.clipboard.writeText(selection.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="bg-[#080808] border border-zinc-800 rounded-2xl p-6 sm:p-8 mb-10 shadow-2xl relative overflow-hidden">
      {/* Magenta top accent line */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#FF007F] to-transparent opacity-90" />

      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono font-bold tracking-widest uppercase mb-2 text-[#FF007F]">
            <ShieldCheck className="w-4 h-4" />
            <span>CONFIRMED // SELECTION PERMANENTLY LOCKED</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight uppercase font-sans">
            Your Problem Statement Allocation
          </h2>
          <p className="text-xs text-zinc-400 mt-1 max-w-xl font-sans">
            Your team has completed PS selection. Your allocation has been recorded in the database.
          </p>
        </div>

        <div className="flex items-center gap-3 print:hidden">
          <button
            onClick={handlePrint}
            className="px-4 py-2.5 rounded-xl bg-[#0d0d0f] hover:bg-[#141417] border border-zinc-800 text-zinc-200 text-xs font-sans font-bold flex items-center gap-2 transition-colors"
          >
            <Printer className="w-3.5 h-3.5 text-zinc-400" />
            <span>Print Receipt</span>
          </button>
        </div>
      </div>

      {/* Main Showcase Card */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
        {/* Big Code Block */}
        <div className="p-6 rounded-xl bg-[#0d0d0f] border border-zinc-800 text-center">
          <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 block mb-1">
            Allocated PS Code
          </span>
          <div className="text-5xl font-sans font-black text-white tracking-wider my-2">
            {selection.ps_code}
          </div>
          <span className="inline-block px-3 py-1 rounded-full text-xs font-mono font-bold bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
            RESERVATION CONFIRMED
          </span>
        </div>

        {/* Allocation Details */}
        <div className="md:col-span-2 p-6 rounded-xl bg-[#0d0d0f] border border-zinc-800 text-xs font-mono space-y-3">
          <div className="flex justify-between items-center pb-2 border-b border-zinc-800/80">
            <span className="text-zinc-500">Team Identifier:</span>
            <span className="font-bold text-white font-mono">{team.team_id}</span>
          </div>
          <div className="flex justify-between items-center pb-2 border-b border-zinc-800/80">
            <span className="text-zinc-500">Domain Category:</span>
            <span className="text-zinc-300 font-semibold">{selection.domain}</span>
          </div>
          <div className="flex justify-between items-center pb-2 border-b border-zinc-800/80">
            <span className="text-zinc-500">Timestamp:</span>
            <span className="text-zinc-300">
              {new Date(selection.selected_at).toLocaleString('en-IN', {
                timeZone: 'Asia/Kolkata',
              })}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-zinc-500">Selection ID:</span>
            <div className="flex items-center gap-2 text-[#FF007F] font-bold">
              <span>{selection.id}</span>
              <button
                onClick={copyRefId}
                title="Copy Reference ID"
                className="p-1 rounded hover:bg-[#141417] hover:text-white transition-colors print:hidden flex items-center gap-1 text-[11px]"
              >
                {copied ? (
                  <span className="text-emerald-400 flex items-center gap-1 font-bold">
                    <Check className="w-3.5 h-3.5" />
                    <span>COPIED</span>
                  </span>
                ) : (
                  <Copy className="w-3.5 h-3.5 text-zinc-500 hover:text-[#FF007F]" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

