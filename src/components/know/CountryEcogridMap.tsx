import React, { useState, useEffect, useMemo, useRef } from 'react';
import { CountryGridDetails, PowerPlantNode, TransmissionLine, GridZoneBoundary, HourlyGridSnapshot } from '../../types/countryGridMap.ts';
import { getCountryGridDetails } from '../../data/countryGridData.ts';
import { formatPower, formatCarbon, formatPercentage } from '../../utils/formatters.ts';
import { 
  Zap, 
  Activity, 
  Play, 
  Pause, 
  RotateCcw, 
  Clock, 
  Layers, 
  Info, 
  Sliders, 
  CheckCircle, 
  Radio, 
  ArrowRight,
  TrendingDown,
  TrendingUp,
  MapPin,
  ExternalLink,
  Flame,
  Droplet,
  Sun,
  Wind,
  Atom,
  Cpu
} from 'lucide-react';

interface CountryEcogridMapProps {
  countryId: string;
  countryName: string;
  flag: string;
  isDarkMode: boolean;
  onOpenObservatory?: (id: string) => void;
}

export const CountryEcogridMap: React.FC<CountryEcogridMapProps> = ({
  countryId,
  countryName,
  flag,
  isDarkMode,
}) => {
  const gridData = useMemo(() => getCountryGridDetails(countryId), [countryId]);
  
  // Scrubber state (0-23 hours)
  const [selectedHour, setSelectedHour] = useState<number>(() => new Date().getHours());
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const playTimerRef = useRef<number | null>(null);

  // Active layers
  const [showTransmission, setShowTransmission] = useState<boolean>(true);
  const [showPowerPlants, setShowPowerPlants] = useState<boolean>(true);
  const [showZones, setShowZones] = useState<boolean>(true);
  const [selectedFuelFilter, setSelectedFuelFilter] = useState<string>('all');
  // Interactive hover/selection popup
  const [hoveredPlant, setHoveredPlant] = useState<PowerPlantNode | null>(null);
  const [hoveredLine, setHoveredLine] = useState<TransmissionLine | null>(null);
  const [selectedZone, setSelectedZone] = useState<GridZoneBoundary | null>(null);

  // Reset popups when switching countries
  useEffect(() => {
    setHoveredPlant(null);
    setHoveredLine(null);
    setSelectedZone(null);
  }, [countryId]);

  // Auto-play interval for ElectricityMaps hourly timeline
  useEffect(() => {
    if (isPlaying) {
      playTimerRef.current = window.setInterval(() => {
        setSelectedHour(prev => (prev + 1) % 24);
      }, 1200);
    } else if (playTimerRef.current) {
      clearInterval(playTimerRef.current);
    }
    return () => {
      if (playTimerRef.current) clearInterval(playTimerRef.current);
    };
  }, [isPlaying]);

  const currentSnapshot = useMemo(() => {
    const list = gridData.hourlyTimeline;
    return list.find(s => s.hour === selectedHour) || list[0] || {
      hour: selectedHour,
      label: `${selectedHour}:00`,
      demandMw: 22800,
      carbonIntensity: 335,
      cleanPct: 51,
      renewablePct: 35,
      generationMix: {},
      spotPrice: 102.0,
    };
  }, [gridData, selectedHour]);

  // Fuel icons helper
  const getFuelIcon = (fuel: string) => {
    switch (fuel) {
      case 'hydro': return <Droplet className="w-3.5 h-3.5 text-blue-400" />;
      case 'nuclear': return <Atom className="w-3.5 h-3.5 text-purple-400" />;
      case 'solar': return <Sun className="w-3.5 h-3.5 text-amber-400" />;
      case 'wind': return <Wind className="w-3.5 h-3.5 text-cyan-400" />;
      case 'coal': return <Flame className="w-3.5 h-3.5 text-slate-400" />;
      case 'gas': return <Flame className="w-3.5 h-3.5 text-rose-400" />;
      default: return <Zap className="w-3.5 h-3.5 text-emerald-400" />;
    }
  };

  const filteredPlants = useMemo(() => {
    if (selectedFuelFilter === 'all') return gridData.powerPlants;
    return gridData.powerPlants.filter(p => p.fuel === selectedFuelFilter);
  }, [gridData.powerPlants, selectedFuelFilter]);

  const isPakistan = countryId === 'pk-ntdc' || countryName.toLowerCase().includes('pakistan');

  return (
    <div className={`rounded-3xl border transition-colors duration-300 overflow-hidden shadow-xl ${
      isDarkMode 
        ? 'bg-[#161617]/90 border-white/[0.12] text-[#f5f5f7]' 
        : 'bg-white/90 border-black/[0.08] text-[#1d1d1f]'
    } backdrop-blur-xl`}>
      
      {/* ========================================================================= */}
      {/* 1. Header: Country Title, Live ElectricityMaps Status, and Superpower.pk badge */}
      {/* ========================================================================= */}
      <div className={`p-6 border-b flex flex-col md:flex-row md:items-center justify-between gap-4 ${
        isDarkMode ? 'border-white/[0.08]' : 'border-black/[0.06]'
      }`}>
        <div className="flex items-center gap-3.5">
          <span className="text-4xl filter drop-shadow-sm">{flag}</span>
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-xl font-bold tracking-tight">
                {countryName} National Ecogrid
              </h2>
              {isPakistan && (
                <a 
                  href="https://superpower.pk/" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className={`text-[11px] font-semibold px-2.5 py-1 rounded-full flex items-center gap-1.5 transition-all hover:opacity-90 ${
                    isDarkMode 
                      ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' 
                      : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  }`}
                  title="Verified live feed with Superpower.pk / NTDC SCADA data"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Superpower.pk Synced</span>
                  <ExternalLink className="w-3 h-3 ml-0.5 opacity-60" />
                </a>
              )}
            </div>
            <p className={`text-xs mt-0.5 ${isDarkMode ? 'text-[#a1a1a6]' : 'text-[#86868b]'}`}>
              {gridData.transmissionBackbone} · {gridData.gridOperator}
            </p>
          </div>
        </div>

        {/* Real-time telemetry badges (Current Hour Scrub State) */}
        <div className="flex flex-wrap items-center gap-3">
          <div className={`px-3.5 py-2 rounded-2xl border flex items-center gap-3 ${
            isDarkMode ? 'bg-[#1c1c1e] border-white/[0.08]' : 'bg-[#f5f5f7] border-black/[0.06]'
          }`}>
            <div>
              <div className={`text-[10px] uppercase font-semibold tracking-wider ${
                isDarkMode ? 'text-[#a1a1a6]' : 'text-[#86868b]'
              }`}>
                Demand @ {currentSnapshot.label}
              </div>
              <div className="text-base font-bold font-mono tracking-tight text-cyan-400">
                {formatPower(currentSnapshot.demandMw)}
              </div>
            </div>
            <div className="w-px h-7 bg-current opacity-15" />
            <div>
              <div className={`text-[10px] uppercase font-semibold tracking-wider ${
                isDarkMode ? 'text-[#a1a1a6]' : 'text-[#86868b]'
              }`}>
                Carbon Intensity
              </div>
              <div className={`text-base font-bold font-mono tracking-tight ${
                currentSnapshot.carbonIntensity < 150 ? 'text-emerald-400' :
                currentSnapshot.carbonIntensity < 350 ? 'text-amber-400' : 'text-rose-400'
              }`}>
                {currentSnapshot.carbonIntensity} <span className="text-xs font-normal">gCO2/kWh</span>
              </div>
            </div>
            <div className="w-px h-7 bg-current opacity-15" />
            <div>
              <div className={`text-[10px] uppercase font-semibold tracking-wider ${
                isDarkMode ? 'text-[#a1a1a6]' : 'text-[#86868b]'
              }`}>
                Clean Share
              </div>
              <div className="text-base font-bold font-mono tracking-tight text-emerald-400">
                {currentSnapshot.cleanPct}%
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. Main Stage: Interactive Animated SVG Transmission Grid & Lighting Map */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 relative">
        
        {/* Left 8-9 cols: SVG Map Canvas with Electrical Lighting */}
        <div className="lg:col-span-8 p-4 sm:p-6 relative flex flex-col items-center justify-center min-h-[440px] select-none">
          
          {/* Layer toggles floating bar (Apple Cupertino style) */}
          <div className="absolute top-5 left-5 z-20 flex flex-wrap items-center gap-1.5 p-1.5 rounded-xl border backdrop-blur-md text-xs shadow-sm"
            style={{
              backgroundColor: isDarkMode ? 'rgba(28,28,30,0.85)' : 'rgba(255,255,255,0.85)',
              borderColor: isDarkMode ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)'
            }}
          >
            <button
              onClick={() => setShowTransmission(!showTransmission)}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all flex items-center gap-1.5 ${
                showTransmission 
                  ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' 
                  : 'opacity-60 hover:opacity-100'
              }`}
            >
              <Zap className="w-3 h-3" />
              <span>Grid Lines</span>
            </button>
            <button
              onClick={() => setShowPowerPlants(!showPowerPlants)}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all flex items-center gap-1.5 ${
                showPowerPlants 
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                  : 'opacity-60 hover:opacity-100'
              }`}
            >
              <Activity className="w-3 h-3" />
              <span>Power Plants</span>
            </button>
            <button
              onClick={() => setShowZones(!showZones)}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all flex items-center gap-1.5 ${
                showZones 
                  ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' 
                  : 'opacity-60 hover:opacity-100'
              }`}
            >
              <Layers className="w-3 h-3" />
              <span>Zones / DISCOs</span>
            </button>
          </div>

          {/* SVG Map Graphic */}
          <svg
            viewBox={gridData.mapViewBox}
            className="w-full max-h-[500px] h-auto transition-transform duration-300"
            style={{ filter: isDarkMode ? 'drop-shadow(0 0 25px rgba(6,182,212,0.08))' : 'drop-shadow(0 4px 16px rgba(0,0,0,0.05))' }}
          >
            <defs>
              {/* Radial glow filter for high-voltage lighting */}
              <filter id="electricGlow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3.5" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>

              {/* Pulsing linear gradients for transmission cables */}
              <linearGradient id="hvdcGradient" x1="0%" y1="100%" x2="0%" y2="0%">
                <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.9" />
                <stop offset="50%" stopColor="#38bdf8" stopOpacity="1" />
                <stop offset="100%" stopColor="#10b981" stopOpacity="0.9" />
              </linearGradient>

              {/* Subtle grid pattern background */}
              <pattern id="radarGrid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path 
                  d="M 40 0 L 0 0 0 40" 
                  fill="none" 
                  stroke={isDarkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)'} 
                  strokeWidth="1" 
                />
              </pattern>
            </defs>

            {/* Radar Background */}
            <rect width="100%" height="100%" fill="url(#radarGrid)" />

            {/* 1. Regional Zones / DISCOs Polygons */}
            {showZones && gridData.zones.map((zone) => {
              const isSelected = selectedZone?.id === zone.id;
              return (
                <g key={zone.id} className="cursor-pointer transition-opacity duration-200">
                  <path
                    d={zone.pathD}
                    fill={zone.fillColor || '#3b82f6'}
                    fillOpacity={isSelected ? 0.35 : isDarkMode ? 0.12 : 0.08}
                    stroke={zone.fillColor || '#3b82f6'}
                    strokeWidth={isSelected ? 2.5 : 1.2}
                    strokeOpacity={isDarkMode ? 0.5 : 0.4}
                    strokeDasharray="4 2"
                    onClick={() => setSelectedZone(isSelected ? null : zone)}
                    className="hover:fill-opacity-25 transition-all"
                  />
                  {/* Zone Label */}
                  <text
                    x={zone.shortCode === 'PUNJAB' ? 360 : zone.shortCode === 'SINDH' ? 290 : zone.shortCode === 'KP' ? 270 : zone.shortCode === 'BALOCHISTAN' ? 160 : 380}
                    y={zone.shortCode === 'PUNJAB' ? 310 : zone.shortCode === 'SINDH' ? 470 : zone.shortCode === 'KP' ? 190 : zone.shortCode === 'BALOCHISTAN' ? 380 : 130}
                    textAnchor="middle"
                    fill={isDarkMode ? '#94a3b8' : '#64748b'}
                    fontSize="11"
                    fontWeight="600"
                    fontFamily="system-ui"
                    opacity="0.8"
                    pointerEvents="none"
                  >
                    {zone.shortCode}
                  </text>
                </g>
              );
            })}

            {/* 2. Transmission Grid Lighting Lines */}
            {showTransmission && gridData.transmissionLines.map((line) => {
              const isHovered = hoveredLine?.id === line.id;
              const isHvdc = line.isHvdc;
              return (
                <g 
                  key={line.id} 
                  className="cursor-pointer group"
                  onMouseEnter={() => setHoveredLine(line)}
                  onMouseLeave={() => setHoveredLine(null)}
                >
                  {/* Glow Aura underlay */}
                  <path
                    d={line.pathD}
                    fill="none"
                    stroke={isHvdc ? '#06b6d4' : line.color || '#10b981'}
                    strokeWidth={isHovered ? 8 : isHvdc ? 6 : 4}
                    strokeOpacity={isHovered ? 0.45 : isHvdc ? 0.35 : 0.2}
                    filter="url(#electricGlow)"
                    className="transition-all duration-200"
                  />

                  {/* Core Solid Conductor */}
                  <path
                    d={line.pathD}
                    fill="none"
                    stroke={isHvdc ? 'url(#hvdcGradient)' : line.color || '#10b981'}
                    strokeWidth={isHvdc ? 2.8 : 2.0}
                    strokeLinecap="round"
                    className="transition-all"
                  />

                  {/* Animated Electric Lighting Pulse (Dashed Current Flow) */}
                  <path
                    d={line.pathD}
                    fill="none"
                    stroke="#ffffff"
                    strokeWidth={isHvdc ? 2.2 : 1.5}
                    strokeDasharray={isHvdc ? "8 14" : "5 10"}
                    strokeOpacity={isDarkMode ? 0.95 : 0.85}
                    className="animate-electric-flow pointer-events-none"
                    style={{
                      animation: isHvdc ? 'electricFlow 1.8s linear infinite' : 'electricFlow 2.8s linear infinite',
                    }}
                  />
                </g>
              );
            })}

            {/* 3. Power Generation Station Nodes with Pulsing Glow */}
            {showPowerPlants && filteredPlants.map((plant) => {
              const isHovered = hoveredPlant?.id === plant.id;
              const isClean = plant.co2Factor === 0;
              const fuelColor = 
                plant.fuel === 'hydro' ? '#3b82f6' :
                plant.fuel === 'nuclear' ? '#8b5cf6' :
                plant.fuel === 'solar' ? '#f59e0b' :
                plant.fuel === 'wind' ? '#06b6d4' :
                plant.fuel === 'storage' ? '#ec4899' :
                plant.fuel === 'coal' ? '#64748b' : '#ef4444';

              return (
                <g 
                  key={plant.id}
                  className="cursor-pointer group"
                  onMouseEnter={() => setHoveredPlant(plant)}
                  onMouseLeave={() => setHoveredPlant(null)}
                  onClick={() => setHoveredPlant(plant)}
                >
                  {/* Pulsing Radial Halo */}
                  <circle
                    cx={plant.cx}
                    cy={plant.cy}
                    r={isHovered ? 16 : 10}
                    fill={fuelColor}
                    fillOpacity={isHovered ? 0.4 : 0.2}
                    className="animate-ping pointer-events-none"
                    style={{ animationDuration: '3s' }}
                  />

                  {/* Outer Ring */}
                  <circle
                    cx={plant.cx}
                    cy={plant.cy}
                    r={isHovered ? 9 : 6.5}
                    fill={isDarkMode ? '#0f172a' : '#ffffff'}
                    stroke={fuelColor}
                    strokeWidth={isHovered ? 3 : 2}
                  />

                  {/* Center Core Dot */}
                  <circle
                    cx={plant.cx}
                    cy={plant.cy}
                    r={isHovered ? 4.5 : 3}
                    fill={fuelColor}
                  />

                  {/* Plant Micro-Label on hover or prominent plant */}
                  {(isHovered || plant.capacityMw >= 2000) && (
                    <text
                      x={plant.cx}
                      y={plant.cy - 12}
                      textAnchor="middle"
                      fill={isDarkMode ? '#f8fafc' : '#0f172a'}
                      fontSize="9.5"
                      fontWeight="bold"
                      fontFamily="system-ui"
                      className="pointer-events-none drop-shadow-md"
                    >
                      {plant.name.split(' ')[0]} ({formatPower(plant.capacityMw)})
                    </text>
                  )}
                </g>
              );
            })}
          </svg>

          {/* Floating Hover/Click Details Popup (Apple Style Glassmorphic Card) */}
          {(hoveredPlant || hoveredLine || selectedZone) && (
            <div className={`absolute bottom-5 left-5 right-5 sm:left-auto sm:right-5 sm:max-w-sm p-4 rounded-2xl border shadow-2xl backdrop-blur-xl z-30 transition-all ${
              isDarkMode ? 'bg-[#1c1c1e]/95 border-white/[0.15]' : 'bg-white/95 border-black/[0.1]'
            }`}>
              {hoveredPlant && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 text-cyan-400">
                      {getFuelIcon(hoveredPlant.fuel)}
                      <span>{hoveredPlant.fuel} Station</span>
                    </span>
                    <button 
                      onClick={() => setHoveredPlant(null)}
                      className="text-xs opacity-60 hover:opacity-100"
                    >
                      ✕
                    </button>
                  </div>
                  <h4 className="text-sm font-bold leading-tight">{hoveredPlant.name}</h4>
                  <div className="grid grid-cols-2 gap-2 text-xs pt-1 font-mono">
                    <div className={`p-2 rounded-xl ${isDarkMode ? 'bg-white/[0.05]' : 'bg-black/[0.03]'}`}>
                      <div className={`text-[10px] ${isDarkMode ? 'text-[#a1a1a6]' : 'text-[#86868b]'}`}>Output</div>
                      <div className="font-bold text-emerald-400">{formatPower(hoveredPlant.currentOutputMw)}</div>
                    </div>
                    <div className={`p-2 rounded-xl ${isDarkMode ? 'bg-white/[0.05]' : 'bg-black/[0.03]'}`}>
                      <div className={`text-[10px] ${isDarkMode ? 'text-[#a1a1a6]' : 'text-[#86868b]'}`}>Nameplate</div>
                      <div className="font-bold">{formatPower(hoveredPlant.capacityMw)}</div>
                    </div>
                  </div>
                  {hoveredPlant.description && (
                    <p className={`text-[11px] leading-relaxed pt-1 ${isDarkMode ? 'text-[#a1a1a6]' : 'text-[#86868b]'}`}>
                      {hoveredPlant.description}
                    </p>
                  )}
                  <div className={`text-[10px] flex items-center justify-between pt-1 border-t ${
                    isDarkMode ? 'border-white/[0.08]' : 'border-black/[0.06]'
                  }`}>
                    <span>Operator: {hoveredPlant.operator || 'National System'}</span>
                    <span>CO2: {hoveredPlant.co2Factor} g/kWh</span>
                  </div>
                </div>
              )}

              {!hoveredPlant && hoveredLine && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1">
                      <Zap className="w-3 h-3" />
                      <span>{hoveredLine.voltage} Transmission</span>
                    </span>
                    <button onClick={() => setHoveredLine(null)} className="text-xs opacity-60 hover:opacity-100">✕</button>
                  </div>
                  <h4 className="text-sm font-bold leading-tight">{hoveredLine.name}</h4>
                  <div className="grid grid-cols-2 gap-2 text-xs pt-1 font-mono">
                    <div className={`p-2 rounded-xl ${isDarkMode ? 'bg-white/[0.05]' : 'bg-black/[0.03]'}`}>
                      <div className={`text-[10px] ${isDarkMode ? 'text-[#a1a1a6]' : 'text-[#86868b]'}`}>Current Flow</div>
                      <div className="font-bold text-cyan-400">{formatPower(hoveredLine.currentFlowMw)}</div>
                    </div>
                    <div className={`p-2 rounded-xl ${isDarkMode ? 'bg-white/[0.05]' : 'bg-black/[0.03]'}`}>
                      <div className={`text-[10px] ${isDarkMode ? 'text-[#a1a1a6]' : 'text-[#86868b]'}`}>Thermal Limit</div>
                      <div className="font-bold">{formatPower(hoveredLine.capacityMw)}</div>
                    </div>
                  </div>
                  <div className={`text-[11px] ${isDarkMode ? 'text-[#a1a1a6]' : 'text-[#86868b]'}`}>
                    From: {hoveredLine.fromNode} <br />
                    To: {hoveredLine.toNode}
                  </div>
                </div>
              )}

              {!hoveredPlant && !hoveredLine && selectedZone && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-purple-400">Dispatch Zone</span>
                    <button onClick={() => setSelectedZone(null)} className="text-xs opacity-60 hover:opacity-100">✕</button>
                  </div>
                  <h4 className="text-sm font-bold">{selectedZone.name}</h4>
                  <div className="text-xs font-mono">
                    Demand: <span className="font-bold text-emerald-400">{formatPower(selectedZone.currentDemandMw)}</span> ({selectedZone.demandSharePct}% of national load)
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right 4 cols: ElectricityMaps Real-time Generation Mix & Telemetry Deck */}
        <div className={`lg:col-span-4 p-5 border-t lg:border-t-0 lg:border-l flex flex-col justify-between gap-5 ${
          isDarkMode ? 'border-white/[0.08] bg-[#1a1a1c]/40' : 'border-black/[0.06] bg-[#fafafa]/60'
        }`}>
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-current border-opacity-10">
              <div>
                <h3 className="text-sm font-bold tracking-tight">Electricity Breakdown</h3>
                <span className={`text-[11px] ${isDarkMode ? 'text-[#a1a1a6]' : 'text-[#86868b]'}`}>
                  Snapshot @ {currentSnapshot.label} (Hourly)
                </span>
              </div>
              <div className="text-right font-mono">
                <span className="text-xs font-bold text-emerald-400">{currentSnapshot.cleanPct}% Clean</span>
              </div>
            </div>

            {/* Stacked generation bar */}
            <div className="mt-3.5 h-3.5 w-full rounded-full overflow-hidden flex bg-slate-900 border border-white/[0.08]">
              {Object.entries(currentSnapshot.generationMix).map(([fuel, mw]) => {
                const total = currentSnapshot.demandMw || 1;
                const pct = Math.round((mw / total) * 100);
                if (pct <= 0) return null;
                const color = 
                  fuel === 'hydro' ? '#3b82f6' :
                  fuel === 'nuclear' ? '#8b5cf6' :
                  fuel === 'solar' ? '#f59e0b' :
                  fuel === 'wind' ? '#06b6d4' :
                  fuel === 'storage' ? '#ec4899' :
                  fuel === 'coal' ? '#475569' :
                  fuel === 'gas' ? '#ef4444' : '#10b981';

                return (
                  <div
                    key={fuel}
                    style={{ width: `${pct}%`, backgroundColor: color }}
                    title={`${fuel}: ${pct}% (${mw} MW)`}
                    className="h-full transition-all duration-300"
                  />
                );
              })}
            </div>

            {/* Detailed Generation Mix Table */}
            <div className="mt-4 space-y-1.5">
              {Object.entries(currentSnapshot.generationMix).map(([fuel, mw]) => {
                const total = currentSnapshot.demandMw || 1;
                const pct = Math.round((mw / total) * 100);
                return (
                  <div
                    key={fuel}
                    className={`flex items-center justify-between p-2 rounded-xl text-xs transition-colors ${
                      isDarkMode ? 'hover:bg-white/[0.04]' : 'hover:bg-black/[0.03]'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {getFuelIcon(fuel)}
                      <span className="capitalize font-medium">{fuel}</span>
                    </div>
                    <div className="flex items-center gap-3 font-mono">
                      <span className="font-bold">{formatPower(mw)}</span>
                      <span className={`text-[11px] w-9 text-right ${isDarkMode ? 'text-[#a1a1a6]' : 'text-[#86868b]'}`}>
                        {pct}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Superpower.pk Special Live Telemetry (When Pakistan selected) */}
          {isPakistan && gridData.superpowerData && (
            <div className={`p-4 rounded-2xl border space-y-2.5 ${
              isDarkMode 
                ? 'bg-gradient-to-b from-[#1c1c1e] to-[#121214] border-white/[0.1]' 
                : 'bg-gradient-to-b from-white to-[#f5f5f7] border-black/[0.08]'
            }`}>
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-emerald-400 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Superpower.pk Dispatch</span>
                </span>
                <span className="text-[10px] font-mono text-[#a1a1a6]">NTDC Grid Stable</span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs font-mono pt-1">
                <div className={`p-2 rounded-xl border ${isDarkMode ? 'border-white/[0.05] bg-black/20' : 'border-black/[0.04] bg-white'}`}>
                  <div className={`text-[10px] ${isDarkMode ? 'text-[#a1a1a6]' : 'text-[#86868b]'}`}>Basket Tariff</div>
                  <div className="text-sm font-bold text-amber-400">Rs. {gridData.superpowerData.basketTariffPkr}/kWh</div>
                </div>
                <div className={`p-2 rounded-xl border ${isDarkMode ? 'border-white/[0.05] bg-black/20' : 'border-black/[0.04] bg-white'}`}>
                  <div className={`text-[10px] ${isDarkMode ? 'text-[#a1a1a6]' : 'text-[#86868b]'}`}>Matiari HVDC Flow</div>
                  <div className="text-sm font-bold text-cyan-400">{gridData.superpowerData.hvdcFlowMw} MW</div>
                </div>
              </div>

              <div className={`text-[11px] pt-1 flex items-center justify-between ${
                isDarkMode ? 'text-[#a1a1a6]' : 'text-[#86868b]'
              }`}>
                <span>Net Metering Solar:</span>
                <span className="font-mono font-semibold text-emerald-400">{gridData.superpowerData.netMeteringSolarMw} MW</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. ElectricityMaps-style Hourly Timeline Scrubber Bar */}
      {/* https://app.electricitymaps.com/map/zone/PK/hourly */}
      {/* ========================================================================= */}
      <div className={`p-4 sm:p-5 border-t ${
        isDarkMode ? 'border-white/[0.08] bg-[#121214]/90' : 'border-black/[0.06] bg-[#f5f5f7]/90'
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2.5">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className={`p-2 rounded-full border transition-transform active:scale-95 flex items-center justify-center ${
                isPlaying 
                  ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md' 
                  : isDarkMode 
                    ? 'bg-white text-slate-950 border-white hover:bg-slate-200' 
                    : 'bg-black text-white border-black hover:bg-slate-800'
              }`}
              title={isPlaying ? 'Pause hourly progression' : 'Play 24-hour progression'}
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 ml-0.5" />}
            </button>

            <button
              onClick={() => setSelectedHour(new Date().getHours())}
              className={`p-2 rounded-full border transition-colors ${
                isDarkMode 
                  ? 'border-white/[0.12] hover:bg-white/[0.08] text-[#a1a1a6]' 
                  : 'border-black/[0.1] hover:bg-black/[0.05] text-[#86868b]'
              }`}
              title="Reset to current clock hour"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>

            <div className="flex items-baseline gap-2">
              <span className="text-sm font-bold font-mono tracking-tight text-cyan-400">
                {currentSnapshot.label}
              </span>
              <span className={`text-xs ${isDarkMode ? 'text-[#a1a1a6]' : 'text-[#86868b]'}`}>
                · 24-Hour ElectricityMaps Scrubber
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono">
            <span className={`text-[11px] ${isDarkMode ? 'text-[#a1a1a6]' : 'text-[#86868b]'}`}>
              Diurnal Dispatch Curve
            </span>
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
          </div>
        </div>

        {/* The 24-hour Scrubber Track */}
        <div className="space-y-1.5">
          <input
            type="range"
            min="0"
            max="23"
            step="1"
            value={selectedHour}
            onChange={(e) => {
              setIsPlaying(false);
              setSelectedHour(parseInt(e.target.value, 10));
            }}
            className="w-full h-2.5 rounded-lg appearance-none cursor-pointer accent-cyan-400 bg-slate-800"
            style={{
              background: `linear-gradient(to right, #10b981 0%, #06b6d4 30%, #f59e0b 65%, #ef4444 85%, #06b6d4 100%)`
            }}
          />

          {/* Hourly Tick Marks */}
          <div className={`flex justify-between text-[10px] font-mono select-none px-1 ${
            isDarkMode ? 'text-[#a1a1a6]' : 'text-[#86868b]'
          }`}>
            <span>00:00</span>
            <span>04:00</span>
            <span>08:00</span>
            <span>12:00 (Solar Peak)</span>
            <span>16:00</span>
            <span>20:00 (Peak Load)</span>
            <span>23:00</span>
          </div>
        </div>
      </div>
    </div>
  );
};
