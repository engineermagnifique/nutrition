from django.core.management.base import BaseCommand
from nutrition.models import FoodItem


FOOD_ITEMS = [
    # grains
    {'name': 'White Rice (cooked)', 'calories_per_100g': 130, 'protein_per_100g': 2.7, 'carbohydrates_per_100g': 28.2, 'fat_per_100g': 0.3, 'fiber_per_100g': 0.4},
    {'name': 'Brown Rice (cooked)', 'calories_per_100g': 111, 'protein_per_100g': 2.6, 'carbohydrates_per_100g': 23.0, 'fat_per_100g': 0.9, 'fiber_per_100g': 1.8},
    {'name': 'Oatmeal (cooked)', 'calories_per_100g': 68, 'protein_per_100g': 2.5, 'carbohydrates_per_100g': 12.0, 'fat_per_100g': 1.4, 'fiber_per_100g': 1.7},
    {'name': 'Whole Wheat Bread', 'calories_per_100g': 247, 'protein_per_100g': 13.0, 'carbohydrates_per_100g': 41.0, 'fat_per_100g': 3.4, 'fiber_per_100g': 6.0},
    # proteins
    {'name': 'Chicken Breast (cooked)', 'calories_per_100g': 165, 'protein_per_100g': 31.0, 'carbohydrates_per_100g': 0.0, 'fat_per_100g': 3.6, 'fiber_per_100g': 0.0},
    {'name': 'Grilled Salmon', 'calories_per_100g': 208, 'protein_per_100g': 20.0, 'carbohydrates_per_100g': 0.0, 'fat_per_100g': 13.0, 'fiber_per_100g': 0.0},
    {'name': 'Whole Egg (boiled)', 'calories_per_100g': 155, 'protein_per_100g': 13.0, 'carbohydrates_per_100g': 1.1, 'fat_per_100g': 10.6, 'fiber_per_100g': 0.0},
    {'name': 'Lentils (cooked)', 'calories_per_100g': 116, 'protein_per_100g': 9.0, 'carbohydrates_per_100g': 20.0, 'fat_per_100g': 0.4, 'fiber_per_100g': 7.9},
    {'name': 'Tofu (firm)', 'calories_per_100g': 76, 'protein_per_100g': 8.1, 'carbohydrates_per_100g': 1.9, 'fat_per_100g': 4.8, 'fiber_per_100g': 0.3},
    # vegetables
    {'name': 'Broccoli (cooked)', 'calories_per_100g': 35, 'protein_per_100g': 2.4, 'carbohydrates_per_100g': 7.2, 'fat_per_100g': 0.4, 'fiber_per_100g': 3.3},
    {'name': 'Spinach (raw)', 'calories_per_100g': 23, 'protein_per_100g': 2.9, 'carbohydrates_per_100g': 3.6, 'fat_per_100g': 0.4, 'fiber_per_100g': 2.2},
    {'name': 'Sweet Potato (baked)', 'calories_per_100g': 90, 'protein_per_100g': 2.0, 'carbohydrates_per_100g': 20.7, 'fat_per_100g': 0.1, 'fiber_per_100g': 3.3},
    {'name': 'Carrot (raw)', 'calories_per_100g': 41, 'protein_per_100g': 0.9, 'carbohydrates_per_100g': 9.6, 'fat_per_100g': 0.2, 'fiber_per_100g': 2.8},
    {'name': 'Tomato (raw)', 'calories_per_100g': 18, 'protein_per_100g': 0.9, 'carbohydrates_per_100g': 3.9, 'fat_per_100g': 0.2, 'fiber_per_100g': 1.2},
    # fruits
    {'name': 'Banana', 'calories_per_100g': 89, 'protein_per_100g': 1.1, 'carbohydrates_per_100g': 23.0, 'fat_per_100g': 0.3, 'fiber_per_100g': 2.6},
    {'name': 'Apple', 'calories_per_100g': 52, 'protein_per_100g': 0.3, 'carbohydrates_per_100g': 14.0, 'fat_per_100g': 0.2, 'fiber_per_100g': 2.4},
    {'name': 'Orange', 'calories_per_100g': 47, 'protein_per_100g': 0.9, 'carbohydrates_per_100g': 12.0, 'fat_per_100g': 0.1, 'fiber_per_100g': 2.4},
    # dairy
    {'name': 'Low-fat Yogurt', 'calories_per_100g': 56, 'protein_per_100g': 5.7, 'carbohydrates_per_100g': 6.8, 'fat_per_100g': 0.6, 'fiber_per_100g': 0.0},
    {'name': 'Whole Milk', 'calories_per_100g': 61, 'protein_per_100g': 3.2, 'carbohydrates_per_100g': 4.8, 'fat_per_100g': 3.3, 'fiber_per_100g': 0.0},
    # nuts
    {'name': 'Almonds', 'calories_per_100g': 579, 'protein_per_100g': 21.2, 'carbohydrates_per_100g': 21.6, 'fat_per_100g': 49.9, 'fiber_per_100g': 12.5},
    {'name': 'Walnuts', 'calories_per_100g': 654, 'protein_per_100g': 15.2, 'carbohydrates_per_100g': 13.7, 'fat_per_100g': 65.2, 'fiber_per_100g': 6.7},
]


class Command(BaseCommand):
    help = 'Seed the database with common food items'

    def handle(self, *args, **options):
        created = 0
        for item in FOOD_ITEMS:
            _, was_created = FoodItem.objects.get_or_create(name=item['name'], defaults=item)
            if was_created:
                created += 1
        self.stdout.write(self.style.SUCCESS(f'Seeded {created} food items ({len(FOOD_ITEMS) - created} already existed).'))
