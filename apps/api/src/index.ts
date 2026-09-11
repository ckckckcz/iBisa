import 'dotenv/config';
import express from 'express';
import type { Application, Request, Response } from 'express';
import cors from 'cors';
import * as helmetImport from 'helmet';
import healthRouter from './routes/health.js';
import authRouter from './routes/auth.js';
import schoolRouter from './routes/school.js';
import { authenticate, authorize } from './middlewares/auth.js';

const helmet: any = (helmetImport as any).default ?? helmetImport;
const app: Application = express();
const port = process.env.PORT || 5000;

// Security & Utility Middlewares
app.use(cors({ origin: true, credentials: true }));
app.use(helmet());
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
app.use('/auth', authRouter);
app.use('/school', schoolRouter);
app.get('/school/me', authenticate, authorize('school'), (req: Request, res: Response) => res.json({ success: true, profile: (req as any).profile }));
app.get('/teacher/me', authenticate, authorize('teacher'), (req: Request, res: Response) => res.json({ success: true, profile: (req as any).profile }));
app.get('/student/me', authenticate, authorize('student'), (req: Request, res: Response) => res.json({ success: true, profile: (req as any).profile }));

export default app;

if (!process.env.VERCEL) {
  app.listen(port, () => {
    console.log(`[Server]: API running on http://localhost:${port}`);
  });
}
