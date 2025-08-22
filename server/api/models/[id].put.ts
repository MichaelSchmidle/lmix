/**
 * PUT /api/models/:id
 * 
 * Update an existing model configuration
 */
import { db } from '../../utils/db'
import { requireAuth } from '../../utils/auth'
import { models } from '../../database/schema/models'
import { eq, and } from 'drizzle-orm'
import { z } from 'zod'

// Validation schema for updates (all fields optional)
const updateModelSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  apiEndpoint: z.string().url().optional(),
  apiKey: z.string().nullable().optional(),
  modelId: z.string().min(1).optional(),
  config: z.object({
    temperature: z.number().min(0).max(2).optional(),
    maxTokens: z.number().positive().optional(),
    topP: z.number().min(0).max(1).optional(),
    frequencyPenalty: z.number().min(-2).max(2).optional(),
    presencePenalty: z.number().min(-2).max(2).optional(),
    stopSequences: z.array(z.string()).optional()
  }).optional(),
  isDefault: z.boolean().optional()
})

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

  // Validate request body
  const body = await readBody(event)
  
  let validatedData
  try {
    validatedData = updateModelSchema.parse(body)
  } catch (error) {
    throw createError({
      statusCode: 400,
      statusMessage: error instanceof z.ZodError 
        ? error.errors[0].message 
        : 'Invalid request data'
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
    // Update the model
    const [updatedModel] = await db
      .update(models)
      .set({
        ...validatedData,
        updatedAt: new Date()
      })
      .where(and(
        eq(models.id, modelId),
        eq(models.userId, userId)
      ))
      .returning()
    
    return {
      model: updatedModel,
      message: 'Model updated successfully'
    }
  } catch (error) {
    // Check for unique constraint violation
    if (error instanceof Error && error.message.includes('idx_one_default_model_per_user')) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Only one default model allowed per user'
      })
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to update model'
    })
  }
})