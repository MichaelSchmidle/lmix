/**
 * PATCH /api/models/:id/default
 * 
 * Set a model as the default
 */
import { db } from '../../../utils/db'
import { requireAuth } from '../../../utils/auth'
import { models } from '../../../database/schema/models'
import { eq, and } from 'drizzle-orm'
import { sql } from 'drizzle-orm'

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
    // Use a transaction to ensure atomicity
    await db.transaction(async (tx) => {
      // First, unset any existing default for this user
      await tx
        .update(models)
        .set({ isDefault: false })
        .where(and(
          eq(models.userId, userId),
          eq(models.isDefault, true)
        ))
      
      // Then set the new default
      await tx
        .update(models)
        .set({ 
          isDefault: true,
          updatedAt: new Date()
        })
        .where(and(
          eq(models.id, modelId),
          eq(models.userId, userId)
        ))
    })

    // Fetch and return the updated model
    const [updatedModel] = await db
      .select()
      .from(models)
      .where(eq(models.id, modelId))
      .limit(1)
    
    return {
      model: updatedModel,
      message: 'Default model updated successfully'
    }
  } catch (error) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to set default model'
    })
  }
})