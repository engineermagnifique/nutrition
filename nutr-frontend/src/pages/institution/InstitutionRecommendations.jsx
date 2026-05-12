import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import {
  Sparkles, ChevronDown, ChevronUp, ChevronRight,
  Activity, AlertTriangle, TrendingUp, Users, Search,
} from 'lucide-react';
import { aiService } from '../../services/ai.service';

const P = '#2E7D32';

const RISK_COLOR = {
  low:      { bg: '#D7F2E1', border: '#A8E2BC', text: '#1F5C36', badge: '#bbf7d0', badgeText: '#166534' },
  medium:   { bg: '#FFF1C9', border: '#FFE08F', text: '#7A5800', badge: '#fef3c7', badgeText: '#92400e' },
  high:     { bg: '#FFE5D1', border: '#FFD0AE', text: '#9A4B1F', badge: '#ffedd5', badgeText: '#9a3412' },
  critical: { bg: '#FBDAE0', border: '#F4B5BF', text: '#7A1F33', badge: '#fee2e2', badgeText: '#991b1b' },
};

function Sk({ w = '100%', h = 14, r = 6 }) {
  return (
    <div style={{ width: w, height: h, borderRadius: r, background: 'linear-gradient(90deg,#e8ede8 25%,#d4e0d4 50%,#e8ede8 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.4s ease-in-out infinite', flexShrink: 0 }} />
  );
}

function Avatar({ name, size = 36 }) {
  const initials = name ? name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase() : '?';
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', background: '#e8f5e9', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.3, fontWeight: 700, color: P }}>
      {initials}
    </div>
  );
}

function RiskBadge({ risk }) {
  const c = RISK_COLOR[risk] ?? RISK_COLOR.low;
  return (
    <span style={{ background: c.badge, color: c.badgeText, fontSize: 10, fontWeight: 700, padding: '2px 10px', borderRadius: 20, textTransform: 'capitalize', border: `1px solid ${c.border}` }}>
      {risk} risk
    </span>
  );
}

