'use client';

import React from 'react';
import { ArrowDown, CheckCircle2, AlertCircle, ShieldAlert, Sparkles, Database, Users } from 'lucide-react';

interface HeroProps {
  totalCodes: number;
  totalSlots: number;
  reservedSlots: number;
  remainingSlots: number;
  selectionOpen: boolean;
  portalPublished: boolean;
}

export default function Hero({
  totalCodes,
  totalSlots,
  reservedSlots,
  remainingSlots,
  selectionOpen,
  portalPublished,
}: HeroProps) {
  return (
    <div className="relative overflow-hidden border-b border-slate-800 bg-gradient-to-b from-slate-900/50 via-slate-950 to-slate-950 py-16 sm:py-20">
      {/* Background glow effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 right-1/4 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
        {/* College Tag */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-slate-300 text-xs font-semibold uppercase tracking-wider mb-6">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>Vidyavardhaka College of Engineering, Mysuru</span>
        </div>

        {/* Title */}
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white mb-6">
          VVCE IDEATHON <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-300 to-amber-300">2026</span>
          <span className="block text-2xl sm:text-3xl lg:text-4xl font-semibold text-slate-300 mt-2">
            Problem Statement Selection Portal
          </span>
        </h1>

        {/* Introduction / Explanation */}
        <p className="max-w-3xl mx-auto text-base sm:text-lg text-slate-300 leading-relaxed mb-8">
          Welcome to the official selection portal for VVCE Ideathon. Participating teams must select
          their preferred Problem Statement (PS) code from their respective engineering domains.
          To ensure competitive balance and diversity, <strong className="text-white font-semibold">each PS code can be selected by a maximum of TWO teams only</strong>.
        </p>

        {/* Important Rule Banner */}
        <div className="max-w-2xl mx-auto mb-10 p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-sm flex items-start gap-3 text-left">
          <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-amber-300 block mb-0.5">Strict Two-Team Capacity Limit</span>
            Each Problem Statement allows exactly 2 reservations (0/2 → AVAILABLE, 1/2 → ONE SLOT LEFT, 2/2 → FULL).
            Once 2 teams register a code, it is immediately locked. Each team may reserve only ONE code across the portal.
          </div>
        </div>

        {/* Action Button */}
        <div className="flex flex-wrap items-center justify-center gap-4 mb-12">
          <a
            href="#explore-domains"
            className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm sm:text-base shadow-lg shadow-blue-500/25 transition-all transform hover:-translate-y-0.5"
          >
            <span>Explore PS Codes</span>
            <ArrowDown className="w-4 h-4" />
          </a>

          <a
            href="#selection-process"
            className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 font-semibold text-sm sm:text-base transition-colors"
          >
            <span>How Selection Works</span>
          </a>
        </div>

        {/* Metric Counter Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-4xl mx-auto">
          <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800">
            <div className="text-2xl sm:text-3xl font-extrabold text-blue-400 mb-1">{totalCodes}</div>
            <div className="text-xs uppercase tracking-wider text-slate-400 font-medium">Total PS Codes</div>
            <div className="text-[11px] text-slate-400 mt-1">Across 3 Domains</div>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800">
            <div className="text-2xl sm:text-3xl font-extrabold text-amber-400 mb-1">2</div>
            <div className="text-xs uppercase tracking-wider text-slate-400 font-medium">Max Teams / PS</div>
            <div className="text-[11px] text-slate-400 mt-1">Strict Slot Limit</div>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800">
            <div className="text-2xl sm:text-3xl font-extrabold text-emerald-400 mb-1">{reservedSlots}</div>
            <div className="text-xs uppercase tracking-wider text-slate-400 font-medium">Teams Reserved</div>
            <div className="text-[11px] text-slate-400 mt-1">Live Confirmed</div>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800">
            <div className="text-2xl sm:text-3xl font-extrabold text-indigo-400 mb-1">{remainingSlots}</div>
            <div className="text-xs uppercase tracking-wider text-slate-400 font-medium">Remaining Slots</div>
            <div className="text-[11px] text-slate-400 mt-1">Out of {totalSlots} Total</div>
          </div>
        </div>
      </div>
    </div>
  );
}

