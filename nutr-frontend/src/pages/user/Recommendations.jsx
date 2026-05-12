import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles, RefreshCw, TrendingUp, Minus, AlertTriangle, CheckCircle,
  Zap, Utensils, ChevronDown, ChevronUp, ArrowUp, ArrowDown,
  Activity, Pill, Scale, History, Eye, EyeOff, X,
} from 'lucide-react';
import { aiService } from '../../services/ai.service';
import { format, parseISO } from 'date-fns';

// ─── Design tokens (mirrors UserDashboard) ────────────────────────────────────
const P        = '#2E7D32';
const ACCENT   = '#F59B6B';
const ACCENT_D = '#E8754A';
const BG       = '#FCE4CF';
const PANEL    = '#FFFFFF';
const TINT = {
  peach:  { bg: '#FFE5D1', border: '#FFD0AE', text: '#9A4B1F', icon: '#E8754A' },
  mint:   { bg: '#D7F2E1', border: '#A8E2BC', text: '#1F5C36', icon: '#2E7D32' },
  sky:    { bg: '#D9ECFA', border: '#B0D5F1', text: '#1A4D7A', icon: '#1565C0' },
  lilac:  { bg: '#EADCF7', border: '#D2BCEA', text: '#4B2B7A', icon: '#7c3aed' },
  butter: { bg: '#FFF1C9', border: '#FFE08F', text: '#7A5800', icon: '#d97706' },
  rose:   { bg: '#FBDAE0', border: '#F4B5BF', text: '#7A1F33', icon: '#c62828' },
};

// ─── Risk / status maps ───────────────────────────────────────────────────────
const RISK_COLOR = {
  low:      { bg: '#D7F2E1', border: '#A8E2BC', text: '#1F5C36', badge: '#bbf7d0', badgeText: '#166534', accent: '#22c55e' },
  medium:   { bg: '#FFF1C9', border: '#FFE08F', text: '#7A5800', badge: '#fef3c7', badgeText: '#92400e', accent: '#f59e0b' },
  high:     { bg: '#FFE5D1', border: '#FFD0AE', text: '#9A4B1F', badge: '#ffedd5', badgeText: '#9a3412', accent: '#f97316' },
  critical: { bg: '#FBDAE0', border: '#F4B5BF', text: '#7A1F33', badge: '#fee2e2', badgeText: '#991b1b', accent: '#ef4444' },
};

const STATUS_COLOR = {
  good:    { bg: '#D7F2E1', icon: '#16a34a', border: '#A8E2BC' },
  caution: { bg: '#FFF1C9', icon: '#d97706', border: '#FFE08F' },
  warning: { bg: '#FFE5D1', icon: '#ea580c', border: '#FFD0AE' },
  danger:  { bg: '#FBDAE0', icon: '#dc2626', border: '#F4B5BF' },
  stable:  { bg: '#D7F2E1', icon: '#16a34a', border: '#A8E2BC' },
};

const PRIORITY = {
  high:   { bg: '#FBDAE0', text: '#7A1F33', dot: '#ef4444', label: 'Priority' },
  medium: { bg: '#FFF1C9', text: '#7A5800', dot: '#f59e0b', label: 'Important' },
  low:    { bg: '#D9ECFA', text: '#1A4D7A', dot: '#0ea5e9', label: 'Good habit' },
};

const MEAL_META = {
  breakfast: { emoji: '🌅', label: 'Breakfast', color: '#FFE5D1', border: '#FFD0AE' },
  lunch:     { emoji: '☀️',  label: 'Lunch',     color: '#D7F2E1', border: '#A8E2BC' },
  dinner:    { emoji: '🌙', label: 'Dinner',    color: '#D9ECFA', border: '#B0D5F1' },
  snacks:    { emoji: '🍎', label: 'Snacks',    color: '#EADCF7', border: '#D2BCEA' },
};

