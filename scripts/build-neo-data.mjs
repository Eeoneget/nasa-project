import fs from "fs";
import path from "path";
import https from "https";
import readline from "readline";
import { pipeline } from "stream";
import { promisify } from "util";
import { createGunzip } from "zlib";

const REGION = {
    latMin: 30,
    latMax: 45,
    lonMin: -80,
    lonMax: -60,
};

const MONTH_COUNT = 12;
const START_MONTH = "2024-09";

const DATASETS = [
    { key: "sst", code: "MYD28M", source: "NASA NEO (MODIS Aqua SST)" },
    {
        key: "chlorophyll",
        code: "MY1DMM_CHLORA",
        source: "NASA NEO (MODIS-Aqua Chlorophyll-a)",
    },
];

const RAW_DIR = path.join(process.cwd(), "data", "raw");
const OUTPUT_FILE = path.join(process.cwd(), "src", "data", "mockData.js");

const lonFactor = 10; // 0.1� grid
const latFactor = 10;
const totalCols = 3600;
const totalRows = 1800;

const rowBounds = {
    start: Math.max(0, Math.floor((90 - REGION.latMax) * latFactor)),
    end: Math.min(totalRows - 1, Math.ceil((90 - REGION.latMin) * latFactor)),
};
const colBounds = {
    start: Math.max(0, Math.floor((REGION.lonMin + 180) * lonFactor)),
    end: Math.min(totalCols - 1, Math.ceil((REGION.lonMax + 180) * lonFactor)),
};

const ensureDir = (dirPath) => {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
    }
};

ensureDir(RAW_DIR);

const streamPipeline = promisify(pipeline);

function generateMonths(start, count) {
    const [startYear, startMonth] = start.split("-").map(Number);
    const months = [];
    let year = startYear;
    let month = startMonth - 1;
    for (let i = 0; i < count; i += 1) {
        const date = new Date(Date.UTC(year, month, 1));
        months.push(date.toISOString().slice(0, 7));
        month += 1;
        if (month >= 12) {
            month = 0;
            year += 1;
        }
    }
    return months;
}

function downloadFile(url, destination) {
    return new Promise((resolve, reject) => {
        if (fs.existsSync(destination)) {
            resolve(destination);
            return;
        }

        const fileStream = fs.createWriteStream(destination);
        https
            .get(url, (response) => {
                if (response.statusCode && response.statusCode >= 400) {
                    reject(
                        new Error(
                            `Failed to download ${url} (status ${response.statusCode})`
                        )
                    );
                    response.resume();
                    return;
                }
                response.pipe(fileStream);
                fileStream.on("finish", () =>
                    fileStream.close(() => resolve(destination))
                );
            })
            .on("error", (error) => {
                fs.unlink(destination, () => reject(error));
            });
    });
}

async function ensureCsv(datasetCode, month) {
    const dir = path.join(RAW_DIR, datasetCode);
    ensureDir(dir);
    const gzPath = path.join(dir, `${datasetCode}_${month}.CSV.gz`);
    const csvPath = path.join(dir, `${datasetCode}_${month}.csv`);

    if (!fs.existsSync(csvPath)) {
        const url = `https://neo.gsfc.nasa.gov/archive/csv/${datasetCode}/${datasetCode}_${month}.CSV.gz`;
        console.log(`Downloading ${url}`);
        await downloadFile(url, gzPath);
        await streamPipeline(
            fs.createReadStream(gzPath),
            createGunzip(),
            fs.createWriteStream(csvPath)
        );
    }

    return csvPath;
}

async function readRegionGrid(csvPath) {
    const grid = [];
    let rowIndex = 0;
    const rl = readline.createInterface({
        input: fs.createReadStream(csvPath),
        crlfDelay: Infinity,
    });

    for await (const line of rl) {
        if (rowIndex >= rowBounds.start && rowIndex <= rowBounds.end) {
            const rawValues = line.split(",");
            const subset = rawValues
                .slice(colBounds.start, colBounds.end + 1)
                .map((value) => {
                    const numeric = Number(value);
                    if (!Number.isFinite(numeric) || numeric >= 99999) {
                        return null;
                    }
                    return numeric;
                });
            grid.push(subset);
        }
        rowIndex += 1;
        if (rowIndex > rowBounds.end) {
            break;
        }
    }

    return grid;
}

