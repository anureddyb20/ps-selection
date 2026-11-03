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

  const handleCardClick = (e: React.MouseEvent) => {
    if (canSelect) {
      e.stopPropagation();
      onSelect(item);
    }
  };

  return (
    <div
      onClick={handleCardClick}
      className={`rounded-xl p-5 border flex flex-col justify-between transition-all bg-[#0d0d0f] ${
        canSelect
          ? 'cursor-pointer hover:border-[#FF007F]/70 hover:shadow-[0_0_20px_rgba(255,0,127,0.18)]'
          : ''
      } ${
        isFull
          ? 'opacity-60 border-zinc-800'
          : isOneSlotLeft
          ? 'border-[#FF007F]/40 shadow-[0_0_15px_rgba(255,0,127,0.08)]'
          : 'border-zinc-800 hover:border-zinc-700'
      }`}
    >
      <div>
        {/* Card Header: PS Code & Status */}
        <div className="flex items-center justify-between gap-3 mb-4">
          <span
            onClick={handleCardClick}
            className={`text-2xl sm:text-3xl font-mono font-black tracking-wider text-white ${
              canSelect ? 'hover:text-[#FF007F] transition-colors cursor-pointer' : ''
            }`}
          >
            {item.ps_code}
          </span>

          {/* Status Badge */}
          {isFull ? (
            <span className="px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold uppercase tracking-wider flex items-center gap-1 bg-zinc-900 border border-zinc-800 text-zinc-500">
              <XCircle className="w-3 h-3" />
              <span>FULL</span>
            </span>
          ) : isOneSlotLeft ? (
            <span className="px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold uppercase tracking-wider flex items-center gap-1 bg-[#FF007F]/12 border border-[#FF007F]/40 text-[#FF007F]">
              <AlertCircle className="w-3 h-3" />
              <span>ONE SLOT LEFT</span>
            </span>
          ) : (
            <span className="px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold uppercase tracking-wider flex items-center gap-1 bg-white/5 border border-zinc-700/60 text-zinc-300">
              <CheckCircle2 className="w-3 h-3" />
              <span>AVAILABLE</span>
            </span>
          )}
        </div>

        {/* Slot Progress */}
        <div className="p-3 rounded-lg bg-[#080808] border border-zinc-800/80 mb-5">
          <div className="flex items-center justify-between text-xs font-mono mb-2">
            <span className="text-zinc-500">Occupancy</span>
            <span
              className={`font-bold ${
                isFull
                  ? 'text-zinc-500'
                  : isOneSlotLeft
                  ? 'text-[#FF007F]'
                  : 'text-white'
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
                        ? 'bg-zinc-600'
                        : 'bg-[#FF007F] shadow-[0_0_8px_rgba(255,0,127,0.5)]'
                      : 'bg-zinc-800'
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
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onSelect(item);
            }}
            className="w-full py-2.5 px-4 rounded-xl font-sans font-bold text-xs uppercase tracking-wider bg-[#FF007F] hover:bg-[#ff1a8c] text-white shadow-[0_0_20px_rgba(255,0,127,0.35)] hover:shadow-[0_0_25px_rgba(255,0,127,0.5)] transition-all flex items-center justify-center gap-2 group active:scale-[0.99]"
          >
            <span>SELECT CODE</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </button>
        ) : isFull ? (
          <button
            type="button"
            disabled
            className="w-full py-2.5 px-4 rounded-xl font-sans text-xs uppercase tracking-wider bg-[#080808] text-zinc-600 border border-zinc-800/60 cursor-not-allowed flex items-center justify-center gap-1.5"
          >
            <span>CAPACITY REACHED</span>
          </button>
        ) : teamAlreadySelected ? (
          <button
            type="button"
            disabled
            className="w-full py-2.5 px-4 rounded-xl font-sans text-xs uppercase tracking-wider bg-[#080808] text-zinc-600 border border-zinc-800/60 cursor-not-allowed flex items-center justify-center gap-1.5"
          >
            <span>LOCKED (1 PS LIMIT)</span>
          </button>
        ) : (
          <button
            type="button"
            disabled
            className="w-full py-2.5 px-4 rounded-xl font-sans text-xs uppercase tracking-wider bg-[#080808] text-zinc-600 border border-zinc-800/60 cursor-not-allowed flex items-center justify-center gap-1.5"
          >
            <span>DESK PAUSED</span>
          </button>
        )}
      </div>
    </div>
  );
}
