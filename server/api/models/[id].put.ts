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
import { encrypt, isMaskedKey, maskApiKey } from '../../utils/crypto'
import { successResponse, handleApiError } from '../../utils/responses'

// Validation schema for updates (all fields optional)
const updateModelSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  apiEndpoint: z.string().url().optional(),
  apiKey: z.string().nullable().optional(),
  modelId: z.string().min(1).optional(),
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
  
  let validatedData: z.infer<typeof updateModelSchema>
  try {
    validatedData = updateModelSchema.parse(body)
  } catch (error) {
    throw createError({
      statusCode: 400,
      statusMessage: error instanceof z.ZodError 
        ? error.errors[0]?.message || 'Validation error'
        : 'Invalid request data'
    })
  }

  // Check if model exists and belongs to user
  const existingModels = await db
    .select()
    .from(models)
    .where(and(
      eq(models.id, modelId),
      eq(models.userId, userId)
    ))
    .limit(1)

  if (existingModels.length === 0) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Model not found'
    })
  }

  try {
    // Prepare update data, handling API key encryption/masking
    const updateData: Record<string, unknown> = { ...validatedData, updatedAt: new Date() }
    
    // Handle API key: if it's masked, don't update it; if it's new, encrypt it
    if ('apiKey' in validatedData) {
      if (isMaskedKey(validatedData.apiKey)) {
        // Don't update the key if it's the masked placeholder
        delete updateData.apiKey
      } else {
        // New key provided - encrypt it
        updateData.apiKey = encrypt(validatedData.apiKey)
      }
    }
    
    // Update the model
    const [updatedModel] = await db
      .update(models)
      .set(updateData)
      .where(and(
        eq(models.id, modelId),
        eq(models.userId, userId)
      ))
      .returning()
    
    if (!updatedModel) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Model not found after update'
      })
    }
    
    // Mask API key before returning
    const maskedModel = {
      ...updatedModel,
      apiKey: maskApiKey(updatedModel.apiKey)
    }
    
    return successResponse(maskedModel, 'Model updated successfully')
  } catch (error) {
    return handleApiError(error, 'Failed to update model')
  }
})