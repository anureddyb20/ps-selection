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
      occupied: domainCounts.CSE_AIML.occupied,
      icon: Cpu,
    },
    {
      id: 'ECE' as DomainCategory,
      title: 'ELECTRONICS & COMM',
      sub: 'EC-01 to EC-10 (10 Codes)',
      count: 10,
      slots: 20,
      occupied: domainCounts.ECE.occupied,
      icon: Radio,
    },
    {
      id: 'MECH_CIVIL' as DomainCategory,
      title: 'MECHANICAL & CIVIL',
      sub: 'ME-01 to ME-03 | CE-01 to CE-02',
      count: 5,
      slots: 10,
      occupied: domainCounts.MECH_CIVIL.occupied,
      icon: Wrench,
    },
  ];

  return (
    <div className="ops-panel rounded-2xl p-6 sm:p-7 mb-8 shadow-xl">
      {/* Section Header styled after reference screenshot's ACTIVE OPERATION MODE */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-ops-border mb-6">
        <div>
          <div className="flex items-center gap-2 text-white font-extrabold text-sm sm:text-base uppercase tracking-wider font-mono">
            <Sparkles className="w-4 h-4 text-ops-yellow" />
            <span>ACTIVE DOMAIN TRACK</span>
          </div>
          <p className="text-xs text-ops-textMuted mt-1 font-mono">
            Select the domain category. Codes will display below for your team's reservation.
          </p>
        </div>

        <div className="flex items-center gap-4 text-xs font-mono">
          <div className="flex items-center gap-1.5 text-ops-cyan">
            <Wifi className="w-3.5 h-3.5" />
            <span>VVCE Network Sync</span>
          </div>
          <span className="text-ops-yellow font-bold flex items-center gap-1">
            <span>Realtime Live</span>
            <span className="w-1.5 h-1.5 rounded-full bg-ops-yellow animate-ping" />
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
              className={`text-left p-5 rounded-xl border relative transition-all duration-150 ${
                isSelected
                  ? 'ops-card-active'
                  : 'ops-card hover:border-ops-borderLight'
              }`}
            >
              {/* Reference yellow dot indicator in active card */}
              {isSelected && (
                <span className="absolute top-4 right-4 w-2.5 h-2.5 rounded-full bg-ops-yellow shadow-yellow-glow" />
              )}

              <div className="flex items-center gap-3 mb-2.5">
                <Icon
                  className={`w-5 h-5 ${
                    isSelected ? 'text-ops-yellow' : 'text-ops-textMuted'
                  }`}
                />
                <h3
                  className={`font-mono font-bold text-sm uppercase tracking-wider ${
                    isSelected ? 'text-ops-yellow' : 'text-white'
                  }`}
                >
                  {item.title}
                </h3>
              </div>

              <p className="text-xs text-ops-textMuted font-mono mb-3">{item.sub}</p>

              <div className="pt-2 border-t border-ops-border/60 flex items-center justify-between text-[11px] font-mono">
                <span className="text-slate-400">
                  {item.occupied} / {item.slots} Slots Booked
                </span>
                <span
                  className={
                    remainingSlots > 0 ? 'text-ops-cyan font-semibold' : 'text-ops-magenta font-semibold'
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
