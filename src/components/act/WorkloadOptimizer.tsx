import React, { useState, useMemo } from 'react';
import { GridRegion } from '../../types/grid.ts';
import { WorkloadProfile, OptimizationResult } from '../../types/optimization.ts';
import { PRESET_WORKLOADS } from '../../data/presetWorkloads.ts';
import { runWorkloadOptimization } from '../../utils/optimizer.ts';
import { formatCurrency, formatPower } from '../../utils/formatters.ts';
import { 
  Zap, 
  Clock, 
  Leaf, 
  DollarSign, 
  Sliders, 
  ArrowRight, 
  ShieldCheck, 
  Calendar, 
  Code, 
  Check, 
  Download,
  Building2,
  TrendingDown,
  Sparkles
} from 'lucide-react';

interface WorkloadOptimizerProps {
  regions: GridRegion[];
  preselectedRegionId?: string;
  isDarkMode?: boolean;
  onOpenObservatory: (regionId: string) => void;
}

export const WorkloadOptimizer: React.FC<WorkloadOptimizerProps> = ({
  regions,
  preselectedRegionId,
  isDarkMode = true,
  onOpenObservatory,
}) => {
  // Active workload form state
  const [selectedPresetId, setSelectedPresetId] = useState<string>('ai-training-70b');
  const [workloadName, setWorkloadName] = useState('Llama 3 / Mistral 70B Checkpoint Training');
  const [companyName, setCompanyName] = useState('DeepCompute Systems Global');
  const [category, setCategory] = useState<WorkloadProfile['category']>('ai_training');
  const [powerDemandMw, setPowerDemandMw] = useState<number>(4.5);
  const [durationHours, setDurationHours] = useState<number>(8);
  const [maxDelayHours, setMaxDelayHours] = useState<number>(12);
  const [complianceConstraint, setComplianceConstraint] = useState<WorkloadProfile['complianceConstraint']>('any');
  const [urgency, setUrgency] = useState<WorkloadProfile['urgency']>('flexible');

  // Interactive timeline scrubber
  const [scrubberHourOffset, setScrubberHourOffset] = useState<number | null>(null);
  
  // UI feedback states
  const [scheduledSuccess, setScheduledSuccess] = useState(false);
  const [showWebhookModal, setShowWebhookModal] = useState(false);
  const [copiedWebhook, setCopiedWebhook] = useState(false);

  // Apply preset handler
  const handleSelectPreset = (preset: WorkloadProfile) => {
    setSelectedPresetId(preset.id);
    setWorkloadName(preset.name);
    setCompanyName(preset.companyName);
    setCategory(preset.category);
    setPowerDemandMw(preset.powerDemandMw);
    setDurationHours(preset.durationHours);
    setMaxDelayHours(preset.maxDelayHours);
    setComplianceConstraint(preset.complianceConstraint || 'any');
    setUrgency(preset.urgency);
    setScrubberHourOffset(null);
  };

  // Compile current workload profile
  const currentWorkload: WorkloadProfile = useMemo(() => ({
    id: `workload-${Date.now()}`,
    name: workloadName,
    companyName,
    category,
    powerDemandMw,
    durationHours,
    maxDelayHours,
    urgency,
    complianceConstraint,
    allowedRegions: preselectedRegionId ? [preselectedRegionId] : undefined,
  }), [workloadName, companyName, category, powerDemandMw, durationHours, maxDelayHours, urgency, complianceConstraint, preselectedRegionId]);

  // Run the algorithm
  const result: OptimizationResult = useMemo(() => {
    return runWorkloadOptimization(currentWorkload, regions);
  }, [currentWorkload, regions]);

  const { bestImmediateRegion, bestWaitAndSave, allRegionsRanked, timeline24h } = result;
  const optimalWindow = bestWaitAndSave.optimalWindow;

  // Selected or hovered hour on the scrubber
  const activeScrubberHour = scrubberHourOffset !== null ? scrubberHourOffset : optimalWindow.startHourOffset;
  const scrubberData = timeline24h[activeScrubberHour];

  const handleScheduleDispatch = () => {
    setScheduledSuccess(true);
    setTimeout(() => setScheduledSuccess(false), 4000);
  };

  const webhookPayload = JSON.stringify({
    event: 'voltgrid.dispatch.scheduled',
    timestamp: new Date().toISOString(),
    company: companyName,
    workload: {
      name: workloadName,
      category,
      powerDemandMw,
      durationHours,
    },
    decision: {
      action: bestWaitAndSave.actionRecommendation,
      targetRegion: bestWaitAndSave.regionId,
      scheduledStartTime: optimalWindow.targetStartTime,
      projectedCostUsd: optimalWindow.totalCostUsd,
      projectedSavingsUsd: optimalWindow.savingsVsImmediateUsd,
      carbonReductionKg: optimalWindow.carbonReductionKg,
    },
    authFingerprint: 'vault_crd_001fe482_sha256',
  }, null, 2);

  const handleCopyWebhook = () => {
    navigator.clipboard.writeText(webhookPayload);
    setCopiedWebhook(true);
    setTimeout(() => setCopiedWebhook(false), 2500);
  };

  const handleDownloadReport = () => {
    const blob = new Blob([webhookPayload], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `voltgrid-dispatch-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Act Header */}
      <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <Zap className="w-4 h-4" />
              </span>
              <h1 className="text-xl font-bold text-white">Workload Spatial &amp; Temporal Dispatch Engine</h1>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Phase 2: ACT — Multi-region spatial arbitrage combined with the "Wait &amp; Save" predictive timeline algorithm.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono text-emerald-400 bg-emerald-950/40 border border-emerald-800 px-3 py-2 rounded-lg">
            <Sparkles className="w-4 h-4 shrink-0" />
            <span>Algorithmic Solver: 100% active · Arbitrage ready</span>
          </div>
        </div>

        {/* Workload Preset Carousel */}
        <div className="mt-5 pt-4 border-t border-slate-800">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2.5">
            Load Commercial Workload Template:
          </div>
          <div className="flex flex-wrap gap-2">
            {PRESET_WORKLOADS.map((preset) => {
              const isSelected = selectedPresetId === preset.id;
              return (
                <button
                  key={preset.id}
                  onClick={() => handleSelectPreset(preset)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-all text-left flex items-center gap-2 ${
                    isSelected 
                      ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300 shadow-sm'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <span>{preset.name}</span>
                  <span className="text-[10px] text-slate-500 font-mono">({preset.powerDemandMw} MW)</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Dual Grid: Form Inputs vs Algorithm Results */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (5 cols): Parameter Controls */}
        <div className="lg:col-span-5 p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Sliders className="w-4 h-4 text-emerald-400" />
              <span>Job Specifications</span>
            </h2>
            <span className="text-xs text-slate-500 font-mono">Dynamic Inputs</span>
          </div>

          <div className="space-y-3.5 text-xs">
            {/* Workload Name */}
            <div>
              <label className="block text-slate-400 font-medium mb-1">Workload Name / Job ID</label>
              <input
                type="text"
                value={workloadName}
                onChange={(e) => setWorkloadName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white font-medium focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Company Organization */}
            <div>
              <label className="block text-slate-400 font-medium mb-1 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-slate-400" />
                <span>Company Organization</span>
              </label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white font-medium focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Power Demand MW Slider & Input */}
            <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-semibold text-slate-300">Continuous Electrical Power</span>
                <span className="font-mono text-emerald-400 font-bold">{powerDemandMw} MW</span>
              </div>
              <input
                type="range"
                min="0.2"
                max="25.0"
                step="0.1"
                value={powerDemandMw}
                onChange={(e) => setPowerDemandMw(parseFloat(e.target.value))}
                className="w-full accent-emerald-500 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-1">
                <span>0.2 MW (Edge)</span>
                <span>10 MW (Industrial)</span>
                <span>25 MW (Hyperscale)</span>
              </div>
            </div>

            {/* Duration Slider */}
            <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-semibold text-slate-300">Job Runtime Duration</span>
                <span className="font-mono text-cyan-400 font-bold">{durationHours} Hours</span>
              </div>
              <input
                type="range"
                min="1"
                max="24"
                step="1"
                value={durationHours}
                onChange={(e) => setDurationHours(parseInt(e.target.value))}
                className="w-full accent-cyan-500 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-1">
                <span>1h (Flash Job)</span>
                <span>8h (Standard Shift)</span>
                <span>24h (Full Cycle)</span>
              </div>
            </div>

            {/* Wait Delay Tolerance (The Wait & Save core lever!) */}
            <div className="p-3 rounded-xl bg-slate-950/70 border border-emerald-900/40">
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  <span>Max Allowable Delay (Wait Horizon)</span>
                </span>
                <span className="font-mono text-amber-400 font-bold">+{maxDelayHours} Hours</span>
              </div>
              <input
                type="range"
                min="0"
                max="20"
                step="1"
                value={maxDelayHours}
                onChange={(e) => setMaxDelayHours(parseInt(e.target.value))}
                className="w-full accent-amber-500 cursor-pointer"
              />
              <div className="text-[10px] text-slate-400 mt-1">
                {maxDelayHours === 0 
                  ? 'Immediate only (spatial arbitrage active, no delay allowed).'
                  : `Our algorithm scans all 24 hours to find the exact price/carbon trough within +${maxDelayHours}h.`}
              </div>
            </div>

            {/* Compliance Constraints */}
            <div>
              <label className="block text-slate-400 font-medium mb-1 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
                <span>Geographic &amp; Data Compliance Boundary</span>
              </label>
              <select
                value={complianceConstraint}
                onChange={(e) => setComplianceConstraint(e.target.value as WorkloadProfile['complianceConstraint'])}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-300 focus:outline-none focus:border-emerald-500"
              >
                <option value="any">Global (Any Region with Cheapest / Cleanest Power)</option>
                <option value="eu_gdpr">European Union &amp; UK (GDPR &amp; EU Data Sovereignty)</option>
                <option value="us_only">United States Only (US ISOs: CAISO, ERCOT, PJM)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Right Column (7 cols): The Output / Algorithm Breakthrough Results */}
        <div className="lg:col-span-7 space-y-4">
          {/* Main "WAIT & SAVE" Golden Window Recommendation Banner */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-950/50 via-slate-900 to-slate-950 border border-emerald-800/60 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-emerald-900/40">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 text-[11px] font-bold rounded-md bg-emerald-500 text-slate-950 uppercase tracking-wider">
                  Algorithmic Recommendation
                </span>
                <span className="text-xs font-mono text-emerald-400">
                  {bestWaitAndSave.actionRecommendation.replace('_', ' ')}
                </span>
              </div>
              <span className="text-xs text-slate-400 font-mono">
                Workload Energy: {formatPower(powerDemandMw * durationHours * 1000 / 1000)}h ({powerDemandMw * durationHours} MWh)
              </span>
            </div>

            {/* Action Statement */}
            <div>
              <h3 className="text-lg font-bold text-white">
                {bestWaitAndSave.optimalWindow.startHourOffset > 0 
                  ? `Wait ${bestWaitAndSave.optimalWindow.startHourOffset} Hours → Run in ${bestWaitAndSave.regionName}`
                  : `Dispatch Immediately → Run in ${bestWaitAndSave.regionName}`}
              </h3>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                {bestWaitAndSave.recommendationReason}
              </p>
            </div>

            {/* KPI Compare Cards: Immediate vs Wait & Save */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              {/* Option A: Run Right Now */}
              <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800">
                <div className="text-[11px] text-slate-400 uppercase tracking-wider">Option A: Immediate Dispatch</div>
                <div className="text-xs text-slate-400 mt-0.5 font-medium">{bestImmediateRegion.regionName}</div>
                
                <div className="mt-2.5 flex items-baseline gap-2">
                  <div className="text-xl font-mono font-bold text-slate-200">
                    {formatCurrency(bestImmediateRegion.totalCostImmediate)}
                  </div>
                  <div className="text-[11px] text-slate-500 font-mono">total power cost</div>
                </div>

                <div className="mt-1 text-xs text-slate-400 font-mono">
                  Emissions: <span className="text-amber-400 font-semibold">{bestImmediateRegion.totalCarbonKgImmediate.toLocaleString()} kg CO2</span>
                </div>
              </div>

              {/* Option B: Wait & Save (The Win!) */}
              <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-600/50 relative overflow-hidden">
                <div className="text-[11px] text-emerald-400 uppercase tracking-wider font-bold flex items-center justify-between">
                  <span>Option B: Wait &amp; Save Window</span>
                  <span className="font-mono text-[10px] bg-emerald-500/20 px-2 py-0.5 rounded text-emerald-300">
                    {optimalWindow.targetStartTime}
                  </span>
                </div>
                <div className="text-xs text-slate-300 mt-0.5 font-medium">{bestWaitAndSave.regionName}</div>

                <div className="mt-2.5 flex items-baseline gap-2">
                  <div className="text-xl font-mono font-bold text-emerald-300">
                    {formatCurrency(optimalWindow.totalCostUsd)}
                  </div>
                  {optimalWindow.savingsVsImmediateUsd > 0 && (
                    <div className="text-xs font-mono font-bold text-emerald-400 flex items-center">
                      <TrendingDown className="w-3.5 h-3.5 mr-0.5" />
                      <span>Save {optimalWindow.savingsPercentage}%</span>
                    </div>
                  )}
                </div>

                <div className="mt-1 text-xs text-slate-300 font-mono">
                  Emissions: <span className="text-emerald-400 font-semibold">{optimalWindow.totalCarbonKg.toLocaleString()} kg CO2</span>
                  {optimalWindow.carbonReductionKg > 0 && (
                    <span className="text-emerald-400 text-[10px] ml-1.5">(-{optimalWindow.carbonReductionPercentage}%)</span>
                  )}
                </div>
              </div>
            </div>

            {/* Financial & Environmental Net Abatement Summary */}
            <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800 text-xs flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-emerald-400" />
                <span className="text-slate-300">
                  Net Capital Saved: <strong className="text-emerald-400 font-mono">{formatCurrency(Math.max(0, optimalWindow.savingsVsImmediateUsd))}</strong>
                </span>
              </div>

              <div className="flex items-center gap-2">
                <Leaf className="w-4 h-4 text-emerald-400" />
                <span className="text-slate-300">
                  Carbon Abated: <strong className="text-emerald-400 font-mono">{Math.max(0, optimalWindow.carbonReductionKg).toLocaleString()} kg CO2eq</strong>
                </span>
              </div>
            </div>

            {/* Action Bar */}
            <div className="flex flex-wrap items-center gap-2.5 pt-1">
              <button
                onClick={handleScheduleDispatch}
                className="px-4 py-2 text-xs font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-lg flex items-center gap-1.5 transition-colors"
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>Schedule Automated Dispatch</span>
              </button>

              <button
                onClick={() => setShowWebhookModal(true)}
                className="px-3.5 py-2 text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-lg flex items-center gap-1.5 transition-colors"
              >
                <Code className="w-3.5 h-3.5" />
                <span>API Webhook Payload</span>
              </button>

              <button
                onClick={handleDownloadReport}
                className="px-3.5 py-2 text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-lg flex items-center gap-1.5 transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Report</span>
              </button>
            </div>

            {scheduledSuccess && (
              <div className="p-2.5 rounded-lg bg-emerald-950/60 border border-emerald-700 text-emerald-400 text-xs font-mono flex items-center gap-2">
                <Check className="w-4 h-4 shrink-0" />
                <span>Job locked in dispatch queue for {optimalWindow.targetStartTime} in {bestWaitAndSave.regionName}. API trigger armed.</span>
              </div>
            )}
          </div>

          {/* Interactive 24-Hour Horizon Opportunity Scrubber */}
          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div>
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                  24-Hour Start Time Horizon Scrubber
                </h4>
                <div className="text-[11px] text-slate-400">
                  Hover or click any start hour to preview projected cost and carbon
                </div>
              </div>
              <span className="font-mono text-xs text-amber-400">
                Selected: T+{activeScrubberHour}h
              </span>
            </div>

            {/* Scrubber Bar */}
            <div className="grid grid-cols-12 gap-1 pt-2">
              {timeline24h.slice(0, 12).map((item) => {
                const isOptimal = item.hourOffset === optimalWindow.startHourOffset;
                const isScrubbed = item.hourOffset === activeScrubberHour;
                const cost = item.costRunImmediateVsThisHour[0]?.projectedCostUsd || 0;

                return (
                  <button
                    key={item.hourOffset}
                    onClick={() => setScrubberHourOffset(item.hourOffset)}
                    className={`p-2 rounded-lg text-center transition-all ${
                      isOptimal 
                        ? 'bg-emerald-500/30 border border-emerald-500 ring-2 ring-emerald-500/20' 
                        : isScrubbed 
                        ? 'bg-cyan-500/20 border border-cyan-500' 
                        : 'bg-slate-950 border border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="text-[10px] font-mono text-slate-400">T+{item.hourOffset}h</div>
                    <div className={`text-[11px] font-mono font-bold mt-1 ${isOptimal ? 'text-emerald-400' : 'text-slate-200'}`}>
                      ${Math.round(cost)}
                    </div>
                    {isOptimal && (
                      <div className="text-[8px] uppercase tracking-wider text-emerald-400 font-bold mt-0.5">
                        Best
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Scrubber Detail Bar */}
            {scrubberData && (
              <div className="mt-3 p-3 rounded-xl bg-slate-950 border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div>
                  <span className="text-slate-400">Inspecting Start Window: </span>
                  <strong className="text-white font-mono">{scrubberData.timeLabel}</strong>
                </div>

                <div className="flex items-center gap-4 font-mono">
                  {scrubberData.costRunImmediateVsThisHour.slice(0, 3).map((cr) => (
                    <div key={cr.regionId} className="flex items-center gap-1.5">
                      <span className="text-slate-400">{cr.regionName.split(' ')[0]}:</span>
                      <span className="text-emerald-400 font-bold">{formatCurrency(cr.projectedCostUsd)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Spatial Leaderboard Across All Regions */}
          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
              Immediate Spatial Arbitrage Leaderboard (All Grids Ranked)
            </h4>

            <div className="space-y-2">
              {allRegionsRanked.slice(0, 5).map((ro, idx) => (
                <div
                  key={ro.regionId}
                  className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950/80 border border-slate-800 text-xs hover:border-slate-700 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-slate-500 font-bold w-4">#{idx + 1}</span>
                    <div>
                      <div className="font-semibold text-slate-200">{ro.regionName}</div>
                      <div className="text-[10px] text-slate-500">{ro.country}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-5 text-right font-mono">
                    <div>
                      <div className="text-slate-300 font-bold">{formatCurrency(ro.totalCostImmediate)}</div>
                      <div className="text-[10px] text-slate-500">${ro.currentPriceUsd}/MWh</div>
                    </div>

                    <div>
                      <div className="text-emerald-400 font-bold">{Math.round(ro.totalCarbonKgImmediate)} kg</div>
                      <div className="text-[10px] text-slate-500">{ro.currentCarbonIntensity} g/kWh</div>
                    </div>

                    <button
                      onClick={() => onOpenObservatory(ro.regionId)}
                      className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] transition-colors"
                    >
                      View
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Webhook API Payload Modal */}
      {showWebhookModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Code className="w-5 h-5 text-emerald-400" />
                <span>Automated Dispatch Webhook Payload</span>
              </h3>
              <button
                onClick={() => setShowWebhookModal(false)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Use this signed JSON payload with Kubernetes CronJob, AWS Step Functions, or custom BESS SCADA endpoints to automate workload execution based on VoltGrid's optimal window.
            </p>

            <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-[11px] font-mono text-emerald-400 overflow-x-auto max-h-64">
              {webhookPayload}
            </pre>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={handleCopyWebhook}
                className="px-4 py-2 text-xs font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-lg flex items-center gap-1.5 transition-colors"
              >
                <Check className="w-3.5 h-3.5" />
                <span>{copiedWebhook ? 'Copied to Clipboard!' : 'Copy Payload'}</span>
              </button>
              <button
                onClick={() => setShowWebhookModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white bg-slate-800 rounded-lg"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
