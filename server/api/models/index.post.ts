/**
 * POST /api/models
 * 
 * Create one or more model configurations
 * Accepts either a single model object or an array of models
 */
import { db } from '../../utils/db'
import { requireAuth } from '../../utils/auth'
import { models } from '../../database/schema/models'
import { z } from 'zod'
import { eq, and } from 'drizzle-orm'
import { encrypt, maskApiKey } from '../../utils/crypto'
import { successResponse, handleApiError } from '../../utils/responses'

// Validation schema for a single model
const createModelSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  apiEndpoint: z.string().url('Must be a valid URL'),
  apiKey: z.string().optional().nullable(),
  modelId: z.string().min(1, 'Model ID is required'),
  isDefault: z.boolean().optional()
})

// Accept either single model or array of models
const requestSchema = z.union([
  createModelSchema,
  z.array(createModelSchema).min(1, 'At least one model is required')
])

export default defineEventHandler(async (event) => {
  // Require authentication
  const userId = requireAuth(event)

  // Validate request body
  const body = await readBody(event)
  
  let validatedData: z.infer<typeof requestSchema>
  try {
    validatedData = requestSchema.parse(body)
  } catch (error) {
    throw createError({
      statusCode: 400,
      statusMessage: error instanceof z.ZodError 
        ? error.errors[0]?.message || 'Validation error'
        : 'Invalid request data'
    })
  }

  // Normalize to array for consistent processing
  const modelsToCreate = Array.isArray(validatedData) ? validatedData : [validatedData]
  
  // Check that only one model can be default
  const defaultModels = modelsToCreate.filter(m => m.isDefault)
  if (defaultModels.length > 1) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Only one model can be set as default'
    })
  }

  try {
    // Check for existing models with same modelId and apiEndpoint to prevent duplicates
    const existingModels = await db
      .select({ modelId: models.modelId, apiEndpoint: models.apiEndpoint })
      .from(models)
      .where(eq(models.userId, userId))
    
    const existingSet = new Set(
      existingModels.map(m => `${m.modelId}|${m.apiEndpoint}`)
    )
    
    // Filter out duplicates
    const uniqueModels = modelsToCreate.filter(m => 
      !existingSet.has(`${m.modelId}|${m.apiEndpoint}`)
    )
    
    if (uniqueModels.length === 0) {
      throw createError({
        statusCode: 409,
        statusMessage: 'All specified models are already configured'
      })
    }

    // Create the models (trigger handles clearing existing defaults)
    const createdModels = await db
      .insert(models)
      .values(uniqueModels.map(model => ({
        userId,
        name: model.name,
        apiEndpoint: model.apiEndpoint,
        apiKey: encrypt(model.apiKey) || null,
        modelId: model.modelId,
        isDefault: model.isDefault || false
      })))
      .returning()
    
    // Mask API keys before returning
    const maskedCreatedModels = createdModels.map(model => ({
      ...model,
      apiKey: maskApiKey(model.apiKey)
    }))
    
    // Return appropriate response based on input type
    if (Array.isArray(validatedData)) {
      return successResponse(
        maskedCreatedModels,
        `Successfully created ${maskedCreatedModels.length} model(s)`,
        {
          count: maskedCreatedModels.length,
          meta: { skipped: modelsToCreate.length - uniqueModels.length }
        }
      )
    } else {
      return successResponse(
        maskedCreatedModels[0],
        'Model created successfully'
      )
    }
  } catch (error) {
    // Check for unique constraint violation
    if (error instanceof Error && error.message.includes('idx_one_default_model_per_user')) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Only one default model allowed per user'
      })
    }
    
    return handleApiError(error, 'Failed to create model(s)')
  }
})