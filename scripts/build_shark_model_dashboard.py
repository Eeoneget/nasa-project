#!/usr/bin/env python3
"""Generate JSON payload for the Shark Activity dashboard used by the Next.js front-end."""

from __future__ import annotations

import json
import numpy as np
import pandas as pd
from pathlib import Path
from datetime import datetime

BASE_DIR = Path(__file__).resolve().parents[1]
OUTPUT_PATH = BASE_DIR / "src" / "data" / "sharkModelDashboard.json"

REGIONS = {
    "gulf_stream": (35.0, -75.0),
    "california_current": (32.0, -118.0),
    "great_barrier_reef": (-18.0, 147.0),
    "hawaii": (21.0, -157.0),
    "south_africa": (-32.0, 18.0),
    "galapagos": (-0.5, -91.0),
    "north_pacific": (45.0, -160.0),
    "southern_ocean": (-55.0, 30.0)
}

FORMULA_CARDS = [
    {
        "title": "Shark Activity Index (SAI)",
        "expression": "SAI = w1 · g(SST) + w2 · h(Chl-a) + w3 · k(|SLA|) + ε",
        "description": "Weighted blend of thermal preference, chlorophyll productivity, and sea-level anomaly magnitude.",
        "details": [
            "w1 = 0.35, w2 = 0.40, w3 = 0.25",
            "g(SST): Gaussian preference around 22 °C (σ = 6 °C)",
            "h(Chl-a): Productivity response log(1 + Chl-a) · (1 - exp(-Chl-a/0.3))",
            "k(|SLA|): Normalised eddy energy proxy",
            "ε ~ N(0, 0.2)"
        ]
    },
    {
        "title": "Thermal preference",
        "expression": "g(SST) = exp(-0.5 · ((SST - μ) / σ)^2)",
        "description": "Captures preference for mild waters.",
        "details": ["μ = 22 °C", "σ = 6 °C"]
    },
    {
        "title": "Productivity response",
        "expression": "h(Chl-a) = log(1 + Chl-a) · (1 - exp(-Chl-a / κ))",
        "description": "Links phytoplankton biomass to feeding opportunities.",
        "details": ["κ = 0.3", "Chl-a in mg m⁻³"]
    }
]


def simulate_nasa_satellite_data(lat: float, lon: float, days: int = 365) -> pd.DataFrame:
    dates = pd.date_range(end=datetime.utcnow(), periods=days, freq="D")
    t = np.arange(days)
    seasonal = np.sin(2 * np.pi * t / 365)

    sst_base = 15 + 10 * (1 + np.sin(np.radians(lat))) / 2
    sst = sst_base + 5 * seasonal + np.random.normal(0, 1, days)

    chlor_base = 0.1 + 0.5 * np.abs(np.sin(np.radians(lat)))
    chlorophyll = np.maximum(0.01, chlor_base + 0.3 * seasonal + np.random.normal(0, 0.1, days))

    sla = np.random.normal(0, 0.15, days) + 0.1 * seasonal
    salinity = 35 + 2 * np.random.normal(0, 0.5, days)

    return pd.DataFrame(
        {
            "date": dates,
            "lat": lat,
            "lon": lon,
            "sst": sst,
            "chlorophyll": chlorophyll,
            "sea_level_anomaly": sla,
            "salinity": salinity,
        }
    )


def calculate_shark_activity(df: pd.DataFrame) -> pd.Series:
    sst_norm = (df["sst"] - df["sst"].mean()) / df["sst"].std()
    chlor_norm = (df["chlorophyll"] - df["chlorophyll"].mean()) / df["chlorophyll"].std()
    sla_norm = (np.abs(df["sea_level_anomaly"]) - np.abs(df["sea_level_anomaly"]).mean()) / np.abs(df["sea_level_anomaly"]).std()

    temp_pref = np.exp(-0.5 * ((df["sst"] - 22) / 6) ** 2)
    temp_pref_norm = (temp_pref - temp_pref.mean()) / temp_pref.std()

    productivity = np.log(1 + df["chlorophyll"]) * (1 - np.exp(-df["chlorophyll"] / 0.3))
    prod_norm = (productivity - productivity.mean()) / productivity.std()

    activity = 0.35 * temp_pref_norm + 0.40 * prod_norm + 0.25 * sla_norm + 0.15 * sst_norm + 0.10 * chlor_norm
    return (activity - activity.min()) / (activity.max() - activity.min() + 1e-8)


