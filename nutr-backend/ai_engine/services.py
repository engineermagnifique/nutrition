import logging
from datetime import date, timedelta
from decimal import Decimal

import requests
from django.conf import settings
from django.db.models import Sum

logger = logging.getLogger('nutritionxai')

_ACTIVITY_MAP = {
    'sedentary':         'sedentary',
    'lightly_active':    'lightly_active',
    'moderately_active': 'moderately_active',
    'very_active':       'very_active',
    'extra_active':      'extra_active',
}

_ACTIVITY_MULTIPLIER = {
    'sedentary':         1.2,
    'lightly_active':    1.375,
    'moderately_active': 1.55,
    'very_active':       1.725,
    'extra_active':      1.9,
}

_CONDITION_FOODS = {
    'diabetes': {
        'breakfast': ['2 boiled eggs', 'Whole grain bread (1 slice)', 'Half an avocado', 'Unsweetened tea or black coffee'],
        'lunch':     ['Grilled chicken (150 g)', 'Lentil soup (1 cup)', 'Mixed vegetable salad', 'Brown rice (small portion — half cup)'],
        'dinner':    ['Baked fish (120 g)', 'Steamed broccoli and spinach', 'One small sweet potato'],
        'snacks':    ['A small handful of almonds', 'Cucumber slices with hummus'],
        'avoid':     ['White rice', 'White bread and pastries', 'Sugary drinks and juice', 'Sweets and candy', 'Fried snacks'],
    },
    'hypertension': {
        'breakfast': ['Oatmeal with banana and a drizzle of honey', 'Skimmed milk (1 glass)', 'Unsalted nuts (small handful)'],
        'lunch':     ['Grilled chicken breast (150 g)', 'Boiled sweet potato', 'Spinach salad with olive oil and lemon'],
        'dinner':    ['Baked salmon (120 g)', 'Steamed vegetables (broccoli, carrots, peas)', 'Half cup brown rice'],
        'snacks':    ['1 banana or apple', 'Unsalted sunflower seeds'],
        'avoid':     ['Extra table salt', 'Processed meats (sausages, bacon)', 'Canned soups and sauces', 'Fast food', 'Pickled and fermented foods'],
    },
    'obesity': {
        'breakfast': ['2 scrambled eggs', '1 slice whole grain toast', 'Sliced tomato and cucumber', 'Black coffee or green tea'],
        'lunch':     ['Large mixed salad with grilled chicken (120 g)', '1 tablespoon olive oil dressing', '1 apple'],
        'dinner':    ['Steamed fish (120 g)', 'Large portion of roasted vegetables', 'Half cup quinoa or lentils'],
        'snacks':    ['Celery or carrot sticks', '10–12 unsalted almonds'],
        'avoid':     ['Fried foods', 'Sugary drinks and store-bought juices', 'Fast food', 'Creamy sauces', 'Late-night snacks'],
    },
    'anemia': {
        'breakfast': ['Iron-fortified cereal with milk', 'A glass of orange juice (vitamin C helps absorb iron)', '1 boiled egg'],
        'lunch':     ['Lean red meat (100 g) or 1 cup cooked lentils', 'Spinach salad', 'Whole grain bread', 'Bell peppers (vitamin C)'],
        'dinner':    ['Grilled liver or kidney beans (1 cup)', 'Steamed broccoli', 'Brown rice (half cup)'],
        'snacks':    ['Dried apricots (small handful)', 'Pumpkin seeds'],
        'avoid':     ['Tea or coffee with meals (they block iron absorption)', 'Excessive dairy alongside iron-rich meals'],
    },
    'osteoporosis': {
        'breakfast': ['Low-fat yogurt with berries', 'Whole grain toast', 'A glass of fortified orange juice'],
        'lunch':     ['Canned salmon with bones (120 g)', 'Large green salad', 'Small portion of cheese'],
        'dinner':    ['Tofu stir-fry with broccoli and sesame seeds', 'A glass of milk or fortified plant milk'],
        'snacks':    ['Low-fat cheese on whole grain crackers', 'A small handful of almonds'],
        'avoid':     ['Excessive salt (leaches calcium from bones)', 'More than 2 coffees per day', 'Alcohol'],
    },
    'none': {
        'breakfast': ['Oatmeal with banana and a handful of berries', 'Low-fat milk or yogurt (1 cup)', '1 boiled egg'],
        'lunch':     ['Grilled chicken or fish (150 g)', 'Half cup brown rice', 'Mixed vegetable salad with olive oil'],
        'dinner':    ['Lean meat or beans (120 g)', 'Steamed vegetables', '1 slice whole grain bread'],
        'snacks':    ['1 fresh fruit (apple, orange, or banana)', 'Small handful of mixed nuts'],
        'avoid':     ['Processed and packaged foods', 'Sugary drinks', 'Fried foods', 'Excessive salt'],
    },
}

