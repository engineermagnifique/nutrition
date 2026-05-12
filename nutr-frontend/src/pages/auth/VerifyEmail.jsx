import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MailCheck, RefreshCw, Loader2 } from 'lucide-react';
import { authService } from '../../services/auth.service';
import { useAuth } from '../../context/AuthContext';

export default function VerifyEmail() {
  const { firebaseUser, profile, refreshProfile, logout } = useAuth();
  const navigate = useNavigate();

  // Use firebaseUser.email as fallback in case backend profile hasn't loaded yet
  const email = profile?.email || firebaseUser?.email || '';
  const role = profile?.role;

  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState('');
  const [resendSuccess, setResendSuccess] = useState(false);

  const handleVerify = async (e) => {
    e.preventDefault();
    if (code.length !== 6) { setError('Please enter the 6-digit code.'); return; }
    setError('');
    setLoading(true);
    try {
      await authService.verifyEmail({ email, code });
      await refreshProfile();
      navigate(role === 'institution' ? '/institution' : '/user', { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Invalid or expired code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    setError('');
    setResendSuccess(false);
    try {
      await authService.resendVerification(email);
      setResendSuccess(true);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to resend. Please try again.');
    } finally {
      setResending(false);
    }
  };

  return (
    <div style={s.root}>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes spin { to { transform: rotate(360deg); } }
        .ve-input:focus { outline: none; border-color: #2E7D32; box-shadow: 0 0 0 3px rgba(46,125,50,.12); }
        .ve-btn:hover:not(:disabled) { background: #1b5e20 !important; }
        .ve-btn:disabled { opacity: .6; cursor: not-allowed; }
        .ve-resend:hover:not(:disabled) { text-decoration: underline; }
      `}</style>

      <div style={s.card}>
        {/* Icon */}
        <div style={s.iconWrap}>
          <MailCheck size={28} color="#2E7D32" />
        </div>

        {/* Header */}
        <h1 style={s.title}>Check your email</h1>
        <p style={s.sub}>
          We sent a 6-digit verification code to{' '}
          <strong style={{ color: '#111' }}>{email}</strong>.
          <br />Enter it below to activate your account.
        </p>

        {/* Error */}
        {error && (
          <div style={s.errorBox}>
            <span>⚠</span> {error}
          </div>
        )}

        {/* Success resend */}
        {resendSuccess && (
          <div style={s.successBox}>
            <span>✓</span> A new code was sent to your email.
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleVerify} style={s.form}>
          <input
            className="ve-input"
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            placeholder="000000"
            maxLength={6}
            required
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            style={s.codeInput}
            autoFocus
          />
          <button type="submit" className="ve-btn" disabled={loading} style={s.submitBtn}>
            {loading
              ? <><Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> Verifying…</>
              : 'Verify Email'}
          </button>
        </form>

        {/* Resend */}
        <div style={s.footer}>
          <p style={s.footerText}>Didn't receive the code?</p>
          <button
            className="ve-resend"
            onClick={handleResend}
            disabled={resending}
            style={s.resendBtn}
          >
            {resending
              ? <><RefreshCw size={13} style={{ animation: 'spin 1s linear infinite' }} /> Sending…</>
              : <><RefreshCw size={13} /> Resend code</>}
          </button>
          <button onClick={logout} style={s.logoutBtn}>
            Sign out
          </button>
        </div>
      </div>
    </div>
  );
}

const s = {
  root: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#f7f9f7',
    padding: '24px',
    fontFamily: "'DM Sans', system-ui, sans-serif",
  },
  card: {
    width: '100%',
    maxWidth: 420,
    background: '#fff',
    borderRadius: 20,
    padding: '44px 36px',
    boxShadow: '0 4px 32px rgba(0,0,0,.07)',
    border: '1px solid #e5ebe5',
    textAlign: 'center',
    animation: 'fadeIn .4s ease forwards',
  },
  iconWrap: {
    width: 60,
    height: 60,
    borderRadius: 16,
    background: '#f0fdf4',
    border: '1px solid #bbf7d0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 20px',
  },
  title: {
    margin: '0 0 10px',
    fontSize: 22,
    fontWeight: 700,
    color: '#0f1f0f',
    letterSpacing: '-0.02em',
  },
  sub: {
    margin: '0 0 24px',
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 1.65,
  },
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
    textAlign: 'left',
  },
  successBox: {
    background: '#f0fdf4',
    border: '1px solid #bbf7d0',
    color: '#166534',
    borderRadius: 10,
    padding: '10px 14px',
    fontSize: 13,
    marginBottom: 16,
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    textAlign: 'left',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: 14,
  },
  codeInput: {
    width: '100%',
    padding: '14px',
    fontSize: 28,
    fontWeight: 700,
    letterSpacing: '0.35em',
    textAlign: 'center',
    border: '2px solid #d1d5db',
    borderRadius: 12,
    color: '#111',
    background: '#fff',
    transition: 'border-color .2s, box-shadow .2s',
    boxSizing: 'border-box',
    fontFamily: 'monospace',
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
    fontFamily: 'inherit',
  },
  footer: {
    marginTop: 24,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 8,
  },
  footerText: {
    margin: 0,
    fontSize: 13,
    color: '#9ca3af',
  },
  resendBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: 13,
    fontWeight: 600,
    color: '#2E7D32',
    fontFamily: 'inherit',
    padding: 0,
  },
  logoutBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: 12,
    color: '#9ca3af',
    fontFamily: 'inherit',
    marginTop: 2,
  },
};
