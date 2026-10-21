import React from 'react';
import { Activity, Globe, Zap, Database, Key, Sun, Moon, Map } from 'lucide-react';

export type ActiveTab = 'map' | 'observatory' | 'ecogrid' | 'act' | 'schema' | 'credentials';

interface HeaderProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  selectedRegionName?: string;
  isLiveTicking: boolean;
  onToggleLiveTick: () => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onTabChange,
  isLiveTicking,
  onToggleLiveTick,
  isDarkMode,
  onToggleDarkMode,
}) => {
  return (
    <header className={`flex items-center justify-between gap-6 px-6 py-3.5 border-b sticky top-0 z-50 backdrop-blur-xl transition-colors duration-300 ${
      isDarkMode 
        ? 'bg-[#000000]/80 border-white/[0.08] text-[#f5f5f7]' 
        : 'bg-[#ffffff]/80 border-black/[0.06] text-[#1d1d1f]'
    }`}>
      {/* Zone 1: Apple Cupertino Wordmark */}
      <a 
        href="#top" 
        onClick={(e) => { e.preventDefault(); onTabChange('map'); }}
        className="text-base font-semibold tracking-tight flex items-center gap-2.5 whitespace-nowrap shrink-0 group"
      >
        <span className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${
          isDarkMode 
            ? 'bg-white/10 text-white group-hover:bg-cyan-500/20 group-hover:text-cyan-400' 
            : 'bg-black/5 text-black group-hover:bg-cyan-500/10 group-hover:text-cyan-600'
        }`}>
          <Zap className="w-3.5 h-3.5" />
        </span>
        <span className="font-bold tracking-tight">VoltGrid</span>
        <span className={`text-[11px] font-normal tracking-normal ${
          isDarkMode ? 'text-[#a1a1a6]' : 'text-[#86868b]'
        }`}>
          Observatory
        </span>
      </a>

      {/* Zone 2: Apple clean navigation tabs */}
      <nav className={`hidden md:flex items-center gap-1 text-xs font-medium p-1 rounded-full border ${
        isDarkMode 
          ? 'bg-[#1c1c1e]/60 border-white/[0.08]' 
          : 'bg-[#f5f5f7] border-black/[0.04]'
      }`}>
        <button
          onClick={() => onTabChange('map')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all whitespace-nowrap ${
            activeTab === 'map' 
              ? isDarkMode ? 'bg-[#2c2c2e] text-white shadow-sm font-semibold' : 'bg-white text-black shadow-sm font-semibold'
              : isDarkMode ? 'text-[#a1a1a6] hover:text-white' : 'text-[#86868b] hover:text-black'
          }`}
        >
          <Globe className="w-3.5 h-3.5" />
          <span>Global Map</span>
        </button>

        <button
          onClick={() => onTabChange('ecogrid')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all whitespace-nowrap ${
            activeTab === 'ecogrid' 
              ? isDarkMode ? 'bg-[#2c2c2e] text-white shadow-sm font-semibold' : 'bg-white text-black shadow-sm font-semibold'
              : isDarkMode ? 'text-[#a1a1a6] hover:text-white' : 'text-[#86868b] hover:text-black'
          }`}
        >
          <Map className="w-3.5 h-3.5" />
          <span>Country Ecogrid</span>
        </button>

        <button
          onClick={() => onTabChange('observatory')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all whitespace-nowrap ${
            activeTab === 'observatory' 
              ? isDarkMode ? 'bg-[#2c2c2e] text-white shadow-sm font-semibold' : 'bg-white text-black shadow-sm font-semibold'
              : isDarkMode ? 'text-[#a1a1a6] hover:text-white' : 'text-[#86868b] hover:text-black'
          }`}
        >
          <Activity className="w-3.5 h-3.5" />
          <span>Observatory</span>
        </button>

        <button
          onClick={() => onTabChange('act')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all whitespace-nowrap ${
            activeTab === 'act' 
              ? isDarkMode ? 'bg-[#2c2c2e] text-white shadow-sm font-semibold' : 'bg-white text-black shadow-sm font-semibold'
              : isDarkMode ? 'text-[#a1a1a6] hover:text-white' : 'text-[#86868b] hover:text-black'
          }`}
        >
          <Zap className="w-3.5 h-3.5" />
          <span>Workload Optimizer</span>
        </button>

        <button
          onClick={() => onTabChange('schema')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all whitespace-nowrap ${
            activeTab === 'schema' 
              ? isDarkMode ? 'bg-[#2c2c2e] text-white shadow-sm font-semibold' : 'bg-white text-black shadow-sm font-semibold'
              : isDarkMode ? 'text-[#a1a1a6] hover:text-white' : 'text-[#86868b] hover:text-black'
          }`}
        >
          <Database className="w-3.5 h-3.5" />
          <span>Schema</span>
        </button>

        <button
          onClick={() => onTabChange('credentials')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all whitespace-nowrap ${
            activeTab === 'credentials' 
              ? isDarkMode ? 'bg-[#2c2c2e] text-white shadow-sm font-semibold' : 'bg-white text-black shadow-sm font-semibold'
              : isDarkMode ? 'text-[#a1a1a6] hover:text-white' : 'text-[#86868b] hover:text-black'
          }`}
        >
          <Key className="w-3.5 h-3.5" />
          <span>Vault</span>
        </button>
      </nav>

      {/* Zone 3: Apple Light/Dark Switch + Live Ticker + Quick Action */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        
        {/* Apple Light/Dark Mode Switcher */}
        <button
          onClick={onToggleDarkMode}
          aria-label={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          className={`p-2 rounded-full border transition-all flex items-center justify-center ${
            isDarkMode 
              ? 'bg-[#1c1c1e] border-white/[0.12] text-amber-300 hover:bg-[#2c2c2e]' 
              : 'bg-[#f5f5f7] border-black/[0.08] text-slate-700 hover:bg-[#e8e8ed]'
          }`}
          title={isDarkMode ? 'Switch to Apple Light Mode' : 'Switch to Apple Dark Mode'}
        >
          {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        {/* Live Stream Telemetry Pill */}
        <button
          onClick={onToggleLiveTick}
          title={isLiveTicking ? 'Pause simulated real-time stream' : 'Resume real-time stream'}
          className={`text-xs px-2.5 py-1.5 rounded-full border flex items-center gap-1.5 transition-colors font-mono ${
            isLiveTicking 
              ? isDarkMode 
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
                : 'bg-emerald-50 border-emerald-200 text-emerald-700'
              : isDarkMode
                ? 'bg-[#1c1c1e] border-white/[0.1] text-[#a1a1a6]'
                : 'bg-[#f5f5f7] border-black/[0.08] text-[#86868b]'
          }`}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${isLiveTicking ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
          <span className="hidden sm:inline">{isLiveTicking ? 'Live Telemetry' : 'Paused'}</span>
        </button>

        {/* Primary CTA */}
        <button
          onClick={() => onTabChange('ecogrid')}
          className={`px-3.5 py-1.5 text-xs font-semibold rounded-full transition-all whitespace-nowrap shadow-sm active:scale-95 ${
            isDarkMode 
              ? 'bg-white text-black hover:bg-slate-200' 
              : 'bg-[#1d1d1f] text-white hover:bg-black'
          }`}
        >
          View Ecogrid
        </button>
      </div>
    </header>
  );
};
