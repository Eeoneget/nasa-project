"use client";

import { useEffect, useMemo, useState } from "react";
import SeasonalDynamicsChart from "./SeasonalDynamicsChart";
import CorrelationMatrix from "./CorrelationMatrix";
import ScatterInsights from "./ScatterInsights";
import {
  seasonalSeriesByRegion,
  correlationMatricesByRegion,
  scatterCloudsByRegion,
  insightRegions
} from "../data/mockData";

export default function ScenarioInsights({ currentInsightKey }) {
  const [selectedKey, setSelectedKey] = useState(currentInsightKey);
  const [syncWithScenario, setSyncWithScenario] = useState(true);

  useEffect(() => {
    if (syncWithScenario && currentInsightKey) {
      setSelectedKey(currentInsightKey);
    }
  }, [currentInsightKey, syncWithScenario]);

  const region = insightRegions.find((item) => item.id === selectedKey) ?? insightRegions[0];

  const seasonalData = seasonalSeriesByRegion[selectedKey] ?? [];
  const correlationData = correlationMatricesByRegion[selectedKey] ?? {};
  const scatterData = scatterCloudsByRegion[selectedKey] ?? [];

  const options = useMemo(
    () =>
      insightRegions.map((item) => ({
        id: item.id,
        label: item.label
      })),
    []
  );

  return (
    <section className="space-y-6">
      <div className="rounded-3xl border border-white/10 bg-white/5 p-6 text-white shadow-xl space-y-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold">Regional insight lab</h2>
            <p className="text-sm text-white/70">
              Explore how shark activity couples with NASA ocean products. Sync with the active scenario or choose a region manually.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-xs">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={syncWithScenario}
                onChange={(event) => setSyncWithScenario(event.target.checked)}
                className="accent-teal-400"
              />
              <span>Sync with scenario</span>
            </label>
            <select
              value={selectedKey}
              onChange={(event) => {
                setSelectedKey(event.target.value);
                setSyncWithScenario(false);
              }}
              className="rounded-2xl border border-white/20 bg-black/40 px-3 py-2 text-white"
            >
              {options.map((option) => (
                <option key={option.id} value={option.id} className="bg-slate-900">
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        <p className="text-xs text-white/60">{region?.description}</p>
      </div>
      <SeasonalDynamicsChart data={seasonalData} />
      <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr]">
        <ScatterInsights data={scatterData} />
        <CorrelationMatrix matrix={correlationData} />
      </div>
    </section>
  );
}
