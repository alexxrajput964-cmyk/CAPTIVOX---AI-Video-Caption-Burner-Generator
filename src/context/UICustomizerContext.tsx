import React, { createContext, useContext, useState, useEffect } from 'react';
import { UICustomizationConfig, StudioTabId } from '../types';

export const DEFAULT_UI_CONFIG: UICustomizationConfig = {
  brandName: 'CAPTIVOX',
  brandSubtext: 'by Vineet Rajput',
  heroBadgeText: '100% Free Creator Tool · Built with ❤️ by Vineet Rajput',
  heroTitlePrefix: 'Burn Viral AI Captions',
  heroTitleHighlight: 'Directly Into',
  heroTitleSuffix: 'Your Video.',
  heroSubtitle:
    'Free India-first AI video subtitle burner built by Vineet Rajput. Permanently renders word-by-word animated Roman Hinglish, Hindi & English karaoke subtitles directly into 1080p MP4s.',
  footerAttribution: 'Crafted with ❤️ by Vineet Rajput. 100% Free forever for creators.',
  primaryAccent: '#ff3d5a',
  secondaryAccent: '#ff8c1a',
  surfaceBg: '#0a0a0a',
  cardBg: '#141416',
  uiFont: 'Plus Jakarta Sans',
  cornerRadius: 'balanced',
  density: 'comfortable',
  previewSide: 'left',
  splitPercent: 42,
  templateStripLocation: 'below_video',
  actionBarLocation: 'top',
  tabOrder: ['subtitles', 'templates', 'properties', 'presets'],
  hiddenTabs: [],
  showFastAiBar: true,
  showSafeZoneBar: true,
  showAudioSyncBar: true,
  showCreatorBadge: true,
};

const UI_STORAGE_KEY = 'captivox_ui_customization_v1';

interface UICustomizerContextType {
  uiConfig: UICustomizationConfig;
  updateUiConfig: (updates: Partial<UICustomizationConfig>) => void;
  resetUiConfig: () => void;
  moveTab: (tabId: StudioTabId, direction: 'up' | 'down') => void;
  toggleTabVisibility: (tabId: StudioTabId) => void;
  isCustomizerOpen: boolean;
  setIsCustomizerOpen: (open: boolean) => void;
  isLiveEditMode: boolean;
  setIsLiveEditMode: (active: boolean) => void;
}

const UICustomizerContext = createContext<UICustomizerContextType | undefined>(undefined);

export const UICustomizerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [uiConfig, setUiConfig] = useState<UICustomizationConfig>(() => {
    try {
      const saved = localStorage.getItem(UI_STORAGE_KEY);
      if (saved) {
        return { ...DEFAULT_UI_CONFIG, ...JSON.parse(saved) };
      }
    } catch {
      // fallback to default
    }
    return DEFAULT_UI_CONFIG;
  });

  const [isCustomizerOpen, setIsCustomizerOpen] = useState(false);
  const [isLiveEditMode, setIsLiveEditMode] = useState(false);

  // Sync CSS variables & persistence
  useEffect(() => {
    try {
      localStorage.setItem(UI_STORAGE_KEY, JSON.stringify(uiConfig));
    } catch {
      // ignore quota error
    }

    const root = document.documentElement;
    root.style.setProperty('--cx-primary', uiConfig.primaryAccent);
    root.style.setProperty('--cx-secondary', uiConfig.secondaryAccent);
    root.style.setProperty('--cx-surface', uiConfig.surfaceBg);
    root.style.setProperty('--cx-card', uiConfig.cardBg);
    root.style.setProperty('--cx-font', `'${uiConfig.uiFont}', sans-serif`);
    const radiusPx =
      uiConfig.cornerRadius === 'sharp'
        ? '6px'
        : uiConfig.cornerRadius === 'smooth'
        ? '20px'
        : '12px';
    root.style.setProperty('--cx-radius', radiusPx);
    document.body.style.backgroundColor = uiConfig.surfaceBg;
    document.body.style.fontFamily = `'${uiConfig.uiFont}', sans-serif`;
  }, [uiConfig]);

  const updateUiConfig = (updates: Partial<UICustomizationConfig>) => {
    setUiConfig((prev) => ({ ...prev, ...updates }));
  };

  const resetUiConfig = () => {
    setUiConfig(DEFAULT_UI_CONFIG);
    try {
      localStorage.removeItem(UI_STORAGE_KEY);
    } catch {
      // ignore
    }
  };

  const moveTab = (tabId: StudioTabId, direction: 'up' | 'down') => {
    setUiConfig((prev) => {
      const order = [...prev.tabOrder];
      const idx = order.indexOf(tabId);
      if (idx === -1) return prev;
      const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
      if (targetIdx < 0 || targetIdx >= order.length) return prev;
      [order[idx], order[targetIdx]] = [order[targetIdx], order[idx]];
      return { ...prev, tabOrder: order };
    });
  };

  const toggleTabVisibility = (tabId: StudioTabId) => {
    setUiConfig((prev) => {
      const isHidden = prev.hiddenTabs.includes(tabId);
      // Ensure at least 1 tab always remains visible
      if (!isHidden && prev.tabOrder.length - prev.hiddenTabs.length <= 1) {
        return prev;
      }
      const nextHidden = isHidden
        ? prev.hiddenTabs.filter((t) => t !== tabId)
        : [...prev.hiddenTabs, tabId];
      return { ...prev, hiddenTabs: nextHidden };
    });
  };

  return (
    <UICustomizerContext.Provider
      value={{
        uiConfig,
        updateUiConfig,
        resetUiConfig,
        moveTab,
        toggleTabVisibility,
        isCustomizerOpen,
        setIsCustomizerOpen,
        isLiveEditMode,
        setIsLiveEditMode,
      }}
    >
      {children}
    </UICustomizerContext.Provider>
  );
};

export const useUICustomizer = () => {
  const ctx = useContext(UICustomizerContext);
  if (!ctx) {
    throw new Error('useUICustomizer must be used within UICustomizerProvider');
  }
  return ctx;
};
