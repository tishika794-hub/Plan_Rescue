// frontend/src/components/AddStopModal.jsx
import React, { useState, useEffect } from 'react';
import { X, Plus, MapPin, Clock, Star, Landmark, Sparkles } from 'lucide-react';
import { fetchCatalog } from '../api';

export default function AddStopModal({ isOpen, onClose, onAddStop, existingStopIds }) {
  const [activeTab, setActiveTab] = useState('catalog');
  const [catalog, setCatalog] = useState([]);

  // Custom stop form state
  const [customName, setCustomName] = useState('');
  const [customCategory, setCustomCategory] = useState('Landmark');
  const [customDuration, setCustomDuration] = useState(60);
  const [customPriority, setCustomPriority] = useState(3);
  const [customLat, setCustomLat] = useState('28.614');
  const [customLng, setCustomLng] = useState('77.209');
  const [openTime, setOpenTime] = useState(540); // 9:00 AM
  const [closeTime, setCloseTime] = useState(1200); // 8:00 PM

  useEffect(() => {
    if (isOpen) {
      fetchCatalog()
        .then(data => setCatalog(data.catalog || []))
        .catch(err => console.error('Failed to load catalog', err));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  function handleAddCatalogItem(item) {
    onAddStop({
      ...item,
      open_time: item.open_time,
      close_time: item.close_time,
      is_fixed_res: false,
    });
    onClose();
  }

  function handleCreateCustom(e) {
    e.preventDefault();
    if (!customName.trim()) return;

    const newId = `custom_${Date.now()}`;
    onAddStop({
      id: newId,
      name: customName.trim(),
      category: customCategory,
      lat: parseFloat(customLat) || 28.614,
      lng: parseFloat(customLng) || 77.209,
      open_time: openTime,
      close_time: closeTime,
      duration: customDuration,
      priority: customPriority,
      is_fixed_res: false,
      description: 'Custom added user destination'
    });
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm select-none">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl max-h-[85vh] flex flex-col shadow-2xl relative text-slate-100">

        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center">
              <Plus className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Add Destination to Day Itinerary
              </h3>
              <p className="text-xs text-slate-400">
                Choose from verified Delhi landmarks or define a custom location
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="px-5 pt-3 border-b border-slate-800 flex gap-4 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('catalog')}
            className={`pb-2.5 border-b-2 transition ${activeTab === 'catalog'
                ? 'border-indigo-500 text-indigo-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
          >
            Curated Delhi Catalog
          </button>
          <button
            onClick={() => setActiveTab('custom')}
            className={`pb-2.5 border-b-2 transition ${activeTab === 'custom'
                ? 'border-indigo-500 text-indigo-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
          >
            Custom Location Entry
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5">
          {activeTab === 'catalog' ? (
            <div className="space-y-3">
              {catalog.map((item) => {
                const isAlreadyAdded = existingStopIds.includes(item.id);

                return (
                  <div
                    key={item.id}
                    className="p-3.5 rounded-xl bg-slate-850 border border-slate-800 hover:border-slate-700 transition flex items-start justify-between gap-3"
                  >
                    <div className="flex items-start gap-3">
                      <div className="h-8 w-8 rounded-lg bg-indigo-950/60 text-indigo-300 border border-indigo-800/50 flex items-center justify-center shrink-0 mt-0.5">
                        <Landmark className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-bold text-slate-100">{item.name}</h4>
                          <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-800 text-slate-400 border border-slate-700">
                            {item.category}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-1 leading-snug">
                          {item.description}
                        </p>
                        <div className="flex items-center gap-3 mt-2 text-[10px] text-slate-400 font-medium">
                          <span className="flex items-center gap-1 text-amber-300">
                            <Star className="h-3 w-3 fill-amber-400/20" /> P{item.priority}
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3 text-indigo-400" /> {item.duration}m
                          </span>
                          <span>•</span>
                          <span>
                            Hours: {Math.floor(item.open_time / 60)}:00 – {Math.floor(item.close_time / 60)}:00
                          </span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => handleAddCatalogItem(item)}
                      disabled={isAlreadyAdded}
                      className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-500 text-white shadow transition shrink-0"
                    >
                      {isAlreadyAdded ? 'Added' : 'Add Stop'}
                    </button>
                  </div>
                );
              })}
            </div>
          ) : (
            <form onSubmit={handleCreateCustom} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Destination Name</label>
                <input
                  type="text"
                  required
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  placeholder="e.g. Lotus Temple or Chandni Chowk"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Category</label>
                  <input
                    type="text"
                    value={customCategory}
                    onChange={(e) => setCustomCategory(e.target.value)}
                    placeholder="e.g. Monument, Cafe, Heritage"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Visit Duration (mins)</label>
                  <input
                    type="number"
                    min="15"
                    max="180"
                    step="15"
                    value={customDuration}
                    onChange={(e) => setCustomDuration(parseInt(e.target.value) || 60)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Latitude</label>
                  <input
                    type="number"
                    step="0.001"
                    value={customLat}
                    onChange={(e) => setCustomLat(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Longitude</label>
                  <input
                    type="number"
                    step="0.001"
                    value={customLng}
                    onChange={(e) => setCustomLng(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Priority Rating: <strong className="text-amber-400">P{customPriority}</strong>
                </label>
                <input
                  type="range"
                  min="1"
                  max="5"
                  step="1"
                  value={customPriority}
                  onChange={(e) => setCustomPriority(parseInt(e.target.value))}
                  className="w-full accent-amber-400 h-1.5 bg-slate-700 rounded-lg cursor-pointer"
                />
              </div>

              <button
                type="submit"
                className="w-full mt-3 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold shadow-lg transition"
              >
                Add Custom Stop to Plan
              </button>
            </form>
          )}
        </div>

      </div>
    </div>
  );
}

