"use client";

import { useMemo, useState } from "react";
import {
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  ZAxis,
  Tooltip,
  CartesianGrid,
  Cell
} from "recharts";

const views = [
  {
    id: "temperature",
    label: "Temperature",
    description: "How shark activity responds to sea-surface temperature.",
    xKey: "temperature",
    xLabel: "Temperature (degC)",
    colorKey: "chlorophyll",
    colorLabel: "Chl-a (mg/m^3)"
  },
  {
    id: "chlorophyll",
    label: "Productivity",
    description: "Relationship between shark activity and chlorophyll-a concentration.",
    xKey: "chlorophyll",
    xLabel: "Chl-a (mg/m^3)",
    colorKey: "temperature",
    colorLabel: "Temperature (degC)"
  },
  {
    id: "seaLevel",
    label: "Ocean fronts",
    description: "Influence of sea-level anomaly on shark activity.",
    xKey: "seaLevelAnomaly",
    xLabel: "SSH anomaly (m)",
    colorKey: "chlorophyll",
    colorLabel: "Chl-a (mg/m^3)"
  }
];

const buildColorScale = (min, max) => {
  const range = max - min || 1;
  return (value) => {
    const normalized = Math.max(0, Math.min(1, (value - min) / range));
    const hue = 260 - normalized * 140;
    const saturation = 80;
    const lightness = 60 - normalized * 20;
    return `hsl(${hue} ${saturation}% ${lightness}%)`;
  };
};

const ScatterTooltip = ({ active, payload, label }) => {
  if (!active || !payload || payload.length === 0) {
    return null;
  }
  const point = payload[0].payload;
  return (
    <div className="rounded-2xl border border-white/20 bg-slate-900/90 px-3 py-2 text-xs text-white shadow-lg">
      <p className="font-semibold">Point #{label}</p>
      <p>Temperature: {point.temperature}</p>
      <p>Chl-a: {point.chlorophyll}</p>
      <p>SSH anomaly: {point.seaLevelAnomaly}</p>
      <p>Shark activity: {point.sharkActivity}</p>
      {point.tagged ? <p className="text-amber-300">Telemetry hot-spot</p> : null}
    </div>
  );
};

export default function ScatterInsights({ data }) {
  const [activeView, setActiveView] = useState(views[0].id);
  const [pointCount, setPointCount] = useState(160);
  const [showTaggedOnly, setShowTaggedOnly] = useState(false);

  const currentView = views.find((view) => view.id === activeView) ?? views[0];

  const displayData = useMemo(() => {
    if (!data) {
      return [];
    }
    const collection = showTaggedOnly ? data.filter((point) => point.tagged) : data;
    return collection.slice(0, pointCount);
  }, [data, pointCount, showTaggedOnly]);

  const axisStats = useMemo(() => {
    if (displayData.length === 0) {
      return {
        x: { min: 0, max: 1 },
        color: { min: 0, max: 1 },
        y: { min: -2, max: 2 }
      };
    }
    const xValues = displayData.map((point) => point[currentView.xKey]);
    const colorValues = displayData.map((point) => point[currentView.colorKey]);
    const yValues = displayData.map((point) => point.sharkActivity);
    return {
      x: { min: Math.min(...xValues), max: Math.max(...xValues) },
      color: { min: Math.min(...colorValues), max: Math.max(...colorValues) },
      y: { min: Math.min(...yValues), max: Math.max(...yValues) }
    };
  }, [displayData, currentView]);

  const colorScale = useMemo(
    () => buildColorScale(axisStats.color.min, axisStats.color.max),
    [axisStats]
  );

  if (!data || data.length === 0) {
    return (
      <div className="rounded-3xl border border-white/10 bg-white/5 p-6 text-white">
        Scatter data is not available for the selected scenario.
      </div>
    );
  }

  return (
    <div className="space-y-4 rounded-3xl border border-white/10 bg-white/5 p-6 text-white shadow-lg">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h3 className="text-lg font-semibold">Parameter vs activity scatter</h3>
          <p className="text-xs text-white/60">Yellow markers highlight custom ECHO tag detections.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {views.map((view) => (
            <button
              key={view.id}
              type="button"
              onClick={() => setActiveView(view.id)}
              className={`rounded-2xl px-3 py-1 font-medium transition-colors ${
                activeView === view.id ? "bg-teal-400 text-black" : "bg-white/5 hover:bg-white/10"
              }`}
            >
              {view.label}
            </button>
          ))}
        </div>
      </div>
      <p className="text-xs text-white/60">{currentView.description}</p>
      <div className="flex flex-wrap items-center gap-4 text-xs">
        <label className="flex items-center gap-2">
          <span>Point count: {pointCount}</span>
          <input
            type="range"
            min={40}
            max={data.length}
            value={pointCount}
            onChange={(event) => setPointCount(Number(event.target.value))}
          />
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={showTaggedOnly}
            onChange={(event) => setShowTaggedOnly(event.target.checked)}
            className="accent-teal-400"
          />
          <span>Show telemetry only</span>
        </label>
      </div>
      <ResponsiveContainer width="100%" height={320}>
        <ScatterChart margin={{ top: 10, right: 20, bottom: 10, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
          <XAxis
            type="number"
            dataKey={currentView.xKey}
            name={currentView.xLabel}
            stroke="#a1a1aa"
            tickLine={false}
            domain={[axisStats.x.min, axisStats.x.max]}
          />
          <YAxis
            type="number"
            dataKey="sharkActivity"
            name="Shark activity"
            stroke="#a1a1aa"
            tickLine={false}
            domain={[axisStats.y.min - 0.2, axisStats.y.max + 0.2]}
          />
          <ZAxis dataKey={currentView.colorKey} range={[0, 50]} name={currentView.colorLabel} />
          <Tooltip cursor={{ strokeDasharray: "3 3" }} content={<ScatterTooltip />} />
          <Scatter data={displayData}>
            {displayData.map((point) => (
              <Cell
                key={point.id}
                fill={point.tagged ? "#facc15" : colorScale(point[currentView.colorKey])}
                stroke={point.tagged ? "#f59e0b" : "transparent"}
                strokeWidth={point.tagged ? 1.5 : 0}
                r={point.tagged ? 60 : 40}
              />
            ))}
          </Scatter>
        </ScatterChart>
      </ResponsiveContainer>
      <div className="flex flex-wrap gap-2 text-xs text-white/60">
        <span className="rounded-full border border-white/20 bg-white/5 px-3 py-1">Color = {currentView.colorLabel}</span>
        <span className="rounded-full border border-white/20 bg-white/5 px-3 py-1">Y-axis = shark activity</span>
      </div>
    </div>
  );
}
