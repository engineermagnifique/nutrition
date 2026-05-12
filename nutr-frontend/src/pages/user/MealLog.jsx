import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, Search, UtensilsCrossed, ChevronDown, X } from 'lucide-react';
import { nutritionService } from '../../services/nutrition.service';
import { format } from 'date-fns';
import NutritionChart from '../../components/charts/NutritionChart';
import FoodScanModal from '../../components/ui/FoodScanModal';

const ACCENT   = '#F59B6B';
const ACCENT_D = '#E8754A';
const BG       = '#FCE4CF';
const TINT = {
  peach:  { bg: '#FFE5D1', border: '#FFD0AE', text: '#9A4B1F', icon: '#E8754A' },
  mint:   { bg: '#D7F2E1', border: '#A8E2BC', text: '#1F5C36', icon: '#2E7D32' },
  sky:    { bg: '#D9ECFA', border: '#B0D5F1', text: '#1A4D7A', icon: '#1565C0' },
  lilac:  { bg: '#EADCF7', border: '#D2BCEA', text: '#4B2B7A', icon: '#7c3aed' },
  butter: { bg: '#FFF1C9', border: '#FFE08F', text: '#7A5800', icon: '#d97706' },
};

const MEAL_COLORS = {
  breakfast: TINT.butter,
  lunch:     TINT.mint,
  dinner:    TINT.sky,
  snack:     TINT.lilac,
};

// ─── Food Category + Database ─────────────────────────────────────────────────

const FOOD_CATEGORIES = [
  { key: 'all',        label: 'All Foods' },
  { key: 'grains',     label: 'Grains & Carbs' },
  { key: 'proteins',   label: 'Proteins' },
  { key: 'vegetables', label: 'Vegetables' },
  { key: 'fruits',     label: 'Fruits' },
  { key: 'dairy',      label: 'Dairy' },
  { key: 'legumes',    label: 'Legumes & Nuts' },
  { key: 'drinks',     label: 'Drinks & Beverages' },
  { key: 'snacks',     label: 'Snacks & Sweets' },
  { key: 'oils',       label: 'Oils & Condiments' },
];

