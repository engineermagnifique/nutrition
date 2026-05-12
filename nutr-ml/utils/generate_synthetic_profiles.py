"""
Synthetic nutrition profile generator for training the recommender model.

Strategy for accuracy:
  1. Demographics sampled from realistic elderly population distributions
  2. BMR via Mifflin-St Jeor (most validated for older adults)
  3. Targets computed from clinical guidelines per condition/goal
  4. Daily intake simulated using real USDA food combinations
  5. Gaussian noise added so the model learns generalizable patterns

Run:
    python utils/generate_synthetic_profiles.py
    python utils/generate_synthetic_profiles.py --n 8000 --out datasets/texts/nutrition_profiles.csv
"""

import argparse
import json
import math
import os
import random
import sys
from pathlib import Path

import numpy as np
import pandas as pd

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

# ─── Constants ───────────────────────────────────────────────────────────────

SEED = 42
N_SAMPLES = 5000

GENDERS         = ["male", "female"]
ACTIVITY_LEVELS = ["sedentary", "light", "moderate", "active"]
ACTIVITY_WEIGHTS = [0.40, 0.35, 0.18, 0.07]

CONDITIONS      = ["none", "diabetes", "hypertension", "obesity", "anemia", "osteoporosis"]
CONDITION_WEIGHTS = [0.20, 0.25, 0.30, 0.10, 0.08, 0.07]

GOAL_TYPES = ["maintenance", "weight_loss", "weight_gain", "disease_management", "muscle_gain"]

# Medications commonly used by elderly, with realistic prevalence
MEDICATIONS = [
    "none", "metformin", "lisinopril", "atorvastatin", "amlodipine",
    "furosemide", "aspirin", "levothyroxine", "warfarin", "iron supplement",
]
# Medication prevalence aligned with conditions:
# condition → likely medication
CONDITION_MEDICATION_MAP = {
    "diabetes":     ["metformin", "none", "aspirin"],
    "hypertension": ["lisinopril", "amlodipine", "furosemide", "none"],
    "obesity":      ["none", "aspirin", "metformin"],
    "anemia":       ["iron supplement", "none"],
    "osteoporosis": ["none", "levothyroxine"],
    "none":         ["none", "aspirin", "atorvastatin", "levothyroxine"],
}

# How medication count affects calorie adjustment (minor)
MEDICATION_CALORIE_ADJUST = {
    "metformin":      -50,   # Reduces appetite slightly
    "furosemide":     +30,   # Electrolyte loss increases needs
    "warfarin":         0,
    "levothyroxine":  +40,   # Thyroid affects metabolism
    "none":             0,
}

# Activity multipliers (Mifflin-St Jeor)
ACT_MULT = {
    "sedentary": 1.20,
    "light":     1.375,
    "moderate":  1.55,
    "active":    1.725,
}

NOISE_STD = 0.07   # ±7% Gaussian noise on all targets


# ─── USDA food parser ────────────────────────────────────────────────────────

