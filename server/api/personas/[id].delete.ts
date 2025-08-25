/**
 * DELETE /api/personas/:id
 * 
 * Delete a persona for the authenticated user
 */
import { db } from '../../utils/db'
import { requireAuth } from '../../utils/auth'
import { personas } from '../../database/schema/personas'
import { eq, and } from 'drizzle-orm'
import { deleteResponse, handleApiError } from '../../utils/responses'

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
    
    return deleteResponse('Persona deleted successfully')
  } catch (error) {
    return handleApiError(error, 'Failed to delete persona')
  }
})