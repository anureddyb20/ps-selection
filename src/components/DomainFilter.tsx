'use client';

import React from 'react';
import { DomainCategory } from '@/lib/types';
import { Cpu, Radio, Wrench, CheckCircle } from 'lucide-react';

interface DomainFilterProps {
  selectedDomain: DomainCategory;
  onSelectDomain: (domain: DomainCategory) => void;
  domainCounts: {
    CSE_AIML: { total: number; occupied: number };
    ECE: { total: number; occupied: number };
    MECH_CIVIL: { total: number; occupied: number };
  };
}

export default function DomainFilter({
  selectedDomain,
  onSelectDomain,
  domainCounts,
}: DomainFilterProps) {
  const domains = [
    {
      id: 'CSE_AIML' as DomainCategory,
      title: 'CSE / AIML',
      sub: 'Computer Science & AI / ML',
      codeRange: 'CS-01 to CS-15',
      count: 15,
      slots: 30,
      occupied: domainCounts.CSE_AIML.occupied,
      icon: Cpu,
      color: 'blue',
      borderColor: 'border-blue-500/40',
      activeBg: 'bg-blue-600/20 border-blue-500 shadow-blue-500/20',
      badgeColor: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
    },
    {
      id: 'ECE' as DomainCategory,
      title: 'Electronics & Communication',
      sub: 'ECE, Embedded Systems & IoT',
      codeRange: 'EC-01 to EC-10',
      count: 10,
      slots: 20,
      occupied: domainCounts.ECE.occupied,
      icon: Radio,
      color: 'indigo',
      borderColor: 'border-indigo-500/40',
      activeBg: 'bg-indigo-600/20 border-indigo-500 shadow-indigo-500/20',
      badgeColor: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30',
    },
    {
      id: 'MECH_CIVIL' as DomainCategory,
      title: 'Mechanical & Civil',
      sub: 'Mech (3 Codes) + Civil (2 Codes)',
      codeRange: 'ME-01 to ME-03 | CE-01 to CE-02',
      count: 5,
      slots: 10,
      occupied: domainCounts.MECH_CIVIL.occupied,
      icon: Wrench,
      color: 'amber',
      borderColor: 'border-amber-500/40',
      activeBg: 'bg-amber-600/20 border-amber-500 shadow-amber-500/20',
      badgeColor: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    },
  ];

  return (
    <div id="explore-domains" className="scroll-mt-20">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Select Your Domain</h2>
          <p className="text-sm text-slate-400">
            Choose your engineering department to view available PS codes and reserve a slot.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {domains.map((domain) => {
          const Icon = domain.icon;
          const isSelected = selectedDomain === domain.id;
          const remainingSlots = domain.slots - domain.occupied;

          return (
            <button
              key={domain.id}
              onClick={() => onSelectDomain(domain.id)}
              className={`text-left p-6 rounded-2xl border transition-all duration-200 relative group flex flex-col justify-between ${
                isSelected
                  ? `${domain.activeBg} shadow-lg ring-2 ring-blue-500/50`
                  : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
              }`}
            >
              {/* Selected indicator check */}
              {isSelected && (
                <div className="absolute top-4 right-4 text-blue-400 bg-blue-500/20 rounded-full p-1 border border-blue-500/40">
                  <CheckCircle className="w-4 h-4" />
                </div>
              )}

              <div>
                <div className="flex items-center gap-3 mb-3">
                  <div className={`p-2.5 rounded-xl ${domain.badgeColor} border`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      {domain.count} PS Codes
                    </span>
                    <h3 className="text-lg font-bold text-white group-hover:text-blue-300 transition-colors">
                      {domain.title}
                    </h3>
                  </div>
                </div>

                <p className="text-xs text-slate-300 mb-4">{domain.sub}</p>
                <div className="text-[11px] font-mono text-slate-400 bg-slate-950/60 px-2.5 py-1.5 rounded-lg border border-slate-800/80 mb-4 inline-block">
                  {domain.codeRange}
                </div>
              </div>

              {/* Slots Bar */}
              <div className="w-full pt-4 border-t border-slate-800/60 mt-2">
                <div className="flex justify-between items-center text-xs mb-2">
                  <span className="text-slate-400 font-medium">Slots Occupied:</span>
                  <span className="font-semibold text-slate-200">
                    {domain.occupied} / {domain.slots} Slots
                  </span>
                </div>
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      domain.occupied >= domain.slots
                        ? 'bg-rose-500'
                        : domain.occupied > 0
                        ? 'bg-amber-400'
                        : 'bg-emerald-400'
                    }`}
                    style={{
                      width: `${Math.min(100, (domain.occupied / domain.slots) * 100)}%`,
                    }}
                  />
                </div>
                <div className="flex justify-between items-center text-[11px] text-slate-400 mt-2">
                  <span>{domain.count} Problem Statements</span>
                  <span className={remainingSlots > 0 ? 'text-emerald-400 font-medium' : 'text-rose-400 font-semibold'}>
                    {remainingSlots > 0 ? `${remainingSlots} slots available` : 'Full'}
                  </span>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

