/**
 * GET /api/models
 * 
 * List all models for the authenticated user
 */
import { db } from '../../utils/db'
import { requireAuth } from '../../utils/auth'
import { models } from '../../database/schema/models'
import { desc } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  // Require authentication
  requireAuth(event)

  try {
    // Get all models for the user (RLS automatically filters)
    const userModels = await db
      .select()
      .from(models)
      .orderBy(desc(models.isDefault), desc(models.createdAt))
    
    return {
      models: userModels,
      count: userModels.length
    }
  } catch (error) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch models'
    })
  }
})