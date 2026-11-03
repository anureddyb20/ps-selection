'use client';

import React from 'react';
import { DomainCategory } from '@/lib/types';
import { Sparkles, Wifi, ExternalLink, Cpu, Radio, Wrench } from 'lucide-react';

interface DomainNavProps {
  selectedDomain: DomainCategory;
  onSelectDomain: (domain: DomainCategory) => void;
  domainCounts: {
    CSE_AIML: { total: number; occupied: number };
    ECE: { total: number; occupied: number };
    MECH_CIVIL: { total: number; occupied: number };
  };
}

export default function DomainNav({
  selectedDomain,
  onSelectDomain,
  domainCounts,
}: DomainNavProps) {
  const domains = [
    {
      id: 'CSE_AIML' as DomainCategory,
      title: 'CSE / AIML',
      sub: 'CS-01 to CS-15 (15 Codes)',
      count: 15,
      slots: 30,
      occupied: domainCounts?.CSE_AIML?.occupied ?? 0,
      icon: Cpu,
    },
    {
      id: 'ECE' as DomainCategory,
      title: 'ELECTRONICS & COMM',
      sub: 'EC-01 to EC-10 (10 Codes)',
      count: 10,
      slots: 20,
      occupied: domainCounts?.ECE?.occupied ?? 0,
      icon: Radio,
    },
    {
      id: 'MECH_CIVIL' as DomainCategory,
      title: 'MECHANICAL & CIVIL',
      sub: 'ME-01 to ME-03 | CE-01 to CE-02',
      count: 5,
      slots: 10,
      occupied: domainCounts?.MECH_CIVIL?.occupied ?? 0,
      icon: Wrench,
    },
  ];

  return (
    <div className="bg-[#080808] border border-zinc-800/80 rounded-2xl p-6 sm:p-7 mb-8 shadow-2xl relative overflow-hidden">
      {/* Top subtle highlight */}
      <div className="absolute top-0 left-6 right-6 h-[1px] bg-gradient-to-r from-transparent via-[#FF007F]/40 to-transparent" />

      {/* Section Header styled after reference screenshot's ACTIVE OPERATION MODE */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-zinc-800/80 mb-6">
        <div>
          <div className="flex items-center gap-2 text-white font-black text-sm sm:text-base uppercase tracking-tight font-sans">
            <Sparkles className="w-4 h-4 text-[#FF007F]" />
            <span>ACTIVE DOMAIN TRACK</span>
          </div>
          <p className="text-xs text-zinc-400 mt-1 font-sans">
            Select the domain category. Codes will display below for your team's reservation.
          </p>
        </div>

        <div className="flex items-center gap-4 text-xs font-mono">
          <div className="flex items-center gap-2 text-zinc-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_#34d399]" />
            <span>Vice Verse Network Sync</span>
          </div>
          <span className="text-[#FF007F] font-bold flex items-center gap-1.5">
            <span>Live Feed</span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#FF007F] animate-ping" />
          </span>
        </div>
      </div>

      {/* Outlined rectangular cards matching reference screenshot */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {domains.map((item) => {
          const Icon = item.icon;
          const isSelected = selectedDomain === item.id;
          const remainingSlots = item.slots - item.occupied;

          return (
            <button
              key={item.id}
              onClick={() => onSelectDomain(item.id)}
              className={`text-left p-5 rounded-xl border relative transition-all duration-200 ${
                isSelected
                  ? 'bg-[#12040a] border-2 border-[#FF007F] shadow-[0_0_25px_rgba(255,0,127,0.35)]'
                  : 'bg-[#0d0d0f] border-zinc-800 hover:border-zinc-700 hover:bg-[#141417]'
              }`}
            >
              {/* Reference magenta dot indicator in active card */}
              {isSelected && (
                <span className="absolute top-4 right-4 w-2.5 h-2.5 rounded-full bg-[#FF007F] shadow-[0_0_10px_#FF007F]" />
              )}

              <div className="flex items-center gap-3 mb-2.5">
                <Icon
                  className={`w-5 h-5 ${
                    isSelected ? 'text-[#FF007F]' : 'text-zinc-500'
                  }`}
                />
                <h3
                  className={`font-sans font-black text-sm uppercase tracking-wider ${
                    isSelected ? 'text-white' : 'text-zinc-200'
                  }`}
                >
                  {item.title}
                </h3>
              </div>

              <p className="text-xs text-zinc-400 font-mono mb-3">{item.sub}</p>

              <div className="pt-2.5 border-t border-zinc-800/80 flex items-center justify-between text-[11px] font-mono">
                <span className="text-zinc-500">
                  {item.occupied} / {item.slots} Slots Booked
                </span>
                <span
                  className={
                    remainingSlots > 0 ? 'text-[#FF007F] font-bold' : 'text-zinc-600 font-medium'
                  }
                >
                  {remainingSlots > 0 ? `${remainingSlots} Available` : 'Full'}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

