// frontend/src/components/TimelineDiff.jsx
import React from 'react';
import { 
  CheckCircle2, 
  Clock, 
  MapPin, 
  AlertTriangle, 
  XCircle, 
  ArrowRight, 
  Utensils, 
  Check, 
  Sparkles,
  ShieldCheck,
  Calendar,
  AlertOctagon,
  RefreshCw,
  Info
} from 'lucide-react';

export default function TimelineDiff({ 
  rescueResult, 
  initialStops, 
  completedStopIds, 
  currentLocationId, 
  onAcceptPlan, 
  onRevertPlan,
  onApplyFallback,
  onSelectStopOnMap,
  selectedStopId
}) {
  if (!rescueResult) {
    return (
      <div className="p-8 text-center text-slate-400 flex flex-col items-center justify-center h-80">
        <Clock className="h-10 w-10 text-slate-600 mb-3 animate-pulse" />
        <h3 className="text-sm font-semibold text-slate-300">Evaluating Day Itinerary...</h3>
        <p className="text-xs text-slate-500 mt-1 max-w-xs">
          Loading constraints, opening hours, and travel time matrix.
        </p>
      </div>
    );
  }

  const isInfeasible = rescueResult.status === 'infeasible';

  return (
    <div className="flex flex-col h-full">
      {/* Diff Header summary */}
      <div className="p-4 border-b border-slate-800 bg-slate-900/60 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-white tracking-wide uppercase flex items-center gap-1.5">
              <Sparkles className="h-4 w-4 text-indigo-400" />
              The Rescue Diff
            </h2>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
              isInfeasible 
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' 
                : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
            }`}>
              {isInfeasible ? 'Hard Infeasibility' : 'Optimized Recovery'}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            {isInfeasible 
              ? 'Discrete math rejected all permutations. Hard constraints cannot be satisfied.' 
              : 'Deterministic Orienteering Problem with Time Windows (OPTW) solution.'}
          </p>
        </div>

        {!isInfeasible && rescueResult.stats && (
          <div className="hidden sm:flex items-center gap-3 text-right">
            <div>
              <div className="text-[11px] text-slate-400">Preserved</div>
              <div className="text-xs font-bold text-emerald-400">
                {rescueResult.stats.stops_preserved} Stops
              </div>
            </div>
            <div className="h-6 w-px bg-slate-800"></div>
            <div>
              <div className="text-[11px] text-slate-400">Dropped</div>
              <div className="text-xs font-bold text-rose-400">
                {rescueResult.stats.stops_dropped} Stops
              </div>
            </div>
            <div className="h-6 w-px bg-slate-800"></div>
            <div>
              <div className="text-[11px] text-slate-400">Transit</div>
              <div className="text-xs font-bold text-indigo-300">
                {rescueResult.stats.total_transit_mins}m
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {/* Infeasibility Banner & Actionable Fallbacks */}
        {isInfeasible ? (
          <div className="space-y-4">
            <div className="bg-rose-950/40 border border-rose-800/60 rounded-xl p-4 text-slate-200">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-rose-900/60 text-rose-300 border border-rose-700/60">
                  <AlertOctagon className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-rose-200">
                    Honest Infeasibility Detection
                  </h3>
                  <p className="text-xs text-rose-300/90 mt-1 leading-relaxed">
                    {rescueResult.message || 'No valid schedule exists without violating hard commitments.'}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-2">
                    Unlike LLMs that hallucinate false schedules, Plan Rescue guarantees mathematical honesty: zero schedule fabricated when arrival times fall outside physical bounds.
                  </p>
                </div>
              </div>
            </div>

            {/* Actionable Fallback Suggestions */}
            {rescueResult.fallbacks && rescueResult.fallbacks.length > 0 && (
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                <div className="text-xs font-bold uppercase tracking-wider text-indigo-300 mb-2.5 flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5" />
                  Actionable Fallback Options
                </div>
                <div className="space-y-2">
                  {rescueResult.fallbacks.map((fb, idx) => (
                    <div 
                      key={idx}
                      className="p-3 rounded-lg bg-slate-800/80 border border-slate-700 hover:border-indigo-500/50 transition flex items-center justify-between gap-3"
                    >
                      <div>
                        <div className="text-xs font-semibold text-slate-100">{fb.title}</div>
                        <div className="text-[11px] text-slate-400 mt-0.5">{fb.description}</div>
                      </div>
                      <button
                        onClick={() => onApplyFallback(fb)}
                        className="px-2.5 py-1.5 text-xs font-semibold rounded-md bg-indigo-600 hover:bg-indigo-500 text-white shadow transition shrink-0"
                      >
                        Apply Fallback
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Step-by-Step Schedule Diff Cards */
          <div className="space-y-2.5">
            {rescueResult.diff && rescueResult.diff.map((item, idx) => {
              const isSelected = selectedStopId === item.id;
              const isPreserved = item.status === 'PRESERVED';
              const isCompleted = item.status === 'COMPLETED';
              const isCurrent = item.status === 'CURRENT';
              const isDropped = item.status === 'DROPPED';
              const isClosed = item.status === 'CLOSED';

              return (
                <div
                  key={item.id}
                  onClick={() => onSelectStopOnMap(item.id)}
                  className={`p-3.5 rounded-xl border transition cursor-pointer select-none relative ${
                    isSelected 
                      ? 'ring-2 ring-indigo-500 border-indigo-400 bg-slate-850' 
                      : 'bg-slate-900/90 hover:bg-slate-850 border-slate-800 hover:border-slate-700'
                  } ${isDropped ? 'opacity-70 bg-rose-950/20 border-rose-900/40' : ''}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      {/* Status Icon Badge */}
                      <div className={`mt-0.5 h-7 w-7 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold ${
                        isCompleted ? 'bg-emerald-900/50 text-emerald-300 border border-emerald-700/50' :
                        isCurrent ? 'bg-amber-900/50 text-amber-300 border border-amber-700/50 animate-pulse' :
                        isPreserved ? 'bg-indigo-900/50 text-indigo-300 border border-indigo-700/50' :
                        isClosed ? 'bg-rose-900/50 text-rose-300 border border-rose-700/50' :
                        'bg-slate-800 text-slate-500 border border-slate-700'
                      }`}>
                        {isCompleted && <Check className="h-4 w-4" />}
                        {isCurrent && <MapPin className="h-4 w-4" />}
                        {isPreserved && (idx + 1)}
                        {isDropped && <XCircle className="h-4 w-4 text-rose-400" />}
                        {isClosed && <AlertTriangle className="h-4 w-4 text-rose-400" />}
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className={`text-xs font-bold tracking-tight ${
                            isDropped ? 'line-through text-slate-400' : 'text-slate-100'
                          }`}>
                            {item.name}
                          </h4>
                          {item.id === 'gulati_pandara' && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-300 border border-purple-500/30">
                              <Utensils className="h-2.5 w-2.5" /> 13:30 Table Res
                            </span>
                          )}
                        </div>

                        {/* Timestamps if preserved */}
                        {isPreserved && item.start_fmt && (
                          <div className="flex items-center gap-3 mt-1 text-[11px] text-slate-300">
                            <span className="flex items-center gap-1 text-slate-400">
                              <Clock className="h-3 w-3 text-slate-500" />
                              Arrival: <strong className="text-slate-200">{item.arrival_fmt}</strong>
                            </span>
                            <span>•</span>
                            <span className="text-indigo-300 font-semibold">
                              Visit: {item.start_fmt} – {item.departure_fmt}
                            </span>
                          </div>
                        )}

                        {/* Explanation Reason */}
                        <div className="text-[11px] text-slate-400 mt-1 leading-snug">
                          {item.reason}
                        </div>
                      </div>
                    </div>

                    {/* Status Badge */}
                    <div className="shrink-0">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider ${
                        isCompleted ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                        isCurrent ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                        isPreserved ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30' :
                        isClosed ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' :
                        'bg-slate-800 text-rose-400 border border-rose-900/50'
                      }`}>
                        {item.badge}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Bottom Approval Footer */}
      {!isInfeasible && (
        <div className="p-3 border-t border-slate-800 bg-slate-900/90 flex items-center justify-between gap-3">
          <button
            onClick={onRevertPlan}
            className="px-3 py-2 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
          >
            Keep Original Plan
          </button>

          <button
            onClick={onAcceptPlan}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/20 transition"
          >
            <ShieldCheck className="h-4 w-4" />
            Accept Rescheduled Itinerary
          </button>
        </div>
      )}
    </div>
  );
}

