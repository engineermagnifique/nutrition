from rest_framework import serializers
from .models import FoodItem, MealLog, MealItem


class FoodItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = FoodItem
        fields = [
            'id', 'name', 'calories_per_100g', 'protein_per_100g',
            'carbohydrates_per_100g', 'fat_per_100g', 'fiber_per_100g',
            'description', 'is_active', 'created_at',
        ]
        read_only_fields = ['id', 'created_at']


class MealItemSerializer(serializers.ModelSerializer):
    food_item_name = serializers.CharField(source='food_item.name', read_only=True)

    class Meta:
        model = MealItem
        fields = [
            'id', 'food_item', 'food_item_name', 'quantity_grams',
            'calories', 'protein', 'carbohydrates', 'fat',
        ]
        read_only_fields = ['id', 'calories', 'protein', 'carbohydrates', 'fat', 'food_item_name']


class MealItemCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = MealItem
        fields = ['food_item', 'quantity_grams']

    def validate_quantity_grams(self, value):
        if value <= 0:
            raise serializers.ValidationError('Quantity must be greater than zero.')
        return value


class MealLogSerializer(serializers.ModelSerializer):
    items = MealItemSerializer(many=True, read_only=True)

    class Meta:
        model = MealLog
        fields = [
            'id', 'meal_type', 'date',
            'total_calories', 'total_protein', 'total_carbohydrates', 'total_fat',
            'notes', 'items', 'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'total_calories', 'total_protein', 'total_carbohydrates', 'total_fat', 'created_at', 'updated_at']


class MealLogCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = MealLog
        fields = ['meal_type', 'date', 'notes']


class DailySummarySerializer(serializers.Serializer):
    date = serializers.DateField()
    total_calories = serializers.DecimalField(max_digits=10, decimal_places=2)
    total_protein = serializers.DecimalField(max_digits=9, decimal_places=2)
    total_carbohydrates = serializers.DecimalField(max_digits=9, decimal_places=2)
    total_fat = serializers.DecimalField(max_digits=9, decimal_places=2)
    meals = MealLogSerializer(many=True)
