/**
 * GET /api/personas
 * 
 * List all personas for the authenticated user
 */
import { db } from '../../utils/db'
import { requireAuth } from '../../utils/auth'
import { personas } from '../../database/schema/personas'
import { desc, eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  // Require authentication
  const userId = requireAuth(event)

  try {
    // Get all personas for the user
    const userPersonas = await db
      .select()
      .from(personas)
      .where(eq(personas.userId, userId))
      .orderBy(desc(personas.createdAt))
    
    return {
      personas: userPersonas,
      count: userPersonas.length
    }
  } catch {
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch personas'
    })
  }
})