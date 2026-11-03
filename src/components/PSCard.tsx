'use client';

import React from 'react';
import { PublicPSItem } from '@/lib/types';
import { CheckCircle2, AlertCircle, XCircle, ArrowRight } from 'lucide-react';

interface PSCardProps {
  item: PublicPSItem;
  onSelect: (item: PublicPSItem) => void;
  selectionOpen: boolean;
}

export default function PSCard({ item, onSelect, selectionOpen }: PSCardProps) {
  const isFull = item.occupied_count >= item.max_teams;
  const isOneSlotLeft = item.occupied_count === 1;
  const canSelect = item.is_available && selectionOpen && !isFull;

  return (
    <div
      className={`relative rounded-2xl p-6 transition-all duration-200 border flex flex-col justify-between ${
        isFull
          ? 'bg-slate-900/40 border-slate-800/60 opacity-80'
          : isOneSlotLeft
          ? 'bg-slate-900/80 border-amber-500/30 hover:border-amber-500/60 shadow-lg shadow-amber-500/5'
          : 'bg-slate-900/80 border-slate-800 hover:border-blue-500/50 hover:bg-slate-900 shadow-md hover:shadow-blue-500/10'
      }`}
    >
      {/* Top Header: PS Code & Status */}
      <div>
        <div className="flex items-center justify-between gap-3 mb-4">
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black tracking-tight text-white font-mono">
              {item.ps_code}
            </span>
          </div>

          {/* Status Badge */}
          {isFull ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-rose-500/15 text-rose-400 border border-rose-500/30">
              <XCircle className="w-3.5 h-3.5" />
              <span>FULL</span>
            </span>
          ) : isOneSlotLeft ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-500/15 text-amber-300 border border-amber-500/30 animate-pulse">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>ONE SLOT LEFT</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>AVAILABLE</span>
            </span>
          )}
        </div>

        {/* Slot Progress Bar and Counter */}
        <div className="my-5 p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80">
          <div className="flex items-center justify-between text-xs font-medium mb-2.5">
            <span className="text-slate-400">Team Slots:</span>
            <span
              className={`font-mono font-bold ${
                isFull
                  ? 'text-rose-400'
                  : isOneSlotLeft
                  ? 'text-amber-300'
                  : 'text-emerald-400'
              }`}
            >
              {item.occupied_count} / {item.max_teams} Teams
            </span>
          </div>

          {/* Visual slot indicator blocks */}
          <div className="grid grid-cols-2 gap-2">
            {Array.from({ length: item.max_teams }).map((_, index) => {
              const isOccupied = index < item.occupied_count;
              return (
                <div
                  key={index}
                  className={`h-2.5 rounded-full transition-all duration-300 ${
                    isOccupied
                      ? isFull
                        ? 'bg-rose-500'
                        : 'bg-amber-400'
                      : 'bg-slate-800'
                  }`}
                />
              );
            })}
          </div>
        </div>
      </div>

      {/* Action Selection Button */}
      <div className="mt-2">
        {canSelect ? (
          <button
            onClick={() => onSelect(item)}
            className="w-full py-3 px-4 rounded-xl font-bold text-sm bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-md shadow-blue-500/20 hover:shadow-blue-500/30 transition-all flex items-center justify-center gap-2 group active:scale-[0.99]"
          >
            <span>SELECT</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        ) : isFull ? (
          <button
            disabled
            className="w-full py-3 px-4 rounded-xl font-bold text-sm bg-slate-800/60 text-slate-400 border border-slate-700/50 cursor-not-allowed flex items-center justify-center gap-2"
          >
            <span>FULL (0 SLOTS)</span>
          </button>
        ) : (
          <button
            disabled
            className="w-full py-3 px-4 rounded-xl font-bold text-sm bg-slate-800/60 text-slate-400 border border-slate-700/50 cursor-not-allowed flex items-center justify-center gap-2"
          >
            <span>SELECTION PAUSED</span>
          </button>
        )}
      </div>
    </div>
  );
}

