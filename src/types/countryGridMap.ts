export interface TransmissionLine {
  id: string;
  name: string;
  voltage: string; // e.g. "±660 kV HVDC", "500 kV AC", "400 kV AC", "220 kV AC"
  pathD: string; // SVG path data
  fromNode: string;
  toNode: string;
  capacityMw: number;
  currentFlowMw: number;
  status: 'energized' | 'heavy_load' | 'optimal';
  color?: string;
  isHvdc?: boolean;
}

export interface PowerPlantNode {
  id: string;
  name: string;
  fuel: 'hydro' | 'nuclear' | 'solar' | 'wind' | 'coal' | 'gas' | 'biomass' | 'storage';
  capacityMw: number;
  currentOutputMw: number;
  cx: number;
  cy: number;
  provinceOrState: string;
  operator?: string;
  commissioned?: string;
  co2Factor: number; // gCO2/kWh
  status: 'generating' | 'peaking' | 'standby';
  description?: string;
}

export interface GridZoneBoundary {
  id: string;
  name: string;
  shortCode: string;
  pathD: string;
  fillColor?: string;
  demandSharePct: number;
  currentDemandMw: number;
}

export interface HourlyGridSnapshot {
  hour: number;
  label: string; // "14:00"
  demandMw: number;
  carbonIntensity: number;
  cleanPct: number;
  renewablePct: number;
  generationMix: Record<string, number>; // fuel -> mw
  spotPrice: number;
}

export interface CountryGridDetails {
  countryId: string;
  countryName: string;
  flag: string;
  gridOperator: string;
  transmissionBackbone: string;
  mapViewBox: string;
  baseCarbonIntensity: number;
  installedCapacityMw: number;
  zones: GridZoneBoundary[];
  transmissionLines: TransmissionLine[];
  powerPlants: PowerPlantNode[];
  hourlyTimeline: HourlyGridSnapshot[];
  superpowerData?: {
    dataSource: string;
    ntdcStatus: string;
    basketTariffPkr: number;
    fuelPriceAdjustmentPkr: number;
    peakDeficitMw: number;
    netMeteringSolarMw: number;
    hvdcFlowMw: number;
    hvdcEfficiencyPct: number;
    activeHydroReservoirs: {
      name: string;
      levelFeet: number;
      maxFeet: number;
      dischargeCusecs: number;
    }[];
    discos: {
      code: string;
      fullName: string;
      demandMw: number;
      sharePct: number;
      lossesPct: number;
    }[];
  };
}
