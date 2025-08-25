/**
 * DELETE /api/assistants/:id
 * 
 * Delete an assistant for the authenticated user
 */
import { db } from '../../utils/db'
import { requireAuth } from '../../utils/auth'
import { assistants } from '../../database/schema/assistants'
import { eq, and } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  // Require authentication
  const userId = requireAuth(event)
  
  // Get assistant ID from route params
  const assistantId = getRouterParam(event, 'id')
  
  if (!assistantId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Assistant ID is required'
    })
  }
  
  try {
    // Delete the assistant (will only delete if it belongs to the user)
    const result = await db
      .delete(assistants)
      .where(and(
        eq(assistants.id, assistantId),
        eq(assistants.userId, userId)
      ))
      .returning({ id: assistants.id })
    
    if (!result.length) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Assistant not found'
      })
    }
    
    return {
      success: true,
      message: 'Assistant deleted successfully'
    }
  } catch (error: any) {
    // Re-throw if it's already a Nitro error
    if (error.statusCode) {
      throw error
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to delete assistant'
    })
  }
})