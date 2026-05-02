import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function NutritionChart({ meals = [] }) {
  const data = meals.map((m) => ({
    meal: m.meal_type.charAt(0).toUpperCase() + m.meal_type.slice(1),
    Calories: Math.round(parseFloat(m.total_calories || 0)),
    Protein: Math.round(parseFloat(m.total_protein || 0)),
    Carbs: Math.round(parseFloat(m.total_carbohydrates || 0)),
    Fat: Math.round(parseFloat(m.total_fat || 0)),
  }));

  if (data.length === 0) {
    return <div className="h-48 flex items-center justify-center text-sm text-gray-400">No meals logged today.</div>;
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis dataKey="meal" tick={{ fontSize: 11 }} />
        <YAxis tick={{ fontSize: 11 }} />
        <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 12 }} />
        <Legend wrapperStyle={{ fontSize: 11 }} />
        <Bar dataKey="Calories" fill="#2E7D32" radius={[4, 4, 0, 0]} />
        <Bar dataKey="Protein" fill="#1565C0" radius={[4, 4, 0, 0]} />
        <Bar dataKey="Carbs" fill="#F59E0B" radius={[4, 4, 0, 0]} />
        <Bar dataKey="Fat" fill="#EF4444" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
