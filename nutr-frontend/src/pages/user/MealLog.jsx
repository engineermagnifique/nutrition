import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, Search, UtensilsCrossed } from 'lucide-react';
import { nutritionService } from '../../services/nutrition.service';
import { format } from 'date-fns';
import Card, { CardHeader } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Modal from '../../components/ui/Modal';
import Alert from '../../components/ui/Alert';
import Badge from '../../components/ui/Badge';
import NutritionChart from '../../components/charts/NutritionChart';
import Spinner from '../../components/ui/Spinner';

const mealColors = { breakfast: 'yellow', lunch: 'green', dinner: 'blue', snack: 'purple' };

export default function MealLog() {
  const qc = useQueryClient();
  const today = format(new Date(), 'yyyy-MM-dd');
  const [selectedDate, setSelectedDate] = useState(today);
  const [mealModal, setMealModal] = useState(false);
  const [addItemModal, setAddItemModal] = useState(null); // meal id
  const [mealForm, setMealForm] = useState({ meal_type: '', date: today, notes: '' });
  const [itemForm, setItemForm] = useState({ food_item: '', quantity_grams: '' });
  const [foodSearch, setFoodSearch] = useState('');
  const [error, setError] = useState('');

  const { data: daily, isLoading } = useQuery({
    queryKey: ['daily-summary', selectedDate],
    queryFn: () => nutritionService.getDailySummary({ date: selectedDate }).then((r) => r.data.data),
  });

  const { data: foodItems = [] } = useQuery({
    queryKey: ['food-items', foodSearch],
    queryFn: () => nutritionService.getFoodItems({ search: foodSearch || undefined }).then((r) => r.data),
    enabled: mealModal || !!addItemModal,
  });

  const createMeal = useMutation({
    mutationFn: (d) => nutritionService.createMeal(d),
    onSuccess: () => { qc.invalidateQueries(['daily-summary']); setMealModal(false); setMealForm({ meal_type: '', date: today, notes: '' }); },
    onError: (e) => setError(e.message),
  });

  const addItem = useMutation({
    mutationFn: ({ mealId, ...d }) => nutritionService.addMealItem(mealId, d),
    onSuccess: () => { qc.invalidateQueries(['daily-summary']); setAddItemModal(null); setItemForm({ food_item: '', quantity_grams: '' }); },
    onError: (e) => setError(e.message),
  });

  const removeItem = useMutation({
    mutationFn: ({ mealId, itemId }) => nutritionService.removeMealItem(mealId, itemId),
    onSuccess: () => qc.invalidateQueries(['daily-summary']),
  });

  const macros = daily ? [
    { label: 'Calories', value: Math.round(daily.total_calories), unit: 'kcal' },
    { label: 'Protein', value: Math.round(daily.total_protein), unit: 'g' },
    { label: 'Carbs', value: Math.round(daily.total_carbohydrates), unit: 'g' },
    { label: 'Fat', value: Math.round(daily.total_fat), unit: 'g' },
  ] : [];

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Meal Log</h1>
          <p className="text-sm text-gray-500 mt-1">Track your daily nutrition intake.</p>
        </div>
        <div className="flex items-center gap-3">
          <Input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="w-40" />
          <Button onClick={() => { setMealForm({ ...mealForm, date: selectedDate }); setMealModal(true); }}>
            <Plus className="h-4 w-4" /> Add Meal
          </Button>
        </div>
      </div>

      {/* Daily macros */}
      {daily && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {macros.map(({ label, value, unit }) => (
            <Card key={label} className="text-center">
              <p className="text-2xl font-bold text-gray-900">{value}<span className="text-sm font-normal text-gray-500 ml-1">{unit}</span></p>
              <p className="text-xs text-gray-500 mt-1">{label}</p>
            </Card>
          ))}
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-12"><Spinner size="lg" /></div>
      ) : !daily?.meals?.length ? (
        <Card className="text-center py-12">
          <UtensilsCrossed className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">No meals logged for this day.</p>
          <p className="text-sm text-gray-400 mb-4">Start tracking your nutrition by adding a meal.</p>
          <Button onClick={() => { setMealForm({ ...mealForm, date: selectedDate }); setMealModal(true); }}>
            <Plus className="h-4 w-4" /> Log First Meal
          </Button>
        </Card>
      ) : (
        <>
          <Card>
            <CardHeader title="Nutrition Breakdown" subtitle={format(new Date(selectedDate), 'MMMM d, yyyy')} />
            <NutritionChart meals={daily.meals} />
          </Card>

          <div className="space-y-4">
            {daily.meals.map((meal) => (
              <Card key={meal.id}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <Badge variant={mealColors[meal.meal_type] || 'gray'} className="capitalize">{meal.meal_type}</Badge>
                    <span className="text-sm text-gray-500">{Math.round(meal.total_calories)} kcal</span>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => setAddItemModal(meal.id)}>
                    <Plus className="h-3 w-3" /> Add Food
                  </Button>
                </div>

                {meal.items?.length > 0 ? (
                  <div className="space-y-2">
                    {meal.items.map((item) => (
                      <div key={item.id} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{item.food_item_name || 'Food item'}</p>
                          <p className="text-xs text-gray-500">{item.quantity_grams}g · {Math.round(item.calories)} kcal</p>
                        </div>
                        <button
                          onClick={() => removeItem.mutate({ mealId: meal.id, itemId: item.id })}
                          className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-400 text-center py-2">No food items added yet.</p>
                )}
              </Card>
            ))}
          </div>
        </>
      )}

      {/* Create meal modal */}
      <Modal isOpen={mealModal} onClose={() => { setMealModal(false); setError(''); }} title="Log a Meal">
        {error && <Alert type="error" message={error} onClose={() => setError('')} className="mb-4" />}
        <form onSubmit={(e) => { e.preventDefault(); setError(''); createMeal.mutate(mealForm); }} className="space-y-4">
          <Select label="Meal Type" required value={mealForm.meal_type} onChange={(e) => setMealForm({ ...mealForm, meal_type: e.target.value })} placeholder="Select meal type">
            <option value="breakfast">Breakfast</option>
            <option value="lunch">Lunch</option>
            <option value="dinner">Dinner</option>
            <option value="snack">Snack</option>
          </Select>
          <Input label="Date" type="date" required value={mealForm.date} onChange={(e) => setMealForm({ ...mealForm, date: e.target.value })} />
          <Input label="Notes (optional)" placeholder="Any notes about this meal..." value={mealForm.notes} onChange={(e) => setMealForm({ ...mealForm, notes: e.target.value })} />
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => setMealModal(false)} className="flex-1">Cancel</Button>
            <Button type="submit" loading={createMeal.isPending} className="flex-1">Create Meal</Button>
          </div>
        </form>
      </Modal>

      {/* Add food item modal */}
      <Modal isOpen={!!addItemModal} onClose={() => { setAddItemModal(null); setError(''); setFoodSearch(''); }} title="Add Food Item">
        {error && <Alert type="error" message={error} onClose={() => setError('')} className="mb-4" />}
        <form onSubmit={(e) => { e.preventDefault(); setError(''); addItem.mutate({ mealId: addItemModal, ...itemForm }); }} className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <input
              className="w-full border border-gray-300 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-800"
              placeholder="Search food items..."
              value={foodSearch}
              onChange={(e) => setFoodSearch(e.target.value)}
            />
          </div>
          <Select label="Food Item" required value={itemForm.food_item} onChange={(e) => setItemForm({ ...itemForm, food_item: e.target.value })} placeholder="Select a food item">
            {foodItems.map((f) => (
              <option key={f.id} value={f.id}>{f.name} ({f.calories_per_100g} kcal/100g)</option>
            ))}
          </Select>
          <Input label="Quantity (grams)" type="number" step="0.1" min="0.1" placeholder="e.g. 150" required value={itemForm.quantity_grams} onChange={(e) => setItemForm({ ...itemForm, quantity_grams: e.target.value })} />
          {itemForm.food_item && itemForm.quantity_grams && (
            <div className="p-3 bg-primary-50 rounded-lg text-sm">
              {(() => {
                const food = foodItems.find((f) => f.id == itemForm.food_item);
                if (!food) return null;
                const ratio = parseFloat(itemForm.quantity_grams) / 100;
                return <p className="text-primary-800"><strong>{Math.round(food.calories_per_100g * ratio)} kcal</strong> · {Math.round(food.protein_per_100g * ratio)}g protein · {Math.round(food.carbohydrates_per_100g * ratio)}g carbs · {Math.round(food.fat_per_100g * ratio)}g fat</p>;
              })()}
            </div>
          )}
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => setAddItemModal(null)} className="flex-1">Cancel</Button>
            <Button type="submit" loading={addItem.isPending} className="flex-1">Add to Meal</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
