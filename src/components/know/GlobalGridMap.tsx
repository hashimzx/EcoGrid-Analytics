import React, { useState } from 'react';
import { GridRegion } from '../../types/grid.ts';
import { GlobeView } from './GlobeView.tsx';
import { CountryEcogridMap } from './CountryEcogridMap.tsx';
import { formatCarbon, formatCurrency, formatFrequency, formatPower } from '../../utils/formatters.ts';
import { Globe, Map as MapIcon, ArrowRight, Zap, Filter, Search, Activity, Sparkles, TrendingUp, ShieldCheck } from 'lucide-react';

interface GlobalGridMapProps {
  regions: GridRegion[];
  selectedRegionId: string;
  isDarkMode?: boolean;
  onSelectRegion: (regionId: string) => void;
  onOpenObservatory: (regionId: string) => void;
}

export const GlobalGridMap: React.FC<GlobalGridMapProps> = ({
  regions,
  selectedRegionId,
  isDarkMode = true,
  onSelectRegion,
  onOpenObservatory,
}) => {
  const [mapMode, setMapMode] = useState<'3d_globe' | '2d_map' | 'country_ecogrid'>('3d_globe');
  const [metricView, setMetricView] = useState<'carbon' | 'price' | 'clean'>('carbon');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedContinent, setSelectedContinent] = useState<string>('all');
  const [hoveredRegionId, setHoveredRegionId] = useState<string | null>(null);

  // Global aggregate metrics calculation across all active regions
  const totalRegionsCount = regions.length;
  const globalAvgCarbon = totalRegionsCount > 0 
    ? Math.round(regions.reduce((acc, r) => acc + r.carbonIntensity, 0) / totalRegionsCount) 
    : 0;
  
  const totalMonitoredDemandMw = regions.reduce((acc, r) => acc + r.currentDemandMw, 0);
  const totalPeakCapacityMw = regions.reduce((acc, r) => acc + r.peakCapacityMw, 0);
  
  const weightedAvgCarbon = totalMonitoredDemandMw > 0
    ? Math.round(regions.reduce((acc, r) => acc + (r.carbonIntensity * r.currentDemandMw), 0) / totalMonitoredDemandMw)
    : globalAvgCarbon;

  const globalAvgCleanPct = totalRegionsCount > 0
    ? Math.round(regions.reduce((acc, r) => acc + r.cleanEnergyPercentage, 0) / totalRegionsCount)
    : 0;

  const sortedByCarbon = [...regions].sort((a, b) => a.carbonIntensity - b.carbonIntensity);
  const cleanestRegion = sortedByCarbon[0] || regions[0];
  const highestCarbonRegion = sortedByCarbon[sortedByCarbon.length - 1] || regions[0];

  const pakistanRegion = regions.find(r => r.id === 'pk-ntdc' || r.country.toLowerCase() === 'pakistan');
  const asianRegions = regions.filter(r => r.continent === 'Asia' || r.continent === 'Asia-Pacific');

  const filteredRegions = regions.filter(r => {
    const matchesSearch = r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          r.country.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          r.gridOperator.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesContinent = selectedContinent === 'all' || 
                             r.continent === selectedContinent ||
                             (selectedContinent === 'Asia' && (r.continent === 'Asia' || r.continent === 'Asia-Pacific'));
    return matchesSearch && matchesContinent;
  });

  const selectedRegion = regions.find(r => r.id === selectedRegionId) || regions[0];
  const hoveredRegion = regions.find(r => r.id === (hoveredRegionId || selectedRegionId));

  const getNodeColor = (r: GridRegion) => {
    if (metricView === 'carbon') {
      if (r.carbonIntensity <= 50) return { fill: '#10B981', ring: 'ring-emerald-500/40' };
      if (r.carbonIntensity <= 150) return { fill: '#14B8A6', ring: 'ring-teal-500/40' };
      if (r.carbonIntensity <= 280) return { fill: '#F59E0B', ring: 'ring-amber-500/40' };
      if (r.carbonIntensity <= 380) return { fill: '#F97316', ring: 'ring-orange-500/40' };
      return { fill: '#EF4444', ring: 'ring-rose-500/40' };
    }
    if (metricView === 'price') {
      if (r.priceInUsdPerMwh <= 35) return { fill: '#10B981', ring: 'ring-emerald-500/40' };
      if (r.priceInUsdPerMwh <= 60) return { fill: '#06B6D4', ring: 'ring-cyan-500/40' };
      if (r.priceInUsdPerMwh <= 85) return { fill: '#F59E0B', ring: 'ring-amber-500/40' };
      return { fill: '#EF4444', ring: 'ring-rose-500/40' };
    }
    if (r.cleanEnergyPercentage >= 80) return { fill: '#10B981', ring: 'ring-emerald-500/40' };
    if (r.cleanEnergyPercentage >= 50) return { fill: '#06B6D4', ring: 'ring-cyan-500/40' };
    if (r.cleanEnergyPercentage >= 30) return { fill: '#F59E0B', ring: 'ring-amber-500/40' };
    return { fill: '#64748B', ring: 'ring-slate-500/40' };
  };

  const spectrumPercent = Math.min(100, Math.max(0, (globalAvgCarbon / 600) * 100));

  return (
    <div className="space-y-6">
      {/* ========================================================================= */}
      {/* SUMMARY DASHBOARD CARD: APPLE CUPERTINO GLASS TELEMETRY */}
      {/* ========================================================================= */}
      <section 
        aria-label="Global Carbon Intensity Summary Dashboard"
        className={`relative rounded-3xl p-6 sm:p-7 border shadow-xl backdrop-blur-xl overflow-hidden transition-colors duration-300 ${
          isDarkMode 
            ? 'bg-[#161617]/90 border-white/[0.12] text-[#f5f5f7]' 
            : 'bg-white/90 border-black/[0.08] text-[#1d1d1f]'
        }`}
      >
        {/* Subtle ambient lighting */}
        <div className="absolute top-0 right-0 w-96 h-32 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 w-80 h-28 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

        {/* Dashboard Top Header Bar */}
        <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b ${
          isDarkMode ? 'border-white/[0.08]' : 'border-black/[0.06]'
        }`}>
          <div className="flex items-center gap-3.5">
            <div className={`p-2.5 rounded-2xl border flex items-center justify-center ${
              isDarkMode 
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                : 'bg-emerald-50 text-emerald-700 border-emerald-200'
            }`}>
              <Activity className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold tracking-tight">
                  Global Grid Telemetry & Carbon Summary
                </h1>
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold ${
                  isDarkMode 
                    ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-400' 
                    : 'bg-emerald-100 border border-emerald-300 text-emerald-800'
                }`}>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  LIVE TELEMETRY
                </span>
              </div>
              <p className={`text-xs mt-0.5 ${isDarkMode ? 'text-[#a1a1a6]' : 'text-[#86868b]'}`}>
                Synchronized telemetry across <span className="font-semibold">{totalRegionsCount} active synchronous grid systems</span> (including Asian, European, and American regional backbones)
              </p>
            </div>
          </div>

          {/* Quick Action Pill Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            {pakistanRegion && (
              <button
                onClick={() => {
                  onSelectRegion(pakistanRegion.id);
                  setMapMode('country_ecogrid');
                }}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-2 transition-all shadow-sm active:scale-95 ${
                  isDarkMode 
                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/25' 
                    : 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                }`}
                title="Inspect Pakistan National Grid (NTDC) & Superpower.pk"
              >
                <span>🇵🇰 Pakistan Ecogrid</span>
                <span className="font-mono text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/20">{pakistanRegion.carbonIntensity}g</span>
              </button>
            )}

            <button
              onClick={() => setSelectedContinent(selectedContinent === 'Asia' ? 'all' : 'Asia')}
              className={`px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5 transition-all border ${
                selectedContinent === 'Asia'
                  ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/40 font-semibold'
                  : isDarkMode 
                    ? 'bg-[#1c1c1e] text-[#a1a1a6] border-white/[0.1] hover:text-white' 
                    : 'bg-[#f5f5f7] text-[#86868b] border-black/[0.08] hover:text-black'
              }`}
            >
              <span>🌏 Asian Grids ({asianRegions.length})</span>
            </button>
          </div>
        </div>

        {/* 4-Stat Telemetry Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-5">
          {/* Card 1: Global Average Carbon Intensity */}
          <div className={`p-4 rounded-2xl border transition-all ${
            isDarkMode ? 'bg-[#1c1c1e]/70 border-white/[0.08]' : 'bg-[#f5f5f7]/80 border-black/[0.06]'
          }`}>
            <div className="flex items-center justify-between">
              <span className={`text-[11px] font-semibold uppercase tracking-wider ${
                isDarkMode ? 'text-[#a1a1a6]' : 'text-[#86868b]'
              }`}>
                Global Avg Carbon
              </span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold font-mono ${
                globalAvgCarbon <= 150 
                  ? 'bg-emerald-500/20 text-emerald-400' 
                  : globalAvgCarbon <= 300 
                  ? 'bg-amber-500/20 text-amber-400' 
                  : 'bg-rose-500/20 text-rose-400'
              }`}>
                {globalAvgCarbon <= 150 ? 'LOW CARBON' : globalAvgCarbon <= 300 ? 'MODERATE' : 'ELEVATED'}
              </span>
            </div>

            <div className="mt-2.5 flex items-baseline gap-1.5">
              <span className="text-3xl font-extrabold font-mono tracking-tight text-emerald-400">
                {globalAvgCarbon}
              </span>
              <span className={`text-xs ${isDarkMode ? 'text-[#a1a1a6]' : 'text-[#86868b]'}`}>gCO2/kWh</span>
            </div>

            <div className={`mt-1 text-xs flex items-center justify-between ${
              isDarkMode ? 'text-[#a1a1a6]' : 'text-[#86868b]'
            }`}>
              <span>Demand-Weighted:</span>
              <span className="font-mono font-semibold">{weightedAvgCarbon} gCO2/kWh</span>
            </div>

            <div className="mt-3 space-y-1">
              <div className="relative h-2 w-full rounded-full bg-gradient-to-r from-emerald-500 via-amber-500 via-orange-500 to-rose-600 overflow-hidden">
                <div 
                  className="absolute top-0 bottom-0 w-2 -ml-1 bg-white border border-slate-900 rounded-full shadow-lg transition-all duration-500"
                  style={{ left: `${spectrumPercent}%` }}
                />
              </div>
              <div className={`flex justify-between text-[9px] font-mono ${
                isDarkMode ? 'text-[#a1a1a6]' : 'text-[#86868b]'
              }`}>
                <span>0g (Clean)</span>
                <span>150g</span>
                <span>300g</span>
                <span>600g+</span>
              </div>
            </div>
          </div>

          {/* Card 2: Monitored Demand */}
          <div className={`p-4 rounded-2xl border transition-all ${
            isDarkMode ? 'bg-[#1c1c1e]/70 border-white/[0.08]' : 'bg-[#f5f5f7]/80 border-black/[0.06]'
          }`}>
            <div className="flex items-center justify-between">
              <span className={`text-[11px] font-semibold uppercase tracking-wider ${
                isDarkMode ? 'text-[#a1a1a6]' : 'text-[#86868b]'
              }`}>
                Monitored Load
              </span>
              <Zap className="w-4 h-4 text-cyan-400" />
            </div>

            <div className="mt-2.5 flex items-baseline gap-1.5">
              <span className="text-3xl font-extrabold font-mono tracking-tight text-cyan-400">
                {(totalMonitoredDemandMw / 1000).toFixed(1)}
              </span>
              <span className={`text-xs ${isDarkMode ? 'text-[#a1a1a6]' : 'text-[#86868b]'}`}>GW</span>
            </div>

            <div className={`mt-1 text-xs flex items-center justify-between ${
              isDarkMode ? 'text-[#a1a1a6]' : 'text-[#86868b]'
            }`}>
              <span>Installed Fleet:</span>
              <span className="font-mono font-semibold">{(totalPeakCapacityMw / 1000).toFixed(1)} GW</span>
            </div>

            <div className={`mt-3 pt-2 border-t flex items-center justify-between text-[11px] ${
              isDarkMode ? 'border-white/[0.08]' : 'border-black/[0.06]'
            }`}>
              <span className={isDarkMode ? 'text-[#a1a1a6]' : 'text-[#86868b]'}>Active Reserves:</span>
              <span className="font-mono text-cyan-400 font-semibold">
                {Math.round(((totalPeakCapacityMw - totalMonitoredDemandMw) / totalPeakCapacityMw) * 100)}% Headroom
              </span>
            </div>
          </div>

          {/* Card 3: Global Clean Share */}
          <div className={`p-4 rounded-2xl border transition-all ${
            isDarkMode ? 'bg-[#1c1c1e]/70 border-white/[0.08]' : 'bg-[#f5f5f7]/80 border-black/[0.06]'
          }`}>
            <div className="flex items-center justify-between">
              <span className={`text-[11px] font-semibold uppercase tracking-wider ${
                isDarkMode ? 'text-[#a1a1a6]' : 'text-[#86868b]'
              }`}>
                Clean Energy Share
              </span>
              <Sparkles className="w-4 h-4 text-emerald-400" />
            </div>

            <div className="mt-2.5 flex items-baseline gap-1.5">
              <span className="text-3xl font-extrabold font-mono tracking-tight text-emerald-400">
                {globalAvgCleanPct}%
              </span>
              <span className={`text-xs ${isDarkMode ? 'text-[#a1a1a6]' : 'text-[#86868b]'}`}>Zero-Carbon</span>
            </div>

            <div className={`mt-1 text-xs flex items-center justify-between ${
              isDarkMode ? 'text-[#a1a1a6]' : 'text-[#86868b]'
            }`}>
              <span>Fossil Balance:</span>
              <span className="font-mono font-semibold">{100 - globalAvgCleanPct}% Thermal</span>
            </div>

            <div className={`mt-3 pt-2 border-t flex items-center justify-between text-[11px] ${
              isDarkMode ? 'border-white/[0.08]' : 'border-black/[0.06]'
            }`}>
              <span className={isDarkMode ? 'text-[#a1a1a6]' : 'text-[#86868b]'}>Tracked Systems:</span>
              <span className="font-mono text-emerald-400 font-semibold">{totalRegionsCount} Grids</span>
            </div>
          </div>

          {/* Card 4: Grid Extremes */}
          <div className={`p-4 rounded-2xl border transition-all ${
            isDarkMode ? 'bg-[#1c1c1e]/70 border-white/[0.08]' : 'bg-[#f5f5f7]/80 border-black/[0.06]'
          }`}>
            <div className="flex items-center justify-between">
              <span className={`text-[11px] font-semibold uppercase tracking-wider ${
                isDarkMode ? 'text-[#a1a1a6]' : 'text-[#86868b]'
              }`}>
                Grid Spread
              </span>
              <TrendingUp className="w-4 h-4 text-indigo-400" />
            </div>

            <div className="mt-2 space-y-1.5 text-xs">
              <div className="flex items-center justify-between">
                <span className={isDarkMode ? 'text-[#a1a1a6]' : 'text-[#86868b]'}>Cleanest:</span>
                <button
                  onClick={() => onSelectRegion(cleanestRegion.id)}
                  className="font-mono font-bold text-emerald-400 hover:underline flex items-center gap-1"
                >
                  <span>{cleanestRegion.flag} {cleanestRegion.name.split(' ')[0]}</span>
                  <span>({cleanestRegion.carbonIntensity}g)</span>
                </button>
              </div>

              <div className="flex items-center justify-between">
                <span className={isDarkMode ? 'text-[#a1a1a6]' : 'text-[#86868b]'}>Highest:</span>
                <button
                  onClick={() => onSelectRegion(highestCarbonRegion.id)}
                  className="font-mono font-bold text-rose-400 hover:underline flex items-center gap-1"
                >
                  <span>{highestCarbonRegion.flag} {highestCarbonRegion.name.split(' ')[0]}</span>
                  <span>({highestCarbonRegion.carbonIntensity}g)</span>
                </button>
              </div>
            </div>

            <div className={`mt-3 pt-2 border-t flex items-center justify-between text-[10px] font-mono ${
              isDarkMode ? 'border-white/[0.08] text-[#a1a1a6]' : 'border-black/[0.06] text-[#86868b]'
            }`}>
              <span>Arbitrage Delta:</span>
              <span className="text-cyan-400 font-bold">
                Δ {highestCarbonRegion.carbonIntensity - cleanestRegion.carbonIntensity} gCO2
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* MAP CONTROLS & DISPLAY */}
      {/* ========================================================================= */}
      <div className={`flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 p-4 rounded-2xl border backdrop-blur-xl ${
        isDarkMode 
          ? 'bg-[#161617]/80 border-white/[0.12] text-[#f5f5f7]' 
          : 'bg-white/80 border-black/[0.08] text-[#1d1d1f]'
      }`}>
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-2xl border flex items-center justify-center ${
            isDarkMode ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20' : 'bg-cyan-50 text-cyan-700 border-cyan-200'
          }`}>
            <Globe className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold tracking-tight flex items-center gap-2">
              <span>Synchronous Grid Network</span>
              <span className={`text-[10px] font-mono font-medium px-2 py-0.5 rounded-full ${
                isDarkMode ? 'bg-white/10 text-[#f5f5f7]' : 'bg-black/5 text-[#1d1d1f]'
              }`}>
                {mapMode === '3d_globe' ? '3D Animated Globe' : mapMode === 'country_ecogrid' ? 'Country Ecogrid Map' : '2D Planar Map'}
              </span>
            </h2>
            <div className={`flex items-center gap-2 text-xs mt-0.5 ${
              isDarkMode ? 'text-[#a1a1a6]' : 'text-[#86868b]'
            }`}>
              <span>{filteredRegions.length} power systems displayed</span>
              <span aria-hidden="true">·</span>
              <span>Smooth animations active</span>
            </div>
          </div>
        </div>

        {/* View Mode & Filter Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Segmented Mode Switcher */}
          <div className={`flex items-center p-1 rounded-full border text-xs font-medium ${
            isDarkMode ? 'bg-[#1c1c1e] border-white/[0.08]' : 'bg-[#f5f5f7] border-black/[0.06]'
          }`}>
            <button
              onClick={() => setMapMode('3d_globe')}
              className={`px-3 py-1 rounded-full flex items-center gap-1.5 transition-all ${
                mapMode === '3d_globe'
                  ? isDarkMode ? 'bg-[#2c2c2e] text-white shadow-sm font-semibold' : 'bg-white text-black shadow-sm font-semibold'
                  : isDarkMode ? 'text-[#a1a1a6] hover:text-white' : 'text-[#86868b] hover:text-black'
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              <span>3D Globe</span>
            </button>
            <button
              onClick={() => setMapMode('country_ecogrid')}
              className={`px-3 py-1 rounded-full flex items-center gap-1.5 transition-all ${
                mapMode === 'country_ecogrid'
                  ? isDarkMode ? 'bg-[#2c2c2e] text-white shadow-sm font-semibold' : 'bg-white text-black shadow-sm font-semibold'
                  : isDarkMode ? 'text-[#a1a1a6] hover:text-white' : 'text-[#86868b] hover:text-black'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Country Ecogrid</span>
            </button>
            <button
              onClick={() => setMapMode('2d_map')}
              className={`px-3 py-1 rounded-full flex items-center gap-1.5 transition-all ${
                mapMode === '2d_map'
                  ? isDarkMode ? 'bg-[#2c2c2e] text-white shadow-sm font-semibold' : 'bg-white text-black shadow-sm font-semibold'
                  : isDarkMode ? 'text-[#a1a1a6] hover:text-white' : 'text-[#86868b] hover:text-black'
              }`}
            >
              <MapIcon className="w-3.5 h-3.5" />
              <span>2D Flat</span>
            </button>
          </div>

          {/* Metric Selector */}
          <div className={`flex items-center p-1 rounded-full border text-xs ${
            isDarkMode ? 'bg-[#1c1c1e] border-white/[0.08]' : 'bg-[#f5f5f7] border-black/[0.06]'
          }`}>
            <button
              onClick={() => setMetricView('carbon')}
              className={`px-2.5 py-1 rounded-full transition-all ${
                metricView === 'carbon' 
                  ? 'bg-emerald-500/20 text-emerald-400 font-semibold' 
                  : isDarkMode ? 'text-[#a1a1a6]' : 'text-[#86868b]'
              }`}
            >
              Carbon
            </button>
            <button
              onClick={() => setMetricView('price')}
              className={`px-2.5 py-1 rounded-full transition-all ${
                metricView === 'price' 
                  ? 'bg-cyan-500/20 text-cyan-400 font-semibold' 
                  : isDarkMode ? 'text-[#a1a1a6]' : 'text-[#86868b]'
              }`}
            >
              Price
            </button>
            <button
              onClick={() => setMetricView('clean')}
              className={`px-2.5 py-1 rounded-full transition-all ${
                metricView === 'clean' 
                  ? 'bg-indigo-500/20 text-indigo-400 font-semibold' 
                  : isDarkMode ? 'text-[#a1a1a6]' : 'text-[#86868b]'
              }`}
            >
              Clean %
            </button>
          </div>

          {/* Continent Filter */}
          <select
            value={selectedContinent}
            onChange={(e) => setSelectedContinent(e.target.value)}
            className={`border rounded-full px-3 py-1.5 text-xs focus:outline-none ${
              isDarkMode 
                ? 'bg-[#1c1c1e] border-white/[0.1] text-[#f5f5f7]' 
                : 'bg-[#f5f5f7] border-black/[0.08] text-[#1d1d1f]'
            }`}
            aria-label="Filter grids by continent"
          >
            <option value="all">All Continents</option>
            <option value="Asia">Asia (🇵🇰 Pakistan, 🇮🇳 India, 🇯🇵 Japan, 🇸🇬 Singapore)</option>
            <option value="Europe">Europe (🇬🇧 UK, 🇳🇴 Nordics, 🇫🇷 France, 🇩🇪 Germany)</option>
            <option value="North America">North America (🇺🇸 CAISO, ERCOT)</option>
            <option value="Latin America">Latin America (🇧🇷 Brazil)</option>
            <option value="Asia-Pacific">Australia (🇦🇺 NEM)</option>
          </select>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* STAGE DISPLAY: 3D GLOBE vs COUNTRY ECOGRID MAP vs 2D MAP */}
      {/* ========================================================================= */}
      {mapMode === '3d_globe' && (
        <GlobeView
          regions={filteredRegions}
          selectedRegionId={selectedRegionId}
          metricView={metricView}
          isDarkMode={isDarkMode}
          onSelectRegion={(id) => {
            onSelectRegion(id);
            // If user clicked Pakistan, offer easy transition to its ecogrid map
            if (id === 'pk-ntdc') setMapMode('country_ecogrid');
          }}
          onOpenObservatory={(id) => {
            onSelectRegion(id);
            setMapMode('country_ecogrid');
          }}
        />
      )}

      {mapMode === 'country_ecogrid' && (
        <div className="space-y-4">
          <CountryEcogridMap
            countryId={selectedRegion.id}
            countryName={selectedRegion.country}
            flag={selectedRegion.flag}
            isDarkMode={isDarkMode}
            onOpenObservatory={onOpenObservatory}
          />

          {/* Quick Country Switcher Bar */}
          <div className="flex items-center gap-2 overflow-x-auto py-2">
            <span className={`text-xs font-semibold uppercase tracking-wider shrink-0 ${
              isDarkMode ? 'text-[#a1a1a6]' : 'text-[#86868b]'
            }`}>
              Switch Country Ecogrid:
            </span>
            {regions.map((reg) => (
              <button
                key={reg.id}
                onClick={() => onSelectRegion(reg.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all border shrink-0 ${
                  reg.id === selectedRegion.id
                    ? isDarkMode 
                      ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 font-semibold' 
                      : 'bg-cyan-50 text-cyan-700 border-cyan-200 font-semibold'
                    : isDarkMode
                      ? 'bg-[#1c1c1e] text-[#a1a1a6] border-white/[0.08] hover:text-white'
                      : 'bg-white text-[#86868b] border-black/[0.08] hover:text-black'
                }`}
              >
                <span>{reg.flag} {reg.country} ({reg.name.split(' ')[0]})</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {mapMode === '2d_map' && (
        <div className={`p-4 sm:p-6 rounded-3xl border shadow-xl relative overflow-hidden backdrop-blur-xl ${
          isDarkMode ? 'bg-[#161617]/90 border-white/[0.12]' : 'bg-white/90 border-black/[0.08]'
        }`}>
          <svg viewBox="0 0 1000 500" className="w-full h-auto max-h-[500px]">
            {/* World background map polygons */}
            <g fill={isDarkMode ? '#1e293b' : '#e2e8f0'} stroke={isDarkMode ? '#334155' : '#cbd5e1'} strokeWidth="1">
              <path d="M 150 120 Q 250 110, 300 180 Q 250 250, 180 230 Z" />
              <path d="M 220 270 Q 280 280, 270 420 Q 210 380, 220 270 Z" />
              <path d="M 450 110 Q 550 100, 560 190 Q 480 220, 450 110 Z" />
              <path d="M 480 220 Q 560 230, 550 380 Q 470 330, 480 220 Z" />
              <path d="M 640 260 Q 670 280, 710 310 Q 720 350, 680 370 Q 650 350, 640 260 Z" />
              <path d="M 780 320 Q 860 310, 850 420 Q 770 410, 780 320 Z" />
            </g>

            {/* Region Pins with Electric Pulse */}
            {filteredRegions.map((region) => {
              const { fill, ring } = getNodeColor(region);
              const isSelected = region.id === selectedRegionId;
              const isHovered = hoveredRegionId === region.id;
              return (
                <g 
                  key={region.id} 
                  className="cursor-pointer"
                  onClick={() => {
                    onSelectRegion(region.id);
                    setMapMode('country_ecogrid');
                  }}
                  onMouseEnter={() => setHoveredRegionId(region.id)}
                  onMouseLeave={() => setHoveredRegionId(null)}
                >
                  <circle
                    cx={region.coordinates.x}
                    cy={region.coordinates.y}
                    r={isSelected || isHovered ? 14 : 9}
                    fill={fill}
                    fillOpacity={0.25}
                    className="animate-ping"
                    style={{ animationDuration: '2.5s' }}
                  />
                  <circle
                    cx={region.coordinates.x}
                    cy={region.coordinates.y}
                    r={isSelected || isHovered ? 8 : 5}
                    fill={fill}
                    stroke={isDarkMode ? '#000000' : '#ffffff'}
                    strokeWidth="2"
                  />
                  <text
                    x={region.coordinates.x}
                    y={region.coordinates.y - 12}
                    textAnchor="middle"
                    fill={isDarkMode ? '#ffffff' : '#000000'}
                    fontSize="10"
                    fontWeight="bold"
                    fontFamily="system-ui"
                  >
                    {region.flag} {region.country} ({region.carbonIntensity}g)
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      )}
    </div>
  );
};