# Structured portions with exact quantities — used for "Recommended Foods with Quantities" section
_MEAL_PORTIONS = {
    'diabetes': {
        'breakfast': [
            {'food': 'Boiled eggs', 'quantity': '2 eggs', 'notes': 'High protein, zero carbs — keeps blood sugar stable'},
            {'food': 'Whole grain bread', 'quantity': '1 slice (30 g)', 'notes': 'Choose 100% whole wheat only'},
            {'food': 'Avocado', 'quantity': 'Half (60 g)', 'notes': 'Healthy fat — slows glucose release into blood'},
            {'food': 'Unsweetened tea or black coffee', 'quantity': '1 cup (250 ml)', 'notes': 'No sugar or sweeteners'},
        ],
        'lunch': [
            {'food': 'Grilled chicken breast', 'quantity': '150 g (palm-sized)', 'notes': 'Skinless — lean protein does not raise blood sugar'},
            {'food': 'Lentil soup', 'quantity': '1 cup (240 ml)', 'notes': 'Rich in fibre — slows carb absorption'},
            {'food': 'Mixed vegetable salad', 'quantity': '2 cups (loose)', 'notes': '1 tsp olive oil + lemon only, no sugary dressings'},
            {'food': 'Brown rice', 'quantity': 'Half cup cooked (90 g)', 'notes': 'Small portion only — do not exceed this'},
        ],
        'dinner': [
            {'food': 'Baked fish (tilapia, cod, or salmon)', 'quantity': '120 g', 'notes': 'Not fried — baked or steamed only'},
            {'food': 'Steamed broccoli and spinach', 'quantity': '1.5 cups mixed', 'notes': 'No butter or salt'},
            {'food': 'Sweet potato', 'quantity': '1 small (100 g)', 'notes': 'Baked, never fried — lower glycemic than white potato'},
        ],
        'snacks': [
            {'food': 'Almonds', 'quantity': 'Small handful (20 g, ~20 nuts)', 'notes': 'Unsalted — stabilises blood sugar between meals'},
            {'food': 'Cucumber with hummus', 'quantity': 'Half cucumber + 2 tbsp hummus', 'notes': 'Low-calorie and filling'},
        ],
        'avoid': ['White rice', 'White bread and pastries', 'Sugary drinks and juice', 'Sweets and candy', 'Fried snacks'],
    },
    'hypertension': {
        'breakfast': [
            {'food': 'Oatmeal', 'quantity': 'Half cup dry oats (40 g)', 'notes': 'Cook with water or unsweetened milk — no added salt'},
            {'food': 'Banana', 'quantity': '1 medium (120 g)', 'notes': 'Rich in potassium — actively lowers blood pressure'},
            {'food': 'Skimmed milk', 'quantity': '1 glass (200 ml)', 'notes': 'Calcium without saturated fat'},
            {'food': 'Unsalted nuts (walnuts or almonds)', 'quantity': 'Small handful (20 g)', 'notes': 'Heart-healthy fats, no added salt'},
        ],
        'lunch': [
            {'food': 'Grilled chicken breast', 'quantity': '150 g (palm-sized)', 'notes': 'No added salt — use herbs and lemon instead'},
            {'food': 'Boiled sweet potato', 'quantity': '1 medium (150 g)', 'notes': 'Potassium-rich, no butter'},
            {'food': 'Spinach salad', 'quantity': '2 cups fresh', 'notes': '1 tsp olive oil + lemon juice only'},
        ],
        'dinner': [
            {'food': 'Baked salmon', 'quantity': '120 g', 'notes': 'Omega-3 fatty acids support heart health and lower BP'},
            {'food': 'Steamed vegetables (broccoli, carrots, peas)', 'quantity': '1.5 cups mixed', 'notes': 'Zero added salt — use herbs'},
            {'food': 'Brown rice', 'quantity': 'Half cup cooked (90 g)', 'notes': 'Unsalted'},
        ],
        'snacks': [
            {'food': 'Banana or apple', 'quantity': '1 medium fruit', 'notes': 'Natural potassium source for blood pressure control'},
            {'food': 'Unsalted sunflower seeds', 'quantity': '2 tbsp (20 g)', 'notes': 'Magnesium helps control BP'},
        ],
        'avoid': ['Extra table salt', 'Processed meats (sausages, bacon)', 'Canned soups and sauces', 'Fast food', 'Pickled and fermented foods'],
    },
    'obesity': {
        'breakfast': [
            {'food': 'Scrambled eggs', 'quantity': '2 eggs', 'notes': 'Cooked in 1 tsp olive oil only — no butter'},
            {'food': 'Whole grain toast', 'quantity': '1 slice (30 g)', 'notes': 'No butter or spread'},
            {'food': 'Sliced tomato and cucumber', 'quantity': '1 cup mixed', 'notes': 'Eat freely — nearly zero calories'},
            {'food': 'Black coffee or green tea', 'quantity': '1 cup', 'notes': 'No sugar or milk'},
        ],
        'lunch': [
            {'food': 'Mixed salad', 'quantity': '2 cups (large plate)', 'notes': 'Fill half your plate with leaves and vegetables'},
            {'food': 'Grilled chicken', 'quantity': '120 g', 'notes': 'Skinless — lean protein keeps you full longer'},
            {'food': 'Olive oil dressing', 'quantity': '1 tablespoon (14 ml)', 'notes': 'Measure it — do not pour freely'},
            {'food': 'Apple', 'quantity': '1 medium (180 g)', 'notes': 'Natural sweetness, high fibre'},
        ],
        'dinner': [
            {'food': 'Steamed fish (tilapia, cod, or tuna)', 'quantity': '120 g', 'notes': 'Lean protein — not fried'},
            {'food': 'Roasted vegetables', 'quantity': '2 cups (large portion)', 'notes': '1 tsp olive oil, no salt'},
            {'food': 'Quinoa or cooked lentils', 'quantity': 'Half cup (90 g)', 'notes': 'High fibre — keeps you full until morning'},
        ],
        'snacks': [
            {'food': 'Celery or carrot sticks', 'quantity': '1 cup sticks', 'notes': 'Zero-guilt snack — eat freely'},
            {'food': 'Unsalted almonds', 'quantity': '10–12 nuts (15 g)', 'notes': 'Count them — do not eat from the bag'},
        ],
        'avoid': ['Fried foods', 'Sugary drinks and store-bought juices', 'Fast food', 'Creamy sauces', 'Late-night snacks'],
    },
    'anemia': {
        'breakfast': [
            {'food': 'Iron-fortified cereal', 'quantity': '1 cup (40–50 g)', 'notes': 'Check label — choose brand with high iron content'},
            {'food': 'Low-fat milk', 'quantity': '1 cup (200 ml)', 'notes': 'B12 and calcium; add to cereal'},
            {'food': 'Orange juice (freshly squeezed or 100% juice)', 'quantity': '1 small glass (150 ml)', 'notes': 'Vitamin C triples iron absorption — drink with cereal'},
            {'food': 'Boiled egg', 'quantity': '1 egg', 'notes': 'Additional iron and protein'},
        ],
        'lunch': [
            {'food': 'Lean red meat OR cooked lentils', 'quantity': '100 g meat OR 1 cup lentils (200 g cooked)', 'notes': 'Best plant and animal iron sources'},
            {'food': 'Spinach salad', 'quantity': '2 cups fresh', 'notes': 'High plant iron — always pair with vitamin C for absorption'},
            {'food': 'Bell peppers (any colour)', 'quantity': '1 medium (120 g)', 'notes': 'Extremely high vitamin C — boosts iron absorption significantly'},
            {'food': 'Whole grain bread', 'quantity': '1 slice (30 g)', 'notes': 'Additional iron'},
        ],
        'dinner': [
            {'food': 'Grilled liver OR kidney beans', 'quantity': '80 g liver OR 1 cup beans (200 g cooked)', 'notes': 'Liver is the single richest food source of iron'},
            {'food': 'Steamed broccoli', 'quantity': '1 cup florets', 'notes': 'Iron + vitamin C together in one vegetable'},
            {'food': 'Brown rice', 'quantity': 'Half cup cooked (90 g)', 'notes': 'Choose fortified brand where available'},
        ],
        'snacks': [
            {'food': 'Dried apricots', 'quantity': 'Small handful (30 g, ~6 pieces)', 'notes': 'Rich in plant iron — better than sweets'},
            {'food': 'Pumpkin seeds', 'quantity': '2 tablespoons (20 g)', 'notes': 'Good iron source — eat as a snack'},
        ],
        'avoid': ['Tea or coffee with meals (they block iron absorption)', 'Excessive dairy alongside iron-rich meals'],
    },
    'osteoporosis': {
        'breakfast': [
            {'food': 'Low-fat yogurt', 'quantity': '150 g (small pot)', 'notes': 'Your most calcium-rich breakfast food'},
            {'food': 'Mixed berries', 'quantity': 'Half cup (80 g)', 'notes': 'Add to yogurt — vitamin C supports bone collagen'},
            {'food': 'Whole grain toast', 'quantity': '1 slice (30 g)', 'notes': 'With fortified spread if available'},
            {'food': 'Fortified orange juice', 'quantity': '1 glass (200 ml)', 'notes': 'Vitamin D + calcium together — essential for bones'},
        ],
        'lunch': [
            {'food': 'Canned salmon with bones', 'quantity': '120 g', 'notes': 'The soft bones are edible and calcium-packed — eat them'},
            {'food': 'Large green salad', 'quantity': '2–3 cups mixed greens', 'notes': 'Dark greens (kale, spinach) have calcium + vitamin K for bones'},
            {'food': 'Cheese', 'quantity': '1 small piece (30 g, matchbox size)', 'notes': 'High calcium — portion controlled'},
        ],
        'dinner': [
            {'food': 'Firm tofu (calcium-set)', 'quantity': '150 g', 'notes': 'Excellent plant calcium — check label for calcium-set variety'},
            {'food': 'Broccoli with sesame seeds', 'quantity': '1 cup broccoli + 1 tbsp sesame seeds', 'notes': 'Calcium + vitamin K for bone strength'},
            {'food': 'Milk or fortified plant milk', 'quantity': '1 glass (200 ml)', 'notes': 'At dinner for overnight bone repair'},
        ],
        'snacks': [
            {'food': 'Low-fat cheese on whole grain crackers', 'quantity': '30 g cheese + 3–4 crackers', 'notes': 'Easy calcium boost between meals'},
            {'food': 'Almonds', 'quantity': 'Small handful (20 g, ~20 nuts)', 'notes': 'Calcium + healthy fats'},
        ],
        'avoid': ['Excessive salt (leaches calcium from bones)', 'More than 2 coffees per day', 'Alcohol'],
    },
    'none': {
        'breakfast': [
            {'food': 'Oatmeal', 'quantity': 'Half cup dry oats (40 g)', 'notes': 'Top with banana and berries for fibre and antioxidants'},
            {'food': 'Low-fat milk or yogurt', 'quantity': '1 cup (200 ml)', 'notes': 'Protein and calcium'},
            {'food': 'Boiled egg', 'quantity': '1 egg', 'notes': 'Quick protein to start the day'},
        ],
        'lunch': [
            {'food': 'Grilled chicken or fish', 'quantity': '150 g (palm-sized)', 'notes': 'Skinless, unseasoned except herbs — lean protein'},
            {'food': 'Brown rice', 'quantity': 'Half cup cooked (90 g)', 'notes': 'Whole grain for sustained energy throughout the afternoon'},
            {'food': 'Mixed vegetable salad', 'quantity': '2 cups', 'notes': '1 tsp olive oil and lemon — no creamy dressings'},
        ],
        'dinner': [
            {'food': 'Lean meat or beans', 'quantity': '120 g meat OR 1 cup beans', 'notes': 'Rotate proteins — variety is best'},
            {'food': 'Steamed vegetables', 'quantity': '1.5 cups mixed', 'notes': 'Colourful variety — aim for 3 different colours'},
            {'food': 'Whole grain bread', 'quantity': '1 slice (30 g)', 'notes': 'Or swap for a small brown rice portion'},
        ],
        'snacks': [
            {'food': 'Fresh fruit', 'quantity': '1 medium piece (apple, orange, or banana)', 'notes': 'Natural sugar + fibre — better than packaged snacks'},
            {'food': 'Mixed nuts', 'quantity': 'Small handful (20 g)', 'notes': 'Unsalted — healthy fats and protein'},
        ],
        'avoid': ['Processed and packaged foods', 'Sugary drinks', 'Fried foods', 'Excessive salt'],
    },
}

# Vegetarian swaps: maps keywords in food names to plant-based alternatives
_VEGETARIAN_PROTEIN_SWAPS = {
    'chicken': ('Grilled paneer or tofu', '150 g', 'Marinate in herbs/spices for flavour'),
    'fish':    ('Chickpea curry', '1 cup (200 g cooked)', 'High protein, rich in iron'),
    'salmon':  ('Lentil stew', '1 cup (200 g cooked)', 'Rich in protein and omega-3 from flaxseed add-on'),
    'liver':   ('Tempeh', '100 g', 'Fermented soy — rich in B12 and iron'),
    'meat':    ('Cooked lentils or kidney beans', '1 cup (200 g)', 'Excellent plant protein'),
    'prawn':   ('Edamame', '1 cup', 'Complete plant protein'),
}

_VEGAN_EXTRA_SWAPS = {
    'egg':    ('Chia seeds soaked in water', '2 tbsp chia + 6 tbsp water', 'Plant protein and omega-3'),
    'milk':   ('Unsweetened oat or soy milk', '1 cup (200 ml)', 'Fortified for calcium and B12'),
    'yogurt': ('Soy or coconut yogurt', '150 g', 'Choose calcium-fortified variety'),
    'cheese': ('Nutritional yeast', '2 tbsp', 'Cheesy flavour with B12 and protein'),
    'dairy':  ('Fortified plant milk', '1 cup', 'Choose calcium and B12 fortified'),
}


