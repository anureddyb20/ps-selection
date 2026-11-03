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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-lg bg-[#080808] border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden p-6 sm:p-7">
        {/* Top magenta accent line */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#FF007F] to-transparent opacity-90" />

        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800 mb-5">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#FF007F] shadow-[0_0_8px_#FF007F]" />
            <span className="text-[11px] font-mono tracking-widest text-zinc-400 uppercase font-bold">
              CONFIRMATION DESK // SELECTION
            </span>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="p-1.5 rounded-lg text-zinc-500 hover:text-white hover:bg-zinc-900 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Magenta Alert if Error (Reference UI Style) */}
        {errorMessage && (
          <div className="ops-alert-rejected p-4 rounded-xl mb-5 text-xs flex items-start gap-3">
            <AlertTriangle className="w-4 h-4 text-[#FF007F] shrink-0 mt-0.5" />
            <div className="flex-1">
              <span className="font-mono font-bold tracking-wider text-[#FF007F] uppercase text-[10px] block mb-1">
                SELECTION REJECTED
              </span>
              <p className="text-zinc-200 font-sans leading-relaxed">{errorMessage}</p>
            </div>
          </div>
        )}

        {/* Selected Code Showcase */}
        <div className="p-6 rounded-xl bg-[#0d0d0f] border border-zinc-800 mb-5 text-center">
          <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 block mb-1">
            Target Problem Statement
          </span>
          <div className="text-4xl sm:text-5xl font-sans font-black text-white tracking-wider my-2">
            {psItem.ps_code}
          </div>
          <span className="inline-block px-3 py-1 rounded-full text-xs font-mono font-semibold bg-zinc-900 border border-zinc-800 text-zinc-300">
            {psItem.domain}
          </span>
        </div>

        {/* Team Details Summary */}
        <div className="p-4 rounded-xl bg-[#0d0d0f] border border-zinc-800 text-xs font-mono space-y-2.5 mb-6">
          <div className="flex justify-between items-center pb-2 border-b border-zinc-800/80">
            <span className="text-zinc-500">Team Identifier:</span>
            <span className="text-white font-bold">{team.team_id}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-zinc-500">Slot Allocation:</span>
            <span className="text-white font-bold">1 of 2 Max Slots</span>
          </div>
        </div>

        {/* Notice */}
        <p className="text-[11px] font-sans text-zinc-400 mb-6 leading-relaxed">
          ⚠ <strong className="text-zinc-200">Notice:</strong> Each team can select only ONE problem statement. Once confirmed, this selection will be atomically locked in the database and cannot be reversed by the team.
        </p>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="py-3 px-5 rounded-xl border border-zinc-800 bg-[#0d0d0f] text-zinc-400 hover:text-white hover:border-zinc-700 font-sans text-xs font-bold transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirmReservation}
            disabled={loading}
            className="flex-1 py-3 px-5 rounded-xl font-sans font-bold text-xs uppercase tracking-wider bg-[#FF007F] hover:bg-[#ff1a8c] text-white shadow-[0_0_25px_rgba(255,0,127,0.4)] transition-all flex items-center justify-center gap-2 active:scale-[0.99] disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-white" />
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

