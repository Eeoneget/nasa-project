"use client";

import pacePlotData from "../data/pacePlotData.json";
import { gridMeta, deltaMeta, lineMeta } from "../data/pacePlotMeta";
import { HeatmapCard, LineChartCard } from "./InteractivePlotCard";

export default function PaceAnalysisSection() {
    const { grids, lines, hotspots } = pacePlotData;

    return (
        <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-8 text-white shadow-xl space-y-10">
            <div className="space-y-4">
                <p className="text-xs uppercase tracking-[0.4em] text-teal-300">
                    PACE L2 Analysis
                </p>
                <h2 className="text-2xl md:text-3xl font-semibold">
                    Interactive PACE OCI Explorer
                </h2>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
                {["nflh_05Sep", "nflh_09Sep", "avw_05Sep", "avw_09Sep"].map(
                    (key) => (
                        <HeatmapCard
                            key={key}
                            grid={grids[key]}
                            title={gridMeta[key]?.title}
                            description={gridMeta[key]?.description}
                            colorscale={gridMeta[key]?.colorscale}
                            colorbarTitle={gridMeta[key]?.colorbarTitle}
                            height={320}
                        />
                    )
                )}
            </div>

            <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
                <HeatmapCard
                    grid={grids["delta_from_pairs"]}
                    title={deltaMeta.title}
                    description={deltaMeta.description}
                    colorscale={deltaMeta.colorscale}
                    colorbarTitle={deltaMeta.colorbarTitle}
                    zmid={deltaMeta.zmid}
                    height={360}
                />
                <div className="rounded-2xl border border-white/10 bg-black/40 p-5 space-y-3">
                    <h3 className="text-lg font-semibold text-teal-200">
                        Top delta NFLH cells
                    </h3>
                    <p className="text-xs text-white/65 leading-relaxed">
                        Highest-ranked bloom surges based on ?NFLH ? perfect
                        talking points when explaining sampling priorities.
                    </p>
                    <ol className="space-y-2 text-sm">
                        {hotspots?.map((spot) => (
                            <li
                                key={`${spot.rank}-${spot.row}-${spot.col}`}
                                className="rounded-xl border border-white/10 bg-black/60 px-3 py-2"
                            >
                                <span className="text-teal-200 mr-2">
                                    #{spot.rank}
                                </span>
                                Row {spot.row}, Col {spot.col} - Delta{" "}
                                {spot.value.toFixed(3)}
                            </li>
                        ))}
                    </ol>
                </div>
            </div>

            <LineChartCard
                title={lineMeta.rrs_mean.title}
                description={lineMeta.rrs_mean.description}
                wavelengths={lines?.rrs_mean?.wavelength ?? []}
                rrs05={lines?.rrs_mean?.rrs05 ?? []}
                rrs09={lines?.rrs_mean?.rrs09 ?? []}
                height={360}
            />

            <div className="grid gap-6 md:grid-cols-2">
                {[
                    "chlorophyll-2025-09-01AND2025-09-07",
                    "chlorophyll-2025-09-08AND2025-09-14",
                ].map((key) => (
                    <HeatmapCard
                        key={key}
                        grid={grids[key]}
                        title={gridMeta[key]?.title}
                        description={gridMeta[key]?.description}
                        colorscale={gridMeta[key]?.colorscale}
                        colorbarTitle={gridMeta[key]?.colorbarTitle}
                        height={340}
                    />
                ))}
            </div>
        </section>
    );
}
