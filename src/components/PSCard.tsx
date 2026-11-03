'use client';

import React from 'react';
import { PublicPSItem } from '@/lib/types';
import { CheckCircle2, AlertCircle, XCircle, ArrowRight, ShieldCheck } from 'lucide-react';

interface PSCardProps {
  item: PublicPSItem;
  onSelect: (item: PublicPSItem) => void;
  selectionOpen: boolean;
  teamAlreadySelected: boolean;
}

export default function PSCard({
  item,
  onSelect,
  selectionOpen,
  teamAlreadySelected,
}: PSCardProps) {
  const isFull = item.occupied_count >= item.max_teams;
  const isOneSlotLeft = item.occupied_count === 1;
  const canSelect = item.is_available && selectionOpen && !isFull && !teamAlreadySelected;

  return (
    <div
      className={`ops-card rounded-xl p-5 border flex flex-col justify-between transition-all ${
        isFull
          ? 'opacity-60 border-ops-border/60'
          : isOneSlotLeft
          ? 'border-ops-yellow/30 hover:border-ops-yellow/60'
          : 'hover:border-ops-cyan/50'
      }`}
    >
      <div>
        {/* Card Header: PS Code & Status */}
        <div className="flex items-center justify-between gap-3 mb-4">
          <span className="text-2xl sm:text-3xl font-mono font-black tracking-wider text-white">
            {item.ps_code}
          </span>

          {/* Status Badge */}
          {isFull ? (
            <span className="ops-badge-magenta px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold uppercase tracking-wider flex items-center gap-1">
              <XCircle className="w-3 h-3" />
              <span>FULL</span>
            </span>
          ) : isOneSlotLeft ? (
            <span className="ops-badge-yellow px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold uppercase tracking-wider flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              <span>ONE SLOT LEFT</span>
            </span>
          ) : (
            <span className="ops-badge-cyan px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold uppercase tracking-wider flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              <span>AVAILABLE</span>
            </span>
          )}
        </div>

        {/* Slot Progress */}
        <div className="p-3 rounded-lg bg-ops-panel border border-ops-border/60 mb-5">
          <div className="flex items-center justify-between text-xs font-mono mb-2">
            <span className="text-ops-textMuted">Occupancy</span>
            <span
              className={`font-bold ${
                isFull
                  ? 'text-ops-magenta'
                  : isOneSlotLeft
                  ? 'text-ops-yellow'
                  : 'text-ops-cyan'
              }`}
            >
              {item.occupied_count} / {item.max_teams} Teams
            </span>
          </div>

          {/* 2-slot indicator blocks */}
          <div className="grid grid-cols-2 gap-1.5">
            {Array.from({ length: item.max_teams }).map((_, idx) => {
              const filled = idx < item.occupied_count;
              return (
                <div
                  key={idx}
                  className={`h-2 rounded-sm transition-all ${
                    filled
                      ? isFull
                        ? 'bg-ops-magenta'
                        : 'bg-ops-yellow'
                      : 'bg-ops-border'
                  }`}
                />
              );
            })}
          </div>
        </div>
      </div>

      {/* Action Button */}
      <div>
        {canSelect ? (
          <button
            onClick={() => onSelect(item)}
            className="w-full py-2.5 px-4 rounded-xl font-mono font-bold text-xs uppercase tracking-wider bg-ops-cyan/15 hover:bg-ops-cyan text-ops-cyan hover:text-slate-950 border border-ops-cyan/40 hover:border-ops-cyan transition-all flex items-center justify-center gap-2 group active:scale-[0.99]"
          >
            <span>SELECT CODE</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </button>
        ) : isFull ? (
          <button
            disabled
            className="w-full py-2.5 px-4 rounded-xl font-mono text-xs uppercase tracking-wider bg-ops-panel text-slate-600 border border-ops-border/40 cursor-not-allowed flex items-center justify-center gap-1.5"
          >
            <span>CAPACITY REACHED</span>
          </button>
        ) : teamAlreadySelected ? (
          <button
            disabled
            className="w-full py-2.5 px-4 rounded-xl font-mono text-xs uppercase tracking-wider bg-ops-panel text-slate-500 border border-ops-border/40 cursor-not-allowed flex items-center justify-center gap-1.5"
          >
            <span>LOCKED (1 PS LIMIT)</span>
          </button>
        ) : (
          <button
            disabled
            className="w-full py-2.5 px-4 rounded-xl font-mono text-xs uppercase tracking-wider bg-ops-panel text-slate-500 border border-ops-border/40 cursor-not-allowed flex items-center justify-center gap-1.5"
          >
            <span>DESK PAUSED</span>
          </button>
        )}
      </div>
    </div>
  );
}
