import React, { useState } from "react";
import { useAuth } from "@/src/context/AuthContext.tsx";
import { BRAND_CONFIG } from "@/src/config/brand.ts";
import { useTheme } from "@/src/context/ThemeContext.tsx";
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
  ArrowLeft,
} from "lucide-react";

interface AuthPageProps {
  onClose: () => void;
  initialMode?: "login" | "register" | "forgot" | "verify";
}

export const AuthPage: React.FC<AuthPageProps> = ({
  onClose,
  initialMode = "login",
}) => {
  const {
    login,
    register,
    requestPasswordReset,
    completePasswordReset,
    verifyEmail,
  } = useAuth();
  const { theme } = useTheme();

  const [mode, setMode] = useState<
    "login" | "register" | "forgot" | "reset" | "verify"
  >(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [country, setCountry] = useState("NG");
  const [preferredCurrency, setPreferredCurrency] = useState<"NGN" | "USD">(
    "NGN",
  );

  // Reset password states
  const [resetToken, setResetToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [devResetToken, setDevResetToken] = useState<string | null>(null);

  // Email verify states
  const [verificationToken, setVerificationToken] = useState("");

  // Status & error messages
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleCountryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selected = e.target.value;
    setCountry(selected);
    if (selected === "NG") {
      setPreferredCurrency("NGN");
    } else {
      setPreferredCurrency("USD");
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
      console.error(res.error);
      setError(
        "We couldn't sign you in. Please check your credentials and try again.",
      );
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await register(
      email,
      password,
      displayName,
      country,
      preferredCurrency,
    );
    setLoading(false);
    if (res.success) {
      setSuccessMessage("Account registered successfully! Please check your email for the verification code.");
      if (res.verificationToken) {
        setVerificationToken(res.verificationToken);
        setMode("verify");
      } else {
        setMode("verify"); // still go to verify mode
      }
    } else {
      console.error(res.error);
      setError("We couldn't create your account right now. Please try again.");
    }
  };

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await requestPasswordReset(email);
    setLoading(false);
    if (res.success) {
      setSuccessMessage("Password reset instructions generated.");
      if (res.devToken) {
        setDevResetToken(res.devToken);
        setResetToken(res.devToken);
      }
      setMode("reset");
    } else {
      console.error(res.error);
      setError(
        "Something went wrong requesting a password reset. Please try again.",
      );
    }
  };

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await completePasswordReset(resetToken, newPassword);
    setLoading(false);
    if (res.success) {
      setSuccessMessage("Password updated successfully! You can now sign in.");
      setTimeout(() => {
        setMode("login");
        setSuccessMessage(null);
      }, 1500);
    } else {
      console.error(res.error);
      setError("We couldn't reset your password. The token may have expired.");
    }
  };

  const handleVerifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await verifyEmail(verificationToken);
    setLoading(false);
    if (res.success) {
      setSuccessMessage("Email verified successfully!");
      setTimeout(() => {
        onClose();
      }, 1200);
    } else {
      console.error(res.error);
      setError(
        "We couldn't verify your email. The token may be invalid or expired.",
      );
    }
  };

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 transition-colors duration-200 ${theme === "dark" ? "bg-slate-950" : "bg-slate-50"}`}>
      <div className="absolute top-4 left-4 z-50">
         <button
            onClick={onClose}
            className={`flex items-center gap-2 px-4 py-2 rounded-full font-medium transition cursor-pointer ${
              theme === "dark" 
                ? "bg-white/10 text-white hover:bg-white/20" 
                : "bg-white text-slate-700 shadow-sm border border-slate-200 hover:bg-slate-50"
            }`}
            aria-label="Back to home"
          >
            <ArrowLeft className="h-4 w-4" /> Back
          </button>
      </div>
      
      <div
        id="auth-page-container"
        className={`w-full max-w-lg overflow-hidden rounded-2xl border shadow-2xl transition-all ${
          theme === "dark" ? "border-white/10 bg-slate-900/50 backdrop-blur-xl" : "border-slate-200 bg-white"
        }`}
      >
        {/* Header */}
        <div className={`flex items-center justify-between border-b px-6 py-4 ${
          theme === "dark" ? "border-white/10 bg-slate-900/80" : "border-slate-100 bg-slate-50/80"
        }`}>
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-600 text-white shadow-xs">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h2 className={`text-base font-semibold ${theme === "dark" ? "text-white" : "text-slate-900"}`}>
                {BRAND_CONFIG.name} Security
              </h2>
              <p className={`text-xs ${theme === "dark" ? "text-slate-400" : "text-slate-500"}`}>
                Encrypted authentication & tenant isolation
              </p>
            </div>
          </div>
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
          {mode === "login" && (
            <div>
              <div className="mb-5">
                <h3 className={`text-lg font-bold ${theme === "dark" ? "text-white" : "text-slate-900"}`}>
                  Sign in to your publisher account
                </h3>
                <p className={`text-xs mt-1 ${theme === "dark" ? "text-slate-400" : "text-slate-500"}`}>
                  Access your private KDP research, cover projects, and keyword
                  tracking.
                </p>
              </div>

              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div>
                  <label className={`block text-xs font-medium mb-1 ${theme === "dark" ? "text-slate-300" : "text-slate-700"}`}>
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <input
                      id="login-email"
                      type="email"
                      required
                      placeholder="author@domain.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className={`w-full rounded-lg border py-2 pl-9 pr-3 text-sm focus:border-emerald-500 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 ${
                        theme === "dark"
                          ? "border-white/10 bg-white/5 text-white placeholder:text-slate-500"
                          : "border-slate-200 bg-white text-slate-900 placeholder:text-slate-400"
                      }`}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className={`block text-xs font-medium ${theme === "dark" ? "text-slate-300" : "text-slate-700"}`}>
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setError(null);
                        setMode("forgot");
                      }}
                      className="text-xs text-emerald-600 hover:text-emerald-500 font-medium cursor-pointer"
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
                      className={`w-full rounded-lg border py-2 pl-9 pr-3 text-sm focus:border-emerald-500 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 ${
                        theme === "dark"
                          ? "border-white/10 bg-white/5 text-white placeholder:text-slate-500"
                          : "border-slate-200 bg-white text-slate-900 placeholder:text-slate-400"
                      }`}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-lg bg-emerald-600 py-2.5 text-sm font-semibold text-white shadow-xs hover:bg-emerald-700 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 transition disabled:opacity-50 cursor-pointer"
                >
                  {loading ? "Authenticating..." : "Sign In"}
                </button>
              </form>

              <div className={`mt-5 text-center text-xs ${theme === "dark" ? "text-slate-400" : "text-slate-500"}`}>
                Don't have an account?{" "}
                <button
                  onClick={() => {
                    setError(null);
                    setMode("register");
                  }}
                  className="font-semibold text-emerald-600 hover:text-emerald-500 hover:underline cursor-pointer"
                >
                  Create free author account
                </button>
              </div>
            </div>
          )}

          {mode === "register" && (
            <div>
              <div className="mb-4">
                <h3 className={`text-lg font-bold ${theme === "dark" ? "text-white" : "text-slate-900"}`}>
                  Create your Publisher Account
                </h3>
                <p className={`text-xs mt-0.5 ${theme === "dark" ? "text-slate-400" : "text-slate-500"}`}>
                  Tailored for African and international self-publishers with
                  localized pricing.
                </p>
              </div>

              <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
                <div>
                  <label className={`block text-xs font-medium mb-1 ${theme === "dark" ? "text-slate-300" : "text-slate-700"}`}>
                    Full Name or Pen Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <input
                      id="register-name"
                      type="text"
                      required
                      placeholder="e.g. Babatunde Alabi"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      className={`w-full rounded-lg border py-2 pl-9 pr-3 text-sm focus:border-emerald-500 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 ${
                        theme === "dark"
                          ? "border-white/10 bg-white/5 text-white placeholder:text-slate-500"
                          : "border-slate-200 bg-white text-slate-900 placeholder:text-slate-400"
                      }`}
                    />
                  </div>
                </div>

                <div>
                  <label className={`block text-xs font-medium mb-1 ${theme === "dark" ? "text-slate-300" : "text-slate-700"}`}>
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <input
                      id="register-email"
                      type="email"
                      required
                      placeholder="you@domain.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className={`w-full rounded-lg border py-2 pl-9 pr-3 text-sm focus:border-emerald-500 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 ${
                        theme === "dark"
                          ? "border-white/10 bg-white/5 text-white placeholder:text-slate-500"
                          : "border-slate-200 bg-white text-slate-900 placeholder:text-slate-400"
                      }`}
                    />
                  </div>
                </div>

                <div>
                  <label className={`block text-xs font-medium mb-1 ${theme === "dark" ? "text-slate-300" : "text-slate-700"}`}>
                    Password (Min. 8 characters)
                  </label>
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
                      className={`w-full rounded-lg border py-2 pl-9 pr-3 text-sm focus:border-emerald-500 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 ${
                        theme === "dark"
                          ? "border-white/10 bg-white/5 text-white placeholder:text-slate-500"
                          : "border-slate-200 bg-white text-slate-900 placeholder:text-slate-400"
                      }`}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={`block text-xs font-medium mb-1 ${theme === "dark" ? "text-slate-300" : "text-slate-700"}`}>
                      Country
                    </label>
                    <div className="relative">
                      <Globe className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                      <select
                        id="register-country"
                        value={country}
                        onChange={handleCountryChange}
                        className={`w-full rounded-lg border py-2 pl-9 pr-3 text-xs focus:border-emerald-500 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 ${
                          theme === "dark"
                            ? "border-white/10 bg-slate-800 text-white"
                            : "border-slate-200 bg-white text-slate-900"
                        }`}
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
                    <label className={`block text-xs font-medium mb-1 ${theme === "dark" ? "text-slate-300" : "text-slate-700"}`}>
                      Billing Currency
                    </label>
                    <select
                      id="register-currency"
                      value={preferredCurrency}
                      onChange={(e) =>
                        setPreferredCurrency(e.target.value as "NGN" | "USD")
                      }
                      className={`w-full rounded-lg border py-2 px-3 text-xs focus:border-emerald-500 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 ${
                        theme === "dark"
                          ? "border-white/10 bg-slate-800 text-white"
                          : "border-slate-200 bg-white text-slate-900"
                      }`}
                    >
                      <option value="NGN">NGN (Nigerian Naira)</option>
                      <option value="USD">USD (US Dollar)</option>
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-2 rounded-lg bg-emerald-600 py-2.5 text-sm font-semibold text-white shadow-xs hover:bg-emerald-700 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 transition disabled:opacity-50 cursor-pointer"
                >
                  {loading ? "Creating Account..." : "Create Free Account"}
                </button>
              </form>

              <div className={`mt-4 text-center text-xs ${theme === "dark" ? "text-slate-400" : "text-slate-500"}`}>
                Already registered?{" "}
                <button
                  onClick={() => {
                    setError(null);
                    setMode("login");
                  }}
                  className="font-semibold text-emerald-600 hover:text-emerald-500 hover:underline cursor-pointer"
                >
                  Sign in here
                </button>
              </div>
            </div>
          )}

          {mode === "forgot" && (
            <div>
              <div className="mb-4">
                <h3 className={`text-lg font-bold ${theme === "dark" ? "text-white" : "text-slate-900"}`}>
                  Reset Your Password
                </h3>
                <p className={`text-xs mt-1 ${theme === "dark" ? "text-slate-400" : "text-slate-500"}`}>
                  Enter your email address and we'll issue a secure password
                  reset token.
                </p>
              </div>

              <form onSubmit={handleForgotSubmit} className="space-y-4">
                <div>
                  <label className={`block text-xs font-medium mb-1 ${theme === "dark" ? "text-slate-300" : "text-slate-700"}`}>
                    Registered Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <input
                      id="forgot-email"
                      type="email"
                      required
                      placeholder="author@domain.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className={`w-full rounded-lg border py-2 pl-9 pr-3 text-sm focus:border-emerald-500 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 ${
                        theme === "dark"
                          ? "border-white/10 bg-white/5 text-white placeholder:text-slate-500"
                          : "border-slate-200 bg-white text-slate-900 placeholder:text-slate-400"
                      }`}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-lg bg-emerald-600 py-2.5 text-sm font-semibold text-white shadow-xs hover:bg-emerald-700 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 transition disabled:opacity-50 cursor-pointer"
                >
                  {loading ? "Generating Token..." : "Send Reset Instructions"}
                </button>
              </form>

              <div className={`mt-4 text-center text-xs ${theme === "dark" ? "text-slate-400" : "text-slate-500"}`}>
                Remember your password?{" "}
                <button
                  onClick={() => setMode("login")}
                  className="font-semibold text-emerald-600 hover:text-emerald-500 hover:underline cursor-pointer"
                >
                  Return to sign in
                </button>
              </div>
            </div>
          )}

          {mode === "reset" && (
            <div>
              <div className="mb-4">
                <h3 className={`text-lg font-bold ${theme === "dark" ? "text-white" : "text-slate-900"}`}>
                  Set New Password
                </h3>
                <p className={`text-xs mt-1 ${theme === "dark" ? "text-slate-400" : "text-slate-500"}`}>
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
                  <label className={`block text-xs font-medium mb-1 ${theme === "dark" ? "text-slate-300" : "text-slate-700"}`}>
                    Reset Token
                  </label>
                  <div className="relative">
                    <KeyRound className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <input
                      id="reset-token"
                      type="text"
                      required
                      placeholder="Paste reset token here"
                      value={resetToken}
                      onChange={(e) => setResetToken(e.target.value)}
                      className={`w-full rounded-lg border py-2 pl-9 pr-3 text-xs font-mono focus:border-emerald-500 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 ${
                        theme === "dark"
                          ? "border-white/10 bg-white/5 text-white placeholder:text-slate-500"
                          : "border-slate-200 bg-white text-slate-900 placeholder:text-slate-400"
                      }`}
                    />
                  </div>
                </div>

                <div>
                  <label className={`block text-xs font-medium mb-1 ${theme === "dark" ? "text-slate-300" : "text-slate-700"}`}>
                    New Password (Min. 8 characters)
                  </label>
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
                      className={`w-full rounded-lg border py-2 pl-9 pr-3 text-sm focus:border-emerald-500 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 ${
                        theme === "dark"
                          ? "border-white/10 bg-white/5 text-white placeholder:text-slate-500"
                          : "border-slate-200 bg-white text-slate-900 placeholder:text-slate-400"
                      }`}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-lg bg-emerald-600 py-2.5 text-sm font-semibold text-white shadow-xs hover:bg-emerald-700 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 transition disabled:opacity-50 cursor-pointer"
                >
                  {loading ? "Updating Password..." : "Save New Password"}
                </button>
              </form>
            </div>
          )}

          {mode === "verify" && (
            <div>
              <div className="mb-4">
                <h3 className={`text-lg font-bold ${theme === "dark" ? "text-white" : "text-slate-900"}`}>
                  Verify Email Address
                </h3>
                <p className={`text-xs mt-1 ${theme === "dark" ? "text-slate-400" : "text-slate-500"}`}>
                  We sent a 6-digit confirmation code to your email.
                </p>
              </div>

              {verificationToken && (
                <div className="mb-3 rounded-lg border border-emerald-200 bg-emerald-50 p-2.5 text-xs text-emerald-800">
                  <span className="font-semibold">
                    Simulated Email Code (Dev Only):
                  </span>
                  <p className="mt-1 font-mono text-base font-bold tracking-widest break-all bg-white p-2 text-center rounded border border-emerald-100">
                    {verificationToken}
                  </p>
                </div>
              )}

              <form onSubmit={handleVerifySubmit} className="space-y-4">
                <div>
                  <label className={`block text-xs font-medium mb-1 ${theme === "dark" ? "text-slate-300" : "text-slate-700"}`}>
                    Verification Code
                  </label>
                  <div className="relative">
                    <KeyRound className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <input
                      id="verification-token-input"
                      type="text"
                      required
                      maxLength={6}
                      placeholder="123456"
                      value={verificationToken}
                      onChange={(e) => setVerificationToken(e.target.value)}
                      className={`w-full rounded-lg border py-2 text-center text-lg tracking-[0.5em] font-mono focus:border-emerald-500 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 ${
                        theme === "dark"
                          ? "border-white/10 bg-white/5 text-white placeholder:text-slate-500"
                          : "border-slate-200 bg-white text-slate-900 placeholder:text-slate-400"
                      }`}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-lg bg-emerald-600 py-2.5 text-sm font-semibold text-white shadow-xs hover:bg-emerald-700 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 transition disabled:opacity-50 cursor-pointer"
                >
                  {loading ? "Verifying..." : "Confirm Email"}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

