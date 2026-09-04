import React, { useState } from 'react';
import { useAuth } from '@/src/context/AuthContext.tsx';
import { BRAND_CONFIG } from '@/src/config/brand.ts';
import {
  ShieldCheck,
  Lock,
  Mail,
  User,
  Globe,
  KeyRound,
  AlertCircle,
  CheckCircle2,
  X,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'register' | 'forgot' | 'verify';
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, initialMode = 'login' }) => {
  const { login, register, requestPasswordReset, completePasswordReset, verifyEmail } = useAuth();

  const [mode, setMode] = useState<'login' | 'register' | 'forgot' | 'reset' | 'verify'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [country, setCountry] = useState('NG');
  const [preferredCurrency, setPreferredCurrency] = useState<'NGN' | 'USD'>('NGN');

  // Reset password states
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [devResetToken, setDevResetToken] = useState<string | null>(null);

  // Email verify states
  const [verificationToken, setVerificationToken] = useState('');

  // Status & error messages
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCountryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selected = e.target.value;
    setCountry(selected);
    if (selected === 'NG') {
      setPreferredCurrency('NGN');
    } else {
      setPreferredCurrency('USD');
    }
  };

  const handleQuickDemoLogin = async (demoEmail: string) => {
    setLoading(true);
    setError(null);
    const res = await login(demoEmail, 'AuthorPass2026!');
    setLoading(false);
    if (res.success) {
      onClose();
    } else {
      setError(res.error || 'Demo login failed');
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await login(email, password);
    setLoading(false);
    if (res.success) {
      onClose();
    } else {
      setError(res.error || 'Sign in failed');
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await register(email, password, displayName, country, preferredCurrency);
    setLoading(false);
    if (res.success) {
      setSuccessMessage('Account registered successfully!');
      if (res.verificationToken) {
        setVerificationToken(res.verificationToken);
        setMode('verify');
      } else {
        onClose();
      }
    } else {
      setError(res.error || 'Registration failed');
    }
  };

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await requestPasswordReset(email);
    setLoading(false);
    if (res.success) {
      setSuccessMessage('Password reset instructions generated.');
      if (res.devToken) {
        setDevResetToken(res.devToken);
        setResetToken(res.devToken);
      }
      setMode('reset');
    } else {
      setError(res.error || 'Failed to request password reset');
    }
  };

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await completePasswordReset(resetToken, newPassword);
    setLoading(false);
    if (res.success) {
      setSuccessMessage('Password updated successfully! You can now sign in.');
      setTimeout(() => {
        setMode('login');
        setSuccessMessage(null);
      }, 1500);
    } else {
      setError(res.error || 'Password reset failed');
    }
  };

  const handleVerifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await verifyEmail(verificationToken);
    setLoading(false);
    if (res.success) {
      setSuccessMessage('Email verified successfully!');
      setTimeout(() => {
        onClose();
      }, 1200);
    } else {
      setError(res.error || 'Verification failed');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
      <div
        id="auth-modal-container"
        className="w-full max-w-lg overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl transition-all"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/80 px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-600 text-white shadow-xs">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900">{BRAND_CONFIG.name} Security</h2>
              <p className="text-xs text-slate-500">Encrypted authentication & tenant isolation</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Notifications */}
        {error && (
          <div className="flex items-start gap-2.5 border-b border-rose-100 bg-rose-50 px-6 py-3 text-xs text-rose-700">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-500 mt-0.5" />
            <span>{error}</span>
          </div>
        )}
        {successMessage && (
          <div className="flex items-start gap-2.5 border-b border-emerald-100 bg-emerald-50 px-6 py-3 text-xs text-emerald-700">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500 mt-0.5" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Form Body */}
        <div className="p-6">
          {mode === 'login' && (
            <div>
              <div className="mb-5">
                <h3 className="text-lg font-bold text-slate-900">Sign in to your publisher account</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Access your private KDP research, cover projects, and keyword tracking.
                </p>
              </div>

              {/* Demo Accounts Quick-Pick */}
              <div className="mb-5 rounded-xl border border-emerald-100 bg-emerald-50/60 p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-900">
                    <Sparkles className="h-3.5 w-3.5 text-emerald-600" /> One-Click Demo Personas:
                  </span>
                  <span className="text-[10px] text-emerald-700 font-mono">Password: AuthorPass2026!</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleQuickDemoLogin('chidi.author@example.com')}
                    className="flex flex-col items-start rounded-lg border border-emerald-200 bg-white p-2.5 text-left text-xs hover:border-emerald-400 hover:bg-emerald-50/50 transition shadow-2xs"
                  >
                    <span className="font-medium text-slate-900">Chidi Okafor 🇳🇬</span>
                    <span className="text-[11px] text-slate-500">Nigeria (₦ NGN Plan)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickDemoLogin('sarah.publisher@example.com')}
                    className="flex flex-col items-start rounded-lg border border-emerald-200 bg-white p-2.5 text-left text-xs hover:border-emerald-400 hover:bg-emerald-50/50 transition shadow-2xs"
                  >
                    <span className="font-medium text-slate-900">Sarah Jenkins 🇺🇸</span>
                    <span className="text-[11px] text-slate-500">US ($ USD Elite)</span>
                  </button>
                </div>
              </div>

              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <input
                      id="login-email"
                      type="email"
                      required
                      placeholder="author@domain.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-medium text-slate-700">Password</label>
                    <button
                      type="button"
                      onClick={() => {
                        setError(null);
                        setMode('forgot');
                      }}
                      className="text-xs text-emerald-600 hover:text-emerald-700 font-medium"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <input
                      id="login-password"
                      type="password"
                      required
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-lg bg-emerald-600 py-2.5 text-sm font-semibold text-white shadow-xs hover:bg-emerald-700 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 transition disabled:opacity-50"
                >
                  {loading ? 'Authenticating...' : 'Sign In'}
                </button>
              </form>

              <div className="mt-5 text-center text-xs text-slate-500">
                Don't have an account?{' '}
                <button
                  onClick={() => {
                    setError(null);
                    setMode('register');
                  }}
                  className="font-semibold text-emerald-600 hover:underline"
                >
                  Create free author account
                </button>
              </div>
            </div>
          )}

          {mode === 'register' && (
            <div>
              <div className="mb-4">
                <h3 className="text-lg font-bold text-slate-900">Create your Publisher Account</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Tailored for African and international self-publishers with localized pricing.
                </p>
              </div>

              <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Full Name or Pen Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <input
                      id="register-name"
                      type="text"
                      required
                      placeholder="e.g. Babatunde Alabi"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <input
                      id="register-email"
                      type="email"
                      required
                      placeholder="you@domain.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Password (Min. 8 characters)</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <input
                      id="register-password"
                      type="password"
                      required
                      minLength={8}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Country</label>
                    <div className="relative">
                      <Globe className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                      <select
                        id="register-country"
                        value={country}
                        onChange={handleCountryChange}
                        className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-xs text-slate-900 focus:border-emerald-500 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20"
                      >
                        <option value="NG">Nigeria 🇳🇬</option>
                        <option value="GH">Ghana 🇬🇭</option>
                        <option value="KE">Kenya 🇰🇪</option>
                        <option value="ZA">South Africa 🇿🇦</option>
                        <option value="US">United States 🇺🇸</option>
                        <option value="UK">United Kingdom 🇬🇧</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Billing Currency</label>
                    <select
                      id="register-currency"
                      value={preferredCurrency}
                      onChange={(e) => setPreferredCurrency(e.target.value as 'NGN' | 'USD')}
                      className="w-full rounded-lg border border-slate-200 bg-white py-2 px-3 text-xs text-slate-900 focus:border-emerald-500 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20"
                    >
                      <option value="NGN">₦ NGN (Nigerian Naira)</option>
                      <option value="USD">$ USD (US Dollar)</option>
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-2 rounded-lg bg-emerald-600 py-2.5 text-sm font-semibold text-white shadow-xs hover:bg-emerald-700 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 transition disabled:opacity-50"
                >
                  {loading ? 'Creating Account...' : 'Create Free Account'}
                </button>
              </form>

              <div className="mt-4 text-center text-xs text-slate-500">
                Already registered?{' '}
                <button
                  onClick={() => {
                    setError(null);
                    setMode('login');
                  }}
                  className="font-semibold text-emerald-600 hover:underline"
                >
                  Sign in here
                </button>
              </div>
            </div>
          )}

          {mode === 'forgot' && (
            <div>
              <div className="mb-4">
                <h3 className="text-lg font-bold text-slate-900">Reset Your Password</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Enter your email address and we'll issue a secure password reset token.
                </p>
              </div>

              <form onSubmit={handleForgotSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Registered Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <input
                      id="forgot-email"
                      type="email"
                      required
                      placeholder="author@domain.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-lg bg-emerald-600 py-2.5 text-sm font-semibold text-white shadow-xs hover:bg-emerald-700 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 transition disabled:opacity-50"
                >
                  {loading ? 'Generating Token...' : 'Send Reset Instructions'}
                </button>
              </form>

              <div className="mt-4 text-center text-xs text-slate-500">
                Remember your password?{' '}
                <button onClick={() => setMode('login')} className="font-semibold text-emerald-600 hover:underline">
                  Return to sign in
                </button>
              </div>
            </div>
          )}

          {mode === 'reset' && (
            <div>
              <div className="mb-4">
                <h3 className="text-lg font-bold text-slate-900">Set New Password</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Enter the secure token and your new strong password.
                </p>
              </div>

              {devResetToken && (
                <div className="mb-3 rounded-lg border border-emerald-200 bg-emerald-50 p-2.5 text-xs text-emerald-800">
                  <span className="font-semibold">Simulated Email Token:</span>
                  <p className="mt-1 font-mono text-[11px] break-all bg-white p-1 rounded border border-emerald-100">
                    {devResetToken}
                  </p>
                </div>
              )}

              <form onSubmit={handleResetSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Reset Token</label>
                  <div className="relative">
                    <KeyRound className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <input
                      id="reset-token"
                      type="text"
                      required
                      placeholder="Paste reset token here"
                      value={resetToken}
                      onChange={(e) => setResetToken(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-xs font-mono text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">New Password (Min. 8 characters)</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <input
                      id="reset-new-password"
                      type="password"
                      required
                      minLength={8}
                      placeholder="••••••••"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-lg bg-emerald-600 py-2.5 text-sm font-semibold text-white shadow-xs hover:bg-emerald-700 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 transition disabled:opacity-50"
                >
                  {loading ? 'Updating Password...' : 'Save New Password'}
                </button>
              </form>
            </div>
          )}

          {mode === 'verify' && (
            <div>
              <div className="mb-4">
                <h3 className="text-lg font-bold text-slate-900">Verify Email Address</h3>
                <p className="text-xs text-slate-500 mt-1">
                  We sent a confirmation token to verify your account.
                </p>
              </div>

              {verificationToken && (
                <div className="mb-3 rounded-lg border border-emerald-200 bg-emerald-50 p-2.5 text-xs text-emerald-800">
                  <span className="font-semibold">Development Verification Token:</span>
                  <p className="mt-1 font-mono text-[11px] break-all bg-white p-1 rounded border border-emerald-100">
                    {verificationToken}
                  </p>
                </div>
              )}

              <form onSubmit={handleVerifySubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Verification Token</label>
                  <div className="relative">
                    <KeyRound className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <input
                      id="verification-token-input"
                      type="text"
                      required
                      placeholder="Enter verification token"
                      value={verificationToken}
                      onChange={(e) => setVerificationToken(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-xs font-mono text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-lg bg-emerald-600 py-2.5 text-sm font-semibold text-white shadow-xs hover:bg-emerald-700 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 transition disabled:opacity-50"
                >
                  {loading ? 'Verifying...' : 'Confirm Email'}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
