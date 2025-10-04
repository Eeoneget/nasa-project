"use client";

import { useMemo, useState } from "react";
import {
  LineChart,
  Line,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend
} from "recharts";

const formatDateLabel = (value) => {
  const date = new Date(value);
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    year: "2-digit"
  }).format(date);
};

const SeasonalTooltip = ({ active, payload, label }) => {
  if (!active || !payload || payload.length === 0) {
    return null;
  }

  return (
    <div className="rounded-2xl border border-white/20 bg-slate-900/90 px-3 py-2 text-xs text-white shadow-lg">
      <p className="font-semibold">{formatDateLabel(label)}</p>
      {payload.map((entry) => (
        <p key={entry.dataKey} className="mt-1">
          {entry.name}: {entry.value}
        </p>
      ))}
    </div>
  );
};

export default function SeasonalDynamicsChart({ data }) {
  const [monthsVisible, setMonthsVisible] = useState(12);
  const [showAnomalies, setShowAnomalies] = useState(false);

  const filteredData = useMemo(() => {
    if (!data || data.length === 0) {
      return [];
    }
    return data.slice(-monthsVisible).map((point, index, slice) => {
      if (!showAnomalies) {
        return point;
      }
      const first = slice[0];
      return {
        ...point,
        sharkActivity: Number((point.sharkActivity - first.sharkActivity).toFixed(3)),
        sst: Number((point.sst - first.sst).toFixed(2))
      };
    });
  }, [data, monthsVisible, showAnomalies]);

  if (!data || data.length === 0) {
    return (
      <div className="rounded-3xl border border-white/10 bg-white/5 p-6 text-white">
        Seasonal dynamics data is not available for the selected scenario.
      </div>
    );
  }

  return (
    <div className="space-y-4 rounded-3xl border border-white/10 bg-white/5 p-6 text-white shadow-lg">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h3 className="text-lg font-semibold">Seasonal Dynamics</h3>
          <p className="text-xs text-white/60">
            Comparing the shark activity index with NASA sea-surface temperature over the past months.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-xs">
          <label className="flex items-center gap-2">
            <span>Months shown</span>
            <input
              type="range"
              min={4}
              max={data.length}
              value={monthsVisible}
              onChange={(event) => setMonthsVisible(Number(event.target.value))}
            />
            <span className="w-8 text-right">{monthsVisible}</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={showAnomalies}
              onChange={(event) => setShowAnomalies(event.target.checked)}
              className="accent-teal-400"
            />
            <span>Show anomalies (vs first month)</span>
          </label>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={260}>
        <LineChart data={filteredData} margin={{ left: 0, right: 0, top: 10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
          <XAxis
            dataKey="date"
            stroke="#a1a1aa"
            tickLine={false}
            tickFormatter={formatDateLabel}
          />
          <YAxis
            yAxisId="activity"
            stroke="#f87171"
            tickLine={false}
            width={60}
            label={{ value: "Activity index", angle: -90, position: "insideLeft", fill: "#f87171" }}
          />
          <YAxis
            yAxisId="sst"
            orientation="right"
            stroke="#38bdf8"
            tickLine={false}
            width={90}
            label={{ value: "Sea-surface temp (degC)", angle: 90, position: "insideRight", fill: "#38bdf8" }}
          />
          <Tooltip content={<SeasonalTooltip />} />
          <Legend />
          <Line
            yAxisId="activity"
            type="monotone"
            dataKey="sharkActivity"
            name="Shark activity"
            stroke="#f87171"
            strokeWidth={3}
            dot={false}
            activeDot={{ r: 6 }}
          />
          <Line
            yAxisId="sst"
            type="monotone"
            dataKey="sst"
            name="SST"
            stroke="#38bdf8"
            strokeWidth={3}
            dot={false}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
