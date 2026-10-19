import React from 'react';
import { Activity, Globe, Zap, Database, Key } from 'lucide-react';

export type ActiveTab = 'map' | 'observatory' | 'act' | 'schema' | 'credentials';

export type AppTheme = 'uk_grid' | 'cyber' | 'nordic';

interface HeaderProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  selectedRegionName?: string;
  isLiveTicking: boolean;
  onToggleLiveTick: () => void;
  currentTheme: AppTheme;
  onThemeChange: (theme: AppTheme) => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onTabChange,
  isLiveTicking,
  onToggleLiveTick,
  currentTheme,
  onThemeChange,
}) => {
  return (
    <header className="flex items-center justify-between gap-8 px-6 py-3.5 border-b border-slate-800 bg-slate-950/90 backdrop-blur-md sticky top-0 z-50">
      {/* Zone 1: Single text element wordmark */}
      <a 
        href="#top" 
        onClick={(e) => { e.preventDefault(); onTabChange('map'); }}
        className="text-lg font-bold tracking-tight text-white flex items-center gap-2.5 whitespace-nowrap shrink-0 hover:text-emerald-400 transition-colors"
      >
        <span className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
          <Zap className="w-4 h-4" />
        </span>
        <span>VoltGrid Global</span>
      </a>

      {/* Zone 2: 4-5 single-line clean text navigation links */}
      <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-300">
        <button
          onClick={() => onTabChange('map')}
          className={`flex items-center gap-1.5 py-1 transition-colors whitespace-nowrap shrink-0 ${
            activeTab === 'map' 
              ? 'text-emerald-400 border-b-2 border-emerald-400 font-semibold' 
              : 'hover:text-white'
          }`}
        >
          <Globe className="w-4 h-4" />
          <span>Global Map</span>
        </button>

        <button
          onClick={() => onTabChange('observatory')}
          className={`flex items-center gap-1.5 py-1 transition-colors whitespace-nowrap shrink-0 ${
            activeTab === 'observatory' 
              ? 'text-emerald-400 border-b-2 border-emerald-400 font-semibold' 
              : 'hover:text-white'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>Observatory</span>
        </button>

        <button
          onClick={() => onTabChange('act')}
          className={`flex items-center gap-1.5 py-1 transition-colors whitespace-nowrap shrink-0 ${
            activeTab === 'act' 
              ? 'text-emerald-400 border-b-2 border-emerald-400 font-semibold' 
              : 'hover:text-white'
          }`}
        >
          <Zap className="w-4 h-4" />
          <span>Workload Optimizer</span>
        </button>

        <button
          onClick={() => onTabChange('schema')}
          className={`flex items-center gap-1.5 py-1 transition-colors whitespace-nowrap shrink-0 ${
            activeTab === 'schema' 
              ? 'text-emerald-400 border-b-2 border-emerald-400 font-semibold' 
              : 'hover:text-white'
          }`}
        >
          <Database className="w-4 h-4" />
          <span>Database Schema</span>
        </button>

        <button
          onClick={() => onTabChange('credentials')}
          className={`flex items-center gap-1.5 py-1 transition-colors whitespace-nowrap shrink-0 ${
            activeTab === 'credentials' 
              ? 'text-emerald-400 border-b-2 border-emerald-400 font-semibold' 
              : 'hover:text-white'
          }`}
        >
          <Key className="w-4 h-4" />
          <span>API Vault</span>
        </button>
      </nav>

      {/* Zone 3: 1 primary action + theme selector & live ticker */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {/* Theme Selector */}
        <select
          value={currentTheme}
          onChange={(e) => onThemeChange(e.target.value as AppTheme)}
          className="hidden sm:block text-xs bg-slate-900 border border-slate-700 text-slate-300 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-emerald-500 font-medium"
          aria-label="Select Grid Theme"
        >
          <option value="uk_grid">UK Grid Live (Dark)</option>
          <option value="cyber">Cyber Phosphor</option>
          <option value="nordic">Nordic Hydro</option>
        </select>

        <button
          onClick={onToggleLiveTick}
          title={isLiveTicking ? 'Pause simulated real-time stream' : 'Resume real-time stream'}
          className={`text-xs px-2.5 py-1.5 rounded border flex items-center gap-1.5 transition-colors font-mono ${
            isLiveTicking 
              ? 'bg-emerald-950/40 border-emerald-800 text-emerald-400' 
              : 'bg-slate-900 border-slate-700 text-slate-400'
          }`}
        >
          <span className={`w-2 h-2 rounded-full ${isLiveTicking ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`} />
          <span className="hidden sm:inline">{isLiveTicking ? 'Live Stream Active' : 'Stream Paused'}</span>
        </button>

        <button
          onClick={() => onTabChange('act')}
          className="px-3.5 py-1.5 text-xs font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 transition-colors rounded-lg whitespace-nowrap shrink-0"
        >
          Optimizer
        </button>
      </div>
    </header>
  );
};
