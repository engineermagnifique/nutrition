import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Pill, Plus, Trash2, AlertTriangle, CheckCircle, Info, ChevronDown, ChevronUp } from 'lucide-react';
import { healthService } from '../../services/health.service';

const ACCENT   = '#F59B6B';
const ACCENT_D = '#E8754A';
const BG       = '#FCE4CF';
const TINT = {
  peach:  { bg: '#FFE5D1', border: '#FFD0AE', text: '#9A4B1F', icon: '#E8754A' },
  mint:   { bg: '#D7F2E1', border: '#A8E2BC', text: '#1F5C36', icon: '#2E7D32' },
  sky:    { bg: '#D9ECFA', border: '#B0D5F1', text: '#1A4D7A', icon: '#1565C0' },
  lilac:  { bg: '#EADCF7', border: '#D2BCEA', text: '#4B2B7A', icon: '#7c3aed' },
  butter: { bg: '#FFF1C9', border: '#FFE08F', text: '#7A5800', icon: '#d97706' },
};

// ─── Drug interaction database ────────────────────────────────────────────────

const KNOWN_DRUGS = {
  warfarin:          TINT.peach,
  metformin:         TINT.butter,
  lisinopril:        TINT.butter,
  furosemide:        TINT.butter,
  atorvastatin:      TINT.lilac,
  amlodipine:        TINT.lilac,
  'iron supplement': TINT.mint,
  levothyroxine:     TINT.sky,
  aspirin:           TINT.peach,
};

const INTERACTION_TIPS = {
  warfarin: '⚠ Keep your intake of green leafy vegetables (spinach, kale) the same every day. Sudden changes affect how well this medication works.',
  metformin: '⚠ Long-term use depletes vitamin B12. Eat eggs, fish, and dairy regularly. Ask your doctor to check your B12 at your next blood test.',
  lisinopril: '⚠ Avoid potassium supplements and "low-sodium" salt substitutes — they contain potassium which can reach dangerous levels with this medication.',
  furosemide: '⚠ This water tablet causes potassium and magnesium loss daily. Eat a banana, avocado, or spinach at every meal to replace them.',
  atorvastatin: '⚠ Never drink grapefruit juice while on this medication — it causes dangerous medication build-up in your blood.',
  amlodipine: '⚠ Avoid grapefruit juice entirely. Take with water or with any other fruit juice.',
  'iron supplement': '✓ Take with orange juice (vitamin C triples absorption). Never take with tea, coffee, or dairy — they block absorption.',
  levothyroxine: '⚠ Take on an empty stomach first thing in the morning. Wait 30–60 minutes before eating. Consistency is everything.',
  aspirin: '✓ Always take with food or milk to protect your stomach lining.',
};

function normalizeDrug(name) {
  const n = name.toLowerCase();
  if (n.includes('warfarin') || n.includes('coumadin')) return 'warfarin';
  if (n.includes('metformin') || n.includes('glucophage')) return 'metformin';
  if (n.includes('lisinopril') || n.includes('enalapril') || n.includes('ramipril')) return 'lisinopril';
  if (n.includes('furosemide') || n.includes('lasix')) return 'furosemide';
  if (n.includes('atorvastatin') || n.includes('simvastatin') || n.includes('rosuvastatin')) return 'atorvastatin';
  if (n.includes('amlodipine') || n.includes('nifedipine')) return 'amlodipine';
  if (n.includes('iron') && (n.includes('tablet') || n.includes('supplement') || n.includes('sulfate'))) return 'iron supplement';
  if (n.includes('levothyroxine') || n.includes('thyroxine') || n.includes('synthroid')) return 'levothyroxine';
  if (n.includes('aspirin')) return 'aspirin';
  return null;
}

// ─── Medication card ──────────────────────────────────────────────────────────

