import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Plus, Edit2 } from 'lucide-react';
import { healthService } from '../../services/health.service';
import { aiService } from '../../services/ai.service';
import { alertsService } from '../../services/alerts.service';
import { progressService } from '../../services/progress.service';
import { authService } from '../../services/auth.service';
import { format, parseISO } from 'date-fns';
import Card, { CardHeader } from '../../components/ui/Card';
import Badge, { severityBadge, riskBadge } from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Select from '../../components/ui/Select';
import { Textarea } from '../../components/ui/Input';
import Alert from '../../components/ui/Alert';
import Spinner from '../../components/ui/Spinner';

export default function UserDetail() {
  const { id } = useParams();
  const qc = useQueryClient();
  const [noteModal, setNoteModal] = useState(false);
  const [noteForm, setNoteForm] = useState({ category: 'general', note: '' });
  const [error, setError] = useState('');

  const userId = parseInt(id);

  const { data: summary, isLoading } = useQuery({
    queryKey: ['health-summary', userId],
    queryFn: () => healthService.getSummary(userId).then((r) => r.data.data),
  });

  const { data: recs = [] } = useQuery({
    queryKey: ['recommendations', userId],
    queryFn: () => aiService.getRecommendations({ user_id: userId }).then((r) => r.data.slice(0, 3)),
  });

  const { data: predictions = [] } = useQuery({
    queryKey: ['predictions', userId],
    queryFn: () => aiService.getPredictions({ user_id: userId }).then((r) => r.data.slice(0, 3)),
  });

  const { data: notes = [] } = useQuery({
    queryKey: ['caregiver-notes', userId],
    queryFn: () => progressService.getCaregiverNotes({ user_id: userId }).then((r) => r.data),
  });

  const { data: userAlerts = [] } = useQuery({
    queryKey: ['alerts', userId],
    queryFn: () => alertsService.getAlerts({ user_id: userId }).then((r) => r.data.slice(0, 5)),
  });

  const addNote = useMutation({
    mutationFn: (d) => progressService.createCaregiverNote({ user: userId, ...d }),
    onSuccess: () => { qc.invalidateQueries(['caregiver-notes', userId]); setNoteModal(false); setNoteForm({ category: 'general', note: '' }); },
    onError: (e) => setError(e.message),
  });

  if (isLoading) return <div className="flex items-center justify-center h-64"><Spinner size="lg" /></div>;

  const health = summary?.latest_health_record;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/institution/users" className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">{summary?.full_name}</h1>
          <p className="text-sm text-gray-500">User ID: {userId} · Member profile</p>
        </div>
        <Button onClick={() => setNoteModal(true)} size="sm">
          <Plus className="h-4 w-4" /> Add Note
        </Button>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Health summary */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader title="Latest Health Record" />
            {health ? (
              <dl className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {[
                  ['Weight', `${health.weight} kg`],
                  ['Height', `${health.height} cm`],
                  ['BMI', parseFloat(health.bmi).toFixed(2)],
                  ['Category', health.bmi_category],
                  ['Activity', health.activity_level?.replace(/_/g, ' ')],
                  ['Recorded', format(parseISO(health.recorded_at), 'MMM d, yyyy')],
                ].map(([k, v]) => (
                  <div key={k}>
                    <dt className="text-xs text-gray-500">{k}</dt>
                    <dd className="text-sm font-semibold text-gray-900 capitalize">{v}</dd>
                  </div>
                ))}
              </dl>
            ) : <p className="text-sm text-gray-400">No health records available.</p>}
          </Card>

          <Card>
            <CardHeader title="Medical Conditions" />
            {summary?.medical_conditions?.length > 0 ? (
              <div className="space-y-2">
                {summary.medical_conditions.map((c) => (
                  <div key={c.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{c.condition_name}</p>
                      {c.diagnosis_date && <p className="text-xs text-gray-500">Diagnosed: {format(parseISO(c.diagnosis_date), 'MMM d, yyyy')}</p>}
                    </div>
                    <Badge variant={c.severity === 'mild' ? 'green' : c.severity === 'moderate' ? 'yellow' : 'red'} className="capitalize">{c.severity}</Badge>
                  </div>
                ))}
              </div>
            ) : <p className="text-sm text-gray-400">No medical conditions recorded.</p>}
          </Card>

          <Card>
            <CardHeader title="AI Recommendations" action={<span className="text-xs text-gray-400">Latest {recs.length}</span>} />
            {recs.length > 0 ? (
              <div className="space-y-3">
                {recs.map((r) => {
                  const raw = r.raw_response || {};
                  const risk = raw.overall_risk ?? 'low';
                  const riskColors = {
                    low:      { bg: '#D7F2E1', border: '#A8E2BC', text: '#1F5C36', badge: '#bbf7d0', badgeText: '#166534' },
                    medium:   { bg: '#FFF1C9', border: '#FFE08F', text: '#7A5800', badge: '#fef3c7', badgeText: '#92400e' },
                    high:     { bg: '#FFE5D1', border: '#FFD0AE', text: '#9A4B1F', badge: '#ffedd5', badgeText: '#9a3412' },
                    critical: { bg: '#FBDAE0', border: '#F4B5BF', text: '#7A1F33', badge: '#fee2e2', badgeText: '#991b1b' },
                  };
                  const c = riskColors[risk] ?? riskColors.low;
                  const trending = raw.trending ?? [];
                  const actions = (raw.quick_actions ?? []).slice(0, 2);
                  return (
                    <div key={r.id} style={{ background: `linear-gradient(135deg,${c.bg},#fffdf9)`, border: `1.5px solid ${c.border}`, borderRadius: 12, padding: '14px 16px', fontFamily: "'DM Sans',sans-serif" }}>
                      {/* Header row */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, flexWrap: 'wrap', gap: 6 }}>
                        <span style={{ fontSize: 11, color: c.text, fontWeight: 700, background: c.badge, padding: '2px 10px', borderRadius: 20, textTransform: 'capitalize', border: `1px solid ${c.border}` }}>
                          {risk} risk
                        </span>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                          {r.calorie_target && (
                            <span style={{ fontSize: 11, fontWeight: 700, color: '#2E7D32', background: '#f0fdf4', padding: '2px 10px', borderRadius: 20, border: '1px solid #bbf7d0' }}>
                              {Math.round(r.calorie_target)} kcal/day
                            </span>
                          )}
                          <span style={{ fontSize: 11, color: '#9ca3af' }}>{format(parseISO(r.created_at), 'MMM d, yyyy')}</span>
                        </div>
                      </div>

                      {/* Summary */}
                      {(r.notes || raw.plain_summary) && (
                        <p style={{ margin: '0 0 10px', fontSize: 12, color: '#5a4a3a', lineHeight: 1.75 }}>{r.notes || raw.plain_summary}</p>
                      )}

                      {/* BMI + stats row */}
                      {(raw.bmi || raw.bmi_category) && (
                        <div style={{ display: 'flex', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
                          {raw.bmi && (
                            <div style={{ background: '#fffdf9', borderRadius: 8, padding: '6px 12px', border: `1px solid ${c.border}`, textAlign: 'center' }}>
                              <p style={{ margin: '0 0 1px', fontSize: 9, color: '#a8967f', fontWeight: 700, textTransform: 'uppercase' }}>BMI</p>
                              <p style={{ margin: 0, fontSize: 16, fontWeight: 800, color: '#2a1f14' }}>{raw.bmi}</p>
                              {raw.bmi_category && <p style={{ margin: 0, fontSize: 9, color: c.text, fontWeight: 600 }}>{raw.bmi_category}</p>}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Trends */}
                      {trending.length > 0 && (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(140px,1fr))', gap: 6, marginBottom: 10 }}>
                          {trending.slice(0, 3).map((t, i) => (
                            <div key={i} style={{ background: '#fffdf9', border: '1px solid #F0E6D2', borderRadius: 8, padding: '8px 10px' }}>
                              <p style={{ margin: '0 0 1px', fontSize: 9, color: '#a8967f', fontWeight: 700, textTransform: 'uppercase' }}>{t.label}</p>
                              <p style={{ margin: 0, fontSize: 12, fontWeight: 800, color: '#2a1f14' }}>{t.value}</p>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Key actions */}
                      {actions.length > 0 && (
                        <div style={{ borderTop: `1px solid ${c.border}`, paddingTop: 8 }}>
                          <p style={{ margin: '0 0 6px', fontSize: 9, fontWeight: 700, color: '#a8967f', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Recommended Actions</p>
                          {actions.map((a, i) => (
                            <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', marginBottom: 4 }}>
                              <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#2E7D32', flexShrink: 0, marginTop: 5 }} />
                              <p style={{ margin: 0, fontSize: 11, color: '#374151', lineHeight: 1.5 }}><strong>{a.action}</strong></p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : <p className="text-sm text-gray-400">No recommendations available.</p>}
          </Card>

          <Card>
            <CardHeader title="Health Predictions" />
            {predictions.length > 0 ? (
              <div className="space-y-2">
                {predictions.map((p) => (
                  <div key={p.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-gray-900 capitalize">{p.prediction_type?.replace(/_/g, ' ')}</p>
                      <p className="text-xs text-gray-500">{p.time_horizon}</p>
                    </div>
                    <Badge variant={riskBadge(p.risk_level)} className="capitalize">{p.risk_level} risk</Badge>
                  </div>
                ))}
              </div>
            ) : <p className="text-sm text-gray-400">No predictions available.</p>}
          </Card>
        </div>

        {/* Sidebar: Notes + Alerts */}
        <div className="space-y-4">
          <Card>
            <CardHeader title="Caregiver Notes" action={<button onClick={() => setNoteModal(true)} className="text-xs text-primary-800 hover:underline"><Edit2 className="h-3 w-3 inline mr-1" />Add</button>} />
            {notes.length > 0 ? (
              <div className="space-y-3">
                {notes.map((n) => (
                  <div key={n.id} className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between mb-1">
                      <Badge variant="gray" className="capitalize">{n.category}</Badge>
                      <span className="text-xs text-gray-400">{format(parseISO(n.created_at), 'MMM d')}</span>
                    </div>
                    <p className="text-xs text-gray-700">{n.note}</p>
                  </div>
                ))}
              </div>
            ) : <p className="text-sm text-gray-400">No notes yet.</p>}
          </Card>

          <Card>
            <CardHeader title="Recent Alerts" />
            {userAlerts.length > 0 ? (
              <div className="space-y-2">
                {userAlerts.map((a) => (
                  <div key={a.id} className="p-3 rounded-lg border border-gray-100">
                    <div className="flex items-center justify-between mb-1">
                      <Badge variant={severityBadge(a.severity)} className="capitalize">{a.severity}</Badge>
                      {!a.is_read && <span className="h-2 w-2 bg-red-500 rounded-full" />}
                    </div>
                    <p className="text-xs font-medium text-gray-900">{a.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{format(parseISO(a.created_at), 'MMM d, yyyy')}</p>
                  </div>
                ))}
              </div>
            ) : <p className="text-sm text-gray-400">No alerts for this user.</p>}
          </Card>
        </div>
      </div>

      <Modal isOpen={noteModal} onClose={() => { setNoteModal(false); setError(''); }} title="Add Caregiver Note">
        {error && <Alert type="error" message={error} onClose={() => setError('')} className="mb-4" />}
        <form onSubmit={(e) => { e.preventDefault(); setError(''); addNote.mutate(noteForm); }} className="space-y-4">
          <Select label="Category" value={noteForm.category} onChange={(e) => setNoteForm({ ...noteForm, category: e.target.value })}>
            <option value="general">General</option>
            <option value="observation">Observation</option>
            <option value="concern">Concern</option>
            <option value="improvement">Improvement</option>
          </Select>
          <Textarea label="Note" rows={4} required placeholder="Write your observation or note here..." value={noteForm.note} onChange={(e) => setNoteForm({ ...noteForm, note: e.target.value })} />
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => setNoteModal(false)} className="flex-1">Cancel</Button>
            <Button type="submit" loading={addNote.isPending} className="flex-1">Save Note</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
