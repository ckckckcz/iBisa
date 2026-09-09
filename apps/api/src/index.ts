import express from 'express';
import type { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';

dotenv.config();

const app: Application = express();
const port = process.env.PORT || 5000;

// Security & Utility Middlewares
app.use(helmet());
app.use(cors());
app.use(express.json());

// Basic Health Check Endpoint
app.get('/', (req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'iBisa Backend API is running successfully!',
  });
});

app.listen(port, () => {
  console.log(`[Server]: API running on http://localhost:${port}`);
});
