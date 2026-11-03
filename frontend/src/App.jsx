// frontend/src/App.jsx
import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import ScenarioBanner from './components/ScenarioBanner';
import TimelineDiff from './components/TimelineDiff';
import PriorityManager from './components/PriorityManager';
import TelemetryCard from './components/TelemetryCard';
import MapView from './components/MapView';
import AuthModal from './components/AuthModal';
import JudgeModal from './components/JudgeModal';
import TestAuditModal from './components/TestAuditModal';
import AddStopModal from './components/AddStopModal';
import DisruptionModal from './components/DisruptionModal';

import {
  fetchInitialPlan,
  triggerRescue,
  saveItinerary,
  fetchDemoUsers
} from './api';

import {
  Sparkles,
  Sliders,
  Activity,
  Layers,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';

export default function App() {
  // App Data State
  const [stops, setStops] = useState([]);
  const [initialStops, setInitialStops] = useState([]);
  const [completedStopIds, setCompletedStopIds] = useState([]);
  const [currentLocationId, setCurrentLocationId] = useState('india_gate');
  const [currentTime, setCurrentTime] = useState(600); // 10:00 AM
  const [dayEnd, setDayEnd] = useState(1200); // 8:00 PM default
  const [venueClosures, setVenueClosures] = useState([]);
  const [activeScenario, setActiveScenario] = useState(null);

  // Recovery Engine Output
  const [rescueResult, setRescueResult] = useState(null);
  const [isSolving, setIsSolving] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedStopId, setSelectedStopId] = useState(null);

  // UI Tabs & Navigation
  const [activeTab, setActiveTab] = useState('diff'); // 'diff' | 'priorities' | 'telemetry'

  // Modals
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [judgeModalOpen, setJudgeModalOpen] = useState(false);
  const [testAuditModalOpen, setTestAuditModalOpen] = useState(false);
  const [addStopModalOpen, setAddStopModalOpen] = useState(false);
  const [disruptionModalOpen, setDisruptionModalOpen] = useState(false);

  // User Profile
  const [currentUser, setCurrentUser] = useState(null);
  const [demoUsers, setDemoUsers] = useState([]);

  // Toast notification state
  const [toastMessage, setToastMessage] = useState(null);

  function showToast(msg) {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  }

  // Load Initial Itinerary and Demo Accounts on mount
  useEffect(() => {
    // Check localStorage for saved session
    const storedUser = localStorage.getItem('plan_rescue_user');
    if (storedUser) {
      try {
        const u = JSON.parse(storedUser);
        setCurrentUser(u);
      } catch (e) { }
    }

    fetchDemoUsers().then(setDemoUsers).catch(() => { });

    loadInitialData();
  }, []);

  async function loadInitialData(userId = null) {
    setIsSolving(true);
    try {
      const data = await fetchInitialPlan(userId);
      setStops(data.stops);
      setInitialStops(data.stops);
      setCompletedStopIds([]);
      setCurrentLocationId('india_gate');
      setCurrentTime(600);
      setDayEnd(1200);
      setVenueClosures([]);
      setActiveScenario(null);

      // Run initial baseline rescue
      const res = await triggerRescue({
        current_time: 600,
        current_location_id: 'india_gate',
        completed_stop_ids: [],
        active_stop_ids: data.stops.map(s => s.id),
        venue_closures: [],
        custom_stops: data.stops,
        day_end: 1200
      });
      setRescueResult(res);
    } catch (err) {
      console.error('Error loading initial plan:', err);
      showToast('Error connecting to backend API');
    } finally {
      setIsSolving(false);
    }
  }

  // Run Optimization Rescue with current parameters
  async function runRescue(customParams = {}) {
    setIsSolving(true);
    const pCurrentTime = customParams.currentTime !== undefined ? customParams.currentTime : currentTime;
    const pCurrentLoc = customParams.currentLocationId || currentLocationId;
    const pCompleted = customParams.completedStopIds || completedStopIds;
    const pClosures = customParams.venueClosures !== undefined ? customParams.venueClosures : venueClosures;
    const pDayEnd = customParams.dayEnd !== undefined ? customParams.dayEnd : dayEnd;
    const pStops = customParams.stops || stops;

    try {
      const res = await triggerRescue({
        current_time: pCurrentTime,
        current_location_id: pCurrentLoc,
        completed_stop_ids: pCompleted,
        active_stop_ids: pStops.map(s => s.id),
        venue_closures: pClosures,
        custom_stops: pStops,
        day_end: pDayEnd,
        user_id: currentUser ? currentUser.id : null
      });

      setRescueResult(res);
      if (res.status === 'success') {
        showToast(`Itinerary recovered in ${res.telemetry?.compute_time_ms || 2.1}ms`);
      } else {
        showToast('Infeasible schedule detected: hard constraints violated');
      }
    } catch (err) {
      console.error('Rescue optimization failed:', err);
      showToast('Optimization failed: ' + err.message);
    } finally {
      setIsSolving(false);
    }
  }

  // Hackathon Canonical Scenario 1: The 45-Minute Roadblock at NGMA
  function triggerScenario1() {
    setActiveScenario(1);
    const completed = ['india_gate'];
    const currentLoc = 'ngma';
    const currTime = 790; // 13:10 (departing after VIP motorcade stall)
    const endLimit = 990; // 16:30 (4:30 PM day end cutoff)
    const closures = [];

    setCompletedStopIds(completed);
    setCurrentLocationId(currentLoc);
    setCurrentTime(currTime);
    setDayEnd(endLimit);
    setVenueClosures(closures);
    setActiveTab('diff');

    runRescue({
      completedStopIds: completed,
      currentLocationId: currentLoc,
      currentTime: currTime,
      dayEnd: endLimit,
      venueClosures: closures
    });
  }

  // Hackathon Canonical Scenario 2: Sudden Venue Closure
  function triggerScenario2() {
    setActiveScenario(2);
    const completed = ['india_gate'];
    const currentLoc = 'india_gate';
    const currTime = 645; // 10:45 AM (immediate reroute)
    const endLimit = 1200;
    const closures = ['ngma']; // NGMA shut for state diplomatic reception

    setCompletedStopIds(completed);
    setCurrentLocationId(currentLoc);
    setCurrentTime(currTime);
    setDayEnd(endLimit);
    setVenueClosures(closures);
    setActiveTab('diff');

    runRescue({
      completedStopIds: completed,
      currentLocationId: currentLoc,
      currentTime: currTime,
      dayEnd: endLimit,
      venueClosures: closures
    });
  }

  // Hackathon Canonical Scenario 3: Honest Infeasibility Detection
  function triggerScenario3() {
    setActiveScenario(3);
    const completed = ['india_gate'];
    const currentLoc = 'ngma';
    const currTime = 825; // 13:45 (1:45 PM - Gulati lunch at 13:30 is physically missed!)
    const endLimit = 1200;
    const closures = [];

    setCompletedStopIds(completed);
    setCurrentLocationId(currentLoc);
    setCurrentTime(currTime);
    setDayEnd(endLimit);
    setVenueClosures(closures);
    setActiveTab('diff');

    runRescue({
      completedStopIds: completed,
      currentLocationId: currentLoc,
      currentTime: currTime,
      dayEnd: endLimit,
      venueClosures: closures
    });
  }

  // Apply Actionable Fallback from Infeasibility Result
  function handleApplyFallback(fallback) {
    if (fallback.action === 'RELAX_RESERVATION') {
      const updated = stops.map(s => {
        if (s.id === fallback.param.stop_id) {
          return { ...s, is_fixed_res: false };
        }
        return s;
      });
      setStops(updated);
      showToast('Relaxed fixed reservation to flexible walk-in window.');
      runRescue({ stops: updated });
    } else if (fallback.action === 'EXTEND_DAY_END') {
      const newEnd = fallback.param.new_day_end;
      setDayEnd(newEnd);
      showToast(`Extended day end limit to ${Math.floor(newEnd / 60)}:${newEnd % 60 || '00'}.`);
      runRescue({ dayEnd: newEnd });
    } else if (fallback.action === 'MANUAL_DROP') {
      const updated = stops.filter(s => s.id !== fallback.param.stop_id);
      setStops(updated);
      showToast('Omitted lower-priority destination.');
      runRescue({ stops: updated });
    }
  }

  // User Stop Priority & Constraint Updates
  function handleUpdateStopPriority(stopId, newPriority) {
    const updated = stops.map(s => s.id === stopId ? { ...s, priority: newPriority } : s);
    setStops(updated);
    runRescue({ stops: updated });
  }

  function handleUpdateStopDuration(stopId, newDuration) {
    const updated = stops.map(s => s.id === stopId ? { ...s, duration: newDuration } : s);
    setStops(updated);
    runRescue({ stops: updated });
  }

  function handleToggleFixedRes(stopId) {
    const updated = stops.map(s => {
      if (s.id === stopId) {
        return {
          ...s,
          is_fixed_res: !s.is_fixed_res,
          res_time: s.res_time || 810
        };
      }
      return s;
    });
    setStops(updated);
    runRescue({ stops: updated });
  }

  function handleUpdateResTime(stopId, newResTime) {
    const updated = stops.map(s => s.id === stopId ? { ...s, res_time: newResTime } : s);
    setStops(updated);
    runRescue({ stops: updated });
  }

  function handleMoveStop(index, direction) {
    const newIdx = index + direction;
    if (newIdx < 0 || newIdx >= stops.length) return;
    const updated = [...stops];
    const temp = updated[index];
    updated[index] = updated[newIdx];
    updated[newIdx] = temp;
    setStops(updated);
    runRescue({ stops: updated });
  }

  function handleRemoveStop(stopId) {
    const updated = stops.filter(s => s.id !== stopId);
    setStops(updated);
    runRescue({ stops: updated });
  }

  function handleToggleCompleteStop(stopId) {
    let updatedCompleted;
    if (completedStopIds.includes(stopId)) {
      updatedCompleted = completedStopIds.filter(id => id !== stopId);
    } else {
      updatedCompleted = [...completedStopIds, stopId];
    }
    setCompletedStopIds(updatedCompleted);
    runRescue({ completedStopIds: updatedCompleted });
  }

  function handleAddStop(newStop) {
    const updated = [...stops, newStop];
    setStops(updated);
    showToast(`Added ${newStop.name} to day itinerary`);
    runRescue({ stops: updated });
  }

  // Persist User Itinerary to SQLite
  async function handleSavePlan() {
    if (!currentUser) {
      setAuthModalOpen(true);
      return;
    }
    setIsSaving(true);
    try {
      await saveItinerary({
        user_id: currentUser.id,
        title: `${currentUser.name}'s Delhi Outing`,
        current_time: currentTime,
        current_location_id: currentLocationId,
        day_end: dayEnd,
        stops: stops,
        active_stop_ids: stops.map(s => s.id),
        completed_stop_ids: completedStopIds,
        venue_closures: venueClosures,
        last_rescue: rescueResult
      });
      showToast('Itinerary and custom priorities saved to SQLite database!');
    } catch (err) {
      showToast('Error saving: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  }

  function handleLoginSuccess(user) {
    setCurrentUser(user);
    localStorage.setItem('plan_rescue_user', JSON.stringify(user));
    showToast(`Signed in as ${user.name}`);
    loadInitialData(user.id);
  }

  function handleAcceptPlan() {
    showToast('Rescheduled itinerary accepted and locked as active day plan!');
  }

  function handleRevertPlan() {
    setStops(initialStops);
    loadInitialData(currentUser ? currentUser.id : null);
    showToast('Reverted to original plan.');
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 select-none">

      {/* Top Navigation */}
      <Navbar
        currentUser={currentUser}
        onOpenAuth={() => setAuthModalOpen(true)}
        onOpenJudge={() => setJudgeModalOpen(true)}
        onOpenTestAudit={() => setTestAuditModalOpen(true)}
        onResetPlan={() => loadInitialData(currentUser ? currentUser.id : null)}
        isSolving={isSolving}
        telemetry={rescueResult?.telemetry}
      />

      {/* 3 Canonical Pitch Scenario Ribbon */}
      <ScenarioBanner
        activeScenario={activeScenario}
        onTriggerScenario={(scenNum) => {
          if (scenNum === 1) triggerScenario1();
          else if (scenNum === 2) triggerScenario2();
          else if (scenNum === 3) triggerScenario3();
        }}
        onOpenDisruptionModal={() => setDisruptionModalOpen(true)}
        isSolving={isSolving}
      />

      {/* Main Workspace Grid */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden relative">

        {/* Left Side: Control & Diff Command Center (38% width on desktop) */}
        <div className="w-full lg:w-[440px] xl:w-[480px] 2xl:w-[520px] bg-slate-900 border-r border-slate-800 flex flex-col shrink-0 h-[50vh] lg:h-[calc(100vh-116px)]">

          {/* Sub Navigation Tabs */}
          <div className="flex items-center border-b border-slate-800 bg-slate-950/60 px-3 text-xs font-semibold shrink-0">
            <button
              onClick={() => setActiveTab('diff')}
              className={`flex items-center gap-1.5 py-3 px-3 border-b-2 transition ${activeTab === 'diff'
                  ? 'border-indigo-500 text-indigo-300'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
            >
              <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
              <span>The Rescue Diff</span>
            </button>

            <button
              onClick={() => setActiveTab('priorities')}
              className={`flex items-center gap-1.5 py-3 px-3 border-b-2 transition ${activeTab === 'priorities'
                  ? 'border-indigo-500 text-indigo-300'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
            >
              <Sliders className="h-3.5 w-3.5 text-amber-400" />
              <span>Priorities & Stops</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-800 text-slate-300 ml-0.5">
                {stops.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('telemetry')}
              className={`flex items-center gap-1.5 py-3 px-3 border-b-2 transition ${activeTab === 'telemetry'
                  ? 'border-indigo-500 text-indigo-300'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
            >
              <Activity className="h-3.5 w-3.5 text-emerald-400" />
              <span>Telemetry & Math</span>
            </button>
          </div>

          {/* Tab Body */}
          <div className="flex-1 overflow-hidden">
            {activeTab === 'diff' && (
              <TimelineDiff
                rescueResult={rescueResult}
                initialStops={initialStops}
                completedStopIds={completedStopIds}
                currentLocationId={currentLocationId}
                onAcceptPlan={handleAcceptPlan}
                onRevertPlan={handleRevertPlan}
                onApplyFallback={handleApplyFallback}
                onSelectStopOnMap={(stopId) => setSelectedStopId(stopId)}
                selectedStopId={selectedStopId}
              />
            )}

            {activeTab === 'priorities' && (
              <PriorityManager
                stops={stops}
                onUpdateStopPriority={handleUpdateStopPriority}
                onUpdateStopDuration={handleUpdateStopDuration}
                onToggleFixedRes={handleToggleFixedRes}
                onUpdateResTime={handleUpdateResTime}
                onMoveStop={handleMoveStop}
                onRemoveStop={handleRemoveStop}
                onToggleCompleteStop={handleToggleCompleteStop}
                onOpenAddModal={() => setAddStopModalOpen(true)}
                onSavePlan={handleSavePlan}
                isSaving={isSaving}
                completedStopIds={completedStopIds}
                currentUser={currentUser}
              />
            )}

            {activeTab === 'telemetry' && (
              <TelemetryCard
                telemetry={rescueResult?.telemetry}
                score={rescueResult?.score}
                stats={rescueResult?.stats}
              />
            )}
          </div>

        </div>

        {/* Right Side: Interactive Leaflet + OpenStreetMap */}
        <div className="flex-1 h-[50vh] lg:h-[calc(100vh-116px)] relative bg-slate-950">
          <MapView
            stops={stops}
            rescueResult={rescueResult}
            completedStopIds={completedStopIds}
            currentLocationId={currentLocationId}
            selectedStopId={selectedStopId}
            onSelectStop={(stopId) => setSelectedStopId(stopId)}
          />
        </div>

      </div>

      {/* Floating Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 border border-indigo-500/50 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2.5 text-xs font-semibold animate-in fade-in slide-in-from-bottom-2 duration-200">
          <CheckCircle className="h-4 w-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Modals */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onLoginSuccess={handleLoginSuccess}
        demoUsers={demoUsers}
      />

      <JudgeModal
        isOpen={judgeModalOpen}
        onClose={() => setJudgeModalOpen(false)}
      />

      <TestAuditModal
        isOpen={testAuditModalOpen}
        onClose={() => setTestAuditModalOpen(false)}
      />

      <AddStopModal
        isOpen={addStopModalOpen}
        onClose={() => setAddStopModalOpen(false)}
        onAddStop={handleAddStop}
        existingStopIds={stops.map(s => s.id)}
      />

      <DisruptionModal
        isOpen={disruptionModalOpen}
        onClose={() => setDisruptionModalOpen(false)}
        stops={stops}
        currentLocationId={currentLocationId}
        currentTime={currentTime}
        dayEnd={dayEnd}
        venueClosures={venueClosures}
        onApplyDisruption={(payload) => {
          setCurrentLocationId(payload.currentLocationId);
          setCurrentTime(payload.currentTime);
          setDayEnd(payload.dayEnd);
          setVenueClosures(payload.venueClosures);
          setActiveScenario(null);
          runRescue(payload);
        }}
      />

    </div>
  );
}

