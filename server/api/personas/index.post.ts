/**
 * POST /api/personas
 * 
 * Create a new persona for the authenticated user
 */
import { db } from '../../utils/db'
import { requireAuth } from '../../utils/auth'
import { personas } from '../../database/schema/personas'
import { z } from 'zod'

// Validation schema for creating a persona
const createPersonaSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  universalTruth: z.string().nullable().optional(),
  internalTruth: z.string().nullable().optional(),
  externalTruth: z.string().nullable().optional(),
})

export default defineEventHandler(async (event) => {
  // Require authentication
  const userId = requireAuth(event)
  
  // Parse and validate request body
  const body = await readBody(event)
  
  let validatedData
  try {
    validatedData = createPersonaSchema.parse(body)
  } catch (error) {
    throw createError({
      statusCode: 400,
      statusMessage: error instanceof z.ZodError 
        ? error.errors[0]?.message || 'Invalid request data'
        : 'Invalid request data'
    })
  }
  
  try {
    // Create the persona
    const result = await db
      .insert(personas)
      .values({
        userId,
        name: validatedData.name,
        universalTruth: validatedData.universalTruth || null,
        internalTruth: validatedData.internalTruth || null,
        externalTruth: validatedData.externalTruth || null,
      })
      .returning()
    
    if (!result[0]) {
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to create persona'
      })
    }
    
    return {
      persona: result[0]
    }
  } catch (error: unknown) {
    // Re-throw if it's already a createError
    if (error && typeof error === 'object' && 'statusCode' in error) {
      throw error
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to create persona'
    })
  }
})