import React, { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import type { RouteResponse, Place } from "../../types";

// Visual preview only: Person 3 must supply verified campus graph geometry.
const CAMPUS_CENTER: [number, number] = [77.2731, 28.5445];
const MAP_STYLE = "https://demotiles.maplibre.org/style.json";
interface MapViewProps { places: Place[]; route?: RouteResponse; startId?: string | null; destId?: string | null; }

export const MapView: React.FC<MapViewProps> = ({ places, route, startId, destId }) => {
  const container = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const [mapState, setMapState] = useState<"loading" | "ready" | "unavailable">("loading");
  useEffect(() => {
    if (!container.current || mapRef.current) return;
    const map = new maplibregl.Map({ container: container.current, style: MAP_STYLE, center: CAMPUS_CENTER, zoom: 15.7, pitch: 58, bearing: -22 });
    map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), "top-right");
    map.on("load", () => {
      const buildingLayer = map.getStyle().layers?.find((layer) => layer.type === "fill-extrusion");
      if (buildingLayer) map.setPaintProperty(buildingLayer.id, "fill-extrusion-opacity", 0.72);
      setMapState("ready");
    });
    map.on("error", () => setMapState("unavailable"));
    mapRef.current = map;
    return () => { map.remove(); mapRef.current = null; };
  }, []);
  const selection = [places.find((p) => p.id === startId)?.name, places.find((p) => p.id === destId)?.name].filter(Boolean).join(" → ");
  const routeNotice = route?.status === "found" ? "Route details are shown below; map geometry awaits verified graph coordinates." : "Select a route to view its verified geometry when available.";
  return <div className="map-stage">
    <div className="map-stage__chrome" aria-live="polite"><span className="map-stage__pulse" aria-hidden="true" /><span>{mapState === "ready" ? "3D map preview" : mapState === "loading" ? "Loading map" : "Map preview unavailable"}</span><span className="map-stage__divider" aria-hidden="true" /><span>{selection || "Verified graph not yet loaded"}</span></div>
    {mapState === "unavailable" && <div className="map-stage__fallback" role="alert">The visual map is unavailable. Text directions remain the authoritative fallback.</div>}
    <div ref={container} className="map-container" aria-label="3D campus map preview" aria-hidden={mapState === "unavailable"} />
    <div className="map-stage__caption"><strong>Evidence-first map.</strong> {routeNotice}</div>
  </div>;
};
export default MapView;
