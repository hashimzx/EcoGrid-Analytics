import React, { useState, useEffect } from 'react';
import { Header, ActiveTab } from './components/layout/Header.tsx';
import { GlobalGridMap } from './components/know/GlobalGridMap.tsx';
import { RegionalObservatory } from './components/know/RegionalObservatory.tsx';
import { CountryEcogridMap } from './components/know/CountryEcogridMap.tsx';
import { WorkloadOptimizer } from './components/act/WorkloadOptimizer.tsx';
import { DatabaseSchemaViewer } from './components/enterprise/DatabaseSchemaViewer.tsx';
import { CredentialsVaultModal } from './components/enterprise/CredentialsVaultModal.tsx';
import { INITIAL_REGIONS } from './data/regionsData.ts';
import { GridRegion, FuelGeneration } from './types/grid.ts';
import { applyLiveMicroTicks } from './utils/apiClient.ts';
import { Activity, Globe, Zap, Database, Key, Map } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('map');
  const [regions, setRegions] = useState<GridRegion[]>(INITIAL_REGIONS);
  const [selectedRegionId, setSelectedRegionId] = useState<string>('pk-ntdc');
  const [isLiveTicking, setIsLiveTicking] = useState<boolean>(true);
  
  // Apple Light Mode & Dark Mode State
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('voltgrid_theme');
      if (saved === 'light') return false;
      if (saved === 'dark') return true;
      return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return true;
  });

  // Sync theme class to root HTML tag
  useEffect(() => {
    const root = document.documentElement;
    if (isDarkMode) {
      root.classList.add('dark');
      root.classList.remove('light');
      localStorage.setItem('voltgrid_theme', 'dark');
    } else {
      root.classList.remove('dark');
      root.classList.add('light');
      localStorage.setItem('voltgrid_theme', 'light');
    }
  }, [isDarkMode]);

  // Live real-time telemetry clock: updates frequency and demand every 2.5 seconds
  useEffect(() => {
    if (!isLiveTicking) return;
    const interval = setInterval(() => {
      setRegions(prev => prev.map(applyLiveMicroTicks));
    }, 2500);
    return () => clearInterval(interval);
  }, [isLiveTicking]);

  const selectedRegion = regions.find(r => r.id === selectedRegionId) || regions[0];

  const handleUpdateRegionMix = (
    regionId: string, 
    carbon: number, 
    rating: GridRegion['carbonRating'], 
    mix: FuelGeneration[]
  ) => {
    setRegions(prev => prev.map(r => {
      if (r.id !== regionId) return r;
      const cleanMw = mix.filter(m => m.isClean).reduce((acc, m) => acc + m.mw, 0);
      const totalMw = mix.reduce((acc, m) => acc + m.mw, 0) || r.currentDemandMw;
      const cleanPct = Math.round((cleanMw / (totalMw || 1)) * 100);

      return {
        ...r,
        carbonIntensity: carbon,
        carbonRating: rating,
        generationMix: mix,
        cleanEnergyPercentage: cleanPct,
        lastUpdated: new Date().toISOString(),
      };
    }));
  };

  return (
    <div className={`min-h-screen flex flex-col transition-colors duration-300 ${
      isDarkMode 
        ? 'bg-[#000000] text-[#f5f5f7]' 
        : 'bg-[#f5f5f7] text-[#1d1d1f]'
    }`}>
      {/* Apple Cupertino Frosted Top Bar Header */}
      <Header
        activeTab={activeTab}
        onTabChange={setActiveTab}
        selectedRegionName={selectedRegion.name}
        isLiveTicking={isLiveTicking}
        onToggleLiveTick={() => setIsLiveTicking(!isLiveTicking)}
        isDarkMode={isDarkMode}
        onToggleDarkMode={() => setIsDarkMode(!isDarkMode)}
      />

      {/* Main Workspace Stage */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 pb-20 md:pb-6 space-y-6">
        {activeTab === 'map' && (
          <div className="space-y-6">
            <GlobalGridMap
              regions={regions}
              selectedRegionId={selectedRegionId}
              isDarkMode={isDarkMode}
              onSelectRegion={setSelectedRegionId}
              onOpenObservatory={(id) => {
                setSelectedRegionId(id);
                setActiveTab('observatory');
              }}
            />

            {/* Transition Callout to Workload Optimizer */}
            <div className={`p-5 rounded-3xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 backdrop-blur-xl transition-all ${
              isDarkMode 
                ? 'bg-[#161617]/80 border-white/[0.1] text-[#f5f5f7]' 
                : 'bg-white/80 border-black/[0.08] text-[#1d1d1f]'
            }`}>
              <div>
                <h3 className="text-sm font-semibold tracking-tight">
                  Ready to optimize workloads across global telemetry?
                </h3>
                <p className={`text-xs mt-0.5 ${isDarkMode ? 'text-[#a1a1a6]' : 'text-[#86868b]'}`}>
                  Run the spatial-temporal arbitrage engine to schedule high-power batch compute or EV/BESS storage charging into cleanest grid hours.
                </p>
              </div>

              <button
                onClick={() => setActiveTab('act')}
                className={`px-4 py-2 text-xs font-semibold rounded-full transition-all whitespace-nowrap self-start sm:self-auto flex items-center gap-1.5 shadow-sm active:scale-95 ${
                  isDarkMode 
                    ? 'bg-white text-black hover:bg-slate-200' 
                    : 'bg-black text-white hover:bg-slate-800'
                }`}
              >
                <Zap className="w-3.5 h-3.5" />
                <span>Launch Workload Optimizer</span>
              </button>
            </div>
          </div>
        )}

        {/* Dedicated Country Ecogrid Map Tab */}
        {activeTab === 'ecogrid' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold tracking-tight">
                  National Ecogrid & Transmission Map
                </h2>
                <p className={`text-xs ${isDarkMode ? 'text-[#a1a1a6]' : 'text-[#86868b]'}`}>
                  Select any country to view its high-voltage transmission lines with electric lighting animation and ElectricityMaps 24h timeline
                </p>
              </div>

              {/* Country selector */}
              <div className="relative">
                <select
                  value={selectedRegion.id}
                  onChange={(e) => setSelectedRegionId(e.target.value)}
                  className={`appearance-none text-xs font-medium pl-3 pr-8 py-2 rounded-full cursor-pointer border ${
                    isDarkMode 
                      ? 'bg-[#1c1c1e] border-white/[0.12] text-[#f5f5f7]' 
                      : 'bg-white border-black/[0.08] text-[#1d1d1f]'
                  }`}
                  aria-label="Select Country"
                >
                  {regions.map(r => (
                    <option key={r.id} value={r.id}>
                      {r.flag} {r.country} ({r.name})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <CountryEcogridMap
              countryId={selectedRegion.id}
              countryName={selectedRegion.country}
              flag={selectedRegion.flag}
              isDarkMode={isDarkMode}
              onOpenObservatory={() => setActiveTab('observatory')}
            />
          </div>
        )}

        {activeTab === 'observatory' && (
          <RegionalObservatory
            region={selectedRegion}
            allRegions={regions}
            isDarkMode={isDarkMode}
            onSelectRegion={setSelectedRegionId}
            onNavigateToAct={(regionId) => {
              setSelectedRegionId(regionId);
              setActiveTab('act');
            }}
            onUpdateRegionMix={handleUpdateRegionMix}
          />
        )}

        {activeTab === 'act' && (
          <WorkloadOptimizer
            regions={regions}
            preselectedRegionId={selectedRegionId}
            isDarkMode={isDarkMode}
            onOpenObservatory={(id) => {
              setSelectedRegionId(id);
              setActiveTab('observatory');
            }}
          />
        )}

        {activeTab === 'schema' && (
          <DatabaseSchemaViewer isDarkMode={isDarkMode} />
        )}

        {activeTab === 'credentials' && (
          <CredentialsVaultModal isDarkMode={isDarkMode} />
        )}
      </main>

      {/* Clean Uncluttered Apple Footer adhering to zero-pill & anti-slop rules */}
      <footer className={`border-t py-6 px-6 text-xs transition-colors duration-300 mb-14 md:mb-0 ${
        isDarkMode 
          ? 'border-white/[0.08] bg-[#000000]/80 text-[#a1a1a6]' 
          : 'border-black/[0.06] bg-[#f5f5f7]/80 text-[#86868b]'
      }`}>
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className={`font-semibold ${isDarkMode ? 'text-white' : 'text-black'}`}>VoltGrid Global</span>
            <span aria-hidden="true">·</span>
            <span>Live Grid Observatory</span>
            <span aria-hidden="true">·</span>
            <span>Apple Cupertino Design</span>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-[11px]">
            <span>Superpower.pk / NTDC SCADA</span>
            <span aria-hidden="true">·</span>
            <span>ElectricityMaps</span>
            <span aria-hidden="true">·</span>
            <span>NESO UK</span>
            <span aria-hidden="true">·</span>
            <span>ENTSO-E</span>
            <span aria-hidden="true">·</span>
            <span>CAISO</span>
          </div>
        </div>
      </footer>

      {/* Mobile Bottom Navigation Bar (Apple Style Dock) */}
      <nav 
        aria-label="Mobile Navigation"
        className={`flex md:hidden fixed bottom-0 left-0 right-0 py-2 px-2 z-50 justify-around items-center backdrop-blur-xl border-t shadow-2xl ${
          isDarkMode 
            ? 'bg-[#000000]/90 border-white/[0.08] text-[#f5f5f7]' 
            : 'bg-white/90 border-black/[0.06] text-[#1d1d1f]'
        }`}
      >
        <button
          onClick={() => setActiveTab('map')}
          className={`px-3 py-1 rounded-xl flex flex-col items-center gap-0.5 text-[10px] font-medium transition-colors ${
            activeTab === 'map' ? 'text-cyan-400 font-bold' : isDarkMode ? 'text-[#a1a1a6]' : 'text-[#86868b]'
          }`}
        >
          <Globe className="w-4 h-4" />
          <span>Map</span>
        </button>
        <button
          onClick={() => setActiveTab('ecogrid')}
          className={`px-3 py-1 rounded-xl flex flex-col items-center gap-0.5 text-[10px] font-medium transition-colors ${
            activeTab === 'ecogrid' ? 'text-cyan-400 font-bold' : isDarkMode ? 'text-[#a1a1a6]' : 'text-[#86868b]'
          }`}
        >
          <Map className="w-4 h-4" />
          <span>Ecogrid</span>
        </button>
        <button
          onClick={() => setActiveTab('observatory')}
          className={`px-3 py-1 rounded-xl flex flex-col items-center gap-0.5 text-[10px] font-medium transition-colors ${
            activeTab === 'observatory' ? 'text-cyan-400 font-bold' : isDarkMode ? 'text-[#a1a1a6]' : 'text-[#86868b]'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>Observatory</span>
        </button>
        <button
          onClick={() => setActiveTab('act')}
          className={`px-3 py-1 rounded-xl flex flex-col items-center gap-0.5 text-[10px] font-medium transition-colors ${
            activeTab === 'act' ? 'text-cyan-400 font-bold' : isDarkMode ? 'text-[#a1a1a6]' : 'text-[#86868b]'
          }`}
        >
          <Zap className="w-4 h-4" />
          <span>Optimize</span>
        </button>
        <button
          onClick={() => setActiveTab('schema')}
          className={`px-3 py-1 rounded-xl flex flex-col items-center gap-0.5 text-[10px] font-medium transition-colors ${
            activeTab === 'schema' ? 'text-cyan-400 font-bold' : isDarkMode ? 'text-[#a1a1a6]' : 'text-[#86868b]'
          }`}
        >
          <Database className="w-4 h-4" />
          <span>Schema</span>
        </button>
      </nav>
    </div>
  );
}
