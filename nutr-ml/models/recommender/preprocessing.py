import pandas as pd
import numpy as np
from sklearn.pipeline import Pipeline
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import StandardScaler, OrdinalEncoder
from sklearn.impute import SimpleImputer


CATEGORICAL_FEATURES = [
    "gender", "activity_level", "primary_condition", "goal_type", "primary_medication"
]

NUMERICAL_FEATURES = [
    "age", "weight_kg", "height_cm", "bmi",
    "avg_daily_calories", "avg_daily_protein", "avg_daily_carbs", "avg_daily_fat",
    "medication_count",
]

TARGET_COLUMNS = ["calorie_target", "protein_target", "carb_target", "fat_target"]


def build_preprocessor() -> ColumnTransformer:
    num_pipe = Pipeline([
        ("impute", SimpleImputer(strategy="median")),
        ("scale", StandardScaler()),
    ])
    cat_pipe = Pipeline([
        ("impute", SimpleImputer(strategy="most_frequent")),
        ("encode", OrdinalEncoder(handle_unknown="use_encoded_value", unknown_value=-1)),
    ])
    return ColumnTransformer([
        ("num", num_pipe, NUMERICAL_FEATURES),
        ("cat", cat_pipe, CATEGORICAL_FEATURES),
    ])


def load_dataset(csv_path: str) -> tuple[pd.DataFrame, pd.DataFrame]:
    df = pd.read_csv(csv_path)

    # Auto-compute BMI if missing
    if "bmi" not in df.columns or df["bmi"].isna().all():
        df["bmi"] = df["weight_kg"] / ((df["height_cm"] / 100) ** 2)

    # Auto-compute targets using WHO/FAO guidelines if missing
    for col in TARGET_COLUMNS:
        if col not in df.columns:
            df[col] = _estimate_target(df, col)

    X = df[NUMERICAL_FEATURES + CATEGORICAL_FEATURES].copy()
    y = df[TARGET_COLUMNS].copy()
    return X, y


def _estimate_target(df: pd.DataFrame, col: str) -> pd.Series:
    """Fallback target estimation using Harris-Benedict equations."""
    def row_estimate(r):
        gender = str(r.get("gender", "male")).lower()
        age    = float(r.get("age", 30))
        w      = float(r.get("weight_kg", 70))
        h      = float(r.get("height_cm", 170))
        goal   = str(r.get("goal_type", "maintenance")).lower()
        act    = str(r.get("activity_level", "sedentary")).lower()

        if gender == "female":
            bmr = 655.1 + 9.563 * w + 1.850 * h - 4.676 * age
        else:
            bmr = 66.47 + 13.75 * w + 5.003 * h - 6.755 * age

        act_map = {"sedentary": 1.2, "light": 1.375, "moderate": 1.55,
                   "active": 1.725, "very_active": 1.9}
        tdee = bmr * act_map.get(act, 1.2)

        if "loss" in goal:
            tdee *= 0.85
        elif "gain" in goal:
            tdee *= 1.15

        if col == "calorie_target":
            return round(tdee, 1)
        elif col == "protein_target":
            return round(w * 1.2, 1)
        elif col == "carb_target":
            return round(tdee * 0.45 / 4, 1)
        elif col == "fat_target":
            return round(tdee * 0.30 / 9, 1)
        return 0.0

    return df.apply(row_estimate, axis=1)
