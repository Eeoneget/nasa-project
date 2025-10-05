"use client";

import dynamic from "next/dynamic";
import sharkModelData from "../data/sharkModelDashboard.json";

const Plot = dynamic(() => import("react-plotly.js"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center text-xs text-white/60">
      Loading shark activity chart...
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
    "toImage"
  ]
};

function TimeSeriesPlot({ timeSeries, selectedRegions }) {
  const traces = selectedRegions
    .filter((region) => timeSeries[region])
    .map((region) => ({
      x: timeSeries[region].date,
      y: timeSeries[region].activity,
      type: "scatter",
      mode: "lines",
      name: region,
      line: { width: 2.5 }
    }));

  const layout = {
    height: 360,
    margin: { l: 45, r: 18, t: 40, b: 45 },
    paper_bgcolor: "rgba(5,8,22,0.95)",
    plot_bgcolor: "rgba(5,8,22,0.95)",
    font: { color: "#f8fafc" },
    hoverlabel: {
      bgcolor: "#0f172a",
      bordercolor: "#14b8a6",
      font: { size: 11 }
    },
    xaxis: { title: "Date", tickangle: -30, tickfont: { size: 10 } },
    yaxis: { title: "Shark activity index", tickfont: { size: 10 } },
    legend: { orientation: "h", y: -0.2 }
  };

  return (
    <Plot
      data={traces}
      layout={layout}
      config={{ ...baseConfig, toImageButtonOptions: { format: "png", filename: "shark-activity-timeseries", scale: 2 } }}
      style={{ width: "100%", height: 360 }}
      useResizeHandler
    />
  );
}

function ScatterPlot({ scatter }) {
  const layout = {
    height: 360,
    margin: { l: 50, r: 18, t: 40, b: 50 },
    paper_bgcolor: "rgba(5,8,22,0.95)",
    plot_bgcolor: "rgba(5,8,22,0.95)",
    font: { color: "#f8fafc" },
    hovermode: "closest",
    xaxis: { title: "SST (°C)", tickfont: { size: 10 } },
    yaxis: { title: "Shark activity index", tickfont: { size: 10 } },
    coloraxis: { colorscale: "Viridis", colorbar: { title: "Chl-a" } }
  };

  const trace = {
    x: scatter.sst,
    y: scatter.activity,
    text: scatter.region,
    type: "scatter",
    mode: "markers",
    marker: {
      size: 7,
      color: scatter.chlorophyll,
      coloraxis: "coloraxis",
      opacity: 0.75,
      line: { width: 0.5, color: "#0f172a" }
    }
  };

  return (
    <Plot
      data={[trace]}
      layout={layout}
      config={{ ...baseConfig, toImageButtonOptions: { format: "png", filename: "sst-activity-scatter", scale: 2 } }}
      style={{ width: "100%", height: 360 }}
      useResizeHandler
    />
  );
}

export default function SharkModelSection() {
  const { formulas, regions, timeSeries, scatter, hotspots, generatedAt } = sharkModelData;

  const topRegions = regions
    .slice()
    .sort((a, b) => b.activityMean - a.activityMean)
    .slice(0, 3)
    .map((item) => item.region);

  return (
    <section className="rounded-3xl border border-white/10 bg-white/5 p-8 text-white shadow-xl space-y-8">
      <header className="space-y-2">
        <p className="text-xs uppercase tracking-[0.4em] text-teal-300">Hackathon Shark Activity Model</p>
        <h2 className="text-2xl md:text-3xl font-semibold">Global Shark Foraging Storyboard</h2>
        <p className="text-sm text-white/70 leading-relaxed max-w-3xl">
          Outputs from the SharkActivityModel simulate how thermal structure, chlorophyll, and sea-level anomalies translate into
          foraging likelihoods. Data are stochastic but reproducible for demo purposes and can be regenerated via
          <code className="rounded bg-white/10 px-1">python scripts/build_shark_model_dashboard.py</code>.
        </p>
        <p className="text-xs text-white/40">Generated at {generatedAt}</p>
      </header>

      <div className="grid gap-4 md:grid-cols-2">
        {formulas.map((card) => (
          <article key={card.title} className="rounded-2xl border border-white/10 bg-black/40 p-4 space-y-2">
            <h3 className="text-sm font-semibold text-teal-200">{card.title}</h3>
            <p className="font-mono text-xs text-lime-200">{card.expression}</p>
            <p className="text-xs text-white/65">{card.description}</p>
            <ul className="text-xs text-white/50 list-disc list-inside space-y-1">
              {card.details.map((item, idx) => (
                <li key={idx}>{item}</li>
              ))}
            </ul>
          </article>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="rounded-2xl border border-white/10 bg-black/40 p-4">
          <h3 className="text-sm font-semibold text-teal-200 mb-2">Activity time series (bi-weekly demo feed)</h3>
          <TimeSeriesPlot timeSeries={timeSeries} selectedRegions={topRegions} />
        </div>
        <div className="rounded-2xl border border-white/10 bg-black/40 p-4 space-y-3">
          <h3 className="text-sm font-semibold text-teal-200">Region quick stats</h3>
          <ul className="text-xs text-white/65 space-y-2 max-h-[320px] overflow-y-auto pr-1">
            {regions.map((region) => (
              <li key={region.region} className="rounded-xl border border-white/10 bg-black/50 p-3">
                <div className="flex items-center justify-between text-white/80 text-sm">
                  <span>{region.region}</span>
                  {region.isCustom ? <span className="text-teal-300 text-[11px] uppercase">custom</span> : null}
                </div>
                <p>SST mean: {region.sstMean.toFixed(1)} °C · Chl mean: {region.chlorMean.toFixed(2)} mg/m³</p>
                <p>Activity mean: {region.activityMean.toFixed(2)} · max: {region.activityMax.toFixed(2)}</p>
                <p>Samples: {region.sampleCount}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="rounded-2xl border border-white/10 bg-black/40 p-4">
          <h3 className="text-sm font-semibold text-teal-200 mb-2">SST vs shark activity (talking points)</h3>
          <ScatterPlot scatter={scatter} />
        </div>
        <div className="rounded-2xl border border-white/10 bg-black/40 p-4 space-y-2">
          <h3 className="text-sm font-semibold text-teal-200">Top activity hotspots to pitch</h3>
          <p className="text-xs text-white/65">
            Highest 80th percentile cells based on simulated Shark Activity Index (SAI).
          </p>
          <ul className="text-xs text-white/70 space-y-2">
            {hotspots.map((spot, idx) => (
              <li key={`${spot.region}-${spot.date}-${idx}`} className="rounded-xl border border-white/10 bg-black/50 p-3">
                <div className="flex items-center justify-between text-white/80">
                  <span className="text-teal-200">{idx + 1}.</span>
                  <span>{spot.region}</span>
                  <span>{spot.date}</span>
                </div>
                <p>SAI {spot.activity.toFixed(2)} · SST {spot.sst.toFixed(1)} °C · Chl {spot.chlorophyll.toFixed(2)} mg/m³</p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
