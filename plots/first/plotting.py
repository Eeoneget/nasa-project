import json
from pathlib import Path

import xarray as xr
import numpy as np
import matplotlib.pyplot as plt

# === 1. Загружаем файлы ===
files = [
    "/content/pace_data/PACE_OCI.20250905T204743.L2.OC_AOP.V3_1.NRT.nc",
    "/content/pace_data/PACE_OCI.20250907T201930.L2.OC_AOP.V3_1.NRT.nc",
    "/content/pace_data/PACE_OCI.20250909T213432.L2.OC_AOP.V3_1.NRT.nc",
    "/content/pace_data/PACE_OCI.20250914T211303.L2.OC_AOP.V3_1.NRT.nc"
]

datasets = [xr.open_dataset(f, group="geophysical_data") for f in files]
nav_data = [xr.open_dataset(f, group="navigation_data") for f in files]

# === 2. Берём ключевые переменные ===
vars = ["nflh", "avw"]
data = [{v: ds[v].values for v in vars} for ds in datasets]

# === 3. Карты nflh и avw (сравнение 05 и 09 сентября) ===
fig, axs = plt.subplots(2, 2, figsize=(12, 10))
for i, v in enumerate(vars):
    im1 = axs[i, 0].imshow(data[0][v], cmap="viridis")
    axs[i, 0].set_title(f"{v} — 05 Sep")
    plt.colorbar(im1, ax=axs[i, 0])

    im2 = axs[i, 1].imshow(data[2][v], cmap="viridis")
    axs[i, 1].set_title(f"{v} — 09 Sep")
    plt.colorbar(im2, ax=axs[i, 1])

plt.tight_layout()
plt.savefig("plots_nflh_avw_comparison.png", dpi=300)  # сохранение
plt.show()

# === 3b. Отдельное сохранение каждой переменной ===
for i, v in enumerate(vars):
    for j, date in zip([0, 2], ["05Sep", "09Sep"]):
        plt.figure(figsize=(6, 5))
        plt.imshow(data[j][v], cmap="viridis")
        plt.title(f"{v} — {date}")
        plt.colorbar(label=v)
        plt.savefig(f"{v}_{date}.png", dpi=300)
        plt.close()

# === 4. Разница (heatmap Δnflh) ===
delta_nflh = data[2]["nflh"] - data[0]["nflh"]
plt.figure(figsize=(8, 6))
plt.imshow(delta_nflh, cmap="RdBu", vmin=-np.nanmax(abs(delta_nflh)), vmax=np.nanmax(abs(delta_nflh)))
plt.title("Δnflh (09 Sep - 05 Sep)")
plt.colorbar(label="Change in Chlorophyll Proxy")
plt.savefig("plot_delta_nflh.png", dpi=300)
plt.show()

# === 5. Усреднённые спектры (Rrs) ===
rrs_05 = xr.open_dataset(files[0], group="geophysical_data")["Rrs"].mean(axis=(0, 1))
rrs_09 = xr.open_dataset(files[2], group="geophysical_data")["Rrs"].mean(axis=(0, 1))

wavelengths = xr.open_dataset(files[0], group="sensor_band_parameters")["wavelength"]
wavelengths = wavelengths[: rrs_05.shape[0]]  # Match длину с Rrs

plt.figure(figsize=(10, 6))
plt.plot(wavelengths, rrs_05, label="05 Sep")
plt.plot(wavelengths, rrs_09, label="09 Sep")
plt.xlabel("Wavelength (nm)")
plt.ylabel("Rrs")
plt.title("Mean Water Reflectance Spectrum")
plt.legend()
plt.grid(True)
plt.savefig("plot_mean_rrs.png", dpi=300)
plt.show()

# === 6. Hotspots (топ-3 зоны роста nflh) ===
lat = nav_data[0]["latitude"].values
lon = nav_data[0]["longitude"].values

if lat.shape != delta_nflh.shape:
    lat = np.mean(lat, axis=1)
    lon = np.mean(lon, axis=1)

flat_idx = np.argpartition(delta_nflh.flatten(), -3)[-3:]
top_coords = [(lat.flat[i], lon.flat[i], delta_nflh.flat[i]) for i in flat_idx]

print("=== Hotspots роста фитопланктона (09-05 Sep) ===")
for i, (la, lo, val) in enumerate(top_coords, 1):
    print(f"{i}) Lat: {la:.3f}, Lon: {lo:.3f}, Δnflh: {val:.3f}")

# === 7. Экспорт данных для интерактивных графиков ===

def downsample_grid(arr: np.ndarray, step: int = 6) -> list[list[float | None]]:
    sample = arr[::step, ::step]
    return [[float(v) if np.isfinite(v) else None for v in row] for row in sample]


def normalize_line(arr: np.ndarray) -> list[float]:
    return [float(v) for v in arr]

try:
    step = 6
    grids = {
        "nflh_05Sep": {"data": downsample_grid(data[0]["nflh"], step), "xLabel": "Column", "yLabel": "Row"},
        "nflh_09Sep": {"data": downsample_grid(data[2]["nflh"], step), "xLabel": "Column", "yLabel": "Row"},
        "avw_05Sep": {"data": downsample_grid(data[0]["avw"], step), "xLabel": "Column", "yLabel": "Row"},
        "avw_09Sep": {"data": downsample_grid(data[2]["avw"], step), "xLabel": "Column", "yLabel": "Row"},
        "delta_from_pairs": {"data": downsample_grid(delta_nflh, step), "xLabel": "Column", "yLabel": "Row"},
    }

    # Добавляем OC4-прокси из второго набора, если PNG не открывается, этот блок можно дополнить позже
    oc4_early = xr.open_dataset(files[0], group="geophysical_data")["nflh"].values
    oc4_late = xr.open_dataset(files[3], group="geophysical_data")["nflh"].values
    grids["chlorophyll-2025-09-01AND2025-09-07"] = {
        "data": downsample_grid(oc4_early, step),
        "xLabel": "Column",
        "yLabel": "Row",
    }
    grids["chlorophyll-2025-09-08AND2025-09-14"] = {
        "data": downsample_grid(oc4_late, step),
        "xLabel": "Column",
        "yLabel": "Row",
    }

    rows, cols = delta_nflh.shape
    delta_flat = delta_nflh.flatten()
    sorted_idx = flat_idx[np.argsort(delta_flat[flat_idx])[::-1]]
    hotspots = []
    for rank, idx in enumerate(sorted_idx, 1):
        r = int(idx // cols)
        c = int(idx % cols)
        hotspots.append(
            {
                "rank": rank,
                "row": int(r // step),
                "col": int(c // step),
                "value": float(delta_flat[idx]),
            }
        )

    payload = {
        "grids": grids,
        "lines": {
            "rrs_mean": {
                "wavelength": normalize_line(wavelengths.values),
                "rrs05": normalize_line(rrs_05.values),
                "rrs09": normalize_line(rrs_09.values),
            }
        },
        "hotspots": hotspots,
    }

    out_path = Path(__file__).resolve().parents[2] / "src" / "data" / "pacePlotData.json"
    out_path.parent.mkdir(parents=True, exist_ok=True)
    with out_path.open("w", encoding="utf-8") as f:
        json.dump(payload, f)
    print(f"PACE plotly payload written to {out_path}")
except Exception as exc:  # pragma: no cover
    print(f"[WARN] Failed to export Plotly payload: {exc}")
