import React, { useState } from 'react';
import { CredentialVaultEntry } from '../../types/user.ts';
import { Key, Plus, ShieldCheck, Check, Trash2, Radio, Server, RefreshCw } from 'lucide-react';

const INITIAL_CREDENTIALS: CredentialVaultEntry[] = [
  {
    id: 'crd_001fe482',
    companyId: 'cmp_44b82c19',
    label: 'AWS eu-west-1 (Ireland) Spot Batch Dispatcher',
    provider: 'aws_spot',
    keyHint: 'AKIA...94FA',
    status: 'active',
    targetRegion: 'gb-uk',
    lastUsedAt: '12m ago',
    createdAt: '2026-03-20',
  },
  {
    id: 'crd_002cc819',
    companyId: 'cmp_77f11e92',
    label: 'Tesla Megapack SCADA Dispatch Gateway',
    provider: 'scada_modbus',
    keyHint: 'bess_gw_tx_...012a',
    status: 'active',
    targetRegion: 'us-ercot',
    lastUsedAt: '4h ago',
    createdAt: '2026-05-12',
  },
  {
    id: 'crd_00399ba1',
    companyId: 'cmp_44b82c19',
    label: 'GCP us-central1 Cloud Run Batch Worker',
    provider: 'gcp_batch',
    keyHint: 'gcp_sa_...811f',
    status: 'testing',
    targetRegion: 'us-pjm',
    lastUsedAt: '1d ago',
    createdAt: '2026-08-01',
  }
];

