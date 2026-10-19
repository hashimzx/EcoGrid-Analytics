import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { INITIAL_REGIONS } from './src/data/regionsData.ts';
import { DATABASE_SCHEMA_TABLES } from './src/data/schemaDefinitions.ts';
import { runWorkloadOptimization } from './src/utils/optimizer.ts';
import type { WorkloadProfile } from './src/types/optimization.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = process.env.PORT || 3000;
  const isProd = process.env.NODE_ENV === 'production';

  app.use(express.json());

  // API Route: Health check
  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'nominal',
      service: 'VoltGrid Global Telemetry Engine',
      timestamp: new Date().toISOString(),
    });
  });

  // API Route: List all synchronous regions
  app.get('/api/regions', (_req, res) => {
    res.json({
      success: true,
      count: INITIAL_REGIONS.length,
      regions: INITIAL_REGIONS,
    });
  });

  // API Route: UK Live telemetry proxy (National Grid ESO Carbon Intensity API)
  app.get('/api/regions/uk-live', async (_req, res) => {
    try {
      const [genRes, intRes] = await Promise.all([
        fetch('https://api.carbonintensity.org.uk/v1/generation'),
        fetch('https://api.carbonintensity.org.uk/v1/intensity')
      ]);

      if (!genRes.ok || !intRes.ok) {
        throw new Error(`Upstream API failed: ${genRes.status} / ${intRes.status}`);
      }

      const genData = await genRes.json();
      const intData = await intRes.json();

      res.json({
        success: true,
        source: 'api.carbonintensity.org.uk',
        intensity: intData.data?.[0]?.intensity,
        generationMix: genData.data?.generationmix,
        timestamp: new Date().toISOString(),
      });
    } catch (err: unknown) {
      res.status(500).json({
        success: false,
        error: err instanceof Error ? err.message : 'Failed to query live UK grid telemetry',
      });
    }
  });

  // API Route: Server-side Workload Optimizer
  app.post('/api/optimize', (req, res) => {
    try {
      const workload = req.body as WorkloadProfile;
      if (!workload || !workload.powerDemandMw || !workload.durationHours) {
        return res.status(400).json({ success: false, error: 'Invalid workload parameters' });
      }

      const result = runWorkloadOptimization(workload, INITIAL_REGIONS);
      return res.json({ success: true, result });
    } catch (err: unknown) {
      return res.status(500).json({
        success: false,
        error: err instanceof Error ? err.message : 'Optimization error',
      });
    }
  });

  // API Route: Get database schemas
  app.get('/api/schema', (_req, res) => {
    res.json({
      success: true,
      tables: DATABASE_SCHEMA_TABLES,
    });
  });

  // Serve Frontend
  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, () => {
    console.log(`VoltGrid Global telemetry server running on http://localhost:${PORT}`);
  });
}

startServer();
