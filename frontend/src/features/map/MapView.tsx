// ============================================================
// AccessRoute AI — MapView Component
// Clean, Uncluttered, Modern Map Visualization (Google/Apple Maps style)
// Real OpenStreetMap Tiles + Clean Route Polyline + Origin/Dest Pins Only
// NO CLUTTERED PINS OR FLOATING LABELS
// ============================================================

import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import type { Location, RouteResult } from '../../types';

interface MapViewProps {
  locations: Location[];
  route?: RouteResult;
  fromId: string | null;
  toId: string | null;
}

// Delhi High Court Campus Center (Sher Shah Road, New Delhi)
const DHC_CENTER: [number, number] = [28.6329, 77.2412];
const DEFAULT_ZOOM = 17;

export const MapView: React.FC<MapViewProps> = ({
  locations,
  route,
  fromId,
  toId,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const routeLayerRef = useRef<L.LayerGroup | null>(null);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Initialize Map
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    try {
      const map = L.map(containerRef.current, {
        center: DHC_CENTER,
        zoom: DEFAULT_ZOOM,
        minZoom: 14,
        maxZoom: 19,
        zoomControl: false,
      });

      // Zoom control in top right
      L.control.zoom({ position: 'topright' }).addTo(map);

      // Clean OpenStreetMap standard tiles (real map, free, no watermarks, full Delhi coverage)
      const tileLayer = L.tileLayer(
        'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          maxZoom: 19,
          subdomains: ['a', 'b', 'c'],
        }
      );

      tileLayer.on('tileerror', () => {
        setIsOffline(true);
      });

      tileLayer.on('load', () => {
        setIsOffline(false);
      });

      tileLayer.addTo(map);

      // Dedicated layer for route & active markers ONLY
      const routeLayer = L.layerGroup().addTo(map);
      routeLayerRef.current = routeLayer;

      mapRef.current = map;

      const handleResize = () => map.invalidateSize();
      window.addEventListener('resize', handleResize);

      return () => {
        window.removeEventListener('resize', handleResize);
        map.remove();
        mapRef.current = null;
      };
    } catch (err) {
      console.warn('[MapView] Init error:', err);
    }
  }, []);

  // Update Route: ONLY draw active route line and origin/destination markers
  useEffect(() => {
    const map = mapRef.current;
    const routeLayer = routeLayerRef.current;
    if (!map || !routeLayer) return;

    routeLayer.clearLayers();

    if (route && route.success && route.route && route.route.length > 0) {
      const latLngs: [number, number][] = [];

      route.route.forEach((seg) => {
        const startPt: [number, number] = [seg.from.lat, seg.from.lng];
        const endPt: [number, number] = [seg.to.lat, seg.to.lng];

        if (latLngs.length === 0) latLngs.push(startPt);
        latLngs.push(endPt);

        // Beautiful route stroke: Forest green for verified step-free, Amber for reported
        const strokeColor =
          seg.edge.accessibilityStatus === 'reported_step_free'
            ? '#D97706'
            : seg.edge.accessibilityStatus === 'unknown'
            ? '#64748B'
            : '#15803D'; // Rich green

        // Outer glow/casing line (for high contrast against any map background)
        L.polyline([startPt, endPt], {
          color: '#FFFFFF',
          weight: 9,
          opacity: 0.9,
          lineCap: 'round',
          lineJoin: 'round',
        }).addTo(routeLayer);

        // Main colored route line
        L.polyline([startPt, endPt], {
          color: strokeColor,
          weight: 6,
          opacity: 0.95,
          lineCap: 'round',
          lineJoin: 'round',
          dashArray: seg.edge.accessibilityStatus === 'unknown' ? '6, 8' : undefined,
        }).bindTooltip(
          `<strong>${seg.edge.pathType.replace('_', ' ').toUpperCase()}</strong> (${seg.edge.distanceMeters}m)`,
          { sticky: true }
        ).addTo(routeLayer);
      });

      // Start Marker (Clean Minimal Circular Badge)
      const first = route.route[0];
      const startIcon = L.divIcon({
        className: 'clean-map-marker-start',
        html: `
          <div style="
            background: #15803D;
            color: #FFFFFF;
            width: 32px;
            height: 32px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 15px;
            font-weight: 800;
            box-shadow: 0 4px 12px rgba(21, 128, 61, 0.45);
            border: 2.5px solid #FFFFFF;
          ">
            A
          </div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });

      L.marker([first.from.lat, first.from.lng], { icon: startIcon })
        .bindPopup(`<strong>Start:</strong> ${first.from.name}`)
        .addTo(routeLayer);

      // Destination Marker (Clean Minimal Circular Badge)
      const last = route.route[route.route.length - 1];
      const destIcon = L.divIcon({
        className: 'clean-map-marker-dest',
        html: `
          <div style="
            background: #6F4E37;
            color: #FFFFFF;
            width: 32px;
            height: 32px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 15px;
            font-weight: 800;
            box-shadow: 0 4px 12px rgba(111, 78, 55, 0.45);
            border: 2.5px solid #FFFFFF;
          ">
            B
          </div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });

      L.marker([last.to.lat, last.to.lng], { icon: destIcon })
        .bindPopup(`<strong>Destination:</strong> ${last.to.name}`)
        .addTo(routeLayer);

      // Fit map bounds neatly to the active route
      if (latLngs.length > 1) {
        map.fitBounds(L.latLngBounds(latLngs), { padding: [50, 50] });
      }
    } else {
      map.setView(DHC_CENTER, DEFAULT_ZOOM);
    }
  }, [route, fromId, toId]);

  const handleReset = () => {
    if (mapRef.current) {
      mapRef.current.setView(DHC_CENTER, DEFAULT_ZOOM);
    }
  };

  const fromLabel = locations.find((l) => l.id === fromId)?.shortName;
  const toLabel = locations.find((l) => l.id === toId)?.shortName;

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '480px',
        borderRadius: 'var(--radius-lg)',
        overflow: 'hidden',
        background: '#F0ECE6',
      }}
    >
      {/* Subtle, Minimal HUD Bar in Top Left */}
      <div
        style={{
          position: 'absolute',
          top: '0.85rem',
          left: '0.85rem',
          zIndex: 1000,
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(8px)',
          border: '1.5px solid var(--platinum-border)',
          borderRadius: 'var(--radius-sm)',
          padding: '0.45rem 0.85rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.65rem',
          boxShadow: 'var(--shadow-subtle)',
          fontSize: '0.78rem',
          fontWeight: 700,
          color: 'var(--text-headline)',
        }}
      >
        <span style={{ color: '#15803D' }}>●</span>
        <span>
          {fromLabel && toLabel
            ? `${fromLabel} ➔ ${toLabel}`
            : 'Delhi High Court Complex'}
        </span>
        <button
          type="button"
          onClick={handleReset}
          title="Reset View"
          style={{
            marginLeft: '0.4rem',
            background: 'var(--platinum-surface)',
            border: '1px solid var(--platinum-border)',
            borderRadius: '4px',
            padding: '0.2rem 0.5rem',
            fontSize: '0.7rem',
            cursor: 'pointer',
            fontWeight: 700,
            color: 'var(--mocha-primary)',
          }}
        >
          Reset View
        </button>
      </div>

      {/* Offline notice only if offline */}
      {isOffline && (
        <div
          style={{
            position: 'absolute',
            bottom: '0.85rem',
            left: '0.85rem',
            zIndex: 1000,
            background: 'rgba(254, 243, 199, 0.95)',
            border: '1.5px solid #FCD34D',
            color: '#78350F',
            borderRadius: 'var(--radius-sm)',
            padding: '0.45rem 0.85rem',
            fontSize: '0.75rem',
            fontWeight: 600,
          }}
        >
          📶 Connect to the internet to load live OpenStreetMap street tiles. (Route line & turn directions remain 100% active).
        </div>
      )}

      {/* Map Canvas */}
      <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
    </div>
  );
};

export default MapView;
