import { useQuery } from '@tanstack/react-query';
import {
  Scale, Bell, TrendingUp, Plus, Utensils, HeartPulse,
  Zap, ChevronRight, Activity, Target, ArrowUpRight, ArrowDownRight,
  Minus, Sparkles, Pill, BarChart2, AlertTriangle, CheckCircle,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { authService } from '../../services/auth.service';
import { nutritionService } from '../../services/nutrition.service';
import { aiService } from '../../services/ai.service';
import { healthService } from '../../services/health.service';
import { format, parseISO } from 'date-fns';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

// ─── design tokens — warm HelloWord-inspired palette ─────────────────────────
const P        = '#2E7D32';   // primary green (kept — brand soul)
const ACCENT   = '#F59B6B';   // warm peach accent — new
const ACCENT_D = '#E8754A';   // deeper peach for active/hover
const BG       = '#FCE4CF';   // soft peach background (the "outer canvas")
const PANEL    = '#FFFFFF';   // floating inner panel

// Pastel tint families used across stat cards & sections
const TINT = {
  peach:    { bg: '#FFE5D1', border: '#FFD0AE', text: '#9A4B1F', icon: '#E8754A' },
  mint:     { bg: '#D7F2E1', border: '#A8E2BC', text: '#1F5C36', icon: '#2E7D32' },
  sky:      { bg: '#D9ECFA', border: '#B0D5F1', text: '#1A4D7A', icon: '#1565C0' },
  lilac:    { bg: '#EADCF7', border: '#D2BCEA', text: '#4B2B7A', icon: '#7c3aed' },
  butter:   { bg: '#FFF1C9', border: '#FFE08F', text: '#7A5800', icon: '#d97706' },
  rose:     { bg: '#FBDAE0', border: '#F4B5BF', text: '#7A1F33', icon: '#c62828' },
};

const RISK = {
  low:      { ...TINT.mint,   icon_c: '#16a34a', Ico: CheckCircle  },
  medium:   { ...TINT.butter, icon_c: '#d97706', Ico: AlertTriangle },
  high:     { ...TINT.peach,  icon_c: '#ea580c', Ico: AlertTriangle },
  critical: { ...TINT.rose,   icon_c: '#dc2626', Ico: AlertTriangle },
};

const CONDITION_COLOR = { mild: '#16a34a', moderate: '#d97706', severe: '#dc2626' };

// ─── skeleton ────────────────────────────────────────────────────────────────
function Sk({ w = '100%', h = 14, r = 8 }) {
  return (
    <div style={{ width: w, height: h, borderRadius: r, background: 'linear-gradient(90deg,#f3e6d8 25%,#e6d4c0 50%,#f3e6d8 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.4s ease-in-out infinite', flexShrink: 0 }} />
  );
}

// ─── macro progress bar ───────────────────────────────────────────────────────
function MacroBar({ label, value, max, unit, color }) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <span style={{ fontSize: 12, color: '#7a6a5a', fontWeight: 600, letterSpacing: '-0.1px' }}>{label}</span>
        <span style={{ fontSize: 13, fontWeight: 800, color: '#2a1f14' }}>{Math.round(value)}<span style={{ fontSize: 10, fontWeight: 500, color: '#a8967f', marginLeft: 1 }}>{unit}</span></span>
      </div>
      <div style={{ height: 8, background: '#f5ece1', borderRadius: 99, overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 99, transition: 'width 0.6s ease' }} />
      </div>
      <span style={{ fontSize: 10, color: '#a8967f', fontWeight: 500 }}>{pct}% of daily target</span>
    </div>
  );
}

// ─── calorie ring (SVG) ───────────────────────────────────────────────────────
function CalorieRing({ consumed, target }) {
  const r = 44;
  const circ = 2 * Math.PI * r;
  const pct = target > 0 ? Math.min(1, consumed / target) : 0;
  const dash = pct * circ;
  const over = consumed > target;
  const color = over ? '#ef4444' : pct > 0.85 ? ACCENT : P;

  return (
    <div style={{ position: 'relative', width: 110, height: 110, flexShrink: 0 }}>
      <svg width={110} height={110} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={55} cy={55} r={r} fill="none" stroke="#f5ece1" strokeWidth={11} />
        <circle cx={55} cy={55} r={r} fill="none" stroke={color} strokeWidth={11}
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round" />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontSize: 17, fontWeight: 800, color: color, lineHeight: 1, letterSpacing: '-0.5px' }}>{Math.round(consumed).toLocaleString()}</span>
        <span style={{ fontSize: 9, color: '#a8967f', marginTop: 3, fontWeight: 500 }}>of {Math.round(target).toLocaleString()}</span>
        <span style={{ fontSize: 9, color: '#a8967f', fontWeight: 500 }}>kcal</span>
      </div>
    </div>
  );
}

