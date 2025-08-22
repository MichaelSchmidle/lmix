/**
 * POST /api/models
 * 
 * Create a new model configuration
 */
import { db } from '../../utils/db'
import { requireAuth } from '../../utils/auth'
import { models } from '../../database/schema/models'
import { z } from 'zod'

// Validation schema
const createModelSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  apiEndpoint: z.string().url('Must be a valid URL'),
  apiKey: z.string().optional().nullable(),
  modelId: z.string().min(1, 'Model ID is required'),
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

  // Validate request body
  const body = await readBody(event)
  
  let validatedData
  try {
    validatedData = createModelSchema.parse(body)
  } catch (error) {
    throw createError({
      statusCode: 400,
      statusMessage: error instanceof z.ZodError 
        ? error.errors[0].message 
        : 'Invalid request data'
    })
  }

  try {
    // Create the model
    const [newModel] = await db
      .insert(models)
      .values({
        userId,
        name: validatedData.name,
        apiEndpoint: validatedData.apiEndpoint,
        apiKey: validatedData.apiKey || null,
        modelId: validatedData.modelId,
        config: validatedData.config || {},
        isDefault: validatedData.isDefault || false
      })
      .returning()
    
    return {
      model: newModel,
      message: 'Model created successfully'
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
      statusMessage: 'Failed to create model'
    })
  }
})