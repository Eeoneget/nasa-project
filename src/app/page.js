"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import LayerControls from "../components/LayerControls";
import AnalyticsDashboard from "../components/AnalyticsDashboard";
import ConceptualModelCard from "../components/ConceptualModelCard";
import ScenarioInsights from "../components/ScenarioInsights";
import {
  oceanLayers,
  analyticsSeries,
  summaryStats,
  conceptualModel,
  simulationTimeline
} from "../data/mockData";

const OceanMap = dynamic(() => import("../components/OceanMap"), { ssr: false });

const SIMULATION_INTERVAL_MS = 5000;
const INITIAL_FILTERS = simulationTimeline[0]?.filters ?? {
  depthRange: [0, 220],
  temperatureRange: [18, 26],
  timeFilter: "day"
};

export default function Home() {
  const [layerVisibility, setLayerVisibility] = useState({
    seaSurfaceTemperature: true,
    phytoplankton: true,
    sharkHotspots: false
  });

  const [filters, setFilters] = useState({
    depthRange: [...INITIAL_FILTERS.depthRange],
    temperatureRange: [...INITIAL_FILTERS.temperatureRange],
    timeFilter: INITIAL_FILTERS.timeFilter
  });

  const [layerData, setLayerData] = useState(oceanLayers);
  const [analyticsData, setAnalyticsData] = useState(analyticsSeries);
  const [statsData, setStatsData] = useState(summaryStats);

  const [simulation, setSimulation] = useState({ index: 0, playing: false });

  const currentScenario = simulationTimeline[simulation.index];

  const filterSummary = useMemo(() => {
    const depthLabel = `${filters.depthRange[0]}-${filters.depthRange[1]} m`;
    const tempLabel = `${filters.temperatureRange[0]}-${filters.temperatureRange[1]} degC`;
    const timeLabel = filters.timeFilter === "season" ? "Seasonal" : filters.timeFilter;
    return { depthLabel, tempLabel, timeLabel };
  }, [filters]);

  const toggleLayer = (key) => {
    setLayerVisibility((prev) => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const applySimulationStep = useCallback((index) => {
    const step = simulationTimeline[index];
    if (!step) return;

    setLayerData(step.layers);
    setAnalyticsData(step.analytics);
    setStatsData(step.stats);

    setFilters((prev) => ({
      depthRange: step.filters?.depthRange
        ? [...step.filters.depthRange]
        : [...prev.depthRange],
      temperatureRange: step.filters?.temperatureRange
        ? [...step.filters.temperatureRange]
        : [...prev.temperatureRange],
      timeFilter: step.filters?.timeFilter ?? prev.timeFilter
    }));
  }, []);

  const handleSelectStep = useCallback(
    (targetIndex) => {
      applySimulationStep(targetIndex);
      setSimulation({ index: targetIndex, playing: false });
    },
    [applySimulationStep]
  );

  const handleNextStep = useCallback(() => {
    setSimulation((prev) => {
      const nextIndex = (prev.index + 1) % simulationTimeline.length;
      applySimulationStep(nextIndex);
      return { index: nextIndex, playing: false };
    });
  }, [applySimulationStep]);

  const handlePreviousStep = useCallback(() => {
    setSimulation((prev) => {
      const nextIndex = (prev.index - 1 + simulationTimeline.length) % simulationTimeline.length;
      applySimulationStep(nextIndex);
      return { index: nextIndex, playing: false };
    });
  }, [applySimulationStep]);

  const togglePlay = useCallback(() => {
    setSimulation((prev) => ({ ...prev, playing: !prev.playing }));
  }, []);

  const resetSimulation = useCallback(() => {
    applySimulationStep(0);
    setSimulation({ index: 0, playing: false });
  }, [applySimulationStep]);

  useEffect(() => {
    applySimulationStep(0);
  }, [applySimulationStep]);

  useEffect(() => {
    if (!simulation.playing) return;
    const timer = setInterval(() => {
      setSimulation((prev) => {
        const nextIndex = (prev.index + 1) % simulationTimeline.length;
        applySimulationStep(nextIndex);
        return { index: nextIndex, playing: true };
      });
    }, SIMULATION_INTERVAL_MS);

    return () => clearInterval(timer);
  }, [simulation.playing, applySimulationStep]);

  const enabledLayers = useMemo(() => {
    return {
      seaSurfaceTemperature: layerVisibility.seaSurfaceTemperature
        ? layerData.seaSurfaceTemperature
        : [],
      phytoplankton: layerVisibility.phytoplankton ? layerData.phytoplankton : [],
      sharkHotspots: layerVisibility.sharkHotspots ? layerData.sharkHotspots : []
    };
  }, [layerVisibility, layerData]);

  return (
    <div className="min-h-screen bg-[#050816] text-white">
      <main className="mx-auto max-w-7xl px-6 py-10 space-y-10">
        <header className="space-y-3">
          <p className="text-xs uppercase tracking-[0.4em] text-teal-300">Ocean Insights / NASA</p>
          <h1 className="text-4xl md:text-5xl font-semibold">Predictive Shark Ecology Intelligence</h1>
          <p className="max-w-3xl text-white/70 leading-relaxed">
            Fuse NASA satellite products with biologging telemetry to discover shark feeding hotspots,
            quantify the drivers behind predator movement, and stream real-time diet intelligence from next-generation tags.
          </p>
          <div className="flex flex-wrap gap-3 text-xs text-white/50">
            <span className="rounded-full bg-white/5 px-3 py-1 border border-white/10">MODIS | VIIRS | PACE | SWOT</span>
            <span className="rounded-full bg-white/5 px-3 py-1 border border-white/10">ECHO Tag Concept</span>
            <span className="rounded-full bg-white/5 px-3 py-1 border border-white/10">Predictive Habitat Modeling</span>
          </div>
        </header>

        <section className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-xl space-y-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-[0.3em] text-teal-200">Scenario Simulation</p>
              <h2 className="text-2xl font-semibold">
                {currentScenario?.label ?? "Scenario"}
              </h2>
              <p className="text-sm text-white/70 leading-relaxed">
                {currentScenario?.description ?? "Explore shark habitat dynamics driven by NASA ocean products."}
              </p>
              <div className="flex flex-wrap gap-2 text-xs text-white/50">
                <span className="rounded-full border border-white/10 bg-black/30 px-3 py-1">
                  Depth window {filterSummary.depthLabel}
                </span>
                <span className="rounded-full border border-white/10 bg-black/30 px-3 py-1">
                  SST {filterSummary.tempLabel}
                </span>
                <span className="rounded-full border border-white/10 bg-black/30 px-3 py-1 capitalize">
                  Time {filterSummary.timeLabel}
                </span>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={togglePlay}
                className={`rounded-2xl px-4 py-2 text-sm font-medium transition-colors ${
                  simulation.playing ? "bg-rose-400 text-black" : "bg-teal-400 text-black"
                }`}
              >
                {simulation.playing ? "Pause" : "Play"}
              </button>
              <button
                type="button"
                onClick={handlePreviousStep}
                className="rounded-2xl border border-white/20 bg-white/10 px-4 py-2 text-sm hover:bg-white/20"
              >
                Prev
              </button>
              <button
                type="button"
                onClick={handleNextStep}
                className="rounded-2xl border border-white/20 bg-white/10 px-4 py-2 text-sm hover:bg-white/20"
              >
                Next
              </button>
              <button
                type="button"
                onClick={resetSimulation}
                className="rounded-2xl border border-white/20 bg-white/10 px-4 py-2 text-sm hover:bg-white/20"
              >
                Reset
              </button>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {simulationTimeline.map((step, index) => {
              const isActive = simulation.index === index;
              return (
                <button
                  type="button"
                  key={step.id}
                  onClick={() => handleSelectStep(index)}
                  className={`rounded-2xl border px-3 py-1 text-xs transition-colors ${
                    isActive
                      ? "border-teal-300 bg-teal-500/20 text-teal-100"
                      : "border-white/15 bg-white/5 hover:bg-white/10"
                  }`}
                >
                  {index + 1}. {step.label}
                </button>
              );
            })}
          </div>
          <div className="flex items-center justify-between text-xs text-white/50">
            <span>
              Scenario step {simulation.index + 1} of {simulationTimeline.length}
            </span>
            {simulation.playing ? <span>Auto-play running (step every {SIMULATION_INTERVAL_MS / 1000}s)</span> : null}
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[2fr_1fr]">
          <div className="space-y-4 relative">
            <OceanMap
              layers={enabledLayers}
              visibleLayers={layerVisibility}
              filters={filters}
            />
            <div className="flex flex-wrap gap-4 text-sm text-white/60">
              <span className="rounded-2xl bg-white/5 px-4 py-2 border border-white/10">
                Depth {filterSummary.depthLabel}
              </span>
              <span className="rounded-2xl bg-white/5 px-4 py-2 border border-white/10">
                Temperature {filterSummary.tempLabel}
              </span>
              <span className="rounded-2xl bg-white/5 px-4 py-2 border border-white/10 capitalize">
                Time Window {filterSummary.timeLabel}
              </span>
            </div>
          </div>
          <LayerControls
            visibility={layerVisibility}
            onToggleLayer={toggleLayer}
            filters={filters}
            onUpdateFilters={setFilters}
          />
        </section>

        <section className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div>
              <h2 className="text-2xl font-semibold">Analytics Dashboard</h2>
              <p className="text-sm text-white/60">
                Compare shark behavior anomalies against thermal structure, phytoplankton biomass, and diet signatures.
              </p>
            </div>
            <div className="text-xs text-white/50">
              Last assimilation cycle: 2025-09-24 12:00 UTC
            </div>
          </div>
          <AnalyticsDashboard series={analyticsData} stats={statsData} />
        </section>

        <ScenarioInsights currentInsightKey={currentScenario?.insightKey} />

        <section className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-xl space-y-4">
            <h2 className="text-2xl font-semibold">Modeling Blueprint</h2>
            <p className="text-sm text-white/70 leading-relaxed">
              We ingest NASA sea-surface temperature and ocean color products (MODIS/VIIRS/PACE) alongside SWOT sea-surface height
              and ECOSTRESS thermal inertia to derive the Dynamic Bio-Resource Gradient (DBRG). A Bayesian habitat model links DBRG,
              bathymetry-derived depth strata, and diel cycles with shark presence probabilities. Recurrent inference on ECHO tag telemetry
              updates hotspot likelihoods every orbit, enabling forecast maps and adaptive sampling missions.
            </p>
            <div className="grid md:grid-cols-2 gap-4 text-sm text-white/70">
              <div className="rounded-2xl bg-black/40 border border-white/10 p-4">
                <p className="text-xs uppercase tracking-[0.3em] text-teal-200">Inputs</p>
                <ul className="mt-2 space-y-1 list-disc list-inside">
                  <li>NASA SST & chlorophyll composites</li>
                  <li>SWOT mesoscale eddy detection</li>
                  <li>NOAA bathymetry & slope</li>
                  <li>Tag-derived diet energy index</li>
                </ul>
              </div>
              <div className="rounded-2xl bg-black/40 border border-white/10 p-4">
                <p className="text-xs uppercase tracking-[0.3em] text-teal-200">Outputs</p>
                <ul className="mt-2 space-y-1 list-disc list-inside">
                  <li>Hotspot probability grids (3 hr)</li>
                  <li>Predator-prey coupling scores</li>
                  <li>Diet composition nowcasts</li>
                  <li>Mission recommendations</li>
                </ul>
              </div>
            </div>
          </div>
          <ConceptualModelCard model={conceptualModel} />
        </section>
      </main>
    </div>
  );
}


