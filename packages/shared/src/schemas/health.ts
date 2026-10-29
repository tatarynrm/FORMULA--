import { z } from 'zod';

export const healthStatusSchema = z.object({
  status: z.enum(['ok', 'error']),
  timestamp: z.string(),
  uptime: z.number(),
  checks: z.object({
    database: z.enum(['up', 'down']),
  }),
});

export type HealthStatus = z.infer<typeof healthStatusSchema>;
