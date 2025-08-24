/**
 * GET /api/models
 * 
 * List all models for the authenticated user
 */
import { db } from '../../utils/db'
import { requireAuth } from '../../utils/auth'
import { models } from '../../database/schema/models'
import { desc, eq } from 'drizzle-orm'
import { maskApiKey } from '../../utils/crypto'

export default defineEventHandler(async (event) => {
  // Require authentication
  const userId = requireAuth(event)

  try {
    // Get all models for the user
    const userModels = await db
      .select()
      .from(models)
      .where(eq(models.userId, userId))
      .orderBy(desc(models.isDefault), desc(models.createdAt))
    
    // Mask API keys before sending to client
    const maskedModels = userModels.map(model => ({
      ...model,
      apiKey: maskApiKey(model.apiKey)
    }))
    
    return {
      models: maskedModels,
      count: maskedModels.length
    }
  } catch {
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch models'
    })
  }
})