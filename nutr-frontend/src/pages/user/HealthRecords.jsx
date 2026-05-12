import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, X, Activity, HeartPulse, Settings2, ChevronRight } from 'lucide-react';
import { healthService } from '../../services/health.service';
import { format, parseISO } from 'date-fns';

// ─── Design tokens ────────────────────────────────────────────────────────────
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

const TABS = [
  { id: 'records',     label: 'Health Records',      icon: Activity  },
  { id: 'conditions',  label: 'Diseases & Conditions', icon: HeartPulse },
  { id: 'preferences', label: 'Diet & Lifestyle',     icon: Settings2  },
];

const SEVERITY = {
  mild:     { ...TINT.mint,   dot: '#16a34a' },
  moderate: { ...TINT.butter, dot: '#d97706' },
  severe:   { ...TINT.rose,   dot: '#dc2626' },
};

function bmiStyle(bmi) {
  const v = parseFloat(bmi);
  if (v < 18.5) return { color: TINT.butter.text, bg: TINT.butter.bg, border: TINT.butter.border, label: 'Underweight' };
  if (v < 25)   return { color: TINT.mint.text,   bg: TINT.mint.bg,   border: TINT.mint.border,   label: 'Normal' };
  if (v < 30)   return { color: TINT.peach.text,  bg: TINT.peach.bg,  border: TINT.peach.border,  label: 'Overweight' };
  return               { color: TINT.rose.text,   bg: TINT.rose.bg,   border: TINT.rose.border,   label: 'Obese' };
}

