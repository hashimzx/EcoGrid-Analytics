import { CountryGridDetails, HourlyGridSnapshot } from '../types/countryGridMap.ts';

// Helper to generate realistic 24h hourly profiles for country grids
function generateHourlyTimeline(
  baseDemand: number,
  baseCarbon: number,
  baseCleanPct: number,
  baseSpotPrice: number,
  mixTemplate: Record<string, number>
): HourlyGridSnapshot[] {
  const snapshots: HourlyGridSnapshot[] = [];
  
  for (let h = 0; h < 24; h++) {
    const timeLabel = `${h.toString().padStart(2, '0')}:00`;
    // Diurnal load curve
    let loadFactor = 0.85;
    if (h >= 1 && h <= 5) loadFactor = 0.72; // Night lull
    else if (h >= 7 && h <= 11) loadFactor = 1.10; // Morning ramp
    else if (h >= 12 && h <= 16) loadFactor = 1.05; // Afternoon plateau
    else if (h >= 17 && h <= 21) loadFactor = 1.28; // Evening peak
    else if (h >= 22) loadFactor = 0.95;

    // Solar modifier (peaks at 12:00-14:00)
    let solarMultiplier = 0;
    if (h >= 6 && h <= 18) {
      solarMultiplier = Math.sin(((h - 6) / 12) * Math.PI);
    }

    const demandMw = Math.round(baseDemand * loadFactor);
    // Solar drops carbon intensity in midday
    const carbonDrop = solarMultiplier * 45;
    const carbonIntensity = Math.max(20, Math.round(baseCarbon * (1 - (solarMultiplier * 0.22)) + (loadFactor > 1.2 ? 25 : 0)));
    const cleanPct = Math.min(100, Math.max(10, Math.round(baseCleanPct + (solarMultiplier * 18) - (loadFactor > 1.2 ? 6 : 0))));
    const spotPrice = Number((baseSpotPrice * (loadFactor > 1.2 ? 1.4 : loadFactor < 0.8 ? 0.7 : 1.0)).toFixed(1));

    const genMix: Record<string, number> = {};
    Object.entries(mixTemplate).forEach(([fuel, pct]) => {
      let adjPct = pct;
      if (fuel === 'solar') adjPct = pct * (0.1 + solarMultiplier * 2.2);
      else if (fuel === 'gas' || fuel === 'oil') adjPct = pct * (loadFactor > 1.2 ? 1.3 : 0.85);
      genMix[fuel] = Math.round((demandMw * adjPct) / 100);
    });

    snapshots.push({
      hour: h,
      label: timeLabel,
      demandMw,
      carbonIntensity,
      cleanPct,
      renewablePct: Math.round(cleanPct * 0.75),
      generationMix: genMix,
      spotPrice,
    });
  }

  return snapshots;
}

