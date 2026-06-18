import { z } from 'zod';

export const matchIdSchema = z.string().min(1).regex(/^[a-z0-9\-]+$/i);

export const fixturesQuerySchema = z.object({
  competition: z.string().optional(),
});

export const generateContentBodySchema = z.object({
  matchId: z.string().min(1),
});
