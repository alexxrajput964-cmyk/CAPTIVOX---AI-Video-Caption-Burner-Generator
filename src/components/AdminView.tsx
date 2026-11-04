import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  ShieldCheck,
  Users,
  Film,
  Zap,
  Clock,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  Search,
  UserCheck,
  UserX,
  RotateCcw,
  Trash2,
  ArrowRightLeft,
  Crown,
  Sparkles,
  Lock,
  Unlock,
  RefreshCw,
} from 'lucide-react';

interface AdminStats {
  totalUsers: number;
  totalProjects: number;
  totalExports: number;
  proUsers: number;
  blockedUsers: number;
  activeJobs: number;
  uptimeSeconds: number;
  whisperConfigured: boolean;
  geminiConfigured: boolean;
  monetization_mode: 'free' | 'paid';
}

interface AdminUserRecord {
  id: string;
  email: string;
  phone: string;
  full_name: string;
  tier: 'free' | 'pro' | 'business' | 'unlimited';
  is_admin: boolean;
  is_blocked: boolean;
  role?: 'owner' | 'admin' | 'user';
  exports_today: number;
  exports_today_date: string;
  created_at: string;
  totalProjects: number;
  totalExports: number;
}

interface AdminViewProps {
  onBackToDashboard: () => void;
}

