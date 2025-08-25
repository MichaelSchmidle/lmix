/**
 * PUT /api/personas/:id
 * 
 * Update an existing persona for the authenticated user
 */
import { db } from '../../utils/db'
import { requireAuth } from '../../utils/auth'
import { personas } from '../../database/schema/personas'
import { eq, and } from 'drizzle-orm'
import { z } from 'zod'
import { successResponse, handleApiError } from '../../utils/responses'

// Validation schema for updating a persona
const updatePersonaSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255).optional(),
  universalTruth: z.string().nullable().optional(),
  internalTruth: z.string().nullable().optional(),
  externalTruth: z.string().nullable().optional(),
})

export default defineEventHandler(async (event) => {
  // Require authentication
  const userId = requireAuth(event)
  
  // Get persona ID from route params
  const personaId = getRouterParam(event, 'id')
  if (!personaId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Persona ID is required'
    })
  }
  
  // Parse and validate request body
  const body = await readBody(event)
  
  let validatedData
  try {
    validatedData = updatePersonaSchema.parse(body)
  } catch (error) {
    throw createError({
      statusCode: 400,
      statusMessage: error instanceof z.ZodError 
        ? error.errors[0]?.message || 'Invalid request data'
        : 'Invalid request data'
    })
  }
  
  // Check if there's anything to update
  if (Object.keys(validatedData).length === 0) {
    throw createError({
      statusCode: 400,
      statusMessage: 'No fields to update'
    })
  }
  
  try {
    // Update the persona
    const result = await db
      .update(personas)
      .set({
        ...validatedData,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(personas.id, personaId),
          eq(personas.userId, userId)
        )
      )
      .returning()
    
    if (!result[0]) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Persona not found'
      })
    }
    
    return successResponse(result[0], 'Persona updated successfully')
  } catch (error) {
    return handleApiError(error, 'Failed to update persona')
  }
})