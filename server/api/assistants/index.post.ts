/**
 * POST /api/assistants
 * 
 * Create a new assistant for the authenticated user
 */
import { db } from '../../utils/db'
import { requireAuth } from '../../utils/auth'
import { assistants } from '../../database/schema/assistants'
import { personas } from '../../database/schema/personas'
import { models } from '../../database/schema/models'
import { eq } from 'drizzle-orm'
import { z } from 'zod'
import type { CreateAssistantInput } from '~/types/assistants'

// Validation schema
const createAssistantSchema = z.object({
  personaId: z.string().uuid('Invalid persona ID'),
  modelId: z.string().uuid('Invalid model ID'),
  name: z.string().optional().nullable(),
})

export default defineEventHandler(async (event) => {
  // Require authentication
  const userId = requireAuth(event)
  
  // Parse and validate body
  const body = await readBody<CreateAssistantInput>(event)
  
  // Validate input
  const validatedData = createAssistantSchema.parse(body)
  
  try {
    // Verify the persona belongs to the user
    const personaExists = await db
      .select({ id: personas.id })
      .from(personas)
      .where(eq(personas.id, validatedData.personaId))
      .where(eq(personas.userId, userId))
      .limit(1)
    
    if (!personaExists.length) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Persona not found'
      })
    }
    
    // Verify the model belongs to the user
    const modelExists = await db
      .select({ id: models.id })
      .from(models)
      .where(eq(models.id, validatedData.modelId))
      .where(eq(models.userId, userId))
      .limit(1)
    
    if (!modelExists.length) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Model not found'
      })
    }
    
    // Create the assistant
    const [newAssistant] = await db
      .insert(assistants)
      .values({
        userId,
        personaId: validatedData.personaId,
        modelId: validatedData.modelId,
        name: validatedData.name || null,
      })
      .returning()
    
    // Fetch the assistant with joined data
    const [assistantWithRelations] = await db
      .select({
        assistant: assistants,
        persona: personas,
        model: models,
      })
      .from(assistants)
      .leftJoin(personas, eq(assistants.personaId, personas.id))
      .leftJoin(models, eq(assistants.modelId, models.id))
      .where(eq(assistants.id, newAssistant.id))
      .limit(1)
    
    // Transform and return
    return {
      assistant: {
        ...assistantWithRelations.assistant,
        persona: assistantWithRelations.persona || undefined,
        model: assistantWithRelations.model || undefined,
      }
    }
  } catch (error) {
    // Check for unique constraint violation
    const dbError = error as { code?: string; constraint?: string; statusCode?: number }
    if (dbError.code === '23505' && dbError.constraint === 'idx_unique_assistant_per_user') {
      throw createError({
        statusCode: 409,
        statusMessage: 'An assistant with this persona and model combination already exists'
      })
    }
    
    // Re-throw if it's already a Nitro error
    if (dbError.statusCode) {
      throw error
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to create assistant'
    })
  }
})