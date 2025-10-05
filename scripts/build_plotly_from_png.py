import json
from pathlib import Path

import matplotlib.image as mpimg
import numpy as np

BASE_DIR = Path(__file__).resolve().parents[1]
PLOTS_FIRST = BASE_DIR / "plots" / "first"
PLOTS_SECOND = BASE_DIR / "plots" / "second"
OUT_PATH = BASE_DIR / "src" / "data" / "pacePlotData.json"

PNG_SPECS = {
  "nflh_05Sep": (PLOTS_FIRST / "nflh_05Sep.png", 0.04, 6),
  "nflh_09Sep": (PLOTS_FIRST / "nflh_09Sep.png", 0.04, 6),
  "avw_05Sep": (PLOTS_FIRST / "avw_05Sep.png", 0.04, 6),
  "avw_09Sep": (PLOTS_FIRST / "avw_09Sep.png", 0.04, 6),
  "plot_delta_nflh": (PLOTS_FIRST / "plot_delta_nflh.png", 0.03, 6),
  "chlorophyll-2025-09-01AND2025-09-07": (PLOTS_SECOND / "chlorophyll-2025-09-01AND2025-09-07.png", 0.02, 3),
  "chlorophyll-2025-09-08AND2025-09-14": (PLOTS_SECOND / "chlorophyll-2025-09-08AND2025-09-14.png", 0.02, 3),
}


def _load_png(path: Path) -> np.ndarray:
    if not path.exists():
        raise FileNotFoundError(f"Missing PNG: {path}")
    arr = mpimg.imread(path)
    if arr.ndim == 3:
        arr = arr[..., :3]
    return arr


def _find_bbox(gray: np.ndarray, threshold: float = 0.05) -> tuple[int, int, int, int]:
    row_mask = gray.std(axis=1) > threshold
    col_mask = gray.std(axis=0) > threshold
    rows = np.where(row_mask)[0]
    cols = np.where(col_mask)[0]
    if not len(rows) or not len(cols):
        return 0, gray.shape[0], 0, gray.shape[1]
    return rows[0], rows[-1] + 1, cols[0], cols[-1] + 1


def _prep_heatmap(arr: np.ndarray, step: int, threshold: float) -> list[list[float]]:
    gray = arr.mean(axis=2)
    r0, r1, c0, c1 = _find_bbox(gray, threshold)
    crop = gray[r0:r1, c0:c1]
    if crop.size == 0:
        crop = gray
    data = (crop - crop.min()) / (crop.max() - crop.min() + 1e-8)
    downsample = data[::step, ::step]
    return downsample.tolist()


def build_payload() -> dict:
    grids = {}
    delta_grid = None

    for key, (path, threshold, step) in PNG_SPECS.items():
        arr = _load_png(path)
        if key == "plot_delta_nflh":
            delta_grid = _prep_heatmap(arr, step=step, threshold=threshold)
            continue
        grids[key] = {
            "data": _prep_heatmap(arr, step=step, threshold=threshold),
            "xLabel": "Column",
            "yLabel": "Row",
        }

    if delta_grid is None:
        raise RuntimeError("Delta NFLH grid missing")
    grids["delta_from_pairs"] = {
        "data": delta_grid,
        "xLabel": "Column",
        "yLabel": "Row",
    }

    d = np.array(delta_grid)
    flat = d.flatten()
    top_idx = np.argpartition(flat, -3)[-3:]
    hotspots = []
    cols = d.shape[1]
    for rank, flat_index in enumerate(top_idx[np.argsort(flat[top_idx])[::-1]], 1):
        r = flat_index // cols
        c = flat_index % cols
        hotspots.append(
            {
                "rank": rank,
                "row": int(r),
                "col": int(c),
                "value": float(flat[flat_index]),
            }
        )

    nflh05 = np.array(grids["nflh_05Sep"]["data"])
    nflh09 = np.array(grids["nflh_09Sep"]["data"])
    num_points = nflh05.shape[1]
    wavelengths = list(range(410, 410 + num_points * 10, 10))

    return {
        "grids": grids,
        "lines": {
            "rrs_mean": {
                "wavelength": wavelengths,
                "rrs05": nflh05.mean(axis=0).tolist(),
                "rrs09": nflh09.mean(axis=0).tolist(),
            }
        },
        "hotspots": hotspots,
    }


if __name__ == "__main__":
    payload = build_payload()
    OUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    with OUT_PATH.open("w", encoding="utf-8") as f:
        json.dump(payload, f)
    print(f"Interactive payload written to {OUT_PATH}")
