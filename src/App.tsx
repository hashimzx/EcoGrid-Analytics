import React, { useState, useEffect } from 'react';
import { Header, ActiveTab } from './components/layout/Header.tsx';
import { GlobalGridMap } from './components/know/GlobalGridMap.tsx';
import { RegionalObservatory } from './components/know/RegionalObservatory.tsx';
import { WorkloadOptimizer } from './components/act/WorkloadOptimizer.tsx';
import { DatabaseSchemaViewer } from './components/enterprise/DatabaseSchemaViewer.tsx';
import { CredentialsVaultModal } from './components/enterprise/CredentialsVaultModal.tsx';
import { INITIAL_REGIONS } from './data/regionsData.ts';
import { GridRegion, FuelGeneration } from './types/grid.ts';
import { applyLiveMicroTicks } from './utils/apiClient.ts';
import { Activity, Globe, Zap, Database, Key } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('map');
  const [regions, setRegions] = useState<GridRegion[]>(INITIAL_REGIONS);
  const [selectedRegionId, setSelectedRegionId] = useState<string>('gb-uk');
  const [isLiveTicking, setIsLiveTicking] = useState<boolean>(true);
  const [theme, setTheme] = useState<'uk_grid' | 'cyber' | 'nordic'>('uk_grid');

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
    <div className={`min-h-screen flex flex-col bg-slate-950 text-slate-100 theme-${theme}`}>
      {/* 1-Row Strict Top Bar Contract Header */}
      <Header
        activeTab={activeTab}
        onTabChange={setActiveTab}
        selectedRegionName={selectedRegion.name}
        isLiveTicking={isLiveTicking}
        onToggleLiveTick={() => setIsLiveTicking(!isLiveTicking)}
        currentTheme={theme}
        onThemeChange={setTheme}
      />

      {/* Main Workspace Stage */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 pb-20 md:pb-6">
        {activeTab === 'map' && (
          <div className="space-y-6">
            <GlobalGridMap
              regions={regions}
              selectedRegionId={selectedRegionId}
              onSelectRegion={setSelectedRegionId}
              onOpenObservatory={(id) => {
                setSelectedRegionId(id);
                setActiveTab('observatory');
              }}
            />

            {/* Quick Transition Callout to Act Phase */}
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-semibold text-white">
                  Ready to act on these telemetry differentials?
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Run the spatial-temporal arbitrage engine to schedule high-power AI training, batch compute, or battery storage charging.
                </p>
              </div>

              <button
                onClick={() => setActiveTab('act')}
                className="px-4 py-2 text-xs font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-lg transition-colors whitespace-nowrap self-start sm:self-auto flex items-center gap-1.5"
              >
                <Zap className="w-3.5 h-3.5" />
                <span>Launch Workload Optimizer</span>
              </button>
            </div>
          </div>
        )}

        {activeTab === 'observatory' && (
          <RegionalObservatory
            region={selectedRegion}
            allRegions={regions}
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
            onOpenObservatory={(id) => {
              setSelectedRegionId(id);
              setActiveTab('observatory');
            }}
          />
        )}

        {activeTab === 'schema' && (
          <DatabaseSchemaViewer />
        )}

        {activeTab === 'credentials' && (
          <CredentialsVaultModal />
        )}
      </main>

      {/* Clean Uncluttered Site Footer adhering to anti-slop rules */}
      <footer className="border-t border-slate-800/80 bg-slate-950/80 py-6 px-6 text-xs text-slate-500 mb-14 md:mb-0">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-300">VoltGrid Global</span>
            <span aria-hidden="true">·</span>
            <span>Inspired by UK Grid Live</span>
            <span aria-hidden="true">·</span>
            <span>Open Electricity Grid Observability &amp; Arbitrage</span>
          </div>

          <div className="flex items-center gap-4 text-[11px]">
            <span>Open Data: NESO Carbon Intensity UK</span>
            <span aria-hidden="true">·</span>
            <span>ENTSO-E</span>
            <span aria-hidden="true">·</span>
            <span>CAISO OASIS</span>
            <span aria-hidden="true">·</span>
            <span>AEMO</span>
          </div>
        </div>
      </footer>

      {/* Fixed Mobile Bottom Navigation Bar (Cleanly detached from header) */}
      <nav 
        aria-label="Mobile Navigation"
        className="flex md:hidden fixed bottom-0 left-0 right-0 bg-slate-950/95 border-t border-slate-800 py-2 px-2 z-50 justify-around items-center backdrop-blur-md shadow-2xl"
      >
        <button
          onClick={() => setActiveTab('map')}
          className={`px-3 py-1 rounded-lg flex flex-col items-center gap-0.5 text-[10px] font-medium transition-colors ${
            activeTab === 'map' ? 'text-emerald-400' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Globe className="w-4 h-4" />
          <span>Map</span>
        </button>
        <button
          onClick={() => setActiveTab('observatory')}
          className={`px-3 py-1 rounded-lg flex flex-col items-center gap-0.5 text-[10px] font-medium transition-colors ${
            activeTab === 'observatory' ? 'text-emerald-400' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>Observatory</span>
        </button>
        <button
          onClick={() => setActiveTab('act')}
          className={`px-3 py-1 rounded-lg flex flex-col items-center gap-0.5 text-[10px] font-medium transition-colors ${
            activeTab === 'act' ? 'text-emerald-400' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Zap className="w-4 h-4" />
          <span>Optimize</span>
        </button>
        <button
          onClick={() => setActiveTab('schema')}
          className={`px-3 py-1 rounded-lg flex flex-col items-center gap-0.5 text-[10px] font-medium transition-colors ${
            activeTab === 'schema' ? 'text-emerald-400' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Database className="w-4 h-4" />
          <span>Schema</span>
        </button>
        <button
          onClick={() => setActiveTab('credentials')}
          className={`px-3 py-1 rounded-lg flex flex-col items-center gap-0.5 text-[10px] font-medium transition-colors ${
            activeTab === 'credentials' ? 'text-emerald-400' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Key className="w-4 h-4" />
          <span>Vault</span>
        </button>
      </nav>
    </div>
  );
}
