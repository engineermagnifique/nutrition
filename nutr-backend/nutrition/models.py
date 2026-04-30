from decimal import Decimal
from django.db import models
from django.db.models import Sum


class FoodItem(models.Model):
    name = models.CharField(max_length=255, unique=True)
    calories_per_100g = models.DecimalField(max_digits=7, decimal_places=2)
    protein_per_100g = models.DecimalField(max_digits=6, decimal_places=2)
    carbohydrates_per_100g = models.DecimalField(max_digits=6, decimal_places=2)
    fat_per_100g = models.DecimalField(max_digits=6, decimal_places=2)
    fiber_per_100g = models.DecimalField(max_digits=6, decimal_places=2, default=0)
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'food_items'
        ordering = ['name']

    def __str__(self):
        return self.name


class MealLog(models.Model):
    MEAL_BREAKFAST = 'breakfast'
    MEAL_LUNCH = 'lunch'
    MEAL_DINNER = 'dinner'
    MEAL_SNACK = 'snack'
    MEAL_CHOICES = [
        (MEAL_BREAKFAST, 'Breakfast'),
        (MEAL_LUNCH, 'Lunch'),
        (MEAL_DINNER, 'Dinner'),
        (MEAL_SNACK, 'Snack'),
    ]

    user = models.ForeignKey('accounts.UserProfile', on_delete=models.CASCADE, related_name='meal_logs')
    meal_type = models.CharField(max_length=15, choices=MEAL_CHOICES)
    date = models.DateField()
    total_calories = models.DecimalField(max_digits=8, decimal_places=2, default=0)
    total_protein = models.DecimalField(max_digits=7, decimal_places=2, default=0)
    total_carbohydrates = models.DecimalField(max_digits=7, decimal_places=2, default=0)
    total_fat = models.DecimalField(max_digits=7, decimal_places=2, default=0)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'meal_logs'
        ordering = ['-date', 'meal_type']
        unique_together = [('user', 'meal_type', 'date')]

    def update_aggregates(self):
        agg = self.items.aggregate(
            tc=Sum('calories'),
            tp=Sum('protein'),
            tch=Sum('carbohydrates'),
            tf=Sum('fat'),
        )
        self.total_calories = agg['tc'] or Decimal('0')
        self.total_protein = agg['tp'] or Decimal('0')
        self.total_carbohydrates = agg['tch'] or Decimal('0')
        self.total_fat = agg['tf'] or Decimal('0')
        self.save(update_fields=['total_calories', 'total_protein', 'total_carbohydrates', 'total_fat', 'updated_at'])

    def __str__(self):
        return f'{self.meal_type} on {self.date} ({self.user})'


class MealItem(models.Model):
    meal_log = models.ForeignKey(MealLog, on_delete=models.CASCADE, related_name='items')
    food_item = models.ForeignKey(FoodItem, on_delete=models.PROTECT, related_name='meal_entries')
    quantity_grams = models.DecimalField(max_digits=7, decimal_places=2)
    calories = models.DecimalField(max_digits=8, decimal_places=2, editable=False, default=0)
    protein = models.DecimalField(max_digits=7, decimal_places=2, editable=False, default=0)
    carbohydrates = models.DecimalField(max_digits=7, decimal_places=2, editable=False, default=0)
    fat = models.DecimalField(max_digits=7, decimal_places=2, editable=False, default=0)

    class Meta:
        db_table = 'meal_items'

    def save(self, *args, **kwargs):
        factor = float(self.quantity_grams) / 100
        self.calories = round(float(self.food_item.calories_per_100g) * factor, 2)
        self.protein = round(float(self.food_item.protein_per_100g) * factor, 2)
        self.carbohydrates = round(float(self.food_item.carbohydrates_per_100g) * factor, 2)
        self.fat = round(float(self.food_item.fat_per_100g) * factor, 2)
        super().save(*args, **kwargs)
        self.meal_log.update_aggregates()

    def delete(self, *args, **kwargs):
        meal_log = self.meal_log
        super().delete(*args, **kwargs)
        meal_log.update_aggregates()

    def __str__(self):
        return f'{self.food_item.name} ({self.quantity_grams}g)'
