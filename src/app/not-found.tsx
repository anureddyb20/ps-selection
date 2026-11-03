import Link from 'next/link';
import { ArrowLeft, AlertTriangle } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-ops-bg text-white font-mono">
      <div className="w-full max-w-md ops-panel p-8 rounded-2xl shadow-2xl relative border border-ops-border text-center">
        <div className="inline-flex p-3 rounded-2xl ops-alert-rejected mb-4">
          <AlertTriangle className="w-8 h-8 text-ops-magenta" />
        </div>
        <h2 className="text-xl font-bold tracking-wider text-white uppercase mb-2">
          404 // Page Not Found
        </h2>
        <p className="text-xs text-ops-textMuted mb-6 font-sans">
          The requested page could not be located on the Selection Desk network.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-ops-cyan text-slate-950 font-bold text-xs uppercase tracking-wider shadow-cyan-glow"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Desk</span>
        </Link>
      </div>
    </div>
  );
}

