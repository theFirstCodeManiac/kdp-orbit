import React, { useState, useEffect } from 'react';
import { ShieldAlert, Users, Database, Activity, FileText, Settings, Shield, Settings2, Trash2 } from 'lucide-react';
import { useAuth } from '@/src/context/AuthContext';

export const AdminDashboardView: React.FC = () => {
  const { user } = useAuth();
  const [activeSubTab, setActiveSubTab] = useState<'overview' | 'users' | 'audit'>('overview');
  const [stats, setStats] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchData();
    }
  }, [user, activeSubTab]);

  const fetchData = async () => {
    setIsLoading(true);
    const token = localStorage.getItem('token');
    const headers = { Authorization: `Bearer ${token}` };

    try {
      if (activeSubTab === 'overview') {
        const res = await fetch('/api/admin/stats', { headers });
        const data = await res.json();
        if (data.success) setStats(data.data);
      } else if (activeSubTab === 'users') {
        const res = await fetch('/api/admin/users', { headers });
        const data = await res.json();
        if (data.success) setUsers(data.data.users);
      } else if (activeSubTab === 'audit') {
        const res = await fetch('/api/admin/audit-logs', { headers });
        const data = await res.json();
        if (data.success) setAuditLogs(data.data.logs);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const grantAccess = async (userId: string, action: string) => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`/api/admin/users/${userId}/subscription`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ action, days: 30 })
      });
      if (res.ok) {
        alert('Action successful');
        fetchData();
      }
    } catch (e) {
      alert('Action failed');
    }
  };

  if (user?.role !== 'admin') {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <ShieldAlert className="h-16 w-16 text-rose-500 mb-4" />
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Access Denied</h2>
        <p className="text-slate-500">You do not have permission to view this page.</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto animate-in fade-in duration-500">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 rounded-xl bg-indigo-100 text-indigo-700">
          <Shield className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">System Administration</h1>
          <p className="text-slate-500">Manage users, subscriptions, and system settings securely.</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200 mb-6">
        <button
          onClick={() => setActiveSubTab('overview')}
          className={`pb-3 px-4 text-sm font-medium border-b-2 transition-colors ${
            activeSubTab === 'overview' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4" /> Overview
          </div>
        </button>
        <button
          onClick={() => setActiveSubTab('users')}
          className={`pb-3 px-4 text-sm font-medium border-b-2 transition-colors ${
            activeSubTab === 'users' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4" /> User Management
          </div>
        </button>
        <button
          onClick={() => setActiveSubTab('audit')}
          className={`pb-3 px-4 text-sm font-medium border-b-2 transition-colors ${
            activeSubTab === 'audit' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4" /> Audit Logs
          </div>
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      ) : (
        <div className="space-y-6">
          {activeSubTab === 'overview' && stats && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <div className="flex items-center gap-3 mb-2 text-slate-500">
                  <Users className="w-5 h-5 text-blue-500" />
                  <span className="font-medium">Total Users</span>
                </div>
                <div className="text-3xl font-bold text-slate-900">{stats.metrics.totalUsers}</div>
              </div>
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <div className="flex items-center gap-3 mb-2 text-slate-500">
                  <Database className="w-5 h-5 text-emerald-500" />
                  <span className="font-medium">Active Subscriptions</span>
                </div>
                <div className="text-3xl font-bold text-slate-900">{stats.metrics.activeSubscriptions}</div>
              </div>
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <div className="flex items-center gap-3 mb-2 text-slate-500">
                  <Activity className="w-5 h-5 text-amber-500" />
                  <span className="font-medium">System Health</span>
                </div>
                <div className="text-3xl font-bold text-emerald-600">Optimal</div>
              </div>
              
              <div className="md:col-span-3 mt-4">
                <h3 className="text-lg font-bold text-slate-900 mb-4">Recent Registrations</h3>
                <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                      <tr>
                        <th className="p-4 font-medium">Name</th>
                        <th className="p-4 font-medium">Email</th>
                        <th className="p-4 font-medium">Country</th>
                        <th className="p-4 font-medium">Joined</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {stats.recentUsers.map((u: any) => (
                        <tr key={u.id} className="hover:bg-slate-50">
                          <td className="p-4 font-medium text-slate-900">{u.displayName}</td>
                          <td className="p-4 text-slate-600">{u.email}</td>
                          <td className="p-4 text-slate-600">{u.country}</td>
                          <td className="p-4 text-slate-600">{new Date(u.createdAt).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeSubTab === 'users' && (
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                  <tr>
                    <th className="p-4 font-medium">User</th>
                    <th className="p-4 font-medium">Plan</th>
                    <th className="p-4 font-medium">Status</th>
                    <th className="p-4 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {users.map((u: any) => (
                    <tr key={u.id} className="hover:bg-slate-50">
                      <td className="p-4">
                        <div className="font-medium text-slate-900">{u.displayName}</div>
                        <div className="text-xs text-slate-500">{u.email}</div>
                        <div className="text-xs font-mono text-slate-400 mt-1">{u.id}</div>
                      </td>
                      <td className="p-4">
                        <span className="inline-block px-2 py-1 bg-slate-100 text-slate-700 rounded text-xs font-semibold">
                          {u.billing?.planId || 'None'}
                        </span>
                        {u.billing?.lifetimeAccess && (
                          <span className="inline-block ml-2 px-2 py-1 bg-amber-100 text-amber-800 rounded text-xs font-bold">LIFETIME</span>
                        )}
                        {u.billing?.earlyAccessExpiresAt && new Date(u.billing.earlyAccessExpiresAt) > new Date() && (
                          <span className="inline-block ml-2 px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs font-bold">EARLY ACCESS</span>
                        )}
                      </td>
                      <td className="p-4">
                        <span className="inline-flex items-center gap-1 text-emerald-600 text-xs font-medium">
                          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div> Active
                        </span>
                      </td>
                      <td className="p-4 text-right space-x-2">
                        <button
                          onClick={() => grantAccess(u.id, 'grant_early_access')}
                          className="px-3 py-1.5 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded text-xs font-medium transition"
                        >
                          +30 Days Premium
                        </button>
                        <button
                          onClick={() => grantAccess(u.id, 'grant_lifetime')}
                          className="px-3 py-1.5 bg-amber-50 text-amber-700 hover:bg-amber-100 rounded text-xs font-medium transition"
                        >
                          Lifetime
                        </button>
                        <button
                          onClick={() => grantAccess(u.id, 'revoke_access')}
                          className="px-3 py-1.5 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded text-xs font-medium transition"
                        >
                          Revoke
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeSubTab === 'audit' && (
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                  <tr>
                    <th className="p-4 font-medium">Date & Time</th>
                    <th className="p-4 font-medium">User</th>
                    <th className="p-4 font-medium">Action</th>
                    <th className="p-4 font-medium">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {auditLogs.length > 0 ? auditLogs.map((log: any, idx: number) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="p-4 text-slate-500 whitespace-nowrap">{new Date(log.date).toLocaleString()}</td>
                      <td className="p-4 font-medium text-slate-900">{log.userEmail}</td>
                      <td className="p-4">
                        <span className="px-2 py-1 bg-slate-100 rounded text-xs font-mono font-medium text-slate-700">
                          {log.action}
                        </span>
                      </td>
                      <td className="p-4 text-slate-600">{log.details}</td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={4} className="p-8 text-center text-slate-500">No audit logs found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
