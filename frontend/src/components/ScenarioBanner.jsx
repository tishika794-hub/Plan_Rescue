// frontend/src/components/ScenarioBanner.jsx
import React from 'react';
import {
  Zap,
  DoorClosed,
  AlertOctagon,
  SlidersHorizontal,
  Clock,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';

export default function ScenarioBanner({
  activeScenario,
  onTriggerScenario,
  onOpenDisruptionModal,
  isSolving
}) {
  return (
    <div className="bg-slate-900/90 border-b border-slate-800 px-4 sm:px-6 py-3 select-none backdrop-blur">
      <div className="max-w-[1720px] mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-3">

        {/* Scenario Buttons Group */}
        <div className="flex items-center flex-wrap gap-2 w-full md:w-auto">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mr-1 flex items-center gap-1.5">
            <Zap className="h-3.5 w-3.5 text-amber-400" />
            Hackathon Scenarios:
          </span>

          {/* Scenario 1: 45m Roadblock at NGMA */}
          <button
            onClick={() => onTriggerScenario(1)}
            disabled={isSolving}
            className={`flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg border transition ${activeScenario === 1
                ? 'bg-amber-500/20 text-amber-200 border-amber-500/60 shadow-sm shadow-amber-500/20 ring-1 ring-amber-500/50'
                : 'bg-slate-800/80 text-slate-300 border-slate-700/80 hover:bg-slate-750 hover:border-slate-600'
              }`}
          >
            <Clock className="h-3.5 w-3.5 text-amber-400" />
            <span>1. 45m Delay at NGMA</span>
            <span className="hidden xl:inline text-[10px] text-amber-300/70 font-normal">
              (Saves Gulati Lunch, Drops Lodhi)
            </span>
          </button>

          {/* Scenario 2: Sudden Venue Closure */}
          <button
            onClick={() => onTriggerScenario(2)}
            disabled={isSolving}
            className={`flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg border transition ${activeScenario === 2
                ? 'bg-blue-500/20 text-blue-200 border-blue-500/60 shadow-sm shadow-blue-500/20 ring-1 ring-blue-500/50'
                : 'bg-slate-800/80 text-slate-300 border-slate-700/80 hover:bg-slate-750 hover:border-slate-600'
              }`}
          >
            <DoorClosed className="h-3.5 w-3.5 text-blue-400" />
            <span>2. NGMA Venue Closure</span>
            <span className="hidden xl:inline text-[10px] text-blue-300/70 font-normal">
              (Immediate Bypass & Afternoon Reroute)
            </span>
          </button>

          {/* Scenario 3: Honest Infeasibility Detection */}
          <button
            onClick={() => onTriggerScenario(3)}
            disabled={isSolving}
            className={`flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg border transition ${activeScenario === 3
                ? 'bg-rose-500/20 text-rose-200 border-rose-500/60 shadow-sm shadow-rose-500/20 ring-1 ring-rose-500/50'
                : 'bg-slate-800/80 text-slate-300 border-slate-700/80 hover:bg-slate-750 hover:border-slate-600'
              }`}
          >
            <AlertOctagon className="h-3.5 w-3.5 text-rose-400" />
            <span>3. 120m Gridlock (Infeasible)</span>
            <span className="hidden xl:inline text-[10px] text-rose-300/70 font-normal">
              (Zero Hallucination Gate)
            </span>
          </button>

          {/* Custom Disruption Trigger */}
          <button
            onClick={onOpenDisruptionModal}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-indigo-950/40 text-indigo-300 border border-indigo-800/40 hover:bg-indigo-900/50 hover:border-indigo-700 transition ml-auto md:ml-0"
          >
            <SlidersHorizontal className="h-3.5 w-3.5 text-indigo-400" />
            <span>Inject Custom Delay...</span>
          </button>
        </div>

        {/* Status Callout */}
        <div className="flex items-center gap-2 text-xs text-slate-400">
          {activeScenario === 1 && (
            <div className="flex items-center gap-1.5 text-amber-300 bg-amber-500/10 px-2.5 py-1 rounded border border-amber-500/20 text-[11px]">
              <AlertTriangle className="h-3 w-3" />
              <span>Simulating VIP motorcade roadblock at NGMA (+45m departure stall at 13:10)</span>
            </div>
          )}
          {activeScenario === 2 && (
            <div className="flex items-center gap-1.5 text-blue-300 bg-blue-500/10 px-2.5 py-1 rounded border border-blue-500/20 text-[11px]">
              <CheckCircle className="h-3 w-3" />
              <span>Simulating sudden diplomatic closure at NGMA (Immediate reroute from India Gate)</span>
            </div>
          )}
          {activeScenario === 3 && (
            <div className="flex items-center gap-1.5 text-rose-300 bg-rose-500/10 px-2.5 py-1 rounded border border-rose-500/20 text-[11px]">
              <AlertOctagon className="h-3 w-3" />
              <span>Simulating 120m ring road gridlock (Departure 13:45 / 825m — misses 13:30 lunch reservation)</span>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

