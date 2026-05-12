NUTRITION TEXT / TABULAR DATASET — EXPECTED FORMAT
====================================================

Place your text/CSV dataset here. Two supported formats:

────────────────────────────────────────────────────
OPTION A: Tabular CSV (for recommender model)
────────────────────────────────────────────────────
File: datasets/texts/nutrition_profiles.csv

Required columns:
  age              - integer (years)
  gender           - string (male/female/other)
  weight_kg        - float
  height_cm        - float
  bmi              - float (auto-computable: weight/(height/100)^2)
  activity_level   - string (sedentary/light/moderate/active/very_active)
  primary_condition- string (none/diabetes/hypertension/obesity/anemia/...)
  goal_type        - string (weight_loss/weight_gain/maintenance/disease_management)
  avg_daily_calories  - float (7-day average from meal logs)
  avg_daily_protein   - float
  avg_daily_carbs     - float
  avg_daily_fat       - float

Target columns (what the model predicts):
  calorie_target   - float (recommended daily calories)
  protein_target   - float (grams)
  carb_target      - float (grams)
  fat_target       - float (grams)
  diet_notes       - text (optional, for NLP augmentation)

────────────────────────────────────────────────────
OPTION B: Raw text / dietary guidelines (optional)
────────────────────────────────────────────────────
File: datasets/texts/dietary_guidelines.txt or .json

Used for enriching recommendation outputs with natural language notes.
Each line should be a nutrition guideline or diet tip.

────────────────────────────────────────────────────
FOOD NUTRITION DATABASE (optional enrichment)
────────────────────────────────────────────────────
File: datasets/texts/food_nutrition_db.csv

Columns: food_name, calories_per_100g, protein_g, carbs_g, fat_g, fiber_g
Used to validate/enrich the Django FoodItem database.
