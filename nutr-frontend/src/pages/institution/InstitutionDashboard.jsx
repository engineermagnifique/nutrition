import { useQuery } from '@tanstack/react-query';
import {
  Users, UserCheck, Bell, Building2, ChevronRight,
  AlertTriangle, CheckCircle, TrendingUp, Activity,
  ShieldAlert, ArrowUpRight, UserPlus,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { authService } from '../../services/auth.service';
import { alertsService } from '../../services/alerts.service';
import { useAuth } from '../../context/AuthContext';
import { format, parseISO, formatDistanceToNow } from 'date-fns';

// ─── design tokens ────────────────────────────────────────────────────────────
const P   = '#2E7D32';
const BG  = '#F0F4F0';

const SEV = {
  critical: { bg: '#FEF2F2', border: '#FECACA', text: '#991B1B', dot: '#DC2626', label: 'Critical' },
  high:     { bg: '#FFF7ED', border: '#FED7AA', text: '#9A3412', dot: '#EA580C', label: 'High'     },
  medium:   { bg: '#FFFBEB', border: '#FDE68A', text: '#92400E', dot: '#D97706', label: 'Medium'   },
  low:      { bg: '#F0FDF4', border: '#BBF7D0', text: '#166534', dot: '#16A34A', label: 'Low'      },
};

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function Sk({ w = '100%', h = 14, r = 6 }) {
  return <div style={{ width: w, height: h, borderRadius: r, background: 'linear-gradient(90deg,#e8ede8 25%,#d4e0d4 50%,#e8ede8 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.4s ease-in-out infinite', flexShrink: 0 }} />;
}

// ─── Avatar initials ─────────────────────────────────────────────────────────
function Avatar({ name, size = 40, bg = '#e8f5e9', color = P }) {
  const initials = name ? name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase() : '?';
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', background: bg, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.3, fontWeight: 700, color, letterSpacing: '-0.5px' }}>
      {initials}
    </div>
  );
}

// ─── Shared Card ─────────────────────────────────────────────────────────────
function Card({ children, style }) {
  return (
    <div style={{ background: '#fff', borderRadius: 16, border: '1px solid rgba(0,0,0,0.06)', boxShadow: '0 1px 4px rgba(0,0,0,0.04)', ...style }}>
      {children}
    </div>
  );
}

function CardHead({ title, sub, action }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', padding: '18px 20px 0', gap: 8 }}>
      <div>
        <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#111' }}>{title}</p>
        {sub && <p style={{ margin: '2px 0 0', fontSize: 11, color: '#9ca3af' }}>{sub}</p>}
      </div>
      {action}
    </div>
  );
}

// ─── Risk bar ─────────────────────────────────────────────────────────────────
function RiskBar({ label, count, total, color, bg }) {
  const pct = total > 0 ? (count / total) * 100 : 0;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <span style={{ fontSize: 12, color: '#6b7280', width: 60, flexShrink: 0 }}>{label}</span>
      <div style={{ flex: 1, height: 8, background: '#f3f4f6', borderRadius: 99, overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 99, transition: 'width 0.8s ease' }} />
      </div>
      <span style={{ fontSize: 12, fontWeight: 700, color, minWidth: 28, textAlign: 'right' }}>{count}</span>
      <span style={{ fontSize: 11, color: '#9ca3af', width: 34, textAlign: 'right' }}>{Math.round(pct)}%</span>
    </div>
  );
}

