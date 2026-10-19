import { DatabaseTableDefinition } from '../types/user.ts';

export const DATABASE_SCHEMA_TABLES: DatabaseTableDefinition[] = [
  {
    tableName: 'users',
    displayName: 'Users & Stakeholders',
    description: 'User authentication, roles (enterprise admin, devops, ESG compliance), and regional preferences.',
    primaryKey: 'id',
    columns: [
      { name: 'id', type: 'uuid', nullable: false, isIndexed: true, description: 'Unique user identifier' },
      { name: 'email', type: 'string', nullable: false, isIndexed: true, description: 'User corporate or personal email' },
      { name: 'name', type: 'string', nullable: false, description: 'Full user name' },
      { name: 'role', type: 'string', nullable: false, description: 'Role: individual | enterprise_admin | devops_engineer | esg_officer' },
      { name: 'company_id', type: 'uuid', nullable: true, isIndexed: true, description: 'Foreign key to companies table (if corporate user)' },
      { name: 'default_region', type: 'string', nullable: false, description: 'Default local grid region (e.g. gb-uk, us-caiso)' },
      { name: 'carbon_target_g_kwh', type: 'number', nullable: false, description: 'Target maximum carbon intensity (gCO2/kWh)' },
      { name: 'created_at', type: 'timestamp', nullable: false, description: 'Record creation timestamp' },
      { name: 'updated_at', type: 'timestamp', nullable: false, description: 'Last profile update timestamp' },
    ],
    sampleRecords: [
      {
        id: 'usr_98a72f01',
        email: 'hashimzafar2k@gmail.com',
        name: 'Hashim Zafar',
        role: 'enterprise_admin',
        company_id: 'cmp_44b82c19',
        default_region: 'gb-uk',
        carbon_target_g_kwh: 100,
        created_at: '2026-03-15T09:30:00Z',
        updated_at: '2026-10-19T00:45:00Z',
      },
      {
        id: 'usr_23c91a04',
        email: 'elena.rostova@hyperscale-grid.eu',
        name: 'Dr. Elena Rostova',
        role: 'devops_engineer',
        company_id: 'cmp_44b82c19',
        default_region: 'nordic-pool',
        carbon_target_g_kwh: 50,
        created_at: '2026-04-10T14:15:00Z',
        updated_at: '2026-10-19T00:10:00Z',
      }
    ]
  },
  {
    tableName: 'companies',
    displayName: 'Company Entities',
    description: 'Corporate organizational accounts with ESG emissions targets and cloud compute allocations.',
    primaryKey: 'id',
    columns: [
      { name: 'id', type: 'uuid', nullable: false, isIndexed: true, description: 'Unique company organizational ID' },
      { name: 'name', type: 'string', nullable: false, isIndexed: true, description: 'Company legal / commercial name' },
      { name: 'industry', type: 'string', nullable: false, description: 'Sector: ai_cloud_infrastructure | battery_bess_operator | heavy_industry | ev_logistics' },
      { name: 'tier', type: 'string', nullable: false, description: 'Subscription tier: starter | pro | enterprise' },
      { name: 'headquarters', type: 'string', nullable: false, description: 'HQ location (city, country)' },
      { name: 'esg_scope2_target_year', type: 'number', nullable: false, description: 'Net-zero Scope 2 target commitment year' },
      { name: 'created_at', type: 'timestamp', nullable: false, description: 'Organization onboarded date' },
    ],
    sampleRecords: [
      {
        id: 'cmp_44b82c19',
        name: 'DeepCompute Systems Global',
        industry: 'ai_cloud_infrastructure',
        tier: 'enterprise',
        headquarters: 'London, United Kingdom',
        esg_scope2_target_year: 2030,
        created_at: '2026-01-10T08:00:00Z',
      },
      {
        id: 'cmp_77f11e92',
        name: 'Aether BESS Capital',
        industry: 'battery_bess_operator',
        tier: 'enterprise',
        headquarters: 'Austin, Texas, USA',
        esg_scope2_target_year: 2028,
        created_at: '2026-02-01T11:00:00Z',
      }
    ]
  },
  {
    tableName: 'workload_profiles',
    displayName: 'Workload & Demand Profiles',
    description: 'Configured energy-intensive jobs (AI training, batch processing, BESS charging, EV fleet).',
    primaryKey: 'id',
    columns: [
      { name: 'id', type: 'uuid', nullable: false, isIndexed: true, description: 'Unique workload identifier' },
      { name: 'company_id', type: 'uuid', nullable: false, isIndexed: true, description: 'Foreign key to companies' },
      { name: 'created_by_user_id', type: 'uuid', nullable: false, description: 'Foreign key to users' },
      { name: 'name', type: 'string', nullable: false, description: 'Job title' },
      { name: 'category', type: 'string', nullable: false, isIndexed: true, description: 'ai_training | batch_compute | bess_storage | ev_fleet | industrial_electrolyzer' },
      { name: 'power_demand_mw', type: 'number', nullable: false, description: 'Steady state electrical load in Megawatts (MW)' },
      { name: 'duration_hours', type: 'number', nullable: false, description: 'Required continuous run duration' },
      { name: 'max_delay_hours', type: 'number', nullable: false, description: 'Maximum allowable dispatch delay for wait-and-save arbitrage' },
      { name: 'urgency', type: 'string', nullable: false, description: 'immediate | flexible | overnight | opportunistic' },
      { name: 'compliance_constraint', type: 'string', nullable: false, description: 'any | eu_gdpr | us_only | local_only' },
      { name: 'price_cap_per_mwh', type: 'number', nullable: true, description: 'Maximum wholesale price willing to pay' },
      { name: 'carbon_cap_g_kwh', type: 'number', nullable: true, description: 'Maximum allowable carbon intensity' },
      { name: 'created_at', type: 'timestamp', nullable: false, description: 'Creation timestamp' },
    ],
    sampleRecords: [
      {
        id: 'wkl_110a34e8',
        company_id: 'cmp_44b82c19',
        created_by_user_id: 'usr_98a72f01',
        name: 'Llama 3 70B Checkpoint Training',
        category: 'ai_training',
        power_demand_mw: 4.5,
        duration_hours: 8,
        max_delay_hours: 12,
        urgency: 'flexible',
        compliance_constraint: 'any',
        price_cap_per_mwh: 75.0,
        carbon_cap_g_kwh: 160,
        created_at: '2026-10-18T18:20:00Z',
      }
    ]
  },
  {
    tableName: 'region_snapshots',
    displayName: 'Regional Grid Telemetry Logs',
    description: 'High-frequency telemetry snapshots of wholesale price, carbon intensity, frequency, and fuel mixes.',
    primaryKey: 'id',
    columns: [
      { name: 'id', type: 'uuid', nullable: false, isIndexed: true, description: 'Unique snapshot log ID' },
      { name: 'region_id', type: 'string', nullable: false, isIndexed: true, description: 'Grid code: gb-uk, us-caiso, nordic-pool, de-smard, etc.' },
      { name: 'timestamp', type: 'timestamp', nullable: false, isIndexed: true, description: 'Observation timestamp (UTC)' },
      { name: 'demand_mw', type: 'number', nullable: false, description: 'Instantaneous total system load' },
      { name: 'carbon_intensity_g_kwh', type: 'number', nullable: false, description: 'Carbon intensity (gCO2eq / kWh)' },
      { name: 'wholesale_price_local', type: 'number', nullable: false, description: 'Spot / Day-ahead wholesale clearing price in local currency' },
      { name: 'wholesale_price_usd', type: 'number', nullable: false, isIndexed: true, description: 'Normalized price in USD/MWh for spatial arbitrage' },
      { name: 'frequency_hz', type: 'number', nullable: false, description: 'Grid frequency (Hz)' },
      { name: 'renewable_percentage', type: 'number', nullable: false, description: 'Renewable energy share (0 - 100%)' },
      { name: 'clean_percentage', type: 'number', nullable: false, description: 'Renewables + Nuclear share (0 - 100%)' },
      { name: 'generation_mix_json', type: 'json', nullable: false, description: 'Full breakdown array of fuel types, MW, and percentages' },
      { name: 'interconnector_flows_json', type: 'json', nullable: true, description: 'Net cross-border flows' },
    ],
    sampleRecords: [
      {
        id: 'snp_999a01b2',
        region_id: 'gb-uk',
        timestamp: '2026-10-19T00:45:00Z',
        demand_mw: 29420,
        carbon_intensity_g_kwh: 128,
        wholesale_price_local: 68.40,
        wholesale_price_usd: 86.80,
        frequency_hz: 50.018,
        renewable_percentage: 52.4,
        clean_percentage: 68.2,
        generation_mix_json: [
          { fuel: 'wind', mw: 11250, pct: 38.2 },
          { fuel: 'gas', mw: 8200, pct: 27.9 },
          { fuel: 'nuclear', mw: 4650, pct: 15.8 }
        ],
        interconnector_flows_json: [{ name: 'IFA1', mw: 1850 }, { name: 'NSL', mw: 1380 }]
      }
    ]
  },
  {
    tableName: 'optimization_runs',
    displayName: 'Optimization Execution Logs',
    description: 'Algorithmic recommendations, spatial dispatch decisions, and "Wait & Save" temporal arbitrage results.',
    primaryKey: 'id',
    columns: [
      { name: 'id', type: 'uuid', nullable: false, isIndexed: true, description: 'Optimization execution ID' },
      { name: 'workload_id', type: 'uuid', nullable: false, isIndexed: true, description: 'Target workload profile ID' },
      { name: 'user_id', type: 'uuid', nullable: false, description: 'Executing user ID' },
      { name: 'executed_at', type: 'timestamp', nullable: false, description: 'Calculation timestamp' },
      { name: 'recommended_region_id', type: 'string', nullable: false, description: 'Optimal spatial region' },
      { name: 'recommended_start_hour_offset', type: 'number', nullable: false, description: 'Optimal wait delay in hours (0 = immediate)' },
      { name: 'immediate_cost_usd', type: 'number', nullable: false, description: 'Total cost if dispatched right now' },
      { name: 'optimized_cost_usd', type: 'number', nullable: false, description: 'Total cost if wait-and-save window is used' },
      { name: 'savings_usd', type: 'number', nullable: false, description: 'Net financial savings' },
      { name: 'savings_pct', type: 'number', nullable: false, description: 'Percentage savings' },
      { name: 'carbon_reduction_kg', type: 'number', nullable: false, description: 'Carbon avoided (kg CO2eq)' },
      { name: 'curtailment_exploited', type: 'boolean', nullable: false, description: 'Whether negative/near-zero pricing was captured' },
    ],
    sampleRecords: [
      {
        id: 'opt_7720bc91',
        workload_id: 'wkl_110a34e8',
        user_id: 'usr_98a72f01',
        executed_at: '2026-10-19T00:46:00Z',
        recommended_region_id: 'nordic-pool',
        recommended_start_hour_offset: 3,
        immediate_cost_usd: 3124.80,
        optimized_cost_usd: 1116.00,
        savings_usd: 2008.80,
        savings_pct: 64.3,
        carbon_reduction_kg: 924.5,
        curtailment_exploited: false,
      }
    ]
  },
  {
    tableName: 'company_credentials',
    displayName: 'Secure API Credentials Vault',
    description: 'Encrypted credential vault for cloud dispatch spot instances (AWS, GCP, Azure) and BESS SCADA endpoints.',
    primaryKey: 'id',
    columns: [
      { name: 'id', type: 'uuid', nullable: false, isIndexed: true, description: 'Credential vault entry ID' },
      { name: 'company_id', type: 'uuid', nullable: false, isIndexed: true, description: 'Owning company ID' },
      { name: 'label', type: 'string', nullable: false, description: 'Human-readable descriptor' },
      { name: 'provider', type: 'string', nullable: false, description: 'aws_spot | gcp_batch | azure_spot | scada_modbus | custom_webhook' },
      { name: 'key_fingerprint', type: 'string', nullable: false, description: 'Public key hash / masked key identifier' },
      { name: 'encrypted_secret_payload', type: 'string', nullable: false, description: 'AES-256 encrypted token payload' },
      { name: 'target_region', type: 'string', nullable: false, description: 'Mapped grid or cloud datacenter region' },
      { name: 'status', type: 'string', nullable: false, description: 'active | testing | revoked' },
      { name: 'last_dispatched_at', type: 'timestamp', nullable: true, description: 'Last automated trigger time' },
      { name: 'created_at', type: 'timestamp', nullable: false, description: 'Vault entry creation timestamp' },
    ],
    sampleRecords: [
      {
        id: 'crd_001fe482',
        company_id: 'cmp_44b82c19',
        label: 'AWS eu-west-1 (Ireland) Spot Batch Dispatcher',
        provider: 'aws_spot',
        key_fingerprint: 'AKIA...94FA',
        encrypted_secret_payload: 'aes256:v1:98fae8...[ENCRYPTED_VAULT_RECORD]',
        target_region: 'gb-uk',
        status: 'active',
        last_dispatched_at: '2026-10-18T22:15:00Z',
        created_at: '2026-03-20T10:00:00Z',
      },
      {
        id: 'crd_002cc819',
        company_id: 'cmp_77f11e92',
        label: 'Tesla Megapack SCADA Dispatch Gateway',
        provider: 'scada_modbus',
        key_fingerprint: 'bess_gw_tx_...012a',
        encrypted_secret_payload: 'aes256:v1:771bc0...[ENCRYPTED_VAULT_RECORD]',
        target_region: 'us-ercot',
        status: 'active',
        last_dispatched_at: '2026-10-18T16:00:00Z',
        created_at: '2026-05-12T14:30:00Z',
      }
    ]
  }
];
