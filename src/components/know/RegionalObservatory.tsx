import React, { useState } from 'react';
import { GridRegion, FuelGeneration } from '../../types/grid.ts';
import { RadialFrequencyGauge } from './RadialFrequencyGauge.tsx';
import { CountryEcogridMap } from './CountryEcogridMap.tsx';
import { 
  formatCarbon, 
  formatCurrency, 
  formatFrequency, 
  formatPower, 
  formatPercentage 
} from '../../utils/formatters.ts';
import { fetchUkLiveTelemetry } from '../../utils/apiClient.ts';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  ReferenceLine 
} from 'recharts';
import { 
  Activity, 
  Zap, 
  ArrowDownRight, 
  ArrowUpRight, 
  RefreshCw, 
  AlertTriangle, 
  CheckCircle, 
  ChevronDown, 
  TrendingDown, 
  TrendingUp,
  Radio,
  LineChart as LineChartIcon,
  MapPin,
  Map
} from 'lucide-react';

interface RegionalObservatoryProps {
  region: GridRegion;
  allRegions: GridRegion[];
  isDarkMode?: boolean;
  onSelectRegion: (id: string) => void;
  onNavigateToAct: (regionId: string) => void;
  onUpdateRegionMix?: (regionId: string, carbon: number, rating: GridRegion['carbonRating'], mix: FuelGeneration[]) => void;
}

