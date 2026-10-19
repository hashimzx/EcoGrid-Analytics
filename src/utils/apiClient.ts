import { GridRegion, FuelGeneration, FuelType } from '../types/grid.ts';
import { FUEL_COLORS } from '../data/regionsData.ts';

export interface UkLiveApiResponse {
  success: boolean;
  carbonIntensity: number;
  carbonRating: 'very-low' | 'low' | 'moderate' | 'high' | 'very-high';
  generationMix: FuelGeneration[];
  timestamp: string;
}

/**
 * Fetches real live data from the official UK NESO / Carbon Intensity Public API:
 * https://api.carbonintensity.org.uk/
 * 100% free, no API key required, public open data.
 */
export async function fetchUkLiveTelemetry(): Promise<UkLiveApiResponse | null> {
  // First try internal server proxy (avoids CORS issues in restricted sandboxes)
  try {
    const proxyRes = await fetch('/api/regions/uk-live');
    if (proxyRes.ok) {
      const pData = await proxyRes.json();
      if (pData.success && pData.generationMix) {
        const rawIntensity = pData.intensity?.actual ?? pData.intensity?.forecast ?? 128;
        const totalEstDemand = 29500;
        const mappedMix: FuelGeneration[] = pData.generationMix.map((item: { fuel: string; perc: number }) => {
          const fuelLower = item.fuel.toLowerCase();
          let fuelType: FuelType = 'other';
          let label = item.fuel;
          let isClean = false;

          if (fuelLower === 'wind') { fuelType = 'wind'; label = 'Offshore & Onshore Wind'; isClean = true; }
          else if (fuelLower === 'solar') { fuelType = 'solar'; label = 'Solar PV'; isClean = true; }
          else if (fuelLower === 'nuclear') { fuelType = 'nuclear'; label = 'Nuclear Generation'; isClean = true; }
          else if (fuelLower === 'hydro') { fuelType = 'hydro'; label = 'Hydro & Pumped Storage'; isClean = true; }
          else if (fuelLower === 'biomass') { fuelType = 'biomass'; label = 'Biomass & Bioenergy'; isClean = true; }
          else if (fuelLower === 'gas') { fuelType = 'gas'; label = 'Combined Cycle Gas (CCGT)'; isClean = false; }
          else if (fuelLower === 'coal') { fuelType = 'coal'; label = 'Coal Generation'; isClean = false; }
          else if (fuelLower === 'imports') { fuelType = 'imports'; label = 'Interconnectors (Net)'; isClean = true; }

          return {
            fuel: fuelType,
            label,
            mw: Math.round((item.perc / 100) * totalEstDemand),
            percentage: Number(item.perc.toFixed(1)),
            isClean,
            color: FUEL_COLORS[fuelType as keyof typeof FUEL_COLORS] || FUEL_COLORS.other,
          };
        });

        let rating: 'very-low' | 'low' | 'moderate' | 'high' | 'very-high' = 'low';
        if (rawIntensity <= 50) rating = 'very-low';
        else if (rawIntensity <= 150) rating = 'low';
        else if (rawIntensity <= 250) rating = 'moderate';
        else if (rawIntensity <= 400) rating = 'high';
        else rating = 'very-high';

        return {
          success: true,
          carbonIntensity: rawIntensity,
          carbonRating: rating,
          generationMix: mappedMix,
          timestamp: new Date().toISOString(),
        };
      }
    }
  } catch {
    // Continue to direct upstream fetch
  }

  // Direct fetch fallback to official UK NESO API
  try {
    const [genRes, intRes] = await Promise.all([
      fetch('https://api.carbonintensity.org.uk/v1/generation', { cache: 'no-store' }),
      fetch('https://api.carbonintensity.org.uk/v1/intensity', { cache: 'no-store' })
    ]);

    if (!genRes.ok || !intRes.ok) {
      throw new Error(`UK API returned status ${genRes.status} / ${intRes.status}`);
    }

    const genJson = await genRes.json();
    const intJson = await intRes.json();

    const rawIntensity = intJson.data?.[0]?.intensity?.actual ?? intJson.data?.[0]?.intensity?.forecast ?? 128;
    const rawMix = genJson.data?.generationmix as Array<{ fuel: string; perc: number }>;

    if (!rawMix || !Array.isArray(rawMix)) {
      throw new Error('Invalid generation mix response format');
    }

    // Map into our FuelGeneration model
    const totalEstDemand = 29500; // Estimated baseline MW for GB
    const mappedMix: FuelGeneration[] = rawMix.map(item => {
      const fuelLower = item.fuel.toLowerCase();
      let fuelType: FuelType = 'other';
      let label = item.fuel;
      let isClean = false;

      if (fuelLower === 'wind') {
        fuelType = 'wind';
        label = 'Offshore & Onshore Wind';
        isClean = true;
      } else if (fuelLower === 'solar') {
        fuelType = 'solar';
        label = 'Solar PV';
        isClean = true;
      } else if (fuelLower === 'nuclear') {
        fuelType = 'nuclear';
        label = 'Nuclear Generation';
        isClean = true;
      } else if (fuelLower === 'hydro') {
        fuelType = 'hydro';
        label = 'Hydro & Pumped Storage';
        isClean = true;
      } else if (fuelLower === 'biomass') {
        fuelType = 'biomass';
        label = 'Biomass & Bioenergy';
        isClean = true;
      } else if (fuelLower === 'gas') {
        fuelType = 'gas';
        label = 'Combined Cycle Gas (CCGT)';
        isClean = false;
      } else if (fuelLower === 'coal') {
        fuelType = 'coal';
        label = 'Coal Generation';
        isClean = false;
      } else if (fuelLower === 'imports') {
        fuelType = 'imports';
        label = 'Interconnectors (Net)';
        isClean = true;
      }

      const mw = Math.round((item.perc / 100) * totalEstDemand);

      return {
        fuel: fuelType,
        label,
        mw,
        percentage: Number(item.perc.toFixed(1)),
        isClean,
        color: FUEL_COLORS[fuelType as keyof typeof FUEL_COLORS] || FUEL_COLORS.other,
      };
    });

    let rating: 'very-low' | 'low' | 'moderate' | 'high' | 'very-high' = 'low';
    if (rawIntensity <= 50) rating = 'very-low';
    else if (rawIntensity <= 150) rating = 'low';
    else if (rawIntensity <= 250) rating = 'moderate';
    else if (rawIntensity <= 400) rating = 'high';
    else rating = 'very-high';

    return {
      success: true,
      carbonIntensity: rawIntensity,
      carbonRating: rating,
      generationMix: mappedMix,
      timestamp: new Date().toISOString(),
    };
  } catch (err) {
    console.warn('Live UK API fetch failed (falling back to cached real-time telemetry):', err);
    return null;
  }
}

/**
 * Simulates micro-fluctuations in grid frequency and demand for real-time live feel.
 */
export function applyLiveMicroTicks(region: GridRegion): GridRegion {
  const nominal = region.nominalFrequencyHz;
  // Natural frequency oscillation ±0.015 Hz
  const jitter = (Math.random() - 0.5) * 0.024;
  const newFreq = Number((nominal + jitter).toFixed(3));

  // Small demand fluctuation ±0.3%
  const demandJitter = (Math.random() - 0.5) * (region.currentDemandMw * 0.006);
  const newDemand = Math.round(region.currentDemandMw + demandJitter);

  let freqStatus: 'optimal' | 'low' | 'high' = 'optimal';
  if (newFreq < nominal - 0.15) freqStatus = 'low';
  else if (newFreq > nominal + 0.15) freqStatus = 'high';

  return {
    ...region,
    systemFrequencyHz: newFreq,
    frequencyStatus: freqStatus,
    currentDemandMw: newDemand,
  };
}
