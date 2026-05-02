import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format, parseISO } from 'date-fns';

export default function WeightChart({ records = [] }) {
  const data = [...records]
    .sort((a, b) => new Date(a.recorded_at) - new Date(b.recorded_at))
    .slice(-12)
    .map((r) => ({
      date: format(parseISO(r.recorded_at), 'MMM d'),
      weight: parseFloat(r.weight),
      bmi: parseFloat(r.bmi),
    }));

  if (data.length === 0) {
    return <div className="h-48 flex items-center justify-center text-sm text-gray-400">No health records yet.</div>;
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis dataKey="date" tick={{ fontSize: 11 }} />
        <YAxis tick={{ fontSize: 11 }} />
        <Tooltip
          contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 12 }}
          formatter={(v, n) => [`${v} ${n === 'weight' ? 'kg' : ''}`, n === 'weight' ? 'Weight' : 'BMI']}
        />
        <Line type="monotone" dataKey="weight" stroke="#2E7D32" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
      </LineChart>
    </ResponsiveContainer>
  );
}
