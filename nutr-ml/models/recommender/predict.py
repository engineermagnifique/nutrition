"""
Nutrition recommendation inference.
Given a user's health profile, returns calorie/macro targets + diet notes.

    python models/recommender/predict.py --json '{"age":72,"gender":"female","weight_kg":58,"height_cm":158,"activity_level":"sedentary","primary_condition":"diabetes","goal_type":"disease_management","avg_daily_calories":1800,"avg_daily_protein":55,"avg_daily_carbs":210,"avg_daily_fat":60}'
"""
import argparse
import json
import os
import sys
from pathlib import Path
from typing import Union

import joblib
import numpy as np
import pandas as pd

sys.path.insert(0, str(Path(__file__).resolve().parents[2]))
from models.recommender.preprocessing import (
    NUMERICAL_FEATURES, CATEGORICAL_FEATURES, TARGET_COLUMNS
)

DIET_NOTES_TEMPLATE = {
    "diabetes": "Prioritize low-glycemic index foods. Limit simple sugars and refined carbs. "
                "Spread meals evenly throughout the day.",
    "hypertension": "Reduce sodium intake (< 2300 mg/day). Increase potassium-rich foods "
                    "(bananas, sweet potatoes, leafy greens).",
    "obesity": "Focus on high-fiber, low-calorie-density foods. Avoid sugary beverages.",
    "anemia": "Increase iron-rich foods (red meat, legumes, spinach). Pair with vitamin C sources.",
    "none": "Maintain a balanced diet with varied fruits, vegetables, whole grains, and lean protein.",
}


class NutritionRecommender:
    def __init__(self, model_dir: str = "saved_models/recommender"):
        model_path = os.path.join(model_dir, "model.pkl")
        if not os.path.exists(model_path):
            raise FileNotFoundError(f"No trained model at {model_path}. Run train.py first.")
        self.pipeline = joblib.load(model_path)

    def predict(self, profile: dict) -> dict:
        row = {f: profile.get(f, 0) for f in NUMERICAL_FEATURES}
        row.update({f: profile.get(f, "none") for f in CATEGORICAL_FEATURES})

        df = pd.DataFrame([row])
        preds = self.pipeline.predict(df)[0]

        result = {col: round(float(val), 1) for col, val in zip(TARGET_COLUMNS, preds)}
        condition = str(profile.get("primary_condition", "none")).lower()
        result["diet_notes"] = DIET_NOTES_TEMPLATE.get(condition, DIET_NOTES_TEMPLATE["none"])
        result["risk_level"] = _estimate_risk(profile)
        return result


def _estimate_risk(profile: dict) -> str:
    bmi = float(profile.get("bmi", 0)) or (
        float(profile.get("weight_kg", 70)) / ((float(profile.get("height_cm", 170)) / 100) ** 2)
    )
    condition = str(profile.get("primary_condition", "none")).lower()
    if condition in ("diabetes", "hypertension") or bmi > 35:
        return "high"
    elif bmi > 30 or condition != "none":
        return "medium"
    return "low"


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--json", required=True, help="JSON string of user profile")
    parser.add_argument("--model-dir", default="saved_models/recommender")
    args = parser.parse_args()

    profile = json.loads(args.json)
    rec = NutritionRecommender(args.model_dir)
    result = rec.predict(profile)
    print(json.dumps(result, indent=2))