function computeMonthCells(sstGrid, chlGrid, month) {
    const rows = sstGrid.length;
    const cols = rows > 0 ? sstGrid[0].length : 0;
    const cells = [];

    for (let r = 0; r < rows; r += 1) {
        for (let c = 0; c < cols; c += 1) {
            const sst = sstGrid[r][c];
            const chl = chlGrid[r][c];
            if (sst == null || chl == null) continue;

            const globalRow = rowBounds.start + r;
            const globalCol = colBounds.start + c;
            const lat = 90 - (globalRow + 0.5) / latFactor;
            const lon = -180 + (globalCol + 0.5) / lonFactor;
            cells.push({
                r,
                c,
                lat: Number(lat.toFixed(3)),
                lon: Number(lon.toFixed(3)),
                sst,
                chl,
            });
        }
    }

    const lonStep = 1 / lonFactor;
    const latStep = 1 / latFactor;

    for (const cell of cells) {
        const { r, c } = cell;
        const center = sstGrid[r][c];
        const left = c > 0 ? sstGrid[r][c - 1] : center;
        const right = c < cols - 1 ? sstGrid[r][c + 1] : center;
        const up = r > 0 ? sstGrid[r - 1][c] : center;
        const down = r < rows - 1 ? sstGrid[r + 1][c] : center;

        const dx = ((right ?? center) - (left ?? center)) / (2 * lonStep);
        const dy = ((down ?? center) - (up ?? center)) / (2 * latStep);
        cell.front = Number(Math.sqrt(dx * dx + dy * dy).toFixed(4));
    }

    const validCells = cells.filter((cell) => Number.isFinite(cell.front));
    const sstValues = validCells.map((cell) => cell.sst);
    const chlValues = validCells.map((cell) => cell.chl);
    const frontValues = validCells.map((cell) => cell.front);

    const normalize = (value, min, max) => {
        if (!Number.isFinite(value) || max === min) return 0;
        return (value - min) / (max - min);
    };

    const sstMin = Math.min(...sstValues);
    const sstMax = Math.max(...sstValues);
    const chlMin = Math.min(...chlValues);
    const chlMax = Math.max(...chlValues);
    const frontMin = Math.min(...frontValues);
    const frontMax = Math.max(...frontValues);

    for (const cell of validCells) {
        const sstNorm = normalize(cell.sst, sstMin, sstMax);
        const chlNorm = normalize(cell.chl, chlMin, chlMax);
        const frontNorm = normalize(cell.front, frontMin, frontMax);
        const activity = 0.55 * sstNorm + 0.35 * chlNorm + 0.1 * frontNorm;
        cell.activity = Number(activity.toFixed(3));
        cell.metrics = {
            sstNorm: Number(sstNorm.toFixed(3)),
            chlNorm: Number(chlNorm.toFixed(3)),
            frontNorm: Number(frontNorm.toFixed(3)),
        };
    }

    const sstMean = Number(
        (sstValues.reduce((sum, v) => sum + v, 0) / sstValues.length).toFixed(3)
    );
    const chlMean = Number(
        (chlValues.reduce((sum, v) => sum + v, 0) / chlValues.length).toFixed(3)
    );
    const frontMean = Number(
        (
            frontValues.reduce((sum, v) => sum + v, 0) / frontValues.length
        ).toFixed(4)
    );
    const activityMean = Number(
        (
            validCells.reduce((sum, cell) => sum + cell.activity, 0) /
            validCells.length
        ).toFixed(3)
    );

    const monthStats = {
        month,
        cells: validCells,
        sstMean,
        chlMean,
        frontMean,
        activityMean,
    };
    monthStats.hotspotCount = validCells.filter(
        (cell) => cell.activity >= 0.7
    ).length;
    return monthStats;
}

function formatMonthLabel(isoMonth) {
    const [year, month] = isoMonth.split("-").map(Number);
    const date = new Date(Date.UTC(year, month - 1, 1));
    return date.toLocaleString("en-US", { month: "short", year: "numeric" });
}

function percentile(values, target) {
    if (values.length === 0) return 0;
    const sorted = [...values].sort((a, b) => a - b);
    const index = Math.min(
        sorted.length - 1,
        Math.max(0, Math.round(target * (sorted.length - 1)))
    );
    return sorted[index];
}

function buildScenarioDescription(id, stats) {
    if (id === "gulf_stream_warm") {
        return `Peak thermal pulse with average SST ${stats.sstMean.toFixed(
            1
        )} degC and boosted activity index ${stats.activityMean.toFixed(2)}.`;
    }
    if (id === "gulf_stream_night") {
        return `Maximum frontal shear (${stats.frontMean.toFixed(
            2
        )} gradient units) drives nocturnal predator excursions.`;
    }
    if (id === "gulf_stream_relax") {
        return `Surface bloom relaxation; chlorophyll falls to ${stats.chlMean.toFixed(
            2
        )} mg/m^3 and activity eases.`;
    }
    return `Representative baseline month with SST ${stats.sstMean.toFixed(
        1
    )} degC and balanced productivity.`;
}

