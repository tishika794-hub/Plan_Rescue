// frontend/src/components/Navbar.jsx
import React from 'react';
import {
  Compass,
  ShieldCheck,
  TestTube2,
  RotateCcw,
  User,
  Sparkles,
  ExternalLink,
  ChevronDown
} from 'lucide-react';

export default function Navbar({
  currentUser,
  onOpenAuth,
  onOpenJudge,
  onOpenTestAudit,
  onResetPlan,
  isSolving,
  telemetry
}) {
  return (
    <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-40 select-none">
      <div className="max-w-[1720px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">

        {/* Brand identity */}
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-indigo-600/30 text-white border border-indigo-400/30">
            <Compass className="h-6 w-6 stroke-[2.2]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-lg tracking-tight text-white flex items-center gap-1.5">
                PLAN RESCUE
              </span>
              <span className="text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
                Maps Lab
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">
              Constraint-Aware Day Itinerary Recovery • Delhi Area
            </p>
          </div>
        </div>

        {/* Center Live Engine Status */}
        <div className="hidden lg:flex items-center gap-3 bg-slate-950/80 px-3.5 py-1.5 rounded-full border border-slate-800 text-xs">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <span className="text-slate-300 font-medium">Deterministic OPTW Engine</span>
          </div>
          <span className="text-slate-600">|</span>
          <span className="text-slate-400 font-mono text-[11px]">
            {telemetry?.compute_time_ms ? `${telemetry.compute_time_ms} ms` : 'Sub-5ms Latency'}
          </span>
          <span className="text-slate-600">|</span>
          <span className="text-emerald-400 text-[11px] font-medium flex items-center gap-1">
            <ShieldCheck className="h-3.5 w-3.5" /> 100% Deterministic
          </span>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Test Suite Audit Button */}
          <button
            onClick={onOpenTestAudit}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
            title="Execute zero-dependency test suite live"
          >
            <TestTube2 className="h-3.5 w-3.5 text-indigo-400" />
            <span className="hidden md:inline">Math Audit</span>
          </button>

          {/* Judge Defense */}
          <button
            onClick={onOpenJudge}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-indigo-950/60 hover:bg-indigo-900/60 text-indigo-200 border border-indigo-800/60 transition"
            title="View Defensibility Thesis & Hackathon Judge FAQs"
          >
            <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
            <span className="hidden md:inline">Judge Defense</span>
          </button>

          {/* Reset Plan */}
          <button
            onClick={onResetPlan}
            className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700 transition"
            title="Reset to pristine 5-stop Delhi plan"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </button>

          {/* User Account Button */}
          <div className="relative">
            <button
              onClick={onOpenAuth}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 transition"
            >
              <div className="h-5 w-5 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-[10px] font-bold text-white uppercase">
                {currentUser ? currentUser.name.charAt(0) : <User className="h-3 w-3" />}
              </div>
              <span className="text-xs font-medium max-w-[110px] truncate hidden sm:inline">
                {currentUser ? currentUser.name : 'Sign In'}
              </span>
              <ChevronDown className="h-3 w-3 text-slate-400" />
            </button>
          </div>
        </div>

      </div>
    </header>
  );
}

