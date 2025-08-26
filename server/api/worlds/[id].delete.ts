/**
 * DELETE /api/worlds/:id
 * 
 * Delete an existing world for the authenticated user
 */
import { db } from '../../utils/db'
import { requireAuth } from '../../utils/auth'
import { worlds } from '../../database/schema/worlds'
import { eq, and } from 'drizzle-orm'
import { successResponse, handleApiError } from '../../utils/responses'

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
  
  try {
    // Delete the world
    const result = await db
      .delete(worlds)
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
    
    return successResponse(null, 'World deleted successfully')
  } catch (error) {
    return handleApiError(error, 'Failed to delete world')
  }
})