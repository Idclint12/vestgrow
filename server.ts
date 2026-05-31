import express, { Request, Response } from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // 1. API: Paystack Webhook
  // Receives payment confirmation callback and simulates the Cloud Function endpoint
  app.post('/api/paystack/webhook', (req: Request, res: Response) => {
    const { reference, status, amount, currency, userId } = req.body;
    console.log(`[Paystack Webhook] Received payment update for ref: ${reference}`);
    
    // Validate request structure
    if (!reference) {
      res.status(400).json({ error: 'Missing Paystack reference' });
      return;
    }

    // Success response indicating webhook successfully acknowledged
    res.json({
      status: 'success',
      message: 'Webhook processed successfully',
      data: {
        reference,
        status: status || 'success',
        gateway: 'paystack',
        processedAt: new Date().toISOString()
      }
    });
  });

  // 2. API: Cloud Function Simulator triggered by Admin action (or periodic interval)
  // For SMS and email triggers simulated inside reports
  app.post('/api/system/maturity-check', (req: Request, res: Response) => {
    res.json({
      status: 'success',
      message: 'Maturity checker successfully completed scan',
      timestamp: new Date().toISOString(),
      maturedCount: Math.floor(Math.random() * 2) // Represent random checks
    });
  });

  // 3. API: Status endpoints
  app.get('/api/health', (req: Request, res: Response) => {
    res.json({ status: 'ok', serverTime: new Date().toISOString(), app: 'VestGrow' });
  });

  // 4. Vite Dev Server Integration OR Static File Server
  if (process.env.NODE_ENV !== 'production') {
    console.log('[Server] Integrating Vite middleware (Development Mode)');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    console.log('[Server] Mounting Static file directory (Production Mode)');
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`VestGrow Server satisfies Port 3000 routing at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((error) => {
  console.error('[Startup Error] Failed to boot server:', error);
});