function MedCard({ med, onDelete }) {
  const [expanded, setExpanded] = useState(false);
  const drugKey   = normalizeDrug(med.medication_name);
  const drugTint  = drugKey ? KNOWN_DRUGS[drugKey] : null;
  const tip       = drugKey ? INTERACTION_TIPS[drugKey] : null;

  return (
    <div style={{ background:'#fffdf9', border:'1px solid #F0E6D2', borderRadius:14, overflow:'hidden' }}>
      <div style={{ display:'flex', alignItems:'flex-start', gap:12, padding:'14px 18px' }}>
        <div style={{
          background: drugTint?.bg || '#FBF4EA',
          border: `1px solid ${drugTint?.border || '#F0E6D2'}`,
          borderRadius: 10, width: 38, height: 38,
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          <Pill size={18} color={drugTint?.text || '#a8967f'} />
        </div>

        <div style={{ flex:1, minWidth:0 }}>
          <p style={{ margin:'0 0 6px', fontSize:15, fontWeight:700, color:'#2a1f14' }}>{med.medication_name}</p>
          <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
            {med.dosage && (
              <span style={{ background:'#FBF4EA', color:'#a8967f', border:'1px solid #F0E6D2', borderRadius:5, padding:'2px 9px', fontSize:12 }}>{med.dosage}</span>
            )}
            <span style={{ background:'#FBF4EA', color:'#a8967f', border:'1px solid #F0E6D2', borderRadius:5, padding:'2px 9px', fontSize:12 }}>{med.frequency_display}</span>
            {med.with_food && (
              <span style={{ background: TINT.mint.bg, color: TINT.mint.text, border:`1px solid ${TINT.mint.border}`, borderRadius:5, padding:'2px 9px', fontSize:12 }}>Take with food</span>
            )}
          </div>
          {med.purpose && (
            <p style={{ margin:'6px 0 0', fontSize:12, color:'#a8967f' }}>{med.purpose}</p>
          )}
        </div>

        <div style={{ display:'flex', gap:6, flexShrink:0 }}>
          {tip && (
            <button
              onClick={() => setExpanded(!expanded)}
              style={{ background: expanded ? '#FBF4EA' : 'none', border:'none', cursor:'pointer', color:'#a8967f', padding:6, display:'flex', alignItems:'center', borderRadius:8 }}
            >
              {expanded ? <ChevronUp size={16} /> : <Info size={15} />}
            </button>
          )}
          <button
            onClick={() => onDelete(med.id)}
            style={{ background:'none', border:'none', cursor:'pointer', color:'#F0E6D2', padding:6, display:'flex', alignItems:'center', borderRadius:8 }}
            onMouseEnter={(e) => { e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.background = '#fef2f2'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = '#F0E6D2'; e.currentTarget.style.background = 'none'; }}
          >
            <Trash2 size={15} />
          </button>
        </div>
      </div>

      {expanded && tip && (
        <div style={{
          margin:'0 14px 14px',
          background: drugTint?.bg || '#FBF4EA',
          border: `1px solid ${drugTint?.border || '#F0E6D2'}`,
          borderRadius:10, padding:'12px 14px',
        }}>
          <p style={{ margin:'0 0 4px', fontSize:11, fontWeight:700, color: drugTint?.text || '#a8967f', textTransform:'uppercase', letterSpacing:'0.05em' }}>
            Food Interaction Guide
          </p>
          <p style={{ margin:0, fontSize:13, color:'#2a1f14', lineHeight:1.65 }}>{tip}</p>
        </div>
      )}
    </div>
  );
}

// ─── Add form ─────────────────────────────────────────────────────────────────

function AddMedicationForm({ onSuccess, onCancel }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({
    medication_name: '', dosage: '', frequency: 'once_daily',
    purpose: '', with_food: true, start_date: '', notes: '',
  });
  const [error, setError] = useState('');

  const create = useMutation({
    mutationFn: (data) => healthService.createMedication(data),
    onSuccess: () => { qc.invalidateQueries(['medications']); onSuccess?.(); },
    onError: (e) => setError(e.response?.data?.message || 'Failed to save. Please try again.'),
  });

  const handle = (e) => {
    e.preventDefault();
    if (!form.medication_name.trim()) { setError('Please enter the medication name.'); return; }
    setError('');
    create.mutate({ ...form, start_date: form.start_date || null });
  };

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <div style={{ background:'#fffdf9', border:`1.5px solid ${ACCENT}`, borderRadius:16, padding:'20px' }}>
      <p style={{ margin:'0 0 16px', fontSize:15, fontWeight:700, color:'#2a1f14' }}>Add Medication</p>

      {error && (
        <div style={{ background:'#fef2f2', border:'1px solid #fecaca', color:'#991b1b', borderRadius:8, padding:'10px 14px', fontSize:13, marginBottom:14 }}>
          ⚠ {error}
        </div>
      )}

      <form onSubmit={handle} style={{ display:'flex', flexDirection:'column', gap:12 }}>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
          <div>
            <label style={fs.label}>Medication Name *</label>
            <input style={fs.input} value={form.medication_name} onChange={(e) => set('medication_name', e.target.value)} placeholder="e.g. Metformin, Aspirin" required />
          </div>
          <div>
            <label style={fs.label}>Dosage</label>
            <input style={fs.input} value={form.dosage} onChange={(e) => set('dosage', e.target.value)} placeholder="e.g. 500 mg" />
          </div>
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
          <div>
            <label style={fs.label}>Frequency</label>
            <select style={fs.input} value={form.frequency} onChange={(e) => set('frequency', e.target.value)}>
              <option value="once_daily">Once daily</option>
              <option value="twice_daily">Twice daily</option>
              <option value="three_times_daily">Three times daily</option>
              <option value="as_needed">As needed</option>
              <option value="weekly">Weekly</option>
            </select>
          </div>
          <div>
            <label style={fs.label}>Start Date</label>
            <input style={fs.input} type="date" value={form.start_date} onChange={(e) => set('start_date', e.target.value)} />
          </div>
        </div>

        <div>
          <label style={fs.label}>What is this medicine for?</label>
          <input style={fs.input} value={form.purpose} onChange={(e) => set('purpose', e.target.value)} placeholder="e.g. Blood pressure, Blood sugar control" />
        </div>

        <label style={{ display:'flex', alignItems:'center', gap:8, cursor:'pointer', fontSize:13, color:'#2a1f14' }}>
          <input type="checkbox" checked={form.with_food} onChange={(e) => set('with_food', e.target.checked)} style={{ width:16, height:16, accentColor: ACCENT_D }} />
          Take with food (reduces stomach upset)
        </label>

        <div>
          <label style={fs.label}>Notes (optional)</label>
          <textarea style={{ ...fs.input, height:64, resize:'vertical' }} value={form.notes} onChange={(e) => set('notes', e.target.value)} placeholder="Any extra notes about this medication..." />
        </div>

        <div style={{ display:'flex', gap:10 }}>
          <button type="button" onClick={onCancel} style={{ flex:1, padding:'10px', background:'#FBF4EA', color:'#a8967f', border:'1px solid #F0E6D2', borderRadius:10, fontSize:13, cursor:'pointer', fontFamily:'inherit' }}>
            Cancel
          </button>
          <button type="submit" disabled={create.isPending} style={{ flex:2, padding:'10px', background: ACCENT, color:'#fff', border:'none', borderRadius:10, fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:'inherit', opacity: create.isPending ? 0.6 : 1 }}>
            {create.isPending ? 'Saving…' : 'Save Medication'}
          </button>
        </div>
      </form>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function Medications() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);

  const { data: meds = [], isLoading } = useQuery({
    queryKey: ['medications'],
    queryFn: () => healthService.getMedications().then((r) => r.data?.results ?? r.data),
  });

  const deleteMed = useMutation({
    mutationFn: (id) => healthService.deleteMedication(id),
    onSuccess: () => qc.invalidateQueries(['medications']),
  });

  const knownMedCount = meds.filter((m) => normalizeDrug(m.medication_name)).length;

  return (
    <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden', height:'100%', fontFamily:"'DM Sans',sans-serif", background: BG, padding:14, boxSizing:'border-box' }}>
      <style>{`@keyframes medSpin{to{transform:rotate(360deg)}}`}</style>

      {/* Panel */}
      <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden', background:'#fff', borderRadius:24, border:'1px solid rgba(255,255,255,0.9)', boxShadow:'0 4px 24px rgba(180,120,60,0.08)' }}>

        {/* Topbar */}
        <div style={{ background:'#fff', padding:'18px 26px', display:'flex', alignItems:'center', justifyContent:'space-between', borderBottom:'1px solid #F5ECE1', flexShrink:0, flexWrap:'wrap', gap:10 }}>
          <div>
            <h1 style={{ margin:0, fontSize:18, fontWeight:700, color:'#2a1f14' }}>My Medications</h1>
            <p style={{ margin:'2px 0 0', fontSize:13, color:'#a8967f' }}>Add your current medications so the AI can tailor food suggestions around them.</p>
          </div>
          {!showForm && (
            <button
              onClick={() => setShowForm(true)}
              style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'9px 16px', background: ACCENT, color:'#fff', border:'none', borderRadius:10, fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}
            >
              <Plus size={13} /> Add Medication
            </button>
          )}
        </div>

        {/* Content */}
        <div style={{ flex:1, overflowY:'auto', padding:'20px 24px', display:'flex', flexDirection:'column', gap:14 }}>

          {/* Info banner */}
          <div style={{ background: TINT.butter.bg, border:`1px solid ${TINT.butter.border}`, borderRadius:12, padding:'14px 18px', display:'flex', alignItems:'flex-start', gap:10 }}>
            <Info size={16} color={TINT.butter.text} style={{ flexShrink:0, marginTop:1 }} />
            <div>
              <p style={{ margin:'0 0 4px', fontSize:13, fontWeight:700, color: TINT.butter.text }}>Why add your medications?</p>
              <p style={{ margin:0, fontSize:13, color:'#2a1f14', lineHeight:1.65 }}>
                Many common medications interact with food. For example, warfarin reacts to leafy greens, metformin affects vitamin B12, and grapefruit juice can make blood pressure or cholesterol tablets dangerous.
                When you add your medications here, the AI will automatically factor these interactions into every food suggestion it gives you.
              </p>
            </div>
          </div>

          {showForm && (
            <AddMedicationForm onSuccess={() => setShowForm(false)} onCancel={() => setShowForm(false)} />
          )}

          {isLoading ? (
            <div style={{ display:'flex', justifyContent:'center', padding:'40px 0' }}>
              <div style={{ width:32, height:32, border:`3px solid #F0E6D2`, borderTopColor: ACCENT_D, borderRadius:'50%', animation:'medSpin 0.8s linear infinite' }} />
            </div>
          ) : meds.length === 0 ? (
            <div style={{ textAlign:'center', padding:'50px 24px', background:'#FBF4EA', borderRadius:16, border:'1px solid #F0E6D2' }}>
              <Pill size={36} color="#c4a882" style={{ margin:'0 auto 12px', display:'block' }} />
              <p style={{ fontSize:14, fontWeight:600, color:'#2a1f14', margin:'0 0 6px' }}>No medications added yet</p>
              <p style={{ fontSize:13, color:'#a8967f', margin:'0 0 18px' }}>
                If you take any regular medications, add them here so the AI can include food-drug interactions in your recommendations.
              </p>
              <button
                onClick={() => setShowForm(true)}
                style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'9px 16px', background: ACCENT, color:'#fff', border:'none', borderRadius:10, fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}
              >
                <Plus size={13} /> Add First Medication
              </button>
            </div>
          ) : (
            <>
              {/* Summary tiles */}
              <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
                <div style={{ background:'#FBF4EA', border:'1px solid #F0E6D2', borderRadius:12, padding:'12px 18px', display:'flex', gap:10, alignItems:'center' }}>
                  <Pill size={16} color={ACCENT_D} />
                  <div>
                    <p style={{ margin:0, fontSize:11, color:'#a8967f' }}>Total medications</p>
                    <p style={{ margin:0, fontSize:20, fontWeight:700, color:'#2a1f14' }}>{meds.length}</p>
                  </div>
                </div>
                {knownMedCount > 0 && (
                  <div style={{ background: TINT.peach.bg, border:`1px solid ${TINT.peach.border}`, borderRadius:12, padding:'12px 18px', display:'flex', gap:10, alignItems:'center' }}>
                    <AlertTriangle size={16} color={TINT.peach.text} />
                    <div>
                      <p style={{ margin:0, fontSize:11, color: TINT.peach.text }}>With food interactions</p>
                      <p style={{ margin:0, fontSize:20, fontWeight:700, color: TINT.peach.text }}>{knownMedCount}</p>
                    </div>
                  </div>
                )}
                <div style={{ background: TINT.mint.bg, border:`1px solid ${TINT.mint.border}`, borderRadius:12, padding:'12px 18px', display:'flex', gap:10, alignItems:'center' }}>
                  <CheckCircle size={16} color={TINT.mint.text} />
                  <p style={{ margin:0, fontSize:13, color: TINT.mint.text, fontWeight:500 }}>AI recommendations now include your medications</p>
                </div>
              </div>

              {/* Medication list */}
              <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                <p style={{ margin:0, fontSize:12, fontWeight:700, color:'#a8967f', textTransform:'uppercase', letterSpacing:'0.06em' }}>
                  Current Medications — tap the info icon to see food interaction guide
                </p>
                {meds.map((m) => (
                  <MedCard key={m.id} med={m} onDelete={(id) => deleteMed.mutate(id)} />
                ))}
              </div>

              {/* General reminder */}
              <div style={{ background:'#FBF4EA', border:'1px solid #F0E6D2', borderRadius:12, padding:'14px 18px' }}>
                <p style={{ margin:'0 0 6px', fontSize:13, fontWeight:600, color:'#2a1f14' }}>General medication reminders</p>
                <ul style={{ margin:0, paddingLeft:18, display:'flex', flexDirection:'column', gap:4 }}>
                  <li style={{ fontSize:13, color:'#a8967f', lineHeight:1.6 }}>Always tell your doctor or pharmacist if you make major changes to your diet.</li>
                  <li style={{ fontSize:13, color:'#a8967f', lineHeight:1.6 }}>Never stop or change your medication dose without medical advice.</li>
                  <li style={{ fontSize:13, color:'#a8967f', lineHeight:1.6 }}>Keep this list updated — your next AI analysis will automatically use it.</li>
                </ul>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Form styles ──────────────────────────────────────────────────────────────
const fs = {
  label: { display:'block', fontSize:12, fontWeight:600, color:'#2a1f14', marginBottom:4 },
  input: {
    width:'100%', padding:'9px 12px', border:'1.5px solid #F0E6D2', borderRadius:8,
    fontSize:13, color:'#2a1f14', background:'#fff', fontFamily:'inherit', boxSizing:'border-box',
  },
};
