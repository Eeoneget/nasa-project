"use client";

import { Fragment, useMemo, useState } from "react";

const defaultLabels = {
  sst: "SST",
  chlorophyll: "Chl-a",
  sea_level_anomaly: "SSH anomaly",
  shark_activity: "Shark activity"
};

const cellColor = (value) => {
  const positive = value >= 0;
  const intensity = Math.min(1, Math.abs(value));
  const hue = positive ? 210 : 12;
  const saturation = 70;
  const lightness = 100 - intensity * 45;
  return `hsl(${hue} ${saturation}% ${lightness}%)`;
};

export default function CorrelationMatrix({ matrix, labels = defaultLabels }) {
  const [showAbsolute, setShowAbsolute] = useState(false);

  const formatted = useMemo(() => {
    if (!matrix || !matrix.variables) {
      return { variables: [], cells: [] };
    }
    if (!showAbsolute) {
      return matrix;
    }
    return {
      variables: matrix.variables,
      cells: matrix.cells.map((cell) => ({
        ...cell,
        value: Math.abs(cell.value)
      }))
    };
  }, [matrix, showAbsolute]);

  if (!matrix || !matrix.variables || matrix.variables.length === 0) {
    return (
      <div className="rounded-3xl border border-white/10 bg-white/5 p-6 text-white">
        Correlation data is not available for the selected scenario.
      </div>
    );
  }

  return (
    <div className="space-y-4 rounded-3xl border border-white/10 bg-white/5 p-6 text-white shadow-lg">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">NASA correlation matrix</h3>
          <p className="text-xs text-white/60">Pearson correlation between satellite inputs and the shark activity index.</p>
        </div>
        <label className="flex items-center gap-2 text-xs">
          <input
            type="checkbox"
            checked={showAbsolute}
            onChange={(event) => setShowAbsolute(event.target.checked)}
            className="accent-teal-400"
          />
          <span>Show absolute values</span>
        </label>
      </div>
      <div className="overflow-x-auto">
        <div className="inline-grid" style={{ gridTemplateColumns: `120px repeat(${formatted.variables.length}, 100px)` }}>
          <div className="sticky left-0 top-0 flex items-center justify-center bg-black/40 px-2 py-2 text-xs font-semibold uppercase tracking-widest text-white/70">
            Metric
          </div>
          {formatted.variables.map((variable) => (
            <div
              key={`header-${variable}`}
              className="flex items-center justify-center bg-black/40 px-2 py-2 text-xs font-semibold uppercase tracking-widest text-white/70"
            >
              {labels[variable] ?? variable}
            </div>
          ))}
          {formatted.variables.map((rowKey) => (
            <Fragment key={`row-${rowKey}`}>
              <div className="sticky left-0 flex items-center justify-start bg-black/40 px-3 py-2 text-sm font-medium text-white/80">
                {labels[rowKey] ?? rowKey}
              </div>
              {formatted.variables.map((columnKey) => {
                const cell = formatted.cells.find(
                  (item) => item.x === columnKey && item.y === rowKey
                );
                const value = cell ? cell.value : 0;
                return (
                  <button
                    key={`${rowKey}-${columnKey}`}
                    type="button"
                    className="relative flex h-16 items-center justify-center border border-white/10 text-sm font-semibold transition-transform hover:scale-[1.03]"
                    style={{ background: cellColor(value) }}
                    title={`${labels[rowKey] ?? rowKey} vs ${labels[columnKey] ?? columnKey}: ${value.toFixed(2)}`}
                  >
                    {value.toFixed(2)}
                  </button>
                );
              })}
            </Fragment>
          ))}
        </div>
      </div>
    </div>
  );
}
