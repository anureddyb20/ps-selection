'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Shield, Eye, EyeOff, Lock, User, ArrowRight, Loader2, AlertCircle, Sparkles, KeyRound } from 'lucide-react';
import { TeamPublicProfile } from '@/lib/types';

interface TeamLoginProps {
  onLoginSuccess: (team: TeamPublicProfile) => void;
}

export default function TeamLogin({ onLoginSuccess }: TeamLoginProps) {
  const [teamId, setTeamId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setLoading(true);

    try {
      const res = await fetch('/api/auth/team/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          team_id: teamId.trim(),
          password: password.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setErrorMessage(data.message || 'Invalid Team ID or password. Access denied.');
        setLoading(false);
        return;
      }

      onLoginSuccess(data.team);
    } catch (err) {
      console.error('Sign-in error:', err);
      setErrorMessage('Network connection error. Please try again.');
      setLoading(false);
    }
  };

  const handleQuickFill = (id: string) => {
    setTeamId(id);
    setPassword('vvce@2026');
    setErrorMessage(null);
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Top Tagline */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-ops-cyan/10 border border-ops-cyan/30 text-ops-cyan text-[11px] font-mono tracking-widest uppercase mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            <span>VVCE IDEATHON 2026 // AUTH DESK</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight uppercase">
            Team Access
          </h1>
          <p className="text-xs text-ops-textMuted mt-2 font-mono">
            Enter assigned team credentials to access Problem Statement Selection.
          </p>
        </div>

        {/* Login Panel */}
        <div className="ops-panel rounded-2xl p-7 sm:p-8 relative shadow-2xl">
          {/* Cyan top accent line */}
          <div className="absolute top-0 left-6 right-6 h-[2px] bg-gradient-to-r from-transparent via-ops-cyan to-transparent opacity-80" />

          {/* Magenta Alert Box (Reference UI Style) */}
          {errorMessage && (
            <div className="ops-alert-rejected p-4 rounded-xl mb-6 text-xs flex items-start gap-3">
              <div className="p-1.5 rounded-lg bg-ops-magenta/20 text-ops-magenta shrink-0 mt-0.5">
                <AlertCircle className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono font-bold tracking-wider text-ops-magenta uppercase text-[10px]">
                    AUTHENTICATION REJECTED
                  </span>
                </div>
                <p className="text-slate-200 leading-relaxed font-sans">{errorMessage}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Team ID */}
            <div>
              <label className="block text-[11px] font-mono uppercase tracking-wider text-ops-cyan mb-2">
                Team Identifier
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-ops-textMuted absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  placeholder="e.g. TEAM-101"
                  value={teamId}
                  onChange={(e) => setTeamId(e.target.value.toUpperCase())}
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-ops-card border border-ops-border text-white placeholder-slate-600 text-sm font-mono focus:outline-none focus:border-ops-cyan focus:ring-1 focus:ring-ops-cyan transition-colors"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-[11px] font-mono uppercase tracking-wider text-ops-cyan">
                  Access Key / Password
                </label>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-ops-textMuted absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-11 py-3 rounded-xl bg-ops-card border border-ops-border text-white placeholder-slate-600 text-sm font-mono focus:outline-none focus:border-ops-cyan focus:ring-1 focus:ring-ops-cyan transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-ops-textMuted hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-4 rounded-xl font-bold font-mono text-xs uppercase tracking-wider bg-ops-cyan hover:bg-cyan-300 text-slate-950 shadow-cyan-glow transition-all flex items-center justify-center gap-2 disabled:opacity-50 active:scale-[0.99] mt-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                  <span>Verifying Credentials...</span>
                </>
              ) : (
                <>
                  <span>Sign In To Selection Desk</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Credentials Pill */}
          <div className="mt-6 pt-5 border-t border-ops-border text-center">
            <span className="text-[10px] font-mono uppercase tracking-widest text-ops-textMuted block mb-2">
              Demo Team Accounts (Pre-configured)
            </span>
            <div className="flex flex-wrap justify-center gap-2">
              {['TEAM-101', 'TEAM-102', 'TEAM-201', 'TEAM-301'].map((id) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => handleQuickFill(id)}
                  className="px-2.5 py-1 rounded-lg bg-ops-card border border-ops-border text-[11px] font-mono text-ops-cyan hover:border-ops-cyan transition-colors"
                >
                  {id}
                </button>
              ))}
            </div>
            <span className="text-[10px] text-slate-500 font-mono block mt-1.5">
              Default password: <code className="text-slate-400">vvce@2026</code>
            </span>
          </div>
        </div>

        {/* Bottom link to Organizer Login */}
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

