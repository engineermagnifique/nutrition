import { Link, Outlet, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  LayoutDashboard, HeartPulse, Utensils, TrendingUp, Bell, LogOut, Zap, Pill, BarChart2,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { authService } from '../../services/auth.service';

const PRIMARY = '#2E7D32';
const PRIMARY_LIGHT = '#a5d6a7';

const SECTIONS = [
  {
    label: 'Main',
    items: [
      { label: 'Dashboard', to: '/user', exact: true, icon: LayoutDashboard },
      { label: 'Health', to: '/user/health', icon: HeartPulse },
      { label: 'Meals', to: '/user/meals', icon: Utensils },
      { label: 'Medications', to: '/user/medications', icon: Pill },
    ],
  },
  {
    label: 'AI Insights',
    items: [
      { label: 'Recommendations', to: '/user/recommendations', icon: TrendingUp },
      { label: 'Predictions', to: '/user/predictions', icon: Zap },
      { label: 'Weekly Report', to: '/user/weekly-report', icon: BarChart2 },
      { label: 'Alerts', to: '/user/alerts', icon: Bell, badge: true },
    ],
  },
];

export default function UserLayout() {
  const { pathname } = useLocation();
  const { profile, logout } = useAuth();

  const { data: dashboard } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => authService.getDashboard().then((r) => r.data?.data ?? r.data),
    staleTime: 60_000,
  });

  const unreadAlerts = dashboard?.unread_alerts ?? 0;
  const initials = profile?.full_name
    ? profile.full_name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
    : 'U';

  return (
    <div style={s.root}>
      <aside style={s.sidebar}>
        <div style={s.brand}>
          Nu<span style={{ color: PRIMARY_LIGHT }}>Track</span>
        </div>

        {SECTIONS.map(({ label, items }) => (
          <div key={label}>
            <p style={s.sectionLabel}>{label}</p>
            {items.map(({ label: lbl, to, icon: Icon, badge, exact }) => {
              const active = exact ? pathname === to : pathname.startsWith(to);
              return (
                <Link key={to} to={to} style={{ ...s.navItem, ...(active ? s.navActive : {}) }}>
                  <Icon size={15} />
                  <span style={{ flex: 1 }}>{lbl}</span>
                  {badge && unreadAlerts > 0 && (
                    <span style={s.badge}>{unreadAlerts}</span>
                  )}
                </Link>
              );
            })}
          </div>
        ))}

        <div style={s.footer}>
          <div style={s.avatar}>{initials}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={s.avatarName}>{profile?.full_name?.split(' ')[0] ?? 'User'}</p>
            <span style={s.avatarRole}>Member</span>
          </div>
          <button onClick={logout} title="Log out" style={s.logoutBtn}>
            <LogOut size={14} />
          </button>
        </div>
      </aside>

      <div style={s.main}>
        <Outlet />
      </div>
    </div>
  );
}

const s = {
  root: {
    display: 'flex',
    height: '100vh',
    background: '#f2f5f2',
    fontFamily: "'DM Sans', sans-serif",
    overflow: 'hidden',
  },
  sidebar: {
    width: 240,
    background: PRIMARY,
    flexShrink: 0,
    display: 'flex',
    flexDirection: 'column',
    padding: '20px 0',
    overflowY: 'auto',
  },
  brand: {
    fontSize: 17,
    fontWeight: 700,
    color: '#fff',
    padding: '0 20px 24px',
    letterSpacing: '-0.3px',
  },
  sectionLabel: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.35)',
    textTransform: 'uppercase',
    letterSpacing: '1px',
    padding: '14px 20px 5px',
    margin: 0,
  },
  navItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '10px 20px',
    fontSize: 13,
    color: 'rgba(255,255,255,0.6)',
    textDecoration: 'none',
    borderLeft: '3px solid transparent',
    transition: 'all 0.15s',
  },
  navActive: {
    color: '#fff',
    background: 'rgba(255,255,255,0.13)',
    borderLeftColor: PRIMARY_LIGHT,
  },
  badge: {
    background: '#ef4444',
    color: '#fff',
    fontSize: 10,
    fontWeight: 700,
    padding: '1px 6px',
    borderRadius: 20,
    minWidth: 18,
    textAlign: 'center',
  },
  footer: {
    marginTop: 'auto',
    padding: '14px 20px',
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    borderTop: '1px solid rgba(255,255,255,0.12)',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: '50%',
    background: PRIMARY_LIGHT,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 11,
    fontWeight: 700,
    color: '#1b5e20',
    flexShrink: 0,
  },
  avatarName: {
    margin: 0,
    fontSize: 12,
    color: '#fff',
    fontWeight: 500,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  avatarRole: { fontSize: 11, color: 'rgba(255,255,255,0.5)' },
  logoutBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: 4,
    color: 'rgba(255,255,255,0.4)',
    display: 'flex',
    alignItems: 'center',
    borderRadius: 4,
  },
  main: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    minWidth: 0,
  },
};
