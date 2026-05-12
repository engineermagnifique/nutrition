"""
Train the nutrition recommender model.
Usage:
    python models/recommender/train.py
    python models/recommender/train.py --data datasets/texts/nutrition_profiles.csv
"""
import argparse
import json
import os
import sys
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import GradientBoostingRegressor, RandomForestRegressor
from sklearn.model_selection import train_test_split
from sklearn.multioutput import MultiOutputRegressor
from sklearn.pipeline import Pipeline

sys.path.insert(0, str(Path(__file__).resolve().parents[2]))
from utils.common import load_config, set_seed, ensure_dir
from utils.metrics import regression_metrics
from models.recommender.preprocessing import (
    build_preprocessor, load_dataset, TARGET_COLUMNS
)


def build_pipeline(model_type: str = "gradient_boosting") -> Pipeline:
    preprocessor = build_preprocessor()

    if model_type == "gradient_boosting":
        base = GradientBoostingRegressor(
            n_estimators=200, max_depth=5, learning_rate=0.05,
            subsample=0.8, random_state=42
        )
    elif model_type == "random_forest":
        base = RandomForestRegressor(n_estimators=200, max_depth=10,
                                     min_samples_leaf=2, random_state=42)
    else:
        raise ValueError(f"Unknown model_type: {model_type}")

    regressor = MultiOutputRegressor(base, n_jobs=-1)
    return Pipeline([("preprocessor", preprocessor), ("model", regressor)])


def main(args):
    cfg = load_config(args.config)["recommender"]
    set_seed(42)

    csv_path = args.data or "datasets/texts/nutrition_profiles.csv"
    if not os.path.exists(csv_path):
        print(f"ERROR: Dataset not found at {csv_path}")
        print("Please add your CSV dataset first. See datasets/texts/README.txt")
        sys.exit(1)

    print(f"Loading dataset: {csv_path}")
    X, y = load_dataset(csv_path)
    print(f"  Rows: {len(X)}  |  Targets: {TARGET_COLUMNS}")

    X_train, X_val, y_train, y_val = train_test_split(
        X, y, test_size=cfg["test_size"], random_state=42
    )

    model_type = cfg.get("model_type", "gradient_boosting")
    print(f"Training {model_type} model...")
    pipeline = build_pipeline(model_type)
    pipeline.fit(X_train, y_train)

    y_pred = pipeline.predict(X_val)
    metrics = {}
    for i, col in enumerate(TARGET_COLUMNS):
        m = regression_metrics(y_val.iloc[:, i].values, y_pred[:, i])
        metrics[col] = m
        print(f"  {col}: MAE={m['mae']:.2f}  RMSE={m['rmse']:.2f}  R²={m['r2']:.4f}")

    ckpt_dir = cfg["checkpoint_dir"]
    ensure_dir(ckpt_dir)
    joblib.dump(pipeline, os.path.join(ckpt_dir, "model.pkl"))

    with open(os.path.join(ckpt_dir, "metrics.json"), "w") as f:
        json.dump(metrics, f, indent=2)

    print(f"\nModel saved to: {ckpt_dir}/model.pkl")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--config", default="config.yaml")
    parser.add_argument("--data",   default=None)
    main(parser.parse_args())
