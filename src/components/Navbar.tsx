'use client';

import React from 'react';
import Link from 'next/link';
import { Shield, Sparkles, Layers, Lock, Cpu } from 'lucide-react';

interface NavbarProps {
  selectionOpen: boolean;
  portalPublished: boolean;
}

export default function Navbar({ selectionOpen, portalPublished }: NavbarProps) {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800 bg-slate-950/85 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Left Branding */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 via-indigo-600 to-amber-500 flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-transform">
            <Cpu className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg tracking-tight text-white group-hover:text-blue-400 transition-colors">
                VVCE IDEATHON
              </span>
              <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                2026
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium hidden sm:block">
              Problem Statement Selection Portal
            </p>
          </div>
        </Link>

        {/* Center Status Indicators */}
        <div className="hidden md:flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-xs">
            <span
              className={`w-2 h-2 rounded-full ${
                selectionOpen && portalPublished
                  ? 'bg-emerald-400 animate-pulse'
                  : 'bg-rose-400'
              }`}
            />
            <span className="text-slate-300 font-medium">
              {selectionOpen && portalPublished ? 'Selection Live' : 'Selection Paused'}
            </span>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 font-medium">
            <Layers className="w-3.5 h-3.5" />
            <span>Strict 2 Teams / PS</span>
          </div>
        </div>

        {/* Right CTA / Admin link */}
        <div className="flex items-center gap-3">
          <a
            href="#explore-domains"
            className="hidden sm:inline-flex text-xs font-semibold px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white transition-colors shadow-sm"
          >
            Explore PS Codes
          </a>

          <Link
            href="/admin"
            className="flex items-center gap-1.5 text-xs font-medium px-3.5 py-2 rounded-lg border border-slate-800 bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white transition-colors"
          >
            <Shield className="w-3.5 h-3.5 text-blue-400" />
            <span>Admin Portal</span>
          </Link>
        </div>
      </div>
    </header>
  );
}