// ─── Records tab ──────────────────────────────────────────────────────────────
function RecordsTab() {
  const qc = useQueryClient();
  const [modal, setModal] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm]   = useState({ weight: '', height: '', activity_level: '', notes: '' });

  const { data: records = [], isLoading } = useQuery({
    queryKey: ['health-records'],
    queryFn: () => healthService.getRecords().then(r => r.data?.results ?? []),
  });

  const mutation = useMutation({
    mutationFn: (data) => healthService.createRecord(data),
    onSuccess: () => { qc.invalidateQueries(['health-records']); setModal(false); setForm({ weight: '', height: '', activity_level: '', notes: '' }); },
    onError: (e) => setError(e.response?.data?.message || e.message),
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button onClick={() => setModal(true)} style={s.btn}><Plus size={14} /> Add Record</button>
      </div>

      {isLoading ? (
        <div style={s.center}><div style={s.spinner} /></div>
      ) : records.length === 0 ? (
        <div style={s.empty}>
          <div style={{ width: 56, height: 56, background: TINT.mint.bg, border: `1px solid ${TINT.mint.border}`, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
            <Activity size={24} color={TINT.mint.icon} />
          </div>
          <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#2a1f14' }}>No health records yet</p>
          <p style={{ margin: '6px 0 0', fontSize: 12, color: '#a8967f', fontWeight: 500 }}>Add your first record to start tracking your health.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {records.map((r) => {
            const bs = bmiStyle(r.bmi);
            return (
              <div key={r.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 14, background: '#FBF4EA', border: '1px solid #F0E6D2', borderRadius: 16, padding: '16px 18px' }}>
                <div style={{ width: 44, height: 44, background: TINT.mint.bg, border: `1px solid ${TINT.mint.border}`, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Activity size={20} color={TINT.mint.icon} />
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ margin: '0 0 8px', fontSize: 11, color: '#a8967f', fontWeight: 600 }}>
                    {format(parseISO(r.recorded_at), 'EEEE, MMMM d, yyyy')}
                  </p>
                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                    <span style={{ background: '#fffdf9', border: '1px solid #F0E6D2', borderRadius: 8, padding: '5px 12px', fontSize: 13 }}>
                      <strong style={{ color: '#2a1f14', fontWeight: 800 }}>{r.weight}</strong>
                      <span style={{ color: '#a8967f', fontWeight: 500 }}> kg</span>
                    </span>
                    <span style={{ background: '#fffdf9', border: '1px solid #F0E6D2', borderRadius: 8, padding: '5px 12px', fontSize: 13 }}>
                      <strong style={{ color: '#2a1f14', fontWeight: 800 }}>{r.height}</strong>
                      <span style={{ color: '#a8967f', fontWeight: 500 }}> cm</span>
                    </span>
                    <span style={{ background: bs.bg, border: `1px solid ${bs.border}`, borderRadius: 8, padding: '5px 12px', fontSize: 13, color: bs.color, fontWeight: 700 }}>
                      BMI {parseFloat(r.bmi).toFixed(1)} · {bs.label}
                    </span>
                  </div>
                  {r.notes && <p style={{ margin: '8px 0 0', fontSize: 12, color: '#7a6a5a', lineHeight: 1.6 }}>{r.notes}</p>}
                </div>
                <span style={{ background: TINT.mint.bg, color: TINT.mint.text, border: `1px solid ${TINT.mint.border}`, borderRadius: 8, padding: '4px 10px', fontSize: 11, fontWeight: 700, textTransform: 'capitalize', flexShrink: 0, whiteSpace: 'nowrap' }}>
                  {(r.activity_level || '').replace(/_/g, ' ')}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {modal && (
        <Modal title="Log Health Record" onClose={() => { setModal(false); setError(''); }}>
          {error && <div style={s.errBox}>{error}</div>}
          <form onSubmit={(e) => { e.preventDefault(); setError(''); mutation.mutate(form); }} style={s.form}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Field label="Weight (kg)">
                <input style={s.input} type="number" step="0.1" min="20" max="300" placeholder="70.5" required value={form.weight} onChange={e => setForm({ ...form, weight: e.target.value })} />
              </Field>
              <Field label="Height (cm)">
                <input style={s.input} type="number" step="0.1" min="50" max="250" placeholder="165" required value={form.height} onChange={e => setForm({ ...form, height: e.target.value })} />
              </Field>
            </div>
            <Field label="Activity Level">
              <select style={s.input} required value={form.activity_level} onChange={e => setForm({ ...form, activity_level: e.target.value })}>
                <option value="">Select activity level…</option>
                <option value="sedentary">Sedentary (little or no exercise)</option>
                <option value="lightly_active">Lightly Active (1–3 days/week)</option>
                <option value="moderately_active">Moderately Active (3–5 days/week)</option>
                <option value="very_active">Very Active (6–7 days/week)</option>
                <option value="extra_active">Extra Active (twice daily or physical job)</option>
              </select>
            </Field>
            <Field label="Notes (optional)">
              <input style={s.input} placeholder="Any additional notes…" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
            </Field>
            <div style={{ display: 'flex', gap: 10 }}>
              <button type="button" onClick={() => setModal(false)} style={s.btnCancel}>Cancel</button>
              <button type="submit" style={{ ...s.btn, flex: 1 }} disabled={mutation.isPending}>{mutation.isPending ? 'Saving…' : 'Save Record'}</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

// ─── Conditions tab ───────────────────────────────────────────────────────────
function ConditionsTab() {
  const qc = useQueryClient();
  const [modal, setModal] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm]   = useState({ condition_name: '', severity: '', diagnosis_date: '', notes: '' });

  const { data: conditions = [], isLoading } = useQuery({
    queryKey: ['conditions'],
    queryFn: () => healthService.getConditions().then(r => r.data?.results ?? []),
  });

  const add = useMutation({
    mutationFn: (data) => healthService.createCondition(data),
    onSuccess: () => { qc.invalidateQueries(['conditions']); setModal(false); setForm({ condition_name: '', severity: '', diagnosis_date: '', notes: '' }); },
    onError: (e) => setError(e.response?.data?.message || e.message),
  });

  const del = useMutation({
    mutationFn: (id) => healthService.deleteCondition(id),
    onSuccess: () => qc.invalidateQueries(['conditions']),
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ background: TINT.sky.bg, border: `1px solid ${TINT.sky.border}`, borderRadius: 14, padding: '14px 18px' }}>
        <p style={{ margin: 0, fontSize: 13, color: TINT.sky.text, lineHeight: 1.65, fontWeight: 500 }}>
          Record any diseases or medical conditions you have been diagnosed with.
          The AI uses this information to personalise your food recommendations and risk assessments.
        </p>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button onClick={() => setModal(true)} style={s.btn}><Plus size={14} /> Add Condition</button>
      </div>

      {isLoading ? (
        <div style={s.center}><div style={s.spinner} /></div>
      ) : conditions.length === 0 ? (
        <div style={s.empty}>
          <div style={{ width: 56, height: 56, background: TINT.rose.bg, border: `1px solid ${TINT.rose.border}`, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
            <HeartPulse size={24} color={TINT.rose.icon} />
          </div>
          <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#2a1f14' }}>No conditions recorded</p>
          <p style={{ margin: '6px 0 0', fontSize: 12, color: '#a8967f', fontWeight: 500 }}>Add any diagnosed diseases or medical conditions.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {conditions.map((c) => {
            const sv = SEVERITY[c.severity] || SEVERITY.mild;
            return (
              <div key={c.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 14, background: '#FBF4EA', border: '1px solid #F0E6D2', borderRadius: 16, padding: '16px 18px' }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: sv.dot, flexShrink: 0, marginTop: 5 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
                    <span style={{ fontSize: 15, fontWeight: 800, color: '#2a1f14' }}>{c.condition_name}</span>
                    <span style={{ background: sv.bg, color: sv.text, border: `1px solid ${sv.border}`, borderRadius: 6, padding: '2px 9px', fontSize: 11, fontWeight: 700, textTransform: 'capitalize' }}>{c.severity}</span>
                  </div>
                  <p style={{ margin: 0, fontSize: 12, color: '#a8967f', fontWeight: 500 }}>
                    Diagnosed: {c.diagnosis_date ? format(parseISO(c.diagnosis_date), 'MMMM d, yyyy') : 'Unknown date'}
                  </p>
                  {c.notes && <p style={{ margin: '5px 0 0', fontSize: 12, color: '#7a6a5a', lineHeight: 1.6 }}>{c.notes}</p>}
                </div>
                <button onClick={() => { if (confirm('Remove this condition?')) del.mutate(c.id); }}
                  style={{ background: TINT.rose.bg, border: `1px solid ${TINT.rose.border}`, borderRadius: 8, cursor: 'pointer', color: TINT.rose.text, padding: '6px', display: 'flex', alignItems: 'center' }}>
                  <X size={13} />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {modal && (
        <Modal title="Add Disease / Condition" onClose={() => { setModal(false); setError(''); }}>
          {error && <div style={s.errBox}>{error}</div>}
          <form onSubmit={(e) => { e.preventDefault(); setError(''); add.mutate(form); }} style={s.form}>
            <Field label="Disease / Condition Name">
              <input style={s.input} placeholder="e.g. Type 2 Diabetes, Hypertension, Anaemia…" required value={form.condition_name} onChange={e => setForm({ ...form, condition_name: e.target.value })} />
            </Field>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Field label="Severity">
                <select style={s.input} required value={form.severity} onChange={e => setForm({ ...form, severity: e.target.value })}>
                  <option value="">Select…</option>
                  <option value="mild">Mild</option>
                  <option value="moderate">Moderate</option>
                  <option value="severe">Severe</option>
                </select>
              </Field>
              <Field label="Diagnosis Date">
                <input style={s.input} type="date" required value={form.diagnosis_date} onChange={e => setForm({ ...form, diagnosis_date: e.target.value })} />
              </Field>
            </div>
            <Field label="Notes (optional)">
              <textarea style={{ ...s.input, minHeight: 60, resize: 'vertical' }} placeholder="Any additional details…" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
            </Field>
            <div style={{ display: 'flex', gap: 10 }}>
              <button type="button" onClick={() => setModal(false)} style={s.btnCancel}>Cancel</button>
              <button type="submit" style={{ ...s.btn, flex: 1 }} disabled={add.isPending}>{add.isPending ? 'Saving…' : 'Save Condition'}</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

// ─── Tag input ────────────────────────────────────────────────────────────────
function TagInput({ value, onChange, placeholder }) {
  const [input, setInput] = useState('');
  const tags = Array.isArray(value) ? value : [];
  const add = () => {
    const t = input.trim();
    if (t && !tags.includes(t)) { onChange([...tags, t]); setInput(''); }
  };
  return (
    <div style={{ border: `1.5px solid #F0E6D2`, borderRadius: 10, padding: 10, background: '#fffdf9' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: tags.length ? 8 : 0 }}>
        {tags.map(t => (
          <span key={t} style={{ background: TINT.mint.bg, color: TINT.mint.text, border: `1px solid ${TINT.mint.border}`, borderRadius: 20, padding: '3px 10px', fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 5 }}>
            {t}
            <button type="button" onClick={() => onChange(tags.filter(x => x !== t))}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: TINT.mint.text, padding: 0, lineHeight: 1, fontWeight: 700 }}>×</button>
          </span>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 6 }}>
        <input style={{ flex: 1, border: 'none', outline: 'none', fontSize: 13, color: '#2a1f14', background: 'transparent', fontFamily: 'inherit' }}
          placeholder={placeholder} value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); add(); } }} />
        <button type="button" onClick={add}
          style={{ background: ACCENT, color: '#fff', border: 'none', borderRadius: 7, padding: '4px 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>Add</button>
      </div>
    </div>
  );
}

// ─── Preferences tab ──────────────────────────────────────────────────────────
function PreferencesTab() {
  const qc = useQueryClient();
  const [saved, setSaved] = useState(false);
  const [form,  setForm]  = useState(null);

  const { isLoading } = useQuery({
    queryKey: ['preferences'],
    queryFn: () => healthService.getPreferences().then(r => {
      const d = r.data?.data ?? r.data;
      setForm({ dietary_type: d.dietary_type || 'none', disliked_foods: d.disliked_foods || [], favorite_foods: d.favorite_foods || [], daily_lifestyle: d.daily_lifestyle || 'office_worker', additional_notes: d.additional_notes || '' });
      return d;
    }),
  });

  const save = useMutation({
    mutationFn: (data) => healthService.updatePreferences(data),
    onSuccess: () => { qc.invalidateQueries(['preferences']); setSaved(true); setTimeout(() => setSaved(false), 3000); },
  });

  if (isLoading || !form) return <div style={s.center}><div style={s.spinner} /></div>;

  const dietaryOpts = [
    { value: 'none', label: 'No restrictions' }, { value: 'vegetarian', label: 'Vegetarian' },
    { value: 'vegan', label: 'Vegan' }, { value: 'halal', label: 'Halal' },
    { value: 'kosher', label: 'Kosher' }, { value: 'hindu_vegetarian', label: 'Hindu Vegetarian' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ background: TINT.mint.bg, border: `1px solid ${TINT.mint.border}`, borderRadius: 14, padding: '14px 18px' }}>
        <p style={{ margin: 0, fontSize: 13, color: TINT.mint.text, lineHeight: 1.65, fontWeight: 500 }}>
          Tell us about your dietary preferences and lifestyle so the AI can personalise your food suggestions.
          These preferences are applied every time a new recommendation is generated.
        </p>
      </div>

      {saved && (
        <div style={{ background: TINT.mint.bg, border: `1px solid ${TINT.mint.border}`, borderRadius: 10, padding: '10px 16px', fontSize: 13, color: TINT.mint.text, fontWeight: 600 }}>
          ✓ Preferences saved! Generate a new AI recommendation to apply them.
        </div>
      )}

      <form onSubmit={e => { e.preventDefault(); save.mutate(form); }} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* Dietary type */}
        <PrefSection title="Dietary Type" desc="Tell us if you follow any dietary restrictions.">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(150px,1fr))', gap: 10 }}>
            {dietaryOpts.map(({ value, label }) => {
              const active = form.dietary_type === value;
              return (
                <label key={value} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', border: `1.5px solid ${active ? ACCENT : '#F0E6D2'}`, background: active ? TINT.peach.bg : '#fffdf9', borderRadius: 10, cursor: 'pointer', fontSize: 13, color: active ? ACCENT_D : '#5a4a3a', fontWeight: active ? 700 : 500 }}>
                  <input type="radio" name="dietary_type" value={value} checked={active} onChange={() => setForm({ ...form, dietary_type: value })} style={{ accentColor: ACCENT }} />
                  {label}
                </label>
              );
            })}
          </div>
        </PrefSection>

        {/* Lifestyle */}
        <PrefSection title="Daily Lifestyle" desc="Helps us understand your energy needs beyond exercise.">
          <select style={s.input} value={form.daily_lifestyle} onChange={e => setForm({ ...form, daily_lifestyle: e.target.value })}>
            <option value="office_worker">Office / desk worker</option>
            <option value="physical_labor">Physical labor / manual work</option>
            <option value="retired">Retired</option>
            <option value="active_outdoors">Active outdoors (farming, sport)</option>
            <option value="student">Student</option>
          </select>
        </PrefSection>

        {/* Disliked foods */}
        <PrefSection title="Foods You Dislike" desc="These will be excluded from your recommended food plans where possible.">
          <TagInput value={form.disliked_foods} onChange={v => setForm({ ...form, disliked_foods: v })} placeholder="Type a food and press Add or Enter (e.g. liver, coconut…)" />
        </PrefSection>

        {/* Favourite foods */}
        <PrefSection title="Favourite Foods" desc="Foods you enjoy eating — we will prioritise these when they fit your nutrition plan.">
          <TagInput value={form.favorite_foods} onChange={v => setForm({ ...form, favorite_foods: v })} placeholder="Type a food and press Add or Enter (e.g. chicken, oats, banana…)" />
        </PrefSection>

        {/* Notes */}
        <PrefSection title="Additional Notes" desc="Any other information about your diet or health for the AI to consider." last>
          <textarea style={{ ...s.input, minHeight: 80, resize: 'vertical' }}
            placeholder="e.g. I am recovering from surgery, I have a very small appetite…"
            value={form.additional_notes} onChange={e => setForm({ ...form, additional_notes: e.target.value })} />
        </PrefSection>

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button type="submit" style={s.btn} disabled={save.isPending}>{save.isPending ? 'Saving…' : 'Save Preferences'}</button>
        </div>
      </form>
    </div>
  );
}

function PrefSection({ title, desc, children, last }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, paddingBottom: last ? 0 : 20, borderBottom: last ? 'none' : '1px solid #F5ECE1' }}>
      <div>
        <p style={{ margin: 0, fontSize: 14, fontWeight: 800, color: '#2a1f14' }}>{title}</p>
        {desc && <p style={{ margin: '3px 0 0', fontSize: 12, color: '#a8967f', fontWeight: 500 }}>{desc}</p>}
      </div>
      {children}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function HealthRecords() {
  const [activeTab, setActiveTab] = useState('records');
  const ActiveComponent = { records: RecordsTab, conditions: ConditionsTab, preferences: PreferencesTab }[activeTab];

  return (
    <div style={s.root}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}} .hr-tab:hover{background:#FBF4EA!important}`}</style>
      <div style={s.panel}>
        {/* Topbar */}
        <div style={s.topbar}>
          <div>
            <h1 style={s.title}>Health Profile</h1>
            <p style={s.sub}>Track records, diseases, and dietary preferences — all in one place.</p>
          </div>
        </div>

        {/* Content */}
        <div className="scroll" style={s.content}>
          {/* Tab bar */}
          <div style={{ display: 'flex', gap: 4, background: '#FBF4EA', borderRadius: 14, padding: 5, flexShrink: 0, border: '1px solid #F0E6D2' }}>
            {TABS.map(({ id, label, icon: Icon }) => {
              const active = activeTab === id;
              return (
                <button key={id} onClick={() => setActiveTab(id)} className="hr-tab"
                  style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px', borderRadius: 10, border: 'none', background: active ? '#fff' : 'transparent', cursor: 'pointer', fontSize: 13, fontFamily: 'inherit', fontWeight: active ? 700 : 500, color: active ? ACCENT_D : '#7a6a5a', boxShadow: active ? '0 1px 4px rgba(180,120,60,0.1)' : 'none', transition: 'all 0.15s', whiteSpace: 'nowrap' }}>
                  <Icon size={14} color={active ? ACCENT_D : '#a8967f'} />
                  {label}
                </button>
              );
            })}
          </div>

          {/* Tab content card */}
          <div style={{ background: '#fffdf9', borderRadius: 18, border: '1px solid #F0E6D2', padding: '22px', boxShadow: '0 2px 8px rgba(180,120,60,0.05)' }}>
            <ActiveComponent />
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Shared helpers ───────────────────────────────────────────────────────────
function Modal({ title, onClose, children }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(42,31,20,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16, backdropFilter: 'blur(3px)' }}>
      <div style={{ background: '#fffdf9', borderRadius: 20, padding: '24px', width: '100%', maxWidth: 480, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 50px rgba(42,31,20,0.2)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <span style={{ fontSize: 16, fontWeight: 800, color: '#1a1208' }}>{title}</span>
          <button onClick={onClose} style={{ background: '#FBF4EA', border: '1px solid #F0E6D2', borderRadius: 8, cursor: 'pointer', color: '#a8967f', display: 'flex', alignItems: 'center', padding: '5px' }}><X size={15} /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      <label style={{ fontSize: 12, fontWeight: 700, color: '#5a4a3a' }}>{label}</label>
      {children}
    </div>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = {
  root:      { flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', height: '100%', fontFamily: "'DM Sans',sans-serif", background: BG, padding: 14, boxSizing: 'border-box' },
  panel:     { flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: PANEL, borderRadius: 24, border: '1px solid rgba(255,255,255,0.9)', boxShadow: '0 4px 24px rgba(180,120,60,0.08)' },
  topbar:    { background: '#fff', padding: '18px 26px', borderBottom: '1px solid #F5ECE1', flexShrink: 0 },
  title:     { margin: 0, fontSize: 20, fontWeight: 800, color: '#1a1208', letterSpacing: '-0.5px' },
  sub:       { margin: '3px 0 0', fontSize: 12, color: '#a8967f', fontWeight: 500 },
  content:   { flex: 1, overflowY: 'auto', padding: '22px 26px', display: 'flex', flexDirection: 'column', gap: 16 },
  btn:       { display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 18px', background: ACCENT, color: '#fff', border: 'none', borderRadius: 12, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 2px 6px rgba(232,117,74,0.2)' },
  btnCancel: { display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 16px', background: '#FBF4EA', color: '#7a6a5a', border: '1px solid #F0E6D2', borderRadius: 12, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', flex: 1 },
  form:      { display: 'flex', flexDirection: 'column', gap: 14 },
  input:     { padding: '10px 13px', border: '1.5px solid #F0E6D2', borderRadius: 10, fontSize: 13, color: '#2a1f14', fontFamily: 'inherit', outline: 'none', width: '100%', boxSizing: 'border-box', background: '#fffdf9' },
  errBox:    { background: TINT.rose.bg, border: `1px solid ${TINT.rose.border}`, color: TINT.rose.text, borderRadius: 8, padding: '10px 14px', fontSize: 13, marginBottom: 14, fontWeight: 500 },
  empty:     { textAlign: 'center', padding: '48px 24px', background: '#FBF4EA', borderRadius: 16, border: '1px dashed #F0E6D2' },
  center:    { display: 'flex', alignItems: 'center', justifyContent: 'center', height: 120 },
  spinner:   { width: 28, height: 28, border: '3px solid #F0E6D2', borderTopColor: ACCENT, borderRadius: '50%', animation: 'spin 0.8s linear infinite' },
};
