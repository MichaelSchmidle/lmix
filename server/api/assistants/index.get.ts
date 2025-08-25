/**
 * GET /api/assistants
 * 
 * List all assistants for the authenticated user with related persona and model data
 */
import { db } from '../../utils/db'
import { requireAuth } from '../../utils/auth'
import { assistants } from '../../database/schema/assistants'
import { personas } from '../../database/schema/personas'
import { models } from '../../database/schema/models'
import { desc, eq } from 'drizzle-orm'
import { listResponse, handleApiError } from '../../utils/responses'

export default defineEventHandler(async (event) => {
  // Require authentication
  const userId = requireAuth(event)

  try {
    // Get all assistants for the user with joined persona and model data
    const userAssistants = await db
      .select({
        assistant: assistants,
        persona: personas,
        model: models,
      })
      .from(assistants)
      .leftJoin(personas, eq(assistants.personaId, personas.id))
      .leftJoin(models, eq(assistants.modelId, models.id))
      .where(eq(assistants.userId, userId))
      .orderBy(desc(assistants.createdAt))
    
    // Transform the data to match the Assistant type structure
    const transformedAssistants = userAssistants.map(({ assistant, persona, model }) => ({
      ...assistant,
      persona: persona || undefined,
      model: model || undefined,
    }))
    
    return listResponse(transformedAssistants, 'assistants')
  } catch (error) {
    return handleApiError(error, 'Failed to fetch assistants')
  }
})