/**
 * POST /api/models/test
 * 
 * Test a model configuration by making a server-side API call
 */
import { requireAuth } from '../../utils/auth'
import { z } from 'zod'
import { decrypt } from '../../utils/crypto'

// Validation schema - accept either model data or model ID
const testModelSchema = z.union([
  // Test with model data (for new models before saving)
  z.object({
    apiEndpoint: z.string().url('Must be a valid URL'),
    apiKey: z.string().optional().nullable(),
    modelId: z.string().min(1, 'Model ID is required')
  }),
  // Test existing model by ID
  z.object({
    modelId: z.string().uuid('Must be a valid model ID'),
    testExisting: z.literal(true)
  })
])

export default defineEventHandler(async (event) => {
  // Require authentication
  const userId = requireAuth(event)

  // Validate request body
  const body = await readBody(event)
  
  let validatedData: z.infer<typeof testModelSchema>
  try {
    validatedData = testModelSchema.parse(body)
  } catch (error) {
    throw createError({
      statusCode: 400,
      statusMessage: error instanceof z.ZodError 
        ? error.errors[0]?.message || 'Validation error'
        : 'Invalid request data'
    })
  }

  let testConfig: {
    apiEndpoint: string
    apiKey: string | null
    modelId: string
  }

  // Handle both new model data and existing model ID
  if ('testExisting' in validatedData) {
    // Test existing model - fetch from database
    const { db } = await import('../../utils/db')
    const { models } = await import('../../database/schema/models')
    const { eq, and } = await import('drizzle-orm')
    
    const [existingModel] = await db
      .select()
      .from(models)
      .where(and(
        eq(models.id, validatedData.modelId),
        eq(models.userId, userId)
      ))
      .limit(1)
    
    if (!existingModel) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Model not found'
      })
    }
    
    testConfig = {
      apiEndpoint: existingModel.apiEndpoint,
      apiKey: decrypt(existingModel.apiKey),
      modelId: existingModel.modelId
    }
  } else {
    // Test with provided model data
    testConfig = {
      apiEndpoint: validatedData.apiEndpoint,
      apiKey: validatedData.apiKey || null,
      modelId: validatedData.modelId
    }
  }

  try {
    // Prepare test prompt based on provider
    let testPrompt: Record<string, unknown>
    let apiUrl = testConfig.apiEndpoint
    
    // Ensure URL ends with /
    if (!apiUrl.endsWith('/')) {
      apiUrl += '/'
    }
    
    // Prepare headers
    const headers: HeadersInit = {
      'Content-Type': 'application/json'
    }
    
    if (testConfig.apiEndpoint.includes('anthropic.com')) {
      // Anthropic format
      apiUrl += 'messages'
      testPrompt = {
        model: testConfig.modelId,
        messages: [
          {
            role: 'user',
            content: 'Hello! Please respond with a simple greeting to confirm you are working.'
          }
        ],
        system: 'You are a helpful assistant. Please respond with a brief greeting.',
        max_tokens: 50,
        temperature: 0.7
      }
      
      if (testConfig.apiKey) {
        headers['x-api-key'] = testConfig.apiKey
        headers['anthropic-version'] = '2023-06-01'
      }
    } else {
      // OpenAI format (default for LMStudio, OpenAI, etc.)
      apiUrl += 'chat/completions'
      testPrompt = {
        model: testConfig.modelId,
        messages: [
          {
            role: 'system',
            content: 'You are a helpful assistant. Please respond with a brief greeting.'
          },
          {
            role: 'user',
            content: 'Hello! Please respond with a simple greeting to confirm you are working.'
          }
        ],
        temperature: 0.7,
        max_tokens: 50
      }
      
      if (testConfig.apiKey) {
        headers['Authorization'] = `Bearer ${testConfig.apiKey}`
      }
    }

    const response = await $fetch(apiUrl, {
      method: 'POST',
      headers,
      body: testPrompt,
      timeout: 30000 // 30 second timeout for local models that need to load
    })

    // Check if we got a valid response
    const responseData = response as Record<string, unknown>
    if (response && (responseData.choices || responseData.content)) {
      const choices = responseData.choices as Array<{ message?: { content?: string } }>
      const content = responseData.content as string
      
      return {
        success: true,
        message: 'Connection successful',
        response: choices?.[0]?.message?.content || content
      }
    } else if (response && typeof response === 'object') {
      // Some local servers might return a different format or empty response while loading
      // If we got any valid JSON response without an error, consider it a success
      const errorData = responseData.error as { message?: string }
      if (errorData) {
        throw new Error(errorData.message || 'API returned an error')
      }
      
      // LMStudio and similar might return an empty or different format
      return {
        success: true,
        message: 'Connection successful (model may still be loading)',
        response: 'Server responded successfully. If using a local model, it may need time to load.'
      }
    } else {
      throw new Error('Invalid response format from API')
    }
  } catch (error) {
    // Parse error message
    let errorMessage = 'Connection test failed'
    
    if (error instanceof Error) {
      if (error.message.includes('401') || error.message.includes('Unauthorized')) {
        errorMessage = 'Invalid API key'
      } else if (error.message.includes('404')) {
        errorMessage = 'Invalid API endpoint or model ID'
      } else if (error.message.includes('timeout')) {
        errorMessage = 'Connection timeout - please check the endpoint'
      } else {
        errorMessage = error.message
      }
    }

    throw createError({
      statusCode: 400,
      statusMessage: errorMessage
    })
  }
})