function labelForChl(value) {
    if (value >= 1.5) return "Very High";
    if (value >= 1.0) return "High";
    if (value >= 0.5) return "Moderate";
    if (value >= 0.2) return "Low";
    return "Very Low";
}

function buildLayers(monthData, scenarioId, sourceInfo) {
    const timestamp = `${monthData.month}-01T00:00:00Z`;

    const topTemp = [...monthData.cells]
        .sort((a, b) => b.sst - a.sst)
        .slice(0, 12)
        .map((cell, index) => ({
            id: `${scenarioId}-sst-${index}`,
            lat: cell.lat,
            lng: cell.lon,
            temperature: Number(cell.sst.toFixed(2)),
            anomaly: Number((cell.sst - monthData.sstMean).toFixed(2)),
            depthRange: [0, 200],
            timestamp,
            source: sourceInfo.sst,
        }));

    const topChl = [...monthData.cells]
        .sort((a, b) => b.chl - a.chl)
        .slice(0, 12)
        .map((cell, index) => ({
            id: `${scenarioId}-chl-${index}`,
            lat: cell.lat,
            lng: cell.lon,
            chlorophyll: Number(cell.chl.toFixed(3)),
            bloomAnomaly: Number((cell.chl - monthData.chlMean).toFixed(3)),
            depthRange: [0, 60],
            timestamp,
            source: sourceInfo.chlorophyll,
        }));

    const topActivity = [...monthData.cells]
        .sort((a, b) => b.activity - a.activity)
        .slice(0, 8)
        .map((cell, index) => ({
            id: `${scenarioId}-hotspot-${index}`,
            lat: cell.lat,
            lng: cell.lon,
            confidence: Number(
                Math.min(0.99, Math.max(0.1, cell.activity)).toFixed(2)
            ),
            dietSignal: `Energy index +${Math.round(
                (cell.activity - 0.5) * 100
            )}%`,
            supportingDrivers: [
                `SST ${cell.sst.toFixed(1)} degC`,
                `Chl ${cell.chl.toFixed(2)} mg/m^3`,
                `Front ${cell.front.toFixed(2)} units`,
            ],
            depthRange: [40, 220],
            timestamp,
            source: "Derived from NASA NEO SST & Chlorophyll",
        }));

    return {
        seaSurfaceTemperature: topTemp,
        phytoplankton: topChl,
        sharkHotspots: topActivity,
    };
}

const average = (values) =>
    values.length
        ? values.reduce((sum, value) => sum + value, 0) / values.length
        : 0;

function buildAnalyticsSeries(monthsData) {
    const sharkPresenceVsTemp = monthsData.map((month) => ({
        hour: formatMonthLabel(month.month),
        sst: Number(month.sstMean.toFixed(2)),
        sharkPresence: Number(month.activityMean.toFixed(3)),
    }));

    const hotspotTrends = monthsData.map((month) => ({
        day: formatMonthLabel(month.month),
        hotspots: month.hotspotCount,
    }));

    return {
        sharkPresenceVsTemp,
        hotspotTrends,
        dietBreakdown: buildDietBreakdown(monthsData),
    };
}

function buildDietBreakdown(monthsData) {
    const sstTotal = monthsData.reduce((sum, month) => sum + month.sstMean, 0);
    const chlTotal = monthsData.reduce((sum, month) => sum + month.chlMean, 0);
    const frontTotal = monthsData.reduce(
        (sum, month) => sum + month.frontMean,
        0
    );
    const baseTotal = sstTotal + chlTotal + frontTotal || 1;

    const sstPct = Math.round((sstTotal / baseTotal) * 100);
    const chlPct = Math.round((chlTotal / baseTotal) * 100);
    const frontPct = Math.round((frontTotal / baseTotal) * 100);
    const telemetryPct = Math.max(0, 100 - (sstPct + chlPct + frontPct));

    return [
        { type: "Thermal structure", pct: sstPct },
        { type: "Chlorophyll productivity", pct: chlPct },
        { type: "Frontal shear", pct: frontPct },
        { type: "Telemetry baseline", pct: telemetryPct },
    ];
}

