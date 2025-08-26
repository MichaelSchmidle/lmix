/**
 * PUT /api/assistants/:id
 * 
 * Update an existing assistant for the authenticated user
 */
import { db } from '../../utils/db'
import { requireAuth } from '../../utils/auth'
import { assistants } from '../../database/schema/assistants'
import { personas } from '../../database/schema/personas'
import { models } from '../../database/schema/models'
import { eq, and } from 'drizzle-orm'
import { z } from 'zod'
import type { UpdateAssistantInput } from '~/types/assistants'
import { successResponse, handleApiError, isDatabaseConstraintError } from '../../utils/responses'

// Validation schema
const updateAssistantSchema = z.object({
  personaId: z.string().uuid('Invalid persona ID').optional(),
  modelId: z.string().uuid('Invalid model ID').optional(),
  name: z.string().nullable().optional(),
})

export default defineEventHandler(async (event) => {
  // Require authentication
  const userId = requireAuth(event)
  
  // Get assistant ID from route params
  const assistantId = getRouterParam(event, 'id')
  
  if (!assistantId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Assistant ID is required'
    })
  }
  
  // Parse and validate body
  const body = await readBody<UpdateAssistantInput>(event)
  
  // Validate input
  const validatedData = updateAssistantSchema.parse(body)
  
  try {
    // Check if assistant exists and belongs to user
    const [existingAssistant] = await db
      .select()
      .from(assistants)
      .where(and(
        eq(assistants.id, assistantId),
        eq(assistants.userId, userId)
      ))
      .limit(1)
    
    if (!existingAssistant) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Assistant not found'
      })
    }
    
    // If updating personaId, verify it belongs to the user
    if (validatedData.personaId) {
      const personaExists = await db
        .select({ id: personas.id })
        .from(personas)
        .where(eq(personas.id, validatedData.personaId))
        .where(eq(personas.userId, userId))
        .limit(1)
      
      if (!personaExists.length) {
        throw createError({
          statusCode: 404,
          statusMessage: 'Persona not found'
        })
      }
    }
    
    // If updating modelId, verify it belongs to the user
    if (validatedData.modelId) {
      const modelExists = await db
        .select({ id: models.id })
        .from(models)
        .where(eq(models.id, validatedData.modelId))
        .where(eq(models.userId, userId))
        .limit(1)
      
      if (!modelExists.length) {
        throw createError({
          statusCode: 404,
          statusMessage: 'Model not found'
        })
      }
    }
    
    // Update the assistant
    const [updatedAssistant] = await db
      .update(assistants)
      .set({
        ...validatedData,
        updatedAt: new Date(),
      })
      .where(and(
        eq(assistants.id, assistantId),
        eq(assistants.userId, userId)
      ))
      .returning()
    
    // Fetch the assistant with joined data
    const [assistantWithRelations] = await db
      .select({
        assistant: assistants,
        persona: personas,
        model: models,
      })
      .from(assistants)
      .leftJoin(personas, eq(assistants.personaId, personas.id))
      .leftJoin(models, eq(assistants.modelId, models.id))
      .where(eq(assistants.id, updatedAssistant.id))
      .limit(1)
    
    // Transform and return
    const transformedAssistant = {
      ...assistantWithRelations.assistant,
      persona: assistantWithRelations.persona || undefined,
      model: assistantWithRelations.model || undefined,
    }
    
    return successResponse(transformedAssistant, 'Assistant updated successfully')
  } catch (error) {
    // Check for unique constraint violation
    if (isDatabaseConstraintError(error) && error.code === '23505' && error.constraint === 'idx_unique_assistant_per_user') {
      throw createError({
        statusCode: 409,
        statusMessage: 'An assistant with this persona and model combination already exists',
        data: { code: 'ASSISTANT_DUPLICATE' }
      })
    }
    
    return handleApiError(error, 'Failed to update assistant')
  }
})