def _apply_dietary_filter(portions: list, dietary_type: str, disliked_foods: list) -> list:
    """Filter out disliked foods and apply vegetarian/vegan swaps to a portions list."""
    disliked_lower = [d.lower() for d in disliked_foods if d]
    result = []
    for item in portions:
        food_lower = item['food'].lower()
        # Skip disliked foods
        if any(d in food_lower for d in disliked_lower):
            continue
        # Apply dietary swaps
        swapped = False
        if dietary_type in ('vegetarian', 'vegan', 'halal', 'hindu_vegetarian'):
            for keyword, (replacement, qty, note) in _VEGETARIAN_PROTEIN_SWAPS.items():
                if keyword in food_lower and dietary_type in ('vegetarian', 'vegan', 'hindu_vegetarian'):
                    result.append({'food': replacement, 'quantity': qty, 'notes': note})
                    swapped = True
                    break
        if not swapped and dietary_type == 'vegan':
            for keyword, (replacement, qty, note) in _VEGAN_EXTRA_SWAPS.items():
                if keyword in food_lower:
                    result.append({'food': replacement, 'quantity': qty, 'notes': note})
                    swapped = True
                    break
        if not swapped:
            # For halal: add note about halal certification to meat items
            if dietary_type == 'halal' and any(w in food_lower for w in ('chicken', 'meat', 'beef', 'lamb')):
                result.append({**item, 'notes': item.get('notes', '') + ' — ensure halal certified'})
            else:
                result.append(item)
    return result


def _get_recommended_portions(condition: str, dietary_type: str, disliked_foods: list, targets: dict) -> dict:
    """Return meal portions filtered for dietary preferences, with per-meal calorie targets."""
    base = _MEAL_PORTIONS.get(condition, _MEAL_PORTIONS['none'])
    cal_splits = {'breakfast': 0.25, 'lunch': 0.35, 'dinner': 0.30, 'snacks': 0.10}
    result = {}
    for meal, share in cal_splits.items():
        raw_items = base.get(meal, [])
        filtered = _apply_dietary_filter(raw_items, dietary_type, disliked_foods)
        result[meal] = {
            'items': filtered,
            'target_kcal': round(targets['calories'] * share),
        }
    result['avoid'] = base.get('avoid', [])
    return result


_DRUG_INTERACTIONS = {
    'warfarin': {
        'warnings': [
            'Warfarin and vitamin K interact directly. Sudden changes in your intake of spinach, kale, or broccoli can make your blood thinner or thicker, which is dangerous.',
            'Keep your portions of leafy green vegetables consistent every day — do not suddenly start eating much more or less than usual.',
        ],
        'avoid': ['Sudden large portions of spinach, kale, or Swiss chard', 'Cranberry juice in large amounts', 'Grapefruit juice'],
        'include': ['Consistent daily portions of vegetables (same amount each day)', 'Garlic (in normal food amounts, not supplements)'],
        'tip': 'Do not change your vegetable intake drastically without telling your doctor. Consistency is more important than restriction.',
    },
    'metformin': {
        'warnings': [
            'Metformin reduces your body\'s ability to absorb vitamin B12 over time. Low B12 causes fatigue, weakness, and nerve problems — symptoms that are easy to mistake for diabetes getting worse.',
        ],
        'avoid': ['Excessive alcohol (increases risk of lactic acidosis, a serious side effect)'],
        'include': ['Eggs', 'Oily fish (salmon, sardines, mackerel)', 'Low-fat dairy', 'Fortified cereals — all rich in vitamin B12'],
        'tip': 'Ask your doctor or nurse to check your B12 level at your next blood test. You may need a B12 supplement.',
    },
    'lisinopril': {
        'warnings': [
            'Lisinopril (ACE inhibitor) raises potassium levels in your blood. Combined with too many potassium-rich foods or salt substitutes, this can cause dangerously high potassium.',
        ],
        'avoid': ['Potassium supplements unless prescribed', 'Salt substitutes labelled "low sodium" — they often contain high potassium', 'Excessive bananas, oranges, or avocados at one sitting'],
        'include': ['Normal balanced diet — moderate potassium from whole foods is fine', 'Plenty of water'],
        'tip': 'Normal food amounts of potassium-rich foods are usually safe. The danger is from supplements and salt substitutes.',
    },
    'furosemide': {
        'warnings': [
            'Furosemide (water tablet / diuretic) causes your body to lose potassium and magnesium in urine every day. Without replacing them, you can develop muscle cramps, weakness, and heart rhythm problems.',
        ],
        'avoid': ['High-salt foods (canned soups, processed meat, fast food, salty snacks)', 'Excessive alcohol'],
        'include': ['Bananas and avocado (potassium)', 'Sweet potato and spinach (potassium + magnesium)', 'Nuts and seeds (magnesium)', 'Dairy for calcium'],
        'tip': 'Eat a potassium-rich food at every meal unless your doctor has specifically told you to restrict potassium.',
    },
    'atorvastatin': {
        'warnings': [
            'Grapefruit juice blocks the enzyme that breaks down atorvastatin (your cholesterol tablet). This causes the medication to build up to unsafe levels in your blood.',
        ],
        'avoid': ['Grapefruit and grapefruit juice (even small amounts, every day)', 'Excessive alcohol'],
        'include': ['Oily fish (salmon, sardines, tuna — omega-3 supports heart health)', 'Oats and barley (beta-glucan lowers cholesterol naturally)', 'Nuts and olive oil (healthy fats)'],
        'tip': 'Choose orange, apple, or apple juice instead of grapefruit juice. A heart-healthy diet makes your statin work better.',
    },
    'amlodipine': {
        'warnings': [
            'Grapefruit juice interferes with how amlodipine is processed in your body, causing blood pressure medication levels to rise unpredictably.',
        ],
        'avoid': ['Grapefruit and grapefruit juice', 'Excessive alcohol (lowers blood pressure too much combined with this medication)'],
        'include': ['Low-sodium foods', 'Leafy green vegetables', 'Berries', 'Beetroot (supports blood pressure naturally)'],
        'tip': 'Stick to other fruits like oranges, apples, and bananas. Reducing salt still makes a significant difference even while on blood pressure medication.',
    },
    'iron supplement': {
        'warnings': [
            'Iron supplements are poorly absorbed when taken with tea, coffee, calcium, or dairy. You may be taking the tablets but getting very little benefit if these are consumed together.',
        ],
        'avoid': ['Tea or coffee within 1 hour before or after iron tablet', 'Dairy products (milk, cheese, yogurt) at the same time as iron', 'Calcium supplements taken at the same time'],
        'include': ['A small glass of orange juice or tomato juice when taking iron (vitamin C boosts iron absorption by up to 3×)', 'Iron-rich foods: lean red meat, lentils, spinach, tofu'],
        'tip': 'Take your iron tablet on an empty stomach or with vitamin C. Separate it by at least 2 hours from other medications, tea, or dairy.',
    },
    'levothyroxine': {
        'warnings': [
            'Several foods and nutrients block levothyroxine absorption. Taking it with the wrong foods at the wrong time means your thyroid medication may not work properly.',
        ],
        'avoid': ['Eating within 30–60 minutes of taking the tablet', 'Calcium-rich foods (milk, cheese, yogurt) within 4 hours', 'Soy products in large amounts', 'Walnuts and high-fiber foods right before/after the tablet'],
        'include': ['Take on an empty stomach first thing in the morning', 'Wait at least 30 minutes before breakfast — ideally 60 minutes'],
        'tip': 'Take this medication at the exact same time every morning and wait before eating. This single habit makes the biggest difference to thyroid control.',
    },
    'aspirin': {
        'warnings': [
            'Daily aspirin irritates the stomach lining over time. Taking it on an empty stomach worsens this and can cause ulcers or bleeding.',
        ],
        'avoid': ['Taking on an empty stomach', 'Excessive alcohol (both aspirin and alcohol irritate the stomach)', 'Vitamin E supplements in high doses (increases bleeding risk)'],
        'include': ['Foods that protect the stomach: yogurt with probiotics, oats, bananas, cooked vegetables', 'Vitamin C-rich foods (help protect the stomach lining)'],
        'tip': 'Always take aspirin with food or a full glass of milk. Tell your doctor immediately if you notice any stomach pain or dark stools.',
    },
}


def _normalize_medication(name: str) -> str:
    n = name.lower().strip()
    if 'warfarin' in n or 'coumadin' in n:
        return 'warfarin'
    if 'metformin' in n or 'glucophage' in n:
        return 'metformin'
    if 'lisinopril' in n or 'enalapril' in n or 'ramipril' in n or 'ace inhibitor' in n:
        return 'lisinopril'
    if 'furosemide' in n or 'lasix' in n or 'diuretic' in n or 'water tablet' in n:
        return 'furosemide'
    if 'atorvastatin' in n or 'simvastatin' in n or 'rosuvastatin' in n or 'statin' in n:
        return 'atorvastatin'
    if 'amlodipine' in n or 'nifedipine' in n or 'calcium channel' in n:
        return 'amlodipine'
    if 'iron' in n and ('tablet' in n or 'supplement' in n or 'sulfate' in n or 'sulphate' in n):
        return 'iron supplement'
    if 'levothyroxine' in n or 'thyroxine' in n or 'synthroid' in n:
        return 'levothyroxine'
    if 'aspirin' in n:
        return 'aspirin'
    return 'unknown'


def _normalize_condition(name: str) -> str:
    n = name.lower()
    if 'diabet' in n:
        return 'diabetes'
    if 'hypertens' in n or 'blood pressure' in n or 'high bp' in n:
        return 'hypertension'
    if 'obesi' in n or 'overweight' in n:
        return 'obesity'
    if 'anemia' in n or 'anaemia' in n:
        return 'anemia'
    if 'osteoporosis' in n or 'bone density' in n:
        return 'osteoporosis'
    return 'none'


