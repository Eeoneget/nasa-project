"use client";

import dynamic from "next/dynamic";
import { useMemo } from "react";

const Plot = dynamic(() => import("react-plotly.js"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center text-xs text-white/60">
      Loading interactive plot...
    </div>
  )
});

const baseConfig = {
  responsive: true,
  displaylogo: false,
  modeBarButtonsToRemove: [
    "autoScale2d",
    "lasso2d",
    "select2d",
    "hoverClosestCartesian",
    "hoverCompareCartesian"
  ]
};

const commonLayout = (height) => ({
  height,
  margin: { l: 45, r: 18, t: 40, b: 45 },
  paper_bgcolor: "rgba(5,8,22,0.95)",
  plot_bgcolor: "rgba(5,8,22,0.95)",
  font: { color: "#f8fafc" },
  hoverlabel: {
    bgcolor: "#0f172a",
    bordercolor: "#14b8a6",
    font: { size: 11 }
  }
});

export function HeatmapCard({
  title,
  description,
  grid,
  colorscale = "Viridis",
  colorbarTitle,
  zmid,
  height = 320
}) {
  const { z, xAxis, yAxis } = useMemo(() => {
    const data = grid?.data ?? [];
    if (!data.length) {
      return { z: [[0]], xAxis: [0], yAxis: [0] };
    }
    const rows = data.length;
    const cols = data[0]?.length ?? 0;
    const y = Array.from({ length: rows }, (_, idx) => rows - idx);
    const x = Array.from({ length: cols }, (_, idx) => idx + 1);
    return { z: data, xAxis: x, yAxis: y };
  }, [grid]);

  const layout = useMemo(() => {
    const base = commonLayout(height);
    return {
      ...base,
      title: { text: title, font: { size: 16, color: "#5eead4" } },
      xaxis: {
        title: grid?.xLabel ?? "X",
        showgrid: false,
        zeroline: false,
        tickfont: { size: 10 }
      },
      yaxis: {
        title: grid?.yLabel ?? "Y",
        autorange: "reversed",
        showgrid: false,
        zeroline: false,
        tickfont: { size: 10 }
      }
    };
  }, [grid, height, title]);

  const trace = useMemo(() => {
    const payload = {
      z,
      x: xAxis,
      y: yAxis,
      type: "heatmap",
      colorscale,
      colorbar: {
        title: colorbarTitle,
        tickfont: { size: 10 },
        titlefont: { size: 11 }
      }
    };
    if (typeof zmid === "number") {
      payload.zmid = zmid;
    }
    return payload;
  }, [z, xAxis, yAxis, colorscale, colorbarTitle, zmid]);

  return (
    <article className="space-y-3">
      {description ? <p className="text-xs text-white/65 leading-relaxed">{description}</p> : null}
      <div className="rounded-2xl border border-white/10 bg-black/40 p-3">
        <Plot
          data={[trace]}
          layout={layout}
          config={{
            ...baseConfig,
            toImageButtonOptions: {
              format: "png",
              filename: (title ?? "pace-heatmap").replace(/\s+/g, "_"),
              scale: 2
            }
          }}
          style={{ width: "100%", height }}
          useResizeHandler
        />
      </div>
    </article>
  );
}

export function LineChartCard({ title, description, wavelengths, rrs05, rrs09, height = 320 }) {
  const layout = useMemo(() => {
    const base = commonLayout(height);
    return {
      ...base,
      title: { text: title, font: { size: 16, color: "#5eead4" } },
      xaxis: {
        title: "Wavelength (nm)",
        tickmode: "linear",
        dtick: 20,
        zeroline: false,
        gridcolor: "rgba(148,163,184,0.25)",
        tickfont: { size: 10 }
      },
      yaxis: {
        title: "Rrs",
        gridcolor: "rgba(148,163,184,0.25)",
        tickfont: { size: 10 }
      },
      legend: {
        orientation: "h",
        y: -0.18,
        font: { size: 11 }
      }
    };
  }, [height, title]);

  const traces = useMemo(() => {
    return [
      {
        x: wavelengths,
        y: rrs05,
        type: "scatter",
        mode: "lines+markers",
        name: "05 Sep",
        line: { color: "#38bdf8", width: 3 },
        marker: { color: "#38bdf8", size: 6 }
      },
      {
        x: wavelengths,
        y: rrs09,
        type: "scatter",
        mode: "lines+markers",
        name: "09 Sep",
        line: { color: "#f97316", width: 3 },
        marker: { color: "#f97316", size: 6 }
      }
    ];
  }, [wavelengths, rrs05, rrs09]);

  return (
    <article className="space-y-3">
      {description ? <p className="text-xs text-white/65 leading-relaxed">{description}</p> : null}
      <div className="rounded-2xl border border-white/10 bg-black/40 p-3">
        <Plot
          data={traces}
          layout={layout}
          config={{
            ...baseConfig,
            toImageButtonOptions: {
              format: "png",
              filename: (title ?? "pace-line").replace(/\s+/g, "_"),
              scale: 2
            }
          }}
          style={{ width: "100%", height }}
          useResizeHandler
        />
      </div>
    </article>
  );
}
