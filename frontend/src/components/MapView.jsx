// frontend/src/components/MapView.jsx
import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { ShieldCheck, MapPin, Layers, Compass } from 'lucide-react';

export default function MapView({ 
  stops, 
  rescueResult, 
  completedStopIds, 
  currentLocationId, 
  selectedStopId, 
  onSelectStop 
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef({});
  const polylineLayerRef = useRef(null);
  const tileLayerRef = useRef(null);

  const [activeTileProvider, setActiveTileProvider] = useState('osm_standard'); // 'osm_standard' | 'osm_hot'

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    // Center on Central Delhi (India Gate / Lutyens / Heritage corridor)
    const map = L.map(mapContainerRef.current, {
      center: [28.608, 77.232],
      zoom: 13,
      zoomControl: false,
    });

    // Official OpenStreetMap Standard Tile Layer — 100% Free, NO API Key Required
    const tileLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> contributors | Plan Rescue',
      subdomains: ['a', 'b', 'c'],
    }).addTo(map);

    tileLayerRef.current = tileLayer;

    L.control.zoom({ position: 'topright' }).addTo(map);

    polylineLayerRef.current = L.layerGroup().addTo(map);
    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Handle Tile Provider Switch
  useEffect(() => {
    if (!mapInstanceRef.current || !tileLayerRef.current) return;
    mapInstanceRef.current.removeLayer(tileLayerRef.current);

    let newUrl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
    let newAttr = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

    if (activeTileProvider === 'osm_hot') {
      newUrl = 'https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png';
      newAttr = '&copy; OpenStreetMap contributors, Tiles style by Humanitarian OpenStreetMap Team';
    }

    const newLayer = L.tileLayer(newUrl, {
      maxZoom: 19,
      attribution: newAttr,
      subdomains: ['a', 'b', 'c']
    }).addTo(mapInstanceRef.current);

    tileLayerRef.current = newLayer;
  }, [activeTileProvider]);

  // Update Place Name Markers & Polylines when stops or rescueResult change
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Clear existing markers & polylines
    Object.values(markersRef.current).forEach(m => m.remove());
    markersRef.current = {};
    if (polylineLayerRef.current) {
      polylineLayerRef.current.clearLayers();
    }

    if (!stops || stops.length === 0) return;

    // Build timeline lookup
    const timelineMap = {};
    if (rescueResult && rescueResult.timeline) {
      rescueResult.timeline.forEach((item, idx) => {
        timelineMap[item.id] = { ...item, orderIndex: idx + 1 };
      });
    }

    const droppedIds = new Set(
      (rescueResult && rescueResult.dropped_stops ? rescueResult.dropped_stops.map(d => d.id) : [])
    );

    const latlngsMap = {};
    const bounds = [];

    // Create Place Name Pill Markers for each stop
    stops.forEach((stop) => {
      const isCompleted = completedStopIds.includes(stop.id);
      const isCurrent = stop.id === currentLocationId;
      const isDropped = droppedIds.has(stop.id);
      const timelineItem = timelineMap[stop.id];

      latlngsMap[stop.id] = [stop.lat, stop.lng];
      bounds.push([stop.lat, stop.lng]);

      let statusTheme = 'marker-active';
      let badgeHtml = '•';
      let timeText = '';

      if (isCompleted) {
        statusTheme = 'marker-completed';
        badgeHtml = '✓';
        timeText = 'Visited';
      } else if (isCurrent) {
        statusTheme = 'marker-current';
        badgeHtml = '●';
        timeText = 'Current Location';
      } else if (isDropped) {
        statusTheme = 'marker-dropped';
        badgeHtml = '✕';
        timeText = 'Dropped';
      } else if (stop.is_fixed_res) {
        statusTheme = 'marker-reservation';
        badgeHtml = '⚡';
        timeText = '13:30 Sharp';
      } else if (timelineItem) {
        statusTheme = 'marker-active';
        badgeHtml = `${timelineItem.orderIndex}`;
        timeText = timelineItem.arrival_fmt || '';
      }

      // Sleek HTML Pill with PLACE NAME instead of just bare numbers
      const pillHtml = `
        <div class="map-place-marker ${statusTheme}">
          <div class="marker-pill">
            <span class="marker-badge">${badgeHtml}</span>
            <span class="marker-name">${stop.name}</span>
            ${timeText ? `<span class="marker-time">${timeText}</span>` : ''}
          </div>
          <div class="marker-arrow"></div>
        </div>
      `;

      const customIcon = L.divIcon({
        className: 'map-place-marker-wrapper',
        html: pillHtml,
        iconSize: [0, 0], // Anchor directly onto coordinate via CSS transform
        iconAnchor: [0, 0],
        popupAnchor: [0, -32]
      });

      const marker = L.marker([stop.lat, stop.lng], { icon: customIcon }).addTo(map);

      // Interactive Popup Content
      const popupContent = `
        <div style="font-family: inherit; padding: 4px; min-width: 210px;">
          <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px;">
            <strong style="font-size: 13px; color: #f8fafc;">${stop.name}</strong>
            <span style="font-size: 10px; font-weight: 700; color: #f59e0b; background: rgba(245,158,11,0.15); padding: 2px 6px; border-radius: 4px;">P${stop.priority}</span>
          </div>
          <div style="font-size: 11px; color: #94a3b8; margin-top: 3px;">${stop.category || 'Delhi Destination'}</div>
          ${stop.is_fixed_res ? '<div style="margin-top: 5px; font-size: 11px; color: #c084fc; font-weight: 700;">⚡ Strict Fixed Reservation: 13:30 (±15m tolerance)</div>' : ''}
          ${timelineItem ? `
            <div style="margin-top: 6px; padding: 6px; background: rgba(30,41,59,0.9); border-radius: 6px; font-size: 11px; border: 1px solid #334155;">
              <div>🕒 Rescheduled Arrival: <strong style="color: #60a5fa;">${timelineItem.arrival_fmt}</strong></div>
              <div>🏛️ Visit Dwell: <strong style="color: #cbd5e1;">${timelineItem.start_fmt} – ${timelineItem.departure_fmt}</strong> (${stop.duration}m)</div>
            </div>
          ` : ''}
          ${isDropped ? '<div style="margin-top: 6px; color: #f87171; font-size: 11px; font-weight: 600;">✕ Omitted: Visit would exceed daily time cutoff</div>' : ''}
          <div style="margin-top: 6px; font-size: 10px; color: #64748b;">Coordinates: ${stop.lat.toFixed(4)}, ${stop.lng.toFixed(4)}</div>
        </div>
      `;

      marker.bindPopup(popupContent);
      marker.on('click', () => {
        if (onSelectStop) onSelectStop(stop.id);
      });

      markersRef.current[stop.id] = marker;
    });

    // Draw Vector Route Polylines
    // 1. Completed Path (Emerald Green)
    if (completedStopIds.length > 1) {
      const completedCoords = completedStopIds
        .map(id => latlngsMap[id])
        .filter(Boolean);
      if (completedCoords.length > 1) {
        L.polyline(completedCoords, {
          color: '#10b981',
          weight: 4,
          opacity: 0.85,
          dashArray: '3, 6'
        }).addTo(polylineLayerRef.current);
      }
    }

    // 2. Rescheduled Active Route (Solid Blue/Indigo with thick visible stroke)
    if (rescueResult && rescueResult.timeline && rescueResult.timeline.length > 0) {
      const activeCoords = [];
      if (latlngsMap[currentLocationId]) {
        activeCoords.push(latlngsMap[currentLocationId]);
      }
      rescueResult.timeline.forEach(item => {
        if (latlngsMap[item.id]) {
          activeCoords.push(latlngsMap[item.id]);
        }
      });

      if (activeCoords.length > 1) {
        L.polyline(activeCoords, {
          color: '#3b82f6',
          weight: 5,
          opacity: 0.92,
          lineJoin: 'round'
        }).addTo(polylineLayerRef.current);
      }
    }

    // 3. Dropped Leg (Red Dashed)
    if (droppedIds.size > 0 && currentLocationId) {
      droppedIds.forEach(dropId => {
        if (latlngsMap[dropId] && latlngsMap[currentLocationId]) {
          L.polyline([latlngsMap[currentLocationId], latlngsMap[dropId]], {
            color: '#ef4444',
            weight: 2.5,
            dashArray: '6, 8',
            opacity: 0.65
          }).addTo(polylineLayerRef.current);
        }
      });
    }

    // Adjust camera to fit all destinations smoothly
    if (bounds.length > 1 && !selectedStopId) {
      map.fitBounds(bounds, { padding: [60, 60], maxZoom: 14 });
    }

  }, [stops, rescueResult, completedStopIds, currentLocationId]);

  // Center/Pan when selectedStopId changes
  useEffect(() => {
    if (!selectedStopId || !markersRef.current[selectedStopId]) return;
    const marker = markersRef.current[selectedStopId];
    if (mapInstanceRef.current) {
      mapInstanceRef.current.panTo(marker.getLatLng(), { animate: true, duration: 0.8 });
      marker.openPopup();
    }
  }, [selectedStopId]);

  return (
    <div className="relative w-full h-full min-h-[420px] bg-slate-900 flex flex-col">
      {/* Map Canvas */}
      <div ref={mapContainerRef} className="flex-1 w-full h-full z-0" />

      {/* Top Map Layer Switcher (Standard OpenStreetMap vs Humanitarian OSM - Zero API key) */}
      <div className="absolute top-4 left-4 z-10 flex items-center gap-1.5 bg-slate-900/95 backdrop-blur border border-slate-700 rounded-lg p-1 shadow-lg text-xs">
        <button
          onClick={() => setActiveTileProvider('osm_standard')}
          className={`px-2.5 py-1 rounded font-semibold transition ${
            activeTileProvider === 'osm_standard'
              ? 'bg-indigo-600 text-white shadow'
              : 'text-slate-300 hover:text-white'
          }`}
          title="Official OpenStreetMap Standard — 100% Free, No API Key"
        >
          OSM Standard
        </button>
        <button
          onClick={() => setActiveTileProvider('osm_hot')}
          className={`px-2.5 py-1 rounded font-semibold transition ${
            activeTileProvider === 'osm_hot'
              ? 'bg-indigo-600 text-white shadow'
              : 'text-slate-300 hover:text-white'
          }`}
          title="OpenStreetMap Humanitarian / High Contrast — 100% Free, No API Key"
        >
          OSM High-Contrast
        </button>
      </div>

      {/* Floating Map Legend & Legal Defensibility Notice */}
      <div className="absolute bottom-4 left-4 right-4 z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pointer-events-none">
        
        {/* Route Color Legend */}
        <div className="pointer-events-auto bg-slate-900/95 backdrop-blur border border-slate-800 rounded-xl px-3.5 py-2 shadow-2xl flex items-center flex-wrap gap-3.5 text-[11px] text-slate-200">
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-amber-500 animate-pulse"></span>
            <span>Current Pos</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-5 rounded-full bg-blue-500"></span>
            <span>Active Plan</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-5 rounded-full bg-purple-500"></span>
            <span>Fixed Res</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-5 rounded-full bg-emerald-500"></span>
            <span>Visited</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-1 w-5 border-t-2 border-dashed border-rose-500"></span>
            <span>Dropped Leg</span>
          </div>
        </div>

        {/* Legal & Privacy Defensible Pill */}
        <div className="pointer-events-auto bg-slate-900/95 backdrop-blur border border-slate-800 rounded-xl px-3 py-1.5 shadow-2xl text-[10px] text-slate-300 flex items-center gap-1.5">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
          <span>Real OpenStreetMap (Zero API Key Needed • Google Maps TOS §3.2.3 Defensible)</span>
        </div>

      </div>
    </div>
  );
}
