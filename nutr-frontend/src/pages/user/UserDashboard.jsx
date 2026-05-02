import { useQuery } from '@tanstack/react-query';
import { Activity, Scale, Target, Bell, TrendingUp, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { authService } from '../../services/auth.service';
import { nutritionService } from '../../services/nutrition.service';
import { format } from 'date-fns';
import Card, { CardHeader } from '../../components/ui/Card';
import Spinner from '../../components/ui/Spinner';
import WeightChart from '../../components/charts/WeightChart';
import NutritionChart from '../../components/charts/NutritionChart';
import Button from '../../components/ui/Button';

function StatCard({ label, value, unit, icon: Icon, color, sub }) {
  return (
    <Card className="flex items-start gap-4">
      <div className={`h-12 w-12 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
        <Icon className="h-6 w-6 text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-gray-500">{label}</p>
        <p className="text-2xl font-bold text-gray-900">{value ?? '—'} <span className="text-sm font-normal text-gray-500">{unit}</span></p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </Card>
  );
}

export default function UserDashboard() {
  const { profile } = useAuth();

  const { data: dashboard, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => authService.getDashboard().then((r) => r.data.data),
  });

  const { data: daily } = useQuery({
    queryKey: ['daily-summary', format(new Date(), 'yyyy-MM-dd')],
    queryFn: () => nutritionService.getDailySummary({ date: format(new Date(), 'yyyy-MM-dd') }).then((r) => r.data.data),
  });

  const health = dashboard?.latest_health_record;

  if (isLoading) return <div className="flex items-center justify-center h-64"><Spinner size="lg" /></div>;

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Good day, {profile?.full_name?.split(' ')[0]} 👋</h1>
          <p className="text-gray-500 text-sm mt-1">{format(new Date(), 'EEEE, MMMM d, yyyy')}</p>
        </div>
        <div className="flex gap-2">
          <Link to="/user/meals"><Button size="sm" variant="outline"><Plus className="h-4 w-4" /> Log Meal</Button></Link>
          <Link to="/user/health"><Button size="sm"><Plus className="h-4 w-4" /> Log Health</Button></Link>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Current Weight" value={health?.weight} unit="kg" icon={Scale} color="bg-primary-800" sub={health ? `BMI: ${parseFloat(health.bmi).toFixed(1)}` : null} />
        <StatCard label="Today's Calories" value={daily ? Math.round(daily.total_calories) : null} unit="kcal" icon={Activity} color="bg-secondary-800" sub={daily ? `Protein: ${Math.round(daily.total_protein)}g` : null} />
        <StatCard label="Unread Alerts" value={dashboard?.unread_alerts ?? 0} unit="" icon={Bell} color={dashboard?.unread_alerts > 0 ? 'bg-red-500' : 'bg-gray-400'} sub="Review your alerts" />
        <StatCard label="BMI Category" value={health?.bmi_category ?? 'No data'} unit="" icon={TrendingUp} color="bg-purple-600" sub={health ? `${parseFloat(health.bmi).toFixed(1)} BMI` : null} />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader title="Weight Trend" subtitle="Last 12 health records" action={<Link to="/user/health" className="text-xs text-primary-800 hover:underline">View all →</Link>} />
          <WeightChart records={dashboard?.health_records || (health ? [health] : [])} />
        </Card>

        <Card>
          <CardHeader title="Today's Nutrition" subtitle={format(new Date(), 'MMMM d, yyyy')} action={<Link to="/user/meals" className="text-xs text-primary-800 hover:underline">Log meals →</Link>} />
          <NutritionChart meals={daily?.meals || []} />
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader title="Latest Health Record" action={<Link to="/user/health" className="text-xs text-primary-800 hover:underline">Add new →</Link>} />
          {health ? (
            <dl className="grid grid-cols-2 gap-4">
              {[
                ['Weight', `${health.weight} kg`],
                ['Height', `${health.height} cm`],
                ['BMI', parseFloat(health.bmi).toFixed(2)],
                ['Category', health.bmi_category],
                ['Activity', health.activity_level?.replace('_', ' ')],
                ['Recorded', format(new Date(health.recorded_at), 'MMM d, yyyy')],
              ].map(([k, v]) => (
                <div key={k}>
                  <dt className="text-xs text-gray-500">{k}</dt>
                  <dd className="text-sm font-semibold text-gray-900 capitalize">{v}</dd>
                </div>
              ))}
            </dl>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500 text-sm mb-4">No health records yet.</p>
              <Link to="/user/health"><Button size="sm">Log Your First Record</Button></Link>
            </div>
          )}
        </Card>

        <Card>
          <CardHeader title="Quick Actions" />
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Log Meal', to: '/user/meals', icon: Activity, color: 'text-primary-800 bg-primary-50' },
              { label: 'Health Record', to: '/user/health', icon: Scale, color: 'text-secondary-800 bg-secondary-50' },
              { label: 'Recommendations', to: '/user/recommendations', icon: TrendingUp, color: 'text-purple-700 bg-purple-50' },
              { label: 'View Alerts', to: '/user/alerts', icon: Bell, color: 'text-orange-700 bg-orange-50' },
            ].map(({ label, to, icon: Icon, color }) => (
              <Link key={label} to={to} className={`flex items-center gap-3 p-4 rounded-xl border border-gray-100 hover:shadow-sm transition-shadow ${color.split(' ')[1]}`}>
                <Icon className={`h-5 w-5 ${color.split(' ')[0]}`} />
                <span className="text-sm font-medium text-gray-900">{label}</span>
              </Link>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
