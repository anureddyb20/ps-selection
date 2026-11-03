'use client';

import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { CheckCircle2, Copy, Printer, X, Download, ShieldCheck } from 'lucide-react';

interface SuccessReceiptModalProps {
  data: {
    success: boolean;
    message: string;
    team: {
      team_name: string;
      registration_id: string;
      leader_name: string;
      leader_email: string;
    };
    ps_code: string;
    occupied_count: number;
    selection: {
      id: string;
      selected_at: string;
    };
  } | null;
  onClose: () => void;
}

export default function SuccessReceiptModal({
  data,
  onClose,
}: SuccessReceiptModalProps) {
  useEffect(() => {
    if (data) {
      // Trigger festive celebration confetti
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });
    }
  }, [data]);

  if (!data) return null;

  const handlePrint = () => {
    window.print();
  };

  const copyReference = () => {
    navigator.clipboard.writeText(data.selection.id);
    alert('Selection Reference ID copied to clipboard!');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in print:bg-white print:p-0">
      <div className="relative w-full max-w-lg bg-slate-900 border border-emerald-500/30 rounded-2xl shadow-2xl overflow-hidden print:border-none print:shadow-none print:text-black print:bg-white">
        {/* Top Celebration Header */}
        <div className="p-6 text-center border-b border-slate-800 bg-gradient-to-b from-emerald-500/10 to-transparent">
          <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center mb-3 border border-emerald-500/40">
            <CheckCircle2 className="w-9 h-9" />
          </div>
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 block mb-1">
            Reservation Confirmed
          </span>
          <h2 className="text-2xl font-black text-white tracking-tight print:text-black">
            PS Code Assigned!
          </h2>
          <p className="text-xs text-slate-300 mt-1 max-w-sm mx-auto">
            Your team reservation has been recorded atomically in the VVCE Ideathon database.
          </p>
        </div>

        {/* Receipt Card Body */}
        <div className="p-6 space-y-4">
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 print:bg-slate-50 print:border-slate-200">
            <div className="text-center pb-3 border-b border-slate-800 print:border-slate-300">
              <span className="text-xs text-slate-400 block uppercase font-medium">Selected Problem Statement</span>
              <span className="text-4xl font-black font-mono text-blue-400 tracking-wider my-1 block print:text-blue-600">
                {data.ps_code}
              </span>
              <span className="text-xs text-emerald-400 font-semibold bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                Slot Confirmed ({data.occupied_count} of 2 Teams Assigned)
              </span>
            </div>

            <div className="pt-3 space-y-2 text-xs">
              <div className="flex justify-between items-center py-1 border-b border-slate-800/60 print:border-slate-200">
                <span className="text-slate-400">Team Name:</span>
                <span className="font-bold text-white print:text-black">{data.team.team_name}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-800/60 print:border-slate-200">
                <span className="text-slate-400">Team Registration ID:</span>
                <span className="font-mono font-bold text-white print:text-black">
                  {data.team.registration_id}
                </span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-800/60 print:border-slate-200">
                <span className="text-slate-400">Team Leader:</span>
                <span className="font-medium text-slate-200 print:text-black">{data.team.leader_name}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-800/60 print:border-slate-200">
                <span className="text-slate-400">Leader Email:</span>
                <span className="font-medium text-slate-200 print:text-black">{data.team.leader_email}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-800/60 print:border-slate-200">
                <span className="text-slate-400">Reservation Timestamp:</span>
                <span className="font-mono text-slate-300 print:text-black">
                  {new Date(data.selection.selected_at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
                </span>
              </div>
              <div className="flex justify-between items-center pt-1">
                <span className="text-slate-400">Selection Ref ID:</span>
                <div className="flex items-center gap-1.5 font-mono text-[11px] text-blue-400 font-semibold">
                  <span>{data.selection.id}</span>
                  <button
                    onClick={copyReference}
                    title="Copy Ref ID"
                    className="hover:text-white transition-colors print:hidden"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          <p className="text-[11px] text-slate-400 text-center leading-relaxed">
            Please retain this confirmation receipt for your records. The selection status has been updated across the portal and organizers dashboard in real-time.
          </p>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 pt-2 print:hidden">
            <button
              onClick={handlePrint}
              className="py-2.5 px-4 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-2 transition-colors"
            >
              <Printer className="w-4 h-4" />
              <span>Print Receipt</span>
            </button>

            <button
              onClick={onClose}
              className="flex-1 py-2.5 px-4 rounded-xl font-bold text-xs bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-500/20 transition-all text-center"
            >
              Done & Return to Portal
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

