#!/usr/bin/env python3
"""Command-line entry point for shark hotspot model training."""

from __future__ import annotations

import argparse
import json
import logging
from pathlib import Path
from typing import Dict

import pandas as pd
import yaml

from shark_models import ModelArtifacts, save_artifacts, train_feeding_model, train_presence_model

DEFAULT_CONFIG = "configs/model.yml"


def _load_config(path: str | Path) -> Dict:
    cfg_path = Path(path)
    if not cfg_path.exists():
        raise FileNotFoundError(f"Config not found: {cfg_path}")
    with cfg_path.open("r", encoding="utf-8") as stream:
        return yaml.safe_load(stream)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Train shark hotspot models")
    parser.add_argument(
        "--config",
        default=DEFAULT_CONFIG,
        help="Path to YAML configuration (default: %(default)s)",
    )
    parser.add_argument(
        "--features",
        required=True,
        help="Path to parquet/CSV file produced by feature_builder.py",
    )
    parser.add_argument(
        "--log-level",
        default="INFO",
        help="Logging level (DEBUG, INFO, WARNING, ...)",
    )
    return parser.parse_args()


def _load_features(path: str) -> pd.DataFrame:
    data_path = Path(path)
    if not data_path.exists():
        raise FileNotFoundError(f"Feature table not found: {data_path}")
    if data_path.suffix == ".parquet":
        return pd.read_parquet(data_path)
    if data_path.suffix in {".csv", ".txt"}:
        return pd.read_csv(data_path)
    raise ValueError(f"Unsupported feature file extension: {data_path.suffix}")


def main() -> None:
    args = parse_args()
    logging.basicConfig(level=args.log_level.upper(), format="%(levelname)s %(message)s")

    cfg = _load_config(args.config)
    df = _load_features(args.features)
    logger = logging.getLogger(__name__)

    presence_target = cfg["features"]["presence_target"]
    feeding_target = cfg["features"]["feeding_target"]
    predictors = cfg["features"]["predictors"]

    if presence_target not in df.columns:
        raise KeyError(f"Presence target '{presence_target}' missing from features")
    if feeding_target not in df.columns:
        raise KeyError(f"Feeding target '{feeding_target}' missing from features")

    common_predictors = [col for col in predictors if col in df.columns]
    if not common_predictors:
        raise ValueError("No predictor columns found in feature table")
    if len(common_predictors) < len(predictors):
        missing = sorted(set(predictors) - set(common_predictors))
        logger.warning("Ignoring missing predictors: %s", ", ".join(missing))

    presence_model, report = train_presence_model(
        df,
        presence_target,
        common_predictors,
        cfg["training"],
    )
    feeding_model = train_feeding_model(
        df,
        feeding_target,
        common_predictors,
        cfg["training"].get("feeding_glm", {}),
    )

    artifacts = ModelArtifacts(
        presence_model=presence_model,
        feeding_model=feeding_model,
        presence_features=common_predictors,
        feeding_features=common_predictors,
    )

    save_artifacts(artifacts, report, cfg["output"])
    logger.info("Training complete")


if __name__ == "__main__":
    main()
