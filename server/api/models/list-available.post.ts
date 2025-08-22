/**
 * POST /api/models/list-available
 * 
 * Fetch available models from a provider's API
 */
import { requireAuth } from '../../utils/auth'
import { z } from 'zod'

// Validation schema
const listModelsSchema = z.object({
  apiEndpoint: z.string().url('Must be a valid URL'),
  apiKey: z.string().optional().nullable(),
})

export default defineEventHandler(async (event) => {
  // Require authentication
  requireAuth(event)

  // Validate request body
  const body = await readBody(event)
  
  let validatedData
  try {
    validatedData = listModelsSchema.parse(body)
  } catch (error) {
    throw createError({
      statusCode: 400,
      statusMessage: error instanceof z.ZodError 
        ? error.errors[0].message 
        : 'Invalid request data'
    })
  }

  try {
    // Clean and normalize the endpoint
    let cleanEndpoint = validatedData.apiEndpoint
      .replace(/\/chat\/completions.*$/, '') // Remove chat completions path
      .replace(/\/completions.*$/, '') // Remove completions path
      .replace(/\/?v\d+\/?$/, '') // Remove version suffix
      .replace(/\/$/, '') // Remove trailing slash
    
    // Special cases for known providers
    const endpoint = validatedData.apiEndpoint.toLowerCase()
    
    if (endpoint.includes('anthropic.com')) {
      // Anthropic doesn't have a models list endpoint, return static list
      return {
        models: [
          { id: 'claude-3-opus-20240229', name: 'Claude 3 Opus' },
          { id: 'claude-3-sonnet-20240229', name: 'Claude 3 Sonnet' },
          { id: 'claude-3-haiku-20240307', name: 'Claude 3 Haiku' },
          { id: 'claude-2.1', name: 'Claude 2.1' },
          { id: 'claude-2.0', name: 'Claude 2.0' },
        ]
      }
    }
    
    // Construct models list URL
    let modelsListUrl: string
    let headers: HeadersInit = {
      'Content-Type': 'application/json'
    }
    
    if (endpoint.includes('localhost') || endpoint.includes('ollama')) {
      // Ollama local models use different endpoint
      modelsListUrl = `${cleanEndpoint}/api/tags`
    } else if (endpoint.includes('openai.com')) {
      // OpenAI-specific endpoint
      modelsListUrl = 'https://api.openai.com/v1/models'
      if (validatedData.apiKey) {
        headers['Authorization'] = `Bearer ${validatedData.apiKey}`
      }
    } else {
      // Generic OpenAI-compatible endpoint
      // Add /v1 if no version specified
      if (!cleanEndpoint.match(/\/v\d+$/)) {
        cleanEndpoint += '/v1'
      }
      modelsListUrl = `${cleanEndpoint}/models`
      
      if (validatedData.apiKey) {
        headers['Authorization'] = `Bearer ${validatedData.apiKey}`
      }
    }

    // Fetch models from the provider
    const response = await $fetch(modelsListUrl, {
      method: 'GET',
      headers,
      timeout: 10000 // 10 second timeout
    })

    // Parse response based on provider format
    let models: Array<{ id: string; name: string }> = []

    if (response.data && Array.isArray(response.data)) {
      // OpenAI format
      models = response.data
        .filter((m: any) => m.id && !m.id.includes('instruct')) // Filter out instruction models
        .map((m: any) => ({
          id: m.id,
          name: m.id.replace(/-/g, ' ').replace(/_/g, ' ')
            .split(' ')
            .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ')
        }))
        .sort((a, b) => a.name.localeCompare(b.name))
    } else if (response.models && Array.isArray(response.models)) {
      // Ollama format
      models = response.models.map((m: any) => ({
        id: m.name || m.model,
        name: (m.name || m.model).replace(/:/g, ' ')
          .split(' ')
          .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ')
      }))
    } else if (Array.isArray(response)) {
      // Direct array format
      models = response.map((m: any) => ({
        id: typeof m === 'string' ? m : (m.id || m.name || m.model),
        name: typeof m === 'string' 
          ? m.replace(/[-_]/g, ' ')
            .split(' ')
            .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ')
          : (m.name || m.id || m.model)
      }))
    }

    if (models.length === 0) {
      throw new Error('No models found or unsupported response format')
    }

    return {
      models,
      count: models.length
    }
  } catch (error) {
    // Parse error message
    let errorMessage = 'Failed to fetch models list'
    
    if (error instanceof Error) {
      if (error.message.includes('401') || error.message.includes('Unauthorized')) {
        errorMessage = 'Invalid API key or unauthorized access'
      } else if (error.message.includes('404')) {
        errorMessage = 'Models list endpoint not found for this provider'
      } else if (error.message.includes('timeout')) {
        errorMessage = 'Connection timeout - please check the endpoint'
      } else if (error.message.includes('No models found')) {
        errorMessage = error.message
      } else {
        errorMessage = `Failed to fetch models: ${error.message}`
      }
    }

    throw createError({
      statusCode: 400,
      statusMessage: errorMessage
    })
  }
})