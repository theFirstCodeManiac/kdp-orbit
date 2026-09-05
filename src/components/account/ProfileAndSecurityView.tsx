import React, { useState } from "react";
import { useAuth } from "@/src/context/AuthContext.tsx";
import {
  User,
  Shield,
  KeyRound,
  Laptop,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Globe,
  Lock,
  RefreshCw,
  Clock,
  ShieldAlert,
  Fingerprint,
} from "lucide-react";

export const ProfileAndSecurityView: React.FC = () => {
  const {
    user,
    sessions,
    updateProfile,
    updatePassword,
    terminateSession,
    deleteAccount,
    testCrossTenantIsolation,
    refreshUserData,
  } = useAuth();

  // Profile edit state
  const [displayName, setDisplayName] = useState(user?.displayName || "");
  const [country, setCountry] = useState(user?.country || "NG");
  const [preferredCurrency, setPreferredCurrency] = useState<"NGN" | "USD">(
    user?.preferredCurrency === "NGN" ? "NGN" : "USD",
  );
  const [profileMessage, setProfileMessage] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileSaving, setProfileSaving] = useState(false);

  // Password state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSaving, setPasswordSaving] = useState(false);

  // Authorization test state
  const [targetUserId, setTargetUserId] = useState("usr_demo_global_02");
  const [testResult, setTestResult] = useState<any>(null);
  const [testLoading, setTestLoading] = useState(false);

  // Delete account state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteConfirmPassword, setDeleteConfirmPassword] = useState("");
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  if (!user) {
    return (
      <div className="p-8 text-center">
        <p className="text-sm text-slate-500">
          Please sign in to manage your account and security settings.
        </p>
      </div>
    );
  }

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSaving(true);
    setProfileError(null);
    setProfileMessage(null);
    const res = await updateProfile({
      displayName,
      country,
      preferredCurrency,
    });
    setProfileSaving(false);
    if (res.success) {
      setProfileMessage("Profile settings saved successfully.");
      setTimeout(() => setProfileMessage(null), 3000);
    } else {
      setProfileError(res.error || "Failed to update profile.");
    }
  };

  const handlePasswordSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords do not match.");
      return;
    }
    setPasswordSaving(true);
    setPasswordError(null);
    setPasswordMessage(null);
    const res = await updatePassword(currentPassword, newPassword);
    setPasswordSaving(false);
    if (res.success) {
      setPasswordMessage("Password updated successfully.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => setPasswordMessage(null), 3000);
    } else {
      setPasswordError(res.error || "Failed to update password.");
    }
  };

  const handleTerminateSession = async (sessionId: string) => {
    await terminateSession(sessionId);
    refreshUserData();
  };

  const runAuthorizationAuditTest = async () => {
    setTestLoading(true);
    const result = await testCrossTenantIsolation(targetUserId);
    setTestResult(result);
    setTestLoading(false);
  };

  const handleDeleteAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setDeleteLoading(true);
    setDeleteError(null);
    const res = await deleteAccount(deleteConfirmPassword);
    setDeleteLoading(false);
    if (!res.success) {
      setDeleteError(res.error || "Account deletion failed.");
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-16">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Account & Security Center
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Manage your author credentials, localized billing currency, active
          device sessions, and tenant isolation policies.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Profile & Password */}
        <div className="lg:col-span-2 space-y-6">
          {/* Card 1: Profile Details */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-5">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                  <User className="h-4 w-4" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-slate-900">
                    Profile Information
                  </h2>
                  <p className="text-xs text-slate-500">
                    Your publishing name and regional preferences
                  </p>
                </div>
              </div>
              <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
                <Fingerprint className="h-3 w-3" /> ID: {user.id}
              </span>
            </div>

            {profileError && (
              <div className="mb-4 flex items-center gap-2 rounded-lg bg-rose-50 p-3 text-xs text-rose-700">
                <AlertTriangle className="h-4 w-4 shrink-0 text-rose-500" />
                {profileError}
              </div>
            )}
            {profileMessage && (
              <div className="mb-4 flex items-center gap-2 rounded-lg bg-emerald-50 p-3 text-xs text-emerald-700">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                {profileMessage}
              </div>
            )}

            <form onSubmit={handleProfileSave} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Display / Pen Name
                  </label>
                  <input
                    id="profile-name-input"
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-white py-2 px-3 text-sm text-slate-900 focus:border-emerald-500 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    disabled
                    value={user.email}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 px-3 text-sm text-slate-500 cursor-not-allowed"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Region / Country
                  </label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <select
                      id="profile-country-select"
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-slate-900 focus:border-emerald-500 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20"
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
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Preferred Currency
                  </label>
                  <select
                    id="profile-currency-select"
                    value={preferredCurrency}
                    onChange={(e) =>
                      setPreferredCurrency(e.target.value as "NGN" | "USD")
                    }
                    className="w-full rounded-lg border border-slate-200 bg-white py-2 px-3 text-sm text-slate-900 focus:border-emerald-500 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20"
                  >
                    <option value="NGN">NGN (Nigerian Naira)</option>
                    <option value="USD">USD (United States Dollar)</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={profileSaving}
                  className="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-700 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 transition disabled:opacity-50"
                >
                  {profileSaving ? "Saving..." : "Save Profile Changes"}
                </button>
              </div>
            </form>
          </div>

          {/* Card 2: Password Management */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs">
            <div className="flex items-center gap-2.5 border-b border-slate-100 pb-4 mb-5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
                <KeyRound className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-slate-900">
                  Change Password
                </h2>
                <p className="text-xs text-slate-500">
                  Passwords are hashed with bcrypt (salt rounds: 10) and never
                  stored plaintext.
                </p>
              </div>
            </div>

            {passwordError && (
              <div className="mb-4 flex items-center gap-2 rounded-lg bg-rose-50 p-3 text-xs text-rose-700">
                <AlertTriangle className="h-4 w-4 shrink-0 text-rose-500" />
                {passwordError}
              </div>
            )}
            {passwordMessage && (
              <div className="mb-4 flex items-center gap-2 rounded-lg bg-emerald-50 p-3 text-xs text-emerald-700">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                {passwordMessage}
              </div>
            )}

            <form onSubmit={handlePasswordSave} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Current Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <input
                    id="current-password-input"
                    type="password"
                    required
                    placeholder="••••••••"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    New Password (Min. 8 chars)
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <input
                      id="new-password-input"
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

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <input
                      id="confirm-password-input"
                      type="password"
                      required
                      minLength={8}
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={passwordSaving}
                  className="rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800 focus:outline-hidden focus:ring-2 focus:ring-slate-900/20 transition disabled:opacity-50"
                >
                  {passwordSaving ? "Updating..." : "Update Password"}
                </button>
              </div>
            </form>
          </div>

          {/* Card 3: Active Device Sessions */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-50 text-sky-600">
                  <Laptop className="h-4 w-4" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-slate-900">
                    Active Device Sessions
                  </h2>
                  <p className="text-xs text-slate-500">
                    Devices currently authorized with active cryptographically
                    signed JWT sessions.
                  </p>
                </div>
              </div>
              <button
                onClick={refreshUserData}
                className="flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50 transition"
              >
                <RefreshCw className="h-3 w-3" /> Refresh
              </button>
            </div>

            <div className="space-y-3">
              {sessions.map((ses) => (
                <div
                  key={ses.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-lg border border-slate-100 bg-slate-50/70 p-3.5"
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 rounded-md bg-white p-2 text-slate-600 border border-slate-200 shadow-2xs">
                      <Laptop className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-slate-900">
                          {ses.userAgent.slice(0, 45)}...
                        </span>
                        {ses.isCurrent && (
                          <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-800">
                            Current Session
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500 mt-1">
                        <span>IP: {ses.ipAddress}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" /> Last active:{" "}
                          {new Date(ses.lastActiveAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                    </div>
                  </div>

                  {!ses.isCurrent && (
                    <button
                      onClick={() => handleTerminateSession(ses.id)}
                      className="self-end sm:self-center rounded-md border border-rose-200 px-2.5 py-1 text-xs font-medium text-rose-600 hover:bg-rose-50 transition"
                    >
                      Revoke Device
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Security Audits & Multi-Tenant Isolation Verification */}
        <div className="space-y-6">
          {/* Multi-Tenant Server-Side Authorization Sandbox */}
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/40 p-6 shadow-xs">
            <div className="flex items-center gap-2.5 border-b border-emerald-100 pb-3 mb-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600 text-white">
                <Shield className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Server-Side Authorization Audit
                </h3>
                <p className="text-[11px] text-emerald-800">
                  Direct proof of cross-tenant isolation
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed mb-3">
              Per strict security requirements, User A must{" "}
              <span className="font-semibold text-slate-900">NEVER</span> be
              allowed to access User B's saved research, covers, billing, or
              private data.
            </p>

            <div className="rounded-lg bg-white p-3 border border-emerald-200/80 mb-3 space-y-2">
              <div className="text-[11px] font-medium text-slate-500">
                Your User ID:
              </div>
              <div className="font-mono text-xs font-semibold text-slate-800 bg-slate-50 p-1.5 rounded border border-slate-100">
                {user.id} ({user.displayName})
              </div>

              <div className="text-[11px] font-medium text-slate-500 mt-2">
                Target Foreign User to Probe:
              </div>
              <input
                id="target-user-probe-input"
                type="text"
                value={targetUserId}
                onChange={(e) => setTargetUserId(e.target.value)}
                className="w-full font-mono text-xs text-slate-800 bg-slate-50 p-1.5 rounded border border-slate-200 focus:border-emerald-500 focus:outline-hidden"
              />
              <span className="text-[10px] text-slate-400">
                Default:{" "}
                <code className="text-emerald-700">usr_demo_global_02</code>{" "}
                (Sarah Jenkins' Private Account)
              </span>
            </div>

            <button
              id="run-isolation-audit-btn"
              onClick={runAuthorizationAuditTest}
              disabled={testLoading}
              className="w-full flex items-center justify-center gap-2 rounded-lg bg-emerald-700 py-2 px-3 text-xs font-semibold text-white shadow-2xs hover:bg-emerald-800 transition disabled:opacity-50"
            >
              <ShieldAlert className="h-3.5 w-3.5" />
              {testLoading
                ? "Testing Server Protection..."
                : "Simulate Cross-User Access"}
            </button>

            {testResult && (
              <div className="mt-4 space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-slate-700">
                    Server Response Status:
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold ${
                      testResult.status === 403
                        ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                        : testResult.status === 200
                          ? "bg-amber-100 text-amber-800"
                          : "bg-rose-100 text-rose-800"
                    }`}
                  >
                    HTTP {testResult.status}{" "}
                    {testResult.statusText ||
                      (testResult.status === 403 ? "Forbidden" : "")}
                  </span>
                </div>

                <div className="rounded-lg bg-slate-900 p-3 text-[11px] font-mono text-emerald-400 overflow-x-auto max-h-44">
                  <pre>{JSON.stringify(testResult.data, null, 2)}</pre>
                </div>

                {testResult.status === 403 && (
                  <div className="flex items-start gap-2 text-[11px] text-emerald-800 bg-emerald-100/70 p-2.5 rounded-lg border border-emerald-200">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-700 mt-0.5" />
                    <span>
                      <strong>Authorization Test Passed:</strong> Express
                      middleware successfully intercepted unauthorized tenant
                      query and rejected access with HTTP 403 before any private
                      research was exposed.
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Account Danger Zone */}
          <div className="rounded-xl border border-rose-200 bg-rose-50/40 p-6 shadow-xs">
            <div className="flex items-center gap-2.5 border-b border-rose-100 pb-3 mb-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-100 text-rose-600">
                <Trash2 className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Danger Zone
                </h3>
                <p className="text-[11px] text-rose-700">
                  Permanent account & data eradication
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed mb-4">
              Deleting your account permanently destroys your credentials,
              active sessions, saved research projects, custom book covers, and
              billing histories. This action cannot be undone.
            </p>

            <button
              id="open-delete-account-btn"
              onClick={() => setDeleteModalOpen(true)}
              className="w-full rounded-lg border border-rose-300 bg-white py-2 px-3 text-xs font-semibold text-rose-700 hover:bg-rose-50 hover:border-rose-400 transition"
            >
              Delete Account & All Data
            </button>
          </div>
        </div>
      </div>

      {/* Delete Account Modal */}
      {deleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl border border-rose-200 bg-white p-6 shadow-2xl">
            <div className="flex items-center gap-3 text-rose-600 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-rose-100">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Confirm Account Deletion
                </h3>
                <p className="text-xs text-slate-500">
                  This action is irreversible
                </p>
              </div>
            </div>

            {deleteError && (
              <div className="mb-4 rounded-lg bg-rose-50 p-2.5 text-xs text-rose-700 border border-rose-200">
                {deleteError}
              </div>
            )}

            <form onSubmit={handleDeleteAccount} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Enter your password to confirm permanent deletion:
                </label>
                <input
                  id="delete-account-password-input"
                  type="password"
                  required
                  placeholder="••••••••"
                  value={deleteConfirmPassword}
                  onChange={(e) => setDeleteConfirmPassword(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white py-2 px-3 text-sm text-slate-900 focus:border-rose-500 focus:outline-hidden focus:ring-2 focus:ring-rose-500/20"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setDeleteModalOpen(false)}
                  className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={deleteLoading}
                  className="rounded-lg bg-rose-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-rose-700 disabled:opacity-50"
                >
                  {deleteLoading ? "Deleting..." : "Permanently Delete"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