def _bmi_category(bmi: float) -> str:
    if bmi < 18.5:
        return 'Underweight'
    if bmi < 25:
        return 'Normal weight'
    if bmi < 30:
        return 'Overweight'
    if bmi < 35:
        return 'Obese (Class I)'
    return 'Obese (Class II+)'


def _compute_tdee(age: int, gender: str, weight_kg: float, height_cm: float, activity_level: str) -> float:
    if gender == 'female':
        bmr = 10 * weight_kg + 6.25 * height_cm - 5 * age - 161
    else:
        bmr = 10 * weight_kg + 6.25 * height_cm - 5 * age + 5
    multiplier = _ACTIVITY_MULTIPLIER.get(activity_level, 1.2)
    return round(bmr * multiplier)


def _compute_targets(tdee: float, goal_type: str, bmi: float, weight_kg: float) -> dict:
    if goal_type == 'weight_loss' or bmi >= 27:
        calorie_target = tdee - 400
    elif goal_type in ('weight_gain', 'muscle_gain') or bmi < 18.5:
        calorie_target = tdee + 300
    elif goal_type == 'energy_improvement':
        calorie_target = tdee + 100  # slight surplus for energy
    elif goal_type == 'recovery_from_illness':
        calorie_target = tdee + 200  # needs extra nutrients to heal
    else:
        calorie_target = tdee

    calorie_target = max(1200, calorie_target)

    protein_g = round(weight_kg * 1.4)
    fat_g = round(calorie_target * 0.28 / 9)
    carb_g = round((calorie_target - protein_g * 4 - fat_g * 9) / 4)
    carb_g = max(100, carb_g)

    return {
        'calories': calorie_target,
        'protein': protein_g,
        'fat': fat_g,
        'carbs': carb_g,
    }


def _get_weight_trend(user) -> tuple:
    from health.models import HealthRecord
    records = list(
        HealthRecord.objects.filter(user=user).order_by('-recorded_at')[:10]
    )
    if len(records) < 2:
        return None, None
    records.reverse()
    first_weight = float(records[0].weight)
    last_weight = float(records[-1].weight)
    diff = last_weight - first_weight
    days = max((records[-1].recorded_at - records[0].recorded_at).days, 1)
    rate_per_month = (diff / days) * 30
    return diff, rate_per_month


def _build_plain_summary(bmi, goal_type, cal_gap, weight_diff, rate_per_month, condition, actual_cal, target_cal):
    parts = []

    if bmi < 18.5:
        parts.append("Your weight is lower than what is considered healthy for your height.")
    elif bmi < 25:
        parts.append("Your weight is in a healthy range for your height — well done!")
    elif bmi < 30:
        parts.append("Your weight is slightly above the healthy range for your height.")
    else:
        parts.append("Your weight is significantly above the healthy range and this is raising your health risks.")

    if weight_diff is not None:
        if abs(rate_per_month) < 0.2:
            parts.append("Your weight has been stable recently.")
        elif rate_per_month > 0:
            if bmi >= 25:
                parts.append(
                    f"You are gaining about {abs(rate_per_month):.1f} kg per month — "
                    "this trend is making things harder for your health."
                )
            else:
                parts.append(f"You are gaining about {abs(rate_per_month):.1f} kg per month.")
        else:
            if bmi >= 25:
                parts.append(
                    f"You are losing about {abs(rate_per_month):.1f} kg per month — "
                    "this is moving you in the right direction, keep going!"
                )
            else:
                parts.append(
                    f"You are losing about {abs(rate_per_month):.1f} kg per month. "
                    "Be careful not to lose too much too quickly."
                )

    if actual_cal > 0:
        if cal_gap > 250:
            parts.append(
                f"Based on your recent meals, you are eating about {abs(cal_gap):.0f} extra calories "
                f"per day more than your body needs (you average {actual_cal:.0f} kcal against a target of {target_cal:.0f} kcal)."
            )
        elif cal_gap < -250:
            parts.append(
                f"You are eating about {abs(cal_gap):.0f} fewer calories per day than your body needs, "
                "which can cause fatigue and muscle loss over time."
            )
        else:
            parts.append(
                f"Your calorie intake ({actual_cal:.0f} kcal/day) is close to your daily target of {target_cal:.0f} kcal — good balance!"
            )

    if condition == 'diabetes':
        parts.append(
            "Since you have diabetes, choosing foods that release energy slowly — like whole grains, legumes, and vegetables — "
            "is critical for keeping your blood sugar stable throughout the day."
        )
    elif condition == 'hypertension':
        parts.append(
            "With high blood pressure, reducing salt and eating more potassium-rich foods "
            "like bananas, sweet potatoes, and spinach can make a noticeable difference within weeks."
        )
    elif condition == 'anemia':
        parts.append(
            "Iron-rich foods like spinach, lentils, and lean meat will help your blood carry oxygen more effectively, "
            "reducing feelings of tiredness and weakness."
        )
    elif condition == 'osteoporosis':
        parts.append(
            "Getting enough calcium and vitamin D is essential for your bone strength. "
            "Dairy products, fortified foods, and some sunlight every day are your best allies."
        )

    return " ".join(parts)


def _build_trending(bmi, cal_gap, protein_gap, weight_diff, rate_per_month, condition):
    trending = []

    if weight_diff is not None:
        if abs(rate_per_month) < 0.2:
            trending.append({
                'label': 'Body Weight',
                'direction': 'stable',
                'value': 'Stable',
                'detail': 'Your weight has not changed much recently. Keep watching it.',
                'status': 'good',
            })
        elif rate_per_month > 0:
            trending.append({
                'label': 'Body Weight',
                'direction': 'up',
                'value': f'+{abs(rate_per_month):.1f} kg/month',
                'detail': f'You have gained {abs(weight_diff):.1f} kg overall. This needs attention.' if bmi >= 25 else f'You are gaining weight at a steady pace.',
                'status': 'danger' if bmi >= 30 else ('warning' if bmi >= 25 else 'caution'),
            })
        else:
            trending.append({
                'label': 'Body Weight',
                'direction': 'down',
                'value': f'{rate_per_month:.1f} kg/month',
                'detail': f'You are losing weight — positive trend!' if bmi >= 25 else 'You are losing weight. Make sure you are still eating enough.',
                'status': 'good' if bmi >= 25 else 'warning',
            })

    if cal_gap > 200:
        trending.append({
            'label': 'Daily Calories',
            'direction': 'over',
            'value': f'+{abs(cal_gap):.0f} kcal over target',
            'detail': 'You are eating more than your body needs each day. This excess turns into stored fat.',
            'status': 'warning' if cal_gap < 500 else 'danger',
        })
    elif cal_gap < -200:
        trending.append({
            'label': 'Daily Calories',
            'direction': 'low',
            'value': f'{abs(cal_gap):.0f} kcal below target',
            'detail': 'Not eating enough can drain energy and cause muscle loss. Your body needs fuel.',
            'status': 'warning',
        })
    else:
        trending.append({
            'label': 'Daily Calories',
            'direction': 'stable',
            'value': 'On target',
            'detail': 'Your calorie intake is well balanced with your daily needs.',
            'status': 'good',
        })

    if protein_gap < -15:
        trending.append({
            'label': 'Protein Intake',
            'direction': 'low',
            'value': f'{abs(protein_gap):.0f} g/day below target',
            'detail': 'Protein helps maintain muscle strength, repair tissue, and keep you feeling full.',
            'status': 'caution',
        })
    elif protein_gap > 20:
        trending.append({
            'label': 'Protein Intake',
            'direction': 'over',
            'value': f'+{protein_gap:.0f} g/day above target',
            'detail': 'Slightly high protein is usually fine, but balance with vegetables and whole grains.',
            'status': 'good',
        })
    else:
        trending.append({
            'label': 'Protein Intake',
            'direction': 'stable',
            'value': 'On target',
            'detail': 'Your protein intake is good. Keep including eggs, chicken, fish, or beans in meals.',
            'status': 'good',
        })

    if bmi < 18.5:
        trending.append({
            'label': 'BMI Status',
            'direction': 'low',
            'value': f'Underweight ({bmi:.1f})',
            'detail': 'Being underweight weakens immunity, bone density, and overall energy.',
            'status': 'warning',
        })
    elif bmi < 25:
        trending.append({
            'label': 'BMI Status',
            'direction': 'stable',
            'value': f'Healthy ({bmi:.1f})',
            'detail': 'Your BMI is in the healthy range. Maintain this with balanced meals and activity.',
            'status': 'good',
        })
    elif bmi < 30:
        trending.append({
            'label': 'BMI Status',
            'direction': 'up',
            'value': f'Overweight ({bmi:.1f})',
            'detail': 'A BMI above 25 increases risk of blood pressure problems, diabetes, and joint pain.',
            'status': 'warning',
        })
    else:
        trending.append({
            'label': 'BMI Status',
            'direction': 'up',
            'value': f'Obese ({bmi:.1f})',
            'detail': 'Obesity significantly raises the risk of heart disease, diabetes, and breathing problems.',
            'status': 'danger',
        })

    return trending


