import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useUICustomizer } from '../context/UICustomizerContext';
import { Sparkles, User, Users, ArrowRightLeft, Paintbrush } from 'lucide-react';

interface NavbarProps {
  currentTab: 'landing' | 'dashboard' | 'editor' | 'account' | 'admin';
  setCurrentTab: (tab: 'landing' | 'dashboard' | 'editor' | 'account' | 'admin') => void;
  onNewProjectClick?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentTab, setCurrentTab, onNewProjectClick }) => {
  const { user, settings, toggleMonetizationMode, setIsUpgradeModalOpen, setIsAuthModalOpen } = useAuth();
  const { uiConfig, setIsCustomizerOpen } = useUICustomizer();
  const isOwner = user?.role === 'owner' || user?.is_admin || user?.id === 'demo-user';
  const isFreeMode = settings?.monetization_mode !== 'paid';

  return (
    <header
      className="sticky top-0 z-40 w-full backdrop-blur-md border-b border-neutral-800/80"
      style={{ backgroundColor: `${uiConfig.surfaceBg}e6` }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3">
        {/* Zone 1: Customizable Brand Wordmark */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => setCurrentTab('landing')}
            className="flex items-center gap-2.5 group text-left cursor-pointer"
          >
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform"
              style={{
                background: `linear-gradient(135deg, ${uiConfig.primaryAccent}, ${uiConfig.secondaryAccent})`,
              }}
            >
              <span className="font-extrabold text-white text-base">
                {(uiConfig.brandName || 'C').charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex flex-col">
              <span className="font-outfit text-lg font-extrabold tracking-tight text-white whitespace-nowrap leading-tight">
                {uiConfig.brandName}
              </span>
              {uiConfig.showCreatorBadge && (
                <span className="text-[10px] text-amber-400 font-semibold font-mono tracking-tight leading-none">
                  {uiConfig.brandSubtext}
                </span>
              )}
            </div>
          </button>
          <span className="hidden xl:inline-block text-[11px] font-semibold uppercase tracking-wider text-neutral-400 bg-neutral-900 px-2 py-0.5 rounded border border-neutral-800">
            {isFreeMode ? '100% Free Mode' : 'Commercial Mode'}
          </span>
        </div>

        {/* Zone 2: Navigation Links */}
        <nav className="hidden md:flex items-center gap-5 text-sm font-medium text-neutral-400">
          <button
            onClick={() => setCurrentTab('landing')}
            className={`transition-colors whitespace-nowrap shrink-0 hover:text-white cursor-pointer ${
              currentTab === 'landing' ? 'text-white' : ''
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setCurrentTab('dashboard')}
            className={`transition-colors whitespace-nowrap shrink-0 hover:text-white cursor-pointer ${
              currentTab === 'dashboard' ? 'text-white font-semibold' : ''
            }`}
          >
            Projects
          </button>
          <button
            onClick={() => {
              if (onNewProjectClick) {
                onNewProjectClick();
              } else {
                setCurrentTab('dashboard');
              }
            }}
            className="transition-colors whitespace-nowrap shrink-0 hover:text-white flex items-center gap-1.5 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" style={{ color: uiConfig.secondaryAccent }} />
            New Burner
          </button>

          {/* User Data Section Button (For Vineet Rajput / Owner) */}
          {isOwner && (
            <button
              onClick={() => setCurrentTab('admin')}
              className={`transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-semibold cursor-pointer ${
                currentTab === 'admin'
                  ? 'bg-neutral-800 text-white border-neutral-700'
                  : 'bg-neutral-900 text-neutral-300 border-neutral-800 hover:text-white hover:border-neutral-700'
              }`}
              title="Open Private User Management & Access Controls"
            >
              <Users className="w-3.5 h-3.5 text-blue-400" />
              <span>User Data</span>
            </button>
          )}

          <button
            onClick={() => setIsUpgradeModalOpen(true)}
            className="transition-colors whitespace-nowrap shrink-0 text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-semibold cursor-pointer"
          >
            <span>{isFreeMode ? '❤️ 100% Free' : '💎 Pricing'}</span>
          </button>
        </nav>

        {/* Zone 3: Customize UI Button, 1-Click Free/Paid Toggle & Account Badge */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Full UI Customizer Trigger */}
          <button
            onClick={() => setIsCustomizerOpen(true)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-xs font-bold text-white transition-all cursor-pointer shadow-sm"
            title="Customize UI colors, layout, panel positions & edit any text"
          >
            <Paintbrush className="w-3.5 h-3.5" style={{ color: uiConfig.primaryAccent }} />
            <span className="hidden sm:inline">Customize UI</span>
          </button>

          {/* Owner 1-Click Free vs Paid Master Switch */}
          {isOwner && (
            <button
              onClick={() => toggleMonetizationMode(isFreeMode ? 'paid' : 'free')}
              className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer shadow-sm ${
                isFreeMode
                  ? 'bg-emerald-950/70 border-emerald-500/50 text-emerald-300 hover:bg-emerald-900/80 hover:border-emerald-400'
                  : 'bg-amber-950/70 border-amber-500/50 text-amber-300 hover:bg-amber-900/80 hover:border-amber-400'
              }`}
              title={
                isFreeMode
                  ? 'Click for 1-Click Switch: Turn ON Paid mode (watermark on free tier, upgrade required)'
                  : 'Click for 1-Click Switch: Turn ON 100% Free mode (zero watermark for all users)'
              }
            >
              <ArrowRightLeft className="w-3 h-3" />
              <span>{isFreeMode ? '⚡ FREE' : '🔒 PAID'}</span>
            </button>
          )}

          {user ? (
            <button
              onClick={() => setCurrentTab('account')}
              className={`p-2 rounded-lg border transition-colors flex items-center gap-2 cursor-pointer ${
                currentTab === 'account'
                  ? 'bg-neutral-800 border-neutral-700 text-white'
                  : 'bg-neutral-900 border-neutral-800 text-neutral-300 hover:text-white hover:border-neutral-700'
              }`}
              title="User Profile & Tier"
            >
              <User className="w-4 h-4 text-amber-400" />
              <span className="hidden lg:inline text-xs font-medium max-w-[120px] truncate">
                {isOwner ? '👑 Vineet (Owner)' : user.full_name?.split(' ')[0] || 'Account'}
              </span>
            </button>
          ) : (
            <button
              onClick={() => setIsAuthModalOpen(true)}
              className="px-3.5 py-1.5 rounded-xl text-white text-xs font-bold hover:opacity-95 shadow cursor-pointer"
              style={{
                background: `linear-gradient(90deg, ${uiConfig.primaryAccent}, ${uiConfig.secondaryAccent})`,
              }}
            >
              Log In
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
