import { UserProfile, UserTier, SystemSettings } from '../types';

interface AuthContextType {
  user: UserProfile | null;
  settings: SystemSettings | null;
  isLoading: boolean;
  login: (phone: string, email?: string, otp?: string, isGoogle?: boolean) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  upgradeTier: (tier: UserTier) => Promise<{ success: boolean; error?: string }>;
  refreshUser: () => Promise<void>;
  toggleMonetizationMode: (mode?: 'free' | 'paid') => Promise<void>;
  isUpgradeModalOpen: boolean;
  setIsUpgradeModalOpen: (open: boolean) => void;
  isAuthModalOpen: boolean;
  setIsAuthModalOpen: (open: boolean) => void;
  toastMessage: string | null;
  showToast: (msg: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [settings, setSettings] = useState<SystemSettings | null>({
    monetization_mode: 'free',
    watermark_on_free_tier: false,
    daily_export_limit_free: 99999,
    allow_registration: true,
    updated_at: new Date().toISOString(),
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((current) => (current === msg ? null : current));
    }, 3500);
  };

  const refreshUser = async () => {
    try {
      const storedUserId = localStorage.getItem('captivox_user_id') || 'demo-user';
      const res = await fetch('/api/auth/me', {
        headers: {
          'x-user-id': storedUserId,
        },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.user) {
          if (data.user.is_blocked) {
            setUser(null);
            localStorage.removeItem('captivox_user_id');
            showToast('⚠️ Your account has been suspended by the platform administrator.');
          } else {
            setUser(data.user);
          }
        }
        if (data.settings) {
          setSettings(data.settings);
        }
      }
    } catch (err) {
      console.warn('Failed to fetch auth session', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const login = async (phone: string, email?: string, otp?: string, isGoogle?: boolean) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, email, otp, isGoogle }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setUser(data.user);
        localStorage.setItem('captivox_user_id', data.user.id);
        showToast(`Welcome back, ${data.user.full_name}!`);
        return { success: true };
      }
      return { success: false, error: data.error || 'Authentication failed' };
    } catch (err: any) {
      return { success: false, error: err.message || 'Connection error' };
    }
  };

  const logout = () => {
    localStorage.removeItem('captivox_user_id');
    // Revert to demo user
    setUser({
      id: 'demo-user',
      email: 'creator@example.com',
      phone: '9876543210',
      full_name: 'Rahul Sharma',
      tier: 'free',
      is_admin: false,
      exports_today: 0,
      exports_today_date: new Date().toISOString().split('T')[0],
      created_at: new Date().toISOString(),
    });
    showToast('Signed out successfully');
  };

  const upgradeTier = async (tier: UserTier) => {
    try {
      const res = await fetch('/api/auth/upgrade', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user?.id || 'demo-user',
        },
        body: JSON.stringify({ tier }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setUser(data.user);
        setIsUpgradeModalOpen(false);
        showToast(`🎉 Plan upgraded to ${tier.toUpperCase()}! All features unlocked.`);
        return { success: true };
      }
      return { success: false, error: data.error || 'Failed to upgrade tier' };
    } catch (err: any) {
      return { success: false, error: err.message || 'Upgrade failed' };
    }
  };

  const toggleMonetizationMode = async (mode?: 'free' | 'paid') => {
    try {
      const storedUserId = localStorage.getItem('captivox_user_id') || 'demo-user';
      const res = await fetch('/api/admin/toggle-monetization', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': storedUserId,
        },
        body: JSON.stringify({ mode }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSettings(data.settings);
        showToast(`⚡ Switched to ${data.settings.monetization_mode.toUpperCase()} Mode!`);
        await refreshUser();
      } else {
        showToast(data.error || 'Failed to switch mode');
      }
    } catch (err: any) {
      showToast('Error switching mode: ' + err.message);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        settings,
        isLoading,
        login,
        logout,
        upgradeTier,
        refreshUser,
        toggleMonetizationMode,
        isUpgradeModalOpen,
        setIsUpgradeModalOpen,
        isAuthModalOpen,
        setIsAuthModalOpen,
        toastMessage,
        showToast,
      }}
    >
      {children}
      {/* Toast Notification (Bottom Center) */}
      {toastMessage && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-[#18181b] border border-neutral-700/80 text-white px-5 py-3 rounded-xl shadow-2xl text-sm flex items-center gap-3 backdrop-blur-md animate-in fade-in slide-in-from-bottom-3 duration-200">
          <span className="w-2 h-2 rounded-full bg-[#ff3d5a]" />
          <span>{toastMessage}</span>
        </div>
      )}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