function RecRow({ rec, isLast }) {
  const [open, setOpen] = useState(false);
  const raw = rec.raw_response || {};
  const risk = raw.overall_risk ?? 'low';
  const c = RISK_COLOR[risk] ?? RISK_COLOR.low;
  const actions = raw.quick_actions ?? [];
  const warnings = raw.warnings ?? [];
  const trending = raw.trending ?? [];

  return (
    <div style={{ borderBottom: isLast ? 'none' : '1px solid #f0f0f0' }}>
      <button
        onClick={() => setOpen((o) => !o)}
        style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 12, textAlign: 'left', fontFamily: 'inherit', transition: 'background 0.15s' }}
        onMouseEnter={(e) => e.currentTarget.style.background = '#f8fdf8'}
        onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
      >
        <div style={{ width: 8, height: 8, borderRadius: '50%', background: c.text, flexShrink: 0 }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#111' }}>
              {format(parseISO(rec.created_at), 'MMM d, yyyy · h:mm a')}
            </span>
            <RiskBadge risk={risk} />
            {rec.calorie_target && (
              <span style={{ fontSize: 11, color: '#6b7280', background: '#f3f4f6', borderRadius: 6, padding: '1px 8px' }}>
                {Math.round(rec.calorie_target)} kcal/day
              </span>
            )}
          </div>
          {raw.plain_summary && (
            <p style={{ margin: '4px 0 0', fontSize: 12, color: '#6b7280', lineHeight: 1.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: open ? 'normal' : 'nowrap' }}>
              {raw.plain_summary}
            </p>
          )}
        </div>
        {open ? <ChevronUp size={14} color="#9ca3af" /> : <ChevronDown size={14} color="#9ca3af" />}
      </button>

      {open && (
        <div style={{ padding: '0 20px 18px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Summary card */}
          <div style={{ background: `linear-gradient(135deg,${c.bg},#fffdf9)`, border: `1.5px solid ${c.border}`, borderRadius: 12, padding: '14px 16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
              <Activity size={13} color={c.text} />
              <span style={{ fontSize: 10, fontWeight: 800, color: c.text, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Health Summary</span>
            </div>
            <p style={{ margin: 0, fontSize: 13, color: '#5a4a3a', lineHeight: 1.75 }}>{rec.notes || raw.plain_summary}</p>
            <div style={{ display: 'flex', gap: 10, marginTop: 12, flexWrap: 'wrap' }}>
              {raw.bmi && (
                <div style={{ background: '#fffdf9', borderRadius: 8, padding: '8px 12px', textAlign: 'center', border: `1px solid ${c.border}` }}>
                  <p style={{ margin: '0 0 1px', fontSize: 9, color: '#a8967f', fontWeight: 700, textTransform: 'uppercase' }}>BMI</p>
                  <p style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#2a1f14' }}>{raw.bmi}</p>
                  {raw.bmi_category && <p style={{ margin: 0, fontSize: 9, color: c.text, fontWeight: 600 }}>{raw.bmi_category}</p>}
                </div>
              )}
              {raw.calorie_target && (
                <div style={{ background: '#fffdf9', borderRadius: 8, padding: '8px 12px', textAlign: 'center', border: `1px solid ${c.border}` }}>
                  <p style={{ margin: '0 0 1px', fontSize: 9, color: '#a8967f', fontWeight: 700, textTransform: 'uppercase' }}>Daily Target</p>
                  <p style={{ margin: 0, fontSize: 18, fontWeight: 800, color: P }}>{Math.round(raw.calorie_target)}</p>
                  <p style={{ margin: 0, fontSize: 9, color: '#a8967f' }}>kcal/day</p>
                </div>
              )}
            </div>
          </div>

          {/* Health trends */}
          {trending.length > 0 && (
            <div>
              <p style={{ margin: '0 0 8px', fontSize: 11, fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Health Trends</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(160px,1fr))', gap: 8 }}>
                {trending.map((t, i) => (
                  <div key={i} style={{ background: '#f8fdf8', border: '1px solid #e5ebe5', borderRadius: 10, padding: '10px 12px' }}>
                    <p style={{ margin: '0 0 2px', fontSize: 10, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase' }}>{t.label}</p>
                    <p style={{ margin: '0 0 2px', fontSize: 14, fontWeight: 800, color: '#111' }}>{t.value}</p>
                    <p style={{ margin: 0, fontSize: 11, color: '#9ca3af', lineHeight: 1.4 }}>{t.detail}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Warnings */}
          {warnings.length > 0 && (
            <div>
              <p style={{ margin: '0 0 8px', fontSize: 11, fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Risk Factors</p>
              {warnings.map((w, i) => (
                <div key={i} style={{ display: 'flex', gap: 10, padding: '10px 12px', background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: 8, marginBottom: 6 }}>
                  <AlertTriangle size={13} color="#ea580c" style={{ flexShrink: 0, marginTop: 1 }} />
                  <p style={{ margin: 0, fontSize: 12, color: '#7c3419', lineHeight: 1.6 }}>{w}</p>
                </div>
              ))}
            </div>
          )}

          {/* Actions */}
          {actions.length > 0 && (
            <div>
              <p style={{ margin: '0 0 8px', fontSize: 11, fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Recommended Actions</p>
              {actions.slice(0, 3).map((a, i) => (
                <div key={i} style={{ padding: '10px 12px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, marginBottom: 6 }}>
                  <p style={{ margin: '0 0 2px', fontSize: 12, fontWeight: 700, color: '#111' }}>{a.action}</p>
                  {a.why && <p style={{ margin: 0, fontSize: 11, color: '#4b5563', lineHeight: 1.5 }}>{a.why}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function MemberRecGroup({ userId, userName, recs }) {
  const [expanded, setExpanded] = useState(false);
  const latest = recs[0];
  const raw = latest?.raw_response || {};
  const risk = raw.overall_risk ?? 'low';
  const c = RISK_COLOR[risk] ?? RISK_COLOR.low;

  return (
    <div style={{ background: '#fff', borderRadius: 16, border: '1px solid rgba(0,0,0,0.06)', boxShadow: '0 1px 4px rgba(0,0,0,0.04)', overflow: 'hidden' }}>
      {/* Member header */}
      <div style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 12, borderBottom: '1px solid #f0f0f0' }}>
        <Avatar name={userName} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#111' }}>{userName}</p>
          <p style={{ margin: '2px 0 0', fontSize: 11, color: '#9ca3af' }}>{recs.length} analysis · Last: {format(parseISO(latest.created_at), 'MMM d, yyyy')}</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <RiskBadge risk={risk} />
          <Link
            to={`/institution/users/${userId}`}
            style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: P, fontWeight: 600, textDecoration: 'none' }}
          >
            View profile <ChevronRight size={12} />
          </Link>
        </div>
        <button
          onClick={() => setExpanded((o) => !o)}
          style={{ background: '#f3f4f6', border: 'none', borderRadius: 8, padding: '6px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#374151', fontFamily: 'inherit' }}
        >
          {expanded ? 'Collapse' : `Show ${recs.length}`}
          {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
        </button>
      </div>

      {/* Latest summary preview (always visible) */}
      {!expanded && raw.plain_summary && (
        <div style={{ padding: '12px 20px', background: c.bg, borderBottom: `1px solid ${c.border}` }}>
          <p style={{ margin: 0, fontSize: 12, color: c.text, lineHeight: 1.6 }}>{raw.plain_summary}</p>
        </div>
      )}

      {/* Expanded recs */}
      {expanded && recs.map((rec, i) => (
        <RecRow key={rec.id} rec={rec} isLast={i === recs.length - 1} />
      ))}
    </div>
  );
}

export default function InstitutionRecommendations() {
  const [search, setSearch] = useState('');

  const { data: allRecs = [], isLoading } = useQuery({
    queryKey: ['institution-all-recommendations'],
    queryFn: () => aiService.getRecommendations().then((r) => {
      const d = r.data;
      return d?.results ?? (Array.isArray(d) ? d : []);
    }),
    staleTime: 60_000,
  });

  // Group by member
  const grouped = allRecs.reduce((acc, rec) => {
    const uid = rec.user_id;
    if (!acc[uid]) acc[uid] = { userId: uid, userName: rec.user_name ?? 'Unknown', recs: [] };
    acc[uid].recs.push(rec);
    return acc;
  }, {});

  const groups = Object.values(grouped).filter((g) => {
    if (!search) return true;
    return g.userName.toLowerCase().includes(search.toLowerCase());
  });

  const totalMembers = groups.length;
  const totalRecs = allRecs.length;
  const highRiskCount = groups.filter((g) => {
    const r = g.recs[0]?.raw_response?.overall_risk;
    return r === 'high' || r === 'critical';
  }).length;

  return (
    <div style={s.root}>
      <style>{`@keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}`}</style>

      {/* Header */}
      <div style={s.topbar}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <TrendingUp size={16} color={P} />
            <span style={{ fontSize: 13, fontWeight: 600, color: P }}>AI Insights</span>
          </div>
          <h1 style={s.pageTitle}>Member Recommendations</h1>
          <p style={s.pageDate}>AI health analysis for all members in your institution</p>
        </div>
      </div>

      {/* Stats bar */}
      <div style={s.statsBar}>
        {[
          { label: 'Members with Analysis', value: totalMembers, icon: Users, color: P },
          { label: 'Total Analyses', value: totalRecs, icon: Sparkles, color: '#1565C0' },
          { label: 'High Risk Members', value: highRiskCount, icon: AlertTriangle, color: highRiskCount > 0 ? '#dc2626' : '#6b7280' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} style={s.statCard}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Icon size={16} color={color} />
            </div>
            <div>
              <p style={{ margin: 0, fontSize: 11, color: '#9ca3af', fontWeight: 500 }}>{label}</p>
              <p style={{ margin: '1px 0 0', fontSize: 20, fontWeight: 800, color: '#111' }}>{isLoading ? '—' : value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Content */}
      <div style={s.content}>
        {/* Search */}
        <div style={{ position: 'relative', maxWidth: 360 }}>
          <Search size={14} color="#9ca3af" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            placeholder="Search member by name…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: '100%', padding: '9px 14px 9px 34px', fontSize: 13, border: '1.5px solid #e5e7eb', borderRadius: 10, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit', color: '#111' }}
          />
        </div>

        {isLoading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {Array(3).fill(null).map((_, i) => (
              <div key={i} style={{ background: '#fff', borderRadius: 16, border: '1px solid rgba(0,0,0,0.06)', padding: '16px 20px', display: 'flex', gap: 12, alignItems: 'center' }}>
                <Sk w={36} h={36} r={99} />
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <Sk h={14} w={180} />
                  <Sk h={11} w={120} />
                </div>
              </div>
            ))}
          </div>
        ) : groups.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 24px', background: '#fff', borderRadius: 20, border: '1px dashed #e5e7eb' }}>
            <div style={{ width: 64, height: 64, background: '#f0fdf4', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <Sparkles size={28} color={P} />
            </div>
            <p style={{ fontSize: 16, fontWeight: 700, color: '#111', margin: '0 0 8px' }}>
              {search ? 'No members match your search' : 'No AI analyses yet'}
            </p>
            <p style={{ fontSize: 13, color: '#6b7280', margin: 0 }}>
              {search ? 'Try a different name.' : 'Members need to generate at least one AI recommendation from their dashboard.'}
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {groups.map((g) => (
              <MemberRecGroup key={g.userId} {...g} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const s = {
  root: { flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', height: '100%', fontFamily: "'DM Sans', sans-serif", background: '#F0F4F0' },
  topbar: { background: '#fff', padding: '16px 28px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', borderBottom: '1px solid rgba(46,125,50,0.1)', flexShrink: 0 },
  pageTitle: { margin: 0, fontSize: 20, fontWeight: 800, color: '#0F1F11', letterSpacing: '-0.4px' },
  pageDate: { margin: '2px 0 0', fontSize: 12, color: '#9ca3af' },
  statsBar: { background: '#fff', borderBottom: '1px solid rgba(0,0,0,0.06)', padding: '14px 28px', display: 'flex', gap: 24, flexWrap: 'wrap', flexShrink: 0 },
  statCard: { display: 'flex', alignItems: 'center', gap: 12 },
  content: { flex: 1, overflowY: 'auto', padding: '20px 28px', display: 'flex', flexDirection: 'column', gap: 16 },
};