def _build_warnings(bmi, cal_gap, protein_gap, rate_per_month, condition):
    warnings = []

    if bmi >= 30:
        warnings.append(
            "Your BMI is in the obese range. Without changes, this significantly increases your risk of "
            "heart disease, type 2 diabetes, and joint damage. The good news: even losing 5–10% of your body weight creates noticeable health improvements."
        )
    elif bmi >= 25 and rate_per_month is not None and rate_per_month > 0.3:
        warnings.append(
            f"At your current rate of +{rate_per_month:.1f} kg/month, you could move into an obese BMI range "
            "within a few months. Acting now is much easier than reversing obesity later."
        )
    elif bmi < 18.5:
        warnings.append(
            "Being underweight puts stress on your immune system, weakens your bones, and can cause fatigue, "
            "hair loss, and slower wound healing. You need more nourishing food, especially protein and healthy fats."
        )

    if cal_gap > 300:
        months_to_gain = 5
        kg_gain = rate_per_month * months_to_gain if rate_per_month is not None else cal_gap * 30 / 7700
        warnings.append(
            f"Eating {abs(cal_gap):.0f} extra calories per day adds up quickly — "
            f"this surplus alone could result in about {abs(kg_gain):.1f} kg of weight gain over the coming months if nothing changes."
        )

    if protein_gap < -20:
        warnings.append(
            "Low protein intake means your muscles are not getting what they need to stay strong. "
            "Over time this leads to muscle weakness, slower metabolism, and a weaker immune system — "
            "especially important to avoid as you age."
        )

    if condition == 'diabetes':
        warnings.append(
            "With diabetes, eating high-carb or sugary foods causes repeated blood sugar spikes. "
            "Over months and years, these spikes damage blood vessels, leading to nerve damage, kidney problems, and vision loss."
        )
    elif condition == 'hypertension':
        warnings.append(
            "High blood pressure combined with a salty diet makes your heart work harder with every beat. "
            "This increases the risk of stroke and heart failure over time. "
            "Reducing salt by even a small amount measurably lowers blood pressure."
        )
    elif condition == 'anemia':
        warnings.append(
            "Without enough iron in your diet, your blood cannot carry enough oxygen to your organs and muscles. "
            "This causes persistent tiredness, difficulty concentrating, and a weakened immune system."
        )

    if not warnings:
        warnings.append(
            "Your current health profile looks generally balanced. "
            "Keep maintaining your habits, log meals regularly, and stay active. "
            "Regular monitoring helps catch small issues before they become problems."
        )

    return warnings


def _build_quick_actions(bmi, cal_gap, protein_gap, condition, weight_diff, rate_per_month):
    actions = []

    if cal_gap > 250:
        actions.append({
            'priority': 'high',
            'action': 'Reduce your dinner portion size by one-quarter',
            'why': f'Most people consume the most calories in the evening. This one change alone could cut ~{abs(cal_gap)*0.5:.0f} extra calories per day.',
        })
    elif cal_gap < -250:
        actions.append({
            'priority': 'high',
            'action': 'Add a nutritious snack between meals (nuts, yogurt, or fruit)',
            'why': 'You are not eating enough. Healthy snacks between meals help you reach your calorie target without overeating at main meals.',
        })

    if protein_gap < -15:
        actions.append({
            'priority': 'high',
            'action': 'Include protein in every meal — eggs, yogurt, chicken, fish, beans, or lentils',
            'why': f'You need about {abs(protein_gap):.0f} g more protein per day to protect your muscles, support recovery, and keep you satisfied longer.',
        })

    if condition == 'diabetes':
        actions.append({
            'priority': 'high',
            'action': 'Swap white rice and white bread for whole grain or brown rice versions',
            'why': 'Whole grains release sugar slowly into your blood, keeping glucose levels stable instead of causing spikes and crashes.',
        })
        actions.append({
            'priority': 'medium',
            'action': 'Never skip breakfast — have eggs or whole grain porridge within 1 hour of waking',
            'why': 'Skipping breakfast causes blood sugar fluctuations and leads to overeating later in the day.',
        })
    elif condition == 'hypertension':
        actions.append({
            'priority': 'high',
            'action': 'Stop adding extra salt to your food and avoid salty packaged snacks',
            'why': 'Reducing sodium intake can lower blood pressure by 2–8 mm Hg within weeks — as effective as some medications.',
        })
        actions.append({
            'priority': 'medium',
            'action': 'Eat one banana or serving of sweet potato daily',
            'why': 'These are rich in potassium, which helps counteract the effects of sodium and naturally lowers blood pressure.',
        })
    elif condition == 'anemia':
        actions.append({
            'priority': 'high',
            'action': 'Eat iron-rich food with a source of vitamin C at every meal',
            'why': 'Vitamin C (from orange juice, tomatoes, or bell peppers) dramatically increases how much iron your body absorbs from food.',
        })
        actions.append({
            'priority': 'medium',
            'action': 'Avoid tea or coffee for at least 1 hour before and after iron-rich meals',
            'why': 'Tea and coffee contain compounds that block iron absorption by up to 60%.',
        })
    elif condition == 'osteoporosis':
        actions.append({
            'priority': 'high',
            'action': 'Have a dairy product (milk, yogurt, or cheese) at two meals each day',
            'why': 'Calcium is the building block of bone. Most adults with osteoporosis do not get enough from their diet.',
        })

    if bmi >= 25:
        actions.append({
            'priority': 'medium',
            'action': 'Walk for 20–30 minutes after your largest meal each day',
            'why': 'Walking after eating burns calories, lowers blood sugar spikes, and improves digestion — a simple habit with big results.',
        })

    actions.append({
        'priority': 'low',
        'action': 'Drink 6–8 glasses of water spread throughout the day',
        'why': 'Proper hydration supports digestion, controls appetite, and keeps energy levels stable. Many people mistake thirst for hunger.',
    })

    actions.append({
        'priority': 'low',
        'action': 'Keep logging your meals and health records every week',
        'why': 'Consistent tracking helps the AI detect trends early and give you more accurate, personalized guidance over time.',
    })

    return actions[:6]


def _build_predictions(bmi, cal_gap, protein_gap, weight_diff, rate_per_month, condition, weight_kg, targets, actual_cal):
    predictions = []

    # --- Weight prediction ---
    if rate_per_month is not None:
        proj_30 = weight_kg + rate_per_month
        proj_90 = weight_kg + rate_per_month * 3

        if abs(rate_per_month) < 0.2:
            w_risk = 'low'
            w_desc = (
                f"Your weight appears stable. If your habits stay the same, you will likely weigh around {proj_30:.1f} kg in a month. "
                "This is a good sign — maintain your current routine."
            )
        elif rate_per_month > 0:
            w_risk = 'high' if (bmi >= 25 and rate_per_month > 0.8) else 'medium'
            w_desc = (
                f"Based on your recent trend, you may weigh around {proj_30:.1f} kg in 30 days "
                f"and roughly {proj_90:.1f} kg in 3 months if nothing changes. "
            )
            if bmi >= 25:
                w_desc += (
                    "This continued gain is moving you further from a healthy weight range. "
                    "Following the diet plan and quick actions below can reverse this trend."
                )
            else:
                w_desc += "Monitor this to make sure you are gaining weight in a healthy, controlled way."
        else:
            w_risk = 'low' if bmi >= 22 else 'medium'
            w_desc = (
                f"You are on a positive trend — you may reach {proj_30:.1f} kg in 30 days. "
            )
            if bmi >= 25:
                w_desc += "Keep going — you are moving toward a healthier weight. Celebrate small wins!"
            else:
                w_desc += (
                    "However, since your weight is already in the lower range, be careful not to lose too much. "
                    "Make sure you are still eating enough nutritious food daily."
                )

        predictions.append({
            'type': 'weight',
            'time_horizon': '30 days',
            'risk_level': w_risk,
            'confidence_score': 78.0,
            'predicted_value': round(proj_30, 2),
            'description': w_desc,
        })

    # --- Health risk prediction ---
    risk_score = 0
    risk_factors = []

    if bmi >= 30:
        risk_score += 3
        risk_factors.append('obesity')
    elif bmi >= 25:
        risk_score += 1
        risk_factors.append('being overweight')
    if bmi < 18.5:
        risk_score += 2
        risk_factors.append('being underweight')
    if condition in ('diabetes', 'hypertension'):
        risk_score += 2
        risk_factors.append(condition.replace('_', ' '))
    elif condition in ('anemia', 'osteoporosis'):
        risk_score += 1
        risk_factors.append(condition)
    if cal_gap > 400:
        risk_score += 1
        risk_factors.append('high calorie surplus')
    elif cal_gap < -400:
        risk_score += 1
        risk_factors.append('calorie deficit')
    if rate_per_month is not None and rate_per_month > 1.0:
        risk_score += 1
        risk_factors.append('rapid weight gain')

    if risk_score >= 5:
        h_risk = 'critical'
        h_desc = (
            f"Your health profile shows several risk factors at the same time: {', '.join(risk_factors)}. "
            "Together, these raise your chances of developing serious health problems significantly. "
            "We strongly recommend talking to a doctor or dietitian this week and starting the dietary changes shown below immediately."
        )
    elif risk_score >= 3:
        h_risk = 'high'
        h_desc = (
            f"Your current health indicators are showing elevated risk because of: {', '.join(risk_factors)}. "
            "These are clear warning signs. Follow the quick actions listed below and aim to improve your eating habits over the next 30 days. "
            "Small, consistent changes now prevent much bigger problems later."
        )
    elif risk_score >= 1:
        h_risk = 'medium'
        h_desc = (
            f"Your health is generally manageable, but there are areas to watch: "
            f"{', '.join(risk_factors) if risk_factors else 'minor nutritional imbalances'}. "
            "Small daily improvements — better food choices, staying hydrated, and staying active — will make a big difference over the coming months."
        )
    else:
        h_risk = 'low'
        h_desc = (
            "Your current health indicators look good! There are no major warning signs in your profile. "
            "Keep maintaining your balanced diet and active lifestyle. "
            "Continue logging your meals and health records so we can track your progress and catch anything early."
        )

    predictions.append({
        'type': 'health_risk',
        'time_horizon': '30 days',
        'risk_level': h_risk,
        'confidence_score': 82.0,
        'predicted_value': None,
        'description': h_desc,
    })

    # --- Nutrition prediction ---
    if actual_cal > 0:
        target_cal = targets['calories']
        if cal_gap > 200:
            n_risk = 'high' if cal_gap > 500 else 'medium'
            n_desc = (
                f"You have a daily calorie surplus of about {abs(cal_gap):.0f} kcal. "
                f"Your body needs around {target_cal:.0f} kcal per day, but you are averaging {actual_cal:.0f} kcal. "
                "The excess energy your body does not use gets stored as fat. "
                "Reducing portions at your largest meal and cutting out sugary drinks are the fastest ways to close this gap."
            )
        elif cal_gap < -200:
            n_risk = 'medium'
            n_desc = (
                f"You have a daily calorie shortage of about {abs(cal_gap):.0f} kcal. "
                f"Your body needs around {target_cal:.0f} kcal but you are only averaging {actual_cal:.0f} kcal. "
                "Not eating enough leads to fatigue, muscle loss, and a slower metabolism. "
                "Add more nutrient-dense foods like nuts, avocado, eggs, and whole grains to close this gap."
            )
        else:
            n_risk = 'low'
            n_desc = (
                f"Your calorie intake is well balanced — you are averaging {actual_cal:.0f} kcal/day "
                f"against a target of {target_cal:.0f} kcal. "
                "Good job! Focus on keeping this up and making sure your meals include a variety of colourful vegetables, "
                "quality protein, and whole grains."
            )

        predictions.append({
            'type': 'nutrition_deficit',
            'time_horizon': '7 days',
            'risk_level': n_risk,
            'confidence_score': 85.0,
            'predicted_value': None,
            'description': n_desc,
        })

    return predictions


