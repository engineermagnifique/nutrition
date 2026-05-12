import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart2, RefreshCw, CheckCircle, AlertTriangle, Target, Pill,
  ChevronDown, ChevronUp, Eye, EyeOff, History, TrendingUp, TrendingDown,
  Calendar, Flame, Activity,
} from 'lucide-react';
import { aiService } from '../../services/ai.service';
import { format, parseISO } from 'date-fns';

// ─── Design tokens ────────────────────────────────────────────────────────────
const P      = '#2E7D32';
const ACCENT = '#F59B6B';
const BG     = '#FCE4CF';
const PANEL  = '#FFFFFF';
const TINT = {
  peach:  { bg: '#FFE5D1', border: '#FFD0AE', text: '#9A4B1F', icon: '#E8754A' },
  mint:   { bg: '#D7F2E1', border: '#A8E2BC', text: '#1F5C36', icon: '#2E7D32' },
  sky:    { bg: '#D9ECFA', border: '#B0D5F1', text: '#1A4D7A', icon: '#1565C0' },
  lilac:  { bg: '#EADCF7', border: '#D2BCEA', text: '#4B2B7A', icon: '#7c3aed' },
  butter: { bg: '#FFF1C9', border: '#FFE08F', text: '#7A5800', icon: '#d97706' },
  rose:   { bg: '#FBDAE0', border: '#F4B5BF', text: '#7A1F33', icon: '#c62828' },
};

// ─── Score helpers ────────────────────────────────────────────────────────────
function scoreStyle(score) {
  if (score >= 75) return { ring: '#22c55e', text: TINT.mint.text,   bg: TINT.mint.bg,   border: TINT.mint.border,   label: 'Great week!',       icon: '🏆' };
  if (score >= 50) return { ring: '#f59e0b', text: TINT.butter.text, bg: TINT.butter.bg, border: TINT.butter.border, label: 'Room to improve',   icon: '📈' };
  return             { ring: '#ef4444', text: TINT.rose.text,   bg: TINT.rose.bg,   border: TINT.rose.border,   label: 'Needs attention',  icon: '⚠️' };
}

// ─── Animated SVG score ring ──────────────────────────────────────────────────
function ScoreRing({ score }) {
  const c = scoreStyle(score);
  const r = 42, circ = 2 * Math.PI * r, offset = circ - (score / 100) * circ;
  return (
    <div style={{ position: 'relative', width: 104, height: 104, flexShrink: 0 }}>
      <svg width={104} height={104} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={52} cy={52} r={r} fill="none" stroke="#F0E6D2" strokeWidth={9} />
        <motion.circle cx={52} cy={52} r={r} fill="none" stroke={c.ring} strokeWidth={9}
          strokeDasharray={circ} initial={{ strokeDashoffset: circ }} animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1, ease: 'easeOut' }} strokeLinecap="round" />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontSize: 24, fontWeight: 800, color: c.text, lineHeight: 1 }}>{score}</span>
        <span style={{ fontSize: 9, color: '#a8967f', fontWeight: 700, letterSpacing: '0.05em' }}>/ 100</span>
      </div>
    </div>
  );
}

