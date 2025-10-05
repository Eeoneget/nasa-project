# Shark Activity Intelligence — NASA Space Apps Pitch

## Vision
We combine NASA ocean color, thermal, and altimetry products with biologging telemetry to forecast shark foraging hotspots. The goal is to turn raw satellite pixels into actionable intelligence for conservation teams and adaptive research missions.

## What the demo shows
- **Interactive PACE L2 explorer** — zoomable heatmaps (NFLH, AVW, ΔNFLH) drawn directly from the September 2025 PACE granules.
- **Synthetic shark activity model** — stochastic NASA-inspired simulation that feeds a dashboard (time-series, scatter, hotspots) to illustrate how a real system would behave once live telemetry is connected.
- **Plots manifest API** — `/api/plots/manifest` serves metadata for every PNG, notebook, and script in `plots/`, so jurors can trace every figure back to its Python source.

## Data + pipeline highlights
1. `plots/first/plotting.py` and `plots/second/plotting-2.py` download/compute PACE diagnostics and export both PNGs and Plotly-ready JSON (`scripts/build_plotly_from_png.py`).
2. `main.py` encapsulates the SharkActivityModel math; `scripts/build_shark_model_dashboard.py` serialises its outputs for the React dashboard.
3. The Next.js front-end renders everything interactively (Plotly heatmaps/line charts, global stats cards, hotspot lists).

## Why it matters
- Enables **faster hotspot detection** by fusing NASA products (PACE, MODIS/VIIRS, SWOT) with telemetry ingestion.
- Provides **transparent analytics**: every chart is reproducible via the included scripts.
- Positions teams to scale from demo data to real-time Earthdata/SeaTag feeds with minimal code changes.

## How to run
```bash
npm install
npm run dev          # http://localhost:3000 with interactive dashboards

# Update assets from Python scripts when new data arrives
python plots/first/plotting.py                # rebuild PACE PNG + JSON
python scripts/build_plotly_from_png.py       # push PNG data into Plotly payload
python scripts/build_shark_model_dashboard.py # refresh synthetic shark model dataset

# Optional Dockerised deployment
npm install
npm run build
npm run start
# OR docker build -t nasa-shark-app . && docker run -p 3000:3000 nasa-shark-app
```

## Storyboard for presentation
1. **Problem hook** — sharks are apex sentinels; we need rapid insight into their habitat shifts.
2. **Data fusion** — NASA satellites + telemetry -> Shark Activity Index (explain formulas from UI cards).
3. **Interactive demo** — show PACE heatmaps, drill into ΔNFLH, highlight top cells and time-series.
4. **Deployment** — use manifest API + Docker to transfer solution to partner labs.
5. **Next steps** — swap simulated feeds for live tags, integrate NOAA eDNA, add alerting pipeline.

## Team takeaway
This repo is deliberately hackathon-friendly: every dataset, equation, and UI feature is documented. Run the scripts, regenerate the visuals, and you are demo-ready in minutes.
