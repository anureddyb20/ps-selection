import React from 'react';
import Link from 'next/link';
import { Cpu, Shield, Award, MapPin } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="border-t border-slate-800 bg-slate-950 mt-auto py-12 text-slate-400 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand info */}
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold">
                <Cpu className="w-4 h-4" />
              </div>
              <span className="text-white font-bold text-sm tracking-tight">
                VVCE IDEATHON 2026
              </span>
            </div>
            <p className="text-slate-400 max-w-md leading-relaxed">
              Vidyavardhaka College of Engineering (VVCE), Mysuru. Autonomous institute affiliated to Visvesvaraya Technological University, Belagavi. Approved by AICTE, Accredited by NAAC with 'A' Grade & NBA.
            </p>
            <div className="flex items-center gap-1.5 text-slate-400">
              <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>Gokulam 3rd Stage, Mysuru, Karnataka 570002</span>
            </div>
          </div>

          {/* Guidelines */}
          <div>
            <h4 className="text-white font-semibold mb-3 uppercase tracking-wider text-[11px]">
              Selection Rules
            </h4>
            <ul className="space-y-2">
              <li>• Max 2 Teams per Problem Statement</li>
              <li>• 1 PS Code selection per Team</li>
              <li>• First-Come, First-Served basis</li>
              <li>• Selections are atomically locked</li>
              <li>• Instant multi-user real-time sync</li>
            </ul>
          </div>

          {/* Quick links */}
          <div>
            <h4 className="text-white font-semibold mb-3 uppercase tracking-wider text-[11px]">
              Portal Navigation
            </h4>
            <ul className="space-y-2">
              <li>
                <a href="#explore-domains" className="hover:text-white transition-colors">
                  Explore Problem Statements
                </a>
              </li>
              <li>
                <a href="#selection-process" className="hover:text-white transition-colors">
                  Selection Guidelines
                </a>
              </li>
              <li>
                <Link href="/admin" className="hover:text-blue-400 flex items-center gap-1 transition-colors">
                  <Shield className="w-3 h-3 text-blue-400" />
                  <span>Organizer Admin Login</span>
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-4 text-slate-400">
          <p>© 2026 Vidyavardhaka College of Engineering. All rights reserved.</p>
          <p className="flex items-center gap-2">
            <span>Powered by Next.js & PostgreSQL</span>
          </p>
        </div>
      </div>
    </footer>
  );
}