// cal / protein / carbs / fat are per 100g
const FOOD_DB = [
  // Grains & Carbs
  { id: 1,  name: 'White Rice (cooked)',         cat: 'grains',     cal: 130, p: 2.7,  c: 28.2, f: 0.3  },
  { id: 2,  name: 'Brown Rice (cooked)',          cat: 'grains',     cal: 111, p: 2.6,  c: 23.0, f: 0.9  },
  { id: 3,  name: 'White Bread',                  cat: 'grains',     cal: 265, p: 9.0,  c: 49.0, f: 3.2  },
  { id: 4,  name: 'Whole Wheat Bread',            cat: 'grains',     cal: 247, p: 13.0, c: 41.0, f: 4.2  },
  { id: 5,  name: 'Pasta (cooked)',               cat: 'grains',     cal: 131, p: 5.0,  c: 25.0, f: 1.1  },
  { id: 6,  name: 'Spaghetti (cooked)',           cat: 'grains',     cal: 157, p: 5.8,  c: 30.6, f: 0.9  },
  { id: 7,  name: 'Oats (dry)',                   cat: 'grains',     cal: 389, p: 17.0, c: 66.0, f: 7.0  },
  { id: 8,  name: 'Oats (cooked)',                cat: 'grains',     cal: 71,  p: 2.5,  c: 12.0, f: 1.5  },
  { id: 9,  name: 'Ugali / Maize Meal (cooked)', cat: 'grains',     cal: 100, p: 2.0,  c: 22.0, f: 0.5  },
  { id: 10, name: 'Chapati',                      cat: 'grains',     cal: 297, p: 8.0,  c: 55.0, f: 5.0  },
  { id: 11, name: 'Mandazi',                      cat: 'grains',     cal: 330, p: 7.0,  c: 52.0, f: 11.0 },
  { id: 12, name: 'Maize (boiled)',               cat: 'grains',     cal: 96,  p: 3.4,  c: 21.0, f: 1.5  },
  { id: 13, name: 'Cassava (boiled)',             cat: 'grains',     cal: 112, p: 0.9,  c: 27.0, f: 0.3  },
  { id: 14, name: 'Millet (cooked)',              cat: 'grains',     cal: 119, p: 3.5,  c: 23.7, f: 1.0  },
  { id: 15, name: 'Sorghum Porridge',            cat: 'grains',     cal: 77,  p: 2.7,  c: 16.0, f: 0.8  },
  { id: 16, name: 'Quinoa (cooked)',              cat: 'grains',     cal: 120, p: 4.4,  c: 21.3, f: 1.9  },
  { id: 17, name: 'Barley (cooked)',              cat: 'grains',     cal: 123, p: 2.3,  c: 28.2, f: 0.4  },
  { id: 18, name: 'Naan Bread',                   cat: 'grains',     cal: 317, p: 10.8, c: 54.0, f: 7.0  },
  { id: 19, name: 'Tortilla (wheat)',             cat: 'grains',     cal: 310, p: 8.0,  c: 52.0, f: 7.3  },
  { id: 20, name: 'Plantain (boiled)',            cat: 'grains',     cal: 116, p: 0.8,  c: 31.0, f: 0.1  },

  // Proteins
  { id: 101, name: 'Chicken Breast (grilled)',    cat: 'proteins',   cal: 165, p: 31.0, c: 0.0,  f: 3.6  },
  { id: 102, name: 'Chicken Thigh (grilled)',     cat: 'proteins',   cal: 209, p: 26.0, c: 0.0,  f: 11.0 },
  { id: 103, name: 'Beef (lean, cooked)',         cat: 'proteins',   cal: 250, p: 26.0, c: 0.0,  f: 15.0 },
  { id: 104, name: 'Beef Mince (cooked)',         cat: 'proteins',   cal: 218, p: 24.0, c: 0.0,  f: 13.0 },
  { id: 105, name: 'Pork Loin (cooked)',          cat: 'proteins',   cal: 242, p: 27.0, c: 0.0,  f: 14.0 },
  { id: 106, name: 'Lamb (cooked)',               cat: 'proteins',   cal: 294, p: 25.0, c: 0.0,  f: 21.0 },
  { id: 107, name: 'Tilapia (cooked)',            cat: 'proteins',   cal: 129, p: 26.0, c: 0.0,  f: 2.7  },
  { id: 108, name: 'Salmon (cooked)',             cat: 'proteins',   cal: 208, p: 20.0, c: 0.0,  f: 13.0 },
  { id: 109, name: 'Tuna (canned, in water)',     cat: 'proteins',   cal: 116, p: 26.0, c: 0.0,  f: 1.0  },
  { id: 110, name: 'Sardines (canned)',           cat: 'proteins',   cal: 208, p: 24.5, c: 0.0,  f: 11.4 },
  { id: 111, name: 'Whole Egg (boiled)',          cat: 'proteins',   cal: 155, p: 13.0, c: 1.1,  f: 11.0 },
  { id: 112, name: 'Egg Whites',                  cat: 'proteins',   cal: 52,  p: 11.0, c: 0.7,  f: 0.2  },
  { id: 113, name: 'Liver (beef, cooked)',        cat: 'proteins',   cal: 175, p: 27.0, c: 4.5,  f: 5.0  },
  { id: 114, name: 'Goat Meat (cooked)',          cat: 'proteins',   cal: 143, p: 27.0, c: 0.0,  f: 3.0  },
  { id: 115, name: 'Shrimp / Prawns (cooked)',    cat: 'proteins',   cal: 99,  p: 24.0, c: 0.0,  f: 0.3  },
  { id: 116, name: 'Turkey Breast (cooked)',      cat: 'proteins',   cal: 189, p: 29.0, c: 0.0,  f: 7.4  },
  { id: 117, name: 'Tofu (firm)',                 cat: 'proteins',   cal: 76,  p: 8.0,  c: 1.9,  f: 4.8  },
  { id: 118, name: 'Tempeh',                      cat: 'proteins',   cal: 193, p: 19.0, c: 9.4,  f: 11.0 },

  // Vegetables
  { id: 201, name: 'Spinach (raw)',               cat: 'vegetables', cal: 23,  p: 2.9,  c: 3.6,  f: 0.4  },
  { id: 202, name: 'Spinach (cooked)',            cat: 'vegetables', cal: 41,  p: 5.4,  c: 3.8,  f: 0.5  },
  { id: 203, name: 'Kale (raw)',                  cat: 'vegetables', cal: 49,  p: 4.3,  c: 9.0,  f: 0.9  },
  { id: 204, name: 'Broccoli (cooked)',           cat: 'vegetables', cal: 34,  p: 2.4,  c: 6.6,  f: 0.4  },
  { id: 205, name: 'Cabbage (cooked)',            cat: 'vegetables', cal: 23,  p: 1.1,  c: 5.2,  f: 0.1  },
  { id: 206, name: 'Carrots (raw)',               cat: 'vegetables', cal: 41,  p: 0.9,  c: 9.6,  f: 0.2  },
  { id: 207, name: 'Tomatoes (raw)',              cat: 'vegetables', cal: 18,  p: 0.9,  c: 3.9,  f: 0.2  },
  { id: 208, name: 'Onion (raw)',                 cat: 'vegetables', cal: 40,  p: 1.1,  c: 9.3,  f: 0.1  },
  { id: 209, name: 'Garlic (raw)',                cat: 'vegetables', cal: 149, p: 6.4,  c: 33.1, f: 0.5  },
  { id: 210, name: 'Cucumber (raw)',              cat: 'vegetables', cal: 16,  p: 0.7,  c: 3.6,  f: 0.1  },
  { id: 211, name: 'Bell Pepper (raw)',           cat: 'vegetables', cal: 31,  p: 1.0,  c: 6.0,  f: 0.3  },
  { id: 212, name: 'Eggplant (cooked)',           cat: 'vegetables', cal: 35,  p: 0.8,  c: 8.7,  f: 0.2  },
  { id: 213, name: 'Pumpkin (cooked)',            cat: 'vegetables', cal: 26,  p: 1.0,  c: 6.5,  f: 0.1  },
  { id: 214, name: 'Sweet Potato (boiled)',       cat: 'vegetables', cal: 86,  p: 1.6,  c: 20.1, f: 0.1  },
  { id: 215, name: 'Potato (boiled)',             cat: 'vegetables', cal: 87,  p: 1.9,  c: 20.1, f: 0.1  },
  { id: 216, name: 'Sukuma Wiki / Collard Greens',cat: 'vegetables', cal: 32,  p: 2.7,  c: 5.4,  f: 0.6  },
  { id: 217, name: 'Zucchini (cooked)',           cat: 'vegetables', cal: 17,  p: 1.1,  c: 3.6,  f: 0.3  },
  { id: 218, name: 'Mushrooms (cooked)',          cat: 'vegetables', cal: 28,  p: 1.7,  c: 5.3,  f: 0.5  },
  { id: 219, name: 'Leeks (cooked)',              cat: 'vegetables', cal: 31,  p: 0.8,  c: 7.6,  f: 0.2  },
  { id: 220, name: 'Beetroot (cooked)',           cat: 'vegetables', cal: 44,  p: 1.7,  c: 10.0, f: 0.2  },
  { id: 221, name: 'Green Peas (cooked)',         cat: 'vegetables', cal: 84,  p: 5.4,  c: 15.6, f: 0.2  },
  { id: 222, name: 'Corn / Maize (cooked)',       cat: 'vegetables', cal: 96,  p: 3.4,  c: 21.0, f: 1.5  },

  // Fruits
  { id: 301, name: 'Banana',                      cat: 'fruits',     cal: 89,  p: 1.1,  c: 22.8, f: 0.3  },
  { id: 302, name: 'Apple (raw)',                  cat: 'fruits',     cal: 52,  p: 0.3,  c: 13.8, f: 0.2  },
  { id: 303, name: 'Mango',                        cat: 'fruits',     cal: 60,  p: 0.8,  c: 15.0, f: 0.4  },
  { id: 304, name: 'Orange',                       cat: 'fruits',     cal: 47,  p: 0.9,  c: 11.8, f: 0.1  },
  { id: 305, name: 'Avocado',                      cat: 'fruits',     cal: 160, p: 2.0,  c: 8.5,  f: 14.7 },
  { id: 306, name: 'Pineapple',                    cat: 'fruits',     cal: 50,  p: 0.5,  c: 13.1, f: 0.1  },
  { id: 307, name: 'Watermelon',                   cat: 'fruits',     cal: 30,  p: 0.6,  c: 7.6,  f: 0.2  },
  { id: 308, name: 'Papaya',                       cat: 'fruits',     cal: 43,  p: 0.5,  c: 11.0, f: 0.3  },
  { id: 309, name: 'Guava',                        cat: 'fruits',     cal: 68,  p: 2.6,  c: 14.3, f: 1.0  },
  { id: 310, name: 'Passion Fruit',               cat: 'fruits',     cal: 97,  p: 2.2,  c: 23.4, f: 0.7  },
  { id: 311, name: 'Strawberries',                cat: 'fruits',     cal: 32,  p: 0.7,  c: 7.7,  f: 0.3  },
  { id: 312, name: 'Grapes',                      cat: 'fruits',     cal: 69,  p: 0.7,  c: 18.1, f: 0.2  },
  { id: 313, name: 'Lemon',                       cat: 'fruits',     cal: 29,  p: 1.1,  c: 9.3,  f: 0.3  },
  { id: 314, name: 'Tangerine / Clementine',      cat: 'fruits',     cal: 53,  p: 0.8,  c: 13.3, f: 0.3  },
  { id: 315, name: 'Pear',                        cat: 'fruits',     cal: 57,  p: 0.4,  c: 15.2, f: 0.1  },
  { id: 316, name: 'Dates (dried)',               cat: 'fruits',     cal: 277, p: 1.8,  c: 75.0, f: 0.2  },

  // Dairy
  { id: 401, name: 'Whole Milk',                  cat: 'dairy',      cal: 61,  p: 3.2,  c: 4.8,  f: 3.3  },
  { id: 402, name: 'Skimmed Milk',                cat: 'dairy',      cal: 34,  p: 3.4,  c: 4.9,  f: 0.1  },
  { id: 403, name: 'Greek Yogurt (plain)',        cat: 'dairy',      cal: 59,  p: 10.0, c: 3.6,  f: 0.4  },
  { id: 404, name: 'Plain Yogurt (full fat)',     cat: 'dairy',      cal: 61,  p: 3.5,  c: 4.7,  f: 3.3  },
  { id: 405, name: 'Cheddar Cheese',             cat: 'dairy',      cal: 402, p: 24.9, c: 1.3,  f: 33.1 },
  { id: 406, name: 'Mozzarella Cheese',          cat: 'dairy',      cal: 280, p: 28.0, c: 2.2,  f: 17.0 },
  { id: 407, name: 'Butter (salted)',             cat: 'dairy',      cal: 717, p: 0.9,  c: 0.1,  f: 81.1 },
  { id: 408, name: 'Heavy Cream',                cat: 'dairy',      cal: 340, p: 2.1,  c: 2.8,  f: 36.0 },
  { id: 409, name: 'Sour Cream',                 cat: 'dairy',      cal: 193, p: 2.1,  c: 4.6,  f: 19.4 },
  { id: 410, name: 'Cottage Cheese (low fat)',   cat: 'dairy',      cal: 72,  p: 12.4, c: 2.7,  f: 1.0  },

  // Legumes & Nuts
  { id: 501, name: 'Red Kidney Beans (cooked)',  cat: 'legumes',    cal: 127, p: 8.7,  c: 22.8, f: 0.5  },
  { id: 502, name: 'Black Beans (cooked)',       cat: 'legumes',    cal: 132, p: 8.9,  c: 23.7, f: 0.5  },
  { id: 503, name: 'Chickpeas (cooked)',         cat: 'legumes',    cal: 164, p: 8.9,  c: 27.4, f: 2.6  },
  { id: 504, name: 'Green Lentils (cooked)',     cat: 'legumes',    cal: 116, p: 9.0,  c: 20.1, f: 0.4  },
  { id: 505, name: 'Red Lentils (cooked)',       cat: 'legumes',    cal: 127, p: 7.6,  c: 21.2, f: 0.5  },
  { id: 506, name: 'Soybeans (cooked)',          cat: 'legumes',    cal: 173, p: 16.6, c: 9.9,  f: 9.0  },
  { id: 507, name: 'Peanuts (raw)',              cat: 'legumes',    cal: 567, p: 25.8, c: 16.1, f: 49.2 },
  { id: 508, name: 'Peanut Butter',             cat: 'legumes',    cal: 588, p: 25.0, c: 20.0, f: 50.0 },
  { id: 509, name: 'Almonds',                   cat: 'legumes',    cal: 579, p: 21.2, c: 21.6, f: 49.9 },
  { id: 510, name: 'Cashews',                   cat: 'legumes',    cal: 553, p: 18.2, c: 30.2, f: 43.8 },
  { id: 511, name: 'Walnuts',                   cat: 'legumes',    cal: 654, p: 15.2, c: 13.7, f: 65.2 },
  { id: 512, name: 'Sunflower Seeds',           cat: 'legumes',    cal: 584, p: 20.8, c: 20.0, f: 51.5 },
  { id: 513, name: 'Pumpkin Seeds',             cat: 'legumes',    cal: 559, p: 30.2, c: 10.7, f: 49.1 },
  { id: 514, name: 'Black-Eyed Peas (cooked)',  cat: 'legumes',    cal: 116, p: 7.7,  c: 21.0, f: 0.5  },
  { id: 515, name: 'Pigeon Peas (cooked)',      cat: 'legumes',    cal: 143, p: 9.0,  c: 25.4, f: 0.4  },

  // Drinks & Beverages
  { id: 601, name: 'Water',                     cat: 'drinks',     cal: 0,   p: 0.0,  c: 0.0,  f: 0.0  },
  { id: 602, name: 'Orange Juice (fresh)',      cat: 'drinks',     cal: 45,  p: 0.7,  c: 10.4, f: 0.2  },
  { id: 603, name: 'Apple Juice',               cat: 'drinks',     cal: 46,  p: 0.1,  c: 11.4, f: 0.1  },
  { id: 604, name: 'Mango Juice',               cat: 'drinks',     cal: 60,  p: 0.4,  c: 14.0, f: 0.1  },
  { id: 605, name: 'Whole Milk',                cat: 'drinks',     cal: 61,  p: 3.2,  c: 4.8,  f: 3.3  },
  { id: 606, name: 'Soy Milk (unsweetened)',    cat: 'drinks',     cal: 33,  p: 3.3,  c: 1.7,  f: 1.8  },
  { id: 607, name: 'Coffee (black, no sugar)',  cat: 'drinks',     cal: 2,   p: 0.3,  c: 0.0,  f: 0.0  },
  { id: 608, name: 'Tea (black, no sugar)',     cat: 'drinks',     cal: 1,   p: 0.0,  c: 0.3,  f: 0.0  },
  { id: 609, name: 'Chai Tea (with milk)',      cat: 'drinks',     cal: 30,  p: 1.5,  c: 4.5,  f: 0.8  },
  { id: 610, name: 'Coca-Cola',                 cat: 'drinks',     cal: 42,  p: 0.0,  c: 10.6, f: 0.0  },
  { id: 611, name: 'Fanta (orange)',            cat: 'drinks',     cal: 46,  p: 0.0,  c: 11.4, f: 0.0  },
  { id: 612, name: 'Beer (lager)',              cat: 'drinks',     cal: 43,  p: 0.5,  c: 3.6,  f: 0.0  },
  { id: 613, name: 'Red Wine',                  cat: 'drinks',     cal: 85,  p: 0.1,  c: 2.6,  f: 0.0  },

  // Snacks & Sweets
  { id: 701, name: 'Dark Chocolate (70%)',      cat: 'snacks',     cal: 546, p: 5.0,  c: 60.0, f: 31.0 },
  { id: 702, name: 'Milk Chocolate',            cat: 'snacks',     cal: 535, p: 7.7,  c: 59.4, f: 29.7 },
  { id: 703, name: 'Potato Chips / Crisps',     cat: 'snacks',     cal: 536, p: 7.0,  c: 53.0, f: 35.0 },
  { id: 704, name: 'Popcorn (plain)',            cat: 'snacks',     cal: 375, p: 11.0, c: 74.0, f: 4.5  },
  { id: 705, name: 'Biscuits / Cookies',        cat: 'snacks',     cal: 480, p: 7.0,  c: 62.0, f: 23.0 },
  { id: 706, name: 'Honey',                     cat: 'snacks',     cal: 304, p: 0.3,  c: 82.4, f: 0.0  },
  { id: 707, name: 'Jam / Jelly',               cat: 'snacks',     cal: 250, p: 0.4,  c: 62.0, f: 0.1  },
  { id: 708, name: 'Ice Cream (vanilla)',        cat: 'snacks',     cal: 207, p: 3.5,  c: 24.0, f: 11.0 },
  { id: 709, name: 'Cake (plain sponge)',        cat: 'snacks',     cal: 347, p: 6.0,  c: 56.0, f: 12.0 },

  // Oils & Condiments
  { id: 801, name: 'Cooking Oil (vegetable)',   cat: 'oils',       cal: 884, p: 0.0,  c: 0.0,  f: 100.0},
  { id: 802, name: 'Olive Oil',                 cat: 'oils',       cal: 884, p: 0.0,  c: 0.0,  f: 100.0},
  { id: 803, name: 'Coconut Oil',               cat: 'oils',       cal: 892, p: 0.0,  c: 0.0,  f: 99.1 },
  { id: 804, name: 'Mayonnaise',                cat: 'oils',       cal: 680, p: 1.0,  c: 0.6,  f: 75.0 },
  { id: 805, name: 'Tomato Sauce (ketchup)',     cat: 'oils',       cal: 112, p: 1.4,  c: 27.8, f: 0.1  },
  { id: 806, name: 'Soy Sauce',                 cat: 'oils',       cal: 53,  p: 8.1,  c: 4.9,  f: 0.1  },
  { id: 807, name: 'Salt',                      cat: 'oils',       cal: 0,   p: 0.0,  c: 0.0,  f: 0.0  },
  { id: 808, name: 'Sugar (white)',             cat: 'oils',       cal: 387, p: 0.0,  c: 99.8, f: 0.0  },
  { id: 809, name: 'Sugar (brown)',             cat: 'oils',       cal: 380, p: 0.1,  c: 98.1, f: 0.0  },
];

