'use client';

import React, { useState } from 'react';
import { PublicPSItem } from '@/lib/types';
import { X, CheckCircle, AlertTriangle, ArrowRight, ArrowLeft, ShieldCheck, Loader2 } from 'lucide-react';

interface RegistrationModalProps {
  psItem: PublicPSItem | null;
  onClose: () => void;
  onSuccess: (receipt: any) => void;
}

export default function RegistrationModal({
  psItem,
  onClose,
  onSuccess,
}: RegistrationModalProps) {
  const [step, setStep] = useState<'form' | 'review'>('form');

  // Form Fields
  const [teamName, setTeamName] = useState('');
  const [registrationId, setRegistrationId] = useState('');
  const [leaderName, setLeaderName] = useState('');
  const [leaderEmail, setLeaderEmail] = useState('');

  // Status & Error
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  if (!psItem) return null;

  const validateForm = () => {
    if (!teamName.trim()) {
      setErrorMessage('Please enter your Team Name.');
      return false;
    }
    if (!registrationId.trim()) {
      setErrorMessage('Please enter your Team Registration ID (e.g. VVCE-REG-101).');
      return false;
    }
    if (!leaderName.trim()) {
      setErrorMessage('Please enter the Team Leader Name.');
      return false;
    }
    if (!leaderEmail.trim()) {
      setErrorMessage('Please enter the Team Leader Email.');
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(leaderEmail.trim())) {
      setErrorMessage('Please enter a valid email address.');
      return false;
    }
    setErrorMessage(null);
    return true;
  };

  const handleProceedToReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      setStep('review');
    }
  };

  const handleFinalSubmit = async () => {
    if (!agreedToTerms) {
      setErrorMessage('Please confirm and agree that the selection is final.');
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    try {
      const response = await fetch('/api/reserve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ps_code: psItem.ps_code,
          team_name: teamName.trim(),
          registration_id: registrationId.trim(),
          leader_name: leaderName.trim(),
          leader_email: leaderEmail.trim().toLowerCase(),
          domain: psItem.domain,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setErrorMessage(data.message || 'Failed to reserve Problem Statement. Please try again.');
        setLoading(false);
        return;
      }

      // Success
      onSuccess(data);
    } catch (err: any) {
      console.error('Reservation error:', err);
      setErrorMessage('Network or server error occurred. Please verify your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const domainNameDisplay =
    psItem.domain === 'CSE_AIML'
      ? 'CSE / AIML'
      : psItem.domain === 'ECE'
      ? 'Electronics & Communication'
      : `Mechanical & Civil (${psItem.sub_domain || 'General'})`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="px-3 py-1 rounded-lg bg-blue-500/20 text-blue-400 font-mono font-bold text-lg border border-blue-500/30">
              {psItem.ps_code}
            </div>
            <div>
              <h3 className="font-bold text-white text-base">Team PS Reservation</h3>
              <p className="text-xs text-slate-400">VVCE Ideathon 2026 Portal</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Progress Indicators */}
        <div className="flex border-b border-slate-800 bg-slate-950/30 text-xs">
          <div
            className={`flex-1 py-2.5 text-center font-medium border-b-2 transition-colors ${
              step === 'form'
                ? 'border-blue-500 text-blue-400 bg-blue-500/5'
                : 'border-transparent text-slate-400'
            }`}
          >
            1. Team Details
          </div>
          <div
            className={`flex-1 py-2.5 text-center font-medium border-b-2 transition-colors ${
              step === 'review'
                ? 'border-blue-500 text-blue-400 bg-blue-500/5'
                : 'border-transparent text-slate-400'
            }`}
          >
            2. Review & Confirm
          </div>
        </div>

        {/* Error Notification */}
        {errorMessage && (
          <div className="mx-6 mt-4 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5 animate-shake">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold block mb-0.5">Reservation Error:</span>
              <span>{errorMessage}</span>
            </div>
          </div>
        )}

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1">
          {step === 'form' ? (
            <form onSubmit={handleProceedToReview} className="space-y-4">
              {/* Pre-populated PS and Domain Info */}
              <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 text-xs">
                <div>
                  <span className="text-slate-400 block mb-0.5">Selected PS Code</span>
                  <span className="text-white font-mono font-bold text-sm text-blue-400">
                    {psItem.ps_code}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">Domain Category</span>
                  <span className="text-white font-medium">{domainNameDisplay}</span>
                </div>
              </div>

              {/* Team Name */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  Team Name <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Apex Innovators"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>

              {/* Team Registration ID */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  Team Registration ID <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. VVCE-REG-1048"
                  value={registrationId}
                  onChange={(e) => setRegistrationId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  The official registration ID provided upon your Ideathon team registration.
                </p>
              </div>

              {/* Team Leader Name */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  Team Leader Name <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rahul Sharma"
                  value={leaderName}
                  onChange={(e) => setLeaderName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>

              {/* Team Leader Email */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  Team Leader Email <span className="text-rose-400">*</span>
                </label>
                <input
                  type="email"
                  required
                  placeholder="e.g. rahul.sharma@vvce.ac.in"
                  value={leaderEmail}
                  onChange={(e) => setLeaderEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Confirmation receipt and event communications will be sent to this email.
                </p>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-3 px-4 rounded-xl font-bold text-sm bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center gap-2"
                >
                  <span>Review Selection</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-5">
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex justify-between items-center pb-2 border-b border-slate-800/80">
                  <span className="text-xs text-slate-400">Target PS Code:</span>
                  <span className="font-mono font-bold text-blue-400 text-base">{psItem.ps_code}</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-slate-800/80">
                  <span className="text-xs text-slate-400">Domain:</span>
                  <span className="text-xs font-semibold text-white">{domainNameDisplay}</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-slate-800/80">
                  <span className="text-xs text-slate-400">Team Name:</span>
                  <span className="text-xs font-semibold text-white">{teamName}</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-slate-800/80">
                  <span className="text-xs text-slate-400">Registration ID:</span>
                  <span className="text-xs font-mono font-semibold text-white">{registrationId}</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-slate-800/80">
                  <span className="text-xs text-slate-400">Team Leader:</span>
                  <span className="text-xs font-semibold text-white">{leaderName}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-slate-400">Leader Email:</span>
                  <span className="text-xs font-semibold text-white">{leaderEmail}</span>
                </div>
              </div>

              {/* Confirmation Acknowledgement */}
              <label className="flex items-start gap-3 p-3.5 rounded-xl bg-blue-500/5 border border-blue-500/20 cursor-pointer">
                <input
                  type="checkbox"
                  checked={agreedToTerms}
                  onChange={(e) => setAgreedToTerms(e.target.checked)}
                  className="mt-1 w-4 h-4 rounded border-slate-700 text-blue-600 focus:ring-blue-500 bg-slate-950"
                />
                <span className="text-xs text-slate-300 leading-relaxed">
                  I confirm that our team details are accurate. I understand that each team can select{' '}
                  <strong className="text-white">only ONE PS code</strong> and selections are locked in the database immediately upon submission.
                </span>
              </label>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setStep('form')}
                  disabled={loading}
                  className="py-3 px-4 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs flex items-center gap-1.5 transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back</span>
                </button>

                <button
                  type="button"
                  onClick={handleFinalSubmit}
                  disabled={loading || !agreedToTerms}
                  className={`flex-1 py-3 px-4 rounded-xl font-bold text-sm text-white shadow-lg transition-all flex items-center justify-center gap-2 ${
                    loading || !agreedToTerms
                      ? 'bg-slate-800 text-slate-400 cursor-not-allowed border border-slate-700'
                      : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-emerald-500/20 active:scale-[0.99]'
                  }`}
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Validating & Reserving...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4" />
                      <span>Confirm & Lock Reservation</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

