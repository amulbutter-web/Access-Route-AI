// ============================================================
// AccessRoute AI — MapView Component
// Owner: Person 01
// Wraps Leaflet map. Shows campus markers and route polyline.
// Falls back gracefully when map tiles are unavailable.
// ============================================================

import React, { useEffect, useRef, useState } from "react";
import type { RouteResponse, Place } from "../../types";

// NOTE: Leaflet is imported dynamically to avoid SSR issues.
// Person 02 to confirm tile provider URL and attribution text.
const TILE_URL =
  "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
const TILE_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

// Campus center coordinates for IIIT Delhi.
// Person 03 to confirm these exact coordinates.
// PLACEHOLDER — do not use in production without verification.
const CAMPUS_CENTER: [number, number] = [28.5445, 77.2731];
const CAMPUS_ZOOM = 16;

// Route line color per accessibility status
const ROUTE_LINE_COLOR = "#6C4DFF"; // violet accent

interface MapViewProps {
  places: Place[];
  route?: RouteResponse;
  startId?: string | null;
  destId?: string | null;
}

export const MapView: React.FC<MapViewProps> = ({
  places: _places,
  route,
  startId: _startId,
  destId: _destId,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const routeLayerRef = useRef<any>(null);
  const [tilesError, setTilesError] = useState(false);

  // Initialize Leaflet map once
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    // Dynamically import Leaflet to avoid build issues in non-browser envs
    import("leaflet").then((L) => {
      if (!mapContainerRef.current) return;

      const map = L.map(mapContainerRef.current).setView(
        CAMPUS_CENTER,
        CAMPUS_ZOOM
      );

      const tileLayer = L.tileLayer(TILE_URL, {
        attribution: TILE_ATTRIBUTION,
        maxZoom: 19,
      });

      tileLayer.on("tileerror", () => setTilesError(true));
      tileLayer.addTo(map);

      mapRef.current = map;
    });

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Draw / clear route polyline
  useEffect(() => {
    if (!mapRef.current) return;

    import("leaflet").then((L) => {
      // Remove existing route layer
      if (routeLayerRef.current) {
        routeLayerRef.current.remove();
        routeLayerRef.current = null;
      }

      // Draw new route if found
      // NOTE: Person 03 must supply actual node coordinates.
      // The routeNodeIds from the response must be mapped to lat/lng pairs
      // from the places/nodes data. This requires Person 03's campus-nodes.json.
      // For now this is a stub — integrate when Person 03 provides node coords.
      if (
        route?.status === "found" &&
        route.routeNodeIds &&
        route.routeNodeIds.length > 0
      ) {
        // TODO: Map routeNodeIds to actual coordinates from campus-nodes data
        // Stub: this will be replaced when node coordinate data is available
        console.log(
          "[MapView] Route nodeIds to render:",
          route.routeNodeIds
        );
        // Example (replace with real coords from Person 03's data):
        // const latlngs = route.routeNodeIds.map(id => nodeCoordMap[id]);
        // if (latlngs.every(Boolean)) {
        //   routeLayerRef.current = L.polyline(latlngs, {
        //     color: ROUTE_LINE_COLOR, weight: 5
        //   }).addTo(mapRef.current);
        // }
      }
    });
  }, [route]);

  return (
    <div className="map-wrapper">
      {tilesError && (
        <div className="map-wrapper__tile-error" role="alert">
          Map unavailable — tile service could not be reached.
        </div>
      )}
      <div
        ref={mapContainerRef}
        className="map-container"
        aria-label="Campus accessibility map"
        // Map itself is not keyboard-navigatable in a standard way;
        // text directions below provide the accessible alternative
        aria-hidden={tilesError}
        style={{ height: "400px", width: "100%" }}
      />
    </div>
  );
};

export default MapView;
