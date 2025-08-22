/**
 * POST /api/models/test
 * 
 * Test a model configuration by making a simple API call
 */
import { requireAuth } from '../../utils/auth'
import { z } from 'zod'

// Validation schema
const testModelSchema = z.object({
  apiEndpoint: z.string().url('Must be a valid URL'),
  apiKey: z.string().optional().nullable(),
  modelId: z.string().min(1, 'Model ID is required'),
  config: z.object({
    temperature: z.number().min(0).max(2).optional(),
    maxTokens: z.number().positive().optional(),
  }).optional()
})

export default defineEventHandler(async (event) => {
  // Require authentication
  requireAuth(event)

  // Validate request body
  const body = await readBody(event)
  
  let validatedData
  try {
    validatedData = testModelSchema.parse(body)
  } catch (error) {
    throw createError({
      statusCode: 400,
      statusMessage: error instanceof z.ZodError 
        ? error.errors[0].message 
        : 'Invalid request data'
    })
  }

  try {
    // Prepare test prompt
    const testPrompt = {
      model: validatedData.modelId,
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
      temperature: validatedData.config?.temperature || 0.7,
      max_tokens: validatedData.config?.maxTokens || 50
    }

    // Make test request to the API endpoint
    const headers: HeadersInit = {
      'Content-Type': 'application/json'
    }

    // Add API key if provided
    if (validatedData.apiKey) {
      // Support both Bearer token and API key formats
      if (validatedData.apiEndpoint.includes('openai.com')) {
        headers['Authorization'] = `Bearer ${validatedData.apiKey}`
      } else if (validatedData.apiEndpoint.includes('anthropic.com')) {
        headers['x-api-key'] = validatedData.apiKey
        headers['anthropic-version'] = '2023-06-01'
      } else {
        // Generic Bearer token format
        headers['Authorization'] = `Bearer ${validatedData.apiKey}`
      }
    }

    const response = await $fetch(validatedData.apiEndpoint, {
      method: 'POST',
      headers,
      body: testPrompt,
      timeout: 10000 // 10 second timeout
    })

    // Check if we got a valid response
    if (response && (response.choices || response.content)) {
      return {
        success: true,
        message: 'Connection successful',
        response: response.choices?.[0]?.message?.content || response.content
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