import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import { healthService } from '../../services/health.service';
import { format, parseISO } from 'date-fns';
import Card, { CardHeader } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Modal from '../../components/ui/Modal';
import Table from '../../components/ui/Table';
import Alert from '../../components/ui/Alert';
import Badge from '../../components/ui/Badge';
import WeightChart from '../../components/charts/WeightChart';

const bmiColor = (cat) => {
  if (!cat) return 'gray';
  if (cat.toLowerCase().includes('normal')) return 'green';
  if (cat.toLowerCase().includes('under')) return 'yellow';
  return 'red';
};

export default function HealthRecords() {
  const qc = useQueryClient();
  const [modal, setModal] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ weight: '', height: '', activity_level: '', notes: '' });

  const { data: records = [], isLoading } = useQuery({
    queryKey: ['health-records'],
    queryFn: () => healthService.getRecords().then((r) => r.data),
  });

  const mutation = useMutation({
    mutationFn: (data) => healthService.createRecord(data),
    onSuccess: () => { qc.invalidateQueries(['health-records']); setModal(false); setForm({ weight: '', height: '', activity_level: '', notes: '' }); },
    onError: (err) => setError(err.message),
  });

  const columns = [
    { key: 'recorded_at', label: 'Date', render: (r) => format(parseISO(r.recorded_at), 'MMM d, yyyy') },
    { key: 'weight', label: 'Weight', render: (r) => `${r.weight} kg` },
    { key: 'height', label: 'Height', render: (r) => `${r.height} cm` },
    { key: 'bmi', label: 'BMI', render: (r) => parseFloat(r.bmi).toFixed(2) },
    { key: 'bmi_category', label: 'Category', render: (r) => <Badge variant={bmiColor(r.bmi_category)}>{r.bmi_category}</Badge> },
    { key: 'activity_level', label: 'Activity', render: (r) => <span className="capitalize">{r.activity_level?.replace(/_/g, ' ')}</span> },
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    mutation.mutate(form);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Health Records</h1>
          <p className="text-sm text-gray-500 mt-1">Track your weight, BMI, and activity levels over time.</p>
        </div>
        <Button onClick={() => setModal(true)}><Plus className="h-4 w-4" /> Add Record</Button>
      </div>

      <Card>
        <CardHeader title="Weight Trend" subtitle="Historical weight progression" />
        <WeightChart records={records} />
      </Card>

      <Card padding={false}>
        <div className="p-6 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900">All Records</h3>
        </div>
        <Table columns={columns} data={records} loading={isLoading} emptyMessage="No health records yet. Add your first record." />
      </Card>

      <Modal isOpen={modal} onClose={() => { setModal(false); setError(''); }} title="Log Health Record">
        {error && <Alert type="error" message={error} onClose={() => setError('')} className="mb-4" />}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="Weight (kg)" type="number" step="0.1" min="20" max="300" placeholder="70.5" required value={form.weight} onChange={(e) => setForm({ ...form, weight: e.target.value })} />
            <Input label="Height (cm)" type="number" step="0.1" min="50" max="250" placeholder="165" required value={form.height} onChange={(e) => setForm({ ...form, height: e.target.value })} />
          </div>
          <Select label="Activity Level" required value={form.activity_level} onChange={(e) => setForm({ ...form, activity_level: e.target.value })} placeholder="Select activity level">
            <option value="sedentary">Sedentary (little or no exercise)</option>
            <option value="lightly_active">Lightly Active (1–3 days/week)</option>
            <option value="moderately_active">Moderately Active (3–5 days/week)</option>
            <option value="very_active">Very Active (6–7 days/week)</option>
            <option value="extra_active">Extra Active (twice daily)</option>
          </Select>
          <Input label="Notes (optional)" placeholder="Any additional notes..." value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => setModal(false)} className="flex-1">Cancel</Button>
            <Button type="submit" loading={mutation.isPending} className="flex-1">Save Record</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
