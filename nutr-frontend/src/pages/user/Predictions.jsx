import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingUp, Scale, Zap, Heart, ShieldAlert, CheckCircle,
  AlertTriangle, Activity, ChevronDown, ChevronUp, Eye, EyeOff, History,
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

// ─── Risk configs ─────────────────────────────────────────────────────────────
const RISK = {
  low:      { bg: TINT.mint.bg,   border: TINT.mint.border,   text: TINT.mint.text,   badge: '#bbf7d0', badgeText: '#166534', icon: CheckCircle,  iconColor: '#16a34a', label: 'Low Risk',    bar: '#22c55e' },
  medium:   { bg: TINT.butter.bg, border: TINT.butter.border, text: TINT.butter.text, badge: TINT.butter.bg, badgeText: TINT.butter.text, icon: AlertTriangle, iconColor: '#d97706', label: 'Medium Risk', bar: '#f59e0b' },
  high:     { bg: TINT.peach.bg,  border: TINT.peach.border,  text: TINT.peach.text,  badge: TINT.peach.bg,  badgeText: TINT.peach.text,  icon: AlertTriangle, iconColor: '#ea580c', label: 'High Risk',   bar: '#f97316' },
  critical: { bg: TINT.rose.bg,   border: TINT.rose.border,   text: TINT.rose.text,   badge: TINT.rose.bg,   badgeText: TINT.rose.text,   icon: ShieldAlert,  iconColor: '#dc2626', label: 'Critical',    bar: '#ef4444' },
};

const TYPE = {
  weight:              { icon: Scale,    label: 'Weight Forecast',    color: TINT.sky.icon,   bg: TINT.sky.bg,   border: TINT.sky.border,   tagline: 'Where your weight is heading' },
  health_risk:         { icon: Heart,    label: 'Overall Health Risk', color: TINT.lilac.icon, bg: TINT.lilac.bg, border: TINT.lilac.border, tagline: 'Your general health outlook' },
  nutrition_deficit:   { icon: Zap,      label: 'Nutrition Balance',   color: TINT.mint.icon,  bg: TINT.mint.bg,  border: TINT.mint.border,  tagline: 'How well your diet matches your needs' },
  disease_progression: { icon: Activity, label: 'Condition Outlook',   color: TINT.rose.icon,  bg: TINT.rose.bg,  border: TINT.rose.border,  tagline: 'Progression of your health condition' },
};

// ─── Confidence bar ───────────────────────────────────────────────────────────
function ConfBar({ score }) {
  const pct = Math.min(100, Math.max(0, Math.round(parseFloat(score))));
  const color = pct >= 80 ? '#22c55e' : pct >= 60 ? '#f59e0b' : '#a8967f';
  const label = pct >= 80 ? 'High confidence' : pct >= 60 ? 'Moderate' : 'Low confidence';
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
        <span style={{ fontSize: 11, color: '#a8967f', fontWeight: 500 }}>AI confidence</span>
        <span style={{ fontSize: 11, fontWeight: 700, color }}>{pct}% — {label}</span>
      </div>
      <div style={{ height: 8, background: '#F0E6D2', borderRadius: 10, overflow: 'hidden' }}>
        <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.8, ease: 'easeOut' }}
          style={{ height: '100%', background: color, borderRadius: 10 }} />
      </div>
    </div>
  );
}