export const COUNTRY_GRID_DATA: Record<string, CountryGridDetails> = {
  // =========================================================================
  // PAKISTAN (NTDC & SUPERPOWER.PK)
  // =========================================================================
  'pk-ntdc': {
    countryId: 'pk-ntdc',
    countryName: 'Pakistan',
    flag: '🇵🇰',
    gridOperator: 'National Transmission & Despatch Company (NTDC) / CPPA-G',
    transmissionBackbone: '±660 kV HVDC Matiari-Lahore & 500 kV Northern/Southern AC Backbone',
    mapViewBox: '0 0 600 600',
    baseCarbonIntensity: 335,
    installedCapacityMw: 49270,
    zones: [
      { id: 'pk-punjab', name: 'Punjab Grid (LESCO, FESCO, GEPCO, MEPCO)', shortCode: 'PUNJAB', pathD: 'M 320 220 L 440 240 L 460 340 L 400 420 L 320 380 L 290 300 Z', fillColor: '#3b82f6', demandSharePct: 62.4, currentDemandMw: 14220 },
      { id: 'pk-sindh', name: 'Sindh & Karachi (HESCO, SEPCO, K-Electric)', shortCode: 'SINDH', pathD: 'M 250 410 L 330 400 L 370 450 L 350 540 L 260 550 L 220 480 Z', fillColor: '#10b981', demandSharePct: 22.8, currentDemandMw: 5200 },
      { id: 'pk-kpk', name: 'Khyber Pakhtunkhwa & FATA (PESCO, TESCO)', shortCode: 'KP', pathD: 'M 250 140 L 330 150 L 320 230 L 240 250 L 210 180 Z', fillColor: '#8b5cf6', demandSharePct: 9.6, currentDemandMw: 2190 },
      { id: 'pk-balochistan', name: 'Balochistan (QESCO)', shortCode: 'BALOCHISTAN', pathD: 'M 100 280 L 240 270 L 250 410 L 210 500 L 90 460 L 70 360 Z', fillColor: '#f59e0b', demandSharePct: 3.8, currentDemandMw: 870 },
      { id: 'pk-gb-ajk', name: 'Gilgit-Baltistan & AJK Hydro Corridor', shortCode: 'GB/AJK', pathD: 'M 330 80 L 430 90 L 420 180 L 340 160 Z', fillColor: '#06b6d4', demandSharePct: 1.4, currentDemandMw: 320 },
    ],
    transmissionLines: [
      // ±660 kV HVDC Matiari-Lahore (Historic 886km Super-Highway)
      { id: 'hvdc-matiari-lahore', name: '±660 kV HVDC Matiari-to-Lahore Bipole', voltage: '±660 kV HVDC', pathD: 'M 305 475 Q 350 360, 395 275', fromNode: 'Matiari Converter Station (Sindh)', toNode: 'Lahore Converter Station (Punjab)', capacityMw: 4000, currentFlowMw: 3240, status: 'energized', color: '#06b6d4', isHvdc: true },
      // 500 kV Northern Loop
      { id: '500kv-tarbela-rawat', name: '500 kV Tarbela-to-Rawat Circuit', voltage: '500 kV AC', pathD: 'M 325 155 L 345 185', fromNode: 'Tarbela Hydro', toNode: 'Rawat / Islamabad Substation', capacityMw: 2400, currentFlowMw: 2150, status: 'optimal', color: '#10b981' },
      { id: '500kv-rawat-lahore', name: '500 kV Rawat-to-Lahore South 500kV Line', voltage: '500 kV AC', pathD: 'M 345 185 L 395 275', fromNode: 'Rawat / Islamabad', toNode: 'Lahore South Grid Hub', capacityMw: 2200, currentFlowMw: 1890, status: 'optimal', color: '#10b981' },
      { id: '500kv-ghazi-ghatti', name: '500 kV Ghazi Barotha-to-Ghatti (Faisalabad)', voltage: '500 kV AC', pathD: 'M 315 165 L 350 260', fromNode: 'Ghazi Barotha Hydro', toNode: 'Ghatti (Faisalabad)', capacityMw: 2000, currentFlowMw: 1420, status: 'optimal', color: '#10b981' },
      { id: '500kv-sahiwal-lahore', name: '500 kV Sahiwal Supercritical-to-Lahore', voltage: '500 kV AC', pathD: 'M 360 310 L 395 275', fromNode: 'Sahiwal Coal Station', toNode: 'Lahore South Grid', capacityMw: 1320, currentFlowMw: 1180, status: 'energized', color: '#f59e0b' },
      { id: '500kv-thar-matiari', name: '500 kV Thar Mine-Mouth-to-Matiari Hub', voltage: '500 kV AC', pathD: 'M 335 520 L 305 475', fromNode: 'Thar Coal Block-I & II', toNode: 'Matiari HVDC Terminal', capacityMw: 2640, currentFlowMw: 2310, status: 'energized', color: '#f59e0b' },
      { id: '500kv-karachi-jamshoro', name: '500 kV K-2/K-3 Nuclear-to-Jamshoro 500kV', voltage: '500 kV AC', pathD: 'M 255 525 L 290 485', fromNode: 'Karachi K-2/K-3 Nuclear', toNode: 'Jamshoro 500kV Grid', capacityMw: 2200, currentFlowMw: 2040, status: 'optimal', color: '#8b5cf6' },
      { id: '220kv-jhimpir-matiari', name: '220 kV Jhimpir Wind Collector-to-Matiari', voltage: '220 kV AC', pathD: 'M 280 505 L 305 475', fromNode: 'Jhimpir Wind Corridor', toNode: 'Matiari Collector', capacityMw: 1400, currentFlowMw: 1050, status: 'optimal', color: '#06b6d4' },
      { id: '500kv-mangla-lahore', name: '500 kV Mangla Hydro-to-Gujranwala/Lahore', voltage: '500 kV AC', pathD: 'M 365 190 L 395 275', fromNode: 'Mangla Hydro Dam', toNode: 'Lahore South Grid', capacityMw: 1150, currentFlowMw: 980, status: 'optimal', color: '#10b981' },
      { id: '500kv-chashma-ghatti', name: '500 kV Chashma Nuclear-to-Ghatti / Daud Khel', voltage: '500 kV AC', pathD: 'M 290 220 L 350 260', fromNode: 'Chashma Nuclear C1-C4', toNode: 'Ghatti (Faisalabad)', capacityMw: 1330, currentFlowMw: 1290, status: 'optimal', color: '#8b5cf6' },
      { id: '220kv-quetta-feeder', name: '220 kV Shikarpur-to-Uch & Quetta Intertie', voltage: '220 kV AC', pathD: 'M 250 410 L 195 345', fromNode: 'Shikarpur Hub', toNode: 'Quetta Industrial Grid', capacityMw: 600, currentFlowMw: 480, status: 'optimal', color: '#f59e0b' },
    ],
    powerPlants: [
      { id: 'pp-tarbela', name: 'Tarbela Hydroelectric Complex (T1-T5 Extension)', fuel: 'hydro', capacityMw: 4888, currentOutputMw: 4350, cx: 325, cy: 155, provinceOrState: 'KP / Indus River', operator: 'WAPDA', commissioned: '1976 / 2018 (T4) / 2026 (T5)', co2Factor: 0, status: 'generating', description: 'Largest earth-filled dam in the world. High snowmelt dispatch powering northern industrial ring.' },
      { id: 'pp-mangla', name: 'Mangla Hydro Power Station', fuel: 'hydro', capacityMw: 1150, currentOutputMw: 980, cx: 365, cy: 190, provinceOrState: 'AJK / Jhelum River', operator: 'WAPDA', commissioned: '1967 (Raised 2013)', co2Factor: 0, status: 'generating', description: 'Multipurpose reservoir providing baseload clean hydro and seasonal irrigation balancing.' },
      { id: 'pp-ghazi-barotha', name: 'Ghazi-Barotha Run-of-River Hydro', fuel: 'hydro', capacityMw: 1450, currentOutputMw: 1380, cx: 315, cy: 165, provinceOrState: 'Punjab / Indus River', operator: 'WAPDA', commissioned: '2003', co2Factor: 0, status: 'generating', description: 'Run-of-the-river facility on the Indus River delivering exceptionally fast peak-load response.' },
      { id: 'pp-neelum-jhelum', name: 'Neelum Jhelum Underground Hydro', fuel: 'hydro', capacityMw: 969, currentOutputMw: 890, cx: 375, cy: 145, provinceOrState: 'AJK / Muzaffarabad', operator: 'WAPDA', commissioned: '2018', co2Factor: 0, status: 'generating', description: 'Subterranean cascading powerhouse with deep hydraulic head.' },
      { id: 'pp-k2-k3', name: 'Karachi K-2 & K-3 Nuclear (Hualong One)', fuel: 'nuclear', capacityMw: 2200, currentOutputMw: 2150, cx: 255, cy: 525, provinceOrState: 'Sindh / Arabian Sea', operator: 'PAEC', commissioned: '2021 / 2022', co2Factor: 0, status: 'generating', description: 'Two 1,100 MW advanced Generation-III PWR reactors delivering rock-solid zero-carbon baseload to Karachi & NTDC.' },
      { id: 'pp-chashma', name: 'Chashma Nuclear Generating Station (C-1 to C-4)', fuel: 'nuclear', capacityMw: 1330, currentOutputMw: 1290, cx: 290, cy: 220, provinceOrState: 'Punjab / Mianwali', operator: 'PAEC', commissioned: '2000-2017', co2Factor: 0, status: 'generating', description: 'Four pressurized water reactors operating at over 96% capacity factor.' },
      { id: 'pp-thar-coal', name: 'Thar Mine-Mouth Lignite Coal (Engro & Shanghai)', fuel: 'coal', capacityMw: 2640, currentOutputMw: 2310, cx: 335, cy: 520, provinceOrState: 'Sindh / Tharparkar Desert', operator: 'SECMC / Shanghai Electric', commissioned: '2019-2023', co2Factor: 760, status: 'generating', description: 'Indigenous lignite coal power replacing costly imported fuel. Dispatches bulk power via Matiari HVDC.' },
      { id: 'pp-sahiwal', name: 'Sahiwal Supercritical Coal Power Plant', fuel: 'coal', capacityMw: 1320, currentOutputMw: 1180, cx: 360, cy: 310, provinceOrState: 'Punjab / Sahiwal', operator: 'Huaneng Shandong Ruyi', commissioned: '2017', co2Factor: 720, status: 'generating', description: '2x660 MW high-efficiency supercritical units supplying the central Punjab agricultural & industrial belt.' },
      { id: 'pp-bhikki', name: 'Bhikki RLNG Combined Cycle Power Plant', fuel: 'gas', capacityMw: 1180, currentOutputMw: 920, cx: 370, cy: 260, provinceOrState: 'Punjab / Sheikhupura', operator: 'QAED', commissioned: '2018', co2Factor: 380, status: 'generating', description: 'High-efficiency 9HA.01 gas turbine CCGT responding rapidly to diurnal demand swings.' },
      { id: 'pp-haveli', name: 'Haveli Bahadur Shah RLNG CCGT', fuel: 'gas', capacityMw: 1230, currentOutputMw: 980, cx: 330, cy: 285, provinceOrState: 'Punjab / Jhang', operator: 'NPPMCL', commissioned: '2018', co2Factor: 375, status: 'generating', description: 'State-of-the-art combined cycle gas plant with high thermal efficiency (62.4%).' },
      { id: 'pp-jhimpir-wind', name: 'Jhimpir & Gharo Wind Energy Cluster', fuel: 'wind', capacityMw: 1400, currentOutputMw: 1150, cx: 280, cy: 505, provinceOrState: 'Sindh / Thatta Corridor', operator: 'Multiple IPPs (Zorlu, FFC, Master, Tricon)', commissioned: '2013-2024', co2Factor: 0, status: 'generating', description: 'Wind corridor with over 30 utility-scale wind farms tapping steady Arabian Sea coastal breezes.' },
      { id: 'pp-quaid-solar', name: 'Quaid-e-Azam Solar Park & Bahawalpur PV', fuel: 'solar', capacityMw: 1000, currentOutputMw: 800, cx: 345, cy: 360, provinceOrState: 'Punjab / Cholistan Desert', operator: 'Zonergy & QA Solar', commissioned: '2015-2023', co2Factor: 0, status: 'generating', description: 'Extensive desert photovoltaic installation complementing rapid private rooftop solar net metering (2,498 MW).' },
    ],
    superpowerData: {
      dataSource: 'Superpower.pk / NTDC SCADA / CPPA-G Live Telemetry',
      ntdcStatus: 'Synchronous Grid Stable (50.012 Hz)',
      basketTariffPkr: 24.80,
      fuelPriceAdjustmentPkr: 1.45,
      peakDeficitMw: 0,
      netMeteringSolarMw: 2498,
      hvdcFlowMw: 3240,
      hvdcEfficiencyPct: 98.2,
      activeHydroReservoirs: [
        { name: 'Tarbela Dam (Indus)', levelFeet: 1548, maxFeet: 1550, dischargeCusecs: 148000 },
        { name: 'Mangla Dam (Jhelum)', levelFeet: 1242, maxFeet: 1242, dischargeCusecs: 65000 },
        { name: 'Chashma Barrage', levelFeet: 649, maxFeet: 649, dischargeCusecs: 215000 },
      ],
      discos: [
        { code: 'LESCO', fullName: 'Lahore Electric Supply Company', demandMw: 4850, sharePct: 21.3, lossesPct: 11.2 },
        { code: 'MEPCO', fullName: 'Multan Electric Power Company', demandMw: 3950, sharePct: 17.3, lossesPct: 14.8 },
        { code: 'FESCO', fullName: 'Faisalabad Electric Supply Company', demandMw: 2980, sharePct: 13.1, lossesPct: 8.9 },
        { code: 'IESCO', fullName: 'Islamabad Electric Supply Company', demandMw: 2680, sharePct: 11.8, lossesPct: 8.2 },
        { code: 'PESCO', fullName: 'Peshawar Electric Supply Company', demandMw: 2450, sharePct: 10.7, lossesPct: 35.4 },
        { code: 'GEPCO', fullName: 'Gujranwala Electric Power Company', demandMw: 2100, sharePct: 9.2, lossesPct: 9.1 },
        { code: 'HESCO', fullName: 'Hyderabad Electric Supply Company', demandMw: 1420, sharePct: 6.2, lossesPct: 27.5 },
        { code: 'QESCO', fullName: 'Quetta Electric Supply Company', demandMw: 1350, sharePct: 5.9, lossesPct: 22.0 },
        { code: 'SEPCO', fullName: 'Sukkur Electric Power Company', demandMw: 1020, sharePct: 4.5, lossesPct: 33.1 },
      ],
    },
    hourlyTimeline: generateHourlyTimeline(22800, 335, 51.2, 102.0, {
      hydro: 31.1,
      gas: 23.7,
      coal: 18.4,
      nuclear: 16.4,
      wind: 5.0,
      solar: 3.5,
      biomass: 1.9,
    }),
  },

  // =========================================================================
  // UNITED KINGDOM (NESO / NATIONAL GRID)
  // =========================================================================
  'gb-uk': {
    countryId: 'gb-uk',
    countryName: 'United Kingdom',
    flag: '🇬🇧',
    gridOperator: 'National Energy System Operator (NESO)',
    transmissionBackbone: '400 kV / 275 kV National Transmission Grid & North Sea HVDC Interconnectors',
    mapViewBox: '0 0 500 600',
    baseCarbonIntensity: 138,
    installedCapacityMw: 78500,
    zones: [
      { id: 'uk-scotland', name: 'Scotland & Highlands Wind Zone', shortCode: 'SCOTLAND', pathD: 'M 190 60 L 260 70 L 280 150 L 230 190 L 160 170 Z', fillColor: '#06b6d4', demandSharePct: 11.2, currentDemandMw: 3740 },
      { id: 'uk-north', name: 'Northern England & Yorkshire', shortCode: 'NORTH', pathD: 'M 210 190 L 310 200 L 330 280 L 220 280 Z', fillColor: '#3b82f6', demandSharePct: 24.5, currentDemandMw: 8180 },
      { id: 'uk-midlands-wales', name: 'Midlands & Wales', shortCode: 'MIDLANDS', pathD: 'M 170 280 L 320 280 L 310 380 L 180 370 Z', fillColor: '#10b981', demandSharePct: 28.1, currentDemandMw: 9380 },
      { id: 'uk-south-london', name: 'London & South East', shortCode: 'LONDON/SOUTH', pathD: 'M 220 380 L 340 370 L 360 450 L 240 460 Z', fillColor: '#f59e0b', demandSharePct: 36.2, currentDemandMw: 12100 },
    ],
    transmissionLines: [
      { id: 'uk-line-1', name: 'Western HVDC Link (Hunterston to Deeside)', voltage: '400 kV HVDC', pathD: 'M 200 170 Q 150 250, 220 310', fromNode: 'Hunterston (Scotland)', toNode: 'Deeside (Wales/Midlands)', capacityMw: 2200, currentFlowMw: 1850, status: 'optimal', color: '#06b6d4', isHvdc: true },
      { id: 'uk-line-2', name: '400 kV East Coast Supergrid (Torness-Newcastle-York)', voltage: '400 kV AC', pathD: 'M 240 180 L 280 240 L 290 320', fromNode: 'Torness Nuclear', toNode: 'York / Midlands Hub', capacityMw: 3500, currentFlowMw: 2980, status: 'energized', color: '#10b981' },
      { id: 'uk-line-3', name: '400 kV London Ring & Thames Estuary Corridor', voltage: '400 kV AC', pathD: 'M 290 320 L 310 400 L 270 420', fromNode: 'Midlands Hub', toNode: 'London Ring 400kV', capacityMw: 4000, currentFlowMw: 3650, status: 'energized', color: '#10b981' },
      { id: 'uk-line-4', name: 'Viking Link 525kV HVDC (Denmark to UK)', voltage: '525 kV HVDC', pathD: 'M 330 330 L 420 320', fromNode: 'Bicker Fen Substation', toNode: 'Revsing (Denmark)', capacityMw: 1400, currentFlowMw: 1350, status: 'optimal', color: '#06b6d4', isHvdc: true },
      { id: 'uk-line-5', name: 'IFA-1 & IFA-2 Cross-Channel Interties (France to UK)', voltage: '400 kV HVDC', pathD: 'M 320 440 L 350 490', fromNode: 'Sellindge / Chilling', toNode: 'Les Mandarins / Tourbe (France)', capacityMw: 3000, currentFlowMw: 2420, status: 'optimal', color: '#06b6d4', isHvdc: true },
    ],
    powerPlants: [
      { id: 'uk-hornsea', name: 'Hornsea One & Two Offshore Wind', fuel: 'wind', capacityMw: 2600, currentOutputMw: 2340, cx: 330, cy: 260, provinceOrState: 'North Sea Offshore', operator: 'Ørsted', commissioned: '2020-2022', co2Factor: 0, status: 'generating', description: 'Massive offshore wind farm generating clean power into Yorkshire grid.' },
      { id: 'uk-sizewell', name: 'Sizewell B Nuclear Station', fuel: 'nuclear', capacityMw: 1200, currentOutputMw: 1180, cx: 345, cy: 375, provinceOrState: 'Suffolk Coast', operator: 'EDF Energy', commissioned: '1995', co2Factor: 0, status: 'generating', description: 'UK’s sole operational commercial pressurized water reactor delivering steady baseload.' },
      { id: 'uk-drax', name: 'Drax Biomass Power Station', fuel: 'biomass', capacityMw: 2600, currentOutputMw: 1950, cx: 295, cy: 275, provinceOrState: 'North Yorkshire', operator: 'Drax Group', commissioned: 'Converted to Biomass', co2Factor: 45, status: 'generating', description: 'Converted coal station running compressed wood pellets.' },
      { id: 'uk-dinorwig', name: 'Dinorwig Pumped Storage "Electric Mountain"', fuel: 'hydro', capacityMw: 1728, currentOutputMw: 600, cx: 200, cy: 310, provinceOrState: 'Snowdonia, Wales', operator: 'First Hydro', commissioned: '1984', co2Factor: 0, status: 'peaking', description: 'Rapid-response pumped hydro station ramping to 1.7 GW in under 16 seconds.' },
    ],
    hourlyTimeline: generateHourlyTimeline(33400, 138, 58.4, 78.5, {
      wind: 38.2,
      gas: 27.5,
      nuclear: 15.6,
      biomass: 6.8,
      solar: 4.2,
      hydro: 2.1,
      imports: 5.6,
    }),
  },

  // =========================================================================
  // GERMANY (TRANSNETBW / TENNET / AMPRION / 50HERTZ)
  // =========================================================================
  'de-transnet': {
    countryId: 'de-transnet',
    countryName: 'Germany',
    flag: '🇩🇪',
    gridOperator: 'TransnetBW / TenneT / Amprion / 50Hertz',
    transmissionBackbone: '380 kV German Synchronous Grid & SuedLink HVDC Corridor',
    mapViewBox: '0 0 500 550',
    baseCarbonIntensity: 285,
    installedCapacityMw: 142000,
    zones: [
      { id: 'de-north', name: 'North Sea Wind & 50Hertz Zone', shortCode: 'NORTH', pathD: 'M 160 50 L 320 60 L 360 180 L 170 170 Z', fillColor: '#06b6d4', demandSharePct: 22.0, currentDemandMw: 12500 },
      { id: 'de-west', name: 'Amprion Industrial Rhine-Ruhr', shortCode: 'WEST', pathD: 'M 120 180 L 240 180 L 230 330 L 110 320 Z', fillColor: '#f59e0b', demandSharePct: 34.0, currentDemandMw: 19300 },
      { id: 'de-east', name: '50Hertz Berlin & Eastern Germany', shortCode: 'EAST', pathD: 'M 250 170 L 390 180 L 380 340 L 260 330 Z', fillColor: '#3b82f6', demandSharePct: 18.0, currentDemandMw: 10200 },
      { id: 'de-south', name: 'TransnetBW & TenneT Bavaria/Baden-Württemberg', shortCode: 'SOUTH', pathD: 'M 140 330 L 370 340 L 330 490 L 160 480 Z', fillColor: '#10b981', demandSharePct: 26.0, currentDemandMw: 14750 },
    ],
    transmissionLines: [
      { id: 'de-suedlink', name: 'SuedLink ±525 kV HVDC Corridor', voltage: '±525 kV HVDC', pathD: 'M 230 110 Q 220 250, 230 420', fromNode: 'Brunsbüttel / North Sea Hub', toNode: 'Großgartach / Southern Load Center', capacityMw: 4000, currentFlowMw: 3600, status: 'energized', color: '#06b6d4', isHvdc: true },
      { id: 'de-380kv-east-west', name: '380 kV Central Transversal Line', voltage: '380 kV AC', pathD: 'M 160 260 L 320 260', fromNode: 'Rhine-Ruhr Substation', toNode: 'Leipzig / Halle Substation', capacityMw: 2500, currentFlowMw: 1980, status: 'optimal', color: '#10b981' },
      { id: 'de-380kv-south', name: '380 kV Baden-Württemberg Intertie', voltage: '380 kV AC', pathD: 'M 180 360 L 220 440', fromNode: 'Mannheim Hub', toNode: 'Stuttgart / Wendlingen Substation', capacityMw: 2200, currentFlowMw: 1750, status: 'optimal', color: '#10b981' },
    ],
    powerPlants: [
      { id: 'de-offshore', name: 'North Sea Wind Clusters (Borkum Riffgrund)', fuel: 'wind', capacityMw: 3400, currentOutputMw: 3100, cx: 200, cy: 80, provinceOrState: 'North Sea EEZ', operator: 'TenneT Offshore', commissioned: '2015-2023', co2Factor: 0, status: 'generating', description: 'Offshore wind farm fed into German mainland via HVDC converter platforms.' },
      { id: 'de-solar-bavaria', name: 'Bavaria Solar PV Parks & Agrivoltaics', fuel: 'solar', capacityMw: 14000, currentOutputMw: 9200, cx: 280, cy: 410, provinceOrState: 'Bavaria', operator: 'Distributed Solar', commissioned: '2010-2024', co2Factor: 0, status: 'generating', description: 'Massive solar adoption across southern Germany reaching peak generation at solar noon.' },
      { id: 'de-neurath', name: 'Neurath Lignite Coal Station', fuel: 'coal', capacityMw: 4200, currentOutputMw: 2900, cx: 140, cy: 260, provinceOrState: 'North Rhine-Westphalia', operator: 'RWE', commissioned: '1972-2012', co2Factor: 890, status: 'generating', description: 'Large lignite coal station providing thermal backup during low wind periods.' },
    ],
    hourlyTimeline: generateHourlyTimeline(56750, 285, 48.2, 74.2, {
      wind: 32.5,
      solar: 18.4,
      coal: 22.6,
      gas: 15.2,
      biomass: 7.8,
      hydro: 3.5,
    }),
  },

  // =========================================================================
  // FRANCE (RTE)
  // =========================================================================
  'fr-rte': {
    countryId: 'fr-rte',
    countryName: 'France',
    flag: '🇫🇷',
    gridOperator: 'Réseau de Transport d’Électricité (RTE)',
    transmissionBackbone: '400 kV Synchronous French Supergrid & Nuclear Export Arteries',
    mapViewBox: '0 0 520 520',
    baseCarbonIntensity: 42,
    installedCapacityMw: 139000,
    zones: [
      { id: 'fr-north', name: 'Hauts-de-France & Normandy Nuclear Hub', shortCode: 'NORTH', pathD: 'M 170 50 L 320 60 L 300 180 L 150 170 Z', fillColor: '#8b5cf6', demandSharePct: 24.0, currentDemandMw: 12200 },
      { id: 'fr-idf', name: 'Île-de-France (Paris Metro Area)', shortCode: 'PARIS', pathD: 'M 220 150 L 280 150 L 280 210 L 220 210 Z', fillColor: '#f59e0b', demandSharePct: 29.0, currentDemandMw: 14700 },
      { id: 'fr-east', name: 'Grand Est & Rhône Hydro-Nuclear Corridor', shortCode: 'EAST', pathD: 'M 300 170 L 430 180 L 400 370 L 290 350 Z', fillColor: '#3b82f6', demandSharePct: 21.0, currentDemandMw: 10600 },
      { id: 'fr-south', name: 'Occitanie & Provence-Alpes-Côte d’Azur', shortCode: 'SOUTH', pathD: 'M 160 330 L 390 350 L 340 480 L 170 470 Z', fillColor: '#10b981', demandSharePct: 26.0, currentDemandMw: 13200 },
    ],
    transmissionLines: [
      { id: 'fr-line-1', name: '400 kV Gravelines-to-Paris Double Circuit', voltage: '400 kV AC', pathD: 'M 240 70 L 250 160', fromNode: 'Gravelines Nuclear', toNode: 'Paris Outer Substation Ring', capacityMw: 4500, currentFlowMw: 4100, status: 'optimal', color: '#8b5cf6' },
      { id: 'fr-line-2', name: '400 kV Rhône River Valley Transmission Corridor', voltage: '400 kV AC', pathD: 'M 340 250 L 330 380', fromNode: 'Bugey & Cruas Nuclear', toNode: 'Marseille & South Coast Hub', capacityMw: 5000, currentFlowMw: 4650, status: 'optimal', color: '#10b981' },
      { id: 'fr-line-3', name: '400 kV Pyrenees Interconnector to Spain (INELFE)', voltage: '400 kV HVDC', pathD: 'M 220 460 L 220 500', fromNode: 'Baixas Substation', toNode: 'Santa Llogaia (Spain)', capacityMw: 2000, currentFlowMw: 1650, status: 'optimal', color: '#06b6d4', isHvdc: true },
    ],
    powerPlants: [
      { id: 'fr-gravelines', name: 'Gravelines Nuclear Power Station', fuel: 'nuclear', capacityMw: 5460, currentOutputMw: 5200, cx: 240, cy: 70, provinceOrState: 'Nord', operator: 'EDF', commissioned: '1980-1985', co2Factor: 0, status: 'generating', description: 'Largest nuclear power station in Western Europe (6x900 MW PWRs).' },
      { id: 'fr-cattenom', name: 'Cattenom Nuclear Power Station', fuel: 'nuclear', capacityMw: 5200, currentOutputMw: 4950, cx: 380, cy: 140, provinceOrState: 'Lorraine', operator: 'EDF', commissioned: '1986-1991', co2Factor: 0, status: 'generating', description: 'Four 1,300 MW PWR reactors feeding the eastern grid and export lines.' },
      { id: 'fr-grand-maison', name: 'Grand’Maison Hydroelectric Pumped Storage', fuel: 'hydro', capacityMw: 1800, currentOutputMw: 1200, cx: 350, cy: 310, provinceOrState: 'Isère (Alps)', operator: 'EDF', commissioned: '1985', co2Factor: 0, status: 'generating', description: 'Most powerful hydroelectric plant in France, capable of full 1.8 GW output in 3 minutes.' },
    ],
    hourlyTimeline: generateHourlyTimeline(50700, 42, 91.5, 52.4, {
      nuclear: 68.5,
      hydro: 14.8,
      wind: 8.2,
      solar: 4.5,
      gas: 3.2,
      biomass: 0.8,
    }),
  },

  // =========================================================================
  // CALIFORNIA (CAISO)
  // =========================================================================
  'us-caiso': {
    countryId: 'us-caiso',
    countryName: 'California (USA)',
    flag: '🇺🇸',
    gridOperator: 'California Independent System Operator (CAISO)',
    transmissionBackbone: '500 kV Pacific AC Intertie & Path 15 / Path 26 Corridors',
    mapViewBox: '0 0 500 550',
    baseCarbonIntensity: 185,
    installedCapacityMw: 86500,
    zones: [
      { id: 'ca-north', name: 'Northern California & Bay Area (PG&E)', shortCode: 'PG&E/BAY', pathD: 'M 130 60 L 260 90 L 230 250 L 100 220 Z', fillColor: '#3b82f6', demandSharePct: 38.0, currentDemandMw: 11400 },
      { id: 'ca-central', name: 'Central Valley Solar Belt', shortCode: 'VALLEY', pathD: 'M 190 220 L 290 230 L 270 340 L 160 330 Z', fillColor: '#f59e0b', demandSharePct: 18.0, currentDemandMw: 5400 },
      { id: 'ca-south', name: 'Southern California (SCE / SDGE)', shortCode: 'LA/SD', pathD: 'M 170 330 L 360 340 L 340 480 L 220 480 Z', fillColor: '#10b981', demandSharePct: 44.0, currentDemandMw: 13200 },
    ],
    transmissionLines: [
      { id: 'ca-path-15', name: 'Path 15 (Los Banos-Gates 500kV)', voltage: '500 kV AC', pathD: 'M 180 230 L 210 280', fromNode: 'Los Banos Substation', toNode: 'Gates Substation', capacityMw: 5400, currentFlowMw: 4200, status: 'energized', color: '#10b981' },
      { id: 'ca-path-26', name: 'Path 26 (Midway-Vincent 500kV)', voltage: '500 kV AC', pathD: 'M 210 280 L 260 360', fromNode: 'Midway Substation (Bakersfield)', toNode: 'Vincent Substation (Palmdale)', capacityMw: 4000, currentFlowMw: 3450, status: 'energized', color: '#10b981' },
      { id: 'ca-intertie', name: 'Pacific DC Intertie (PDCI Celilo to Sylmar)', voltage: '±500 kV HVDC', pathD: 'M 180 60 L 260 370', fromNode: 'Columbia River Hydro', toNode: 'Sylmar Converter Station (LA)', capacityMw: 3220, currentFlowMw: 2800, status: 'optimal', color: '#06b6d4', isHvdc: true },
    ],
    powerPlants: [
      { id: 'ca-diablo', name: 'Diablo Canyon Nuclear Power Plant', fuel: 'nuclear', capacityMw: 2240, currentOutputMw: 2210, cx: 160, cy: 320, provinceOrState: 'San Luis Obispo', operator: 'PG&E', commissioned: '1985-1986', co2Factor: 0, status: 'generating', description: 'California’s largest single clean power generator supplying 9% of state electricity.' },
      { id: 'ca-moss-landing', name: 'Moss Landing Vistra Battery Energy Storage', fuel: 'storage', capacityMw: 750, currentOutputMw: 450, cx: 140, cy: 230, provinceOrState: 'Monterey Bay', operator: 'Vistra Energy', commissioned: '2021-2023', co2Factor: 0, status: 'generating', description: 'One of the world’s largest lithium-ion BESS facilities soaking up daytime solar.' },
      { id: 'ca-ivanpah', name: 'Ivanpah & Desert Sunlight Solar PV/CSP', fuel: 'solar', capacityMw: 1800, currentOutputMw: 1650, cx: 330, cy: 370, provinceOrState: 'Mojave Desert', operator: 'BrightSource & NRG', commissioned: '2014', co2Factor: 0, status: 'generating', description: 'Utility-scale solar complex generating peak power into Southern California.' },
    ],
    hourlyTimeline: generateHourlyTimeline(30000, 185, 62.1, 48.6, {
      solar: 36.4,
      gas: 24.2,
      nuclear: 11.5,
      hydro: 10.8,
      wind: 9.3,
      storage: 4.8,
      imports: 3.0,
    }),
  },

  // =========================================================================
  // INDIA (GRID-INDIA / POSOCO)
  // =========================================================================
  'in-posoco': {
    countryId: 'in-posoco',
    countryName: 'India',
    flag: '🇮🇳',
    gridOperator: 'Grid Controller of India (Grid-India / POSOCO)',
    transmissionBackbone: '765 kV / 400 kV Synchronous National Grid & Green Energy Corridor',
    mapViewBox: '0 0 540 580',
    baseCarbonIntensity: 565,
    installedCapacityMw: 442000,
    zones: [
      { id: 'in-north', name: 'Northern Regional Grid (NR)', shortCode: 'NR', pathD: 'M 140 80 L 290 90 L 320 220 L 160 210 Z', fillColor: '#3b82f6', demandSharePct: 32.0, currentDemandMw: 68800 },
      { id: 'in-west', name: 'Western Regional Grid (WR)', shortCode: 'WR', pathD: 'M 110 210 L 280 220 L 260 370 L 120 360 Z', fillColor: '#f59e0b', demandSharePct: 36.0, currentDemandMw: 77400 },
      { id: 'in-south', name: 'Southern Regional Grid (SR)', shortCode: 'SR', pathD: 'M 180 370 L 280 370 L 240 520 L 190 520 Z', fillColor: '#10b981', demandSharePct: 22.0, currentDemandMw: 47300 },
      { id: 'in-east', name: 'Eastern & North Eastern Grid (ER/NER)', shortCode: 'ER/NER', pathD: 'M 290 190 L 440 180 L 410 330 L 290 320 Z', fillColor: '#8b5cf6', demandSharePct: 10.0, currentDemandMw: 21500 },
    ],
    transmissionLines: [
      { id: 'in-raigarh-pugalur', name: '±800 kV Raigarh-Pugalur HVDC Interconnector', voltage: '±800 kV HVDC', pathD: 'M 280 280 L 220 440', fromNode: 'Raigarh (Chhattisgarh)', toNode: 'Pugalur (Tamil Nadu)', capacityMw: 6000, currentFlowMw: 5400, status: 'optimal', color: '#06b6d4', isHvdc: true },
      { id: 'in-bhadla-line', name: '765 kV Green Energy Corridor (Bhadla to UP)', voltage: '765 kV AC', pathD: 'M 150 160 L 250 180', fromNode: 'Bhadla Solar Park', toNode: 'Agra Substation', capacityMw: 4000, currentFlowMw: 3750, status: 'energized', color: '#f59e0b' },
    ],
    powerPlants: [
      { id: 'in-bhadla', name: 'Bhadla Solar Park (World’s Largest Solar Cluster)', fuel: 'solar', capacityMw: 2245, currentOutputMw: 2100, cx: 150, cy: 160, provinceOrState: 'Rajasthan', operator: 'NTPC & Adani', commissioned: '2020', co2Factor: 0, status: 'generating', description: 'Massive solar park in the Thar Desert generating ultra-cheap green kilowatt-hours.' },
      { id: 'in-vindhyachal', name: 'Vindhyachal Super Thermal Power Station', fuel: 'coal', capacityMw: 4760, currentOutputMw: 4400, cx: 270, cy: 250, provinceOrState: 'Madhya Pradesh', operator: 'NTPC', commissioned: '1987-2015', co2Factor: 820, status: 'generating', description: 'One of the largest coal-fired thermal power stations in India.' },
      { id: 'in-kudankulam', name: 'Kudankulam Nuclear Power Plant (VVER-1000)', fuel: 'nuclear', capacityMw: 2000, currentOutputMw: 1980, cx: 210, cy: 510, provinceOrState: 'Tamil Nadu', operator: 'NPCIL', commissioned: '2014-2017', co2Factor: 0, status: 'generating', description: 'High-capacity Russian-designed pressurized water reactors providing steady southern baseload.' },
    ],
    hourlyTimeline: generateHourlyTimeline(215000, 565, 28.6, 51.2, {
      coal: 57.8,
      solar: 14.2,
      hydro: 11.0,
      wind: 8.2,
      nuclear: 3.4,
      gas: 3.4,
      biomass: 2.0,
    }),
  },
};