export const CredentialsVaultModal: React.FC = () => {
  const [credentials, setCredentials] = useState<CredentialVaultEntry[]>(INITIAL_CREDENTIALS);
  const [showAddForm, setShowAddForm] = useState(false);
  const [testingId, setTestingId] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{ id: string; success: boolean } | null>(null);

  // New Credential Form State
  const [newLabel, setNewLabel] = useState('');
  const [newProvider, setNewProvider] = useState<CredentialVaultEntry['provider']>('aws_spot');
  const [newKey, setNewKey] = useState('');
  const [newRegion, setNewRegion] = useState('gb-uk');

  const handleTestConnection = (id: string) => {
    setTestingId(id);
    setTestResult(null);
    setTimeout(() => {
      setTestingId(null);
      setTestResult({ id, success: true });
      setTimeout(() => setTestResult(null), 3500);
    }, 1200);
  };

  const handleRevoke = (id: string) => {
    setCredentials(prev => prev.filter(c => c.id !== id));
  };

  const handleCreateCredential = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLabel || !newKey) return;

    const maskedHint = newKey.length > 8 
      ? `${newKey.slice(0, 4)}...${newKey.slice(-4)}`
      : 'key_***_live';

    const entry: CredentialVaultEntry = {
      id: `crd_${Math.random().toString(36).substring(2, 10)}`,
      companyId: 'cmp_44b82c19',
      label: newLabel,
      provider: newProvider,
      keyHint: maskedHint,
      status: 'active',
      targetRegion: newRegion,
      lastUsedAt: 'Just now',
      createdAt: new Date().toISOString().split('T')[0],
    };

    setCredentials([entry, ...credentials]);
    setNewLabel('');
    setNewKey('');
    setShowAddForm(false);
  };

  return (
    <div className="space-y-6">
      {/* Vault Header */}
      <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <Key className="w-5 h-5" />
            </span>
            <div>
              <h1 className="text-xl font-bold text-white">Enterprise API Credentials Vault</h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Zero-knowledge encrypted storage for cloud spot-instance dispatch tokens, SCADA gateways, and automated webhook triggers.
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="px-4 py-2 text-xs font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-lg flex items-center gap-1.5 transition-colors self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Add Credential Key</span>
          </button>
        </div>
      </div>

      {/* Add New Credential Form Box */}
      {showAddForm && (
        <form onSubmit={handleCreateCredential} className="p-5 rounded-2xl bg-slate-900/60 border border-emerald-800/60 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Register Secure Dispatch Credential</h3>
            <span className="text-[11px] text-emerald-400 font-mono">AES-256 Vault Encryption</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-slate-400 font-medium mb-1">Credential Label / Name</label>
              <input
                type="text"
                required
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                placeholder="e.g. AWS eu-central-1 Spot AutoScaler"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500 placeholder-slate-600"
              />
            </div>

            <div>
              <label className="block text-slate-400 font-medium mb-1">Target Cloud / Hardware Provider</label>
              <select
                value={newProvider}
                onChange={(e) => setNewProvider(e.target.value as CredentialVaultEntry['provider'])}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-300 focus:outline-none focus:border-emerald-500"
              >
                <option value="aws_spot">AWS EC2 Spot Instances (boto3 / SDK)</option>
                <option value="gcp_batch">GCP Cloud Batch / Spot VM</option>
                <option value="azure_spot">Azure Spot Virtual Machines</option>
                <option value="scada_modbus">Industrial SCADA / Modbus Gateway (BESS)</option>
                <option value="custom_webhook">Custom HTTP Webhook Endpoint</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-400 font-medium mb-1">Target Synchronous Grid Region</label>
              <select
                value={newRegion}
                onChange={(e) => setNewRegion(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-300 focus:outline-none focus:border-emerald-500"
              >
                <option value="gb-uk">Great Britain (NESO)</option>
                <option value="nordic-pool">Nordic Pool (Norway / Sweden)</option>
                <option value="fr-rte">France (RTE)</option>
                <option value="de-smard">Germany (SMARD)</option>
                <option value="us-caiso">California (CAISO)</option>
                <option value="us-ercot">Texas (ERCOT)</option>
                <option value="us-pjm">Mid-Atlantic (PJM Ashburn)</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-400 font-medium mb-1">API Key / Access Token</label>
              <input
                type="password"
                required
                value={newKey}
                onChange={(e) => setNewKey(e.target.value)}
                placeholder="sk_live_... or AWS Secret"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500 placeholder-slate-600"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white bg-slate-800 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-lg transition-colors"
            >
              Store &amp; Encrypt Key
            </button>
          </div>
        </form>
      )}

      {/* Credentials List */}
      <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider">Active Vault Tokens ({credentials.length})</h2>
          <span className="text-xs text-slate-400 font-mono">TLS 1.3 Certified</span>
        </div>

        <div className="divide-y divide-slate-800">
          {credentials.map((cred) => {
            const isTestingThis = testingId === cred.id;
            const testOk = testResult?.id === cred.id && testResult.success;

            return (
              <div key={cred.id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Server className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span className="font-semibold text-white text-sm">{cred.label}</span>
                    <span className="font-mono text-[10px] bg-slate-950 border border-slate-800 px-2 py-0.5 rounded text-slate-400">
                      {cred.provider}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 text-slate-400 text-xs pl-6">
                    <span>Key Fingerprint: <code className="font-mono text-cyan-400">{cred.keyHint}</code></span>
                    <span aria-hidden="true">·</span>
                    <span>Region: <strong className="text-slate-300 font-mono">{cred.targetRegion}</strong></span>
                    <span aria-hidden="true">·</span>
                    <span>Last Active: {cred.lastUsedAt}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 self-end sm:self-auto">
                  {testOk && (
                    <span className="text-emerald-400 font-mono text-[11px] flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" />
                      <span>Handshake OK</span>
                    </span>
                  )}

                  <button
                    onClick={() => handleTestConnection(cred.id)}
                    disabled={isTestingThis}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium flex items-center gap-1 transition-colors disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3 h-3 ${isTestingThis ? 'animate-spin' : ''}`} />
                    <span>{isTestingThis ? 'Testing...' : 'Test Ping'}</span>
                  </button>

                  <button
                    onClick={() => handleRevoke(cred.id)}
                    title="Revoke Credential"
                    className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
