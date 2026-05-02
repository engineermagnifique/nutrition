import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Bell, BellOff, CheckCheck } from 'lucide-react';
import { alertsService } from '../../services/alerts.service';
import { format, parseISO } from 'date-fns';
import Card from '../../components/ui/Card';
import Badge, { severityBadge } from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Spinner from '../../components/ui/Spinner';

const alertTypeLabel = {
  health_risk: 'Health Risk',
  abnormal_data: 'Abnormal Data',
  medication: 'Medication',
  goal_missed: 'Goal Missed',
  recommendation: 'Recommendation',
};

function AlertItem({ alert, onMarkRead }) {
  return (
    <div className={`p-4 rounded-xl border transition-all ${alert.is_read ? 'border-gray-100 bg-white opacity-70' : 'border-primary-100 bg-primary-50'}`}>
      <div className="flex items-start gap-3">
        <div className={`flex-shrink-0 mt-0.5 ${alert.is_read ? 'text-gray-400' : 'text-primary-700'}`}>
          {alert.is_read ? <BellOff className="h-5 w-5" /> : <Bell className="h-5 w-5" />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <p className="font-semibold text-gray-900 text-sm">{alert.title}</p>
            <Badge variant={severityBadge(alert.severity)} className="capitalize">{alert.severity}</Badge>
            <Badge variant="gray">{alertTypeLabel[alert.alert_type] || alert.alert_type}</Badge>
          </div>
          <p className="text-sm text-gray-700 mb-2">{alert.message}</p>
          <p className="text-xs text-gray-400">{format(parseISO(alert.created_at), 'MMM d, yyyy · h:mm a')}</p>
        </div>
        {!alert.is_read && (
          <button onClick={() => onMarkRead(alert.id)} className="flex-shrink-0 text-xs text-primary-800 hover:underline font-medium whitespace-nowrap">
            Mark read
          </button>
        )}
      </div>
    </div>
  );
}

export default function UserAlerts() {
  const qc = useQueryClient();

  const { data: alerts = [], isLoading } = useQuery({
    queryKey: ['alerts'],
    queryFn: () => alertsService.getAlerts().then((r) => r.data),
  });

  const markRead = useMutation({
    mutationFn: (id) => alertsService.markRead(id),
    onSuccess: () => qc.invalidateQueries(['alerts']),
  });

  const markAllRead = useMutation({
    mutationFn: () => alertsService.markAllRead(),
    onSuccess: () => qc.invalidateQueries(['alerts']),
  });

  const unread = alerts.filter((a) => !a.is_read);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Alerts</h1>
          <p className="text-sm text-gray-500 mt-1">
            {unread.length > 0 ? `${unread.length} unread alert${unread.length !== 1 ? 's' : ''}` : 'All alerts read'}
          </p>
        </div>
        {unread.length > 0 && (
          <Button variant="outline" size="sm" onClick={() => markAllRead.mutate()} loading={markAllRead.isPending}>
            <CheckCheck className="h-4 w-4" /> Mark All Read
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Spinner size="lg" /></div>
      ) : alerts.length === 0 ? (
        <Card className="text-center py-12">
          <Bell className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">No alerts yet.</p>
          <p className="text-sm text-gray-400">You'll be notified here about important health updates.</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {unread.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Unread</h3>
              <div className="space-y-2">
                {unread.map((a) => <AlertItem key={a.id} alert={a} onMarkRead={(id) => markRead.mutate(id)} />)}
              </div>
            </div>
          )}
          {alerts.filter((a) => a.is_read).length > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2 mt-4">Read</h3>
              <div className="space-y-2">
                {alerts.filter((a) => a.is_read).map((a) => <AlertItem key={a.id} alert={a} onMarkRead={(id) => markRead.mutate(id)} />)}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
