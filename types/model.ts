import { z } from 'zod'

export const modelResponseSchema = z.object({
  performance: z.string()
    .describe('Core dialogue or action that advances the scene. Write naturally, in-character, and with dramatic purpose.'),
  vectors: z.object({
    position: z.string().optional()
      .describe('Spatial position relative to scene elements'),
    posture: z.string().optional()
      .describe('Physical stance and body language'),
    direction: z.string().optional()
      .describe('Facing or movement direction'),
    momentum: z.string().optional()
      .describe('Quality and intention of movement'),
  }).optional()
    .describe('Physical presence details for spatial continuity'),
  meta: z.string().optional()
    .describe('In-character commentary on scene dynamics, written in first person from the persona’s perspective, breaking the fourth wall'),
  note_to_future_self: z.string().optional()
    .describe('Context bridge to next turn to help maintain modified state'),
})
  .describe('Response schema for LMiX personas. Each field shapes dramatic progression and maintains character consistency.')
