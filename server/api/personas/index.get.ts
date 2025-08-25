/**
 * GET /api/personas
 * 
 * List all personas for the authenticated user
 */
import { db } from '../../utils/db'
import { requireAuth } from '../../utils/auth'
import { personas } from '../../database/schema/personas'
import { desc, eq } from 'drizzle-orm'
import { listResponse, handleApiError } from '../../utils/responses'

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
    
    return listResponse(userPersonas, 'personas')
  } catch (error) {
    return handleApiError(error, 'Failed to fetch personas')
  }
})