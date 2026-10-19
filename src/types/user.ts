export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: 'individual' | 'enterprise_admin' | 'devops_engineer' | 'esg_officer';
  companyId?: string;
  defaultRegion: string;
  carbonTargetGPerKwh: number;
  notificationPreferences: {
    priceSpikeAlerts: boolean;
    curtailmentAlerts: boolean;
    dispatchConfirmations: boolean;
  };
}

export interface CompanyProfile {
  id: string;
  name: string;
  industry: 'ai_cloud_infrastructure' | 'battery_bess_operator' | 'heavy_industry' | 'ev_logistics';
  tier: 'starter' | 'pro' | 'enterprise';
  headquarters: string;
  esgScope2TargetYear: number;
  activeWorkloadsCount: number;
  apiTokensCount: number;
}

export interface CredentialVaultEntry {
  id: string;
  companyId: string;
  label: string;
  provider: 'aws_spot' | 'gcp_batch' | 'azure_spot' | 'scada_modbus' | 'custom_webhook';
  keyHint: string; // e.g. "ak_live_...94fa"
  status: 'active' | 'testing' | 'revoked';
  targetRegion: string;
  lastUsedAt: string;
  createdAt: string;
}

export interface DatabaseTableDefinition {
  tableName: string;
  displayName: string;
  description: string;
  primaryKey: string;
  columns: {
    name: string;
    type: 'string' | 'number' | 'boolean' | 'timestamp' | 'json' | 'uuid';
    nullable: boolean;
    isIndexed?: boolean;
    description: string;
  }[];
  sampleRecords: Record<string, unknown>[];
}
