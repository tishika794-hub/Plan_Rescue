// frontend/src/components/MapView.jsx
import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { ShieldCheck, MapPin, Layers } from 'lucide-react';

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

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    // Center on Central Delhi
    const map = L.map(mapContainerRef.current, {
      center: [28.605, 77.233],
      zoom: 13,
      zoomControl: false,
    });

    // Sleek Dark Matter / CartoDB Voyager or OpenStreetMap
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: 'abcd',
    }).addTo(map);

    L.control.zoom({ position: 'topright' }).addTo(map);

    polylineLayerRef.current = L.layerGroup().addTo(map);
    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update Markers & Polylines when stops or rescueResult change
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

    // Map of timeline item by id for quick lookup
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

    // Create markers for each stop
    stops.forEach((stop) => {
      const isCompleted = completedStopIds.includes(stop.id);
      const isCurrent = stop.id === currentLocationId;
      const isDropped = droppedIds.has(stop.id);
      const timelineItem = timelineMap[stop.id];

      latlngsMap[stop.id] = [stop.lat, stop.lng];

      let iconHtml = '';
      let markerColor = '#4f46e5';

      if (isCompleted) {
        markerColor = '#10b981'; // emerald
        iconHtml = `
          <div style="background-color: ${markerColor}; color: white; width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; border: 2px solid white; box-shadow: 0 4px 10px rgba(0,0,0,0.4);">
            ✓
          </div>
        `;
      } else if (isCurrent) {
        markerColor = '#f59e0b'; // amber
        iconHtml = `
          <div style="position: relative; display: flex; align-items: center; justify-content: center; width: 36px; height: 36px;">
            <div style="position: absolute; width: 100%; height: 100%; border-radius: 50%; background: rgba(245, 158, 11, 0.4); animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
            <div style="background-color: #f59e0b; color: white; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 800; border: 2px solid white; box-shadow: 0 4px 12px rgba(245,158,11,0.5); z-index: 2;">
              ●
            </div>
          </div>
        `;
      } else if (isDropped) {
        markerColor = '#ef4444'; // rose
        iconHtml = `
          <div style="background-color: #ef4444; color: white; width: 26px; height: 26px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; border: 2px solid #fee2e2; box-shadow: 0 4px 10px rgba(0,0,0,0.3); opacity: 0.85;">
            ✕
          </div>
        `;
      } else if (timelineItem) {
        markerColor = stop.is_fixed_res ? '#8b5cf6' : '#3b82f6';
        iconHtml = `
          <div style="background-color: ${markerColor}; color: white; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 13px; border: 2px solid white; box-shadow: 0 4px 12px rgba(0,0,0,0.4);">
            ${timelineItem.orderIndex}
          </div>
        `;
      } else {
        markerColor = '#64748b';
        iconHtml = `
          <div style="background-color: ${markerColor}; color: white; width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 11px; border: 2px solid white;">
            •
          </div>
        `;
      }

      const customIcon = L.divIcon({
        className: 'custom-leaflet-marker',
        html: iconHtml,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
        popupAnchor: [0, -18]
      });

      const marker = L.marker([stop.lat, stop.lng], { icon: customIcon }).addTo(map);

      // Popup Content
      const popupContent = `
        <div style="font-family: inherit; padding: 2px; min-width: 190px;">
          <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px;">
            <strong style="font-size: 13px; color: #f8fafc;">${stop.name}</strong>
            <span style="font-size: 10px; font-weight: 700; color: #f59e0b; background: rgba(245,158,11,0.15); padding: 2px 6px; border-radius: 4px;">P${stop.priority}</span>
          </div>
          <div style="font-size: 11px; color: #94a3b8; margin-top: 4px;">${stop.category || 'Attraction'}</div>
          ${stop.is_fixed_res ? '<div style="margin-top: 4px; font-size: 11px; color: #c084fc; font-weight: 600;">⚡ Fixed Reservation: 13:30 (Sharp)</div>' : ''}
          ${timelineItem ? `
            <div style="margin-top: 6px; padding: 6px; background: rgba(30,41,59,0.8); border-radius: 6px; font-size: 11px; border: 1px solid #334155;">
              <div>🕒 Rescheduled Arrival: <strong style="color: #60a5fa;">${timelineItem.arrival_fmt}</strong></div>
              <div>🏛️ Visit: <strong style="color: #cbd5e1;">${timelineItem.start_fmt} – ${timelineItem.departure_fmt}</strong></div>
            </div>
          ` : ''}
          ${isDropped ? '<div style="margin-top: 6px; color: #f87171; font-size: 11px; font-weight: 600;">✕ Dropped: Time window conflict</div>' : ''}
        </div>
      `;

      marker.bindPopup(popupContent);
      marker.on('click', () => {
        if (onSelectStop) onSelectStop(stop.id);
      });

      markersRef.current[stop.id] = marker;
    });

    // Draw Polylines
    // 1. Completed Path (Green)
    if (completedStopIds.length > 1) {
      const completedCoords = completedStopIds
        .map(id => latlngsMap[id])
        .filter(Boolean);
      if (completedCoords.length > 1) {
        L.polyline(completedCoords, {
          color: '#10b981',
          weight: 4,
          opacity: 0.85,
          dashArray: '2, 6'
        }).addTo(polylineLayerRef.current);
      }
    }

    // 2. Rescheduled Active Path (Indigo / Cyan)
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
          color: '#4f46e5',
          weight: 5,
          opacity: 0.9,
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
            opacity: 0.6
          }).addTo(polylineLayerRef.current);
        }
      });
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
    <div className="relative w-full h-full min-h-[420px] bg-slate-950 flex flex-col">
      {/* Map Canvas */}
      <div ref={mapContainerRef} className="flex-1 w-full h-full z-0" />

      {/* Floating Map Legend & Legal Defensibility Notice */}
      <div className="absolute bottom-4 left-4 right-4 z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pointer-events-none">
        
        {/* Route Color Legend */}
        <div className="pointer-events-auto bg-slate-900/90 backdrop-blur border border-slate-800 rounded-xl px-3.5 py-2 shadow-xl flex items-center gap-4 text-[11px] text-slate-300">
          <div className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-full bg-amber-500 animate-pulse"></span>
            <span>Current Pos</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-6 rounded-full bg-indigo-600"></span>
            <span>Active Plan</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-6 rounded-full bg-emerald-500"></span>
            <span>Visited</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-1 w-6 border-t-2 border-dashed border-rose-500"></span>
            <span>Dropped Leg</span>
          </div>
        </div>

        {/* Legal & Privacy Defensible Pill */}
        <div className="pointer-events-auto bg-slate-900/90 backdrop-blur border border-slate-800 rounded-xl px-3 py-1.5 shadow-xl text-[10px] text-slate-400 flex items-center gap-1.5">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
          <span>Independent Prototype • Legally Defensible (OSM / Leaflet)</span>
        </div>

      </div>
    </div>
  );
}

