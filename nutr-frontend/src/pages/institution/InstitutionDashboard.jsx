import { useQuery } from '@tanstack/react-query';
import { Users, UserCheck, Bell, Building2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { authService } from '../../services/auth.service';
import { alertsService } from '../../services/alerts.service';
import { useAuth } from '../../context/AuthContext';
import { format, parseISO } from 'date-fns';
import Card, { CardHeader } from '../../components/ui/Card';
import Badge, { severityBadge } from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Spinner from '../../components/ui/Spinner';

function StatCard({ label, value, icon: Icon, color, action }) {
  return (
    <Card className="flex items-center gap-4">
      <div className={`h-12 w-12 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
        <Icon className="h-6 w-6 text-white" />
      </div>
      <div className="flex-1">
        <p className="text-sm text-gray-500">{label}</p>
        <p className="text-3xl font-bold text-gray-900">{value ?? '—'}</p>
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </Card>
  );
}

export default function InstitutionDashboard() {
  const { profile } = useAuth();

  const { data: dashboard, isLoading } = useQuery({
    queryKey: ['institution-dashboard'],
    queryFn: () => authService.getDashboard().then((r) => r.data.data),
  });

  const { data: recentAlerts = [] } = useQuery({
    queryKey: ['alerts', 'institution'],
    queryFn: () => alertsService.getAlerts({ is_read: false }).then((r) => r.data.slice(0, 5)),
  });

  const { data: members = [] } = useQuery({
    queryKey: ['institution-users'],
    queryFn: () => authService.getInstitutionUsers().then((r) => r.data.slice(0, 5)),
  });

  if (isLoading) return <div className="flex items-center justify-center h-64"><Spinner size="lg" /></div>;

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Building2 className="h-5 w-5 text-primary-800" />
            <span className="text-sm font-medium text-gray-500">{dashboard?.institution?.name}</span>
            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-mono">{dashboard?.institution?.institution_id}</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Institution Overview</h1>
          <p className="text-sm text-gray-500 mt-1">{format(new Date(), 'EEEE, MMMM d, yyyy')}</p>
        </div>
        <Link to="/institution/users">
          <Button><Users className="h-4 w-4" /> Manage Members</Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Total Members" value={dashboard?.total_members} icon={Users} color="bg-primary-800" action={<Link to="/institution/users" className="text-xs text-primary-800 hover:underline">View →</Link>} />
        <StatCard label="Active Members" value={dashboard?.active_members} icon={UserCheck} color="bg-secondary-800" />
        <StatCard label="Unread Alerts" value={dashboard?.unread_alerts} icon={Bell} color={dashboard?.unread_alerts > 0 ? 'bg-red-500' : 'bg-gray-400'} action={dashboard?.unread_alerts > 0 ? <Link to="/institution/alerts" className="text-xs text-red-600 hover:underline">View →</Link> : null} />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader
            title="Recent Members"
            subtitle="Latest registered users"
            action={<Link to="/institution/users" className="text-xs text-primary-800 hover:underline">View all →</Link>}
          />
          {members.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">No members registered yet.</p>
          ) : (
            <div className="space-y-3">
              {members.map((m) => (
                <Link key={m.id} to={`/institution/users/${m.id}`} className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors">
                  <div className="h-9 w-9 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-semibold text-primary-800">{m.full_name?.[0]?.toUpperCase()}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{m.full_name}</p>
                    <p className="text-xs text-gray-500 truncate">{m.email}</p>
                  </div>
                  <Badge variant={m.is_active ? 'green' : 'gray'}>{m.is_active ? 'Active' : 'Inactive'}</Badge>
                </Link>
              ))}
            </div>
          )}
        </Card>

        <Card>
          <CardHeader
            title="Recent Alerts"
            subtitle="Unread health alerts"
            action={<Link to="/institution/alerts" className="text-xs text-primary-800 hover:underline">View all →</Link>}
          />
          {recentAlerts.length === 0 ? (
            <div className="text-center py-6">
              <Bell className="h-8 w-8 text-gray-200 mx-auto mb-2" />
              <p className="text-sm text-gray-400">No unread alerts. All clear!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentAlerts.map((a) => (
                <div key={a.id} className="flex items-start gap-3 p-3 rounded-xl bg-red-50 border border-red-100">
                  <Bell className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">{a.title}</p>
                    <p className="text-xs text-gray-500 truncate">{a.user_name} · {format(parseISO(a.created_at), 'MMM d')}</p>
                  </div>
                  <Badge variant={severityBadge(a.severity)} className="capitalize">{a.severity}</Badge>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