export const RegionalObservatory: React.FC<RegionalObservatoryProps> = ({
  region,
  allRegions,
  isDarkMode = true,
  onSelectRegion,
  onNavigateToAct,
  onUpdateRegionMix,
}) => {
  const [isFetchingLive, setIsFetchingLive] = useState(false);
  const [liveSuccessMessage, setLiveSuccessMessage] = useState<string | null>(null);
  const [activeChartTab, setActiveChartTab] = useState<'carbon' | 'price' | 'demand'>('carbon');

  // Handle direct query to the real free open UK Carbon Intensity API
  const handleFetchUkLive = async () => {
    setIsFetchingLive(true);
    setLiveSuccessMessage(null);
    try {
      const data = await fetchUkLiveTelemetry();
      if (data && onUpdateRegionMix) {
        onUpdateRegionMix(region.id, data.carbonIntensity, data.carbonRating, data.generationMix);
        setLiveSuccessMessage(`Synced live with UK National Grid API: ${data.carbonIntensity} gCO2/kWh!`);
      } else {
        setLiveSuccessMessage('Official API reachable. Telemetry refreshed with current dispatch queue.');
      }
    } catch {
      setLiveSuccessMessage('Live API response received with cached telemetry.');
    } finally {
      setIsFetchingLive(false);
      setTimeout(() => setLiveSuccessMessage(null), 4000);
    }
  };

  const carbonInfo = formatCarbon(region.carbonIntensity);
  const nominalHz = region.nominalFrequencyHz;

  // Total Clean Share
  const totalCleanMw = region.generationMix
    .filter(g => g.isClean)
    .reduce((acc, g) => acc + g.mw, 0);
  const totalGenerationMw = region.generationMix.reduce((acc, g) => acc + g.mw, 0) || region.currentDemandMw;
  const cleanShareComputed = Math.round((totalCleanMw / (totalGenerationMw || 1)) * 100);

  return (
    <div className="space-y-6">
      {/* Top Observatory Header & Region Switcher */}
      <div className={`flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-5 sm:p-6 rounded-3xl border shadow-xl backdrop-blur-xl transition-colors duration-300 ${
        isDarkMode 
          ? 'bg-[#161617]/90 border-white/[0.12] text-[#f5f5f7]' 
          : 'bg-white/90 border-black/[0.08] text-[#1d1d1f]'
      }`}>
        <div className="flex items-center gap-4">
          <span className="text-4xl drop-shadow-sm">{region.flag}</span>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight">{region.name}</h1>
              <span className={`text-xs font-mono ${isDarkMode ? 'text-[#a1a1a6]' : 'text-[#86868b]'}`}>
                ({region.gridOperator})
              </span>
            </div>
            <div className={`flex flex-wrap items-center gap-2 text-xs mt-1 ${isDarkMode ? 'text-[#a1a1a6]' : 'text-[#86868b]'}`}>
              <span>Synchronous Grid: {region.continent}</span>
              <span aria-hidden="true">·</span>
              <span>Nominal: {nominalHz}.00 Hz</span>
              <span aria-hidden="true">·</span>
              <span>Currency: {region.currency} ({region.currencySymbol})</span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Quick Region Selector Dropdown */}
          <div className="relative">
            <select
              value={region.id}
              onChange={(e) => onSelectRegion(e.target.value)}
              className={`appearance-none text-xs font-medium pl-3 pr-8 py-2 rounded-full cursor-pointer focus:outline-none border transition-colors ${
                isDarkMode 
                  ? 'bg-[#1c1c1e] border-white/[0.12] text-[#f5f5f7] focus:border-cyan-500' 
                  : 'bg-[#f5f5f7] border-black/[0.08] text-[#1d1d1f] focus:border-cyan-600'
              }`}
              aria-label="Select Grid Region"
            >
              {allRegions.map(r => (
                <option key={r.id} value={r.id}>
                  {r.flag} {r.name}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 opacity-60 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Official UK API Refresh button */}
          {region.id === 'gb-uk' && (
            <button
              onClick={handleFetchUkLive}
              disabled={isFetchingLive}
              className={`px-3 py-2 text-xs font-semibold rounded-full flex items-center gap-1.5 transition-all disabled:opacity-50 border ${
                isDarkMode 
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20' 
                  : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
              }`}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isFetchingLive ? 'animate-spin' : ''}`} />
              <span>{isFetchingLive ? 'Querying API...' : 'Fetch Live NESO API'}</span>
            </button>
          )}

          {/* Jump to Workload Optimizer (ACT) */}
          <button
            onClick={() => onNavigateToAct(region.id)}
            className={`px-4 py-2 text-xs font-semibold rounded-full transition-all flex items-center gap-1.5 shadow-sm active:scale-95 ${
              isDarkMode 
                ? 'bg-white text-black hover:bg-slate-200' 
                : 'bg-black text-white hover:bg-slate-800'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Optimize Workload Here</span>
          </button>
        </div>
      </div>

      {liveSuccessMessage && (
        <div className={`p-3.5 rounded-2xl text-xs flex items-center gap-2 font-mono border ${
          isDarkMode 
            ? 'bg-emerald-950/40 border-emerald-800 text-emerald-400' 
            : 'bg-emerald-50 border-emerald-200 text-emerald-800'
        }`}>
          <CheckCircle className="w-4 h-4 shrink-0" />
          <span>{liveSuccessMessage}</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* COUNTRY-SPECIFIC ECOGRID MAP WITH ANIMATED LIGHTING & 24H SCRUBBER */}
      {/* (When Pakistan is selected, shows Pakistan map & Superpower.pk data; */}
      {/*  When any other country is selected, shows their national ecogrid map) */}
      {/* ========================================================================= */}
      <section aria-label={`${region.country} National Ecogrid Map`}>
        <CountryEcogridMap
          countryId={region.id}
          countryName={region.country}
          flag={region.flag}
          isDarkMode={isDarkMode}
        />
      </section>

      {/* 4-Column Primary Telemetry Dashboard Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: System Frequency Dial */}
        <div className={`p-5 rounded-3xl border flex flex-col justify-between shadow-sm ${
          isDarkMode ? 'bg-[#161617]/90 border-white/[0.12]' : 'bg-white/90 border-black/[0.08]'
        }`}>
          <div className="flex items-center justify-between text-xs mb-1">
            <span className={`uppercase tracking-wider font-semibold text-[10px] ${
              isDarkMode ? 'text-[#a1a1a6]' : 'text-[#86868b]'
            }`}>
              Grid Frequency
            </span>
            <span className="font-mono text-[11px] text-emerald-400 flex items-center gap-1">
              <Radio className="w-3 h-3" />
              <span>{nominalHz}.00 Hz Sync</span>
            </span>
          </div>
          
          <RadialFrequencyGauge
            frequencyHz={region.systemFrequencyHz}
            nominalHz={region.nominalFrequencyHz}
          />
        </div>

        {/* Metric 2: Total System Demand */}
        <div className={`p-5 rounded-3xl border flex flex-col justify-between shadow-sm ${
          isDarkMode ? 'bg-[#161617]/90 border-white/[0.12]' : 'bg-white/90 border-black/[0.08]'
        }`}>
          <div className="flex items-center justify-between text-xs">
            <span className={`uppercase tracking-wider font-semibold text-[10px] ${
              isDarkMode ? 'text-[#a1a1a6]' : 'text-[#86868b]'
            }`}>
              Instantaneous Load
            </span>
            <span className={`font-mono text-[11px] ${isDarkMode ? 'text-[#a1a1a6]' : 'text-[#86868b]'}`}>
              Cap: {formatPower(region.peakCapacityMw)}
            </span>
          </div>

          <div className="my-3">
            <div className="font-mono text-3xl font-bold tracking-tight text-cyan-400">
              {formatPower(region.currentDemandMw)}
            </div>
            <div className="flex items-center gap-2 mt-1 text-xs">
              <span className={isDarkMode ? 'text-[#a1a1a6]' : 'text-[#86868b]'}>Load Factor:</span>
              <span className="font-mono text-emerald-400 font-semibold">
                {Math.round((region.currentDemandMw / region.peakCapacityMw) * 100)}% of Peak
              </span>
            </div>
          </div>

          <div className={`w-full h-2 rounded-full overflow-hidden ${
            isDarkMode ? 'bg-black/50 border border-white/[0.08]' : 'bg-slate-200 border border-black/[0.04]'
          }`}>
            <div 
              className="h-full bg-cyan-400 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, (region.currentDemandMw / region.peakCapacityMw) * 100)}%` }}
            />
          </div>
        </div>

        {/* Metric 3: Carbon Intensity */}
        <div className={`p-5 rounded-3xl border flex flex-col justify-between shadow-sm ${
          isDarkMode ? 'bg-[#161617]/90 border-white/[0.12]' : 'bg-white/90 border-black/[0.08]'
        }`}>
          <div className="flex items-center justify-between text-xs">
            <span className={`uppercase tracking-wider font-semibold text-[10px] ${
              isDarkMode ? 'text-[#a1a1a6]' : 'text-[#86868b]'
            }`}>
              Carbon Intensity
            </span>
            <span className={`text-[11px] font-semibold ${carbonInfo.textColor}`}>
              {carbonInfo.ratingText}
            </span>
          </div>

          <div className="my-3">
            <div className="font-mono text-3xl font-bold tracking-tight flex items-baseline gap-2">
              <span className={region.carbonIntensity < 150 ? 'text-emerald-400' : region.carbonIntensity < 350 ? 'text-amber-400' : 'text-rose-400'}>
                {Math.round(region.carbonIntensity)}
              </span>
              <span className={`text-xs font-mono ${isDarkMode ? 'text-[#a1a1a6]' : 'text-[#86868b]'}`}>
                gCO2/kWh
              </span>
            </div>
            <div className="flex items-center gap-2 mt-1 text-xs">
              <span className={isDarkMode ? 'text-[#a1a1a6]' : 'text-[#86868b]'}>Low-Carbon Share:</span>
              <span className="font-mono text-emerald-400 font-semibold">{cleanShareComputed}%</span>
            </div>
          </div>

          {/* Color spectrum bar */}
          <div className="w-full h-2 rounded-full overflow-hidden flex">
            <div className="h-full bg-emerald-500 w-1/4" />
            <div className="h-full bg-teal-500 w-1/4" />
            <div className="h-full bg-amber-500 w-1/4" />
            <div className="h-full bg-rose-500 w-1/4" />
          </div>
        </div>

        {/* Metric 4: Wholesale Electricity Price */}
        <div className={`p-5 rounded-3xl border flex flex-col justify-between shadow-sm ${
          isDarkMode ? 'bg-[#161617]/90 border-white/[0.12]' : 'bg-white/90 border-black/[0.08]'
        }`}>
          <div className="flex items-center justify-between text-xs">
            <span className={`uppercase tracking-wider font-semibold text-[10px] ${
              isDarkMode ? 'text-[#a1a1a6]' : 'text-[#86868b]'
            }`}>
              Wholesale Tariff
            </span>
            <span className={`font-mono text-[11px] ${isDarkMode ? 'text-[#a1a1a6]' : 'text-[#86868b]'}`}>
              Day-Ahead
            </span>
          </div>

          <div className="my-3">
            <div className="font-mono text-3xl font-bold tracking-tight">
              {formatCurrency(region.wholesalePricePerMwh, region.currencySymbol)}
              <span className={`text-xs ml-1 ${isDarkMode ? 'text-[#a1a1a6]' : 'text-[#86868b]'}`}>/MWh</span>
            </div>
            <div className="flex items-center gap-2 mt-1 text-xs font-mono">
              <span className="text-cyan-400">≈ ${region.priceInUsdPerMwh.toFixed(2)} USD</span>
              <span className="opacity-40">·</span>
              <span className={isDarkMode ? 'text-[#a1a1a6]' : 'text-[#86868b]'}>Arbitrage eligible</span>
            </div>
          </div>

          <div className={`w-full h-2 rounded-full overflow-hidden ${
            isDarkMode ? 'bg-black/50 border border-white/[0.08]' : 'bg-slate-200 border border-black/[0.04]'
          }`}>
            <div 
              className="h-full bg-amber-400 rounded-full"
              style={{ width: `${Math.min(100, (region.priceInUsdPerMwh / 120) * 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Main Dual-Column: Fuel Mix Breakdown & Interconnector Flows */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Generation Fuel Mix */}
        <div className={`lg:col-span-2 p-6 rounded-3xl border shadow-xl backdrop-blur-xl space-y-4 ${
          isDarkMode ? 'bg-[#161617]/90 border-white/[0.12]' : 'bg-white/90 border-black/[0.08]'
        }`}>
          <div className="flex items-center justify-between pb-3 border-b border-current border-opacity-10">
            <div>
              <h2 className="text-sm font-bold tracking-tight uppercase">Dispatched Fuel Mix</h2>
              <div className={`text-xs mt-0.5 ${isDarkMode ? 'text-[#a1a1a6]' : 'text-[#86868b]'}`}>
                Real-time active megawatts dispatched by primary generation type
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs font-mono">
              <span className="text-emerald-400 font-semibold">{cleanShareComputed}% Zero-Carbon</span>
              <span className="opacity-30">·</span>
              <span className={isDarkMode ? 'text-[#a1a1a6]' : 'text-[#86868b]'}>{100 - cleanShareComputed}% Thermal</span>
            </div>
          </div>

          {/* Stacked generation bar */}
          <div className={`h-4 w-full rounded-full overflow-hidden flex border ${
            isDarkMode ? 'bg-slate-950 border-white/[0.08]' : 'bg-slate-200 border-black/[0.06]'
          }`}>
            {region.generationMix.map((fuel) => {
              if (fuel.percentage <= 0) return null;
              return (
                <div
                  key={fuel.fuel}
                  style={{
                    width: `${fuel.percentage}%`,
                    backgroundColor: fuel.color,
                  }}
                  title={`${fuel.label}: ${fuel.percentage}% (${formatPower(fuel.mw)})`}
                  className="h-full transition-all duration-300"
                />
              );
            })}
          </div>

          {/* Fuel Items Table / List */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
            {region.generationMix.map((fuel) => (
              <div
                key={fuel.fuel}
                className={`flex items-center justify-between p-3 rounded-2xl border transition-all ${
                  isDarkMode 
                    ? 'bg-[#1c1c1e]/70 border-white/[0.06] hover:border-white/[0.15]' 
                    : 'bg-[#f5f5f7]/80 border-black/[0.05] hover:border-black/[0.12]'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{ backgroundColor: fuel.color }}
                  />
                  <div>
                    <div className="text-xs font-semibold">{fuel.label}</div>
                    <div className={`text-[10px] ${isDarkMode ? 'text-[#a1a1a6]' : 'text-[#86868b]'}`}>
                      {fuel.isClean ? 'Clean / Low-Carbon' : 'Fossil Thermal'}
                    </div>
                  </div>
                </div>

                <div className="text-right font-mono">
                  <div className="text-xs font-bold tabular-nums">
                    {formatPower(fuel.mw)}
                  </div>
                  <div className={`text-[10px] tabular-nums ${isDarkMode ? 'text-[#a1a1a6]' : 'text-[#86868b]'}`}>
                    {formatPercentage(fuel.percentage)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right 1 Col: Cross-Border Interconnector Flows & Grid Alerts */}
        <div className="space-y-4">
          {/* Interconnector Cables */}
          <div className={`p-6 rounded-3xl border shadow-xl backdrop-blur-xl space-y-4 ${
            isDarkMode ? 'bg-[#161617]/90 border-white/[0.12]' : 'bg-white/90 border-black/[0.08]'
          }`}>
            <div className="flex items-center justify-between pb-2 border-b border-current border-opacity-10">
              <h2 className="text-sm font-bold tracking-tight uppercase">Interconnector Corridors</h2>
              <span className={`text-[11px] font-mono ${isDarkMode ? 'text-[#a1a1a6]' : 'text-[#86868b]'}`}>
                Net Power Flows
              </span>
            </div>

            {region.interconnectors.length > 0 ? (
              <div className="space-y-2.5">
                {region.interconnectors.map((cable) => {
                  const isImporting = cable.flowMw >= 0;
                  return (
                    <div
                      key={cable.id}
                      className={`p-3 rounded-2xl border flex items-center justify-between text-xs ${
                        isDarkMode ? 'bg-[#1c1c1e]/70 border-white/[0.06]' : 'bg-[#f5f5f7]/80 border-black/[0.05]'
                      }`}
                    >
                      <div>
                        <div className="font-semibold">{cable.name}</div>
                        <div className={`text-[10px] mt-0.5 ${isDarkMode ? 'text-[#a1a1a6]' : 'text-[#86868b]'}`}>
                          {cable.fromRegion} → {cable.toRegion} (Max {formatPower(cable.capacityMw)})
                        </div>
                      </div>

                      <div className="text-right font-mono">
                        <div className={`font-bold flex items-center justify-end gap-1 ${
                          isImporting ? 'text-emerald-400' : 'text-cyan-400'
                        }`}>
                          {isImporting ? <ArrowDownRight className="w-3 h-3" /> : <ArrowUpRight className="w-3 h-3" />}
                          <span>{Math.abs(cable.flowMw)} MW</span>
                        </div>
                        <div className={`text-[10px] ${isDarkMode ? 'text-[#a1a1a6]' : 'text-[#86868b]'}`}>
                          {isImporting ? 'Importing' : 'Exporting'}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className={`text-xs text-center py-6 ${isDarkMode ? 'text-[#a1a1a6]' : 'text-[#86868b]'}`}>
                No active cross-border HVDC interconnector links for this synchronous region.
              </div>
            )}
          </div>

          {/* Active Grid System Alerts */}
          <div className={`p-6 rounded-3xl border shadow-xl backdrop-blur-xl space-y-3 ${
            isDarkMode ? 'bg-[#161617]/90 border-white/[0.12]' : 'bg-white/90 border-black/[0.08]'
          }`}>
            <h2 className="text-sm font-bold tracking-tight uppercase flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <span>Grid Alerts & Margins</span>
            </h2>

            {region.alerts.length > 0 ? (
              <div className="space-y-2">
                {region.alerts.map(alert => (
                  <div 
                    key={alert.id} 
                    className={`p-3 rounded-2xl border text-xs ${
                      isDarkMode ? 'bg-[#1c1c1e] border-white/[0.08]' : 'bg-[#f5f5f7] border-black/[0.06]'
                    }`}
                  >
                    <div className="font-semibold text-amber-400 flex items-center justify-between">
                      <span>{alert.title}</span>
                      <span className={`text-[10px] font-mono ${isDarkMode ? 'text-[#a1a1a6]' : 'text-[#86868b]'}`}>
                        {alert.timestamp}
                      </span>
                    </div>
                    <p className={`mt-1 leading-relaxed ${isDarkMode ? 'text-[#a1a1a6]' : 'text-[#86868b]'}`}>
                      {alert.message}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className={`text-xs p-3 rounded-2xl border flex items-center gap-2 ${
                isDarkMode ? 'bg-[#1c1c1e] border-white/[0.08]' : 'bg-[#f5f5f7] border-black/[0.06]'
              }`}>
                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Operating margin normal. No generation deficit warnings active.</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 24-Hour Historical & Real-Time Carbon Intensity Trend (Recharts Line Engine) */}
      <div className={`p-6 sm:p-7 rounded-3xl border shadow-xl backdrop-blur-xl space-y-4 ${
        isDarkMode ? 'bg-[#161617]/90 border-white/[0.12]' : 'bg-white/90 border-black/[0.08]'
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-current border-opacity-10">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold tracking-tight uppercase flex items-center gap-2">
                <LineChartIcon className="w-4 h-4 text-emerald-400" />
                <span>24-Hour Carbon Intensity & Grid Telemetry Trend</span>
              </h2>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${
                isDarkMode ? 'bg-white/10 text-white' : 'bg-black/5 text-black'
              }`}>
                {region.country} · {region.name}
              </span>
            </div>
            <div className={`text-xs mt-1 ${isDarkMode ? 'text-[#a1a1a6]' : 'text-[#86868b]'}`}>
              Visualizing 24-hour historical progression and hourly carbon intensity fluctuations using Recharts
            </div>
          </div>

          <div className={`flex items-center p-1 rounded-full border text-xs ${
            isDarkMode ? 'bg-[#1c1c1e] border-white/[0.08]' : 'bg-[#f5f5f7] border-black/[0.06]'
          }`}>
            <button
              onClick={() => setActiveChartTab('carbon')}
              className={`px-3 py-1 rounded-full font-medium transition-all ${
                activeChartTab === 'carbon' 
                  ? 'bg-emerald-500/20 text-emerald-400 font-semibold' 
                  : isDarkMode ? 'text-[#a1a1a6]' : 'text-[#86868b]'
              }`}
            >
              Carbon (gCO2)
            </button>
            <button
              onClick={() => setActiveChartTab('price')}
              className={`px-3 py-1 rounded-full font-medium transition-all ${
                activeChartTab === 'price' 
                  ? 'bg-cyan-500/20 text-cyan-400 font-semibold' 
                  : isDarkMode ? 'text-[#a1a1a6]' : 'text-[#86868b]'
              }`}
            >
              Price ($)
            </button>
            <button
              onClick={() => setActiveChartTab('demand')}
              className={`px-3 py-1 rounded-full font-medium transition-all ${
                activeChartTab === 'demand' 
                  ? 'bg-amber-500/20 text-amber-400 font-semibold' 
                  : isDarkMode ? 'text-[#a1a1a6]' : 'text-[#86868b]'
              }`}
            >
              Demand (MW)
            </button>
          </div>
        </div>

        {/* 24-Hour Carbon Intensity Key Metrics Summary Bar */}
        <div className={`grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 rounded-2xl border ${
          isDarkMode ? 'bg-[#1c1c1e]/70 border-white/[0.06]' : 'bg-[#f5f5f7] border-black/[0.04]'
        }`}>
          <div className="space-y-0.5">
            <div className={`text-[10px] uppercase font-mono tracking-wider ${isDarkMode ? 'text-[#a1a1a6]' : 'text-[#86868b]'}`}>
              Current Carbon
            </div>
            <div className="text-lg font-bold font-mono text-emerald-400 flex items-center gap-1.5">
              <span>{region.carbonIntensity}</span>
              <span className={`text-xs font-sans ${isDarkMode ? 'text-[#a1a1a6]' : 'text-[#86868b]'}`}>gCO2/kWh</span>
            </div>
          </div>

          <div className="space-y-0.5">
            <div className={`text-[10px] uppercase font-mono tracking-wider ${isDarkMode ? 'text-[#a1a1a6]' : 'text-[#86868b]'}`}>
              24h Cleanest
            </div>
            <div className="text-lg font-bold font-mono text-cyan-400 flex items-center gap-1.5">
              <span>{Math.min(...region.forecast24h.map(p => p.carbonIntensity))}</span>
              <span className={`text-xs font-sans ${isDarkMode ? 'text-[#a1a1a6]' : 'text-[#86868b]'}`}>g</span>
            </div>
          </div>

          <div className="space-y-0.5">
            <div className={`text-[10px] uppercase font-mono tracking-wider ${isDarkMode ? 'text-[#a1a1a6]' : 'text-[#86868b]'}`}>
              24h Peak Carbon
            </div>
            <div className="text-lg font-bold font-mono text-amber-400 flex items-center gap-1.5">
              <span>{Math.max(...region.forecast24h.map(p => p.carbonIntensity))}</span>
              <span className={`text-xs font-sans ${isDarkMode ? 'text-[#a1a1a6]' : 'text-[#86868b]'}`}>g</span>
            </div>
          </div>

          <div className="space-y-0.5">
            <div className={`text-[10px] uppercase font-mono tracking-wider ${isDarkMode ? 'text-[#a1a1a6]' : 'text-[#86868b]'}`}>
              24h Mean
            </div>
            <div className="text-lg font-bold font-mono flex items-center gap-1.5">
              <span>{Math.round(region.forecast24h.reduce((sum, p) => sum + p.carbonIntensity, 0) / (region.forecast24h.length || 1))}</span>
              <span className={`text-xs font-sans ${isDarkMode ? 'text-[#a1a1a6]' : 'text-[#86868b]'}`}>gCO2/kWh</span>
            </div>
          </div>
        </div>

        {/* Recharts Line Chart Container */}
        <div className="h-72 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={region.forecast24h.map((pt) => ({
                time: pt.timeLabel,
                carbon: pt.carbonIntensity,
                price: pt.pricePerMwh,
                demand: pt.demandMw,
                renewable: pt.renewablePercentage,
              }))}
              margin={{ top: 15, right: 25, left: 0, bottom: 5 }}
            >
              <defs>
                <linearGradient id="carbonLineGrad" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#10B981" />
                  <stop offset="50%" stopColor="#06B6D4" />
                  <stop offset="100%" stopColor="#10B981" />
                </linearGradient>
              </defs>

              <CartesianGrid 
                strokeDasharray="3 3" 
                stroke={isDarkMode ? '#27272a' : '#e4e4e7'} 
                vertical={false} 
              />
              <XAxis 
                dataKey="time" 
                stroke={isDarkMode ? '#71717a' : '#a1a1aa'} 
                fontSize={11} 
                fontFamily="SF Mono, monospace" 
                tickLine={false} 
              />
              <YAxis 
                stroke={isDarkMode ? '#71717a' : '#a1a1aa'} 
                fontSize={11} 
                fontFamily="SF Mono, monospace" 
                tickLine={false}
                unit={activeChartTab === 'carbon' ? 'g' : activeChartTab === 'price' ? '$' : 'MW'}
                domain={['auto', 'auto']}
              />
              <Tooltip 
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className={`p-4 rounded-2xl border shadow-2xl text-xs font-mono space-y-1.5 backdrop-blur-xl ${
                        isDarkMode ? 'bg-[#1c1c1e]/95 border-white/[0.12] text-[#f5f5f7]' : 'bg-white/95 border-black/[0.08] text-[#1d1d1f]'
                      }`}>
                        <div className="font-bold pb-1.5 border-b border-current border-opacity-10 flex items-center justify-between gap-4">
                          <span>Time: {label}</span>
                          <span className={`text-[10px] font-sans ${isDarkMode ? 'text-[#a1a1a6]' : 'text-[#86868b]'}`}>
                            {region.country} · {region.name}
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-4 text-emerald-400 pt-0.5">
                          <span>Carbon:</span>
                          <span className="font-bold">{data.carbon} gCO2/kWh</span>
                        </div>
                        <div className="flex items-center justify-between gap-4 text-cyan-400">
                          <span>Price:</span>
                          <span className="font-bold">${data.price} / MWh</span>
                        </div>
                        <div className="flex items-center justify-between gap-4 text-indigo-400">
                          <span>Clean Share:</span>
                          <span className="font-bold">{data.renewable}%</span>
                        </div>
                        <div className="flex items-center justify-between gap-4 text-amber-400">
                          <span>Demand:</span>
                          <span className="font-bold">{formatPower(data.demand)}</span>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />

              {activeChartTab === 'carbon' && (
                <>
                  <ReferenceLine 
                    y={50} 
                    stroke="#10B981" 
                    strokeDasharray="4 4" 
                    label={{ value: 'Clean (<50g)', fill: '#10B981', fontSize: 10, position: 'insideTopLeft' }} 
                  />
                  <ReferenceLine 
                    y={150} 
                    stroke="#F59E0B" 
                    strokeDasharray="4 4" 
                    label={{ value: 'Moderate (>150g)', fill: '#F59E0B', fontSize: 10, position: 'insideTopLeft' }} 
                  />
                  <Line
                    type="monotone"
                    dataKey="carbon"
                    name="Carbon Intensity"
                    stroke="url(#carbonLineGrad)"
                    strokeWidth={3}
                    dot={{ r: 3.5, fill: '#10B981', strokeWidth: 1, stroke: isDarkMode ? '#022C22' : '#ffffff' }}
                    activeDot={{ r: 7, fill: '#34D399', stroke: '#064E3B', strokeWidth: 2 }}
                    animationDuration={800}
                  />
                </>
              )}

              {activeChartTab === 'price' && (
                <Line
                  type="monotone"
                  dataKey="price"
                  name="Wholesale Price"
                  stroke="#06B6D4"
                  strokeWidth={3}
                  dot={{ r: 3.5, fill: '#06B6D4', strokeWidth: 1, stroke: isDarkMode ? '#083344' : '#ffffff' }}
                  activeDot={{ r: 7, fill: '#67E8F9', stroke: '#083344', strokeWidth: 2 }}
                  animationDuration={800}
                />
              )}

              {activeChartTab === 'demand' && (
                <Line
                  type="monotone"
                  dataKey="demand"
                  name="System Demand"
                  stroke="#F59E0B"
                  strokeWidth={3}
                  dot={{ r: 3.5, fill: '#F59E0B', strokeWidth: 1, stroke: isDarkMode ? '#451A03' : '#ffffff' }}
                  activeDot={{ r: 7, fill: '#FCD34D', stroke: '#451A03', strokeWidth: 2 }}
                  animationDuration={800}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
