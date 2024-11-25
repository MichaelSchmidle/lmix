import { z } from 'zod'

export const modelResponseSchema = z.object({
  performance: z.string()
    .describe('Core dialogue or action that advances the scene. Write naturally, in-character, and with dramatic purpose.'),
  vectors: z.object({
    location: z.string().optional()
      .describe('Spatial position relative to scene elements'),
    posture: z.string().optional()
      .describe('Physical stance and body language'),
    direction: z.string().optional()
      .describe('Facing or movement direction'),
    momentum: z.string().optional()
      .describe('Quality and intention of movement'),
  }).optional()
    .describe('Physical presence details for spatial continuity'),
  evolution: z.object({
    self_perception: z.string().optional()
      .describe('Update how your character views themselves - modifies internal self-image'),
    private_knowledge: z.string().optional()
      .describe('Modify private beliefs and knowledge - hidden from other personas'),
    note_to_future_self: z.string().optional()
      .describe('Context bridge to next turn - helps maintain modified state'),
  }).optional()
    .describe('Overwrite system message of your persona for future turns. Changes must align with character and situation.'),
  meta: z.string().optional()
    .describe('In-character commentary on scene dynamics')
})
  .describe('Response schema for LMiX personas. Each field shapes dramatic progression and maintains character consistency.')
