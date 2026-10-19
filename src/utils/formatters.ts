export function formatPower(mw: number): string {
  if (Math.abs(mw) >= 1000) {
    return `${(mw / 1000).toFixed(2)} GW`;
  }
  return `${Math.round(mw).toLocaleString()} MW`;
}

export function formatFrequency(hz: number): string {
  return `${hz.toFixed(3)} Hz`;
}

export function formatCarbon(g: number): {
  label: string;
  ratingText: string;
  textColor: string;
  bgColor: string;
  borderColor: string;
} {
  const rounded = Math.round(g);
  if (rounded <= 50) {
    return {
      label: `${rounded} gCO2/kWh`,
      ratingText: 'Very Low',
      textColor: 'text-emerald-400',
      bgColor: 'bg-emerald-950/40',
      borderColor: 'border-emerald-800/60',
    };
  }
  if (rounded <= 150) {
    return {
      label: `${rounded} gCO2/kWh`,
      ratingText: 'Low',
      textColor: 'text-teal-400',
      bgColor: 'bg-teal-950/40',
      borderColor: 'border-teal-800/60',
    };
  }
  if (rounded <= 250) {
    return {
      label: `${rounded} gCO2/kWh`,
      ratingText: 'Moderate',
      textColor: 'text-amber-400',
      bgColor: 'bg-amber-950/40',
      borderColor: 'border-amber-800/60',
    };
  }
  if (rounded <= 400) {
    return {
      label: `${rounded} gCO2/kWh`,
      ratingText: 'High',
      textColor: 'text-orange-400',
      bgColor: 'bg-orange-950/40',
      borderColor: 'border-orange-800/60',
    };
  }
  return {
    label: `${rounded} gCO2/kWh`,
    ratingText: 'Very High',
    textColor: 'text-rose-400',
    bgColor: 'bg-rose-950/40',
    borderColor: 'border-rose-800/60',
  };
}

export function formatCurrency(amount: number, symbol = '$', decimals = 2): string {
  return `${symbol}${amount.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}`;
}

export function formatPercentage(pct: number): string {
  return `${pct.toFixed(1)}%`;
}