def _build_alerts(bmi, cal_gap, rate_per_month, condition, overall_risk):
    alerts = []

    if overall_risk in ('high', 'critical'):
        alerts.append({
            'type': 'health_risk',
            'severity': overall_risk,
            'title': 'Health Profile Needs Immediate Attention',
            'message': (
                "Your latest AI analysis has detected elevated health risks. "
                "Please review your personalised recommendations and consider speaking with your care professional."
            ),
        })

    if rate_per_month is not None and rate_per_month > 1.0 and bmi >= 25:
        alerts.append({
            'type': 'abnormal_data',
            'severity': 'medium',
            'title': 'Rapid Weight Gain Detected',
            'message': (
                f"You are gaining approximately {rate_per_month:.1f} kg per month — "
                "faster than what is considered healthy. Adjusting your diet now will prevent this from becoming harder to reverse."
            ),
        })

    if cal_gap > 500:
        alerts.append({
            'type': 'abnormal_data',
            'severity': 'medium',
            'title': 'Calorie Intake Significantly Above Target',
            'message': (
                f"You are consuming about {abs(cal_gap):.0f} extra calories per day. "
                "This is consistently above your daily target and is likely contributing to weight gain."
            ),
        })

    return alerts


def _build_medication_section(medications: list) -> dict:
    """Return structured medication interaction data for the AI response."""
    if not medications:
        return {'interactions': [], 'general_notes': []}

    interactions = []
    general_notes = []

    for med in medications:
        key = _normalize_medication(med['medication_name'])
        info = _DRUG_INTERACTIONS.get(key)
        if info:
            interactions.append({
                'medication': med['medication_name'],
                'dosage': med.get('dosage', ''),
                'frequency': med.get('frequency', ''),
                'warnings': info['warnings'],
                'avoid': info['avoid'],
                'include': info['include'],
                'tip': info['tip'],
            })
        else:
            general_notes.append(
                f"Take {med['medication_name']} exactly as prescribed. "
                f"If it upsets your stomach, try taking it with a small amount of food unless your doctor says otherwise."
            )

    if medications:
        general_notes.insert(0,
            f"You are currently taking {len(medications)} medication(s). "
            "The food guidance below takes your medications into account. "
            "Always tell your doctor or pharmacist before making major changes to your diet."
        )

    return {'interactions': interactions, 'general_notes': general_notes}


def _build_user_payload(user) -> tuple:
    from health.models import HealthRecord, MedicalCondition, HealthGoal, Medication, UserPreferences
    from nutrition.models import MealLog

    latest_record = HealthRecord.objects.filter(user=user).order_by('-recorded_at').first()
    conditions = list(MedicalCondition.objects.filter(user=user).values(
        'condition_name', 'severity', 'diagnosis_date',
    ))
    goals = list(HealthGoal.objects.filter(user=user, is_active=True).values(
        'goal_type', 'target_weight', 'description',
    ))
    medications = list(Medication.objects.filter(user=user, is_current=True).values(
        'medication_name', 'dosage', 'frequency', 'purpose', 'with_food',
    ))
    try:
        prefs = UserPreferences.objects.get(user=user)
        preferences = {
            'dietary_type': prefs.dietary_type,
            'disliked_foods': prefs.disliked_foods or [],
            'favorite_foods': prefs.favorite_foods or [],
            'daily_lifestyle': prefs.daily_lifestyle,
        }
    except UserPreferences.DoesNotExist:
        preferences = {
            'dietary_type': 'none',
            'disliked_foods': [],
            'favorite_foods': [],
            'daily_lifestyle': 'office_worker',
        }

    seven_days_ago = date.today() - timedelta(days=7)
    recent_meals = MealLog.objects.filter(user=user, date__gte=seven_days_ago)
    meal_aggregate = recent_meals.aggregate(
        sum_calories=Sum('total_calories'),
        sum_protein=Sum('total_protein'),
        sum_carbs=Sum('total_carbohydrates'),
        sum_fat=Sum('total_fat'),
    )
    days = recent_meals.values('date').distinct().count() or 1

    payload = {
        'user': {
            'id': user.id,
            'full_name': user.full_name,
            'date_of_birth': str(user.date_of_birth) if user.date_of_birth else None,
            'gender': user.gender,
        },
        'health_record': None,
        'medical_conditions': [
            {**c, 'diagnosis_date': str(c['diagnosis_date'])} for c in conditions
        ],
        'health_goals': [
            {**g, 'target_weight': str(g['target_weight']) if g['target_weight'] else None}
            for g in goals
        ],
        'medications': medications,
        'preferences': preferences,
        'recent_nutrition': {
            'period_days': days,
            'avg_daily_calories': round((meal_aggregate['sum_calories'] or Decimal('0')) / days, 2),
            'avg_daily_protein': round((meal_aggregate['sum_protein'] or Decimal('0')) / days, 2),
            'avg_daily_carbs': round((meal_aggregate['sum_carbs'] or Decimal('0')) / days, 2),
            'avg_daily_fat': round((meal_aggregate['sum_fat'] or Decimal('0')) / days, 2),
        },
    }

    if latest_record:
        payload['health_record'] = {
            'weight': str(latest_record.weight),
            'height': str(latest_record.height),
            'bmi': str(latest_record.bmi),
            'activity_level': latest_record.activity_level,
            'recorded_at': str(latest_record.recorded_at),
        }

    return payload, latest_record


