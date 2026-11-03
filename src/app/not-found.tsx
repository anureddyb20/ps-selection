import Link from 'next/link';
import { ArrowLeft, AlertTriangle } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-black text-white font-sans">
      <div className="w-full max-w-md bg-[#080808] p-8 rounded-2xl shadow-2xl relative border border-zinc-800 text-center">
        <div className="inline-flex p-3 rounded-2xl bg-[#120308] border border-[#FF007F]/40 mb-4">
          <AlertTriangle className="w-8 h-8 text-[#FF007F]" />
        </div>
        <h2 className="text-xl font-black tracking-tight text-white uppercase mb-2 font-sans">
          404 // Page Not Found
        </h2>
        <p className="text-xs text-zinc-400 mb-6 font-sans">
          The requested page could not be located on the Selection Desk network.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#FF007F] hover:bg-[#ff1a8c] text-white font-bold text-xs uppercase tracking-wider shadow-[0_0_25px_rgba(255,0,127,0.4)] transition-all active:scale-[0.99]"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Desk</span>
        </Link>
      </div>
    </div>
  );
}

