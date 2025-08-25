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
import { listResponse, handleApiError } from '../../utils/responses'

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
    
    return listResponse(maskedModels, 'models')
  } catch (error) {
    return handleApiError(error, 'Failed to fetch models')
  }
})