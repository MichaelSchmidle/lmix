/**
 * DELETE /api/models/:id
 * 
 * Delete a model configuration
 */
import { db } from '../../utils/db'
import { requireAuth } from '../../utils/auth'
import { models } from '../../database/schema/models'
import { eq, and } from 'drizzle-orm'

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

  // Don't allow deleting the default model if it's the only one
  if (existingModel.isDefault) {
    const userModels = await db
      .select()
      .from(models)
      .where(eq(models.userId, userId))
    
    if (userModels.length === 1) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Cannot delete the only model. Please add another model first.'
      })
    }
  }

  try {
    // Delete the model
    await db
      .delete(models)
      .where(and(
        eq(models.id, modelId),
        eq(models.userId, userId)
      ))
    
    return {
      message: 'Model deleted successfully'
    }
  } catch (error) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to delete model'
    })
  }
})