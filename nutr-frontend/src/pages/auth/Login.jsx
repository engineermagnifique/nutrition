import { useState } from 'react';
import { Link } from 'react-router-dom';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../firebase/config';
import { Eye, EyeOff, Loader2 } from 'lucide-react';

const FIREBASE_ERRORS = {
  'auth/invalid-credential': 'Invalid email or password.',
  'auth/user-not-found': 'No account found with this email.',
  'auth/wrong-password': 'Invalid email or password.',
  'auth/too-many-requests': 'Too many attempts. Please wait a few minutes.',
  'auth/invalid-email': 'Please enter a valid email address.',
  'auth/user-disabled': 'This account has been disabled. Contact support.',
  'auth/network-request-failed': 'Network error. Check your internet connection.',
};

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, form.email, form.password);
      // AuthContext route guards handle redirect
    } catch (err) {
      setError(FIREBASE_ERRORS[err.code] || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={s.root}>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes spin { to { transform: rotate(360deg); } }
        .ln-input:focus { outline: none; border-color: #2E7D32; box-shadow: 0 0 0 3px rgba(46,125,50,.12); }
        .ln-btn:hover:not(:disabled) { background: #1b5e20 !important; }
        .ln-btn:disabled { opacity: .6; cursor: not-allowed; }
        .ln-register:hover { border-color: #2E7D32 !important; color: #1b5e20 !important; }
      `}</style>

      {/* LEFT — branding */}
      <div style={s.left}>
        <div style={s.leftInner}>
          <Link to="/" style={s.logo}>
            <div style={s.logoMark}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2a10 10 0 0 1 10 10c0 5.52-4.48 10-10 10S2 17.52 2 12c0-2.76 1.12-5.26 2.93-7.07" />
                <path d="M12 6v6l4 2" />
              </svg>
            </div>
            <span>NutritionX<span style={{ color: '#86efac' }}>AI</span></span>
          </Link>

          <div style={s.leftText}>
            <h1 style={s.leftH1}>Welcome back.</h1>
            <p style={s.leftP}>
              Sign in to continue monitoring your nutrition and health with AI-powered insights.
            </p>
          </div>

          <div style={s.statsGrid}>
            {[['2,400+', 'Active Users'], ['94%', 'AI Accuracy'], ['80+', 'Institutions']].map(([v, l]) => (
              <div key={l} style={s.stat}>
                <span style={s.statVal}>{v}</span>
                <span style={s.statLabel}>{l}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* RIGHT — form */}
      <div style={s.right}>
        <div style={s.card}>
          <div style={s.cardHead}>
            <h2 style={s.cardTitle}>Sign In</h2>
            <p style={s.cardSub}>Enter your credentials to access your account</p>
          </div>

          {error && (
            <div style={s.errorBox}>
              <span style={{ fontSize: 15 }}>⚠</span> {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={s.form}>
            <div style={s.field}>
              <label style={s.label}>Email address</label>
              <input
                className="ln-input"
                type="email"
                placeholder="you@example.com"
                required
                autoFocus
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                style={s.input}
              />
            </div>

            <div style={s.field}>
              <label style={s.label}>Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  className="ln-input"
                  type={showPw ? 'text' : 'password'}
                  placeholder="Your password"
                  required
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  style={{ ...s.input, paddingRight: 42 }}
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  style={s.eyeBtn}
                  tabIndex={-1}
                  aria-label={showPw ? 'Hide password' : 'Show password'}
                >
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button type="submit" className="ln-btn" disabled={loading} style={s.submitBtn}>
              {loading
                ? <><Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> Signing in…</>
                : 'Sign In'}
            </button>
          </form>

          <div style={s.dividerRow}>
            <span style={s.dividerLine} />
            <span style={s.dividerText}>New here?</span>
            <span style={s.dividerLine} />
          </div>

          <Link to="/register" className="ln-register" style={s.registerBtn}>
            Create a free account
          </Link>

          <Link to="/" style={s.homeLink}>← Back to home</Link>
        </div>
      </div>
    </div>
  );
}

const s = {
  root: {
    display: 'flex',
    minHeight: '100vh',
    fontFamily: "'DM Sans', system-ui, sans-serif",
  },
  left: {
    flex: '0 0 42%',
    background: 'linear-gradient(160deg, #14532d 0%, #166534 50%, #15803d 100%)',
    display: 'flex',
    alignItems: 'center',
    padding: '48px 52px',
    position: 'relative',
    overflow: 'hidden',
  },
  leftInner: {
    position: 'relative',
    zIndex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: 44,
    width: '100%',
  },
  logo: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 10,
    fontSize: 19,
    fontWeight: 800,
    color: '#fff',
    textDecoration: 'none',
  },
  logoMark: {
    width: 38,
    height: 38,
    borderRadius: 10,
    background: 'rgba(255,255,255,.18)',
    border: '1px solid rgba(255,255,255,.3)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  leftText: { display: 'flex', flexDirection: 'column', gap: 14 },
  leftH1: {
    margin: 0,
    fontSize: 'clamp(30px, 3vw, 44px)',
    fontWeight: 800,
    color: '#fff',
    lineHeight: 1.1,
    letterSpacing: '-0.04em',
  },
  leftP: {
    margin: 0,
    fontSize: 15,
    color: 'rgba(255,255,255,.72)',
    lineHeight: 1.7,
    maxWidth: 300,
  },
  statsGrid: {
    display: 'flex',
    gap: 0,
    borderTop: '1px solid rgba(255,255,255,.15)',
    paddingTop: 28,
  },
  stat: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: 3,
    paddingRight: 20,
  },
  statVal: { fontSize: 24, fontWeight: 800, color: '#86efac' },
  statLabel: { fontSize: 12, color: 'rgba(255,255,255,.55)', letterSpacing: '0.02em' },

  right: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#f7f9f7',
    padding: '40px 24px',
  },
  card: {
    width: '100%',
    maxWidth: 400,
    background: '#fff',
    borderRadius: 20,
    padding: '40px 36px',
    boxShadow: '0 4px 32px rgba(0,0,0,.07)',
    border: '1px solid #e5ebe5',
    display: 'flex',
    flexDirection: 'column',
    animation: 'fadeIn .4s ease forwards',
  },
  cardHead: { marginBottom: 24 },
  cardTitle: {
    margin: '0 0 6px',
    fontSize: 26,
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
    marginBottom: 16,
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  form: { display: 'flex', flexDirection: 'column', gap: 18 },
  field: { display: 'flex', flexDirection: 'column', gap: 6 },
  label: { fontSize: 13, fontWeight: 600, color: '#374151' },
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
  submitBtn: {
    width: '100%',
    padding: '13px',
    background: '#2E7D32',
    color: '#fff',
    border: 'none',
    borderRadius: 10,
    fontSize: 15,
    fontWeight: 600,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    transition: 'background .2s',
    marginTop: 4,
    fontFamily: 'inherit',
    letterSpacing: '-0.01em',
  },
  dividerRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    margin: '24px 0 16px',
  },
  dividerLine: {
    flex: 1,
    height: 1,
    background: '#e5e7eb',
    display: 'block',
  },
  dividerText: { fontSize: 12, color: '#9ca3af', whiteSpace: 'nowrap' },
  registerBtn: {
    display: 'block',
    textAlign: 'center',
    padding: '12px',
    border: '1.5px solid #d1d5db',
    borderRadius: 10,
    fontSize: 14,
    fontWeight: 600,
    color: '#2E7D32',
    textDecoration: 'none',
    transition: 'border-color .2s, color .2s',
    marginBottom: 14,
  },
  homeLink: {
    display: 'block',
    textAlign: 'center',
    fontSize: 13,
    color: '#9ca3af',
    textDecoration: 'none',
  },
};