// ─── Main dashboard ───────────────────────────────────────────────────────────
export default function InstitutionDashboard() {
  const { profile } = useAuth();

  const { data: dashboard, isLoading } = useQuery({
    queryKey: ['institution-dashboard'],
    queryFn: () => authService.getDashboard().then((r) => r.data?.data ?? r.data),
    staleTime: 60_000,
  });

  const { data: allAlerts = [], isLoading: alertsLoading } = useQuery({
    queryKey: ['institution-alerts-recent'],
    queryFn: () => alertsService.getAlerts({ page_size: 20 }).then((r) => {
      const d = r.data;
      return d?.results ?? (Array.isArray(d) ? d : []);
    }),
    staleTime: 60_000,
  });

  const { data: members = [], isLoading: membersLoading } = useQuery({
    queryKey: ['institution-users'],
    queryFn: () => authService.getInstitutionUsers({ page_size: 50 }).then((r) => {
      const d = r.data;
      return d?.results ?? (Array.isArray(d) ? d : []);
    }),
    staleTime: 60_000,
  });

  const institution = dashboard?.institution;
  const totalMembers  = dashboard?.total_members  ?? members.length;
  const activeMembers = dashboard?.active_members ?? members.filter((m) => m.is_active).length;
  const unreadAlerts  = dashboard?.unread_alerts  ?? allAlerts.filter((a) => !a.is_read).length;

  const unreadList   = allAlerts.filter((a) => !a.is_read).slice(0, 6);
  const recentMembers = [...members].sort((a, b) => new Date(b.date_joined ?? 0) - new Date(a.date_joined ?? 0)).slice(0, 8);

  // Derive risk distribution from alerts
  const riskCounts = allAlerts.reduce((acc, a) => {
    const s = a.severity === 'critical' ? 'critical' : a.severity === 'high' ? 'high' : a.severity === 'medium' ? 'medium' : 'low';
    acc[s] = (acc[s] || 0) + 1;
    return acc;
  }, { critical: 0, high: 0, medium: 0, low: 0 });
  const totalAlerts = allAlerts.length;

  const highRiskCount = riskCounts.critical + riskCounts.high;
  const institutionName = institution?.name ?? profile?.institution?.name ?? 'Institution';

  return (
    <div style={s.root}>
      <style>{`
        @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
        @keyframes fadeUp  { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        .inst-card { animation: fadeUp 0.35s ease both; }
        .member-row:hover { background:#f8fdf8 !important; }
        .alert-row:hover  { background:#fffbeb !important; }
      `}</style>

      {/* ── Header ───────────────────────────────────────────────────── */}
      <div style={s.topbar}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <Building2 size={16} color={P} />
            <span style={{ fontSize: 13, fontWeight: 600, color: P }}>{institutionName}</span>
            {institution?.institution_id && (
              <span style={{ fontSize: 11, color: '#9ca3af', background: '#f3f4f6', borderRadius: 6, padding: '1px 8px', fontFamily: 'monospace' }}>
                {institution.institution_id}
              </span>
            )}
          </div>
          <h1 style={s.pageTitle}>Institution Overview</h1>
          <p style={s.pageDate}>{format(new Date(), 'EEEE, MMMM d, yyyy')}</p>
        </div>
        <div style={{ display: 'flex', gap: 10, flexShrink: 0, flexWrap: 'wrap' }}>
          <Link to="/institution/alerts" style={s.btnOutline}>
            <Bell size={13} />
            Alerts
            {unreadAlerts > 0 && <span style={s.alertPill}>{unreadAlerts}</span>}
          </Link>
          <Link to="/institution/users" style={s.btnPrimary}>
            <Users size={13} /> Manage Members
          </Link>
        </div>
      </div>

      {/* ── Content ───────────────────────────────────────────────────── */}
      <div style={s.content}>

        {/* ── 4 Stat Cards ─── */}
        <div style={s.statGrid}>
          {[
            {
              label: 'Total Members', value: totalMembers,
              icon: Users, delay: '0ms',
              gradient: 'linear-gradient(135deg,#2E7D32,#388E3C)',
              sub: `${activeMembers} active`,
              link: '/institution/users',
            },
            {
              label: 'Active Members', value: activeMembers,
              icon: UserCheck, delay: '60ms',
              gradient: 'linear-gradient(135deg,#1565C0,#1976D2)',
              sub: totalMembers > 0 ? `${Math.round(activeMembers / totalMembers * 100)}% engagement` : '—',
              link: '/institution/users',
            },
            {
              label: 'High-Risk Alerts', value: highRiskCount,
              icon: ShieldAlert, delay: '120ms',
              gradient: highRiskCount > 0 ? 'linear-gradient(135deg,#C62828,#D32F2F)' : 'linear-gradient(135deg,#616161,#757575)',
              sub: highRiskCount > 0 ? 'Needs attention' : 'All clear',
              link: '/institution/alerts',
              urgent: highRiskCount > 0,
            },
            {
              label: 'Unread Alerts', value: unreadAlerts,
              icon: Bell, delay: '180ms',
              gradient: unreadAlerts > 0 ? 'linear-gradient(135deg,#E65100,#F57C00)' : 'linear-gradient(135deg,#37474F,#455A64)',
              sub: unreadAlerts > 0 ? 'Review promptly' : 'No pending alerts',
              link: '/institution/alerts',
              urgent: unreadAlerts > 0,
            },
          ].map(({ label, value, icon: Icon, delay, gradient, sub, link, urgent }) => (
            <Link key={label} to={link} className="inst-card" style={{ ...s.statCard, animationDelay: delay, textDecoration: 'none' }}>
              {urgent && <div style={s.urgentPulse} />}
              <div style={{ ...s.statGrad, background: gradient }}>
                <Icon size={24} color="#fff" />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={s.statLabel}>{label}</p>
                {isLoading
                  ? <Sk w={60} h={28} r={6} />
                  : <p style={s.statValue}>{value ?? '—'}</p>
                }
                <p style={s.statSub}>{sub}</p>
              </div>
              <ArrowUpRight size={16} color="rgba(0,0,0,0.2)" style={{ flexShrink: 0 }} />
            </Link>
          ))}
        </div>

        {/* ── Alert Risk Distribution ─── */}
        {!alertsLoading && totalAlerts > 0 && (
          <Card className="inst-card" style={{ animationDelay: '200ms' }}>
            <CardHead title="Alert Severity Distribution" sub={`Based on ${totalAlerts} total alerts in your institution`}
              action={<Link to="/institution/alerts" style={s.linkBtn}>View all →</Link>} />
            <div style={{ padding: '16px 20px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
              <RiskBar label="Critical" count={riskCounts.critical} total={totalAlerts} color="#DC2626" bg="#FEF2F2" />
              <RiskBar label="High"     count={riskCounts.high}     total={totalAlerts} color="#EA580C" bg="#FFF7ED" />
              <RiskBar label="Medium"   count={riskCounts.medium}   total={totalAlerts} color="#D97706" bg="#FFFBEB" />
              <RiskBar label="Low"      count={riskCounts.low}      total={totalAlerts} color="#16A34A" bg="#F0FDF4" />
            </div>
          </Card>
        )}

        {/* ── Two column: Members + Alerts ─── */}
        <div style={s.twoCol}>
          {/* Members list */}
          <Card className="inst-card" style={{ animationDelay: '240ms' }}>
            <CardHead
              title="Members"
              sub={`${totalMembers} registered`}
              action={<Link to="/institution/users" style={s.linkBtn}>View all →</Link>}
            />
            <div style={{ padding: '10px 0 8px' }}>
              {membersLoading ? (
                <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {Array(5).fill(null).map((_, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <Sk w={40} h={40} r={99} />
                      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}><Sk h={12} w={120} /><Sk h={10} w={80} /></div>
                    </div>
                  ))}
                </div>
              ) : recentMembers.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '32px 20px' }}>
                  <Users size={36} color="#d1d5db" style={{ margin: '0 auto 10px', display: 'block' }} />
                  <p style={{ margin: 0, fontSize: 13, color: '#9ca3af' }}>No members registered yet.</p>
                  <p style={{ margin: '4px 0 0', fontSize: 12, color: '#d1d5db' }}>Share your institution ID for members to register.</p>
                </div>
              ) : (
                recentMembers.map((m, i) => (
                  <Link key={m.id} to={`/institution/users/${m.id}`} className="member-row" style={{
                    display: 'flex', alignItems: 'center', gap: 12, padding: '10px 20px',
                    borderBottom: i < recentMembers.length - 1 ? '1px solid #f9fafb' : 'none',
                    textDecoration: 'none', transition: 'background 0.15s',
                  }}>
                    <Avatar name={m.full_name} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: '#111', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.full_name}</p>
                      <p style={{ margin: '1px 0 0', fontSize: 11, color: '#9ca3af', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {m.email} {m.age ? `· ${m.age}y` : ''}
                      </p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                      <span style={{
                        fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 20,
                        background: m.is_active ? '#DCFCE7' : '#F3F4F6',
                        color: m.is_active ? '#166534' : '#9CA3AF',
                      }}>{m.is_active ? 'Active' : 'Inactive'}</span>
                      <ChevronRight size={14} color="#d1d5db" />
                    </div>
                  </Link>
                ))
              )}
            </div>
          </Card>

          {/* Recent unread alerts */}
          <Card className="inst-card" style={{ animationDelay: '280ms' }}>
            <CardHead
              title="Recent Alerts"
              sub={`${unreadAlerts} unread`}
              action={<Link to="/institution/alerts" style={s.linkBtn}>View all →</Link>}
            />
            <div style={{ padding: '10px 0 8px' }}>
              {alertsLoading ? (
                <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {Array(4).fill(null).map((_, i) => (
                    <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <Sk h={13} w={140} /><Sk h={10} w={100} />
                    </div>
                  ))}
                </div>
              ) : unreadList.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '32px 20px' }}>
                  <CheckCircle size={36} color="#86efac" style={{ margin: '0 auto 10px', display: 'block' }} />
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: '#166534' }}>All clear!</p>
                  <p style={{ margin: '4px 0 0', fontSize: 12, color: '#9ca3af' }}>No unread alerts at this time.</p>
                </div>
              ) : (
                unreadList.map((a, i) => {
                  const sev = SEV[a.severity] ?? SEV.low;
                  return (
                    <Link key={a.id} to="/institution/alerts" className="alert-row" style={{
                      display: 'flex', alignItems: 'flex-start', gap: 12, padding: '12px 20px',
                      borderBottom: i < unreadList.length - 1 ? '1px solid #f9fafb' : 'none',
                      textDecoration: 'none', transition: 'background 0.15s',
                    }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: sev.dot, flexShrink: 0, marginTop: 5 }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: '#111', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.title}</p>
                        <p style={{ margin: '2px 0 0', fontSize: 11, color: '#9ca3af' }}>
                          {a.user_name ?? 'Member'}
                          {a.created_at && ` · ${formatDistanceToNow(parseISO(a.created_at), { addSuffix: true })}`}
                        </p>
                        {a.message && (
                          <p style={{ margin: '4px 0 0', fontSize: 11, color: '#6b7280', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                            {a.message}
                          </p>
                        )}
                      </div>
                      <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: sev.bg, color: sev.text, flexShrink: 0, textTransform: 'capitalize', border: `1px solid ${sev.border}` }}>
                        {sev.label}
                      </span>
                    </Link>
                  );
                })
              )}
            </div>
          </Card>
        </div>

        {/* ── Quick stats row ─── */}
        <div style={s.quickRow}>
          {[
            {
              icon: Activity,       label: 'BMI Monitoring',
              value: 'Tracked',     sub: 'Weight & BMI logged per member',
              color: P, bg: '#e8f5e9', link: '/institution/users',
            },
            {
              icon: TrendingUp,     label: 'AI Recommendations',
              value: 'Active',      sub: 'Daily AI analysis per member',
              color: '#1565C0', bg: '#e3f2fd', link: '/institution/users',
            },
            {
              icon: AlertTriangle,  label: 'Alert Monitoring',
              value: `${totalAlerts} Total`, sub: `${unreadAlerts} pending review`,
              color: '#d97706', bg: '#fff8e1', link: '/institution/alerts',
            },
            {
              icon: UserPlus,       label: 'Enrolment',
              value: `${totalMembers} Enrolled`,  sub: `Institution ID: ${institution?.institution_id ?? '—'}`,
              color: '#6a1b9a', bg: '#f3e5f5', link: '/institution/users',
            },
          ].map(({ icon: Icon, label, value, sub, color, bg, link }, i) => (
            <Link key={label} to={link} className="inst-card" style={{ ...s.quickCard, animationDelay: `${320 + i * 50}ms`, textDecoration: 'none' }}>
              <div style={{ width: 38, height: 38, borderRadius: 10, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Icon size={18} color={color} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ margin: 0, fontSize: 11, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 500 }}>{label}</p>
                <p style={{ margin: '2px 0 1px', fontSize: 15, fontWeight: 700, color: '#111' }}>{value}</p>
                <p style={{ margin: 0, fontSize: 11, color: '#9ca3af', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{sub}</p>
              </div>
            </Link>
          ))}
        </div>

      </div>
    </div>
  );
}

