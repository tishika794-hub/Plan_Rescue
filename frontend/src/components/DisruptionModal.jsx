// frontend/src/components/DisruptionModal.jsx
import React, { useState } from 'react';
import { X, AlertTriangle, Clock, MapPin, DoorClosed, SlidersHorizontal, Zap } from 'lucide-react';

export default function DisruptionModal({
  isOpen,
  onClose,
  stops,
  currentLocationId,
  currentTime,
  dayEnd,
  venueClosures,
  onApplyDisruption
}) {
  const [selectedLoc, setSelectedLoc] = useState(currentLocationId || 'ngma');
  const [timeVal, setTimeVal] = useState(currentTime || 710);
  const [dayEndVal, setDayEndVal] = useState(dayEnd || 990);
  const [closures, setClosures] = useState(venueClosures || []);
  const [delayDelta, setDelayDelta] = useState(45);

  if (!isOpen) return null;

  function toggleClosure(stopId) {
    if (closures.includes(stopId)) {
      setClosures(closures.filter(id => id !== stopId));
    } else {
      setClosures([...closures, stopId]);
    }
  }

  function handlePresetDelay(delta) {
    setDelayDelta(delta);
    setTimeVal(currentTime + delta);
  }

  function handleSubmit(e) {
    e.preventDefault();
    onApplyDisruption({
      currentLocationId: selectedLoc,
      currentTime: timeVal,
      dayEnd: dayEndVal,
      venueClosures: closures
    });
    onClose();
  }

  const hours = Math.floor(timeVal / 60);
  const mins = timeVal % 60;
  const period = hours < 12 ? 'AM' : 'PM';
  const displayHours = hours % 12 === 0 ? 12 : hours % 12;
  const timeFormatted = `${displayHours}:${mins < 10 ? '0' : ''}${mins} ${period}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm select-none">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl relative text-slate-100">

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="h-10 w-10 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center">
            <SlidersHorizontal className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Inject Custom Disruption
            </h3>
            <p className="text-xs text-slate-400">
              Simulate roadblocks, extended dwells, or emergency closures on the fly
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Current Stop Position */}
          <div>
            <label className="block text-slate-300 font-semibold mb-1.5 flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 text-amber-400" /> Current Traveler Location
            </label>
            <select
              value={selectedLoc}
              onChange={(e) => setSelectedLoc(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              {stops.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          {/* Preset Delay Buttons */}
          <div>
            <label className="block text-slate-300 font-semibold mb-1.5 flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-indigo-400" /> Unexpected Delay Buffer
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[15, 30, 45, 120].map((minsVal) => (
                <button
                  type="button"
                  key={minsVal}
                  onClick={() => handlePresetDelay(minsVal)}
                  className={`py-2 rounded-lg font-bold border transition ${delayDelta === minsVal
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/60 ring-1 ring-amber-500/50'
                      : 'bg-slate-850 text-slate-300 border-slate-700 hover:bg-slate-800'
                    }`}
                >
                  +{minsVal}m
                </button>
              ))}
            </div>
          </div>

          {/* Current Rescheduled Departure Time */}
          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-slate-300 font-semibold">Rescheduled Departure Time:</span>
              <strong className="text-amber-300 font-mono text-sm">{timeFormatted}</strong>
            </div>
            <input
              type="range"
              min="540"
              max="1140"
              step="5"
              value={timeVal}
              onChange={(e) => {
                setTimeVal(parseInt(e.target.value));
                setDelayDelta(parseInt(e.target.value) - currentTime);
              }}
              className="w-full accent-amber-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500 mt-1">
              <span>9:00 AM</span>
              <span>1:00 PM</span>
              <span>4:30 PM</span>
              <span>7:00 PM</span>
            </div>
          </div>

          {/* Venue Closures Checklist */}
          <div>
            <label className="block text-slate-300 font-semibold mb-1.5 flex items-center gap-1.5">
              <DoorClosed className="h-3.5 w-3.5 text-rose-400" /> Report Sudden Venue Closures
            </label>
            <div className="space-y-1.5 bg-slate-950 p-2.5 rounded-xl border border-slate-800 max-h-36 overflow-y-auto">
              {stops.map(s => (
                <label
                  key={s.id}
                  className="flex items-center justify-between p-1.5 rounded hover:bg-slate-850 cursor-pointer"
                >
                  <span className="text-slate-200">{s.name}</span>
                  <input
                    type="checkbox"
                    checked={closures.includes(s.id)}
                    onChange={() => toggleClosure(s.id)}
                    className="accent-rose-500 rounded"
                  />
                </label>
              ))}
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            className="w-full mt-2 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold shadow-lg transition flex items-center justify-center gap-1.5"
          >
            <Zap className="h-4 w-4" />
            <span>Execute Constraint-Aware Recovery</span>
          </button>
        </form>

      </div>
    </div>
  );
}

