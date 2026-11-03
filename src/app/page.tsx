'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Navbar from '@/components/Navbar';
import Hero from '@/components/Hero';
import DomainFilter from '@/components/DomainFilter';
import PSCard from '@/components/PSCard';
import RegistrationModal from '@/components/RegistrationModal';
import SuccessReceiptModal from '@/components/SuccessReceiptModal';
import Footer from '@/components/Footer';
import { PublicPSItem, DomainCategory } from '@/lib/types';
import {
  AlertTriangle,
  CheckCircle2,
  Lock,
  Layers,
  Sparkles,
  ArrowRight,
  ShieldAlert,
  Search,
} from 'lucide-react';

export default function HomePage() {
  const [problemStatements, setProblemStatements] = useState<PublicPSItem[]>([]);
  const [portalPublished, setPortalPublished] = useState(true);
  const [selectionOpen, setSelectionOpen] = useState(true);
  const [stats, setStats] = useState({
    total_codes: 30,
    total_slots: 60,
    reserved_slots: 0,
    remaining_slots: 60,
  });

  const [selectedDomain, setSelectedDomain] = useState<DomainCategory>('CSE_AIML');
  const [searchFilter, setSearchFilter] = useState('');
  const [activeModalItem, setActiveModalItem] = useState<PublicPSItem | null>(null);
  const [successReceipt, setSuccessReceipt] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch data
  const fetchData = async () => {
    try {
      const res = await fetch('/api/ps-codes', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setProblemStatements(data.problem_statements || []);
        setPortalPublished(data.portal_published !== false);
        setSelectionOpen(data.selection_open !== false);
        if (data.stats) {
          setStats(data.stats);
        }
      }
    } catch (err) {
      console.error('Error fetching PS codes:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    // Setup Realtime Server-Sent Events (SSE) listener for instantaneous multi-browser sync
    const eventSource = new EventSource('/api/realtime');

    eventSource.addEventListener('update', (e) => {
      // Instant reload of data on any remote selection or admin change
      fetchData();
    });

    eventSource.onerror = () => {
      // In case of disconnection, fallback to polling
      eventSource.close();
    };

    // Lightweight fallback polling every 6 seconds
    const interval = setInterval(fetchData, 6000);

    return () => {
      eventSource.close();
      clearInterval(interval);
    };
  }, []);

  // Compute Domain slot statistics
  const domainCounts = useMemo(() => {
    const getDomainOccupied = (domain: DomainCategory) => {
      return problemStatements
        .filter((p) => p.domain === domain)
        .reduce((sum, item) => sum + item.occupied_count, 0);
    };

    return {
      CSE_AIML: { total: 15, occupied: getDomainOccupied('CSE_AIML') },
      ECE: { total: 10, occupied: getDomainOccupied('ECE') },
      MECH_CIVIL: { total: 5, occupied: getDomainOccupied('MECH_CIVIL') },
    };
  }, [problemStatements]);

  // Filter items by domain and optional search
  const filteredItems = useMemo(() => {
    return problemStatements.filter((item) => {
      const matchesDomain = item.domain === selectedDomain;
      const matchesSearch = searchFilter
        ? item.ps_code.toLowerCase().includes(searchFilter.toLowerCase().trim())
        : true;
      return matchesDomain && matchesSearch;
    });
  }, [problemStatements, selectedDomain, searchFilter]);

  // Mechanical and Civil split
  const mechanicalItems = useMemo(() => {
    return filteredItems.filter((item) => item.sub_domain === 'MECHANICAL');
  }, [filteredItems]);

  const civilItems = useMemo(() => {
    return filteredItems.filter((item) => item.sub_domain === 'CIVIL');
  }, [filteredItems]);

  const handleSelectPS = (item: PublicPSItem) => {
    setActiveModalItem(item);
  };

  const handleSuccessReservation = (receiptData: any) => {
    setActiveModalItem(null);
    setSuccessReceipt(receiptData);
    fetchData();
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
      <Navbar selectionOpen={selectionOpen} portalPublished={portalPublished} />

      {/* Main Hero */}
      <Hero
        totalCodes={stats.total_codes}
        totalSlots={stats.total_slots}
        reservedSlots={stats.reserved_slots}
        remainingSlots={stats.remaining_slots}
        selectionOpen={selectionOpen}
        portalPublished={portalPublished}
      />

      {/* Global Status Notices */}
      {!portalPublished ? (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6 w-full">
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-sm flex items-center gap-3">
            <Lock className="w-5 h-5 text-amber-400 shrink-0" />
            <span>
              <strong>Portal Unpublished:</strong> The selection portal is currently unpublished by administrators. Problem statement selections are disabled.
            </span>
          </div>
        </div>
      ) : !selectionOpen ? (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6 w-full">
          <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-200 text-sm flex items-center gap-3">
            <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0" />
            <span>
              <strong>Selection Paused:</strong> Problem statement selection is currently closed by organizers. You may browse allocation counts, but new reservations are paused.
            </span>
          </div>
        </div>
      ) : null}

      {/* Domain Selection & Code Grid Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex-1 w-full">
        {/* Domain Cards */}
        <DomainFilter
          selectedDomain={selectedDomain}
          onSelectDomain={(d) => {
            setSelectedDomain(d);
            setSearchFilter('');
          }}
          domainCounts={domainCounts}
        />

        {/* Section Divider & Filter Toolbar */}
        <div className="mt-12 mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xl font-extrabold text-white tracking-tight">
                {selectedDomain === 'CSE_AIML' && 'CSE / AIML Problem Statements'}
                {selectedDomain === 'ECE' && 'Electronics & Communication Problem Statements'}
                {selectedDomain === 'MECH_CIVIL' && 'Mechanical & Civil Problem Statements'}
              </h3>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                {selectedDomain === 'CSE_AIML' && '15 Codes'}
                {selectedDomain === 'ECE' && '10 Codes'}
                {selectedDomain === 'MECH_CIVIL' && '5 Codes'}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Select an available code below to reserve it for your team. Each code allows maximum 2 teams.
            </p>
          </div>

          {/* Quick Search */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search code (e.g. CS-01)"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-900 border border-slate-700/80 text-white placeholder-slate-400 text-xs focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-mono"
            />
          </div>
        </div>

        {/* PS Cards Display */}
        {selectedDomain === 'MECH_CIVIL' ? (
          /* Mechanical and Civil with two separate sections */
          <div className="space-y-10">
            {/* Section 1: Mechanical (3 codes) */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                <h4 className="text-base font-bold text-white uppercase tracking-wider">
                  Mechanical Engineering (3 Problem Statements: ME-01, ME-02, ME-03)
                </h4>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {mechanicalItems.map((item) => (
                  <PSCard
                    key={item.ps_code}
                    item={item}
                    onSelect={handleSelectPS}
                    selectionOpen={selectionOpen && portalPublished}
                  />
                ))}
              </div>
            </div>

            {/* Section 2: Civil (2 codes) */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <span className="w-2.5 h-2.5 rounded-full bg-teal-400" />
                <h4 className="text-base font-bold text-white uppercase tracking-wider">
                  Civil Engineering (2 Problem Statements: CE-01, CE-02)
                </h4>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {civilItems.map((item) => (
                  <PSCard
                    key={item.ps_code}
                    item={item}
                    onSelect={handleSelectPS}
                    selectionOpen={selectionOpen && portalPublished}
                  />
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* CSE / AIML (15 codes) or ECE (10 codes) Grid */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredItems.map((item) => (
              <PSCard
                key={item.ps_code}
                item={item}
                onSelect={handleSelectPS}
                selectionOpen={selectionOpen && portalPublished}
              />
            ))}
          </div>
        )}

        {/* How Selection Works Explanation */}
        <section id="selection-process" className="mt-20 pt-12 border-t border-slate-800">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-400 block mb-1">
              Process Guidelines
            </span>
            <h3 className="text-2xl font-black text-white tracking-tight">
              How PS Selection Works
            </h3>
            <p className="text-xs sm:text-sm text-slate-400 mt-2">
              Follow these simple steps to successfully claim your problem statement for VVCE Ideathon.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800">
              <div className="w-8 h-8 rounded-lg bg-blue-600/20 text-blue-400 font-bold flex items-center justify-center text-sm mb-3 border border-blue-500/30">
                1
              </div>
              <h5 className="font-bold text-white text-sm mb-1.5">Choose Domain</h5>
              <p className="text-xs text-slate-400 leading-relaxed">
                Select your engineering domain (CSE/AIML, ECE, or Mechanical & Civil) from the domain selector above.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800">
              <div className="w-8 h-8 rounded-lg bg-blue-600/20 text-blue-400 font-bold flex items-center justify-center text-sm mb-3 border border-blue-500/30">
                2
              </div>
              <h5 className="font-bold text-white text-sm mb-1.5">Check Availability</h5>
              <p className="text-xs text-slate-400 leading-relaxed">
                Review available codes. Codes show 0/2 (Available), 1/2 (One Slot Left), or 2/2 (Full).
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800">
              <div className="w-8 h-8 rounded-lg bg-blue-600/20 text-blue-400 font-bold flex items-center justify-center text-sm mb-3 border border-blue-500/30">
                3
              </div>
              <h5 className="font-bold text-white text-sm mb-1.5">Fill Team Details</h5>
              <p className="text-xs text-slate-400 leading-relaxed">
                Click [SELECT], enter your Team Name, Registration ID, and Leader info, then review and confirm.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800">
              <div className="w-8 h-8 rounded-lg bg-emerald-600/20 text-emerald-400 font-bold flex items-center justify-center text-sm mb-3 border border-emerald-500/30">
                4
              </div>
              <h5 className="font-bold text-white text-sm mb-1.5">Instant Confirmation</h5>
              <p className="text-xs text-slate-400 leading-relaxed">
                Backend atomically verifies the slot and locks your reservation. Save your confirmation receipt!
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Registration Modal */}
      {activeModalItem && (
        <RegistrationModal
          psItem={activeModalItem}
          onClose={() => setActiveModalItem(null)}
          onSuccess={handleSuccessReservation}
        />
      )}

      {/* Success Confirmation Modal */}
      {successReceipt && (
        <SuccessReceiptModal
          data={successReceipt}
          onClose={() => setSuccessReceipt(null)}
        />
      )}

      <Footer />
    </div>
  );
}