// ─── Prediction card ──────────────────────────────────────────────────────────
function PredCard({ pred, index = 0 }) {
  const risk = RISK[pred.risk_level] || RISK.low;
  const type = TYPE[pred.prediction_type] || TYPE.health_risk;
  const TypeIcon = type.icon;
  const RiskIcon = risk.icon;

  return (
    <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: index * 0.07 }}
      style={{ background: '#fffdf9', border: `1.5px solid ${risk.border}`, borderRadius: 18, overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 2px 8px rgba(180,120,60,0.06)' }}>
      {/* Accent strip */}
      <div style={{ height: 4, background: risk.bar, borderRadius: '18px 18px 0 0' }} />

      {/* Header */}
      <div style={{ background: `linear-gradient(135deg,${risk.bg},#fffdf9)`, padding: '14px 18px', borderBottom: `1px solid ${risk.border}`, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ background: type.bg, border: `1px solid ${type.border}`, borderRadius: 12, width: 42, height: 42, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <TypeIcon size={20} color={type.color} />
          </div>
          <div>
            <p style={{ margin: 0, fontSize: 14, fontWeight: 800, color: '#2a1f14' }}>{type.label}</p>
            <p style={{ margin: 0, fontSize: 11, color: '#a8967f', fontWeight: 500 }}>{type.tagline}</p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: risk.badge, border: `1px solid ${risk.border}`, borderRadius: 8, padding: '4px 10px', flexShrink: 0 }}>
          <RiskIcon size={11} color={risk.iconColor} />
          <span style={{ fontSize: 11, fontWeight: 700, color: risk.badgeText }}>{risk.label}</span>
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 14, flex: 1 }}>
        {/* Chips */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <span style={{ background: TINT.butter.bg, color: TINT.butter.text, border: `1px solid ${TINT.butter.border}`, borderRadius: 7, padding: '4px 11px', fontSize: 11, fontWeight: 700 }}>
            ⏱ {pred.time_horizon}
          </span>
          <span style={{ background: '#FBF4EA', color: '#a8967f', borderRadius: 7, padding: '4px 11px', fontSize: 11, border: '1px solid #F0E6D2' }}>
            {format(parseISO(pred.created_at), 'MMM d, yyyy')}
          </span>
        </div>

        {/* Weight prediction */}
        {pred.predicted_value !== null && pred.predicted_value !== undefined && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', background: '#FBF4EA', border: '1px solid #F0E6D2', borderRadius: 12 }}>
            <div style={{ width: 44, height: 44, background: TINT.sky.bg, border: `1px solid ${TINT.sky.border}`, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Scale size={20} color={TINT.sky.icon} />
            </div>
            <div>
              <p style={{ margin: '0 0 1px', fontSize: 10, color: '#a8967f', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Predicted weight in {pred.time_horizon}</p>
              <p style={{ margin: 0, fontSize: 26, fontWeight: 800, color: '#2a1f14', lineHeight: 1 }}>
                {parseFloat(pred.predicted_value).toFixed(1)}
                <span style={{ fontSize: 13, fontWeight: 500, color: '#a8967f', marginLeft: 4 }}>kg</span>
              </p>
            </div>
          </div>
        )}

        {/* Description */}
        {pred.description && (
          <div style={{ background: risk.bg, borderRadius: 10, padding: '12px 15px', border: `1px solid ${risk.border}` }}>
            <p style={{ margin: '0 0 5px', fontSize: 10, fontWeight: 800, color: risk.text, textTransform: 'uppercase', letterSpacing: '0.07em' }}>What this means for you</p>
            <p style={{ margin: 0, fontSize: 13, color: '#5a4a3a', lineHeight: 1.75 }}>{pred.description}</p>
          </div>
        )}

        {/* Confidence */}
        {pred.confidence_score !== null && pred.confidence_score !== undefined && (
          <ConfBar score={pred.confidence_score} />
        )}
      </div>
    </motion.div>
  );
}

// ─── Groups ───────────────────────────────────────────────────────────────────
function PredGroup({ label, preds, startIndex = 0 }) {
  if (!preds.length) return null;
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
        <div style={{ width: 3, height: 16, background: ACCENT, borderRadius: 2 }} />
        <span style={{ fontSize: 11, fontWeight: 800, color: '#a8967f', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</span>
        <span style={{ background: '#FBF4EA', color: '#a8967f', borderRadius: 100, padding: '2px 8px', fontSize: 11, fontWeight: 700, border: '1px solid #F0E6D2' }}>{preds.length}</span>
      </div>
      <div style={{ display: 'grid', gap: 14, gridTemplateColumns: 'repeat(auto-fill,minmax(290px,1fr))' }}>
        {preds.map((p, i) => <PredCard key={p.id} pred={p} index={startIndex + i} />)}
      </div>
    </div>
  );
}

function OlderToggle({ preds, startIndex }) {
  const [show, setShow] = useState(false);
  if (!preds.length) return null;
  return (
    <div>
      <button onClick={() => setShow(s => !s)}
        style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '9px 16px', background: show ? '#FBF4EA' : '#fffdf9', border: '1px solid #F0E6D2', borderRadius: 10, fontSize: 13, fontWeight: 600, color: '#7a6a5a', cursor: 'pointer', fontFamily: 'inherit' }}>
        <History size={14} color="#a8967f" />
        {show ? <EyeOff size={14} color="#a8967f" /> : <Eye size={14} color="#a8967f" />}
        {show ? 'Hide' : 'Show'} older forecasts ({preds.length})
        {show ? <ChevronUp size={14} color="#a8967f" /> : <ChevronDown size={14} color="#a8967f" />}
      </button>
      <AnimatePresence>
        {show && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.3 }} style={{ overflow: 'hidden' }}>
            <div style={{ paddingTop: 14 }}>
              <PredGroup label="Older Forecasts" preds={preds} startIndex={startIndex} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function Predictions() {
  const { data: predictions = [], isLoading } = useQuery({
    queryKey: ['predictions'],
    queryFn: () => aiService.getPredictions().then(r => r.data?.results ?? r.data),
  });

  const latest = predictions.slice(0, 4);
  const older  = predictions.slice(4);

  return (
    <div style={s.root}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={s.panel}>
        {/* Topbar */}
        <div style={s.topbar}>
          <div>
            <h1 style={s.title}>Health Forecasts</h1>
            <p style={s.sub}>AI predictions about where your health is heading — based on your data trends.</p>
          </div>
        </div>

        {/* Content */}
        <div className="scroll" style={s.content}>
          {/* Banner */}
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
            style={{ background: `linear-gradient(135deg,${TINT.lilac.bg},#f3e8ff)`, border: `1px solid ${TINT.lilac.border}`, borderRadius: 16, padding: '14px 18px', display: 'flex', alignItems: 'flex-start', gap: 12 }}>
            <div style={{ width: 34, height: 34, background: TINT.lilac.icon, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <TrendingUp size={16} color="#fff" />
            </div>
            <div>
              <p style={{ margin: '0 0 3px', fontSize: 13, fontWeight: 700, color: TINT.lilac.text }}>About these forecasts</p>
              <p style={{ margin: 0, fontSize: 12, color: '#6d5b90', lineHeight: 1.7 }}>
                Based on your weight trend, eating habits, medical conditions, and activity level.
                These are <strong>estimates to guide your wellbeing</strong>, not medical diagnoses.
                Always consult a healthcare professional for medical advice.
              </p>
            </div>
          </motion.div>

          {/* Body */}
          {isLoading ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200 }}>
              <div style={{ width: 36, height: 36, border: '3px solid #F0E6D2', borderTopColor: TINT.lilac.icon, borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            </div>
          ) : predictions.length === 0 ? (
            <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
              style={{ textAlign: 'center', padding: '60px 24px', background: '#fffdf9', borderRadius: 20, border: '1px dashed #F0E6D2' }}>
              <div style={{ width: 64, height: 64, background: TINT.lilac.bg, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <TrendingUp size={28} color={TINT.lilac.icon} />
              </div>
              <p style={{ fontSize: 16, fontWeight: 800, color: '#2a1f14', margin: '0 0 8px' }}>No forecasts yet</p>
              <p style={{ fontSize: 13, color: '#a8967f', fontWeight: 500, maxWidth: 380, margin: '0 auto' }}>
                Forecasts are generated when you request a new AI analysis on the Recommendations page.
                Keep logging your health data and meals so the AI has enough information.
              </p>
            </motion.div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <PredGroup label="Latest Forecasts" preds={latest} startIndex={0} />
              <OlderToggle preds={older} startIndex={latest.length} />
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
  topbar:  { background: '#fff', padding: '18px 26px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #F5ECE1', flexShrink: 0 },
  title:   { margin: 0, fontSize: 20, fontWeight: 800, color: '#1a1208', letterSpacing: '-0.5px' },
  sub:     { margin: '3px 0 0', fontSize: 12, color: '#a8967f', fontWeight: 500 },
  content: { flex: 1, overflowY: 'auto', padding: '22px 26px', display: 'flex', flexDirection: 'column', gap: 20 },
};
