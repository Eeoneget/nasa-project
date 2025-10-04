"use client";

import { useMemo } from "react";
import {
  MapContainer,
  TileLayer,
  LayerGroup,
  CircleMarker,
  Tooltip
} from "react-leaflet";

const layerColors = {
  seaSurfaceTemperature: "#16a34a",
  phytoplankton: "#22d3ee",
  sharkHotspots: "#c084fc"
};

const defaultCenter = [40.6, -73.7];
const defaultZoom = 7;
const DEGREE_LABEL = "degC";

function intersectsDepth(filterRange, featureRange) {
  if (!filterRange || !featureRange) return true;
  return featureRange[0] <= filterRange[1] && featureRange[1] >= filterRange[0];
}

function withinTemperature(tempRange, featureTemp) {
  if (!tempRange || typeof featureTemp !== "number") return true;
  return featureTemp >= tempRange[0] && featureTemp <= tempRange[1];
}

function matchesTimeFilter(timeFilter, timestamp) {
  if (!timeFilter || timeFilter === "season") return true;
  if (!timestamp) return false;
  const hour = new Date(timestamp).getUTCHours();
  if (timeFilter === "day") {
    return hour >= 6 && hour < 18;
  }
  if (timeFilter === "night") {
    return hour < 6 || hour >= 18;
  }
  return true;
}

function temperatureRadius(value) {
  return Math.max(8, Math.min(20, (value - 18) * 3 + 10));
}

function phytoplanktonRadius(value) {
  return Math.max(6, Math.min(18, value * 4));
}

function hotspotRadius(confidence) {
  return Math.max(10, Math.round(confidence * 25));
}

export default function OceanMap({ layers, visibleLayers, filters }) {
  const { depthRange, temperatureRange, timeFilter } = filters;

  const filteredLayers = useMemo(() => {
    return {
      seaSurfaceTemperature: layers.seaSurfaceTemperature.filter((point) =>
        intersectsDepth(depthRange, point.depthRange) &&
        withinTemperature(temperatureRange, point.temperature) &&
        matchesTimeFilter(timeFilter, point.timestamp)
      ),
      phytoplankton: layers.phytoplankton.filter((point) =>
        intersectsDepth(depthRange, point.depthRange) &&
        matchesTimeFilter(timeFilter, point.timestamp)
      ),
      sharkHotspots: layers.sharkHotspots.filter((point) =>
        intersectsDepth(depthRange, point.depthRange) &&
        matchesTimeFilter(timeFilter, point.timestamp)
      )
    };
  }, [layers, depthRange, temperatureRange, timeFilter]);

  return (
    <div className="relative h-[420px] rounded-3xl overflow-hidden border border-white/10 shadow-xl">
      <MapContainer
        center={defaultCenter}
        zoom={defaultZoom}
        scrollWheelZoom
        className="h-full w-full"
        zoomControl={false}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution="&copy; OpenStreetMap contributors & CARTO"
        />

        {visibleLayers.seaSurfaceTemperature ? (
          <LayerGroup>
            {filteredLayers.seaSurfaceTemperature.map((point) => (
              <CircleMarker
                key={point.id}
                center={[point.lat, point.lng]}
                radius={temperatureRadius(point.temperature)}
                pathOptions={{
                  color: layerColors.seaSurfaceTemperature,
                  fillColor: layerColors.seaSurfaceTemperature,
                  fillOpacity: 0.35,
                  weight: 1
                }}
              >
                <Tooltip direction="top" offset={[0, -4]} opacity={1}>
                  <div className="text-xs">
                    <p className="font-semibold">
                      SST {point.temperature.toFixed(1)} {DEGREE_LABEL}
                    </p>
                    <p>
                      Anomaly {point.anomaly > 0 ? "+" : ""}
                      {point.anomaly.toFixed(1)} {DEGREE_LABEL}
                    </p>
                    <p>Depth {point.depthRange[0]}-{point.depthRange[1]} m</p>
                    <p className="text-[10px] opacity-80">{point.source}</p>
                  </div>
                </Tooltip>
              </CircleMarker>
            ))}
          </LayerGroup>
        ) : null}

        {visibleLayers.phytoplankton ? (
          <LayerGroup>
            {filteredLayers.phytoplankton.map((point) => (
              <CircleMarker
                key={point.id}
                center={[point.lat, point.lng]}
                radius={phytoplanktonRadius(point.chlorophyll)}
                pathOptions={{
                  color: layerColors.phytoplankton,
                  fillColor: layerColors.phytoplankton,
                  fillOpacity: 0.45,
                  weight: 1
                }}
              >
                <Tooltip direction="top" offset={[0, -4]} opacity={1}>
                  <div className="text-xs">
                    <p className="font-semibold">
                      Chl-a {point.chlorophyll.toFixed(1)} mg/m^3
                    </p>
                    <p>
                      Bloom delta {point.bloomAnomaly > 0 ? "+" : ""}
                      {point.bloomAnomaly.toFixed(1)} mg/m^3
                    </p>
                    <p>Depth {point.depthRange[0]}-{point.depthRange[1]} m</p>
                    <p className="text-[10px] opacity-80">{point.source}</p>
                  </div>
                </Tooltip>
              </CircleMarker>
            ))}
          </LayerGroup>
        ) : null}

        {visibleLayers.sharkHotspots ? (
          <LayerGroup>
            {filteredLayers.sharkHotspots.map((point) => (
              <CircleMarker
                key={point.id}
                center={[point.lat, point.lng]}
                radius={hotspotRadius(point.confidence)}
                pathOptions={{
                  color: layerColors.sharkHotspots,
                  fillColor: layerColors.sharkHotspots,
                  fillOpacity: 0.25,
                  weight: 2,
                  dashArray: "4 6"
                }}
              >
                <Tooltip direction="top" offset={[0, -4]} opacity={1}>
                  <div className="text-xs">
                    <p className="font-semibold">
                      Hotspot confidence {(point.confidence * 100).toFixed(0)}%
                    </p>
                    <p>Diet signal {point.dietSignal}</p>
                    <p>Depth {point.depthRange[0]}-{point.depthRange[1]} m</p>
                    <p className="text-[10px] opacity-80">
                      Drivers: {point.supportingDrivers.join(", ")}
                    </p>
                  </div>
                </Tooltip>
              </CircleMarker>
            ))}
          </LayerGroup>
        ) : null}
      </MapContainer>
    </div>
  );
}