def load_usda_foods(json_path: str) -> list[dict]:
    """Parse USDA FoundationFoods JSON → list of {name, kcal, protein_g, carbs_g, fat_g, fiber_g}."""
    with open(json_path, encoding="utf-8") as f:
        raw = json.load(f)

    top_key = list(raw.keys())[0]
    foods = raw[top_key]

    MACRO_MAP = {
        "kcal": ["Energy (Atwater General Factors)", "Energy"],
        "kJ":   ["Energy"],
        "protein": ["Protein"],
        "carbs":   ["Carbohydrate, by difference"],
        "fat":     ["Total lipid (fat)"],
        "fiber":   ["Fiber, total dietary"],
    }

    parsed = []
    for food in foods:
        if not food:
            continue

        nutrients = {
            n["nutrient"]["name"]: (n.get("amount") or n.get("median") or 0.0, n["nutrient"]["unitName"])
            for n in (food.get("foodNutrients") or [])
            if n and n.get("nutrient")
        }

        # Energy: prefer kcal entry; fall back to kJ / 4.184
        kcal = 0.0
        for name in ["Energy (Atwater General Factors)"]:
            if name in nutrients:
                val, unit = nutrients[name]
                kcal = val if "kcal" in unit.lower() else val / 4.184
                break
        if kcal == 0.0 and "Energy" in nutrients:
            val, unit = nutrients["Energy"]
            kcal = val if "kcal" in unit.lower() else val / 4.184

        def get_macro(keys):
            for k in keys:
                if k in nutrients:
                    return float(nutrients[k][0])
            return 0.0

        protein = get_macro(MACRO_MAP["protein"])
        carbs   = get_macro(MACRO_MAP["carbs"])
        fat     = get_macro(MACRO_MAP["fat"])
        fiber   = get_macro(MACRO_MAP["fiber"])

        if kcal > 0:
            parsed.append({
                "name":      food["description"],
                "kcal":      round(kcal, 2),
                "protein_g": round(protein, 2),
                "carbs_g":   round(carbs, 2),
                "fat_g":     round(fat, 2),
                "fiber_g":   round(fiber, 2),
            })

    print(f"  Parsed {len(parsed)} usable foods from USDA dataset")
    return parsed


# ─── Meal simulation ─────────────────────────────────────────────────────────

def simulate_7day_intake(usda_foods: list[dict], condition: str, rng: np.random.Generator) -> dict:
    """
    Simulate 7 days of meals by randomly combining USDA foods with
    realistic portion sizes. Returns average daily macros.
    """
    total = {"kcal": 0.0, "protein_g": 0.0, "carbs_g": 0.0, "fat_g": 0.0}

    # Condition-based food preference biases
    # For diabetes: prefer lower-carb foods; for obesity: prefer lower-cal foods
    if condition == "diabetes":
        pool = [f for f in usda_foods if f["carbs_g"] < 20] or usda_foods
    elif condition == "obesity":
        pool = [f for f in usda_foods if f["kcal"] < 150] or usda_foods
    else:
        pool = usda_foods

    for _ in range(7):
        # 3 meals + 1 snack per day
        n_items = rng.integers(6, 12)
        items = rng.choice(pool, size=n_items, replace=True)
        for item in items:
            portion = float(rng.uniform(80, 250))   # grams per serving
            scale = portion / 100.0
            total["kcal"]      += item["kcal"]      * scale
            total["protein_g"] += item["protein_g"] * scale
            total["carbs_g"]   += item["carbs_g"]   * scale
            total["fat_g"]     += item["fat_g"]      * scale

    return {k: round(v / 7, 1) for k, v in total.items()}


# ─── BMR / target calculation ─────────────────────────────────────────────────

def mifflin_bmr(weight_kg: float, height_cm: float, age: int, gender: str) -> float:
    """Mifflin-St Jeor equation (most validated for elderly)."""
    base = 10 * weight_kg + 6.25 * height_cm - 5 * age
    return base + 5 if gender == "male" else base - 161


