/**
 * GET /api/worlds
 * 
 * List all worlds for the authenticated user
 */
import { db } from '../../utils/db'
import { requireAuth } from '../../utils/auth'
import { worlds } from '../../database/schema/worlds'
import { desc, eq } from 'drizzle-orm'
import { listResponse, handleApiError } from '../../utils/responses'

export default defineEventHandler(async (event) => {
  // Require authentication
  const userId = requireAuth(event)

  try {
    // Get all worlds for the user
    const userWorlds = await db
      .select()
      .from(worlds)
      .where(eq(worlds.userId, userId))
      .orderBy(desc(worlds.createdAt))
    
    return listResponse(userWorlds, 'worlds')
  } catch (error) {
    return handleApiError(error, 'Failed to fetch worlds')
  }
})