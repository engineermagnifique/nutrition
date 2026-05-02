import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Bell, CheckCheck, Filter } from 'lucide-react';
import { alertsService } from '../../services/alerts.service';
import { format, parseISO } from 'date-fns';
import Card from '../../components/ui/Card';
import Badge, { severityBadge } from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Select from '../../components/ui/Select';
import Spinner from '../../components/ui/Spinner';

export default function InstitutionAlerts() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState({ severity: '', alert_type: '', is_read: '' });

  const params = {};
  if (filter.severity) params.severity = filter.severity;
  if (filter.alert_type) params.alert_type = filter.alert_type;
  if (filter.is_read !== '') params.is_read = filter.is_read === 'true';

  const { data: alerts = [], isLoading } = useQuery({
    queryKey: ['institution-alerts', filter],
    queryFn: () => alertsService.getAlerts(params).then((r) => r.data),
  });

  const markRead = useMutation({
    mutationFn: (id) => alertsService.markRead(id),
    onSuccess: () => qc.invalidateQueries(['institution-alerts']),
  });

  const markAllRead = useMutation({
    mutationFn: () => alertsService.markAllRead(),
    onSuccess: () => qc.invalidateQueries(['institution-alerts']),
  });

  const unreadCount = alerts.filter((a) => !a.is_read).length;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Alerts</h1>
          <p className="text-sm text-gray-500 mt-1">{unreadCount > 0 ? `${unreadCount} unread alerts across your members` : 'All alerts are read'}</p>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" size="sm" onClick={() => markAllRead.mutate()} loading={markAllRead.isPending}>
            <CheckCheck className="h-4 w-4" /> Mark All Read
          </Button>
        )}
      </div>

      <div className="flex flex-wrap gap-3">
        <Select value={filter.severity} onChange={(e) => setFilter({ ...filter, severity: e.target.value })} className="w-40" placeholder="All Severities">
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
          <option value="critical">Critical</option>
        </Select>
        <Select value={filter.alert_type} onChange={(e) => setFilter({ ...filter, alert_type: e.target.value })} className="w-48" placeholder="All Types">
          <option value="health_risk">Health Risk</option>
          <option value="abnormal_data">Abnormal Data</option>
          <option value="medication">Medication</option>
          <option value="goal_missed">Goal Missed</option>
          <option value="recommendation">Recommendation</option>
        </Select>
        <Select value={filter.is_read} onChange={(e) => setFilter({ ...filter, is_read: e.target.value })} className="w-36" placeholder="All Status">
          <option value="false">Unread</option>
          <option value="true">Read</option>
        </Select>
        {(filter.severity || filter.alert_type || filter.is_read) && (
          <Button variant="ghost" size="sm" onClick={() => setFilter({ severity: '', alert_type: '', is_read: '' })}>
            Clear filters
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Spinner size="lg" /></div>
      ) : alerts.length === 0 ? (
        <Card className="text-center py-12">
          <Bell className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">No alerts found.</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {alerts.map((a) => (
            <div key={a.id} className={`p-4 rounded-xl border transition-all ${!a.is_read ? 'border-red-200 bg-red-50' : 'border-gray-100 bg-white'}`}>
              <div className="flex items-start gap-3">
                <Bell className={`h-5 w-5 flex-shrink-0 mt-0.5 ${!a.is_read ? 'text-red-500' : 'text-gray-400'}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <p className="font-semibold text-gray-900 text-sm">{a.title}</p>
                    <Badge variant={severityBadge(a.severity)} className="capitalize">{a.severity}</Badge>
                    {a.user_name && <span className="text-xs text-gray-500">→ {a.user_name}</span>}
                  </div>
                  <p className="text-sm text-gray-700 mb-2">{a.message}</p>
                  <p className="text-xs text-gray-400">{format(parseISO(a.created_at), 'MMM d, yyyy · h:mm a')}</p>
                </div>
                {!a.is_read && (
                  <button onClick={() => markRead.mutate(a.id)} className="text-xs text-primary-800 hover:underline font-medium whitespace-nowrap">
                    Mark read
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
