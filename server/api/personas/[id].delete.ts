/**
 * DELETE /api/personas/:id
 * 
 * Delete a persona for the authenticated user
 */
import { db } from '../../utils/db'
import { requireAuth } from '../../utils/auth'
import { personas } from '../../database/schema/personas'
import { eq, and } from 'drizzle-orm'

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
  
  try {
    // Delete the persona
    const [deletedPersona] = await db
      .delete(personas)
      .where(
        and(
          eq(personas.id, personaId),
          eq(personas.userId, userId)
        )
      )
      .returning()
    
    if (!deletedPersona) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Persona not found'
      })
    }
    
    return {
      success: true,
      message: 'Persona deleted successfully'
    }
  } catch (error: unknown) {
    // Re-throw if it's already a createError
    if (error && typeof error === 'object' && 'statusCode' in error) {
      throw error
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to delete persona'
    })
  }
})