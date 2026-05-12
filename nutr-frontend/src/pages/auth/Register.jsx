import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../firebase/config';
import { authService } from '../../services/auth.service';
import { useAuth } from '../../context/AuthContext';
import { Eye, EyeOff, Loader2, Building2, User, ChevronLeft, ChevronRight } from 'lucide-react';

const FIREBASE_ERRORS = {
  'auth/email-already-in-use': 'An account with this email already exists. Try signing in instead.',
  'auth/invalid-email': 'Please enter a valid email address.',
  'auth/weak-password': 'Password must be at least 6 characters.',
  'auth/too-many-requests': 'Too many attempts. Please wait a few minutes.',
  'auth/network-request-failed': 'Network error. Check your internet connection.',
  'auth/invalid-api-key': 'Firebase configuration error. Contact support.',
};

const STEPS = ['Account type', 'Your details', 'Credentials'];

export default function Register() {
  const navigate = useNavigate();
  const { refreshProfile } = useAuth();

  const [step, setStep] = useState(0);
  const [role, setRole] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [creds, setCreds] = useState({ email: '', password: '', confirmPassword: '' });
  const [elderlyForm, setElderlyForm] = useState({
    full_name: '', date_of_birth: '', gender: '', phone: '', institution_id: '',
  });
  const [institutionForm, setInstitutionForm] = useState({
    name: '', phone: '', location: '',
  });

  const goBack = () => { setStep((p) => p - 1); setError(''); };

  const handleRoleSelect = (r) => {
    setRole(r);
    setStep(1);
    setError('');
  };

  const handleDetails = (e) => {
    e.preventDefault();
    setError('');
    if (role === 'elderly') {
      if (!elderlyForm.full_name || !elderlyForm.date_of_birth || !elderlyForm.gender || !elderlyForm.institution_id) {
        return setError('Please fill in all required fields.');
      }
    } else {
      if (!institutionForm.name || !institutionForm.phone || !institutionForm.location) {
        return setError('Please fill in all required fields.');
      }
    }
    setStep(2);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (creds.password !== creds.confirmPassword) return setError('Passwords do not match.');
    if (creds.password.length < 6) return setError('Password must be at least 6 characters.');
    setLoading(true);
    try {
      const uc = await createUserWithEmailAndPassword(auth, creds.email, creds.password);
      const token = await uc.user.getIdToken();
      if (role === 'institution') {
        await authService.registerInstitution({ firebase_token: token, email: creds.email, ...institutionForm });
      } else {
        await authService.registerUser({ firebase_token: token, email: creds.email, ...elderlyForm });
      }
      await refreshProfile();
      navigate('/verify-email');
    } catch (err) {
      setError(FIREBASE_ERRORS[err.code] || err.message || 'Registration failed. Please check your details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={s.root}>
      <style>{`
        @keyframes slideIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes spin { to { transform: rotate(360deg); } }
        .rg-input:focus { outline: none; border-color: #2E7D32; box-shadow: 0 0 0 3px rgba(46,125,50,.12); }
        .rg-select:focus { outline: none; border-color: #2E7D32; box-shadow: 0 0 0 3px rgba(46,125,50,.12); }
        .rg-btn:hover:not(:disabled) { background: #1b5e20 !important; }
        .rg-btn:disabled { opacity: .6; cursor: not-allowed; }
        .rg-role:hover { border-color: #2E7D32 !important; background: #f0fdf4 !important; }
        .rg-back:hover { background: #e9ecef !important; }
      `}</style>

      {/* Top header */}
      <header style={s.header}>
        <Link to="/" style={s.logo}>
          <div style={s.logoMark}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2a10 10 0 0 1 10 10c0 5.52-4.48 10-10 10S2 17.52 2 12c0-2.76 1.12-5.26 2.93-7.07" />
              <path d="M12 6v6l4 2" />
            </svg>
          </div>
          NutritionX<span style={{ color: '#2E7D32' }}>AI</span>
        </Link>

        {/* Step tracker */}
        <div style={s.stepTrack}>
          {STEPS.map((label, i) => (
            <div key={i} style={s.stepItem}>
              <div style={{
                ...s.stepCircle,
                ...(i < step ? s.stepDone : i === step ? s.stepActive : {}),
              }}>
                {i < step ? '✓' : i + 1}
              </div>
              <span style={{
                ...s.stepLabel,
                ...(i === step ? { color: '#111', fontWeight: 600 } : {}),
              }}>
                {label}
              </span>
              {i < STEPS.length - 1 && (
                <div style={{ ...s.connector, ...(i < step ? s.connectorDone : {}) }} />
              )}
            </div>
          ))}
        </div>

        <Link to="/login" style={s.signinLink}>Already have an account? Sign in</Link>
      </header>

      {/* Progress bar */}
      <div style={s.progressBar}>
        <div style={{ ...s.progressFill, width: `${((step + 1) / STEPS.length) * 100}%` }} />
      </div>

      {/* Page content */}
      <main style={s.main}>
        <div style={s.card} key={step}>

          {error && (
            <div style={s.errorBox}>
              <span style={{ fontSize: 15 }}>⚠</span> {error}
            </div>
          )}

          {/* ── STEP 0: Choose role ── */}
          {step === 0 && (
            <>
              <div style={s.cardHead}>
                <h2 style={s.cardTitle}>Create your account</h2>
                <p style={s.cardSub}>Choose the type of account you need to get started</p>
              </div>

              <div style={s.roleGrid}>
                <button className="rg-role" onClick={() => handleRoleSelect('elderly')} style={s.roleCard}>
                  <div style={s.roleIconWrap}>
                    <User size={28} color="#2E7D32" />
                  </div>
                  <p style={s.roleTitle}>Elderly User</p>
                  <p style={s.roleDesc}>Track your meals, receive AI nutrition guidance, and monitor personal health.</p>
                </button>

                <button className="rg-role" onClick={() => handleRoleSelect('institution')} style={s.roleCard}>
                  <div style={s.roleIconWrap}>
                    <Building2 size={28} color="#2E7D32" />
                  </div>
                  <p style={s.roleTitle}>Care Institution</p>
                  <p style={s.roleDesc}>Manage and monitor nutrition for your elderly residents and get alerts.</p>
                </button>
              </div>

              <p style={s.switchText}>
                Already have an account?{' '}
                <Link to="/login" style={s.switchLink}>Sign in</Link>
              </p>
            </>
          )}

          {/* ── STEP 1: Details ── */}
          {step === 1 && (
            <>
              <div style={s.cardHead}>
                <h2 style={s.cardTitle}>
                  {role === 'institution' ? 'Institution details' : 'Personal details'}
                </h2>
                <p style={s.cardSub}>
                  {role === 'institution'
                    ? 'Tell us about your care facility'
                    : 'Help us personalize your nutrition experience'}
                </p>
              </div>

              <form onSubmit={handleDetails} style={s.form}>
                {role === 'institution' ? (
                  <>
                    <Field label="Institution name">
                      <input className="rg-input" style={s.input}
                        placeholder="e.g. Sunrise Care Home" required
                        value={institutionForm.name}
                        onChange={(e) => setInstitutionForm({ ...institutionForm, name: e.target.value })} />
                    </Field>
                    <Field label="Phone number">
                      <input className="rg-input" style={s.input}
                        type="tel" placeholder="+250 788 000 000" required
                        value={institutionForm.phone}
                        onChange={(e) => setInstitutionForm({ ...institutionForm, phone: e.target.value })} />
                    </Field>
                    <Field label="Location / address">
                      <input className="rg-input" style={s.input}
                        placeholder="City, Country" required
                        value={institutionForm.location}
                        onChange={(e) => setInstitutionForm({ ...institutionForm, location: e.target.value })} />
                    </Field>
                  </>
                ) : (
                  <>
                    <Field label="Full name">
                      <input className="rg-input" style={s.input}
                        placeholder="Your full name" required
                        value={elderlyForm.full_name}
                        onChange={(e) => setElderlyForm({ ...elderlyForm, full_name: e.target.value })} />
                    </Field>
                    <div style={s.twoCol}>
                      <Field label="Date of birth">
                        <input className="rg-input" style={s.input}
                          type="date" required
                          value={elderlyForm.date_of_birth}
                          onChange={(e) => setElderlyForm({ ...elderlyForm, date_of_birth: e.target.value })} />
                      </Field>
                      <Field label="Gender">
                        <select className="rg-select" style={s.select} required
                          value={elderlyForm.gender}
                          onChange={(e) => setElderlyForm({ ...elderlyForm, gender: e.target.value })}>
                          <option value="">Select…</option>
                          <option value="male">Male</option>
                          <option value="female">Female</option>
                          <option value="other">Other</option>
                        </select>
                      </Field>
                    </div>
                    <Field label="Phone number (optional)">
                      <input className="rg-input" style={s.input}
                        type="tel" placeholder="+250 788 000 000"
                        value={elderlyForm.phone}
                        onChange={(e) => setElderlyForm({ ...elderlyForm, phone: e.target.value })} />
                    </Field>
                    <Field label="Institution ID" hint="Get this code from your care home administrator.">
                      <input className="rg-input" style={s.input}
                        placeholder="e.g. INST-XXXXXXXX" required
                        value={elderlyForm.institution_id}
                        onChange={(e) => setElderlyForm({ ...elderlyForm, institution_id: e.target.value.toUpperCase() })} />
                    </Field>
                  </>
                )}

                <div style={s.navRow}>
                  <button type="button" className="rg-back" onClick={goBack} style={s.backBtn}>
                    <ChevronLeft size={15} /> Back
                  </button>
                  <button type="submit" className="rg-btn" style={{ ...s.submitBtn, flex: 1 }}>
                    Continue <ChevronRight size={15} />
                  </button>
                </div>
              </form>
            </>
          )}

          {/* ── STEP 2: Credentials ── */}
          {step === 2 && (
            <>
              <div style={s.cardHead}>
                <h2 style={s.cardTitle}>Set your credentials</h2>
                <p style={s.cardSub}>Choose an email address and a secure password</p>
              </div>

              <form onSubmit={handleSubmit} style={s.form}>
                <Field label="Email address">
                  <input className="rg-input" style={s.input}
                    type="email" placeholder="you@example.com"
                    required autoFocus
                    value={creds.email}
                    onChange={(e) => setCreds({ ...creds, email: e.target.value })} />
                </Field>

                <Field label="Password" hint="At least 6 characters">
                  <div style={{ position: 'relative' }}>
                    <input className="rg-input" style={{ ...s.input, paddingRight: 42 }}
                      type={showPw ? 'text' : 'password'}
                      placeholder="Min. 6 characters" required
                      value={creds.password}
                      onChange={(e) => setCreds({ ...creds, password: e.target.value })} />
                    <button type="button" onClick={() => setShowPw(!showPw)}
                      style={s.eyeBtn} tabIndex={-1}
                      aria-label={showPw ? 'Hide password' : 'Show password'}>
                      {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </Field>

                <Field label="Confirm password">
                  <input className="rg-input" style={s.input}
                    type="password" placeholder="Repeat your password" required
                    value={creds.confirmPassword}
                    onChange={(e) => setCreds({ ...creds, confirmPassword: e.target.value })} />
                </Field>

                <div style={s.navRow}>
                  <button type="button" className="rg-back" onClick={goBack} style={s.backBtn}>
                    <ChevronLeft size={15} /> Back
                  </button>
                  <button type="submit" className="rg-btn" disabled={loading}
                    style={{ ...s.submitBtn, flex: 1 }}>
                    {loading
                      ? <><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> Creating account…</>
                      : 'Create Account'}
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      </main>
    </div>
  );
}

function Field({ label, hint, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      <label style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>{label}</label>
      {children}
      {hint && <p style={{ margin: 0, fontSize: 11, color: '#9ca3af' }}>{hint}</p>}
    </div>
  );
}

const s = {
  root: {
    minHeight: '100vh',
    fontFamily: "'DM Sans', system-ui, sans-serif",
    background: '#f7f9f7',
    display: 'flex',
    flexDirection: 'column',
  },

  // Header
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '14px 32px',
    background: '#fff',
    borderBottom: '1px solid #e5ebe5',
    gap: 16,
    flexWrap: 'wrap',
  },
  logo: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    fontSize: 17,
    fontWeight: 800,
    color: '#111',
    textDecoration: 'none',
    flexShrink: 0,
  },
  logoMark: {
    width: 32,
    height: 32,
    borderRadius: 8,
    background: '#2E7D32',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepTrack: {
    display: 'flex',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    gap: 0,
  },
  stepItem: { display: 'flex', alignItems: 'center', gap: 8 },
  stepCircle: {
    width: 26,
    height: 26,
    borderRadius: '50%',
    background: '#e5e7eb',
    color: '#9ca3af',
    fontSize: 11,
    fontWeight: 700,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    transition: 'all .3s',
  },
  stepActive: { background: '#2E7D32', color: '#fff' },
  stepDone: { background: '#dcfce7', color: '#15803d' },
  stepLabel: { fontSize: 12, color: '#9ca3af', fontWeight: 500, whiteSpace: 'nowrap' },
  connector: {
    width: 28,
    height: 2,
    background: '#e5e7eb',
    margin: '0 8px',
    borderRadius: 2,
    transition: 'background .3s',
  },
  connectorDone: { background: '#86efac' },
  signinLink: {
    fontSize: 13,
    color: '#2E7D32',
    fontWeight: 600,
    textDecoration: 'none',
    flexShrink: 0,
  },

  progressBar: { height: 3, background: '#e5e7eb' },
  progressFill: {
    height: '100%',
    background: 'linear-gradient(90deg, #2E7D32, #4ade80)',
    borderRadius: '0 2px 2px 0',
    transition: 'width .4s ease',
  },

  // Content
  main: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '40px 24px',
  },
  card: {
    width: '100%',
    maxWidth: 500,
    background: '#fff',
    borderRadius: 20,
    padding: '40px 36px',
    boxShadow: '0 4px 32px rgba(0,0,0,.07)',
    border: '1px solid #e5ebe5',
    animation: 'slideIn .35s ease forwards',
  },
  cardHead: { marginBottom: 24 },
  cardTitle: {
    margin: '0 0 6px',
    fontSize: 24,
    fontWeight: 700,
    color: '#0f1f0f',
    letterSpacing: '-0.025em',
  },
  cardSub: { margin: 0, fontSize: 14, color: '#6b7280' },
  errorBox: {
    background: '#fef2f2',
    border: '1px solid #fecaca',
    color: '#991b1b',
    borderRadius: 10,
    padding: '10px 14px',
    fontSize: 13,
    marginBottom: 18,
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },

  // Role cards
  roleGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 20 },
  roleCard: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 12,
    padding: '26px 16px',
    borderRadius: 14,
    border: '2px solid #e5e7eb',
    background: '#fff',
    cursor: 'pointer',
    textAlign: 'center',
    transition: 'border-color .2s, background .2s',
    fontFamily: 'inherit',
  },
  roleIconWrap: {
    width: 58,
    height: 58,
    borderRadius: 16,
    background: '#f0fdf4',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  roleTitle: { margin: 0, fontSize: 14, fontWeight: 700, color: '#111' },
  roleDesc: { margin: 0, fontSize: 12, color: '#6b7280', lineHeight: 1.55 },
  switchText: { textAlign: 'center', fontSize: 13, color: '#6b7280', marginTop: 6 },
  switchLink: { color: '#2E7D32', fontWeight: 600, textDecoration: 'none' },

  // Form
  form: { display: 'flex', flexDirection: 'column', gap: 16 },
  input: {
    width: '100%',
    padding: '11px 14px',
    fontSize: 14,
    border: '1.5px solid #d1d5db',
    borderRadius: 10,
    color: '#111',
    background: '#fff',
    transition: 'border-color .2s, box-shadow .2s',
    boxSizing: 'border-box',
    fontFamily: 'inherit',
  },
  select: {
    width: '100%',
    padding: '11px 14px',
    fontSize: 14,
    border: '1.5px solid #d1d5db',
    borderRadius: 10,
    color: '#111',
    background: '#fff',
    transition: 'border-color .2s, box-shadow .2s',
    boxSizing: 'border-box',
    fontFamily: 'inherit',
    cursor: 'pointer',
  },
  eyeBtn: {
    position: 'absolute',
    right: 12,
    top: '50%',
    transform: 'translateY(-50%)',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: '#9ca3af',
    display: 'flex',
    alignItems: 'center',
    padding: 2,
  },
  twoCol: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 },
  navRow: { display: 'flex', gap: 10, marginTop: 4 },
  backBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    padding: '11px 16px',
    background: '#f3f4f6',
    color: '#374151',
    border: '1px solid #e5e7eb',
    borderRadius: 10,
    fontSize: 14,
    fontWeight: 500,
    cursor: 'pointer',
    fontFamily: 'inherit',
    transition: 'background .15s',
  },
  submitBtn: {
    padding: '12px',
    background: '#2E7D32',
    color: '#fff',
    border: 'none',
    borderRadius: 10,
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    transition: 'background .2s',
    fontFamily: 'inherit',
    letterSpacing: '-0.01em',
  },
};