function buildCorrelationMatrix(points) {
    const variables = ["sst", "chlorophyll", "front", "shark_activity"];
    const array = points.map((point) => ({
        sst: point.sst,
        chlorophyll: point.chl,
        front: point.front,
        shark_activity: point.activity,
    }));

    const mean = Object.fromEntries(
        variables.map((variable) => [
            variable,
            average(array.map((item) => item[variable])),
        ])
    );

    const covariance = (a, b) =>
        average(array.map((item) => (item[a] - mean[a]) * (item[b] - mean[b])));
    const variance = Object.fromEntries(
        variables.map((variable) => [variable, covariance(variable, variable)])
    );

    const cells = [];
    for (const row of variables) {
        for (const col of variables) {
            const denom = Math.sqrt(variance[row] * variance[col]);
            const corr = denom === 0 ? 0 : covariance(row, col) / denom;
            cells.push({ x: col, y: row, value: Number(corr.toFixed(2)) });
        }
    }

    return { variables, cells };
}

function sampleScatterPoints(monthsData, limit = 800) {
    const merged = monthsData.flatMap((month) =>
        month.cells.map((cell) => ({
            lat: cell.lat,
            lon: cell.lon,
            sst: Number(cell.sst.toFixed(2)),
            chl: Number(cell.chl.toFixed(3)),
            front: Number(cell.front.toFixed(3)),
            activity: cell.activity,
            tagged: false,
        }))
    );

    const step = Math.max(1, Math.floor(merged.length / limit));
    const sampled = merged
        .filter((_, index) => index % step === 0)
        .slice(0, limit);
    const threshold = percentile(
        sampled.map((point) => point.activity),
        0.9
    );

    return sampled.map((point) => ({
        ...point,
        tagged: point.activity >= threshold,
    }));
}

const buildSeasonalSeries = (monthsData) =>
    monthsData.map((month) => ({
        date: `${month.month}-01`,
        sharkActivity: Number(month.activityMean.toFixed(3)),
        sst: Number(month.sstMean.toFixed(2)),
    }));

function buildSummaryStats(monthStats, referenceStats) {
    return {
        sharkOccurrence: {
            value: Number(monthStats.activityMean.toFixed(3)),
            delta: Number(
                (
                    monthStats.activityMean -
                    (referenceStats?.activityMean ?? monthStats.activityMean)
                ).toFixed(3)
            ),
        },
        hotspotsFound: {
            value: monthStats.hotspotCount,
            delta:
                monthStats.hotspotCount -
                (referenceStats?.hotspotCount ?? monthStats.hotspotCount),
        },
        avgTemperature: {
            value: Number(monthStats.sstMean.toFixed(2)),
            delta: Number(
                (
                    monthStats.sstMean -
                    (referenceStats?.sstMean ?? monthStats.sstMean)
                ).toFixed(2)
            ),
        },
        phytoplanktonLevel: {
            label: labelForChl(monthStats.chlMean),
            delta: Number(
                (
                    monthStats.chlMean -
                    (referenceStats?.chlMean ?? monthStats.chlMean)
                ).toFixed(3)
            ),
        },
    };
}

function buildSimulationTimeline(
    scenarios,
    analyticsSeries,
    referenceStats,
    sourceInfo
) {
    return scenarios.map((scenario) => ({
        id: scenario.id,
        label: scenario.label,
        description: buildScenarioDescription(scenario.id, scenario.data),
        filters: {
            depthRange: [0, 240],
            temperatureRange: [
                Math.max(0, Math.floor(scenario.data.sstMean - 2)),
                Math.ceil(scenario.data.sstMean + 2),
            ],
            timeFilter: scenario.id === "gulf_stream_night" ? "night" : "day",
        },
        layers: buildLayers(scenario.data, scenario.id, sourceInfo),
        analytics: analyticsSeries,
        stats: buildSummaryStats(scenario.data, referenceStats),
        insightKey: scenario.id,
    }));
}

