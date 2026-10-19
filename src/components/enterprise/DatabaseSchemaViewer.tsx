import React, { useState } from 'react';
import { DATABASE_SCHEMA_TABLES } from '../../data/schemaDefinitions.ts';
import { DatabaseTableDefinition } from '../../types/user.ts';
import { Database, Table, Key, FileCode, Check, Download, Layers } from 'lucide-react';

export const DatabaseSchemaViewer: React.FC = () => {
  const [selectedTable, setSelectedTable] = useState<DatabaseTableDefinition>(DATABASE_SCHEMA_TABLES[0]);
  const [activeTab, setActiveTab] = useState<'columns' | 'records' | 'ddl'>('columns');
  const [copiedSql, setCopiedSql] = useState(false);

  // Generate clean PostgreSQL DDL
  const generateSqlDdl = (tbl: DatabaseTableDefinition): string => {
    const colDefs = tbl.columns.map(c => {
      let sqlType = 'VARCHAR(255)';
      if (c.type === 'uuid') sqlType = 'UUID';
      else if (c.type === 'number') sqlType = 'DOUBLE PRECISION';
      else if (c.type === 'boolean') sqlType = 'BOOLEAN';
      else if (c.type === 'timestamp') sqlType = 'TIMESTAMPTZ';
      else if (c.type === 'json') sqlType = 'JSONB';

      const nullConstraint = c.nullable ? '' : ' NOT NULL';
      const pkConstraint = c.name === tbl.primaryKey ? ' PRIMARY KEY' : '';
      return `  "${c.name}" ${sqlType}${nullConstraint}${pkConstraint}`;
    }).join(',\n');

    const indexDefs = tbl.columns
      .filter(c => c.isIndexed && c.name !== tbl.primaryKey)
      .map(c => `CREATE INDEX idx_${tbl.tableName}_${c.name} ON "${tbl.tableName}" ("${c.name}");`)
      .join('\n');

    return `-- Table: ${tbl.displayName}\n-- ${tbl.description}\nCREATE TABLE IF NOT EXISTS "${tbl.tableName}" (\n${colDefs}\n);\n\n${indexDefs}`;
  };

  const handleCopySql = () => {
    navigator.clipboard.writeText(generateSqlDdl(selectedTable));
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2000);
  };

  const handleDownloadFullSchemaJson = () => {
    const blob = new Blob([JSON.stringify(DATABASE_SCHEMA_TABLES, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'voltgrid-database-schema.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Schema Header */}
      <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Database className="w-5 h-5" />
            </span>
            <div>
              <h1 className="text-xl font-bold text-white">Database &amp; Telemetry Data Architecture</h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Schema definitions for multi-tenant users, company entities, high-frequency grid analytics, and optimization runs.
              </p>
            </div>
          </div>

          <button
            onClick={handleDownloadFullSchemaJson}
            className="px-4 py-2 text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-lg flex items-center gap-2 transition-colors self-start sm:self-auto"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Schema JSON</span>
          </button>
        </div>

        {/* Table Selector Pills */}
        <div className="mt-5 pt-4 border-t border-slate-800 flex flex-wrap gap-2">
          {DATABASE_SCHEMA_TABLES.map((tbl) => {
            const isSelected = selectedTable.tableName === tbl.tableName;
            return (
              <button
                key={tbl.tableName}
                onClick={() => setSelectedTable(tbl)}
                className={`px-3.5 py-2 text-xs font-medium rounded-lg border transition-all flex items-center gap-2 ${
                  isSelected 
                    ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300 font-semibold' 
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                }`}
              >
                <Table className="w-3.5 h-3.5" />
                <span>{tbl.tableName}</span>
                <span className="text-[10px] text-slate-500 font-mono">({tbl.columns.length} cols)</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Table Overview Card */}
      <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white font-mono">{selectedTable.tableName}</h2>
              <span className="text-xs text-slate-400 font-sans">({selectedTable.displayName})</span>
            </div>
            <p className="text-xs text-slate-400 mt-1">{selectedTable.description}</p>
          </div>

          {/* Sub-tabs: Columns | Sample Records | DDL */}
          <div className="flex items-center p-1 bg-slate-950 rounded-lg border border-slate-800 text-xs">
            <button
              onClick={() => setActiveTab('columns')}
              className={`px-3 py-1 font-medium rounded-md transition-colors ${
                activeTab === 'columns' ? 'bg-emerald-500/20 text-emerald-400 font-semibold' : 'text-slate-400 hover:text-white'
              }`}
            >
              Columns ({selectedTable.columns.length})
            </button>
            <button
              onClick={() => setActiveTab('records')}
              className={`px-3 py-1 font-medium rounded-md transition-colors ${
                activeTab === 'records' ? 'bg-emerald-500/20 text-emerald-400 font-semibold' : 'text-slate-400 hover:text-white'
              }`}
            >
              Sample Data ({selectedTable.sampleRecords.length})
            </button>
            <button
              onClick={() => setActiveTab('ddl')}
              className={`px-3 py-1 font-medium rounded-md transition-colors ${
                activeTab === 'ddl' ? 'bg-emerald-500/20 text-emerald-400 font-semibold' : 'text-slate-400 hover:text-white'
              }`}
            >
              SQL DDL
            </button>
          </div>
        </div>

        {/* View 1: Columns Table */}
        {activeTab === 'columns' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[11px] font-semibold">
                  <th className="py-2.5 px-3">Column Name</th>
                  <th className="py-2.5 px-3">Data Type</th>
                  <th className="py-2.5 px-3">Constraints</th>
                  <th className="py-2.5 px-3">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {selectedTable.columns.map((col) => {
                  const isPk = col.name === selectedTable.primaryKey;
                  return (
                    <tr key={col.name} className="hover:bg-slate-950/40 transition-colors">
                      <td className="py-2.5 px-3 font-semibold text-white flex items-center gap-1.5">
                        {isPk && <Key className="w-3 h-3 text-amber-400 shrink-0" />}
                        <span>{col.name}</span>
                      </td>
                      <td className="py-2.5 px-3 text-emerald-400">{col.type}</td>
                      <td className="py-2.5 px-3 text-[11px]">
                        <span className="text-slate-400">{col.nullable ? 'NULLABLE' : 'NOT NULL'}</span>
                        {col.isIndexed && (
                          <span className="ml-2 text-cyan-400 font-sans">· INDEXED</span>
                        )}
                        {isPk && (
                          <span className="ml-2 text-amber-400 font-sans">· PRIMARY KEY</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 font-sans text-slate-300">{col.description}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* View 2: Sample Records JSON */}
        {activeTab === 'records' && (
          <div className="space-y-3">
            <div className="text-xs text-slate-400 font-mono">
              Live Mock Data Seed ({selectedTable.sampleRecords.length} records available):
            </div>
            <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-cyan-300 overflow-x-auto max-h-96">
              {JSON.stringify(selectedTable.sampleRecords, null, 2)}
            </pre>
          </div>
        )}

        {/* View 3: SQL DDL */}
        {activeTab === 'ddl' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400 font-mono">PostgreSQL / Cloud SQL DDL:</span>
              <button
                onClick={handleCopySql}
                className="px-3 py-1.5 text-xs font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 rounded-lg flex items-center gap-1.5 hover:bg-emerald-500/30 transition-colors"
              >
                <Check className="w-3.5 h-3.5" />
                <span>{copiedSql ? 'Copied SQL!' : 'Copy SQL Script'}</span>
              </button>
            </div>
            <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-emerald-300 overflow-x-auto max-h-96">
              {generateSqlDdl(selectedTable)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};
