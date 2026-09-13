import 'dotenv/config';
import express from 'express';
import type { Application, Request, Response } from 'express';
import cors from 'cors';
import {
  contentSecurityPolicy,
  crossOriginEmbedderPolicy,
  crossOriginOpenerPolicy,
  crossOriginResourcePolicy,
  dnsPrefetchControl,
  frameguard,
  hidePoweredBy,
  ieNoOpen,
  noSniff,
  originAgentCluster,
  permittedCrossDomainPolicies,
  referrerPolicy,
  strictTransportSecurity,
} from 'helmet';
import healthRouter from './routes/health.js';
import authRouter from './routes/auth.js';
import schoolRouter from './routes/school.js';
import { authenticate, authorize, type AuthenticatedRequest } from './middlewares/auth.js';

const app: Application = express();
const port = process.env.PORT || 5000;

// Security & Utility Middlewares (setara helmet() default, tanpa default-import)
app.use(cors({ origin: true, credentials: true }));
for (const useHelmet of [
  hidePoweredBy(),
  noSniff(),
  frameguard(),
  ieNoOpen(),
  dnsPrefetchControl(),
  permittedCrossDomainPolicies(),
  originAgentCluster(),
  referrerPolicy(),
  strictTransportSecurity(),
  crossOriginResourcePolicy(),
  crossOriginOpenerPolicy(),
  crossOriginEmbedderPolicy(),
  contentSecurityPolicy(),
]) app.use(useHelmet);
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
app.get('/school/me', authenticate, authorize('school'), (req: Request, res: Response) => res.json({ success: true, profile: (req as AuthenticatedRequest).profile }));
app.get('/teacher/me', authenticate, authorize('teacher'), (req: Request, res: Response) => res.json({ success: true, profile: (req as AuthenticatedRequest).profile }));
app.get('/student/me', authenticate, authorize('student'), (req: Request, res: Response) => res.json({ success: true, profile: (req as AuthenticatedRequest).profile }));

export default app;

if (!process.env.VERCEL) {
  app.listen(port, () => {
    console.log(`[Server]: API running on http://localhost:${port}`);
  });
}
