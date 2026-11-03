'use client';

import React, { useState } from 'react';
import { PublicPSItem, TeamPublicProfile } from '@/lib/types';
import { X, CheckCircle2, AlertTriangle, ShieldCheck, Loader2, ArrowRight } from 'lucide-react';

interface SelectionConfirmModalProps {
  psItem: PublicPSItem | null;
  team: TeamPublicProfile;
  onClose: () => void;
  onSuccess: (receipt: any) => void;
}

export default function SelectionConfirmModal({
  psItem,
  team,
  onClose,
  onSuccess,
}: SelectionConfirmModalProps) {
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!psItem) return null;

  const handleConfirmReservation = async () => {
    setLoading(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/reserve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ps_code: psItem.ps_code,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setErrorMessage(data.message || 'Selection failed. Please try another code.');
        setLoading(false);
        return;
      }

      onSuccess(data);
    } catch (err) {
      console.error('Reservation error:', err);
      setErrorMessage('Network or server communication error. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-lg ops-panel border border-ops-border rounded-2xl shadow-2xl overflow-hidden p-6 sm:p-7">
        {/* Top cyan accent line */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-ops-cyan via-ops-yellow to-ops-cyan" />

        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-ops-border mb-5">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono tracking-widest text-ops-cyan uppercase">
              CONFIRMATION DESK // SELECTION
            </span>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="p-1 rounded-lg text-ops-textMuted hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Magenta Alert if Error (Reference UI Style) */}
        {errorMessage && (
          <div className="ops-alert-rejected p-4 rounded-xl mb-5 text-xs flex items-start gap-3">
            <AlertTriangle className="w-4 h-4 text-ops-magenta shrink-0 mt-0.5" />
            <div className="flex-1">
              <span className="font-mono font-bold tracking-wider text-ops-magenta uppercase text-[10px] block mb-1">
                SELECTION REJECTED
              </span>
              <p className="text-slate-200 font-sans leading-relaxed">{errorMessage}</p>
            </div>
          </div>
        )}

        {/* Selected Code Showcase */}
        <div className="p-5 rounded-xl bg-ops-card border border-ops-border mb-5 text-center">
          <span className="text-[10px] font-mono uppercase tracking-widest text-ops-textMuted block mb-1">
            Target Problem Statement
          </span>
          <div className="text-4xl sm:text-5xl font-mono font-black text-ops-yellow tracking-wider my-2">
            {psItem.ps_code}
          </div>
          <span className="inline-block px-3 py-1 rounded-full text-xs font-mono font-semibold ops-badge-cyan">
            {psItem.domain}
          </span>
        </div>

        {/* Team Details Summary */}
        <div className="p-4 rounded-xl bg-ops-panel border border-ops-border text-xs font-mono space-y-2.5 mb-6">
          <div className="flex justify-between items-center pb-2 border-b border-ops-border/60">
            <span className="text-ops-textMuted">Team Identifier:</span>
            <span className="text-white font-bold">{team.team_id}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-ops-textMuted">Slot Allocation:</span>
            <span className="text-ops-yellow font-bold">1 of 2 Max Slots</span>
          </div>
        </div>

        {/* Notice */}
        <p className="text-[11px] font-mono text-slate-400 mb-6 leading-relaxed">
          ⚠ <strong className="text-slate-200">Notice:</strong> Each team can select only ONE problem statement. Once confirmed, this selection will be atomically locked in the database and cannot be reversed by the team.
        </p>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="py-3 px-4 rounded-xl border border-ops-border bg-ops-card text-ops-textMuted hover:text-white font-mono text-xs font-bold transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirmReservation}
            disabled={loading}
            className="flex-1 py-3 px-4 rounded-xl font-mono font-bold text-xs uppercase tracking-wider bg-ops-yellow hover:bg-yellow-400 text-slate-950 shadow-yellow-glow transition-all flex items-center justify-center gap-2 active:scale-[0.99] disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                <span>Locking Reservation...</span>
              </>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4" />
                <span>Confirm Reservation</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

