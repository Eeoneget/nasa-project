#!/usr/bin/env python3
"""Training utilities for shark presence and feeding intensity models."""

from __future__ import annotations

import json
from dataclasses import dataclass
from pathlib import Path
from typing import Dict, List, Tuple

import joblib
import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.impute import SimpleImputer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import classification_report, roc_auc_score
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler

try:
    from sklearn.ensemble import GradientBoostingClassifier
except ImportError:  # pragma: no cover
    GradientBoostingClassifier = None


@dataclass
class ModelArtifacts:
    presence_model: Pipeline
    feeding_model: Pipeline
    presence_features: List[str]
    feeding_features: List[str]


def _build_presence_pipeline(feature_names: List[str], cfg: Dict) -> Pipeline:
    transformers = [("num", StandardScaler(), feature_names)]
    preprocessor = ColumnTransformer(transformers, remainder="drop")

    clf_params = cfg.get("logistic_regression", {})
    classifier = LogisticRegression(**clf_params)

    return Pipeline([
        ("preprocessor", preprocessor),
        ("imputer", SimpleImputer(strategy="median")),
        ("clf", classifier),
    ])


def _build_feeding_pipeline(feature_names: List[str], cfg: Dict) -> Pipeline:
    transformers = [("num", StandardScaler(), feature_names)]
    preprocessor = ColumnTransformer(transformers, remainder="drop")

    # Placeholder: reuse logistic regression but treat outputs as rate proxy.
    # Hackathon teams can swap in GLM or GBDT tailored to counts.
    clf_params = cfg.get("feeding_glm", {})
    alpha = clf_params.pop("alpha", 0.1)

    reg = LogisticRegression(C=1.0 / max(alpha, 1e-6), max_iter=1000)

    return Pipeline([
        ("preprocessor", preprocessor),
        ("imputer", SimpleImputer(strategy="median")),
        ("clf", reg),
    ])


def train_presence_model(df: pd.DataFrame, target: str, features: List[str], cfg: Dict) -> Tuple[Pipeline, Dict]:
    X = df[features]
    y = df[target].astype(int)
    test_size = cfg.get("test_size", 0.2)
    random_seed = cfg.get("random_seed", 42)

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=test_size, random_state=random_seed, stratify=y
    )

    pipeline = _build_presence_pipeline(features, cfg.get("logistic_regression", {}))
    pipeline.fit(X_train, y_train)

    y_prob = pipeline.predict_proba(X_test)[:, 1]
    y_pred = (y_prob >= 0.5).astype(int)

    report = classification_report(y_test, y_pred, output_dict=True)
    report["roc_auc"] = roc_auc_score(y_test, y_prob)

    if cfg.get("gradient_boosting", {}).get("enabled", False) and GradientBoostingClassifier:
        gbdt = GradientBoostingClassifier(**cfg["gradient_boosting"].get("params", {}))
        gbdt.fit(X_train, y_train)
        gbdt_auc = roc_auc_score(y_test, gbdt.predict_proba(X_test)[:, 1])
        report["gradient_boosting_auc"] = gbdt_auc

    return pipeline, report


def train_feeding_model(df: pd.DataFrame, target: str, features: List[str], cfg: Dict) -> Pipeline:
    pipeline = _build_feeding_pipeline(features, cfg)
    pipeline.fit(df[features], df[target])
    return pipeline


def save_artifacts(artifacts: ModelArtifacts, report: Dict, paths: Dict[str, str]) -> None:
    Path(paths["presence_model"]).parent.mkdir(parents=True, exist_ok=True)
    Path(paths["feeding_model"]).parent.mkdir(parents=True, exist_ok=True)

    joblib.dump(
        {
            "model": artifacts.presence_model,
            "features": artifacts.presence_features,
        },
        paths["presence_model"],
    )
    joblib.dump(
        {
            "model": artifacts.feeding_model,
            "features": artifacts.feeding_features,
        },
        paths["feeding_model"],
    )

    Path(paths["evaluation_report"]).parent.mkdir(parents=True, exist_ok=True)
    Path(paths["evaluation_report"]).write_text(json.dumps(report, indent=2), encoding="utf-8")


__all__ = [
    "ModelArtifacts",
    "train_presence_model",
    "train_feeding_model",
    "save_artifacts",
]
