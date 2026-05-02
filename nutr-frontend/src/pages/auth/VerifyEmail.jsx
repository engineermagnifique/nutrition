import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MailCheck, RefreshCw } from 'lucide-react';
import { authService } from '../../services/auth.service';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Alert from '../../components/ui/Alert';

export default function VerifyEmail() {
  const { profile, refreshProfile, logout } = useAuth();
  const navigate = useNavigate();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleVerify = async (e) => {
    e.preventDefault();
    if (code.length !== 6) { setError('Please enter the 6-digit code.'); return; }
    setError('');
    setLoading(true);
    try {
      await authService.verifyEmail({ email: profile?.email, code });
      await refreshProfile();
      navigate(profile?.role === 'institution' ? '/institution' : '/user');
    } catch (err) {
      setError(err.message || 'Invalid or expired code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    setError('');
    try {
      await authService.resendVerification(profile?.email);
      setSuccess('A new verification code has been sent to your email.');
    } catch (err) {
      setError(err.message);
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 text-center">
          <div className="h-16 w-16 bg-primary-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <MailCheck className="h-8 w-8 text-primary-800" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Verify Your Email</h1>
          <p className="text-gray-600 text-sm mb-6">
            We sent a 6-digit verification code to{' '}
            <strong className="text-gray-900">{profile?.email}</strong>. Enter it below to activate your account.
          </p>

          {error && <Alert type="error" message={error} onClose={() => setError('')} className="mb-4 text-left" />}
          {success && <Alert type="success" message={success} className="mb-4 text-left" />}

          <form onSubmit={handleVerify} className="space-y-4">
            <Input
              placeholder="Enter 6-digit code"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              className="text-center text-2xl tracking-widest font-mono"
              maxLength={6}
              required
            />
            <Button type="submit" loading={loading} className="w-full" size="lg">
              Verify Email
            </Button>
          </form>

          <div className="mt-6 flex flex-col gap-2">
            <button
              onClick={handleResend}
              disabled={resending}
              className="inline-flex items-center justify-center gap-2 text-sm text-primary-800 hover:underline disabled:opacity-60"
            >
              <RefreshCw className={`h-4 w-4 ${resending ? 'animate-spin' : ''}`} />
              Resend verification code
            </button>
            <button onClick={logout} className="text-sm text-gray-500 hover:text-gray-700">
              Sign out and try a different account
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