def _generate_rich_response(payload: dict, latest_record, user) -> dict:
    """Core AI brain: build a fully personalised, human-readable response."""
    from datetime import date as _date

    # --- Parse user profile ---
    user_data = payload.get('user', {})
    dob = user_data.get('date_of_birth')
    gender = (user_data.get('gender') or 'male').lower()
    name = user_data.get('full_name', 'there')

    try:
        birth = _date.fromisoformat(str(dob))
        age = max(1, (_date.today() - birth).days // 365)
    except (TypeError, ValueError):
        age = 70

    # --- Parse health record ---
    if not latest_record:
        return _no_health_record_response(name)

    weight_kg = float(latest_record.weight)
    height_cm = float(latest_record.height)
    bmi = float(latest_record.bmi)
    activity_level = latest_record.activity_level or 'sedentary'

    # --- Primary condition ---
    conditions = payload.get('medical_conditions', [])
    raw_condition = conditions[0]['condition_name'] if conditions else 'none'
    condition = _normalize_condition(raw_condition)

    # --- Medications ---
    medications = payload.get('medications', [])
    med_section = _build_medication_section(medications)

    # --- Preferences ---
    prefs = payload.get('preferences', {})
    dietary_type = prefs.get('dietary_type', 'none')
    disliked_foods = prefs.get('disliked_foods', [])
    daily_lifestyle = prefs.get('daily_lifestyle', 'office_worker')

    # --- Goal ---
    goals = payload.get('health_goals', [])
    goal_type = goals[0]['goal_type'] if goals else 'maintenance'
    if bmi >= 27 and goal_type not in ('weight_loss', 'disease_management', 'general_healthy_eating'):
        goal_type = 'weight_loss'
    elif bmi < 18.5 and goal_type not in ('weight_gain', 'recovery_from_illness'):
        goal_type = 'weight_gain'

    # --- TDEE and macro targets ---
    tdee = _compute_tdee(age, gender, weight_kg, height_cm, activity_level)
    targets = _compute_targets(tdee, goal_type, bmi, weight_kg)

    # --- Nutrition gaps ---
    nutrition = payload.get('recent_nutrition', {})
    actual_cal = float(nutrition.get('avg_daily_calories', 0))
    actual_protein = float(nutrition.get('avg_daily_protein', 0))
    cal_gap = actual_cal - targets['calories'] if actual_cal > 0 else 0
    protein_gap = actual_protein - targets['protein'] if actual_cal > 0 else 0

    # --- Weight trend from DB ---
    weight_diff, rate_per_month = _get_weight_trend(user)

    # --- Build all sections ---
    plain_summary = _build_plain_summary(
        bmi, goal_type, cal_gap, weight_diff, rate_per_month, condition, actual_cal, targets['calories']
    )
    trending = _build_trending(bmi, cal_gap, protein_gap, weight_diff, rate_per_month, condition)
    warnings = _build_warnings(bmi, cal_gap, protein_gap, rate_per_month, condition)
    quick_actions = _build_quick_actions(bmi, cal_gap, protein_gap, condition, weight_diff, rate_per_month)
    predictions = _build_predictions(bmi, cal_gap, protein_gap, weight_diff, rate_per_month, condition, weight_kg, targets, actual_cal)

    # Determine overall risk from predictions
    risk_order = {'low': 0, 'medium': 1, 'high': 2, 'critical': 3}
    overall_risk = max(
        (p['risk_level'] for p in predictions),
        key=lambda r: risk_order.get(r, 0),
        default='low',
    )

    alerts = _build_alerts(bmi, cal_gap, rate_per_month, condition, overall_risk)

    # --- Diet plan (simple food lists) ---
    foods = _CONDITION_FOODS.get(condition, _CONDITION_FOODS['none'])
    cal_splits = {'breakfast': 0.25, 'lunch': 0.35, 'dinner': 0.30, 'snacks': 0.10}
    diet_plan = {}
    for meal, share in cal_splits.items():
        kcal = round(targets['calories'] * share)
        diet_plan[meal] = {
            'foods': foods.get(meal, []),
            'target_kcal': kcal,
        }
    diet_plan['avoid'] = foods.get('avoid', [])

    # --- Recommended portions with exact quantities (preference-aware) ---
    recommended_portions = _get_recommended_portions(condition, dietary_type, disliked_foods, targets)

    food_portions = {
        'calories':      f"{targets['calories']} kcal/day",
        'protein':       f"{targets['protein']} g/day",
        'carbohydrates': f"{targets['carbs']} g/day",
        'fat':           f"{targets['fat']} g/day",
    }

    # Add lifestyle note to plain summary if relevant
    lifestyle_note = {
        'physical_labor': ' As someone doing physical work, your protein and calorie needs are higher — do not skip meals.',
        'retired':        ' As a retired person, staying active with light daily walks is especially important alongside eating well.',
        'active_outdoors': ' Your active lifestyle is a big asset — make sure you refuel properly after activity.',
    }.get(daily_lifestyle, '')
    if lifestyle_note:
        plain_summary = plain_summary.rstrip('.') + '.' + lifestyle_note

    # Add dietary note
    if dietary_type != 'none':
        diet_label = {
            'vegetarian': 'vegetarian', 'vegan': 'vegan', 'halal': 'halal',
            'kosher': 'kosher', 'hindu_vegetarian': 'Hindu vegetarian',
        }.get(dietary_type, dietary_type)
        recommended_portions['dietary_note'] = (
            f"Your food plan has been personalised for your {diet_label} diet. "
            f"Meat and fish items have been replaced with plant-based alternatives where applicable."
        ) if dietary_type in ('vegetarian', 'vegan', 'hindu_vegetarian') else (
            f"Your food plan follows {diet_label} dietary guidelines."
        )

    return {
        'recommendation': {
            'calorie_target': targets['calories'],
            'diet_plan': diet_plan,
            'food_portions': food_portions,
            'notes': plain_summary,
        },
        'predictions': predictions,
        'alerts': alerts,
        'plain_summary': plain_summary,
        'trending': trending,
        'warnings': warnings,
        'quick_actions': quick_actions,
        'medication_section': med_section,
        'recommended_portions': recommended_portions,
        'bmi': round(bmi, 1),
        'bmi_category': _bmi_category(bmi),
        'overall_risk': overall_risk,
        'calorie_target': targets['calories'],
        'condition': condition,
        'dietary_type': dietary_type,
    }


def _no_health_record_response(name: str) -> dict:
    summary = (
        "To give you personalised recommendations, we need your health information first. "
        "Please go to the Health Records section and add your weight, height, and activity level. "
        "Once you have done that, come back here and generate a new recommendation."
    )
    return {
        'recommendation': {
            'calorie_target': None,
            'diet_plan': {},
            'food_portions': {},
            'notes': summary,
        },
        'predictions': [],
        'alerts': [],
        'plain_summary': summary,
        'trending': [],
        'warnings': ['No health record found. Add your health data to receive personalised insights.'],
        'quick_actions': [
            {
                'priority': 'high',
                'action': 'Go to Health Records and log your weight, height, and activity level',
                'why': 'This data is needed to calculate your calorie needs and detect health trends.',
            }
        ],
        'bmi': None,
        'bmi_category': None,
        'overall_risk': 'low',
        'calorie_target': None,
        'condition': 'none',
    }


def _build_ml_payload(payload: dict, latest_record) -> dict | None:
    if not latest_record:
        return None

    from datetime import date as _date
    dob = payload['user'].get('date_of_birth')
    try:
        birth = _date.fromisoformat(str(dob))
        age = (_date.today() - birth).days // 365
    except (TypeError, ValueError):
        age = 70

    conditions = payload.get('medical_conditions', [])
    raw_condition = conditions[0]['condition_name'] if conditions else 'none'
    primary_condition = _normalize_condition(raw_condition)

    goals = payload.get('health_goals', [])
    goal_type = goals[0]['goal_type'] if goals else 'maintenance'

    activity_raw = latest_record.activity_level or 'sedentary'
    nutrition = payload.get('recent_nutrition', {})
    medications = payload.get('medications', [])
    primary_medication = _normalize_medication(medications[0]['medication_name']) if medications else 'none'

    return {
        'age':                float(age),
        'gender':             payload['user'].get('gender') or 'male',
        'weight_kg':          float(latest_record.weight),
        'height_cm':          float(latest_record.height),
        'bmi':                float(latest_record.bmi),
        'activity_level':     _ACTIVITY_MAP.get(activity_raw, 'sedentary'),
        'primary_condition':  primary_condition,
        'goal_type':          goal_type,
        'avg_daily_calories': float(nutrition.get('avg_daily_calories', 0)),
        'avg_daily_protein':  float(nutrition.get('avg_daily_protein', 0)),
        'avg_daily_carbs':    float(nutrition.get('avg_daily_carbs', 0)),
        'avg_daily_fat':      float(nutrition.get('avg_daily_fat', 0)),
        'primary_medication': primary_medication,
        'medication_count':   float(len(medications)),
    }


def _call_ai_engine(payload: dict, latest_record, user) -> dict:
    url = settings.AI_ENGINE_URL
    api_key = settings.AI_ENGINE_API_KEY
    timeout = settings.AI_ENGINE_TIMEOUT

    ml_payload = _build_ml_payload(payload, latest_record)
    if ml_payload:
        headers = {'Content-Type': 'application/json'}
        if api_key:
            headers['Authorization'] = f'Bearer {api_key}'
        try:
            resp = requests.post(url, json=ml_payload, headers=headers, timeout=timeout)
            resp.raise_for_status()
            ml_result = resp.json()
            logger.info('ML service responded successfully, merging with rich engine.')
            rich = _generate_rich_response(payload, latest_record, user)
            # Override calorie/macro targets with ML model values if available
            if ml_result.get('calorie_target'):
                rich['recommendation']['calorie_target'] = ml_result['calorie_target']
                rich['calorie_target'] = ml_result['calorie_target']
            return rich
        except requests.exceptions.ConnectionError:
            logger.warning('ML service unreachable, using rich rule-based response.')
        except requests.exceptions.Timeout:
            logger.error('ML service timed out, using rich rule-based response.')
        except requests.exceptions.HTTPError as e:
            logger.error('ML service HTTP error: %s — using rich rule-based response.', e)

    return _generate_rich_response(payload, latest_record, user)


def generate_recommendation(user) -> 'Recommendation':
    from .models import Recommendation, Prediction
    from alerts.models import Alert

    payload, latest_record = _build_user_payload(user)
    ai_response = _call_ai_engine(payload, latest_record, user)

    rec_data = ai_response.get('recommendation', {})
    recommendation = Recommendation.objects.create(
        user=user,
        health_record=latest_record,
        calorie_target=rec_data.get('calorie_target'),
        diet_plan=rec_data.get('diet_plan', {}),
        food_portions=rec_data.get('food_portions', {}),
        notes=rec_data.get('notes', ''),
        raw_response=ai_response,
    )

    Recommendation.objects.filter(user=user, is_active=True).exclude(pk=recommendation.pk).update(is_active=False)

    for pred_data in ai_response.get('predictions', []):
        Prediction.objects.create(
            user=user,
            prediction_type=pred_data.get('type', 'health_risk'),
            time_horizon=pred_data.get('time_horizon', '30 days'),
            predicted_value=pred_data.get('predicted_value'),
            risk_level=pred_data.get('risk_level', 'low'),
            confidence_score=pred_data.get('confidence_score', 0),
            description=pred_data.get('description', ''),
            raw_response=pred_data,
        )

    for alert_data in ai_response.get('alerts', []):
        Alert.objects.create(
            user=user,
            institution=user.institution,
            alert_type=alert_data.get('type', 'health_risk'),
            severity=alert_data.get('severity', 'medium'),
            title=alert_data.get('title', 'AI Alert'),
            message=alert_data.get('message', ''),
            triggered_by=f'recommendation:{recommendation.pk}',
        )

    logger.info('Recommendation generated for user %s: pk=%s', user.id, recommendation.pk)
    return recommendation


def generate_weekly_report(user) -> 'WeeklyReport':
    """Generate a plain-English weekly health report for a user."""
    from .models import WeeklyReport
    from health.models import HealthRecord, Medication
    from nutrition.models import MealLog

    today = date.today()
    week_end = today - timedelta(days=today.weekday() + 1)   # last Sunday
    week_start = week_end - timedelta(days=6)                 # previous Monday

    # Avoid duplicate report for same week
    report, created = WeeklyReport.objects.get_or_create(
        user=user, week_start=week_start,
        defaults={'week_end': week_end},
    )
    if not created:
        return report

    # --- Meal data for the week ---
    meals = MealLog.objects.filter(user=user, date__range=(week_start, week_end))
    agg = meals.aggregate(
        sum_cal=Sum('total_calories'),
        sum_protein=Sum('total_protein'),
    )
    days_logged = meals.values('date').distinct().count()
    total_cal = float(agg['sum_cal'] or 0)
    total_protein = float(agg['sum_protein'] or 0)
    avg_cal = round(total_cal / days_logged, 1) if days_logged else 0
    avg_protein = round(total_protein / days_logged, 1) if days_logged else 0

    # --- Health records ---
    records_this_week = HealthRecord.objects.filter(
        user=user, recorded_at__date__range=(week_start, week_end)
    ).order_by('recorded_at')
    latest_record = HealthRecord.objects.filter(user=user).order_by('-recorded_at').first()
    weight_start_rec = records_this_week.first()
    weight_end_rec   = records_this_week.last() or latest_record

    weight_start = float(weight_start_rec.weight) if weight_start_rec else None
    weight_end   = float(weight_end_rec.weight)   if weight_end_rec   else None
    bmi_end      = float(weight_end_rec.bmi)      if weight_end_rec   else None

    # --- Calorie target ---
    payload, _ = _build_user_payload(user)
    latest = HealthRecord.objects.filter(user=user).order_by('-recorded_at').first()
    from datetime import date as _date
    dob = payload['user'].get('date_of_birth')
    try:
        birth = _date.fromisoformat(str(dob))
        age = max(1, (_date.today() - birth).days // 365)
    except (TypeError, ValueError):
        age = 70
    gender = (payload['user'].get('gender') or 'male').lower()
    goal_type = payload['health_goals'][0]['goal_type'] if payload['health_goals'] else 'maintenance'
    conditions = payload.get('medical_conditions', [])
    condition = _normalize_condition(conditions[0]['condition_name'] if conditions else 'none')
    medications = payload.get('medications', [])

    calorie_target = None
    if latest:
        tdee = _compute_tdee(age, gender, float(latest.weight), float(latest.height), latest.activity_level or 'sedentary')
        targets = _compute_targets(tdee, goal_type, float(latest.bmi), float(latest.weight))
        calorie_target = targets['calories']

    adherence_pct = round(avg_cal / calorie_target * 100, 1) if (calorie_target and avg_cal > 0) else None

    # --- Build wins ---
    wins = []
    if days_logged >= 5:
        wins.append(f"You logged meals on {days_logged} out of 7 days this week — great consistency!")
    if adherence_pct and 85 <= adherence_pct <= 115:
        wins.append(f"Your calorie intake was close to target ({adherence_pct}% of goal) — excellent balance.")
    if weight_start and weight_end and weight_end < weight_start and bmi_end and bmi_end >= 18.5:
        wins.append(f"You lost {weight_start - weight_end:.1f} kg this week while staying in a safe weight range.")
    if avg_protein > 0 and calorie_target and avg_protein >= (float(latest.weight) * 1.2 if latest else 60):
        wins.append("Your protein intake was sufficient to protect muscle mass this week.")
    if not wins:
        wins.append("You are tracking your health — that's a meaningful first step. Keep going!")

    # --- Build improvements ---
    improvements = []
    if days_logged < 4:
        improvements.append(f"You only logged meals on {days_logged} days. Logging every day gives you (and us) a much clearer picture of your nutrition.")
    if adherence_pct and adherence_pct > 120:
        excess = round(avg_cal - calorie_target) if calorie_target else 0
        improvements.append(f"Your daily calorie intake was about {excess} kcal above your target. Try reducing your largest meal portion slightly next week.")
    elif adherence_pct and adherence_pct < 80:
        shortfall = round(calorie_target - avg_cal) if calorie_target else 0
        improvements.append(f"You ate about {shortfall} fewer calories per day than your body needs. Add a nutritious snack between meals to close this gap.")
    if weight_start and weight_end and weight_end > weight_start and bmi_end and bmi_end >= 25:
        improvements.append(f"Your weight increased by {weight_end - weight_start:.1f} kg this week. Review the meal plan and focus on the 'Do First' actions.")
    if avg_protein > 0 and latest and avg_protein < float(latest.weight) * 1.0:
        improvements.append("Your protein intake was lower than recommended. Include eggs, chicken, fish, yogurt, or lentils at every meal next week.")

    # --- Medication timing notes ---
    med_notes = []
    for med in medications:
        key = _normalize_medication(med['medication_name'])
        info = _DRUG_INTERACTIONS.get(key)
        if info:
            med_notes.append(f"{med['medication_name']}: {info['tip']}")

    # --- Next week goals ---
    next_goals = []
    if days_logged < 7:
        next_goals.append(f"Log meals on at least {min(days_logged + 2, 7)} days next week.")
    if adherence_pct and adherence_pct > 115:
        next_goals.append("Reduce dinner portion by one-quarter to bring calories closer to your target.")
    if condition == 'diabetes':
        next_goals.append("Replace one white-carb meal per day with a whole grain or legume option.")
    elif condition == 'hypertension':
        next_goals.append("Avoid adding salt to any meal this week — cook with herbs and lemon instead.")
    elif condition == 'anemia':
        next_goals.append("Eat an iron-rich food with a vitamin C source at every lunch and dinner.")
    next_goals.append("Log at least one health record (weight + height) so trends stay accurate.")

    # --- Plain summary ---
    parts = [f"This is your health summary for the week of {week_start.strftime('%B %d')} to {week_end.strftime('%B %d, %Y')}."]
    if days_logged > 0:
        parts.append(f"You logged meals on {days_logged} day(s), averaging {avg_cal:.0f} kcal per day" + (f" (your target is {calorie_target:.0f} kcal)" if calorie_target else "") + ".")
    if weight_start and weight_end:
        change = weight_end - weight_start
        direction = "gained" if change > 0 else "lost"
        parts.append(f"Your weight {'changed from' if abs(change) > 0.1 else 'remained stable at'} {weight_start:.1f} kg and you {direction} {abs(change):.1f} kg during the week.")
    if wins:
        parts.append(f"Well done: {wins[0].lower()}")
    if improvements:
        parts.append(f"One thing to improve: {improvements[0].lower()}")

    summary = " ".join(parts)

    # --- Overall score (0-100) ---
    score = 50
    if days_logged >= 5:  score += 15
    elif days_logged >= 3: score += 7
    if adherence_pct and 85 <= adherence_pct <= 115: score += 20
    elif adherence_pct and 70 <= adherence_pct <= 130: score += 10
    if latest and float(latest.bmi) < 25: score += 10
    elif latest and float(latest.bmi) < 30: score += 5
    if weight_start and weight_end and bmi_end and bmi_end >= 25 and weight_end < weight_start: score += 5
    score = min(100, max(0, score))

    report.days_logged      = days_logged
    report.avg_daily_calories = Decimal(str(avg_cal)) if avg_cal else None
    report.calorie_target   = Decimal(str(calorie_target)) if calorie_target else None
    report.avg_daily_protein = Decimal(str(avg_protein)) if avg_protein else None
    report.weight_start     = Decimal(str(weight_start)) if weight_start else None
    report.weight_end       = Decimal(str(weight_end))   if weight_end   else None
    report.bmi_end          = Decimal(str(bmi_end))      if bmi_end      else None
    report.overall_score    = score
    report.summary          = summary
    report.wins             = wins
    report.improvements     = improvements
    report.next_week_goals  = next_goals
    report.medication_notes = med_notes
    report.raw_data         = {
        'adherence_pct': adherence_pct,
        'week_start': str(week_start),
        'week_end': str(week_end),
        'condition': condition,
    }
    report.save()

    logger.info('Weekly report generated for user %s (score=%s)', user.id, score)
    return report


def update_predictions_for_user(user) -> list:
    from .models import Prediction

    payload, latest_record = _build_user_payload(user)
    ai_response = _call_ai_engine(payload, latest_record, user)

    created = []
    for pred_data in ai_response.get('predictions', []):
        p = Prediction.objects.create(
            user=user,
            prediction_type=pred_data.get('type', 'health_risk'),
            time_horizon=pred_data.get('time_horizon', '30 days'),
            predicted_value=pred_data.get('predicted_value'),
            risk_level=pred_data.get('risk_level', 'low'),
            confidence_score=pred_data.get('confidence_score', 0),
            description=pred_data.get('description', ''),
            raw_response=pred_data,
        )
        created.append(p)
    return created
