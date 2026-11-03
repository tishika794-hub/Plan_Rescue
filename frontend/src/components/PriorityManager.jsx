// frontend/src/components/PriorityManager.jsx
import React from 'react';
import { 
  Sliders, 
  Plus, 
  Trash2, 
  Save, 
  ArrowUp, 
  ArrowDown, 
  Clock, 
  Star, 
  Utensils, 
  CheckCircle2, 
  Lock, 
  Unlock,
  Sparkles,
  MapPin
} from 'lucide-react';

export default function PriorityManager({
  stops,
  onUpdateStopPriority,
  onUpdateStopDuration,
  onToggleFixedRes,
  onUpdateResTime,
  onMoveStop,
  onRemoveStop,
  onToggleCompleteStop,
  onOpenAddModal,
  onSavePlan,
  isSaving,
  completedStopIds,
  currentUser
}) {
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-slate-800 bg-slate-900/60 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold text-white tracking-wide uppercase flex items-center gap-1.5">
            <Sliders className="h-4 w-4 text-indigo-400" />
            Live Priority & Constraint Configurator
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Adjust weights, duration budgets, and reservation constraints in real time.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onOpenAddModal}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white shadow transition"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Add Destination</span>
          </button>

          <button
            onClick={onSavePlan}
            disabled={isSaving}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white shadow transition disabled:opacity-50"
            title="Persist preferences to SQLite database"
          >
            <Save className="h-3.5 w-3.5" />
            <span>{isSaving ? 'Saving...' : 'Save to Profile'}</span>
          </button>
        </div>
      </div>

      {/* User profile banner indicator */}
      {currentUser && (
        <div className="bg-indigo-950/40 border-b border-indigo-900/50 px-4 py-2 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-indigo-200">
            <span className="h-2 w-2 rounded-full bg-indigo-400"></span>
            <span>Editing live profile: <strong>{currentUser.name}</strong> ({currentUser.email})</span>
          </div>
          <span className="text-[10px] uppercase font-semibold text-indigo-300/80">SQLite Connected</span>
        </div>
      )}

      {/* Stops List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {stops.map((stop, index) => {
          const isCompleted = completedStopIds.includes(stop.id);

          return (
            <div
              key={stop.id}
              className={`p-4 rounded-xl border transition ${
                isCompleted 
                  ? 'bg-slate-900/40 border-slate-800 opacity-60' 
                  : 'bg-slate-900 border-slate-800 hover:border-slate-700'
              }`}
            >
              {/* Stop Title and Action Row */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-2.5">
                  <span className="h-6 w-6 rounded-md bg-slate-800 text-slate-300 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                    {index + 1}
                  </span>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-bold text-white tracking-tight">{stop.name}</h4>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                        {stop.category || 'Attraction'}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-3">
                      <span>Hours: {Math.floor(stop.open_time/60)}:00 – {Math.floor(stop.close_time/60)}:00</span>
                      <span>•</span>
                      <span>Coordinates: {stop.lat.toFixed(3)}, {stop.lng.toFixed(3)}</span>
                    </div>
                  </div>
                </div>

                {/* Move & Check-in & Delete buttons */}
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => onToggleCompleteStop(stop.id)}
                    className={`p-1.5 rounded-lg border text-xs transition ${
                      isCompleted 
                        ? 'bg-emerald-600/30 text-emerald-300 border-emerald-500/50' 
                        : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                    }`}
                    title={isCompleted ? "Mark Unvisited" : "Check-in as Completed"}
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                  </button>

                  <button
                    onClick={() => onMoveStop(index, -1)}
                    disabled={index === 0}
                    className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white border border-slate-700 disabled:opacity-30 disabled:pointer-events-none transition"
                    title="Move earlier"
                  >
                    <ArrowUp className="h-3.5 w-3.5" />
                  </button>

                  <button
                    onClick={() => onMoveStop(index, 1)}
                    disabled={index === stops.length - 1}
                    className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white border border-slate-700 disabled:opacity-30 disabled:pointer-events-none transition"
                    title="Move later"
                  >
                    <ArrowDown className="h-3.5 w-3.5" />
                  </button>

                  <button
                    onClick={() => onRemoveStop(stop.id)}
                    className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-rose-400 border border-slate-700 transition"
                    title="Remove destination"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {/* Priority & Duration Controls Grid */}
              <div className="mt-3 pt-3 border-t border-slate-800/80 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {/* Priority Weight (1 - 5) */}
                <div className="bg-slate-850 p-2.5 rounded-lg border border-slate-800 flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[11px] font-semibold text-slate-300 flex items-center gap-1">
                      <Star className="h-3 w-3 text-amber-400" />
                      Priority Tier: <strong className="text-amber-300 ml-1">P{stop.priority}</strong>
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {stop.priority === 5 ? 'Must Visit (Highest)' :
                       stop.priority === 4 ? 'High Priority' :
                       stop.priority === 3 ? 'Medium Value' :
                       stop.priority === 2 ? 'Optional Leisure' : 'Sacrificial'}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="5"
                    step="1"
                    value={stop.priority}
                    onChange={(e) => onUpdateStopPriority(stop.id, parseInt(e.target.value))}
                    className="w-full accent-amber-400 cursor-pointer h-1.5 bg-slate-700 rounded-lg"
                  />
                  <div className="flex justify-between text-[9px] text-slate-500 mt-1">
                    <span>1 (Low)</span>
                    <span>2</span>
                    <span>3</span>
                    <span>4</span>
                    <span>5 (Crucial)</span>
                  </div>
                </div>

                {/* Visit Duration Budget */}
                <div className="bg-slate-850 p-2.5 rounded-lg border border-slate-800 flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[11px] font-semibold text-slate-300 flex items-center gap-1">
                      <Clock className="h-3 w-3 text-indigo-400" />
                      Visit Duration: <strong className="text-indigo-300 ml-1">{stop.duration} mins</strong>
                    </span>
                    <span className="text-[10px] text-slate-400">On-site time</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {[30, 45, 60, 75, 90].map((dur) => (
                      <button
                        key={dur}
                        onClick={() => onUpdateStopDuration(stop.id, dur)}
                        className={`flex-1 py-1 rounded text-[10px] font-semibold border transition ${
                          stop.duration === dur
                            ? 'bg-indigo-600 text-white border-indigo-500'
                            : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                        }`}
                      >
                        {dur}m
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Fixed Reservation Constraint Row */}
              <div className="mt-2.5 p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/80 flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onToggleFixedRes(stop.id)}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold border transition ${
                      stop.is_fixed_res
                        ? 'bg-purple-500/20 text-purple-200 border-purple-500/50'
                        : 'bg-slate-800 text-slate-400 border-slate-700'
                    }`}
                  >
                    {stop.is_fixed_res ? <Lock className="h-3 w-3 text-purple-300" /> : <Unlock className="h-3 w-3 text-slate-500" />}
                    <span>Fixed Table / Booking</span>
                  </button>
                  <span className="text-[11px] text-slate-400 hidden sm:inline">
                    {stop.is_fixed_res ? 'Enforces strict ±15m tolerance arrival window' : 'Flexible arrival'}
                  </span>
                </div>

                {stop.is_fixed_res && (
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] text-slate-400">Booking Time:</span>
                    <select
                      value={stop.res_time || 810}
                      onChange={(e) => onUpdateResTime(stop.id, parseInt(e.target.value))}
                      className="bg-slate-800 border border-slate-700 text-white text-xs rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
                    >
                      <option value={750}>12:30 PM</option>
                      <option value={780}>01:00 PM</option>
                      <option value={810}>01:30 PM (Gulati Default)</option>
                      <option value={840}>02:00 PM</option>
                      <option value={870}>02:30 PM</option>
                      <option value={1140}>07:00 PM</option>
                      <option value={1200}>08:00 PM</option>
                    </select>
                  </div>
                )}
              </div>

            </div>
          );
        })}
      </div>
    </div>
  );
}