// ─── weight chart (recharts) ──────────────────────────────────────────────────
function MiniWeightChart({ records }) {
  if (!records || records.length < 2) {
    return (
      <div style={{ height: 160, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
        <Scale size={28} color="#d4c4b0" />
        <span style={{ fontSize: 12, color: '#a8967f', fontWeight: 500 }}>Log more health records to see your trend</span>
      </div>
    );
  }
  const data = [...records].sort((a, b) => new Date(a.recorded_at) - new Date(b.recorded_at)).slice(-10).map((r) => ({
    d: format(parseISO(r.recorded_at), 'MMM d'),
    w: parseFloat(r.weight),
  }));
  return (
    <ResponsiveContainer width="100%" height={160}>
      <LineChart data={data} margin={{ top: 5, right: 5, left: -24, bottom: 0 }}>
        <defs>
          <linearGradient id="weightGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%"   stopColor={ACCENT} />
            <stop offset="100%" stopColor={P} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 4" stroke="#f0e6d6" />
        <XAxis dataKey="d" tick={{ fontSize: 10, fill: '#a8967f', fontWeight: 500 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 10, fill: '#a8967f', fontWeight: 500 }} axisLine={false} tickLine={false} />
        <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #f0e6d6', fontSize: 11, padding: '8px 12px', boxShadow: '0 6px 20px rgba(122,84,40,0.12)' }}
          formatter={(v) => [`${v} kg`, 'Weight']} />
        <Line type="monotone" dataKey="w" stroke="url(#weightGrad)" strokeWidth={3} dot={false} activeDot={{ r: 5, fill: P, stroke: '#fff', strokeWidth: 2 }} />
      </LineChart>
    </ResponsiveContainer>
  );
}

// ─── shared card ─────────────────────────────────────────────────────────────
function Card({ children, style, tint }) {
  return (
    <div style={{
      background: tint?.bg ?? '#fff',
      borderRadius: 20,
      border: `1px solid ${tint?.border ?? '#f3e6d2'}`,
      boxShadow: '0 2px 8px rgba(180,120,60,0.05)',
      ...style,
    }}>
      {children}
    </div>
  );
}

function CardHead({ title, sub, action }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 22px 0' }}>
      <div>
        <p style={{ margin: 0, fontSize: 14, fontWeight: 800, color: '#2a1f14', letterSpacing: '-0.2px' }}>{title}</p>
        {sub && <p style={{ margin: '3px 0 0', fontSize: 11, color: '#a8967f', fontWeight: 500 }}>{sub}</p>}
      </div>
      {action}
    </div>
  );
}

// ─── main dashboard ───────────────────────────────────────────────────────────
export default function UserDashboard() {
  const { profile } = useAuth();
  const today = format(new Date(), 'yyyy-MM-dd');

  const { data: dashboard, isLoading: dashLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => authService.getDashboard().then((r) => r.data?.data ?? r.data),
    staleTime: 60_000,
  });

  const { data: daily, isLoading: dailyLoading } = useQuery({
    queryKey: ['daily-summary', today],
    queryFn: () => nutritionService.getDailySummary({ date: today }).then((r) => r.data?.data ?? r.data),
    staleTime: 60_000,
  });

  const { data: recs = [] } = useQuery({
    queryKey: ['recommendations'],
    queryFn: () => aiService.getRecommendations({ page_size: 1 }).then((r) => r.data?.results ?? []),
    staleTime: 120_000,
  });

  const { data: conditions = [] } = useQuery({
    queryKey: ['conditions'],
    queryFn: () => healthService.getConditions().then((r) => r.data?.results ?? []),
    staleTime: 120_000,
  });

  const { data: goals = [] } = useQuery({
    queryKey: ['health-goals'],
    queryFn: () => healthService.getGoals().then((r) => r.data?.results ?? []),
    staleTime: 120_000,
  });

  const health    = dashboard?.latest_health_record;
  const records   = dashboard?.health_records ?? (health ? [health] : []);
  const latestRec = recs[0] ?? null;
  const raw       = latestRec?.raw_response ?? {};
  const risk      = raw.overall_risk ?? null;
  const riskMeta  = RISK[risk] ?? null;
  const calTarget = raw.calorie_target ?? latestRec?.calorie_target ?? null;
  const unread    = dashboard?.unread_alerts ?? 0;
  const activeGoal = goals.find((g) => g.is_active);
  const firstName = profile?.full_name?.split(' ')[0] ?? 'there';

  const hr = new Date().getHours();
  const greeting = hr < 12 ? 'Good morning' : hr < 17 ? 'Good afternoon' : 'Good evening';

  const weightTrend = (() => {
    if (records.length < 2) return null;
    const sorted = [...records].sort((a, b) => new Date(a.recorded_at) - new Date(b.recorded_at));
    const diff = parseFloat(sorted[sorted.length - 1].weight) - parseFloat(sorted[0].weight);
    return diff;
  })();

  // Stat cards: each gets its own pastel tint (HelloWord pattern)
  const statCards = [
    {
      tint: TINT.peach,
      Icon: Scale,
      label: 'Current Weight',
      loading: dashLoading,
      value: health?.weight ?? '—',
      unit: ' kg',
      sub: (
        <>
          {weightTrend !== null && (
            weightTrend > 0.1
              ? <ArrowUpRight size={13} color="#ef4444" style={{ marginRight: 3 }} />
              : weightTrend < -0.1
                ? <ArrowDownRight size={13} color="#16a34a" style={{ marginRight: 3 }} />
                : <Minus size={13} color="#a8967f" style={{ marginRight: 3 }} />
          )}
          {health ? `BMI ${parseFloat(health.bmi).toFixed(1)} · ${health.bmi_category}` : 'No record yet'}
        </>
      ),
    },
    {
      tint: TINT.mint,
      Icon: Zap,
      label: "Today's Calories",
      loading: dailyLoading,
      value: daily ? Math.round(daily.total_calories).toLocaleString() : '—',
      unit: calTarget ? ` / ${Math.round(calTarget).toLocaleString()}` : '',
      sub: daily ? `P: ${Math.round(daily.total_protein)}g · C: ${Math.round(daily.total_carbohydrates)}g` : 'Log a meal to start',
    },
    {
      tint: riskMeta ?? TINT.lilac,
      Icon: riskMeta?.Ico ?? Sparkles,
      label: 'AI Health Risk',
      loading: !latestRec,
      value: risk ?? 'N/A',
      unit: '',
      sub: latestRec ? `Generated ${format(parseISO(latestRec.created_at), 'MMM d')}` : 'Generate an analysis',
      capitalize: true,
    },
    {
      tint: unread > 0 ? TINT.rose : TINT.sky,
      Icon: Bell,
      label: 'Unread Alerts',
      loading: false,
      value: unread,
      unit: '',
      sub: unread > 0 ? 'Requires attention' : 'All clear',
    },
  ];

  return (
    <div style={s.root}>
      <style>{`
        @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
        @keyframes fadeUp  { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        .dash-card  { animation: fadeUp 0.4s cubic-bezier(0.2,0.7,0.3,1) both; }
        .quick-link { transition: all 0.18s ease; }
        .quick-link:hover { background:#FFF6EC !important; border-color:#FFD9B8 !important; transform: translateX(2px); }
        .filter-pill:hover { transform: translateY(-1px); box-shadow: 0 4px 14px rgba(232,117,74,0.25); }
        .btn-primary:hover  { background:${ACCENT_D} !important; }
        .btn-outline:hover  { background:#FFF6EC !important; }
        .scroll::-webkit-scrollbar { width: 8px; }
        .scroll::-webkit-scrollbar-track { background: transparent; }
        .scroll::-webkit-scrollbar-thumb { background: #e8d4bc; border-radius: 4px; }
        .scroll::-webkit-scrollbar-thumb:hover { background: #d4bb98; }
      `}</style>

      {/* ── Outer warm canvas → inner white panel (HelloWord signature) ────── */}
      <div style={s.panel}>

        {/* ── Top bar inside panel ───────────────────────────────────────── */}
        <div style={s.topbar}>
          <div>
            <h1 style={s.greeting}>{greeting}, {firstName} 👋</h1>
            <p style={s.date}>{format(new Date(), 'EEEE, MMMM d, yyyy')} · Welcome back, nice to see you again</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Link to="/user/meals" className="btn-outline" style={s.btnOutline}><Plus size={14} /> Log Meal</Link>
            <Link to="/user/health" className="btn-primary" style={s.btnPrimary}><Plus size={14} /> Log Health</Link>
            <Link to="/user/alerts" style={{ ...s.iconBtn, ...(unread > 0 ? { background: '#FBDAE0', border: '1px solid #F4B5BF' } : {}) }}>
              <Bell size={16} color={unread > 0 ? '#c62828' : '#7a6a5a'} />
              {unread > 0 && <span style={s.dot}>{unread > 9 ? '9+' : unread}</span>}
            </Link>
          </div>
        </div>

        {/* ── Scrollable content ──────────────────────────────────────────── */}
        <div className="scroll" style={s.content}>

          {/* ── Overview header + filter pill (HelloWord pattern) ─── */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 }}>
            <div>
              <h2 style={s.sectionH1}>Overview</h2>
              <p style={s.sectionSub}>Your health at a glance</p>
            </div>
            <div className="filter-pill" style={s.filterPill}>
              <span style={{ width: 8, height: 8, borderRadius: 99, background: '#fff' }} />
              Today
              <ChevronRight size={14} style={{ transform: 'rotate(90deg)' }} />
            </div>
          </div>

          {/* ── Stat row ── tinted cards like reference ─── */}
          <div style={s.statRow}>
            {statCards.map((c, i) => {
              const Ic = c.Icon;
              return (
                <div key={i} className="dash-card" style={{
                  ...s.stat,
                  background: c.tint.bg,
                  borderColor: c.tint.border,
                  animationDelay: `${i * 60}ms`,
                }}>
                  <div style={{ ...s.statIcon, background: '#ffffff90', border: `1px solid ${c.tint.border}` }}>
                    <Ic size={20} color={c.tint.icon ?? c.tint.icon_c} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ ...s.statLabel, color: c.tint.text }}>{c.label}</p>
                    {c.loading ? <Sk w={70} h={26} r={6} /> : (
                      <p style={{ ...s.statValue, color: c.tint.text, textTransform: c.capitalize ? 'capitalize' : 'none' }}>
                        {c.value}<span style={{ ...s.unit, color: c.tint.text, opacity: 0.6 }}>{c.unit}</span>
                      </p>
                    )}
                    <span style={{ ...s.statSub, color: c.tint.text, opacity: 0.75, display: 'inline-flex', alignItems: 'center' }}>{c.sub}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* ── Middle row: Weight chart + Today's nutrition ─── */}
          <div style={s.gridTwoThird}>
            <Card className="dash-card" style={{ animationDelay: '240ms' }}>
              <CardHead
                title="Weight Trend"
                sub={`Last ${Math.min(records.length, 10)} records · Hours spent thinking healthy`}
                action={<Link to="/user/health" style={s.linkBtn}>View records →</Link>}
              />
              <div style={{ padding: '14px 22px 18px' }}>
                {dashLoading ? <Sk h={160} /> : <MiniWeightChart records={records} />}
              </div>
            </Card>

            <Card className="dash-card" style={{ animationDelay: '280ms' }}>
              <CardHead
                title="Today's Nutrition"
                sub={format(new Date(), 'MMMM d')}
                action={<Link to="/user/meals" style={s.linkBtn}>Log meal →</Link>}
              />
              <div style={{ padding: '18px 22px 20px' }}>
                {dailyLoading ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    {Array(4).fill(null).map((_, i) => <Sk key={i} h={42} />)}
                  </div>
                ) : !daily || daily.total_calories === 0 ? (
                  <div style={{ textAlign: 'center', padding: '28px 0' }}>
                    <div style={{ width: 56, height: 56, borderRadius: 16, background: TINT.peach.bg, margin: '0 auto 12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Utensils size={26} color={TINT.peach.icon} />
                    </div>
                    <p style={{ margin: 0, fontSize: 13, color: '#7a6a5a', fontWeight: 500 }}>No meals logged today.</p>
                    <Link to="/user/meals" className="btn-primary" style={{ ...s.btnPrimary, marginTop: 16, display: 'inline-flex' }}>
                      <Plus size={14} /> Add First Meal
                    </Link>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                      <CalorieRing consumed={daily.total_calories} target={calTarget || 2000} />
                      <div style={{ flex: 1 }}>
                        <p style={{ margin: '0 0 4px', fontSize: 14, fontWeight: 800, color: '#2a1f14', letterSpacing: '-0.2px' }}>
                          {Math.round(daily.total_calories).toLocaleString()} kcal
                        </p>
                        <p style={{ margin: 0, fontSize: 11, color: '#a8967f', fontWeight: 500 }}>
                          Target: {calTarget ? Math.round(calTarget).toLocaleString() : '—'} kcal
                        </p>
                      </div>
                    </div>
                    <MacroBar label="Protein"       value={daily.total_protein}       max={100} unit="g" color="#1565C0" />
                    <MacroBar label="Carbohydrates" value={daily.total_carbohydrates} max={250} unit="g" color={ACCENT} />
                    <MacroBar label="Fat"           value={daily.total_fat}           max={80}  unit="g" color="#ef4444" />
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* ── Bottom row: AI insight | Health status | Quick actions ─── */}
          <div style={s.gridThree}>
            {/* AI Insight */}
            <Card className="dash-card" style={{ animationDelay: '320ms' }}>
              <div style={{ padding: '18px 22px 22px', display: 'flex', flexDirection: 'column', gap: 14, height: '100%', boxSizing: 'border-box' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                    <div style={{ width: 34, height: 34, borderRadius: 10, background: TINT.mint.bg, border: `1px solid ${TINT.mint.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Sparkles size={16} color={P} />
                    </div>
                    <span style={{ fontSize: 14, fontWeight: 800, color: '#2a1f14', letterSpacing: '-0.2px' }}>AI Analysis</span>
                  </div>
                  {riskMeta && (
                    <span style={{ fontSize: 11, fontWeight: 700, color: riskMeta.text, background: '#ffffff', border: `1px solid ${riskMeta.border}`, borderRadius: 20, padding: '3px 11px', textTransform: 'capitalize' }}>
                      {risk} risk
                    </span>
                  )}
                </div>

                {!latestRec ? (
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, textAlign: 'center' }}>
                    <div style={{ width: 52, height: 52, borderRadius: 16, background: TINT.lilac.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Sparkles size={24} color={TINT.lilac.icon} />
                    </div>
                    <p style={{ margin: 0, fontSize: 12, color: '#7a6a5a', fontWeight: 500 }}>No AI analysis generated yet.</p>
                    <Link to="/user/recommendations" className="btn-primary" style={{ ...s.btnPrimary, fontSize: 12, padding: '8px 16px' }}>Generate Analysis</Link>
                  </div>
                ) : (
                  <>
                    <p style={{ margin: 0, fontSize: 12.5, color: '#5a4a3a', lineHeight: 1.7, display: '-webkit-box', WebkitLineClamp: 4, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {raw.plain_summary || latestRec.notes}
                    </p>
                    {raw.quick_actions?.[0] && (
                      <div style={{ background: TINT.mint.bg, border: `1px solid ${TINT.mint.border}`, borderRadius: 12, padding: '11px 13px' }}>
                        <p style={{ margin: '0 0 3px', fontSize: 10, fontWeight: 800, color: TINT.mint.text, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Top Action</p>
                        <p style={{ margin: 0, fontSize: 12, color: '#3a2a1a', lineHeight: 1.5, fontWeight: 500 }}>{raw.quick_actions[0].action}</p>
                      </div>
                    )}
                    <Link to="/user/recommendations" style={{ ...s.linkBtn, marginTop: 'auto' }}>
                      View full report →
                    </Link>
                  </>
                )}
              </div>
            </Card>

            {/* Health Status */}
            <Card className="dash-card" style={{ animationDelay: '360ms' }}>
              <div style={{ padding: '18px 22px 22px', display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                    <div style={{ width: 34, height: 34, borderRadius: 10, background: TINT.rose.bg, border: `1px solid ${TINT.rose.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <HeartPulse size={16} color={TINT.rose.icon} />
                    </div>
                    <span style={{ fontSize: 14, fontWeight: 800, color: '#2a1f14', letterSpacing: '-0.2px' }}>Health Status</span>
                  </div>
                  <Link to="/user/health" style={s.linkBtn}>Edit →</Link>
                </div>

                {/* Active goal */}
                <div>
                  <p style={{ margin: '0 0 7px', fontSize: 10, fontWeight: 800, color: '#a8967f', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Active Goal</p>
                  {activeGoal ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: TINT.peach.bg, border: `1px solid ${TINT.peach.border}`, borderRadius: 10, padding: '8px 11px' }}>
                      <Target size={14} color={TINT.peach.icon} />
                      <span style={{ fontSize: 13, color: TINT.peach.text, fontWeight: 700, textTransform: 'capitalize' }}>
                        {activeGoal.goal_type.replace(/_/g, ' ')}
                      </span>
                      {activeGoal.target_weight && (
                        <span style={{ fontSize: 11, color: TINT.peach.text, opacity: 0.7, marginLeft: 'auto', fontWeight: 600 }}>→ {activeGoal.target_weight} kg</span>
                      )}
                    </div>
                  ) : (
                    <p style={{ margin: 0, fontSize: 12, color: '#a8967f', fontWeight: 500 }}>No active goal set</p>
                  )}
                </div>

                {/* Conditions */}
                <div>
                  <p style={{ margin: '0 0 7px', fontSize: 10, fontWeight: 800, color: '#a8967f', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Conditions</p>
                  {conditions.length === 0 ? (
                    <p style={{ margin: 0, fontSize: 12, color: '#a8967f', fontWeight: 500 }}>No conditions recorded</p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                      {conditions.slice(0, 3).map((c) => (
                        <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ width: 8, height: 8, borderRadius: '50%', background: CONDITION_COLOR[c.severity] ?? '#a8967f', flexShrink: 0 }} />
                          <span style={{ fontSize: 13, color: '#3a2a1a', flex: 1, fontWeight: 500 }}>{c.condition_name}</span>
                          <span style={{ fontSize: 10, color: CONDITION_COLOR[c.severity] ?? '#a8967f', fontWeight: 700, textTransform: 'capitalize' }}>{c.severity}</span>
                        </div>
                      ))}
                      {conditions.length > 3 && <p style={{ margin: 0, fontSize: 11, color: '#a8967f', fontWeight: 500 }}>+{conditions.length - 3} more</p>}
                    </div>
                  )}
                </div>

                {/* Latest stats */}
                {health && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 18px', padding: '14px 16px', background: '#FBF4EA', borderRadius: 12, border: '1px solid #F0E6D2' }}>
                    {[
                      ['Weight', `${health.weight} kg`],
                      ['Height', `${health.height} cm`],
                      ['BMI',    parseFloat(health.bmi).toFixed(1)],
                      ['Activity', (health.activity_level || '').replace(/_/g, ' ') || 'N/A'],
                    ].map(([k, v]) => (
                      <div key={k}>
                        <p style={{ margin: 0, fontSize: 10, color: '#a8967f', fontWeight: 600 }}>{k}</p>
                        <p style={{ margin: '2px 0 0', fontSize: 12.5, fontWeight: 700, color: '#2a1f14', textTransform: 'capitalize' }}>{v}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Card>

            {/* Quick actions */}
            <Card className="dash-card" style={{ animationDelay: '400ms' }}>
              <div style={{ padding: '18px 22px 22px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                <p style={{ margin: 0, fontSize: 14, fontWeight: 800, color: '#2a1f14', letterSpacing: '-0.2px' }}>Quick Access</p>
                {[
                  { label: 'Log a Meal',          sub: 'Track food & calories',   to: '/user/meals',           tint: TINT.peach,  Icon: Utensils    },
                  { label: 'Health Record',        sub: 'Log weight & vitals',     to: '/user/health',          tint: TINT.rose,   Icon: HeartPulse  },
                  { label: 'AI Recommendations',  sub: 'Personalised guidance',   to: '/user/recommendations', tint: TINT.mint,   Icon: Sparkles    },
                  { label: 'Predictions',          sub: 'What lies ahead',         to: '/user/predictions',     tint: TINT.butter, Icon: TrendingUp  },
                  { label: 'Medications',          sub: 'Drug–food interactions',  to: '/user/medications',     tint: TINT.sky,    Icon: Pill        },
                  { label: 'Weekly Report',        sub: 'Weekly health summary',   to: '/user/weekly-report',   tint: TINT.lilac,  Icon: BarChart2   },
                ].map(({ label, sub, to, tint, Icon }) => (
                  <Link key={to} to={to} className="quick-link" style={s.quickLink}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: tint.bg, border: `1px solid ${tint.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Icon size={15} color={tint.icon} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ margin: 0, fontSize: 12.5, fontWeight: 700, color: '#2a1f14' }}>{label}</p>
                      <p style={{ margin: 0, fontSize: 11, color: '#a8967f', fontWeight: 500 }}>{sub}</p>
                    </div>
                    <ChevronRight size={15} color="#c4b094" />
                  </Link>
                ))}
              </div>
            </Card>
          </div>

          {/* ── Today's meals list (leaderboard-style table from reference) ─── */}
          {daily?.meals?.length > 0 && (
            <Card className="dash-card" style={{ animationDelay: '440ms' }}>
              <CardHead title="Today's Meals" sub={`${daily.meals.length} meal(s) logged`} action={<Link to="/user/meals" style={s.linkBtn}>Manage →</Link>} />
              <div style={{ padding: '14px 22px 18px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '40px 1fr auto auto', gap: 14, padding: '8px 4px', borderBottom: '1px solid #F0E6D2', marginBottom: 4 }}>
                  <span style={s.tableHead}>#</span>
                  <span style={s.tableHead}>Meal</span>
                  <span style={{ ...s.tableHead, textAlign: 'right' }}>Protein</span>
                  <span style={{ ...s.tableHead, textAlign: 'right' }}>Calories</span>
                </div>
                {daily.meals.map((m, i) => (
                  <div key={m.id} style={{
                    display: 'grid', gridTemplateColumns: '40px 1fr auto auto', gap: 14, alignItems: 'center', padding: '12px 4px',
                    borderBottom: i < daily.meals.length - 1 ? '1px solid #F5ECE1' : 'none',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: '#a8967f' }}>{i + 1}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ width: 38, height: 38, borderRadius: 12, background: TINT.peach.bg, border: `1px solid ${TINT.peach.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <span style={{ fontSize: 17 }}>{m.meal_type === 'breakfast' ? '🌅' : m.meal_type === 'lunch' ? '☀️' : m.meal_type === 'dinner' ? '🌙' : '🍎'}</span>
                      </div>
                      <div>
                        <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#2a1f14', textTransform: 'capitalize' }}>{m.meal_type}</p>
                        <p style={{ margin: 0, fontSize: 11, color: '#a8967f', fontWeight: 500 }}>{m.items?.length ?? 0} food item(s)</p>
                      </div>
                    </div>
                    <p style={{ margin: 0, fontSize: 12, color: '#7a6a5a', fontWeight: 600, textAlign: 'right' }}>{Math.round(parseFloat(m.total_protein || 0))}g</p>
                    <p style={{ margin: 0, fontSize: 13, fontWeight: 800, color: ACCENT_D, textAlign: 'right' }}>{Math.round(parseFloat(m.total_calories || 0))} kcal</p>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* ── Onboarding strip (if no health record) ─── */}
          {!dashLoading && !health && (
            <div style={{
              background: `linear-gradient(135deg, ${ACCENT} 0%, ${ACCENT_D} 60%, #C7572D 100%)`,
              borderRadius: 20,
              padding: '22px 26px',
              display: 'flex',
              alignItems: 'center',
              gap: 20,
              flexWrap: 'wrap',
              position: 'relative',
              overflow: 'hidden',
              boxShadow: '0 8px 24px rgba(232,117,74,0.25)',
            }}>
              {/* decorative circle */}
              <div style={{ position: 'absolute', right: -40, top: -40, width: 160, height: 160, borderRadius: '50%', background: 'rgba(255,255,255,0.12)' }} />
              <div style={{ position: 'absolute', right: 20, bottom: -30, width: 90, height: 90, borderRadius: '50%', background: 'rgba(255,255,255,0.08)' }} />
              <div style={{ flex: 1, minWidth: 200, position: 'relative' }}>
                <p style={{ margin: 0, fontSize: 16, fontWeight: 800, color: '#fff', letterSpacing: '-0.3px' }}>Welcome to NuTrack!</p>
                <p style={{ margin: '5px 0 0', fontSize: 13, color: 'rgba(255,255,255,0.92)', lineHeight: 1.6 }}>
                  Start by logging your first health record — weight, height, and activity level — so the AI can start personalising recommendations.
                </p>
              </div>
              <div style={{ display: 'flex', gap: 10, flexShrink: 0, flexWrap: 'wrap', position: 'relative' }}>
                <Link to="/user/health" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '10px 18px', background: '#fff', color: ACCENT_D, borderRadius: 12, fontSize: 13, fontWeight: 800, textDecoration: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                  <Activity size={14} /> Log Health Record
                </Link>
                <Link to="/user/recommendations" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '10px 18px', background: 'rgba(255,255,255,0.2)', color: '#fff', borderRadius: 12, fontSize: 13, fontWeight: 700, textDecoration: 'none', border: '1px solid rgba(255,255,255,0.35)', backdropFilter: 'blur(8px)' }}>
                  <Sparkles size={14} /> Get AI Analysis
                </Link>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

// ─── styles ───────────────────────────────────────────────────────────────────
const s = {
  // outer warm canvas
  root: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    height: '100%',
    fontFamily: "'DM Sans', sans-serif",
    background: BG,
    padding: 14,
    boxSizing: 'border-box',
  },
  // inner floating white panel (HelloWord signature)
  panel: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    background: PANEL,
    borderRadius: 24,
    border: '1px solid rgba(255,255,255,0.9)',
    boxShadow: '0 4px 24px rgba(180,120,60,0.08), 0 1px 3px rgba(180,120,60,0.04)',
  },
  topbar: {
    background: '#fff',
    padding: '18px 26px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottom: '1px solid #F5ECE1',
    flexShrink: 0,
    gap: 12,
    flexWrap: 'wrap',
  },
  greeting: { margin: 0, fontSize: 20, fontWeight: 800, color: '#1a1208', letterSpacing: '-0.5px' },
  date:     { margin: '3px 0 0', fontSize: 12, color: '#a8967f', fontWeight: 500 },
  content:  { flex: 1, overflowY: 'auto', padding: '22px 26px 26px', display: 'flex', flexDirection: 'column', gap: 18 },

  sectionH1:  { margin: 0, fontSize: 18, fontWeight: 800, color: '#1a1208', letterSpacing: '-0.4px' },
  sectionSub: { margin: '2px 0 0', fontSize: 12, color: '#a8967f', fontWeight: 500 },

  // pill-shaped filter button from reference
  filterPill: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    padding: '8px 16px',
    background: ACCENT,
    color: '#fff',
    borderRadius: 99,
    fontSize: 12,
    fontWeight: 700,
    cursor: 'pointer',
    boxShadow: '0 2px 8px rgba(232,117,74,0.2)',
    transition: 'all 0.2s ease',
  },

  btnPrimary: { display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 16px', background: ACCENT, color: '#fff', borderRadius: 12, fontSize: 13, fontWeight: 700, textDecoration: 'none', border: 'none', cursor: 'pointer', transition: 'background 0.2s', boxShadow: '0 2px 6px rgba(232,117,74,0.2)' },
  btnOutline: { display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: '#fff', color: ACCENT_D, borderRadius: 12, fontSize: 13, fontWeight: 700, textDecoration: 'none', border: `1px solid ${TINT.peach.border}`, cursor: 'pointer', transition: 'background 0.2s' },
  iconBtn:    { position: 'relative', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 38, height: 38, background: '#FBF4EA', borderRadius: 12, textDecoration: 'none', border: '1px solid #F0E6D2' },
  dot:        { position: 'absolute', top: -4, right: -4, minWidth: 17, height: 17, borderRadius: 99, background: '#dc2626', border: '2px solid #fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 800, color: '#fff', padding: '0 3px' },
  linkBtn:    { fontSize: 12, color: ACCENT_D, textDecoration: 'none', fontWeight: 700, whiteSpace: 'nowrap' },

  statRow:  { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 },
  stat:     { borderRadius: 18, border: '1px solid', padding: '18px', display: 'flex', alignItems: 'flex-start', gap: 14, transition: 'transform 0.2s ease', boxShadow: '0 2px 6px rgba(180,120,60,0.04)' },
  statIcon: { width: 44, height: 44, borderRadius: 12, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  statLabel: { margin: '0 0 5px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', opacity: 0.85 },
  statValue: { margin: 0, fontSize: 24, fontWeight: 800, letterSpacing: '-0.6px', lineHeight: 1.1 },
  unit:      { fontSize: 12, fontWeight: 500 },
  statSub:   { margin: '4px 0 0', fontSize: 11, fontWeight: 500 },

  gridTwoThird: { display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16 },
  gridThree:    { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 },

  quickLink: { display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: 12, border: '1px solid #F5ECE1', textDecoration: 'none', background: '#FBF4EA', cursor: 'pointer' },

  tableHead: { fontSize: 10, fontWeight: 800, color: '#a8967f', textTransform: 'uppercase', letterSpacing: '0.07em' },
};