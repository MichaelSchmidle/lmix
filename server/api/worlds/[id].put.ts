/**
 * PUT /api/worlds/:id
 * 
 * Update an existing world for the authenticated user
 */
import { db } from '../../utils/db'
import { requireAuth } from '../../utils/auth'
import { worlds } from '../../database/schema/worlds'
import { eq, and } from 'drizzle-orm'
import { z } from 'zod'
import { successResponse, handleApiError } from '../../utils/responses'

// Validation schema for updating a world
const updateWorldSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255).optional(),
  description: z.string().min(1, 'Description is required').optional(),
})

export default defineEventHandler(async (event) => {
  // Require authentication
  const userId = requireAuth(event)
  
  // Get world ID from route params
  const worldId = getRouterParam(event, 'id')
  if (!worldId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'World ID is required'
    })
  }
  
  // Parse and validate request body
  const body = await readBody(event)
  
  let validatedData
  try {
    validatedData = updateWorldSchema.parse(body)
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
    // Update the world
    const result = await db
      .update(worlds)
      .set({
        ...validatedData,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(worlds.id, worldId),
          eq(worlds.userId, userId)
        )
      )
      .returning()
    
    if (!result[0]) {
      throw createError({
        statusCode: 404,
        statusMessage: 'World not found'
      })
    }
    
    return successResponse(result[0], 'World updated successfully')
  } catch (error) {
    return handleApiError(error, 'Failed to update world')
  }
})