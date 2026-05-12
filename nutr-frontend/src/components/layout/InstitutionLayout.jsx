import { Link, Outlet, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  LayoutDashboard, Users, Bell, LogOut, TrendingUp, Building2,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { authService } from '../../services/auth.service';

const PRIMARY = '#2E7D32';
const PRIMARY_LIGHT = '#a5d6a7';

const SECTIONS = [
  {
    label: 'Management',
    items: [
      { label: 'Overview', to: '/institution', exact: true, icon: LayoutDashboard },
      { label: 'Members', to: '/institution/users', icon: Users },
    ],
  },
  {
    label: 'AI & Monitoring',
    items: [
      { label: 'Recommendations', to: '/institution/recommendations', icon: TrendingUp },
      { label: 'Alerts', to: '/institution/alerts', icon: Bell, badge: true },
    ],
  },
];

export default function InstitutionLayout() {
  const { pathname } = useLocation();
  const { profile, logout } = useAuth();

  const { data: dashboard } = useQuery({
    queryKey: ['institution-dashboard'],
    queryFn: () => authService.getDashboard().then((r) => r.data?.data ?? r.data),
    staleTime: 60_000,
  });

  const unreadAlerts = dashboard?.unread_alerts ?? 0;

  const institutionName = profile?.full_name ?? profile?.institution_name ?? 'Institution';
  const initials = institutionName
    ? institutionName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
    : 'IN';

  return (
    <div style={s.root}>
      <aside style={s.sidebar}>
        <div style={s.brand}>
          <Building2 size={16} color={PRIMARY_LIGHT} style={{ flexShrink: 0 }} />
          <span>Nu<span style={{ color: PRIMARY_LIGHT }}>Track</span> <span style={{ fontSize: 10, opacity: 0.6, fontWeight: 400 }}>Inst.</span></span>
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
            <p style={s.avatarName}>{institutionName}</p>
            <span style={s.avatarRole}>Institution</span>
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
    display: 'flex',
    alignItems: 'center',
    gap: 8,
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
    overflowY: 'auto',
    minWidth: 0,
  },
};
