import React from 'react';
import { formatFrequency } from '../../utils/formatters.ts';

interface RadialFrequencyGaugeProps {
  frequencyHz: number;
  nominalHz?: 50 | 60;
}

export const RadialFrequencyGauge: React.FC<RadialFrequencyGaugeProps> = ({
  frequencyHz,
  nominalHz = 50,
}) => {
  // Deviation from nominal frequency (-0.5Hz to +0.5Hz scale)
  const deviation = frequencyHz - nominalHz;
  const minHz = nominalHz - 0.5;
  const maxHz = nominalHz + 0.5;

  // Clamp within display bounds
  const clamped = Math.max(minHz, Math.min(maxHz, frequencyHz));
  // Needle angle: -90 degrees (at minHz) to +90 degrees (at maxHz)
  const angleDeg = ((clamped - minHz) / (maxHz - minHz)) * 180 - 90;

  // Status classification
  const absDev = Math.abs(deviation);
  let statusColor = '#10B981'; // Green (Safe / Optimal)
  let statusText = 'Nominal Band';
  if (absDev >= 0.2) {
    statusColor = '#EF4444'; // Red (Critical Alert)
    statusText = 'Frequency Alert';
  } else if (absDev >= 0.08) {
    statusColor = '#F59E0B'; // Amber (Drifting)
    statusText = 'Normal Fluctuation';
  }

  return (
    <div className="flex flex-col items-center justify-center p-3 rounded-xl bg-slate-950/80 border border-slate-800 relative">
      {/* Radial Arc Gauge SVG */}
      <div className="relative w-44 h-24 overflow-hidden flex items-end justify-center">
        <svg viewBox="0 0 200 110" className="w-full h-full overflow-visible">
          <defs>
            <linearGradient id="gaugeTrack" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#EF4444" />
              <stop offset="30%" stopColor="#F59E0B" />
              <stop offset="45%" stopColor="#10B981" />
              <stop offset="55%" stopColor="#10B981" />
              <stop offset="70%" stopColor="#F59E0B" />
              <stop offset="100%" stopColor="#EF4444" />
            </linearGradient>
          </defs>

          {/* Background Arc */}
          <path
            d="M 20 100 A 80 80 0 0 1 180 100"
            fill="none"
            stroke="#1E293B"
            strokeWidth="12"
            strokeLinecap="round"
          />

          {/* Active Spectrum Arc */}
          <path
            d="M 20 100 A 80 80 0 0 1 180 100"
            fill="none"
            stroke="url(#gaugeTrack)"
            strokeWidth="8"
            strokeLinecap="round"
            opacity="0.9"
          />

          {/* Center Target Marker (50.00 Hz) */}
          <line
            x1="100"
            y1="14"
            x2="100"
            y2="28"
            stroke="#FFFFFF"
            strokeWidth="2.5"
          />

          {/* Gauge Ticks */}
          {[-0.4, -0.2, 0, 0.2, 0.4].map((tickOffset) => {
            const tickAngle = (tickOffset / 0.5) * 90;
            const rad = (tickAngle - 90) * (Math.PI / 180);
            const x1 = 100 + 72 * Math.cos(rad);
            const y1 = 100 + 72 * Math.sin(rad);
            const x2 = 100 + 80 * Math.cos(rad);
            const y2 = 100 + 80 * Math.sin(rad);
            return (
              <line
                key={tickOffset}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke="#64748B"
                strokeWidth="1.5"
              />
            );
          })}

          {/* Precision Needle */}
          <g transform={`rotate(${angleDeg}, 100, 100)`}>
            <polygon
              points="98,100 100,20 102,100"
              fill={statusColor}
              className="transition-transform duration-300 ease-out"
            />
            <circle cx="100" cy="100" r="6" fill="#0F172A" stroke={statusColor} strokeWidth="2.5" />
          </g>
        </svg>
      </div>

      {/* Readout Numbers */}
      <div className="text-center mt-1">
        <div className="font-mono text-2xl font-bold text-white tabular-nums tracking-tight">
          {formatFrequency(frequencyHz)}
        </div>
        <div className="flex items-center justify-center gap-2 mt-0.5 text-xs font-mono">
          <span style={{ color: statusColor }}>
            {deviation >= 0 ? `+${deviation.toFixed(3)}` : deviation.toFixed(3)} Hz
          </span>
          <span className="text-slate-600">·</span>
          <span className="text-slate-400 font-sans">{statusText}</span>
        </div>
      </div>
    </div>
  );
};
