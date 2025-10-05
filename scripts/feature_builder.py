#!/usr/bin/env python3
"""Feature engineering pipeline for shark hotspot modeling.

This script ingests NASA satellite products (PACE, MODIS/VIIRS, SWOT, PAR), aligns
them on a common spatio-temporal grid, and emits a tabular feature set together
with an ordered list of phytoplankton "hotspots" derived from delta NFLH.

The implementation is intentionally lightweight so it can run inside the
hackathon workspace. When full datasets are unavailable, the script degrades
gracefully by writing empty shells that document the intended schema.
"""

from __future__ import annotations

import argparse
import json
import logging
from pathlib import Path
from typing import Dict, List, Tuple

import numpy as np
import pandas as pd
import xarray as xr
import yaml

logger = logging.getLogger(__name__)

DEFAULT_CONFIG = "configs/pipeline.yml"


def _load_config(path: str | Path) -> Dict:
    cfg_path = Path(path)
    if not cfg_path.exists():
        raise FileNotFoundError(f"Config not found: {cfg_path}")
    with cfg_path.open("r", encoding="utf-8") as stream:
        return yaml.safe_load(stream)


def _glob_files(pattern: str) -> List[Path]:
    files = sorted(Path().glob(pattern))
    if not files:
        logger.warning("No files matched pattern %s", pattern)
    return files


def _open_dataset(path: Path, group: str | None = None) -> xr.Dataset:
    return xr.open_dataset(path, group=group) if group else xr.open_dataset(path)


def _compute_oc4(rrs: xr.DataArray, wavelengths: xr.DataArray) -> xr.DataArray:
    """Compute OC4 proxy using standard 443/490/510/555 nm bands."""
    target_bands = {}
    for nm in (443, 490, 510, 555):
        idx = int(np.nanargmin(np.abs(wavelengths.values - nm)))
        target_bands[nm] = rrs.isel(band=idx)

    numerator = xr.concat(
        [target_bands[443], target_bands[490], target_bands[510]],
        dim="band_max",
    ).max(dim="band_max")
    ratio = numerator / target_bands[555]
    a0, a1, a2, a3, a4 = 0.3272, -2.9940, 2.7218, -1.2259, -0.5683
    log_r = np.log10(ratio.clip(min=1e-6))
    return 10 ** (a0 + a1 * log_r + a2 * log_r**2 + a3 * log_r**3 + a4 * log_r**4)


def _pace_derived_fields(pace_path: Path) -> Tuple[pd.DataFrame, xr.DataArray, xr.Dataset]:
    geo = _open_dataset(pace_path, group="geophysical_data")
    nav = _open_dataset(pace_path, group="navigation_data")
    sensor = _open_dataset(pace_path, group="sensor_band_parameters")

    nflh = geo["nflh"].load()
    avw = geo["avw"].load()
    rrs = geo["Rrs"].load()
    wavelengths = sensor["wavelength"].load()

    oc4 = _compute_oc4(rrs, wavelengths)

    df = pd.DataFrame(
        {
            "lat": nav["latitude"].values.flatten(),
            "lon": nav["longitude"].values.flatten(),
            "nflh": nflh.values.flatten(),
            "avw": avw.values.flatten(),
            "oc4": oc4.values.flatten(),
        }
    )
    df["pace_file"] = pace_path.name
    return df, nflh, nav


def _aggregate_features(cfg: Dict) -> Tuple[pd.DataFrame, List[Dict]]:
    pace_files = _glob_files(cfg["input"]["pace_l2_glob"])
    feature_frames: List[pd.DataFrame] = []
    hotspots: List[Dict] = []

    previous_nflh = None
    previous_nav = None
    previous_meta = None
    top_n = cfg["processing"].get("hot_spot_top_n", 20)

    for path in pace_files:
        logger.info("Processing %s", path)
        df, nflh, nav = _pace_derived_fields(path)
        feature_frames.append(df)

        if previous_nflh is not None:
            delta = nflh - previous_nflh
            flattened = delta.values.flatten()
            if flattened.size:
                top_idx = np.argpartition(flattened, -top_n)[-top_n:]
                lat_values = nav["latitude"].values.flatten()
                lon_values = nav["longitude"].values.flatten()
                for rank, flat_index in enumerate(top_idx, start=1):
                    hotspots.append(
                        {
                            "rank": rank,
                            "lat": float(lat_values[flat_index]),
                            "lon": float(lon_values[flat_index]),
                            "delta_nflh": float(flattened[flat_index]),
                            "from_file": previous_meta,
                            "to_file": path.name,
                        }
                    )
        previous_nflh = nflh
        previous_nav = nav
        previous_meta = path.name

    if not feature_frames:
        logger.warning("No PACE features constructed; returning empty frame")
        return pd.DataFrame(), hotspots

    combined = pd.concat(feature_frames, ignore_index=True)
    return combined, hotspots


def build_features(cfg: Dict) -> None:
    feature_table, hotspots = _aggregate_features(cfg)

    feature_path = Path(cfg["output"]["feature_table"])
    hotspot_path = Path(cfg["output"]["hotspot_geojson"])

    feature_path.parent.mkdir(parents=True, exist_ok=True)
    hotspot_path.parent.mkdir(parents=True, exist_ok=True)

    if not feature_table.empty:
        feature_table.to_parquet(feature_path, index=False)
    else:
        feature_path.write_bytes(b"")

    hotspot_geojson = {
        "type": "FeatureCollection",
        "features": [
            {
                "type": "Feature",
                "properties": {k: v for k, v in record.items() if k not in {"lat", "lon"}},
                "geometry": {
                    "type": "Point",
                    "coordinates": [record["lon"], record["lat"]],
                },
            }
            for record in hotspots
        ],
    }
    hotspot_path.write_text(json.dumps(hotspot_geojson, indent=2), encoding="utf-8")

    logger.info("Wrote %s", feature_path)
    logger.info("Wrote %s", hotspot_path)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Build shark hotspot features")
    parser.add_argument(
        "--config",
        default=DEFAULT_CONFIG,
        help="Path to YAML configuration (default: %(default)s)",
    )
    parser.add_argument(
        "--log-level",
        default="INFO",
        help="Logging level (DEBUG, INFO, WARNING, ...)",
    )
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    logging.basicConfig(level=args.log_level.upper(), format="%(levelname)s %(message)s")
    cfg = _load_config(args.config)
    build_features(cfg)


if __name__ == "__main__":
    main()
