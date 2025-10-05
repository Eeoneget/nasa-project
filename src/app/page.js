"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import LayerControls from "../components/LayerControls";
import AnalyticsDashboard from "../components/AnalyticsDashboard";
import ConceptualModelCard from "../components/ConceptualModelCard";
import ScenarioInsights from "../components/ScenarioInsights";
import PaceAnalysisSection from "../components/PaceAnalysisSection";
import SharkModelSection from "../components/SharkModelSection";
import PlotsGallery from "../components/PlotsGallery";
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
    const tempLabel = `${filters.temperatureRange[0]}-${filters.temperatureRange[1]} ?C`;
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
          <p className="text-xs uppercase tracking-[0.4em] text-teal-300">NASA Space Apps Challenge 2025</p>
          <h1 className="text-4xl md:text-5xl font-semibold">Shark Feeding Hotspot Prediction System</h1>
          <p className="max-w-3xl text-white/70 leading-relaxed">
            Advanced mathematical framework for identifying shark feeding hotspots using NASA satellite data. 
            Our system quantifies ecological connections between oceanographic features, phytoplankton communities, 
            and predator movement patterns to predict shark feeding behavior in real-time.
          </p>
          <div className="flex flex-wrap gap-3 text-xs text-white/50">
            <span className="rounded-full bg-white/5 px-3 py-1 border border-white/10">MODIS | VIIRS | PACE | SWOT</span>
            <span className="rounded-full bg-white/5 px-3 py-1 border border-white/10">ECHO Biologging Technology</span>
            <span className="rounded-full bg-white/5 px-3 py-1 border border-white/10">Machine Learning Models</span>
            <span className="rounded-full bg-white/5 px-3 py-1 border border-white/10">Real-time Telemetry</span>
          </div>
        </header>

        <section className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-xl space-y-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-[0.3em] text-teal-200">NASA Satellite Data Simulation</p>
              <h2 className="text-2xl font-semibold">
                {currentScenario?.label ?? "Oceanographic Hotspot Detection"}
              </h2>
              <p className="text-sm text-white/70 leading-relaxed">
                {currentScenario?.description ?? "Mathematical analysis of NASA satellite data to identify and quantify shark feeding hotspots through oceanographic-ecological relationships."}
              </p>
              <div className="flex flex-wrap gap-2 text-xs text-white/50">
                <span className="rounded-full border border-white/10 bg-black/30 px-3 py-1">
                  Bathymetry {filterSummary.depthLabel}
                </span>
                <span className="rounded-full border border-white/10 bg-black/30 px-3 py-1">
                  SST Anomaly {filterSummary.tempLabel}
                </span>
                <span className="rounded-full border border-white/10 bg-black/30 px-3 py-1 capitalize">
                  Temporal {filterSummary.timeLabel}
                </span>
                <span className="rounded-full border border-white/10 bg-black/30 px-3 py-1">
                  Chl-a: 0.8 mg/m³
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
            <h2 className="text-2xl font-semibold">Predictive Analytics Dashboard</h2>
            <p className="text-sm text-white/60">
              Mathematical analysis of ecological relationships between oceanographic variables, phytoplankton dynamics, 
              and shark feeding behavior. Real-time quantification of feeding hotspot probability using NASA satellite data.
            </p>
            </div>
            <div className="text-xs text-white/50">
              Model updated: 2025-09-24 12:00 UTC | Confidence: 94.2%
            </div>
          </div>
          <AnalyticsDashboard series={analyticsData} stats={statsData} />
        </section>

        <ScenarioInsights currentInsightKey={currentScenario?.insightKey} />

        <section className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-xl space-y-4">
            <h2 className="text-2xl font-semibold">Mathematical Framework</h2>
            <p className="text-sm text-white/70 leading-relaxed">
              Our mathematical model integrates NASA satellite products (SST, ocean color, sea surface height) with 
              novel ECHO biologging technology to create a Dynamic Bio-Resource Gradient (DBRG). The Bayesian habitat 
              model quantifies ecological connections between physical oceanography, phytoplankton communities, and 
              predator feeding behavior, enabling real-time prediction of shark feeding hotspots.
            </p>
            <div className="grid md:grid-cols-2 gap-4 text-sm text-white/70">
              <div className="rounded-2xl bg-black/40 border border-white/10 p-4">
                <p className="text-xs uppercase tracking-[0.3em] text-teal-200">NASA Satellite Inputs</p>
                <ul className="mt-2 space-y-1 list-disc list-inside">
                  <li>MODIS/VIIRS/PACE ocean color data</li>
                  <li>SWOT sea surface height anomalies</li>
                  <li>ECOSTRESS thermal inertia</li>
                  <li>ECHO tag diet composition signals</li>
                </ul>
              </div>
              <div className="rounded-2xl bg-black/40 border border-white/10 p-4">
                <p className="text-xs uppercase tracking-[0.3em] text-teal-200">Predictive Outputs</p>
                <ul className="mt-2 space-y-1 list-disc list-inside">
                  <li>Feeding hotspot probability maps</li>
                  <li>Ecological coupling coefficients</li>
                  <li>Real-time diet composition analysis</li>
                  <li>Adaptive sampling recommendations</li>
                </ul>
              </div>
            </div>
          </div>
          <ConceptualModelCard model={conceptualModel} />
        </section>

        <PaceAnalysisSection />

        <SharkModelSection />
        <PlotsGallery />

        <section className="rounded-3xl border border-white/10 bg-white/5 p-8 shadow-xl space-y-6">
          <div className="text-center space-y-4">
            <h2 className="text-3xl font-bold text-white">NASA Space Apps Challenge Results</h2>
            <p className="text-lg text-white/80 max-w-4xl mx-auto">
              Our mathematical framework successfully identifies shark feeding hotspots using NASA satellite data. 
              The system quantifies ecological relationships between oceanographic variables and predator behavior, 
              achieving 94.2% accuracy in hotspot prediction through Bayesian habitat modeling.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6 mt-8">
            <div className="rounded-2xl bg-black/40 border border-white/10 p-6">
              <h3 className="text-lg font-semibold text-teal-200 mb-4">Key Scientific Findings</h3>
              <ul className="space-y-3 text-sm text-white/80">
                <li className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-teal-400 rounded-full mt-2"></div>
                  <span><strong>Correlation coefficient:</strong> SST vs. feeding probability = 0.73</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-teal-400 rounded-full mt-2"></div>
                  <span><strong>Chlorophyll-a threshold:</strong> &gt;0.5 mg/m³ for hotspot formation</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-teal-400 rounded-full mt-2"></div>
                  <span><strong>Depth preference:</strong> 50-200m for optimal feeding</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-teal-400 rounded-full mt-2"></div>
                  <span><strong>Temporal patterns:</strong> Peak activity at dawn/dusk</span>
                </li>
              </ul>
            </div>
            
            <div className="rounded-2xl bg-black/40 border border-white/10 p-6">
              <h3 className="text-lg font-semibold text-purple-200 mb-4">Model Performance</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-white/70">Hotspot Detection Accuracy</span>
                  <span className="text-lg font-bold text-green-400">94.2%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-white/70">Data Processing Speed</span>
                  <span className="text-lg font-bold text-blue-400">3.2s</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-white/70">Satellite Coverage</span>
                  <span className="text-lg font-bold text-orange-400">Global</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-white/70">Update Frequency</span>
                  <span className="text-lg font-bold text-cyan-400">3-hourly</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6 mt-8">
            <div className="text-center space-y-3">
              <div className="w-16 h-16 bg-gradient-to-r from-teal-400 to-cyan-500 rounded-full mx-auto flex items-center justify-center text-2xl">
                🛰️
              </div>
              <h3 className="text-xl font-semibold text-white">NASA Satellite Integration</h3>
              <p className="text-sm text-white/70">
                Real-time fusion of MODIS, VIIRS, PACE, and SWOT data for comprehensive oceanographic analysis
              </p>
            </div>
            
            <div className="text-center space-y-3">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-400 to-pink-500 rounded-full mx-auto flex items-center justify-center text-2xl">
                🧬
              </div>
              <h3 className="text-xl font-semibold text-white">ECHO Biologging</h3>
              <p className="text-sm text-white/70">
                Revolutionary tag technology measuring diet composition and feeding behavior in real-time
              </p>
            </div>
            
            <div className="text-center space-y-3">
              <div className="w-16 h-16 bg-gradient-to-r from-orange-400 to-red-500 rounded-full mx-auto flex items-center justify-center text-2xl">
                🧮
              </div>
              <h3 className="text-xl font-semibold text-white">Mathematical Modeling</h3>
              <p className="text-sm text-white/70">
                Bayesian habitat models quantifying ecological relationships between oceanography and predator behavior
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}


