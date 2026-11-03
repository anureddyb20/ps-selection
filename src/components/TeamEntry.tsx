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
    const cleanId = teamId.trim();

    if (!cleanId) {
      setErrorMessage('Please enter your Team ID.');
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
        setErrorMessage(data.message || 'Unable to access with Team ID. Please try again.');
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
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12 bg-black">
      <div className="w-full max-w-md">
        {/* Header matching reference design */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-950 border border-zinc-800 text-zinc-300 text-[11px] font-mono tracking-widest uppercase mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-[#FF007F] shadow-[0_0_8px_#FF007F]" />
            <span>VICE VERSE 2026 // TEAM ACCESS</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight uppercase font-sans">
            ENTER YOUR TEAM ID
          </h1>
          <p className="text-xs text-zinc-400 mt-2 font-sans">
            Enter your registered Team ID to access Problem Statement Selection.
          </p>
        </div>

        {/* Panel with only ONE text input */}
        <div className="ops-panel rounded-2xl p-7 sm:p-8 relative shadow-2xl bg-[#080808] border border-zinc-800/80">
          <div className="absolute top-0 left-6 right-6 h-[2px] bg-gradient-to-r from-transparent via-[#FF007F] to-transparent opacity-90" />

          {/* Magenta Error Banner */}
          {errorMessage && (
            <div className="ops-alert-rejected p-4 rounded-xl mb-6 text-xs flex items-start gap-3 bg-[#120308] border border-[#FF007F]">
              <div className="p-1.5 rounded-lg bg-[#FF007F]/20 text-[#FF007F] shrink-0 mt-0.5">
                <AlertCircle className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <span className="font-mono font-bold tracking-wider text-[#FF007F] uppercase text-[10px] block mb-1">
                  ACCESS REJECTED
                </span>
                <p className="text-zinc-200 leading-relaxed font-sans">{errorMessage}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-[11px] font-mono uppercase tracking-wider text-zinc-300 mb-2 font-bold">
                TEAM IDENTIFIER
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  autoFocus
                  placeholder="Enter your Team ID (e.g., 101, TEAM-01)"
                  value={teamId}
                  onChange={(e) => {
                    setTeamId(e.target.value);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  className="w-full pl-10 pr-4 py-3.5 rounded-xl bg-[#0d0d0f] border border-zinc-800 text-white placeholder-zinc-600 text-sm font-mono tracking-wider focus:outline-none focus:border-[#FF007F] focus:ring-1 focus:ring-[#FF007F] transition-colors uppercase"
                />
              </div>
            </div>

            {/* Vibrant Magenta Button: CONTINUE → */}
            <button
              type="submit"
              disabled={loading || !teamId.trim()}
              className="w-full py-3.5 px-4 rounded-xl font-bold font-sans text-xs uppercase tracking-wider bg-[#FF007F] hover:bg-[#ff1a8c] text-white shadow-[0_0_25px_rgba(255,0,127,0.4)] hover:shadow-[0_0_30px_rgba(255,0,127,0.6)] transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:hover:shadow-none active:scale-[0.99]"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
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
            className="inline-flex items-center gap-2 text-xs font-sans text-zinc-500 hover:text-[#FF007F] transition-colors"
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Organizer Administration Portal →</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
