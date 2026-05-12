"""Quick quality check on the generated nutrition_profiles.csv."""
import sys
from pathlib import Path
import pandas as pd

path = "datasets/texts/nutrition_profiles.csv"
df = pd.read_csv(path)

print("Shape           :", df.shape)
print("Columns         :", list(df.columns))
print("Missing values  :\n", df.isnull().sum())
print()
print("Conditions:\n", df["primary_condition"].value_counts().to_string())
print()
print("Goal types:\n", df["goal_type"].value_counts().to_string())
print()
print("Activity levels:\n", df["activity_level"].value_counts().to_string())
print()
print("Target statistics:")
for col in ["calorie_target", "protein_target", "carb_target", "fat_target"]:
    s = df[col]
    print(f"  {col:22s}  min={s.min():6.1f}  mean={s.mean():6.1f}  max={s.max():6.1f}  std={s.std():5.1f}")
print()
print(f"Age range   : {df['age'].min()}-{df['age'].max()} yrs  (mean={df['age'].mean():.1f})")
print(f"BMI range   : {df['bmi'].min():.1f}-{df['bmi'].max():.1f}  (mean={df['bmi'].mean():.1f})")
print(f"Weight range: {df['weight_kg'].min():.1f}-{df['weight_kg'].max():.1f} kg")
print()
print("Sample rows:")
print(df.head(3).to_string())