(async () => {
    try {
        const months = generateMonths(START_MONTH, MONTH_COUNT);

        for (const dataset of DATASETS) {
            for (const month of months) {
                await ensureCsv(dataset.code, month);
            }
        }

        const monthObjects = [];
        const sstDataset = DATASETS.find((dataset) => dataset.key === "sst");
        const chlDataset = DATASETS.find(
            (dataset) => dataset.key === "chlorophyll"
        );

        for (const month of months) {
            const sstPath = path.join(
                RAW_DIR,
                sstDataset.code,
                `${sstDataset.code}_${month}.csv`
            );
            const chlPath = path.join(
                RAW_DIR,
                chlDataset.code,
                `${chlDataset.code}_${month}.csv`
            );
            const sstGrid = await readRegionGrid(sstPath);
            const chlGrid = await readRegionGrid(chlPath);
            monthObjects.push(computeMonthCells(sstGrid, chlGrid, month));
        }

        const baselineData = [...monthObjects].sort(
            (a, b) => a.activityMean - b.activityMean
        )[Math.floor(monthObjects.length / 2)];
        const warmData = [...monthObjects].sort(
            (a, b) => b.sstMean - a.sstMean
        )[0];
        const frontData = [...monthObjects].sort(
            (a, b) => b.frontMean - a.frontMean
        )[0];
        const relaxData = [...monthObjects].sort(
            (a, b) => a.chlMean - b.chlMean
        )[0];

        const scenarios = [
            {
                id: "gulf_stream",
                label: "Gulf Stream baseline",
                data: baselineData,
            },
            {
                id: "gulf_stream_warm",
                label: "Warm eddy pulse",
                data: warmData,
            },
            {
                id: "gulf_stream_night",
                label: "Night migration",
                data: frontData,
            },
            {
                id: "gulf_stream_relax",
                label: "Bloom relaxation",
                data: relaxData,
            },
        ];

        const analyticsSeries = buildAnalyticsSeries(monthObjects);
        const scatterPoints = sampleScatterPoints(monthObjects);
        const correlationMatrix = buildCorrelationMatrix(scatterPoints);
        const seasonalSeries = buildSeasonalSeries(monthObjects);

        const sourceInfo = {
            sst: sstDataset.source,
            chlorophyll: chlDataset.source,
        };

        const simulationTimeline = buildSimulationTimeline(
            scenarios,
            analyticsSeries,
            baselineData,
            sourceInfo
        );

        const insights = scenarios.map((scenario) => ({
            id: scenario.id,
            label: scenario.label,
            description: buildScenarioDescription(scenario.id, scenario.data),
        }));

        const scatterExport = scatterPoints.map((point, index) => ({
            id: `pt-${index}`,
            lat: point.lat,
            lon: point.lon,
            temperature: point.sst,
            chlorophyll: point.chl,
            seaLevelAnomaly: Number(point.front.toFixed(3)),
            sharkActivity: Number(point.activity.toFixed(3)),
            tagged: point.tagged,
        }));

        const seasonalByRegion = scenarios.reduce((acc, scenario) => {
            acc[scenario.id] = seasonalSeries;
            return acc;
        }, {});

        const correlationsByRegion = scenarios.reduce((acc, scenario) => {
            acc[scenario.id] = correlationMatrix;
            return acc;
        }, {});

        const scatterByRegion = scenarios.reduce((acc, scenario) => {
            acc[scenario.id] = scatterExport;
            return acc;
        }, {});

        const fileContent = `// Generated by scripts/build-neo-data.mjs on ${new Date().toISOString()}
export const oceanLayers = ${JSON.stringify(
            buildLayers(baselineData, "gulf_stream", sourceInfo),
            null,
            2
        )};

export const analyticsSeries = ${JSON.stringify(analyticsSeries, null, 2)};

export const summaryStats = ${JSON.stringify(
            buildSummaryStats(baselineData, baselineData),
            null,
            2
        )};

export const conceptualModel = ${JSON.stringify(
            {
                name: "ECHO Tag (Environmental & Consumption Holistic Observatory)",
                description:
                    "Multi-channel biologging tag integrating dual-frequency acoustic stomach-content sonar, bio-impedance spectroscopy, and NASA satellite uplink for rapid feature assimilation.",
                innovations: [
                    "Fusion of real-time prey spectra with NASA SST and chlorophyll gradients",
                    "Onboard machine learning ingesting satellite updates for hotspot nowcasts",
                    "Adaptive sampling triggered by frontal shear anomalies detected from SST fields",
                ],
                newSatelliteMetric: {
                    name: "Dynamic Bio-Resource Gradient (DBRG)",
                    definition:
                        "Composite metric blending SST gradients, chlorophyll concentration, and derived frontal shear from NASA NEO products to highlight shark foraging niches.",
                    inputs: [
                        sourceInfo.sst,
                        sourceInfo.chlorophyll,
                        "Derived frontal shear (SST gradient)",
                    ],
                },
            },
            null,
            2
        )};

export const seasonalSeriesByRegion = ${JSON.stringify(
            seasonalByRegion,
            null,
            2
        )};

export const correlationMatricesByRegion = ${JSON.stringify(
            correlationsByRegion,
            null,
            2
        )};

export const scatterCloudsByRegion = ${JSON.stringify(
            scatterByRegion,
            null,
            2
        )};

export const insightRegions = ${JSON.stringify(insights, null, 2)};

export const simulationTimeline = ${JSON.stringify(
            simulationTimeline,
            null,
            2
        )};
`;

        fs.writeFileSync(OUTPUT_FILE, fileContent);
        console.log(`Updated`);
    } catch (error) {
        console.error("Failed to build data", error);
        process.exit(1);
    }
})();
