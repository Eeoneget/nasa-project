# Shark Hotspot Prediction Blueprint

## 1. NASA Inputs
- **PACE L2 OCI**: NFLH, AVW, Rrs (via `plots/first/plotting.py`).
- **MODIS/VIIRS SST**: Level-3 composites for thermal fronts and anomalies.
- **SWOT**: Sea-surface height (SSH), derived eddy kinetic energy (EKE).
- **CERES PAR**: Photosynthetically active radiation.
- **Bathymetry**: ETOPO1/GEBCO grids to derive slope/curvature.
- **Telemetry**: Tagged shark locations, depths, and feeding events (CSV/Parquet).

## 2. Processing Pipeline
1. **Ingest satellite tiles** with `xarray` (`scripts/feature_builder.py`).
2. **Interpolate** each product onto a common lat/lon/time grid.
3. **Derive features**:
   - Temporal deltas: `delta_nflh`, `delta_sst`, `rolling_eke`.
   - Spectral descriptors: OC4, unitless ratios from Rrs.
   - Physical gradients: SST gradient, finite-difference slope of SSH.
4. **Join telemetry**: map each tag fix to nearest grid cell ±?t.
5. **Label events**: presence (binary) and feeding intensity (counts per 6 h window).

## 3. Models
- **Presence classifier**: Logistic regression / gradient boosting.
- **Feeding intensity**: Poisson or negative-binomial GLM.
- **State dynamics**: Hidden Markov Model with states {feed, search, transit}.
- **Real-time update**: Particle filter that assimilates tag events.

## 4. Outputs
- Raster `feed_probability(lat, lon, t)`.
- Ranked hotspot list (top-N cells with high delta NFLH * presence).
- Correlation matrices between physical and biological indices.
- Concept metric: *PACE Predator Coupling Index (PPCI)* combining NFLH/AVW/OC4.

## 5. Next Steps
1. Run `python scripts/feature_builder.py --config configs/pipeline.yml` to build feature parquet files.
2. Train models via `python scripts/run_training.py --config configs/model.yml`.
3. Visualize with existing `plots/` notebooks or extend `PaceAnalysisSection` (optional).
4. Package results into hackathon presentation (maps, charts, tag concept).

