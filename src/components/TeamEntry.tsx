'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { User, ArrowRight, Loader2, AlertCircle, Sparkles, Shield } from 'lucide-react';
import { TeamPublicProfile } from '@/lib/types';

interface TeamEntryProps {
  onTeamVerified: (team: TeamPublicProfile) => void;
}

export default function TeamEntry({ onTeamVerified }: TeamEntryProps) {
  const [teamId, setTeamId] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanId = teamId.trim().toUpperCase();

    if (!cleanId) {
      setErrorMessage('Invalid Team ID. Please enter a registered Team ID.');
      return;
    }

    setErrorMessage(null);
    setLoading(true);

    try {
      const res = await fetch('/api/auth/team/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          team_id: cleanId,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setErrorMessage(data.message || 'Invalid Team ID. Please enter a registered Team ID.');
        setLoading(false);
        return;
      }

      onTeamVerified(data.team);
    } catch (err) {
      console.error('Team verification error:', err);
      setErrorMessage('Network error. Please verify your connection.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Header matching exact user requirements */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-ops-cyan/10 border border-ops-cyan/30 text-ops-cyan text-[11px] font-mono tracking-widest uppercase mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            <span>VVCE IDEATHON 2026 // TEAM ACCESS</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight uppercase font-mono">
            ENTER YOUR TEAM ID
          </h1>
          <p className="text-xs text-ops-textMuted mt-2 font-mono">
            Enter your registered Team ID to access Problem Statement Selection.
          </p>
        </div>

        {/* Panel with only ONE text input */}
        <div className="ops-panel rounded-2xl p-7 sm:p-8 relative shadow-2xl">
          <div className="absolute top-0 left-6 right-6 h-[2px] bg-gradient-to-r from-transparent via-ops-cyan to-transparent opacity-80" />

          {/* Magenta Error Banner */}
          {errorMessage && (
            <div className="ops-alert-rejected p-4 rounded-xl mb-6 text-xs flex items-start gap-3 animate-fade-in">
              <div className="p-1.5 rounded-lg bg-ops-magenta/20 text-ops-magenta shrink-0 mt-0.5">
                <AlertCircle className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <span className="font-mono font-bold tracking-wider text-ops-magenta uppercase text-[10px] block mb-1">
                  ACCESS REJECTED
                </span>
                <p className="text-slate-200 leading-relaxed font-sans">{errorMessage}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-[11px] font-mono uppercase tracking-wider text-ops-cyan mb-2">
                TEAM IDENTIFIER
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-ops-textMuted absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  autoFocus
                  placeholder="Enter your Team ID (e.g., TEAM-101)"
                  value={teamId}
                  onChange={(e) => {
                    setTeamId(e.target.value);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  className="w-full pl-10 pr-4 py-3.5 rounded-xl bg-ops-card border border-ops-border text-white placeholder-slate-600 text-sm font-mono tracking-wider focus:outline-none focus:border-ops-cyan focus:ring-1 focus:ring-ops-cyan transition-colors uppercase"
                />
              </div>
            </div>

            {/* Cyan Button: CONTINUE → */}
            <button
              type="submit"
              disabled={loading || !teamId.trim()}
              className="w-full py-3.5 px-4 rounded-xl font-bold font-mono text-xs uppercase tracking-wider bg-ops-cyan hover:bg-cyan-300 text-slate-950 shadow-cyan-glow transition-all flex items-center justify-center gap-2 disabled:opacity-50 active:scale-[0.99]"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                  <span>Validating Team ID...</span>
                </>
              ) : (
                <>
                  <span>CONTINUE →</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Organizer link */}
        <div className="mt-8 text-center">
          <Link
            href="/admin"
            className="inline-flex items-center gap-2 text-xs font-mono text-ops-textMuted hover:text-ops-cyan transition-colors"
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Organizer Administration Portal →</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