// ─── Stat tile ────────────────────────────────────────────────────────────────
function Tile({ label, value, sub, color, icon, tint }) {
  return (
    <div style={{ background: tint?.bg || '#FBF4EA', border: `1px solid ${tint?.border || '#F0E6D2'}`, borderRadius: 14, padding: '14px 16px', flex: 1, minWidth: 110 }}>
      {icon && <div style={{ marginBottom: 8 }}>{icon}</div>}
      <p style={{ margin: '0 0 3px', fontSize: 10, color: tint?.text || '#a8967f', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</p>
      <p style={{ margin: '0 0 3px', fontSize: 22, fontWeight: 800, color: color || '#2a1f14', lineHeight: 1 }}>{value ?? '—'}</p>
      {sub && <p style={{ margin: 0, fontSize: 11, color: tint?.text || '#a8967f', fontWeight: 500 }}>{sub}</p>}
    </div>
  );
}

// ─── Calorie bar ──────────────────────────────────────────────────────────────
function CalBar({ avg, target }) {
  if (!avg || !target) return null;
  const pct = Math.min(150, Math.round((avg / target) * 100));
  const barColor = pct > 115 ? '#ef4444' : pct < 80 ? '#f59e0b' : '#22c55e';
  const label = pct > 115 ? `${pct - 100}% over target` : pct < 80 ? `${100 - pct}% under target` : 'Right on target!';
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 6 }}>
        <span style={{ color: '#7a6a5a', fontWeight: 500 }}>Avg {Math.round(avg).toLocaleString()} kcal / day</span>
        <span style={{ color: barColor, fontWeight: 700 }}>{label}</span>
      </div>
      <div style={{ height: 10, background: '#F0E6D2', borderRadius: 10, overflow: 'hidden' }}>
        <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(100, pct)}%` }} transition={{ duration: 0.9, ease: 'easeOut' }}
          style={{ height: '100%', background: barColor, borderRadius: 10 }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#d4bb98', marginTop: 4 }}>
        <span>0 kcal</span><span>Target: {Math.round(target).toLocaleString()} kcal</span>
      </div>
    </div>
  );
}

// ─── List items ───────────────────────────────────────────────────────────────
const rowBorder = { paddingBottom: 10, marginBottom: 10, borderBottom: `1px solid` };

function WinRow({ text }) {
  return (
    <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', ...rowBorder, borderBottomColor: TINT.mint.border }}>
      <div style={{ width: 22, height: 22, background: TINT.mint.bg, border: `1px solid ${TINT.mint.border}`, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <CheckCircle size={12} color={TINT.mint.icon} />
      </div>
      <p style={{ margin: 0, fontSize: 13, color: '#5a4a3a', lineHeight: 1.65 }}>{text}</p>
    </div>
  );
}

function ImpRow({ text }) {
  return (
    <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', ...rowBorder, borderBottomColor: TINT.butter.border }}>
      <div style={{ width: 22, height: 22, background: TINT.butter.bg, border: `1px solid ${TINT.butter.border}`, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <AlertTriangle size={12} color={TINT.butter.icon} />
      </div>
      <p style={{ margin: 0, fontSize: 13, color: '#5a4a3a', lineHeight: 1.65 }}>{text}</p>
    </div>
  );
}

function GoalRow({ text, index }) {
  return (
    <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', ...rowBorder, borderBottomColor: TINT.lilac.border }}>
      <div style={{ width: 22, height: 22, background: TINT.lilac.bg, border: `1px solid ${TINT.lilac.border}`, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <span style={{ fontSize: 10, fontWeight: 800, color: TINT.lilac.icon }}>{index + 1}</span>
      </div>
      <p style={{ margin: 0, fontSize: 13, color: '#5a4a3a', lineHeight: 1.65 }}>{text}</p>
    </div>
  );
}

// ─── Full report card ─────────────────────────────────────────────────────────
function ReportCard({ report, isPrimary = false }) {
  const c  = scoreStyle(report.overall_score);
  const wc = report.weight_start && report.weight_end
    ? (parseFloat(report.weight_end) - parseFloat(report.weight_start)).toFixed(1)
    : null;
  const wcN = parseFloat(wc);

  return (
    <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}
      style={{ background: '#fffdf9', borderRadius: isPrimary ? 20 : 16, border: isPrimary ? `2px solid ${c.border}` : '1px solid #F0E6D2', overflow: 'hidden', boxShadow: isPrimary ? '0 4px 20px rgba(180,120,60,0.1)' : '0 1px 6px rgba(180,120,60,0.04)' }}>

      {/* Accent bar */}
      <div style={{ height: 5, background: `linear-gradient(90deg,${c.ring},${c.ring}88)` }} />

      {/* Header — ring + summary */}
      <div style={{ background: `linear-gradient(135deg,${c.bg},#fffdf9)`, padding: '20px 22px', borderBottom: '1px solid #F0E6D2', display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
        <ScoreRing score={report.overall_score} />
        <div style={{ flex: 1, minWidth: 200 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 5 }}>
            <Calendar size={13} color="#a8967f" />
            <span style={{ fontSize: 12, color: '#a8967f', fontWeight: 600 }}>
              {format(parseISO(report.week_start), 'MMMM d')} – {format(parseISO(report.week_end), 'MMMM d, yyyy')}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <span style={{ fontSize: 15, fontWeight: 800, color: c.text }}>{c.icon} {c.label}</span>
            {isPrimary && <span style={{ background: ACCENT, color: '#fff', borderRadius: 6, fontSize: 10, fontWeight: 700, padding: '2px 8px', textTransform: 'uppercase' }}>Latest</span>}
          </div>
          <p style={{ margin: 0, fontSize: 13, color: '#5a4a3a', lineHeight: 1.75 }}>{report.summary}</p>
        </div>
      </div>

      {/* Stat tiles */}
      <div style={{ padding: '16px 22px', borderBottom: '1px solid #F5ECE1', display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <Tile label="Days Logged" value={`${report.days_logged}/7`} sub="meals recorded"
          color={report.days_logged >= 5 ? TINT.mint.text : TINT.butter.text}
          tint={report.days_logged >= 5 ? TINT.mint : TINT.butter}
          icon={<Activity size={16} color={report.days_logged >= 5 ? TINT.mint.icon : TINT.butter.icon} />} />
        {report.weight_end && (
          <Tile label="Weight" value={`${parseFloat(report.weight_end).toFixed(1)} kg`}
            sub={wc !== null ? `${wcN > 0 ? '+' : ''}${wc} kg this week` : undefined}
            color={wcN > 0 ? TINT.peach.text : TINT.mint.text}
            tint={wcN > 0 ? TINT.peach : TINT.mint}
            icon={wcN > 0 ? <TrendingUp size={16} color={TINT.peach.icon} /> : <TrendingDown size={16} color={TINT.mint.icon} />} />
        )}
        {report.bmi_end && (
          <Tile label="BMI" value={parseFloat(report.bmi_end).toFixed(1)} sub="end of week"
            color={parseFloat(report.bmi_end) < 25 ? TINT.mint.text : TINT.butter.text}
            tint={parseFloat(report.bmi_end) < 25 ? TINT.mint : TINT.butter} />
        )}
        {report.avg_daily_protein && (
          <Tile label="Avg Protein" value={`${Math.round(report.avg_daily_protein)}g`} sub="per day"
            tint={TINT.peach} icon={<Flame size={16} color={TINT.peach.icon} />} />
        )}
      </div>

      {/* Calorie adherence */}
      {report.avg_daily_calories && report.calorie_target && (
        <div style={{ padding: '16px 22px', borderBottom: '1px solid #F5ECE1' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
            <Flame size={14} color={TINT.peach.icon} />
            <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#2a1f14' }}>Calorie Adherence</p>
          </div>
          <CalBar avg={parseFloat(report.avg_daily_calories)} target={parseFloat(report.calorie_target)} />
        </div>
      )}

      {/* Wins + Improvements */}
      {(report.wins?.length > 0 || report.improvements?.length > 0) && (
        <div style={{ padding: '16px 22px', borderBottom: '1px solid #F5ECE1', display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(230px,1fr))', gap: 20 }}>
          {report.wins?.length > 0 && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                <CheckCircle size={14} color={TINT.mint.icon} />
                <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#2a1f14' }}>This Week's Wins</p>
              </div>
              {report.wins.map((w, i) => <WinRow key={i} text={w} />)}
            </div>
          )}
          {report.improvements?.length > 0 && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                <AlertTriangle size={14} color={TINT.butter.icon} />
                <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#2a1f14' }}>Improve Next Week</p>
              </div>
              {report.improvements.map((imp, i) => <ImpRow key={i} text={imp} />)}
            </div>
          )}
        </div>
      )}

      {/* Goals */}
      {report.next_week_goals?.length > 0 && (
        <div style={{ padding: '16px 22px', borderBottom: report.medication_notes?.length > 0 ? '1px solid #F5ECE1' : 'none' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
            <Target size={14} color={TINT.lilac.icon} />
            <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#2a1f14' }}>Goals for Next Week</p>
          </div>
          {report.next_week_goals.map((g, i) => <GoalRow key={i} text={g} index={i} />)}
        </div>
      )}

      {/* Medication notes */}
      {report.medication_notes?.length > 0 && (
        <div style={{ padding: '16px 22px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
            <Pill size={14} color={TINT.sky.icon} />
            <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#2a1f14' }}>Medication Reminders</p>
          </div>
          {report.medication_notes.map((n, i) => (
            <div key={i} style={{ background: TINT.sky.bg, border: `1px solid ${TINT.sky.border}`, borderRadius: 10, padding: '11px 14px', marginBottom: 8 }}>
              <p style={{ margin: 0, fontSize: 13, color: TINT.sky.text, lineHeight: 1.65 }}>{n}</p>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}

// ─── Older toggle ─────────────────────────────────────────────────────────────
function OlderToggle({ reports }) {
  const [show, setShow] = useState(false);
  if (!reports.length) return null;
  return (
    <div>
      <button onClick={() => setShow(s => !s)}
        style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '9px 16px', background: show ? '#FBF4EA' : '#fffdf9', border: '1px solid #F0E6D2', borderRadius: 10, fontSize: 13, fontWeight: 600, color: '#7a6a5a', cursor: 'pointer', fontFamily: 'inherit' }}>
        <History size={14} color="#a8967f" />
        {show ? <EyeOff size={14} color="#a8967f" /> : <Eye size={14} color="#a8967f" />}
        {show ? 'Hide' : 'Show'} previous reports ({reports.length})
        {show ? <ChevronUp size={14} color="#a8967f" /> : <ChevronDown size={14} color="#a8967f" />}
      </button>
      <AnimatePresence>
        {show && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.3 }} style={{ overflow: 'hidden' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, paddingTop: 14 }}>
              {reports.map((r, i) => (
                <motion.div key={r.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
                  <ReportCard report={r} />
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function WeeklyReport() {
  const qc = useQueryClient();
  const { data: reports = [], isLoading } = useQuery({
    queryKey: ['weekly-reports'],
    queryFn: () => aiService.getWeeklyReports().then(r => r.data?.results ?? r.data),
  });

  const generate = useMutation({
    mutationFn: () => aiService.generateWeeklyReport(),
    onSuccess: () => qc.invalidateQueries(['weekly-reports']),
  });

  const latest   = reports[0] ?? null;
  const previous = reports.slice(1);

  return (
    <div style={s.root}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={s.panel}>
        {/* Topbar */}
        <div style={s.topbar}>
          <div>
            <h1 style={s.title}>Weekly Health Report</h1>
            <p style={s.sub}>A plain-English summary of each week — wins, areas to improve, and goals ahead.</p>
          </div>
          <button onClick={() => generate.mutate()} disabled={generate.isPending}
            style={{ ...s.btn, opacity: generate.isPending ? 0.65 : 1, cursor: generate.isPending ? 'not-allowed' : 'pointer' }}>
            <RefreshCw size={13} style={generate.isPending ? { animation: 'spin 1s linear infinite' } : {}} />
            {generate.isPending ? 'Generating…' : "Generate This Week's Report"}
          </button>
        </div>

        {/* Content */}
        <div className="scroll" style={s.content}>
          <AnimatePresence>
            {generate.isSuccess && (
              <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                style={{ background: TINT.mint.bg, border: `1px solid ${TINT.mint.border}`, color: TINT.mint.text, borderRadius: 12, padding: '12px 16px', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
                <CheckCircle size={14} /> Report generated successfully!
              </motion.div>
            )}
            {generate.isError && (
              <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                style={{ background: TINT.rose.bg, border: `1px solid ${TINT.rose.border}`, color: TINT.rose.text, borderRadius: 12, padding: '12px 16px', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
                <AlertTriangle size={14} />
                {generate.error?.response?.data?.message || 'Could not generate report. Make sure you have meal logs and health records for this week.'}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Info banner */}
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
            style={{ background: `linear-gradient(135deg,${TINT.butter.bg},#fef9e7)`, border: `1px solid ${TINT.butter.border}`, borderRadius: 16, padding: '14px 18px', display: 'flex', alignItems: 'flex-start', gap: 12 }}>
            <div style={{ width: 34, height: 34, background: TINT.butter.icon, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <BarChart2 size={16} color="#fff" />
            </div>
            <div>
              <p style={{ margin: '0 0 3px', fontSize: 13, fontWeight: 700, color: TINT.butter.text }}>How your score is calculated</p>
              <p style={{ margin: 0, fontSize: 12, color: '#8a7030', lineHeight: 1.7 }}>
                Reports generate every Sunday automatically. The score (0–100) reflects your calorie adherence,
                days logged, weight trend, and BMI for the week.{' '}
                <strong>Medication reminders appear in every report.</strong>
              </p>
            </div>
          </motion.div>

          {/* Body */}
          {isLoading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
              <div style={{ width: 36, height: 36, border: '3px solid #F0E6D2', borderTopColor: P, borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            </div>
          ) : !latest ? (
            <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
              style={{ textAlign: 'center', padding: '60px 24px', background: '#fffdf9', borderRadius: 20, border: '1px dashed #F0E6D2' }}>
              <div style={{ width: 64, height: 64, background: TINT.butter.bg, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <BarChart2 size={28} color={TINT.butter.icon} />
              </div>
              <p style={{ fontSize: 16, fontWeight: 800, color: '#2a1f14', margin: '0 0 8px' }}>No reports yet</p>
              <p style={{ fontSize: 13, color: '#a8967f', fontWeight: 500, maxWidth: 380, margin: '0 auto 20px' }}>
                Generate your first report. Make sure you have logged at least some meals and one health record this week.
              </p>
              <button onClick={() => generate.mutate()} disabled={generate.isPending} style={s.btn}>
                <BarChart2 size={13} /> Generate First Report
              </button>
            </motion.div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                  <div style={{ width: 3, height: 18, background: ACCENT, borderRadius: 2 }} />
                  <span style={{ fontSize: 11, fontWeight: 800, color: '#a8967f', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Most Recent Report</span>
                </div>
                <ReportCard report={latest} isPrimary />
              </div>
              <OlderToggle reports={previous} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = {
  root:    { flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', height: '100%', fontFamily: "'DM Sans',sans-serif", background: BG, padding: 14, boxSizing: 'border-box' },
  panel:   { flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: PANEL, borderRadius: 24, border: '1px solid rgba(255,255,255,0.9)', boxShadow: '0 4px 24px rgba(180,120,60,0.08)' },
  topbar:  { background: '#fff', padding: '18px 26px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #F5ECE1', flexShrink: 0, flexWrap: 'wrap', gap: 10 },
  title:   { margin: 0, fontSize: 20, fontWeight: 800, color: '#1a1208', letterSpacing: '-0.5px' },
  sub:     { margin: '3px 0 0', fontSize: 12, color: '#a8967f', fontWeight: 500 },
  content: { flex: 1, overflowY: 'auto', padding: '22px 26px', display: 'flex', flexDirection: 'column', gap: 18 },
  btn:     { display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 18px', background: ACCENT, color: '#fff', border: 'none', borderRadius: 12, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 2px 6px rgba(232,117,74,0.2)', transition: 'opacity 0.15s' },
};
