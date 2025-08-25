/**
 * DELETE /api/models/:id
 * 
 * Delete a model configuration
 */
import { db } from '../../utils/db'
import { requireAuth } from '../../utils/auth'
import { models } from '../../database/schema/models'
import { eq, and } from 'drizzle-orm'
import { deleteResponse, handleApiError } from '../../utils/responses'

export default defineEventHandler(async (event) => {
  // Require authentication
  const userId = requireAuth(event)
  
  // Get model ID from route params
  const modelId = getRouterParam(event, 'id')
  if (!modelId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Model ID is required'
    })
  }

  // Check if model exists and belongs to user
  const [existingModel] = await db
    .select()
    .from(models)
    .where(and(
      eq(models.id, modelId),
      eq(models.userId, userId)
    ))
    .limit(1)

  if (!existingModel) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Model not found'
    })
  }

  try {
    // Delete the model
    await db
      .delete(models)
      .where(and(
        eq(models.id, modelId),
        eq(models.userId, userId)
      ))
    
    return deleteResponse('Model deleted successfully')
  } catch (error) {
    return handleApiError(error, 'Failed to delete model')
  }
})