def build_dataset() -> pd.DataFrame:
    frames = []
    for region, (lat, lon) in REGIONS.items():
        region_df = simulate_nasa_satellite_data(lat, lon)
        region_df["region"] = region
        region_df["is_custom"] = region not in {
            "gulf_stream",
            "california_current",
            "great_barrier_reef",
            "hawaii",
            "south_africa",
            "galapagos",
        }
        frames.append(region_df)
    data = pd.concat(frames, ignore_index=True)
    data["shark_activity"] = calculate_shark_activity(data)
    return data


def downsample_timeseries(df: pd.DataFrame, step: int = 14) -> pd.DataFrame:
    idx = np.arange(0, len(df), step)
    return df.iloc[idx]


def build_payload() -> dict:
    df = build_dataset()

    time_series = {}
    for region, group in df.groupby("region"):
        group = group.sort_values("date")
        sample = downsample_timeseries(group)
        time_series[region] = {
            "date": sample["date"].dt.strftime("%Y-%m-%d").tolist(),
            "activity": sample["shark_activity"].round(3).tolist(),
            "sst": sample["sst"].round(2).tolist(),
            "chlorophyll": sample["chlorophyll"].round(3).tolist(),
        }

    region_stats = (
        df.groupby("region")
        .agg(
            activity_mean=("shark_activity", "mean"),
            activity_max=("shark_activity", "max"),
            sst_mean=("sst", "mean"),
            chlor_mean=("chlorophyll", "mean"),
            count=("shark_activity", "count"),
            is_custom=("is_custom", "first"),
            lat=("lat", "first"),
            lon=("lon", "first"),
        )
        .reset_index()
    )

    region_summary = [
        {
            "region": row["region"],
            "lat": round(float(row["lat"]), 2),
            "lon": round(float(row["lon"]), 2),
            "activityMean": round(float(row["activity_mean"]), 3),
            "activityMax": round(float(row["activity_max"]), 3),
            "sstMean": round(float(row["sst_mean"]), 2),
            "chlorMean": round(float(row["chlor_mean"]), 3),
            "sampleCount": int(row["count"]),
            "isCustom": bool(row["is_custom"]),
        }
        for _, row in region_stats.iterrows()
    ]

    sample_df = df.sample(n=min(len(df), 400), random_state=42)
    scatter_payload = {
        "sst": sample_df["sst"].round(2).tolist(),
        "chlorophyll": sample_df["chlorophyll"].round(3).tolist(),
        "activity": sample_df["shark_activity"].round(3).tolist(),
        "region": sample_df["region"].tolist(),
        "isCustom": sample_df["is_custom"].tolist(),
    }

    threshold = np.percentile(df["shark_activity"], 80)
    hotspots_df = df[df["shark_activity"] > threshold].sort_values("shark_activity", ascending=False).head(10)
    hotspots = [
        {
            "region": row["region"],
            "date": row["date"].strftime("%Y-%m-%d"),
            "activity": round(float(row["shark_activity"]), 3),
            "sst": round(float(row["sst"]), 2),
            "chlorophyll": round(float(row["chlorophyll"]), 3),
        }
        for _, row in hotspots_df.iterrows()
    ]

    return {
        "generatedAt": pd.Timestamp.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ"),
        "formulas": FORMULA_CARDS,
        "regions": region_summary,
        "timeSeries": time_series,
        "scatter": scatter_payload,
        "hotspots": hotspots,
    }


def main() -> None:
    payload = build_payload()
    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT_PATH.write_text(json.dumps(payload, indent=2), encoding="utf-8")
    print(f"Shark model dashboard payload written to {OUTPUT_PATH}")


if __name__ == "__main__":
    main()