// ─── Tiny helpers ─────────────────────────────────────────────────────────────
function dirIcon(dir, status) {
  const c = STATUS_COLOR[status] || STATUS_COLOR.stable;
  if (dir === 'up'   || dir === 'over') return <ArrowUp  size={13} color={c.icon} />;
  if (dir === 'down' || dir === 'low')  return <ArrowDown size={13} color={c.icon} />;
  return <Minus size={13} color={c.icon} />;
}

// ─── Collapsible section wrapper ──────────────────────────────────────────────
function Section({ iconEl, title, collapsible = false, defaultOpen = true, children }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ borderTop: `1px solid #F0E6D2`, paddingTop: 18, marginTop: 18 }}>
      <div
        onClick={() => collapsible && setOpen(o => !o)}
        style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: open ? 14 : 0, cursor: collapsible ? 'pointer' : 'default', userSelect: 'none' }}
      >
        <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 28, borderRadius: 8, background: TINT.mint.bg, border: `1px solid ${TINT.mint.border}` }}>
          {iconEl}
        </span>
        <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#2a1f14', flex: 1 }}>{title}</h3>
        {collapsible && (
          <span style={{ color: '#a8967f' }}>{open ? <ChevronUp size={15} /> : <ChevronDown size={15} />}</span>
        )}
      </div>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.25 }}>
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Sub-sections ─────────────────────────────────────────────────────────────
function OverallStatus({ rec }) {
  const raw = rec.raw_response || {};
  const risk = raw.overall_risk || 'low';
  const c = RISK_COLOR[risk] || RISK_COLOR.low;
  return (
    <div style={{ background: `linear-gradient(135deg,${c.bg},#fffdf9)`, border: `1.5px solid ${c.border}`, borderRadius: 16, padding: '18px 20px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 200 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
            <Activity size={14} color={c.text} />
            <span style={{ fontSize: 10, fontWeight: 800, color: c.text, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Health Summary</span>
          </div>
          <p style={{ fontSize: 13, color: '#5a4a3a', lineHeight: 1.75, margin: 0 }}>{rec.notes || raw.plain_summary}</p>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {raw.bmi && (
            <div style={{ background: '#fffdf9', borderRadius: 12, padding: '12px 14px', textAlign: 'center', border: `1px solid ${c.border}`, minWidth: 74 }}>
              <p style={{ margin: '0 0 2px', fontSize: 9, color: '#a8967f', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>BMI</p>
              <p style={{ margin: '0 0 1px', fontSize: 22, fontWeight: 800, color: '#2a1f14', lineHeight: 1 }}>{raw.bmi}</p>
              <p style={{ margin: 0, fontSize: 9, color: c.text, fontWeight: 700 }}>{raw.bmi_category}</p>
            </div>
          )}
          {raw.calorie_target && (
            <div style={{ background: '#fffdf9', borderRadius: 12, padding: '12px 14px', textAlign: 'center', border: `1px solid ${c.border}`, minWidth: 74 }}>
              <p style={{ margin: '0 0 2px', fontSize: 9, color: '#a8967f', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Daily cal.</p>
              <p style={{ margin: '0 0 1px', fontSize: 20, fontWeight: 800, color: P, lineHeight: 1 }}>{Math.round(raw.calorie_target).toLocaleString()}</p>
              <p style={{ margin: 0, fontSize: 9, color: '#a8967f' }}>kcal / day</p>
            </div>
          )}
          <div style={{ background: c.badge, borderRadius: 12, padding: '12px 14px', textAlign: 'center', border: `1px solid ${c.border}`, minWidth: 74 }}>
            <p style={{ margin: '0 0 2px', fontSize: 9, color: c.badgeText, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Risk</p>
            <p style={{ margin: 0, fontSize: 15, fontWeight: 800, color: c.text, textTransform: 'capitalize' }}>{risk}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function TrendingSection({ trending }) {
  if (!trending?.length) return null;
  return (
    <Section iconEl={<TrendingUp size={14} color={P} />} title="Health Trends">
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(180px,1fr))', gap: 10 }}>
        {trending.map((t, i) => {
          const c = STATUS_COLOR[t.status] || STATUS_COLOR.stable;
          return (
            <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
              style={{ background: c.bg, border: `1px solid ${c.border}`, borderRadius: 12, padding: '12px 14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 4 }}>
                {dirIcon(t.direction, t.status)}
                <span style={{ fontSize: 10, fontWeight: 700, color: '#5a4a3a', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t.label}</span>
              </div>
              <p style={{ margin: '0 0 3px', fontSize: 16, fontWeight: 800, color: '#2a1f14' }}>{t.value}</p>
              <p style={{ margin: 0, fontSize: 11, color: '#7a6a5a', lineHeight: 1.5 }}>{t.detail}</p>
            </motion.div>
          );
        })}
      </div>
    </Section>
  );
}

function WarningsSection({ warnings }) {
  if (!warnings?.length) return null;
  const ok = warnings.length === 1 && warnings[0].toLowerCase().includes('generally balanced');
  return (
    <Section iconEl={ok ? <CheckCircle size={14} color={P} /> : <AlertTriangle size={14} color="#c62828" />}
      title={ok ? 'Your Health Looks Good' : 'Risks if Nothing Changes'}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {warnings.map((w, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, background: ok ? TINT.mint.bg : TINT.rose.bg, border: `1px solid ${ok ? TINT.mint.border : TINT.rose.border}`, borderRadius: 10, padding: '12px 14px' }}>
            <span style={{ flexShrink: 0, fontSize: 14 }}>{ok ? '✓' : '⚠'}</span>
            <p style={{ margin: 0, fontSize: 13, color: '#5a4a3a', lineHeight: 1.7 }}>{w}</p>
          </div>
        ))}
      </div>
    </Section>
  );
}

function ActionsSection({ actions }) {
  if (!actions?.length) return null;
  return (
    <Section iconEl={<Zap size={14} color={P} />} title="Action Plan — Starting Today">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {actions.map((a, i) => {
          const pc = PRIORITY[a.priority] || PRIORITY.low;
          return (
            <motion.div key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.07 }}
              style={{ display: 'flex', alignItems: 'flex-start', gap: 12, background: '#FBF4EA', border: '1px solid #F0E6D2', borderRadius: 12, padding: '14px 16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0, marginTop: 1 }}>
                <div style={{ width: 7, height: 7, borderRadius: '50%', background: pc.dot }} />
                <span style={{ background: pc.bg, color: pc.text, borderRadius: 6, fontSize: 10, fontWeight: 700, padding: '2px 8px' }}>{pc.label}</span>
              </div>
              <div>
                <p style={{ margin: '0 0 3px', fontSize: 13, fontWeight: 700, color: '#2a1f14' }}>{a.action}</p>
                <p style={{ margin: 0, fontSize: 12, color: '#a8967f', lineHeight: 1.55 }}>{a.why}</p>
              </div>
            </motion.div>
          );
        })}
      </div>
    </Section>
  );
}

function PortionsSection({ portions }) {
  if (!portions || typeof portions !== 'object') return null;
  const meals = ['breakfast', 'lunch', 'dinner', 'snacks'];
  if (!meals.some(m => portions[m]?.items?.length > 0)) return null;
  const avoidList = Array.isArray(portions.avoid) ? portions.avoid : [];
  return (
    <Section iconEl={<Scale size={14} color={P} />} title="Recommended Foods & Quantities" collapsible defaultOpen={false}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {portions.dietary_note && (
          <div style={{ background: TINT.mint.bg, border: `1px solid ${TINT.mint.border}`, borderRadius: 8, padding: '10px 14px' }}>
            <p style={{ margin: 0, fontSize: 12, color: TINT.mint.text }}>🌱 {portions.dietary_note}</p>
          </div>
        )}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(230px,1fr))', gap: 10 }}>
          {meals.map((meal) => {
            const e = portions[meal];
            if (!e?.items?.length) return null;
            const m = MEAL_META[meal];
            return (
              <div key={meal} style={{ background: m.color, border: `1px solid ${m.border}`, borderRadius: 12, overflow: 'hidden' }}>
                <div style={{ padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#2a1f14' }}>{m.emoji} {m.label}</span>
                  {e.target_kcal && <span style={{ fontSize: 11, color: '#7a6a5a', fontWeight: 600 }}>~{e.target_kcal} kcal</span>}
                </div>
                <div style={{ background: '#fffdf9', borderTop: `1px solid ${m.border}` }}>
                  {e.items.map((item, i) => (
                    <div key={i} style={{ display: 'flex', gap: 10, padding: '9px 14px', borderBottom: i < e.items.length - 1 ? `1px solid ${m.border}` : 'none' }}>
                      <div style={{ width: 5, height: 5, borderRadius: '50%', background: P, flexShrink: 0, marginTop: 7 }} />
                      <div style={{ flex: 1 }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: '#2a1f14' }}>{item.food} </span>
                        <span style={{ fontSize: 11, fontWeight: 700, color: P, background: TINT.mint.bg, borderRadius: 4, padding: '1px 6px' }}>{item.quantity}</span>
                        {item.notes && <p style={{ margin: '2px 0 0', fontSize: 10, color: '#a8967f' }}>{item.notes}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
        {avoidList.length > 0 && (
          <div style={{ background: TINT.rose.bg, border: `1px solid ${TINT.rose.border}`, borderRadius: 10, padding: '12px 14px' }}>
            <p style={{ margin: '0 0 8px', fontSize: 12, fontWeight: 700, color: TINT.rose.text }}>🚫 Foods to Avoid</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {avoidList.map((f, i) => <span key={i} style={{ background: '#fff', color: TINT.rose.text, borderRadius: 6, padding: '3px 10px', fontSize: 11, fontWeight: 600, border: `1px solid ${TINT.rose.border}` }}>{f}</span>)}
            </div>
          </div>
        )}
      </div>
    </Section>
  );
}

function MedSection({ medSection }) {
  if (!medSection) return null;
  const { interactions = [], general_notes = [] } = medSection;
  if (!interactions.length && !general_notes.length) return null;
  return (
    <Section iconEl={<Pill size={14} color={TINT.sky.icon} />} title="Medication & Food Interactions" collapsible defaultOpen={false}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {general_notes.map((n, i) => (
          <div key={i} style={{ background: TINT.sky.bg, border: `1px solid ${TINT.sky.border}`, borderRadius: 8, padding: '11px 14px' }}>
            <p style={{ margin: 0, fontSize: 13, color: TINT.sky.text, lineHeight: 1.65 }}>{n}</p>
          </div>
        ))}
        {interactions.map((med, i) => (
          <div key={i} style={{ background: '#fffdf9', border: '1px solid #F0E6D2', borderRadius: 12, overflow: 'hidden' }}>
            <div style={{ background: TINT.peach.bg, padding: '10px 14px', borderBottom: `1px solid ${TINT.peach.border}` }}>
              <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: TINT.peach.text }}>
                <Pill size={12} style={{ verticalAlign: 'middle', marginRight: 5 }} />
                {med.medication} {med.dosage && `(${med.dosage})`} — {med.frequency}
              </p>
            </div>
            <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 6 }}>
              {med.warnings.map((w, j) => <p key={j} style={{ margin: 0, fontSize: 12, color: '#5a4a3a', lineHeight: 1.65 }}>⚠ {w}</p>)}
              {med.avoid?.length > 0 && <div><p style={{ margin: '0 0 4px', fontSize: 10, fontWeight: 700, color: TINT.rose.text, textTransform: 'uppercase' }}>Avoid</p>{med.avoid.map((a, j) => <p key={j} style={{ margin: '0 0 2px', fontSize: 12, color: '#7a6a5a' }}>• {a}</p>)}</div>}
              {med.include?.length > 0 && <div><p style={{ margin: '0 0 4px', fontSize: 10, fontWeight: 700, color: TINT.mint.text, textTransform: 'uppercase' }}>Include</p>{med.include.map((inc, j) => <p key={j} style={{ margin: '0 0 2px', fontSize: 12, color: '#7a6a5a' }}>• {inc}</p>)}</div>}
              {med.tip && <div style={{ background: TINT.mint.bg, borderRadius: 8, padding: '8px 12px' }}><p style={{ margin: 0, fontSize: 12, color: TINT.mint.text, fontWeight: 600 }}>💡 {med.tip}</p></div>}
            </div>
          </div>
        ))}
      </div>
    </Section>
  );
}

function MealPlanSection({ dietPlan, foodPortions }) {
  if (!dietPlan || !Object.keys(dietPlan).length) return null;
  const meals = ['breakfast', 'lunch', 'dinner', 'snacks'];
  const avoidList = Array.isArray(dietPlan.avoid) ? dietPlan.avoid : [];
  return (
    <Section iconEl={<Utensils size={14} color={P} />} title="Personalised Meal Plan" collapsible defaultOpen={false}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {foodPortions && Object.keys(foodPortions).length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, padding: '10px 14px', background: TINT.mint.bg, borderRadius: 8, border: `1px solid ${TINT.mint.border}` }}>
            {Object.entries(foodPortions).map(([k, v]) => (
              <span key={k} style={{ fontSize: 12, fontWeight: 600, color: TINT.mint.text }}>
                <span style={{ fontWeight: 400, color: '#7a6a5a', textTransform: 'capitalize' }}>{k.replace(/_/g, ' ')}: </span>{v}
              </span>
            ))}
          </div>
        )}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(230px,1fr))', gap: 10 }}>
          {meals.map((meal) => {
            const entry = dietPlan[meal];
            if (!entry) return null;
            const foods = typeof entry === 'object' && !Array.isArray(entry) ? entry.foods : entry;
            const kcal  = typeof entry === 'object' && !Array.isArray(entry) ? entry.target_kcal : null;
            if (!foods?.length) return null;
            const m = MEAL_META[meal];
            return (
              <div key={meal} style={{ background: m.color, border: `1px solid ${m.border}`, borderRadius: 12, padding: '12px 14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#2a1f14' }}>{m.emoji} {m.label}</span>
                  {kcal && <span style={{ fontSize: 11, color: '#a8967f' }}>~{kcal} kcal</span>}
                </div>
                {(Array.isArray(foods) ? foods : [foods]).map((f, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 4 }}>
                    <span style={{ width: 4, height: 4, borderRadius: '50%', background: P, flexShrink: 0 }} />
                    <span style={{ fontSize: 12, color: '#5a4a3a' }}>{f}</span>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
        {avoidList.length > 0 && (
          <div style={{ background: TINT.rose.bg, border: `1px solid ${TINT.rose.border}`, borderRadius: 10, padding: '12px 14px' }}>
            <p style={{ margin: '0 0 8px', fontSize: 12, fontWeight: 700, color: TINT.rose.text }}>🚫 Foods to Avoid</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {avoidList.map((f, i) => <span key={i} style={{ background: '#fff', color: TINT.rose.text, borderRadius: 6, padding: '3px 8px', fontSize: 11, fontWeight: 600, border: `1px solid ${TINT.rose.border}` }}>{f}</span>)}
            </div>
          </div>
        )}
      </div>
    </Section>
  );
}

// ─── Full recommendation card ─────────────────────────────────────────────────
function RecCard({ rec, isPrimary = false }) {
  const raw  = rec.raw_response || {};
  const risk = raw.overall_risk || 'low';
  const c    = RISK_COLOR[risk] || RISK_COLOR.low;
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}
      style={{ background: '#fffdf9', borderRadius: isPrimary ? 20 : 16, border: isPrimary ? `2px solid ${c.border}` : '1px solid #F0E6D2', padding: isPrimary ? '22px 24px' : '18px 20px', boxShadow: isPrimary ? '0 4px 20px rgba(180,120,60,0.1)' : '0 1px 6px rgba(180,120,60,0.04)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {isPrimary && <span style={{ background: ACCENT, color: '#fff', borderRadius: 6, fontSize: 10, fontWeight: 700, padding: '3px 8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Latest</span>}
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <Sparkles size={13} color={P} />
            <span style={{ fontSize: 11, fontWeight: 800, color: P, textTransform: 'uppercase', letterSpacing: '0.06em' }}>AI Analysis</span>
          </div>
        </div>
        <span style={{ fontSize: 11, color: '#a8967f', background: '#FBF4EA', padding: '3px 10px', borderRadius: 6, border: '1px solid #F0E6D2', fontWeight: 500 }}>
          {format(parseISO(rec.created_at), 'MMM d, yyyy · h:mm a')}
        </span>
      </div>
      <OverallStatus rec={rec} />
      <TrendingSection trending={raw.trending || []} />
      <WarningsSection warnings={raw.warnings || []} />
      <ActionsSection actions={raw.quick_actions || []} />
      <PortionsSection portions={raw.recommended_portions} />
      <MedSection medSection={raw.medication_section} />
      <MealPlanSection dietPlan={rec.diet_plan} foodPortions={rec.food_portions} />
    </motion.div>
  );
}

// ─── Previous toggle ──────────────────────────────────────────────────────────
function PrevToggle({ recs }) {
  const [show, setShow] = useState(false);
  if (!recs.length) return null;
  return (
    <div>
      <button onClick={() => setShow(s => !s)}
        style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '9px 16px', background: show ? '#FBF4EA' : '#fffdf9', border: '1px solid #F0E6D2', borderRadius: 10, fontSize: 13, fontWeight: 600, color: '#7a6a5a', cursor: 'pointer', fontFamily: 'inherit' }}>
        <History size={14} color="#a8967f" />
        {show ? <EyeOff size={14} color="#a8967f" /> : <Eye size={14} color="#a8967f" />}
        {show ? 'Hide' : 'Show'} previous recommendations ({recs.length})
        {show ? <ChevronUp size={14} color="#a8967f" /> : <ChevronDown size={14} color="#a8967f" />}
      </button>
      <AnimatePresence>
        {show && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.3 }} style={{ overflow: 'hidden' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, paddingTop: 14 }}>
              {recs.map((rec, i) => (
                <motion.div key={rec.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}>
                  <RecCard rec={rec} />
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
export default function Recommendations() {
  const qc = useQueryClient();
  const [error, setError] = useState('');

  const { data: recs = [], isLoading } = useQuery({
    queryKey: ['recommendations'],
    queryFn: () => aiService.getRecommendations().then(r => r.data?.results ?? r.data),
  });

  const generate = useMutation({
    mutationFn: () => aiService.generateRecommendation(),
    onSuccess: () => { setError(''); qc.invalidateQueries(['recommendations']); },
    onError: (e) => setError(e.response?.data?.message || e.message || 'Failed to generate.'),
  });

  const latest   = recs[0] ?? null;
  const previous = recs.slice(1);

  return (
    <div style={s.root}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}} @keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}`}</style>
      <div style={s.panel}>
        {/* Topbar */}
        <div style={s.topbar}>
          <div>
            <h1 style={s.title}>AI Health Recommendations</h1>
            <p style={s.sub}>Plain-English insights based on your health data.</p>
          </div>
          <button onClick={() => generate.mutate()} disabled={generate.isPending}
            style={{ ...s.btn, opacity: generate.isPending ? 0.65 : 1, cursor: generate.isPending ? 'not-allowed' : 'pointer' }}>
            <RefreshCw size={13} style={generate.isPending ? { animation: 'spin 1s linear infinite' } : {}} />
            {generate.isPending ? 'Analysing…' : 'Generate New Analysis'}
          </button>
        </div>

        {/* Content */}
        <div className="scroll" style={s.content}>
          <AnimatePresence>
            {error && (
              <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                style={{ background: TINT.rose.bg, border: `1px solid ${TINT.rose.border}`, color: TINT.rose.text, borderRadius: 12, padding: '12px 16px', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
                <AlertTriangle size={14} />{error}
                <button onClick={() => setError('')} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: TINT.rose.text }}><X size={14} /></button>
              </motion.div>
            )}
          </AnimatePresence>
          <AnimatePresence>
            {generate.isSuccess && (
              <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                style={{ background: TINT.mint.bg, border: `1px solid ${TINT.mint.border}`, color: TINT.mint.text, borderRadius: 12, padding: '12px 16px', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
                <CheckCircle size={14} /> New analysis generated successfully!
              </motion.div>
            )}
          </AnimatePresence>

          {/* Info banner */}
          <div style={{ background: TINT.mint.bg, border: `1px solid ${TINT.mint.border}`, borderRadius: 16, padding: '14px 18px', display: 'flex', alignItems: 'flex-start', gap: 12 }}>
            <div style={{ width: 34, height: 34, background: P, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Sparkles size={16} color="#fff" />
            </div>
            <div>
              <p style={{ margin: '0 0 2px', fontSize: 13, fontWeight: 700, color: TINT.mint.text }}>How this works</p>
              <p style={{ margin: 0, fontSize: 12, color: '#4a7a5a', lineHeight: 1.7 }}>
                This analysis looks at your weight trend, daily meals, medical conditions, and health goals.
                <strong> For best results, keep your health records and meal logs up to date.</strong>
              </p>
            </div>
          </div>

          {/* Body */}
          {isLoading ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200 }}>
              <div style={{ width: 36, height: 36, border: '3px solid #F0E6D2', borderTopColor: P, borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            </div>
          ) : !latest ? (
            <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
              style={{ textAlign: 'center', padding: '60px 24px', background: '#fffdf9', borderRadius: 20, border: '1px dashed #F0E6D2' }}>
              <div style={{ width: 64, height: 64, background: TINT.mint.bg, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <Sparkles size={28} color={TINT.mint.icon} />
              </div>
              <p style={{ fontSize: 16, fontWeight: 800, color: '#2a1f14', margin: '0 0 8px' }}>No analysis yet</p>
              <p style={{ fontSize: 13, color: '#a8967f', margin: '0 0 20px', maxWidth: 360, marginLeft: 'auto', marginRight: 'auto' }}>
                Make sure you have at least one health record logged, then generate your first analysis.
              </p>
              <button onClick={() => generate.mutate()} disabled={generate.isPending} style={s.btn}>
                <Sparkles size={13} /> Generate First Analysis
              </button>
            </motion.div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                  <div style={{ width: 3, height: 18, background: ACCENT, borderRadius: 2 }} />
                  <span style={{ fontSize: 11, fontWeight: 800, color: '#a8967f', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Most Recent Analysis</span>
                </div>
                <RecCard rec={latest} isPrimary />
              </div>
              <PrevToggle recs={previous} />
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
  topbar:  { background: '#fff', padding: '18px 26px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #F5ECE1', flexShrink: 0, gap: 12, flexWrap: 'wrap' },
  title:   { margin: 0, fontSize: 20, fontWeight: 800, color: '#1a1208', letterSpacing: '-0.5px' },
  sub:     { margin: '3px 0 0', fontSize: 12, color: '#a8967f', fontWeight: 500 },
  content: { flex: 1, overflowY: 'auto', padding: '22px 26px', display: 'flex', flexDirection: 'column', gap: 18 },
  btn:     { display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 18px', background: ACCENT, color: '#fff', border: 'none', borderRadius: 12, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 2px 6px rgba(232,117,74,0.2)', transition: 'opacity 0.15s' },
};