export const AdminView: React.FC<AdminViewProps> = ({ onBackToDashboard }) => {
  const { user, settings, toggleMonetizationMode, showToast } = useAuth();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [userList, setUserList] = useState<AdminUserRecord[]>([]);
  const [recentExports, setRecentExports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'blocked'>('all');
  const [isTogglingMode, setIsTogglingMode] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/stats', {
        headers: {
          'x-user-id': user?.id || 'demo-user',
        },
      });
      if (res.ok) {
        const data = await res.json();
        setStats(data.stats);
        setUserList(data.users || []);
        setRecentExports(data.recentExports || []);
      }
    } catch (err) {
      console.warn('Failed to load admin stats', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, [user]);

  const handleToggleGlobalMode = async () => {
    if (isTogglingMode) return;
    setIsTogglingMode(true);
    const targetMode = stats?.monetization_mode === 'free' ? 'paid' : 'free';
    try {
      await toggleMonetizationMode(targetMode);
      await fetchAdminData();
    } catch (err: any) {
      showToast('Mode change error: ' + err.message);
    } finally {
      setIsTogglingMode(false);
    }
  };

  const handleToggleBlockUser = async (targetUser: AdminUserRecord) => {
    if (targetUser.role === 'owner' || targetUser.id === 'demo-user') {
      showToast('Cannot block Founder / Owner (Vineet Rajput)');
      return;
    }

    setActionLoadingId(targetUser.id);
    try {
      const res = await fetch(`/api/admin/users/${targetUser.id}/toggle-block`, {
        method: 'POST',
        headers: {
          'x-user-id': user?.id || 'demo-user',
        },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast(targetUser.is_blocked ? `✅ Allowed access for ${targetUser.full_name}` : `🚫 Blocked access for ${targetUser.full_name}`);
        setUserList((prev) =>
          prev.map((u) => (u.id === targetUser.id ? { ...u, is_blocked: !u.is_blocked } : u))
        );
      } else {
        showToast(data.error || 'Failed to update user access');
      }
    } catch (err: any) {
      showToast('Error: ' + err.message);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleChangeTier = async (targetId: string, newTier: 'free' | 'pro' | 'unlimited') => {
    setActionLoadingId(targetId);
    try {
      const res = await fetch(`/api/admin/users/${targetId}/tier`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user?.id || 'demo-user',
        },
        body: JSON.stringify({ tier: newTier }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast(`Updated tier to ${newTier.toUpperCase()}`);
        setUserList((prev) =>
          prev.map((u) => (u.id === targetId ? { ...u, tier: newTier } : u))
        );
      } else {
        showToast(data.error || 'Failed to update tier');
      }
    } catch (err: any) {
      showToast('Error: ' + err.message);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleResetExports = async (targetId: string, userName: string) => {
    setActionLoadingId(targetId);
    try {
      const res = await fetch(`/api/admin/users/${targetId}/reset-exports`, {
        method: 'POST',
        headers: {
          'x-user-id': user?.id || 'demo-user',
        },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast(`Reset daily export counter for ${userName}`);
        setUserList((prev) =>
          prev.map((u) => (u.id === targetId ? { ...u, exports_today: 0 } : u))
        );
      }
    } catch (err: any) {
      showToast('Error: ' + err.message);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDeleteUser = async (targetId: string, userName: string) => {
    if (!window.confirm(`Are you sure you want to delete user account "${userName}"?`)) return;

    setActionLoadingId(targetId);
    try {
      const res = await fetch(`/api/admin/users/${targetId}`, {
        method: 'DELETE',
        headers: {
          'x-user-id': user?.id || 'demo-user',
        },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast(`Removed user ${userName}`);
        setUserList((prev) => prev.filter((u) => u.id !== targetId));
      } else {
        showToast(data.error || 'Failed to delete user');
      }
    } catch (err: any) {
      showToast('Error: ' + err.message);
    } finally {
      setActionLoadingId(null);
    }
  };

  const isOwner = user?.role === 'owner' || user?.is_admin || user?.id === 'demo-user';

  if (!isOwner) {
    return (
      <div className="w-full min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 bg-[#0a0a0a] text-white">
        <div className="text-center max-w-md p-8 rounded-2xl bg-[#141416] border border-neutral-800">
          <AlertTriangle className="w-10 h-10 text-amber-400 mx-auto mb-3" />
          <h2 className="text-lg font-bold font-outfit text-white">Founder Access Required</h2>
          <p className="text-xs text-neutral-400 mt-2">
            This private data and operations console is strictly reserved for Owner Vineet Rajput.
          </p>
          <button
            onClick={onBackToDashboard}
            className="mt-5 px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-semibold cursor-pointer"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const isFreeMode = (stats?.monetization_mode || settings?.monetization_mode) === 'free';

  // Filtered users
  const filteredUsers = userList.filter((u) => {
    const matchesSearch =
      u.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.phone.includes(searchQuery);

    if (!matchesSearch) return false;
    if (statusFilter === 'active') return !u.is_blocked;
    if (statusFilter === 'blocked') return u.is_blocked;
    return true;
  });

  return (
    <div className="w-full min-h-[calc(100vh-4rem)] bg-[#0a0a0a] text-white py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-6">
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-neutral-800/80">
        <div className="flex items-center gap-3">
          <button
            onClick={onBackToDashboard}
            className="p-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white transition-colors cursor-pointer border border-neutral-800"
            title="Back to Dashboard"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <Crown className="w-5 h-5 text-amber-400" />
              <h1 className="text-2xl font-extrabold font-outfit text-white">
                Owner Control Center
              </h1>
              <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-bold font-mono">
                Vineet Rajput
              </span>
            </div>
            <p className="text-xs text-neutral-400 mt-0.5">
              1-Click Monetization Switch, Creator Access Permissions & Private User Records
            </p>
          </div>
        </div>

        <button
          onClick={fetchAdminData}
          disabled={loading}
          className="px-3 py-1.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-xs text-neutral-300 flex items-center gap-1.5 transition-colors cursor-pointer self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-neutral-400 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Data</span>
        </button>
      </div>

      {/* SECTION 1: 1-Click Free vs Paid Master Switch Banner */}
      <div
        className={`p-6 rounded-2xl border transition-all ${
          isFreeMode
            ? 'bg-gradient-to-r from-emerald-950/40 via-teal-950/20 to-neutral-950 border-emerald-500/40 shadow-lg shadow-emerald-500/5'
            : 'bg-gradient-to-r from-amber-950/40 via-orange-950/20 to-neutral-950 border-amber-500/40 shadow-lg shadow-amber-500/5'
        }`}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5">
              <span
                className={`w-3 h-3 rounded-full animate-ping ${
                  isFreeMode ? 'bg-emerald-400' : 'bg-amber-400'
                }`}
              />
              <span className="text-xs font-mono font-bold tracking-wider uppercase text-neutral-400">
                Global Platform Mode:
              </span>
              <span
                className={`px-3 py-0.5 rounded-full text-xs font-extrabold font-mono tracking-wide ${
                  isFreeMode
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                }`}
              >
                {isFreeMode ? '✨ 100% FREE LIFETIME' : '🔒 COMMERCIAL PAID MODE'}
              </span>
            </div>

            <h2 className="text-xl font-bold font-outfit text-white">
              {isFreeMode
                ? 'Free Mode Active: Sabhi creators ke liye zero watermarks aur unlimited exports.'
                : 'Paid Mode Active: Free users ko watermark aayega, aur paid plans activate hain.'}
            </h2>

            <p className="text-xs text-neutral-400 max-w-2xl leading-relaxed">
              {isFreeMode
                ? 'Platform is in open community mode. Anyone can export unlimited 1080p videos with no watermarks. To monetize or enforce subscriptions, click the toggle.'
                : 'Platform is in revenue mode. Free tier users get a daily quota limit of 3 exports and a safe-zone watermark. Paid tiers (Pro / Unlimited) get clean exports.'}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
            <button
              onClick={handleToggleGlobalMode}
              disabled={isTogglingMode}
              className={`px-5 py-3 rounded-xl font-black text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md ${
                isFreeMode
                  ? 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-amber-500/25 ring-1 ring-white/20'
                  : 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-emerald-500/25 ring-1 ring-white/20'
              }`}
            >
              <ArrowRightLeft className={`w-4 h-4 ${isTogglingMode ? 'animate-spin' : ''}`} />
              <span>
                {isTogglingMode
                  ? 'Switching...'
                  : isFreeMode
                  ? '⚡ 1-Click: Switch to PAID Mode'
                  : '⚡ 1-Click: Switch to 100% FREE'}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* SECTION 2: Platform KPI Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-[#141416] border border-neutral-800/80">
          <div className="text-neutral-400 text-xs flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-blue-400" />
            <span>Total Registered</span>
          </div>
          <div className="text-2xl font-black font-outfit text-white mt-1 tabular-nums">
            {stats?.totalUsers || 0}
          </div>
          <div className="text-[11px] text-neutral-500 mt-0.5">Creators in database</div>
        </div>

        <div className="p-4 rounded-xl bg-[#141416] border border-neutral-800/80">
          <div className="text-neutral-400 text-xs flex items-center gap-1.5">
            <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Active Users</span>
          </div>
          <div className="text-2xl font-black font-outfit text-emerald-400 mt-1 tabular-nums">
            {(stats?.totalUsers || 0) - (stats?.blockedUsers || 0)}
          </div>
          <div className="text-[11px] text-emerald-500/80 mt-0.5">Allowed full access</div>
        </div>

        <div className="p-4 rounded-xl bg-[#141416] border border-neutral-800/80">
          <div className="text-neutral-400 text-xs flex items-center gap-1.5">
            <UserX className="w-3.5 h-3.5 text-rose-400" />
            <span>Blocked / Suspended</span>
          </div>
          <div className="text-2xl font-black font-outfit text-rose-400 mt-1 tabular-nums">
            {stats?.blockedUsers || 0}
          </div>
          <div className="text-[11px] text-rose-500/80 mt-0.5">Access disabled by you</div>
        </div>

        <div className="p-4 rounded-xl bg-[#141416] border border-neutral-800/80">
          <div className="text-neutral-400 text-xs flex items-center gap-1.5">
            <Film className="w-3.5 h-3.5 text-[#ff8c1a]" />
            <span>Total Exports</span>
          </div>
          <div className="text-2xl font-black font-outfit text-white mt-1 tabular-nums">
            {stats?.totalExports || 0}
          </div>
          <div className="text-[11px] text-neutral-500 mt-0.5">MP4 videos burned</div>
        </div>
      </div>

      {/* SECTION 3: Private User Data Management ("Kisko chalana hai aur kisko nahi") */}
      <div className="p-6 rounded-2xl bg-[#141416] border border-neutral-800/90 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold font-outfit text-white flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-400" />
              <span>User Directory & Permissions Control</span>
            </h2>
            <p className="text-xs text-neutral-400 mt-0.5">
              Private records for Vineet Rajput: 1-click Block/Allow users, modify tiers, and reset export limits.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Search Input */}
            <div className="relative min-w-[200px]">
              <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search name, email, phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-neutral-900 border border-neutral-800 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-neutral-600"
              />
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1 bg-neutral-900 p-1 rounded-xl border border-neutral-800 text-xs">
              <button
                onClick={() => setStatusFilter('all')}
                className={`px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                  statusFilter === 'all' ? 'bg-neutral-800 text-white' : 'text-neutral-400 hover:text-white'
                }`}
              >
                All ({userList.length})
              </button>
              <button
                onClick={() => setStatusFilter('active')}
                className={`px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                  statusFilter === 'active' ? 'bg-neutral-800 text-emerald-400' : 'text-neutral-400 hover:text-white'
                }`}
              >
                Active ({userList.filter((u) => !u.is_blocked).length})
              </button>
              <button
                onClick={() => setStatusFilter('blocked')}
                className={`px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                  statusFilter === 'blocked' ? 'bg-neutral-800 text-rose-400' : 'text-neutral-400 hover:text-white'
                }`}
              >
                Blocked ({userList.filter((u) => u.is_blocked).length})
              </button>
            </div>
          </div>
        </div>

        {/* User Data Table */}
        <div className="overflow-x-auto border border-neutral-800/80 rounded-xl">
          <table className="w-full text-left text-xs">
            <thead className="bg-neutral-900/80 text-neutral-400 font-semibold border-b border-neutral-800">
              <tr>
                <th className="py-3 px-4">Creator / Contact</th>
                <th className="py-3 px-3">Role</th>
                <th className="py-3 px-3">Tier Plan</th>
                <th className="py-3 px-3">Today's Exports</th>
                <th className="py-3 px-3">Access Status</th>
                <th className="py-3 px-4 text-right">Owner Control Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/60">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-neutral-500 text-xs">
                    No users found matching your search.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const isUserOwner = u.role === 'owner' || u.id === 'demo-user';
                  const isUserLoading = actionLoadingId === u.id;

                  return (
                    <tr
                      key={u.id}
                      className={`hover:bg-neutral-900/40 transition-colors ${
                        u.is_blocked ? 'bg-rose-950/10' : ''
                      }`}
                    >
                      {/* Name & Contact */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs ${
                              isUserOwner
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                : u.is_blocked
                                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                                : 'bg-neutral-800 text-neutral-300'
                            }`}
                          >
                            {u.full_name?.charAt(0) || 'U'}
                          </div>
                          <div>
                            <div className="font-semibold text-white flex items-center gap-1.5">
                              <span>{u.full_name}</span>
                              {isUserOwner && (
                                <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 text-[9px] font-bold">
                                  Owner
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-neutral-400 font-mono">
                              {u.phone} · {u.email}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Role */}
                      <td className="py-3 px-3">
                        <span className="font-mono text-[11px] text-neutral-400 capitalize">
                          {u.role || (u.is_admin ? 'Admin' : 'Creator')}
                        </span>
                      </td>

                      {/* Tier with 1-Click Dropdown */}
                      <td className="py-3 px-3">
                        {isUserOwner ? (
                          <span className="px-2 py-0.5 rounded bg-yellow-950/80 text-yellow-300 border border-yellow-800 text-[10px] font-bold uppercase font-mono">
                            UNLIMITED
                          </span>
                        ) : (
                          <select
                            value={u.tier}
                            onChange={(e) => handleChangeTier(u.id, e.target.value as any)}
                            disabled={isUserLoading}
                            className="bg-neutral-900 border border-neutral-700 text-neutral-200 text-xs rounded-lg px-2 py-1 font-mono focus:outline-none focus:border-neutral-500 cursor-pointer"
                          >
                            <option value="free">Free</option>
                            <option value="pro">Pro</option>
                            <option value="unlimited">Unlimited</option>
                          </select>
                        )}
                      </td>

                      {/* Today's Exports */}
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-semibold text-white">
                            {u.exports_today}
                          </span>
                          {!isUserOwner && u.exports_today > 0 && (
                            <button
                              onClick={() => handleResetExports(u.id, u.full_name)}
                              disabled={isUserLoading}
                              className="text-[10px] text-neutral-500 hover:text-amber-400 transition-colors cursor-pointer"
                              title="Reset export count to 0"
                            >
                              Reset
                            </button>
                          )}
                        </div>
                      </td>

                      {/* Access Status (Allowed or Blocked) */}
                      <td className="py-3 px-3">
                        {isUserOwner ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-400 font-mono">
                            <ShieldCheck className="w-3.5 h-3.5" />
                            Permanent
                          </span>
                        ) : u.is_blocked ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30 text-[10px] font-bold font-mono">
                            <Lock className="w-3 h-3" />
                            Blocked (Stopped)
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold font-mono">
                            <Unlock className="w-3 h-3" />
                            Active (Allowed)
                          </span>
                        )}
                      </td>

                      {/* Owner Control Actions ("Kisko chalana hai aur kisko nahi") */}
                      <td className="py-3 px-4 text-right">
                        {isUserOwner ? (
                          <span className="text-[11px] text-neutral-500 font-mono">Protected</span>
                        ) : (
                          <div className="flex items-center justify-end gap-1.5">
                            {/* 1-Click Allow / Block Toggle */}
                            <button
                              onClick={() => handleToggleBlockUser(u)}
                              disabled={isUserLoading}
                              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                                u.is_blocked
                                  ? 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40'
                                  : 'bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40'
                              }`}
                              title={
                                u.is_blocked
                                  ? 'Click to Unblock: Allow this user to generate & export subtitles'
                                  : 'Click to Block: Stop this user from generating & exporting subtitles'
                              }
                            >
                              {u.is_blocked ? (
                                <>
                                  <Unlock className="w-3 h-3" />
                                  <span>Allow</span>
                                </>
                              ) : (
                                <>
                                  <Lock className="w-3 h-3" />
                                  <span>Block</span>
                                </>
                              )}
                            </button>

                            {/* Delete User */}
                            <button
                              onClick={() => handleDeleteUser(u.id, u.full_name)}
                              disabled={isUserLoading}
                              className="p-1 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-400 hover:text-rose-400 transition-colors cursor-pointer"
                              title="Delete user account"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* SECTION 4: Recent Export Jobs Log */}
      <div className="p-6 rounded-2xl bg-[#141416] border border-neutral-800/90 space-y-3">
        <h2 className="text-base font-bold font-outfit text-white flex items-center gap-2">
          <Film className="w-4 h-4 text-[#ff3d5a]" />
          <span>Recent Burnt Video Export Activity</span>
        </h2>

        <div className="divide-y divide-neutral-800/80">
          {recentExports.length === 0 ? (
            <div className="text-center py-6 text-neutral-500 text-xs">
              No exports completed yet.
            </div>
          ) : (
            recentExports.map((exp) => (
              <div key={exp.id} className="py-2.5 flex items-center justify-between text-xs">
                <div>
                  <div className="font-semibold text-white truncate max-w-[240px]">
                    {exp.project_title}
                  </div>
                  <div className="text-neutral-500 text-[11px]">
                    User: {exp.user_id} · {new Date(exp.created_at).toLocaleTimeString()} · {exp.duration}s
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs px-2 py-0.5 rounded bg-neutral-900 border border-neutral-800 text-neutral-300">
                    {exp.format.toUpperCase()}
                  </span>
                  {exp.has_watermark ? (
                    <span className="text-[10px] text-neutral-400 font-mono">Watermarked</span>
                  ) : (
                    <span className="text-[10px] text-emerald-400 font-bold font-mono">Clean Pro</span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