def compute_targets(
    weight_kg: float,
    height_cm: float,
    age: int,
    gender: str,
    activity: str,
    condition: str,
    goal: str,
    rng: np.random.Generator,
) -> dict:
    """
    Evidence-based macro targets using:
    - Mifflin-St Jeor BMR
    - Activity multiplier
    - Condition-specific adjustments (clinical guidelines)
    - Goal adjustments
    - Elderly-specific protein needs (1.0–1.5 g/kg, higher due to sarcopenia risk)
    """
    bmr  = mifflin_bmr(weight_kg, height_cm, age, gender)
    tdee = bmr * ACT_MULT.get(activity, 1.2)

    # ── Goal adjustment ────────────────────────────────────────────────────
    if goal == "weight_loss":
        calorie_target = tdee * rng.uniform(0.80, 0.88)
    elif goal == "weight_gain":
        calorie_target = tdee * rng.uniform(1.10, 1.18)
    elif goal == "muscle_gain":
        calorie_target = tdee * rng.uniform(1.05, 1.15)
    else:
        calorie_target = tdee * rng.uniform(0.97, 1.03)

    # ── Condition-specific calorie adjustments ─────────────────────────────
    if condition == "obesity":
        calorie_target = min(calorie_target, tdee * 0.85)
    elif condition == "diabetes":
        calorie_target = tdee * rng.uniform(0.90, 1.00)

    # ── Protein: elderly need 1.0–1.5 g/kg (higher end for active/muscle goal) ──
    if goal == "muscle_gain":
        protein_per_kg = rng.uniform(1.3, 1.6)
    elif condition in ("osteoporosis", "anemia"):
        protein_per_kg = rng.uniform(1.1, 1.4)
    else:
        protein_per_kg = rng.uniform(1.0, 1.3)
    protein_target = weight_kg * protein_per_kg

    # ── Carbohydrates ──────────────────────────────────────────────────────
    # Diabetes: restrict to 130–160g/day (ADA low-carb threshold)
    # Others: 45–60% of calories
    if condition == "diabetes":
        carb_target = rng.uniform(110, 165)
    elif goal == "weight_loss":
        carb_target = (calorie_target * rng.uniform(0.40, 0.50)) / 4
    else:
        carb_target = (calorie_target * rng.uniform(0.45, 0.60)) / 4

    # ── Fat: fill remaining calories ──────────────────────────────────────
    calories_from_protein = protein_target * 4
    calories_from_carbs   = carb_target    * 4
    remaining_for_fat     = calorie_target - calories_from_protein - calories_from_carbs
    fat_target = max(remaining_for_fat / 9, calorie_target * 0.20 / 9)

    return {
        "calorie_target": round(calorie_target, 1),
        "protein_target": round(protein_target, 1),
        "carb_target":    round(carb_target, 1),
        "fat_target":     round(fat_target, 1),
    }


# ─── Demographics sampler ─────────────────────────────────────────────────────

def sample_person(rng: np.random.Generator, condition: str, goal: str) -> dict:
    """
    Sample realistic elderly demographics.
    Height/weight distributions based on WHO elderly population data.
    """
    gender = rng.choice(GENDERS)
    age    = int(rng.integers(60, 93))

    if gender == "male":
        height_cm = float(rng.normal(170, 7))
        # Weight depends on condition
        if condition == "obesity":
            bmi_target = rng.uniform(30, 40)
        elif condition == "anemia":
            bmi_target = rng.uniform(17, 22)
        else:
            bmi_target = rng.uniform(20, 29)
    else:
        height_cm = float(rng.normal(158, 7))
        if condition == "obesity":
            bmi_target = rng.uniform(30, 42)
        elif condition == "anemia":
            bmi_target = rng.uniform(16, 22)
        else:
            bmi_target = rng.uniform(19, 29)

    height_cm = max(145.0, min(195.0, height_cm))
    weight_kg = bmi_target * (height_cm / 100) ** 2
    weight_kg = max(35.0, min(130.0, weight_kg))
    bmi       = weight_kg / (height_cm / 100) ** 2

    return {
        "age":       age,
        "gender":    gender,
        "height_cm": round(height_cm, 1),
        "weight_kg": round(weight_kg, 1),
        "bmi":       round(bmi, 2),
    }


# ─── Main generator ───────────────────────────────────────────────────────────