// ─── styles ───────────────────────────────────────────────────────────────────
const s = {
  root:      { flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', height: '100%', fontFamily: "'DM Sans', sans-serif", background: BG },
  topbar:    { background: '#fff', padding: '16px 28px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', borderBottom: '1px solid rgba(46,125,50,0.1)', flexShrink: 0, gap: 16, flexWrap: 'wrap' },
  pageTitle: { margin: 0, fontSize: 20, fontWeight: 800, color: '#0F1F11', letterSpacing: '-0.4px' },
  pageDate:  { margin: '2px 0 0', fontSize: 12, color: '#9ca3af' },
  content:   { flex: 1, overflowY: 'auto', padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 18 },

  btnPrimary: { display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 18px', background: P, color: '#fff', borderRadius: 9, fontSize: 13, fontWeight: 600, textDecoration: 'none' },
  btnOutline: { display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: '#fff', color: '#374151', borderRadius: 9, fontSize: 13, fontWeight: 600, textDecoration: 'none', border: '1px solid #e5e7eb', position: 'relative' },
  alertPill:  { marginLeft: 4, background: '#dc2626', color: '#fff', borderRadius: 99, fontSize: 10, fontWeight: 700, padding: '0 6px', minWidth: 18, height: 18, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' },
  linkBtn:    { fontSize: 12, color: P, textDecoration: 'none', fontWeight: 600, whiteSpace: 'nowrap' },

  statGrid:  { display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14 },
  statCard:  { background: '#fff', borderRadius: 16, border: '1px solid rgba(0,0,0,0.06)', padding: '18px 20px', display: 'flex', alignItems: 'flex-start', gap: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.04)', position: 'relative', overflow: 'hidden', transition: 'box-shadow 0.2s, transform 0.2s', cursor: 'pointer' },
  statGrad:  { width: 52, height: 52, borderRadius: 14, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  statLabel: { margin: '0 0 4px', fontSize: 11, color: '#9ca3af', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.04em' },
  statValue: { margin: 0, fontSize: 28, fontWeight: 800, color: '#111', letterSpacing: '-0.8px', lineHeight: 1.1 },
  statSub:   { margin: '4px 0 0', fontSize: 11, color: '#9ca3af', display: 'block' },
  urgentPulse: { position: 'absolute', top: 10, right: 10, width: 8, height: 8, borderRadius: '50%', background: '#dc2626', boxShadow: '0 0 0 3px rgba(220,38,38,0.2)' },

  twoCol:   { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 },
  quickRow: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 },
  quickCard: { background: '#fff', borderRadius: 14, border: '1px solid rgba(0,0,0,0.06)', padding: '16px', display: 'flex', alignItems: 'center', gap: 14, boxShadow: '0 1px 4px rgba(0,0,0,0.04)', transition: 'box-shadow 0.2s' },
};
