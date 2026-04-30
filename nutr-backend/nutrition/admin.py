from django.contrib import admin
from .models import FoodItem, MealLog, MealItem


@admin.register(FoodItem)
class FoodItemAdmin(admin.ModelAdmin):
    list_display = ['name', 'calories_per_100g', 'protein_per_100g', 'carbohydrates_per_100g', 'fat_per_100g', 'is_active']
    list_filter = ['is_active']
    search_fields = ['name']


class MealItemInline(admin.TabularInline):
    model = MealItem
    extra = 0
    readonly_fields = ['calories', 'protein', 'carbohydrates', 'fat']
    raw_id_fields = ['food_item']


@admin.register(MealLog)
class MealLogAdmin(admin.ModelAdmin):
    list_display = ['user', 'meal_type', 'date', 'total_calories', 'total_protein']
    list_filter = ['meal_type', 'date']
    search_fields = ['user__full_name']
    readonly_fields = ['total_calories', 'total_protein', 'total_carbohydrates', 'total_fat']
    raw_id_fields = ['user']
    inlines = [MealItemInline]
