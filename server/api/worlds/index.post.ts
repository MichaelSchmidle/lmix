/**
 * POST /api/worlds
 * 
 * Create a new world for the authenticated user
 */
import { db } from '../../utils/db'
import { requireAuth } from '../../utils/auth'
import { worlds } from '../../database/schema/worlds'
import { z } from 'zod'
import { successResponse, handleApiError } from '../../utils/responses'

// Validation schema for creating a world
const createWorldSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  description: z.string().min(1, 'Description is required'),
})

export default defineEventHandler(async (event) => {
  // Require authentication
  const userId = requireAuth(event)
  
  // Parse and validate request body
  const body = await readBody(event)
  
  let validatedData
  try {
    validatedData = createWorldSchema.parse(body)
  } catch (error) {
    throw createError({
      statusCode: 400,
      statusMessage: error instanceof z.ZodError 
        ? error.errors[0]?.message || 'Invalid request data'
        : 'Invalid request data'
    })
  }
  
  try {
    // Create the world
    const result = await db
      .insert(worlds)
      .values({
        userId,
        name: validatedData.name,
        description: validatedData.description,
      })
      .returning()
    
    if (!result[0]) {
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to create world'
      })
    }
    
    return successResponse(result[0], 'World created successfully')
  } catch (error) {
    return handleApiError(error, 'Failed to create world')
  }
})