def generate(n_samples: int, usda_path: str, out_path: str):
    rng = np.random.default_rng(SEED)
    random.seed(SEED)

    print(f"Loading USDA food data...")
    usda_foods = load_usda_foods(usda_path)

    rows = []
    print(f"Generating {n_samples} synthetic profiles...")

    for i in range(n_samples):
        condition  = rng.choice(CONDITIONS, p=CONDITION_WEIGHTS)
        activity   = rng.choice(ACTIVITY_LEVELS, p=ACTIVITY_WEIGHTS)

        # Goal probabilities shift with condition
        if condition in ("diabetes", "hypertension", "obesity"):
            goal_weights = [0.10, 0.30, 0.05, 0.50, 0.05]
        elif condition == "anemia":
            goal_weights = [0.20, 0.10, 0.30, 0.35, 0.05]
        else:
            goal_weights = [0.35, 0.25, 0.10, 0.15, 0.15]

        goal = rng.choice(GOAL_TYPES, p=goal_weights)

        person  = sample_person(rng, condition, goal)
        intake  = simulate_7day_intake(usda_foods, condition, rng)
        targets = compute_targets(
            person["weight_kg"], person["height_cm"],
            person["age"], person["gender"],
            activity, condition, goal, rng,
        )

        # Add Gaussian noise to targets so model learns patterns not formulas
        noisy_targets = {}
        for k, v in targets.items():
            noise  = float(rng.normal(1.0, NOISE_STD))
            noisy_targets[k] = round(max(v * noise, 5.0), 1)

        # --- Medication ---
        med_pool = CONDITION_MEDICATION_MAP.get(condition, ["none"])
        medication = rng.choice(med_pool)
        med_count = 0 if medication == "none" else int(rng.integers(1, 4))
        # Adjust calorie target slightly for medication
        med_cal_adj = MEDICATION_CALORIE_ADJUST.get(medication, 0)
        if med_cal_adj != 0:
            noisy_targets["calorie_target"] = max(
                1000.0, round(noisy_targets["calorie_target"] + med_cal_adj, 1)
            )

        row = {
            # Input features
            "age":                  person["age"],
            "gender":               person["gender"],
            "weight_kg":            person["weight_kg"],
            "height_cm":            person["height_cm"],
            "bmi":                  person["bmi"],
            "activity_level":       activity,
            "primary_condition":    condition,
            "goal_type":            goal,
            "avg_daily_calories":   intake["kcal"],
            "avg_daily_protein":    intake["protein_g"],
            "avg_daily_carbs":      intake["carbs_g"],
            "avg_daily_fat":        intake["fat_g"],
            "primary_medication":   medication,
            "medication_count":     med_count,
            # Targets (what the model learns to predict)
            **noisy_targets,
        }
        rows.append(row)

        if (i + 1) % 1000 == 0:
            print(f"  {i + 1}/{n_samples} profiles generated")

    df = pd.DataFrame(rows)

    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    df.to_csv(out_path, index=False)
    print(f"\nSaved {len(df)} rows to {out_path}")

    # ── Quality report ──────────────────────────────────────────────────────
    print("\n── Dataset Summary ────────────────────────────────────────────")
    print(f"Shape          : {df.shape}")
    print(f"\nConditions:\n{df['primary_condition'].value_counts().to_string()}")
    print(f"\nGoal types:\n{df['goal_type'].value_counts().to_string()}")
    print(f"\nActivity levels:\n{df['activity_level'].value_counts().to_string()}")
    print(f"\nTarget ranges:")
    for col in ["calorie_target", "protein_target", "carb_target", "fat_target"]:
        print(f"  {col:20s}: min={df[col].min():.1f}  mean={df[col].mean():.1f}  max={df[col].max():.1f}")
    print(f"\nAge range      : {df['age'].min()}–{df['age'].max()} yrs")
    print(f"BMI range      : {df['bmi'].min():.1f}–{df['bmi'].max():.1f}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--n",    type=int, default=N_SAMPLES, help="Number of samples")
    parser.add_argument("--usda", default="datasets/texts/food_nutrition_db.csv")
    parser.add_argument("--out",  default="datasets/texts/nutrition_profiles.csv")
    args = parser.parse_args()
    generate(args.n, args.usda, args.out)
