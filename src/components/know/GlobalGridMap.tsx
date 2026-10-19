import React, { useState } from 'react';
import { GridRegion } from '../../types/grid.ts';
import { GlobeView } from './GlobeView.tsx';
import { formatCarbon, formatCurrency, formatFrequency, formatPower } from '../../utils/formatters.ts';
import { Globe, Map as MapIcon, ArrowRight, Zap, Filter, Search, Activity, Sparkles, TrendingUp, ShieldCheck } from 'lucide-react';

interface GlobalGridMapProps {
  regions: GridRegion[];
  selectedRegionId: string;
  onSelectRegion: (regionId: string) => void;
  onOpenObservatory: (regionId: string) => void;
}

export const GlobalGridMap: React.FC<GlobalGridMapProps> = ({
  regions,
  selectedRegionId,
  onSelectRegion,
  onOpenObservatory,
}) => {
  const [mapMode, setMapMode] = useState<'3d_globe' | '2d_map'>('3d_globe');
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

  // Spectrum marker position: map 0-600 gCO2/kWh to 0-100%
  const spectrumPercent = Math.min(100, Math.max(0, (globalAvgCarbon / 600) * 100));

  return (
    <div className="space-y-4">
      {/* ========================================================================= */}
      {/* SUMMARY DASHBOARD CARD: GLOBAL AVERAGE CARBON INTENSITY & LIVE TELEMETRY */}
      {/* ========================================================================= */}
      <section 
        aria-label="Global Carbon Intensity Summary Dashboard"
        className="relative rounded-2xl bg-gradient-to-b from-slate-900/95 via-slate-900/80 to-slate-950 border border-slate-800 p-5 shadow-2xl overflow-hidden backdrop-blur-md"
      >
        {/* Ambient background glow accents */}
        <div className="absolute top-0 right-0 w-96 h-32 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 w-80 h-28 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />

        {/* Dashboard Top Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800/80">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-inner">
              <Activity className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold text-white tracking-tight">
                  Global Carbon Intensity & Grid Telemetry Summary
                </h1>
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-500/30 text-[10px] font-mono font-semibold text-emerald-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  LIVE TELEMETRY
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Real-time synchronized synthesis across <span className="font-semibold text-slate-200">{totalRegionsCount} active synchronous grid networks</span> (including Asian, European, and American corridors)
              </p>
            </div>
          </div>

          {/* Quick Filter / Focus Jump Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            {pakistanRegion && (
              <button
                onClick={() => {
                  onSelectRegion(pakistanRegion.id);
                  onOpenObservatory(pakistanRegion.id);
                }}
                className="px-2.5 py-1 rounded-lg text-xs font-medium bg-emerald-950/60 hover:bg-emerald-900/60 text-emerald-300 border border-emerald-700/50 flex items-center gap-1.5 transition-colors shadow-sm"
                title="Inspect Pakistan National Grid (NTDC)"
              >
                <span>🇵🇰 Pakistan Grid</span>
                <span className="font-mono text-[10px] px-1 rounded bg-emerald-900/80 text-emerald-200">{pakistanRegion.carbonIntensity}g</span>
              </button>
            )}

            <button
              onClick={() => setSelectedContinent(selectedContinent === 'Asia' ? 'all' : 'Asia')}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors border shadow-sm ${
                selectedContinent === 'Asia'
                  ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                  : 'bg-slate-950 text-slate-300 hover:text-white border-slate-800 hover:border-slate-700'
              }`}
              title="Filter map to Asian & South Asian grids"
            >
              <span>🌏 Asian Grids ({asianRegions.length})</span>
            </button>

            {cleanestRegion && (
              <button
                onClick={() => onSelectRegion(cleanestRegion.id)}
                className="px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-950 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition-colors flex items-center gap-1.5"
                title={`Inspect cleanest grid: ${cleanestRegion.name}`}
              >
                <span>{cleanestRegion.flag} Cleanest: {cleanestRegion.carbonIntensity}g</span>
              </button>
            )}
          </div>
        </div>

        {/* 4-Stat Telemetry Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
          {/* Card 1: Global Average Carbon Intensity (Primary Requested Feature) */}
          <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-emerald-500/30 transition-colors relative group">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Global Average Carbon
              </span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-semibold font-mono border ${
                globalAvgCarbon <= 150 
                  ? 'bg-emerald-950/80 border-emerald-800 text-emerald-400' 
                  : globalAvgCarbon <= 300 
                  ? 'bg-amber-950/80 border-amber-800 text-amber-400' 
                  : 'bg-orange-950/80 border-orange-800 text-orange-400'
              }`}>
                {globalAvgCarbon <= 150 ? 'LOW CARBON' : globalAvgCarbon <= 300 ? 'MODERATE' : 'ELEVATED'}
              </span>
            </div>

            <div className="mt-2 flex items-baseline gap-2">
              <div className="font-mono text-3xl font-extrabold tracking-tight text-white flex items-baseline gap-1">
                <span className="text-emerald-400">{globalAvgCarbon}</span>
                <span className="text-xs font-normal text-slate-400 font-sans">gCO2/kWh</span>
              </div>
            </div>

            <div className="mt-1 text-xs text-slate-400 flex items-center justify-between">
              <span>Demand-Weighted:</span>
              <span className="font-mono font-semibold text-slate-200">{weightedAvgCarbon} gCO2/kWh</span>
            </div>

            {/* Visual Carbon Spectrum Needle Bar */}
            <div className="mt-3 space-y-1">
              <div className="relative h-2 w-full rounded-full bg-gradient-to-r from-emerald-500 via-amber-500 via-orange-500 to-rose-600 overflow-hidden shadow-inner">
                {/* Needle Indicator Marker */}
                <div 
                  className="absolute top-0 bottom-0 w-2 -ml-1 bg-white border border-slate-900 rounded-full shadow-lg transform transition-all duration-500"
                  style={{ left: `${spectrumPercent}%` }}
                  title={`Global Average: ${globalAvgCarbon} gCO2/kWh`}
                />
              </div>
              <div className="flex justify-between text-[9px] font-mono text-slate-500">
                <span>0g (Clean)</span>
                <span>150g</span>
                <span>300g</span>
                <span>600g+</span>
              </div>
            </div>
          </div>

          {/* Card 2: Total Monitored Global Demand */}
          <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-cyan-500/30 transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Total Monitored Demand
              </span>
              <Zap className="w-4 h-4 text-cyan-400" />
            </div>

            <div className="mt-2 flex items-baseline gap-2">
              <div className="font-mono text-3xl font-extrabold tracking-tight text-white flex items-baseline gap-1">
                <span className="text-cyan-400">{(totalMonitoredDemandMw / 1000).toFixed(1)}</span>
                <span className="text-xs font-normal text-slate-400 font-sans">GW Load</span>
              </div>
            </div>

            <div className="mt-1 text-xs text-slate-400 flex items-center justify-between">
              <span>Installed Fleet:</span>
              <span className="font-mono font-semibold text-slate-200">{(totalPeakCapacityMw / 1000).toFixed(1)} GW</span>
            </div>

            <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
              <span className="text-slate-400">Active Reserves:</span>
              <span className="font-mono text-cyan-300 font-semibold">
                {Math.round(((totalPeakCapacityMw - totalMonitoredDemandMw) / totalPeakCapacityMw) * 100)}% Headroom
              </span>
            </div>
          </div>

          {/* Card 3: Global Clean Energy Share */}
          <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-emerald-500/30 transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Global Clean Share
              </span>
              <Sparkles className="w-4 h-4 text-emerald-400" />
            </div>

            <div className="mt-2 flex items-baseline gap-2">
              <div className="font-mono text-3xl font-extrabold tracking-tight text-white flex items-baseline gap-1">
                <span className="text-emerald-400">{globalAvgCleanPct}%</span>
                <span className="text-xs font-normal text-slate-400 font-sans">Zero-Carbon</span>
              </div>
            </div>

            <div className="mt-1 text-xs text-slate-400 flex items-center justify-between">
              <span>Primary Fleet:</span>
              <span className="text-slate-200 font-medium">Hydro, Nuclear, Wind, PV</span>
            </div>

            {/* Progress bar */}
            <div className="mt-3 space-y-1">
              <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-emerald-500 to-cyan-400 rounded-full transition-all duration-500"
                  style={{ width: `${globalAvgCleanPct}%` }}
                />
              </div>
              <div className="flex justify-between text-[9px] font-mono text-slate-500">
                <span>Fossil: {100 - globalAvgCleanPct}%</span>
                <span>Clean: {globalAvgCleanPct}%</span>
              </div>
            </div>
          </div>

          {/* Card 4: Grid Extremes & Arbitrage Spread */}
          <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-indigo-500/30 transition-colors flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  Global Intensity Spread
                </span>
                <TrendingUp className="w-4 h-4 text-indigo-400" />
              </div>

              <div className="mt-2 space-y-1.5 text-xs">
                <button
                  onClick={() => onSelectRegion(cleanestRegion.id)}
                  className="w-full flex items-center justify-between p-1.5 rounded-lg bg-emerald-950/40 hover:bg-emerald-900/40 border border-emerald-800/40 transition-colors text-left"
                >
                  <span className="flex items-center gap-1.5 text-emerald-300 font-medium">
                    <span>{cleanestRegion.flag}</span>
                    <span className="truncate max-w-[110px]">{cleanestRegion.name.split(' ')[0]}</span>
                  </span>
                  <span className="font-mono font-bold text-emerald-400">{cleanestRegion.carbonIntensity}g</span>
                </button>

                <button
                  onClick={() => onSelectRegion(highestCarbonRegion.id)}
                  className="w-full flex items-center justify-between p-1.5 rounded-lg bg-rose-950/40 hover:bg-rose-900/40 border border-rose-800/40 transition-colors text-left"
                >
                  <span className="flex items-center gap-1.5 text-rose-300 font-medium">
                    <span>{highestCarbonRegion.flag}</span>
                    <span className="truncate max-w-[110px]">{highestCarbonRegion.name.split(' ')[0]}</span>
                  </span>
                  <span className="font-mono font-bold text-rose-400">{highestCarbonRegion.carbonIntensity}g</span>
                </button>
              </div>
            </div>

            <div className="mt-2 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400 font-mono">
              <span>Arbitrage Delta:</span>
              <span className="text-indigo-300 font-bold">
                Δ {highestCarbonRegion.carbonIntensity - cleanestRegion.carbonIntensity} gCO2
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Map Control Bar */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 p-4 rounded-xl bg-slate-900/80 border border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Globe className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <span>Global Electricity Grid Network</span>
              <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-cyan-950 border border-cyan-800 text-cyan-400">
                {mapMode === '3d_globe' ? '3D Spherical Globe Active' : '2D Planar Projection'}
              </span>
            </h2>
            <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
              <span>{filteredRegions.length} of {regions.length} power systems displayed</span>
              <span aria-hidden="true">·</span>
              <span>Drag to rotate 3D Earth</span>
              <span aria-hidden="true">·</span>
              <span>Sub-second telemetry lock</span>
            </div>
          </div>
        </div>

        {/* View Mode & Filter Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Mode Switcher: 3D Globe vs 2D Flat Map */}
          <div className="flex items-center p-1 bg-slate-950 rounded-lg border border-slate-800 text-xs font-medium">
            <button
              onClick={() => setMapMode('3d_globe')}
              className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-colors whitespace-nowrap ${
                mapMode === '3d_globe'
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 font-semibold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              <span>3D Globe</span>
            </button>
            <button
              onClick={() => setMapMode('2d_map')}
              className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-colors whitespace-nowrap ${
                mapMode === '2d_map'
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 font-semibold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <MapIcon className="w-3.5 h-3.5" />
              <span>2D Flat Map</span>
            </button>
          </div>

          {/* Metric Selector */}
          <div className="flex items-center p-1 bg-slate-950 rounded-lg border border-slate-800 text-xs">
            <button
              onClick={() => setMetricView('carbon')}
              className={`px-2.5 py-1.5 font-medium rounded-md transition-colors whitespace-nowrap ${
                metricView === 'carbon' ? 'bg-emerald-500/20 text-emerald-400 font-semibold' : 'text-slate-400 hover:text-white'
              }`}
            >
              Carbon Intensity
            </button>
            <button
              onClick={() => setMetricView('price')}
              className={`px-2.5 py-1.5 font-medium rounded-md transition-colors whitespace-nowrap ${
                metricView === 'price' ? 'bg-cyan-500/20 text-cyan-400 font-semibold' : 'text-slate-400 hover:text-white'
              }`}
            >
              Price ($)
            </button>
            <button
              onClick={() => setMetricView('clean')}
              className={`px-2.5 py-1.5 font-medium rounded-md transition-colors whitespace-nowrap ${
                metricView === 'clean' ? 'bg-indigo-500/20 text-indigo-400 font-semibold' : 'text-slate-400 hover:text-white'
              }`}
            >
              Clean %
            </button>
          </div>

          {/* Continent Filter */}
          <div className="flex items-center gap-1 text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedContinent}
              onChange={(e) => setSelectedContinent(e.target.value)}
              className="bg-slate-950 border border-slate-800 text-slate-300 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-emerald-500"
              aria-label="Filter grids by continent"
            >
              <option value="all">All Continents</option>
              <option value="Asia">Asia (🇵🇰 Pakistan, 🇮🇳 India, 🇯🇵 Japan, 🇸🇬 Singapore)</option>
              <option value="Europe">Europe (🇬🇧 UK, 🇳🇴 Nordics, 🇫🇷 France, 🇩🇪 Germany)</option>
              <option value="North America">North America (🇺🇸 CAISO, ERCOT, PJM)</option>
              <option value="Latin America">Latin America (🇧🇷 Brazil)</option>
              <option value="Asia-Pacific">Australia (🇦🇺 NEM)</option>
            </select>
          </div>

          {/* Search Box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search Pakistan, CAISO, UK..."
              className="bg-slate-950 border border-slate-800 text-slate-200 text-xs pl-8 pr-3 py-1.5 rounded-lg w-32 sm:w-44 focus:outline-none focus:border-emerald-500 placeholder-slate-500"
            />
          </div>
        </div>
      </div>

      {/* Main Map Viewport (3D Globe Structure or 2D Flat Map) */}
      {mapMode === '3d_globe' ? (
        <GlobeView
          regions={filteredRegions}
          selectedRegionId={selectedRegionId}
          metricView={metricView}
          onSelectRegion={onSelectRegion}
          onOpenObservatory={onOpenObservatory}
        />
      ) : (
        /* 2D Planar SVG Map */
        <div className="relative rounded-2xl bg-slate-950 border border-slate-800/80 p-4 lg:p-6 overflow-hidden">
          <div 
            className="absolute inset-0 opacity-[0.03] pointer-events-none"
            style={{
              backgroundImage: `radial-gradient(#ffffff 1px, transparent 1px)`,
              backgroundSize: '24px 24px',
            }}
          />

          <div className="relative aspect-[16/9] max-h-[560px] w-full flex items-center justify-center">
            <svg
              viewBox="0 0 1000 600"
              className="w-full h-full select-none"
              aria-label="Global Electricity Grid Observability Map"
            >
              <defs>
                <radialGradient id="oceanGlow2" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#0B132B" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#020617" stopOpacity="0" />
                </radialGradient>
              </defs>

              <rect width="1000" height="600" fill="url(#oceanGlow2)" />

              {/* Landmass Outlines */}
              <g fill="#0F172A" stroke="#1E293B" strokeWidth="1" opacity="0.85">
                <path d="M 120 100 Q 180 80, 260 90 Q 320 120, 310 180 Q 340 220, 320 280 Q 280 320, 240 330 Q 180 340, 160 260 Q 120 200, 100 150 Z" />
                <path d="M 280 340 Q 380 360, 410 440 Q 380 540, 320 570 Q 290 530, 280 430 Q 260 380, 280 340 Z" />
                <path d="M 460 120 Q 560 110, 580 180 Q 540 240, 480 260 Q 440 220, 450 160 Z" />
                <path d="M 460 270 Q 560 260, 580 350 Q 560 480, 500 510 Q 440 450, 430 350 Q 430 300, 460 270 Z" />
                <path d="M 590 120 Q 750 100, 840 180 Q 860 280, 780 340 Q 680 320, 620 260 Q 580 180, 590 120 Z" />
                <path d="M 760 440 Q 860 420, 880 490 Q 850 560, 780 540 Q 740 500, 760 440 Z" />
                <path d="M 470 170 Q 495 160, 500 205 Q 480 220, 470 170 Z" fill="#132338" stroke="#334155" />
                <path d="M 785 240 Q 815 270, 800 310 Q 780 280, 785 240 Z" fill="#132338" stroke="#334155" />
                {/* Pakistan & South Asian Subcontinent */}
                <path d="M 640 260 Q 670 280, 710 310 Q 720 350, 680 370 Q 650 330, 640 260 Z" fill="#132338" stroke="#334155" />
              </g>

              {/* Interconnector Lines */}
              <g stroke="#06B6D4" strokeWidth="1.5" strokeDasharray="4 4" opacity="0.6">
                <line x1="485" y1="195" x2="490" y2="245" />
                <line x1="485" y1="195" x2="535" y2="145" />
                <line x1="520" y1="220" x2="535" y2="145" />
                <line x1="195" y1="260" x2="260" y2="300" stroke="#F59E0B" />
                <line x1="305" y1="265" x2="260" y2="300" stroke="#94A3B8" />
                {/* Asian Synchronous Corridors */}
                <line x1="655" y1="295" x2="695" y2="330" stroke="#10B981" />
                <line x1="695" y1="330" x2="745" y2="405" stroke="#06B6D4" />
                <line x1="745" y1="405" x2="795" y2="280" stroke="#8B5CF6" />
                <line x1="655" y1="295" x2="600" y2="260" stroke="#F59E0B" strokeDasharray="3 3" />
              </g>

              {/* Pins */}
              {filteredRegions.map((region) => {
                const { x, y } = region.coordinates;
                const isSelected = region.id === selectedRegionId;
                const isHovered = region.id === hoveredRegionId;
                const { fill } = getNodeColor(region);

                return (
                  <g
                    key={region.id}
                    transform={`translate(${x}, ${y})`}
                    className="cursor-pointer"
                    onMouseEnter={() => setHoveredRegionId(region.id)}
                    onMouseLeave={() => setHoveredRegionId(null)}
                    onClick={() => {
                      onSelectRegion(region.id);
                      onOpenObservatory(region.id);
                    }}
                  >
                    {(isSelected || isHovered) && (
                      <circle r="18" fill="none" stroke={fill} strokeWidth="2" opacity="0.4" />
                    )}
                    <circle r={isSelected ? "14" : "10"} fill={fill} fillOpacity="0.2" stroke={fill} strokeWidth={isSelected ? "2" : "1"} />
                    <circle r="6" fill={fill} stroke="#020617" strokeWidth="1.5" />
                    <text x="14" y="1" fill="#FFFFFF" fontSize="11" fontWeight="700">
                      {region.flag} {region.country}
                    </text>
                    <text x="14" y="13" fill="#94A3B8" fontSize="9">
                      {region.name}
                    </text>
                    <text x="14" y="25" fill={fill} fontSize="9" fontFamily="JetBrains Mono, monospace" fontWeight="600">
                      {metricView === 'carbon' && `${region.carbonIntensity} gCO2/kWh`}
                      {metricView === 'price' && `$${region.priceInUsdPerMwh}/MWh`}
                      {metricView === 'clean' && `${region.cleanEnergyPercentage}% Clean`}
                    </text>
                  </g>
                );
              })}
            </svg>

            {/* Hover Card */}
            {hoveredRegion && (
              <div className="absolute bottom-4 left-4 p-4 rounded-xl bg-slate-900/95 border border-slate-700/80 backdrop-blur-md shadow-2xl max-w-sm w-full">
                <div className="flex items-start justify-between gap-3 pb-2 border-b border-slate-800">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{hoveredRegion.flag}</span>
                      <h3 className="text-sm font-bold text-white">{hoveredRegion.name}</h3>
                    </div>
                    <div className="text-xs text-slate-400 mt-0.5">{hoveredRegion.gridOperator}</div>
                  </div>
                  <button
                    onClick={() => onOpenObservatory(hoveredRegion.id)}
                    className="px-2.5 py-1 text-xs font-semibold bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded flex items-center gap-1 transition-colors"
                  >
                    <span>Open</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2 mt-3 pt-1 text-xs">
                  <div className="p-2 rounded bg-slate-950/80 border border-slate-800">
                    <div className="text-[10px] text-slate-400 uppercase tracking-wider">Carbon Intensity</div>
                    <div className="font-mono text-sm font-bold text-emerald-400 mt-0.5">
                      {hoveredRegion.carbonIntensity} <span className="text-[10px] text-slate-400">gCO2/kWh</span>
                    </div>
                  </div>
                  <div className="p-2 rounded bg-slate-950/80 border border-slate-800">
                    <div className="text-[10px] text-slate-400 uppercase tracking-wider">Wholesale Price</div>
                    <div className="font-mono text-sm font-bold text-cyan-400 mt-0.5">
                      {formatCurrency(hoveredRegion.wholesalePricePerMwh, hoveredRegion.currencySymbol)}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
