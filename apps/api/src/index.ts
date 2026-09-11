import 'dotenv/config';
import express from 'express';
import type { Application, Request, Response } from 'express';
import cors from 'cors';
import * as helmetImport from 'helmet';
import healthRouter from './routes/health.js';

const helmet: any = (helmetImport as any).default ?? helmetImport;
const app: Application = express();
const port = process.env.PORT || 5000;

// Security & Utility Middlewares
app.use(helmet());
app.use(cors());
app.use(express.json());

app.get('/', (req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'Bisa Backend API is running successfully!',
  });
});

app.use('/health/supabase', healthRouter);
app.get('/health', (_req: Request, res: Response) => {
  res.json({ success: true, message: 'ok', supabase: '/health/supabase' });
});

export default app;

if (!process.env.VERCEL) {
  app.listen(port, () => {
    console.log(`[Server]: API running on http://localhost:${port}`);
  });
}