// ─── Skeleton ──────────────────────────────────────────────────────────────────
function Sk({ w, h, r = 6 }) {
  return (
    <div style={{
      width: w, height: h, borderRadius: r, flexShrink: 0,
      background: 'linear-gradient(90deg,#f3e6d8 25%,#e6d4c0 50%,#f3e6d8 75%)',
      backgroundSize: '200% 100%',
      animation: 'skShimmer 1.4s ease-in-out infinite',
    }} />
  );
}

// ─── Spinner ──────────────────────────────────────────────────────────────────
function Spin() {
  return (
    <div style={{ width: 32, height: 32, border: `3px solid #F0E6D2`, borderTopColor: ACCENT_D, borderRadius: '50%', animation: 'mlSpin 0.8s linear infinite' }} />
  );
}

// ─── Food Combobox (for "Add Food Item" modal) ────────────────────────────────
function FoodCombobox({ foodItems, value, onChange, isLoading }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const ref = useRef(null);

  const selected = foodItems.find((f) => String(f.id) === String(value));
  const filtered = foodItems.filter((f) =>
    f.name.toLowerCase().includes(search.toLowerCase())
  ).slice(0, 60);

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <div
        onClick={() => setOpen(!open)}
        style={{
          display: 'flex', alignItems: 'center', padding: '10px 12px',
          border: `1.5px solid ${open ? ACCENT_D : '#F0E6D2'}`,
          borderRadius: 10, cursor: 'pointer', gap: 8,
          boxShadow: open ? `0 0 0 3px rgba(232,117,74,.1)` : 'none',
          background: '#fffdf9', transition: 'all .2s',
        }}
      >
        <Search size={15} color="#c4a882" />
        {open ? (
          <input
            autoFocus
            style={{ flex: 1, border: 'none', outline: 'none', fontSize: 14, color: '#2a1f14', fontFamily: 'inherit', background: 'transparent' }}
            placeholder="Search foods…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <span style={{ flex: 1, fontSize: 14, color: selected ? '#2a1f14' : '#c4a882' }}>
            {selected ? selected.name : 'Search and select a food…'}
          </span>
        )}
        {selected && !open && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onChange(''); setSearch(''); }}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#c4a882', display: 'flex' }}
          >
            <X size={14} />
          </button>
        )}
        <ChevronDown size={14} color="#c4a882" style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform .2s' }} />
      </div>

      {open && (
        <>
          <div style={{ position: 'fixed', inset: 0, zIndex: 10 }} onClick={() => { setOpen(false); setSearch(''); }} />
          <div style={{
            position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 20,
            background: '#fffdf9', border: '1.5px solid #F0E6D2', borderRadius: 12,
            boxShadow: '0 8px 24px rgba(180,120,60,0.12)', maxHeight: 240,
            overflowY: 'auto', marginTop: 4,
          }}>
            {isLoading ? (
              <div style={{ padding: '14px', textAlign: 'center', display: 'flex', justifyContent: 'center' }}><Spin /></div>
            ) : filtered.length === 0 ? (
              <div style={{ padding: '12px 14px', fontSize: 13, color: '#c4a882' }}>No foods found</div>
            ) : filtered.map((food) => (
              <button
                key={food.id}
                type="button"
                onClick={() => { onChange(String(food.id)); setOpen(false); setSearch(''); }}
                style={{
                  width: '100%', textAlign: 'left', padding: '10px 14px',
                  border: 'none', background: String(food.id) === String(value) ? '#FBF4EA' : 'transparent',
                  cursor: 'pointer', display: 'flex', flexDirection: 'column',
                  gap: 2, fontFamily: 'inherit', borderBottom: '1px solid #F5ECE1',
                }}
              >
                <span style={{ fontSize: 14, color: '#2a1f14', fontWeight: 500 }}>{food.name}</span>
                <span style={{ fontSize: 11, color: '#c4a882' }}>
                  {food.calories_per_100g} kcal · {food.protein_per_100g}g P · {food.carbohydrates_per_100g}g C · {food.fat_per_100g}g F per 100g
                </span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ─── Inline Food Search for Create Meal modal ─────────────────────────────────
function InlineFoodSearch({ selectedCat, selectedFoods, onAdd, onRemove, onQtyChange }) {
  const [search, setSearch] = useState('');
  const [dropOpen, setDropOpen] = useState(false);
  const inputRef = useRef(null);

  const catFoods = selectedCat === 'all'
    ? FOOD_DB
    : FOOD_DB.filter((f) => f.cat === selectedCat);

  const filtered = catFoods
    .filter((f) => f.name.toLowerCase().includes(search.toLowerCase()))
    .slice(0, 80);

  const isSelected = (id) => selectedFoods.some((s) => s.food.id === id);

  return (
    <div>
      <div style={{ position: 'relative' }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          border: `1.5px solid ${dropOpen ? ACCENT_D : '#F0E6D2'}`,
          borderRadius: 10, padding: '10px 12px', background: '#fffdf9',
          boxShadow: dropOpen ? `0 0 0 3px rgba(232,117,74,.1)` : 'none',
          transition: 'all .2s',
        }}>
          <Search size={15} color="#c4a882" style={{ flexShrink: 0 }} />
          <input
            ref={inputRef}
            style={{ flex: 1, border: 'none', outline: 'none', fontSize: 14, color: '#2a1f14', fontFamily: 'inherit', background: 'transparent' }}
            placeholder={`Search${selectedCat !== 'all' ? ` in ${FOOD_CATEGORIES.find(c => c.key === selectedCat)?.label}` : ' all foods'}…`}
            value={search}
            onChange={(e) => { setSearch(e.target.value); setDropOpen(true); }}
            onFocus={() => setDropOpen(true)}
          />
          {search && (
            <button
              type="button"
              onClick={() => { setSearch(''); inputRef.current?.focus(); }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#c4a882', display: 'flex' }}
            >
              <X size={13} />
            </button>
          )}
        </div>

        {dropOpen && (
          <>
            <div style={{ position: 'fixed', inset: 0, zIndex: 10 }} onClick={() => setDropOpen(false)} />
            <div style={{
              position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, zIndex: 20,
              background: '#fffdf9', border: '1.5px solid #F0E6D2', borderRadius: 12,
              boxShadow: '0 8px 24px rgba(180,120,60,0.12)', maxHeight: 260, overflowY: 'auto',
            }}>
              {filtered.length === 0 ? (
                <div style={{ padding: '12px 14px', fontSize: 13, color: '#c4a882' }}>No foods found</div>
              ) : filtered.map((food) => (
                <button
                  key={food.id}
                  type="button"
                  onClick={() => {
                    if (!isSelected(food.id)) onAdd(food);
                    setDropOpen(false);
                    setSearch('');
                  }}
                  style={{
                    width: '100%', textAlign: 'left', padding: '9px 14px',
                    border: 'none', background: isSelected(food.id) ? '#FBF4EA' : 'transparent',
                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    gap: 8, fontFamily: 'inherit', borderBottom: '1px solid #F5ECE1',
                  }}
                >
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 500, color: isSelected(food.id) ? ACCENT_D : '#2a1f14' }}>
                      {food.name}
                    </div>
                    <div style={{ fontSize: 11, color: '#c4a882', marginTop: 2 }}>
                      {food.cal} kcal · {food.p}g P · {food.c}g C · {food.f}g F per 100g
                    </div>
                  </div>
                  {isSelected(food.id) ? (
                    <span style={{ fontSize: 11, color: ACCENT_D, fontWeight: 600, flexShrink: 0 }}>Added</span>
                  ) : (
                    <span style={{
                      width: 22, height: 22, borderRadius: 6, background: ACCENT,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    }}>
                      <Plus size={13} color="#fff" />
                    </span>
                  )}
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {selectedFoods.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 10 }}>
          {selectedFoods.map(({ food, qty }) => {
            const previewCal = Math.round((food.cal * qty) / 100);
            const previewP   = Math.round((food.p   * qty) / 100);
            return (
              <div key={food.id} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                background: '#FBF4EA', border: '1px solid #F0E6D2',
                borderRadius: 10, padding: '9px 12px',
              }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#2a1f14' }}>{food.name}</div>
                  <div style={{ fontSize: 11, color: '#a8967f', marginTop: 2 }}>
                    {previewCal} kcal · {previewP}g protein
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0 }}>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={qty}
                    onChange={(e) => onQtyChange(food.id, e.target.value)}
                    style={{
                      width: 64, padding: '5px 8px', border: '1.5px solid #F0E6D2',
                      borderRadius: 8, fontSize: 13, fontFamily: 'inherit',
                      color: '#2a1f14', textAlign: 'center', outline: 'none', background: '#fff',
                    }}
                    onFocus={(e) => e.target.style.borderColor = ACCENT_D}
                    onBlur={(e)  => e.target.style.borderColor = '#F0E6D2'}
                  />
                  <span style={{ fontSize: 12, color: '#a8967f' }}>g</span>
                </div>
                <button
                  type="button"
                  onClick={() => onRemove(food.id)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#F0E6D2', display: 'flex', borderRadius: 6, padding: 3 }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.background = '#fef2f2'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = '#F0E6D2'; e.currentTarget.style.background = 'none'; }}
                >
                  <X size={14} />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Main ──────────────────────────────────────────────────────────────────────
export default function MealLog() {
  const qc = useQueryClient();
  const today = format(new Date(), 'yyyy-MM-dd');

  const [selectedDate, setSelectedDate] = useState(today);
  const [scanOpen, setScanOpen]         = useState(false);
  const [mealModal, setMealModal]       = useState(false);
  const [addItemModal, setAddItemModal] = useState(null);

  const [mealForm, setMealForm] = useState({
    meal_type: '',
    date: today,
    food_category: 'all',
    food_selections: [],
  });

  const [itemForm, setItemForm]   = useState({ food_item: '', quantity_grams: '100' });
  const [error, setError]         = useState('');

  const { data: daily, isLoading } = useQuery({
    queryKey: ['daily-summary', selectedDate],
    queryFn: () => nutritionService.getDailySummary({ date: selectedDate }).then((r) => r.data?.data ?? r.data),
  });

  const { data: foodItemsRaw = [], isLoading: foodLoading } = useQuery({
    queryKey: ['food-items-all'],
    queryFn: () => nutritionService.getFoodItems({ page_size: 500 }).then((r) => {
      const d = r.data;
      return d.results ?? d.data?.results ?? (Array.isArray(d) ? d : []);
    }),
    staleTime: 5 * 60_000,
  });

  const createMeal = useMutation({
    mutationFn: async (formData) => {
      const res  = await nutritionService.createMeal({ meal_type: formData.meal_type, date: formData.date });
      const meal = res.data?.data ?? res.data;
      const mealId = meal.id;
      for (const { food, qty } of formData.food_selections) {
        const apiFood = foodItemsRaw.find((f) => f.name.toLowerCase() === food.name.toLowerCase());
        if (apiFood) {
          await nutritionService.addMealItem(mealId, { food_item: String(apiFood.id), quantity_grams: String(qty) });
        }
      }
      return meal;
    },
    onSuccess: () => {
      qc.invalidateQueries(['daily-summary']);
      setMealModal(false);
      setMealForm({ meal_type: '', date: today, food_category: 'all', food_selections: [] });
      setError('');
    },
    onError: (e) => setError(e.message),
  });

  const addItem = useMutation({
    mutationFn: ({ mealId, ...d }) => nutritionService.addMealItem(mealId, d),
    onSuccess: () => {
      qc.invalidateQueries(['daily-summary']);
      setAddItemModal(null);
      setItemForm({ food_item: '', quantity_grams: '100' });
      setError('');
    },
    onError: (e) => setError(e.message),
  });

  const removeItem = useMutation({
    mutationFn: ({ mealId, itemId }) => nutritionService.removeMealItem(mealId, itemId),
    onSuccess: () => qc.invalidateQueries(['daily-summary']),
  });

  const handleScanAdd = async ({ food_item, quantity_grams }) => {
    if (!daily?.meals?.length) { setError('Please create a meal first, then use food scan.'); return; }
    const mealId = daily.meals[daily.meals.length - 1].id;
    addItem.mutate({ mealId, food_item, quantity_grams: String(quantity_grams) });
  };

  const handleAddFood    = (food) => setMealForm((prev) => ({ ...prev, food_selections: [...prev.food_selections, { food, qty: 100 }] }));
  const handleRemoveFood = (foodId) => setMealForm((prev) => ({ ...prev, food_selections: prev.food_selections.filter((s) => s.food.id !== foodId) }));
  const handleQtyChange  = (foodId, val) => setMealForm((prev) => ({ ...prev, food_selections: prev.food_selections.map((s) => s.food.id === foodId ? { ...s, qty: parseFloat(val) || 0 } : s) }));

  const totalPreview = mealForm.food_selections.reduce(
    (acc, { food, qty }) => ({ cal: acc.cal + (food.cal * qty) / 100, p: acc.p + (food.p * qty) / 100, c: acc.c + (food.c * qty) / 100, f: acc.f + (food.f * qty) / 100 }),
    { cal: 0, p: 0, c: 0, f: 0 }
  );

  const selectedFood   = foodItemsRaw.find((f) => String(f.id) === String(itemForm.food_item));
  const caloriePreview = selectedFood && itemForm.quantity_grams
    ? Math.round((selectedFood.calories_per_100g * parseFloat(itemForm.quantity_grams)) / 100)
    : null;

  const macros = daily ? [
    { label: 'Calories', value: Math.round(daily.total_calories),     unit: 'kcal', tint: TINT.peach  },
    { label: 'Protein',  value: Math.round(daily.total_protein),       unit: 'g',    tint: TINT.sky    },
    { label: 'Carbs',    value: Math.round(daily.total_carbohydrates), unit: 'g',    tint: TINT.butter },
    { label: 'Fat',      value: Math.round(daily.total_fat),           unit: 'g',    tint: TINT.lilac  },
  ] : [];

  return (
    <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden', height:'100%', fontFamily:"'DM Sans',sans-serif", background: BG, padding:14, boxSizing:'border-box' }}>
      <style>{`
        @keyframes skShimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}
        @keyframes mlSpin{to{transform:rotate(360deg)}}
      `}</style>

      {/* Panel */}
      <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden', background:'#fff', borderRadius:24, border:'1px solid rgba(255,255,255,0.9)', boxShadow:'0 4px 24px rgba(180,120,60,0.08)' }}>

        {/* Topbar */}
        <div style={{ background:'#fff', padding:'18px 26px', display:'flex', alignItems:'center', justifyContent:'space-between', borderBottom:'1px solid #F5ECE1', flexShrink:0, gap:12, flexWrap:'wrap' }}>
          <div>
            <h1 style={{ margin:0, fontSize:18, fontWeight:700, color:'#2a1f14' }}>Meal Log</h1>
            <p style={{ margin:'2px 0 0', fontSize:13, color:'#a8967f' }}>Track your daily nutrition intake</p>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              style={{ padding:'9px 13px', border:'1.5px solid #F0E6D2', borderRadius:10, fontSize:13, color:'#2a1f14', fontFamily:'inherit', background:'#FBF4EA' }}
            />
            <button
              onClick={() => setScanOpen(true)}
              style={{ display:'flex', alignItems:'center', gap:6, padding:'9px 14px', background:'#FBF4EA', color:ACCENT_D, border:'1.5px solid #F0E6D2', borderRadius:10, fontSize:13, fontWeight:500, cursor:'pointer', fontFamily:'inherit' }}
            >
              <Search size={15} /> Find Food
            </button>
            <button
              onClick={() => { setMealForm({ meal_type:'', date:selectedDate, food_category:'all', food_selections:[] }); setMealModal(true); }}
              style={{ display:'flex', alignItems:'center', gap:6, padding:'9px 14px', background:ACCENT, color:'#fff', border:'none', borderRadius:10, fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}
            >
              <Plus size={15} /> Add Meal
            </button>
          </div>
        </div>

        {/* Scrollable content */}
        <div style={{ flex:1, overflowY:'auto', padding:'20px 24px', display:'flex', flexDirection:'column', gap:16 }}>

          {/* Error banner */}
          {error && (
            <div style={{ display:'flex', alignItems:'center', gap:8, background:'#fef2f2', border:'1px solid #fecaca', color:'#991b1b', borderRadius:10, padding:'10px 14px', fontSize:13 }}>
              ⚠ {error}
              <button onClick={() => setError('')} style={{ background:'none', border:'none', cursor:'pointer', color:'#991b1b', marginLeft:'auto', display:'flex' }}><X size={14} /></button>
            </div>
          )}

          {/* Macro cards */}
          {isLoading ? (
            <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12 }}>
              {Array(4).fill(null).map((_, i) => (
                <div key={i} style={{ background:'#FBF4EA', borderRadius:12, padding:'14px 16px', border:'1px solid #F0E6D2', display:'flex', flexDirection:'column', gap:8 }}>
                  <Sk w={60} h={28} /><Sk w={50} h={12} />
                </div>
              ))}
            </div>
          ) : daily ? (
            <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12 }}>
              {macros.map(({ label, value, unit, tint }) => (
                <div key={label} style={{ background: tint.bg, borderRadius:12, padding:'14px 16px', border:`1px solid ${tint.border}`, display:'flex', flexDirection:'column', gap:4 }}>
                  <p style={{ margin:0, fontSize:22, fontWeight:700, lineHeight:1.2, color: tint.text }}>
                    {value}<span style={{ fontSize:13, fontWeight:400, color:'#a8967f' }}> {unit}</span>
                  </p>
                  <p style={{ margin:0, fontSize:11, color:'#a8967f' }}>{label}</p>
                </div>
              ))}
            </div>
          ) : null}

          {/* Main content */}
          {isLoading ? (
            <div style={{ display:'flex', justifyContent:'center', padding:'60px 0' }}><Spin /></div>
          ) : !daily?.meals?.length ? (
            <div style={{ background:'#FBF4EA', borderRadius:16, padding:'60px 24px', textAlign:'center', border:'1px solid #F0E6D2', display:'flex', flexDirection:'column', alignItems:'center', gap:10 }}>
              <UtensilsCrossed size={40} color="#c4a882" />
              <p style={{ margin:0, fontSize:16, fontWeight:600, color:'#2a1f14' }}>No meals logged for this day</p>
              <p style={{ margin:0, fontSize:13, color:'#a8967f', marginBottom:6 }}>Start tracking your nutrition by adding a meal or searching for food.</p>
              <div style={{ display:'flex', gap:10 }}>
                <button onClick={() => setScanOpen(true)} style={{ display:'flex', alignItems:'center', gap:6, padding:'9px 14px', background:'#fff', color:ACCENT_D, border:`1.5px solid #F0E6D2`, borderRadius:10, fontSize:13, fontWeight:500, cursor:'pointer', fontFamily:"'DM Sans',sans-serif" }}>
                  <Search size={15} /> Find Food
                </button>
                <button
                  onClick={() => { setMealForm({ meal_type:'', date:selectedDate, food_category:'all', food_selections:[] }); setMealModal(true); }}
                  style={{ display:'flex', alignItems:'center', gap:6, padding:'9px 14px', background:ACCENT, color:'#fff', border:'none', borderRadius:10, fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:"'DM Sans',sans-serif" }}
                >
                  <Plus size={15} /> Log First Meal
                </button>
              </div>
            </div>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
              {/* Chart card */}
              <div style={{ background:'#fffdf9', borderRadius:14, border:'1px solid #F0E6D2', overflow:'hidden' }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end', padding:'14px 18px 10px', borderBottom:'1px solid #F5ECE1' }}>
                  <p style={{ margin:0, fontSize:13, fontWeight:600, color:'#2a1f14' }}>Nutrition Breakdown</p>
                  <p style={{ margin:0, fontSize:11, color:'#a8967f' }}>{format(new Date(selectedDate), 'MMMM d, yyyy')}</p>
                </div>
                <div style={{ padding:'0 16px 16px' }}>
                  <NutritionChart meals={daily.meals} />
                </div>
              </div>

              {/* Meal cards */}
              <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
                {daily.meals.map((meal) => {
                  const mc = MEAL_COLORS[meal.meal_type] || TINT.peach;
                  return (
                    <div key={meal.id} style={{ background:'#fffdf9', borderRadius:14, border:'1px solid #F0E6D2', overflow:'hidden' }}>
                      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 18px', borderBottom:'1px solid #F5ECE1' }}>
                        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                          <span style={{ fontSize:12, fontWeight:600, padding:'3px 10px', borderRadius:20, background: mc.bg, color: mc.text, border:`1px solid ${mc.border}` }}>
                            {meal.meal_type.charAt(0).toUpperCase() + meal.meal_type.slice(1)}
                          </span>
                          <span style={{ fontSize:12, color:'#a8967f' }}>{Math.round(meal.total_calories)} kcal</span>
                        </div>
                        <button
                          onClick={() => setAddItemModal(meal.id)}
                          style={{ display:'flex', alignItems:'center', gap:5, padding:'6px 12px', background:'#FBF4EA', color:ACCENT_D, border:`1px solid #F0E6D2`, borderRadius:8, fontSize:12, fontWeight:500, cursor:'pointer', fontFamily:'inherit' }}
                        >
                          <Plus size={13} /> Add Food
                        </button>
                      </div>

                      {meal.items?.length > 0 ? (
                        <div style={{ display:'flex', flexDirection:'column' }}>
                          {meal.items.map((item) => (
                            <div key={item.id} style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 18px', borderBottom:'1px solid #F5ECE1' }}>
                              <div style={{ flex:1, minWidth:0 }}>
                                <p style={{ margin:0, fontSize:13, fontWeight:500, color:'#2a1f14' }}>{item.food_item_name || 'Food item'}</p>
                                <p style={{ margin:'2px 0 0', fontSize:11, color:'#a8967f' }}>
                                  {item.quantity_grams}g · {Math.round(item.calories)} kcal ·{' '}
                                  {Math.round(item.protein)}g P · {Math.round(item.carbohydrates)}g C
                                </p>
                              </div>
                              <button
                                onClick={() => removeItem.mutate({ mealId: meal.id, itemId: item.id })}
                                style={{ background:'none', border:'none', cursor:'pointer', color:'#F0E6D2', display:'flex', alignItems:'center', padding:4, borderRadius:6, flexShrink:0 }}
                                onMouseEnter={(e) => { e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.background = '#fef2f2'; }}
                                onMouseLeave={(e) => { e.currentTarget.style.color = '#F0E6D2'; e.currentTarget.style.background = 'none'; }}
                                disabled={removeItem.isPending}
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p style={{ padding:'14px 18px', fontSize:13, color:'#a8967f', textAlign:'center', margin:0 }}>
                          No food items added. Use "Add Food" or "Find Food" to search.
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Create Meal Modal ── */}
      {mealModal && (
        <ModalShell title="Log a Meal" onClose={() => { setMealModal(false); setError(''); }}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setError('');
              if (!mealForm.meal_type) { setError('Please select a meal type.'); return; }
              createMeal.mutate(mealForm);
            }}
            style={{ display:'flex', flexDirection:'column', gap:16 }}
          >
            <FormField label="Meal Type *">
              <select style={ms.input} required value={mealForm.meal_type} onChange={(e) => setMealForm({ ...mealForm, meal_type: e.target.value })}>
                <option value="">Select meal type</option>
                <option value="breakfast">Breakfast</option>
                <option value="lunch">Lunch</option>
                <option value="dinner">Dinner</option>
                <option value="snack">Snack</option>
              </select>
            </FormField>

            <FormField label="Date *">
              <input type="date" required style={ms.input} value={mealForm.date} onChange={(e) => setMealForm({ ...mealForm, date: e.target.value })} />
            </FormField>

            <FormField label="Food Category">
              <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                {FOOD_CATEGORIES.map((cat) => (
                  <button
                    key={cat.key}
                    type="button"
                    onClick={() => setMealForm({ ...mealForm, food_category: cat.key })}
                    style={{
                      padding:'5px 12px', fontSize:12, fontWeight:500,
                      borderRadius:20, cursor:'pointer', fontFamily:'inherit',
                      border: `1.5px solid ${mealForm.food_category === cat.key ? ACCENT_D : '#F0E6D2'}`,
                      background: mealForm.food_category === cat.key ? '#FBF4EA' : '#fff',
                      color: mealForm.food_category === cat.key ? ACCENT_D : '#a8967f',
                      transition: 'all .15s',
                    }}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </FormField>

            <FormField label="Search & Add Foods">
              <InlineFoodSearch
                selectedCat={mealForm.food_category}
                selectedFoods={mealForm.food_selections}
                onAdd={handleAddFood}
                onRemove={handleRemoveFood}
                onQtyChange={handleQtyChange}
              />
            </FormField>

            {mealForm.food_selections.length > 0 && (
              <div style={{ background:'#FBF4EA', border:`1px solid #F0E6D2`, borderRadius:10, overflow:'hidden' }}>
                <div style={{ fontSize:12, fontWeight:600, color:'#a8967f', padding:'8px 14px 4px' }}>Meal Nutrition Estimate</div>
                <div style={{ display:'flex', gap:0 }}>
                  {[
                    { label:'Calories', val:`${Math.round(totalPreview.cal)} kcal`, color: ACCENT_D },
                    { label:'Protein',  val:`${Math.round(totalPreview.p)}g`,        color: TINT.sky.text  },
                    { label:'Carbs',    val:`${Math.round(totalPreview.c)}g`,        color: TINT.butter.text },
                    { label:'Fat',      val:`${Math.round(totalPreview.f)}g`,        color: TINT.lilac.text  },
                  ].map((m, i, arr) => (
                    <div key={m.label} style={{ flex:1, textAlign:'center', padding:'8px 4px', borderRight: i < arr.length-1 ? '1px solid #F0E6D2' : 'none' }}>
                      <div style={{ fontSize:14, fontWeight:700, color:m.color }}>{m.val}</div>
                      <div style={{ fontSize:10, color:'#a8967f', marginTop:2 }}>{m.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {error && <div style={{ background:'#fef2f2', border:'1px solid #fecaca', color:'#991b1b', borderRadius:8, padding:'8px 12px', fontSize:13 }}>⚠ {error}</div>}

            <div style={{ display:'flex', gap:10 }}>
              <button type="button" onClick={() => setMealModal(false)} style={ms.cancel}>Cancel</button>
              <button type="submit" style={ms.confirm} disabled={createMeal.isPending}>
                {createMeal.isPending ? 'Creating…' : 'Create Meal'}
              </button>
            </div>
          </form>
        </ModalShell>
      )}

      {/* ── Add Food Item Modal ── */}
      {addItemModal && (
        <ModalShell title="Add Food Item" onClose={() => { setAddItemModal(null); setError(''); setItemForm({ food_item:'', quantity_grams:'100' }); }}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setError('');
              if (!itemForm.food_item) { setError('Please select a food item.'); return; }
              addItem.mutate({ mealId: addItemModal, ...itemForm });
            }}
            style={{ display:'flex', flexDirection:'column', gap:16 }}
          >
            <FormField label="Food Item *">
              <FoodCombobox
                foodItems={foodItemsRaw}
                value={itemForm.food_item}
                onChange={(v) => setItemForm({ ...itemForm, food_item: v })}
                isLoading={foodLoading}
              />
            </FormField>
            <FormField label="Quantity (grams) *">
              <input
                type="number" step="0.1" min="0.1" required
                placeholder="e.g. 150"
                style={ms.input}
                value={itemForm.quantity_grams}
                onChange={(e) => setItemForm({ ...itemForm, quantity_grams: e.target.value })}
              />
            </FormField>

            {caloriePreview !== null && (
              <div style={{ background:'#FBF4EA', border:`1px solid #F0E6D2`, borderRadius:10, padding:'10px 14px', fontSize:13, color:'#2a1f14' }}>
                <span style={{ fontWeight:600, color:ACCENT_D }}>{caloriePreview} kcal</span>
                {' · '}
                {Math.round((selectedFood.protein_per_100g       * parseFloat(itemForm.quantity_grams)) / 100)}g protein
                {' · '}
                {Math.round((selectedFood.carbohydrates_per_100g * parseFloat(itemForm.quantity_grams)) / 100)}g carbs
                {' · '}
                {Math.round((selectedFood.fat_per_100g           * parseFloat(itemForm.quantity_grams)) / 100)}g fat
              </div>
            )}

            {error && <div style={{ background:'#fef2f2', border:'1px solid #fecaca', color:'#991b1b', borderRadius:8, padding:'8px 12px', fontSize:13 }}>⚠ {error}</div>}

            <div style={{ display:'flex', gap:10 }}>
              <button type="button" onClick={() => setAddItemModal(null)} style={ms.cancel}>Cancel</button>
              <button type="submit" style={ms.confirm} disabled={addItem.isPending}>
                {addItem.isPending ? 'Adding…' : 'Add to Meal'}
              </button>
            </div>
          </form>
        </ModalShell>
      )}

      <FoodScanModal
        isOpen={scanOpen}
        onClose={() => setScanOpen(false)}
        onAddFood={handleScanAdd}
      />
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function ModalShell({ title, onClose, children }) {
  return (
    <div style={{ position:'fixed', inset:0, zIndex:900, background:'rgba(42,31,20,.5)', backdropFilter:'blur(3px)', display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}>
      <div style={{ background:'#fffdf9', borderRadius:20, width:'100%', maxWidth:500, boxShadow:'0 20px 50px rgba(180,120,60,0.18)', fontFamily:"'DM Sans', sans-serif", maxHeight:'90vh', display:'flex', flexDirection:'column' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'16px 20px', borderBottom:'1px solid #F5ECE1', flexShrink:0 }}>
          <h3 style={{ margin:0, fontSize:15, fontWeight:700, color:'#2a1f14' }}>{title}</h3>
          <button onClick={onClose} style={{ background:'#FBF4EA', border:'none', borderRadius:8, width:30, height:30, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer' }}>
            <X size={16} color={ACCENT_D} />
          </button>
        </div>
        <div style={{ padding:'20px', overflowY:'auto' }}>{children}</div>
      </div>
    </div>
  );
}

function FormField({ label, children }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
      <label style={{ fontSize:13, fontWeight:600, color:'#2a1f14' }}>{label}</label>
      {children}
    </div>
  );
}

const ms = {
  input: {
    width:'100%', padding:'10px 13px', fontSize:14,
    border:'1.5px solid #F0E6D2', borderRadius:10, color:'#2a1f14',
    fontFamily:'inherit', boxSizing:'border-box', background:'#fffdf9',
  },
  cancel: {
    flex:1, padding:'10px', background:'#FBF4EA', color:'#a8967f',
    border:'1px solid #F0E6D2', borderRadius:10, fontSize:14, cursor:'pointer', fontFamily:'inherit',
  },
  confirm: {
    flex:1, padding:'10px', background: ACCENT, color:'#fff',
    border:'none', borderRadius:10, fontSize:14, fontWeight:600,
    cursor:'pointer', fontFamily:'inherit',
  },
};