// Fallback generator for other regions in INITIAL_REGIONS
export function getCountryGridDetails(regionId: string): CountryGridDetails {
  if (COUNTRY_GRID_DATA[regionId]) {
    return COUNTRY_GRID_DATA[regionId];
  }

  // Generic fallback with realistic topology
  return {
    countryId: regionId,
    countryName: regionId.toUpperCase(),
    flag: '⚡',
    gridOperator: 'Regional Synchronous System Operator',
    transmissionBackbone: 'High Voltage Transmission Network (400 kV / 220 kV)',
    mapViewBox: '0 0 500 500',
    baseCarbonIntensity: 220,
    installedCapacityMw: 45000,
    zones: [
      { id: `${regionId}-north`, name: 'Northern Dispatch Zone', shortCode: 'NORTH', pathD: 'M 120 80 L 380 90 L 360 250 L 140 240 Z', fillColor: '#3b82f6', demandSharePct: 45.0, currentDemandMw: 11000 },
      { id: `${regionId}-south`, name: 'Southern Dispatch Zone', shortCode: 'SOUTH', pathD: 'M 140 250 L 360 260 L 320 420 L 160 410 Z', fillColor: '#10b981', demandSharePct: 55.0, currentDemandMw: 13500 },
    ],
    transmissionLines: [
      { id: `${regionId}-trunk-1`, name: '400 kV North-South Transmission Backbone', voltage: '400 kV AC', pathD: 'M 250 120 L 240 350', fromNode: 'Northern Generation Hub', toNode: 'Southern Load Hub', capacityMw: 3200, currentFlowMw: 2650, status: 'optimal', color: '#10b981' },
    ],
    powerPlants: [
      { id: `${regionId}-clean-1`, name: 'National Renewable Energy Hub', fuel: 'wind', capacityMw: 1800, currentOutputMw: 1450, cx: 230, cy: 130, provinceOrState: 'Zone North', co2Factor: 0, status: 'generating', description: 'Clean energy facility providing synchronized power to the grid.' },
      { id: `${regionId}-baseload-1`, name: 'Central Combined Cycle Generating Station', fuel: 'gas', capacityMw: 2400, currentOutputMw: 1850, cx: 250, cy: 330, provinceOrState: 'Zone South', co2Factor: 380, status: 'generating', description: 'Thermal balancing station providing frequency regulation.' },
    ],
    hourlyTimeline: generateHourlyTimeline(24500, 220, 52.0, 65.0, {
      hydro: 25.0,
      wind: 20.0,
      solar: 12.0,
      gas: 28.0,
      coal: 15.0,
    }),
  };
}
