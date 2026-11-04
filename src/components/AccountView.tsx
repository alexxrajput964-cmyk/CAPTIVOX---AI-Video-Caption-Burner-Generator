import React from 'react';
import { useAuth } from '../context/AuthContext';
import { TIER_LIMITS } from '../lib/templates';
import {
  User,
  Crown,
  Shield,
  LogOut,
  Sparkles,
  Zap,
  CheckCircle2,
  Calendar,
  Phone,
  Mail,
} from 'lucide-react';

interface AccountViewProps {
  onBackToDashboard: () => void;
}

export const AccountView: React.FC<AccountViewProps> = ({ onBackToDashboard }) => {
  const { user, logout, setIsUpgradeModalOpen, setIsAuthModalOpen } = useAuth();
  const currentPlan = TIER_LIMITS[user?.tier || 'free'];

  return (
    <div className="w-full min-h-[calc(100vh-4rem)] bg-[#0a0a0a] text-white py-10 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between pb-6 border-b border-neutral-900 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold font-outfit text-white">
            Creator Profile & Plan
          </h1>
          <p className="text-xs sm:text-sm text-neutral-400 mt-1">
            Manage your subscription, daily burning quota and account details
          </p>
        </div>

        <button
          onClick={logout}
          className="px-3.5 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 hover:text-red-400 text-xs font-medium flex items-center gap-1.5 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* User Card */}
        <div className="md:col-span-1 p-6 rounded-2xl bg-[#141416] border border-neutral-800 flex flex-col justify-between">
          <div>
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#ff3d5a] to-[#ff8c1a] flex items-center justify-center font-bold text-xl text-white shadow-lg shadow-[#ff3d5a]/20 mb-4">
              {user?.full_name?.charAt(0) || 'C'}
            </div>

            <h2 className="text-lg font-bold font-outfit text-white">{user?.full_name}</h2>
            <div className="mt-3 space-y-2 text-xs text-neutral-400">
              <div className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-neutral-500" />
                <span>+91 {user?.phone}</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-neutral-500" />
                <span className="truncate">{user?.email}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-3.5 h-3.5 text-neutral-500" />
                <span>Active Member</span>
              </div>
            </div>

            {user?.is_admin && (
              <div className="mt-4 p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-800/60 text-emerald-300 text-xs flex items-center gap-2">
                <Shield className="w-4 h-4 text-emerald-400" />
                <span className="font-semibold">Master Admin Access</span>
              </div>
            )}
          </div>

          <button
            onClick={() => setIsAuthModalOpen(true)}
            className="mt-6 w-full py-2 px-3 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 text-xs font-medium transition-colors"
          >
            Switch Account / Login
          </button>
        </div>

        {/* Current Tier & Quota Card */}
        <div className="md:col-span-2 p-6 rounded-2xl bg-[#141416] border border-neutral-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Crown className="w-5 h-5 text-[#ff8c1a]" />
                <h3 className="text-lg font-bold font-outfit text-white">Current Plan: {currentPlan.name}</h3>
              </div>

              <span className="px-2.5 py-1 rounded-md bg-[#ff8c1a]/20 text-[#ff8c1a] border border-[#ff8c1a]/30 text-xs font-bold uppercase tracking-wider">
                {user?.tier?.toUpperCase()}
              </span>
            </div>

            {/* Daily Quota Progress Bar */}
            <div className="p-4 rounded-xl bg-neutral-900 border border-neutral-800 mb-6">
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="text-neutral-400">Daily Video Exports Today</span>
                <span className="font-mono font-bold text-white">
                  {user?.exports_today || 0} / {currentPlan.dailyExports === 99999 ? '∞' : currentPlan.dailyExports}
                </span>
              </div>
              <div className="w-full bg-neutral-800 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-gradient-to-r from-[#ff3d5a] to-[#ff8c1a] h-full"
                  style={{
                    width: `${Math.min(
                      100,
                      ((user?.exports_today || 0) / (currentPlan.dailyExports === 99999 ? 100 : currentPlan.dailyExports)) * 100
                    )}%`,
                  }}
                />
              </div>
              <div className="text-[11px] text-neutral-500 mt-2 flex items-center justify-between">
                <span>Resets daily at 00:00 IST</span>
                <span>Max video length: {currentPlan.maxVideoDurationMin} min</span>
              </div>
            </div>

            {/* Plan Features */}
            <div className="space-y-2 text-xs text-neutral-300">
              {currentPlan.features.map((feat, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{feat}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-8 pt-4 border-t border-neutral-800/80 flex items-center justify-between">
            <div>
              <div className="text-xs text-emerald-400 font-semibold">100% Free Lifetime Community License</div>
              <div className="text-[11px] text-neutral-400">Created by Vineet Rajput for content creators worldwide</div>
            </div>

            <button
              onClick={() => setIsUpgradeModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-xs font-semibold hover:opacity-95 shadow transition-all cursor-pointer"
            >
              ❤️ Community Info & Support
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
