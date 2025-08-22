/**
 * Provider-specific utilities for fetching and normalizing model lists
 */
import type { 
  ProviderModel, 
  ProviderConfig, 
  OpenAIModelsResponse, 
  OllamaModelsResponse,
  SelectableModel 
} from '~/types/models'
import { ProviderType } from '~/types/models'

/**
 * Detect provider type from endpoint URL
 */
export function detectProviderType(endpoint: string): ProviderType {
  const url = endpoint.toLowerCase()
  
  if (url.includes('anthropic.com')) {
    return ProviderType.ANTHROPIC
  } else if (url.includes('openai.com')) {
    return ProviderType.OPENAI
  } else if (url.includes('localhost') || url.includes('ollama') || url.includes('127.0.0.1')) {
    return ProviderType.OLLAMA
  }
  
  return ProviderType.GENERIC
}

/**
 * Normalize API endpoint for consistent usage
 */
export function normalizeEndpoint(endpoint: string, providerType: ProviderType): string {
  // Remove trailing slash
  let normalized = endpoint.replace(/\/$/, '')
  
  // Remove common path suffixes
  normalized = normalized
    .replace(/\/chat\/completions.*$/, '')
    .replace(/\/completions.*$/, '')
    .replace(/\/models.*$/, '')
    .replace(/\/?v\d+\/?$/, '') // Remove version suffix
  
  // Add appropriate version for OpenAI-compatible endpoints
  if (providerType === ProviderType.OPENAI || providerType === ProviderType.GENERIC) {
    if (!normalized.match(/\/v\d+$/)) {
      normalized += '/v1'
    }
  }
  
  return normalized
}

/**
 * Get static model list for Anthropic (they don't have a models endpoint)
 */
function getAnthropicModels(): ProviderModel[] {
  return [
    { id: 'claude-3-opus-20240229', name: 'Claude 3 Opus' },
    { id: 'claude-3-sonnet-20240229', name: 'Claude 3 Sonnet' },
    { id: 'claude-3-haiku-20240307', name: 'Claude 3 Haiku' },
    { id: 'claude-3.5-sonnet-20241022', name: 'Claude 3.5 Sonnet' },
    { id: 'claude-2.1', name: 'Claude 2.1' },
    { id: 'claude-2.0', name: 'Claude 2.0' },
  ]
}

/**
 * Fetch models from provider
 */
export async function fetchProviderModels(config: ProviderConfig): Promise<ProviderModel[]> {
  const providerType = detectProviderType(config.apiEndpoint)
  
  // Anthropic doesn't have a models endpoint, return static list
  if (providerType === ProviderType.ANTHROPIC) {
    return getAnthropicModels()
  }
  
  const normalizedEndpoint = normalizeEndpoint(config.apiEndpoint, providerType)
  let modelsUrl: string
  let headers: HeadersInit = {
    'Content-Type': 'application/json'
  }
  
  // Build appropriate URL and headers based on provider
  switch (providerType) {
    case ProviderType.OLLAMA:
      modelsUrl = `${normalizedEndpoint}/api/tags`
      break
      
    case ProviderType.OPENAI:
      modelsUrl = `${normalizedEndpoint}/models`
      if (config.apiKey) {
        headers['Authorization'] = `Bearer ${config.apiKey}`
      }
      break
      
    default: // GENERIC - assume OpenAI-compatible
      modelsUrl = `${normalizedEndpoint}/models`
      if (config.apiKey) {
        headers['Authorization'] = `Bearer ${config.apiKey}`
      }
  }
  
  try {
    const response = await $fetch(modelsUrl, {
      method: 'GET',
      headers,
      timeout: 10000 // 10 second timeout
    })
    
    return parseProviderResponse(response, providerType)
  } catch (error) {
    // Provide helpful error messages
    if (error instanceof Error) {
      if (error.message.includes('401') || error.message.includes('Unauthorized')) {
        throw new Error('Invalid API key or unauthorized access')
      } else if (error.message.includes('404')) {
        throw new Error('Models endpoint not found. Please check the API endpoint URL.')
      } else if (error.message.includes('timeout')) {
        throw new Error('Connection timeout. Please check the endpoint URL and your connection.')
      } else if (error.message.includes('CORS')) {
        throw new Error('CORS error. The provider may not allow browser requests. Try using a proxy or server-side fetching.')
      }
    }
    
    throw new Error(`Failed to fetch models: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Parse provider response into normalized format
 */
function parseProviderResponse(response: any, providerType: ProviderType): ProviderModel[] {
  let models: ProviderModel[] = []
  
  switch (providerType) {
    case ProviderType.OPENAI:
    case ProviderType.GENERIC:
      if (response.data && Array.isArray(response.data)) {
        models = response.data
          .filter((m: any) => m.id && !m.id.includes('instruct')) // Filter out instruction models
          .map((m: any) => ({
            ...m,
            name: m.name || formatModelName(m.id)
          }))
      } else if (Array.isArray(response)) {
        models = response.map((m: any) => ({
          id: typeof m === 'string' ? m : (m.id || m.name || m.model),
          name: typeof m === 'string' ? formatModelName(m) : (m.name || formatModelName(m.id || m.model))
        }))
      }
      break
      
    case ProviderType.OLLAMA:
      const ollamaResponse = response as OllamaModelsResponse
      if (ollamaResponse.models && Array.isArray(ollamaResponse.models)) {
        models = ollamaResponse.models.map(m => ({
          id: m.name || m.model || '',
          name: formatModelName(m.name || m.model || ''),
          size: m.size,
          modified_at: m.modified_at
        }))
      }
      break
  }
  
  if (models.length === 0) {
    throw new Error('No models found or unsupported response format')
  }
  
  // Sort alphabetically by name
  return models.sort((a, b) => (a.name || a.id).localeCompare(b.name || b.id))
}

/**
 * Format model ID into readable name
 */
function formatModelName(modelId: string): string {
  return modelId
    .replace(/[-_:]/g, ' ')
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

/**
 * Transform provider models into selectable format
 */
export function transformToSelectableModels(
  providerModels: ProviderModel[],
  existingModelIds: Set<string>,
  apiEndpoint: string
): SelectableModel[] {
  const provider = detectProviderType(apiEndpoint)
  const providerName = provider.charAt(0).toUpperCase() + provider.slice(1)
  
  return providerModels.map(model => {
    const isConfigured = existingModelIds.has(`${model.id}|${apiEndpoint}`)
    
    return {
      id: model.id,
      name: model.name || model.id,
      provider: providerName,
      isAlreadyConfigured: isConfigured,
      disabled: isConfigured,
      disabledReason: isConfigured ? 'Already configured' : undefined
    }
  })
}

/**
 * Generate default model configuration based on provider
 */
export function getDefaultModelConfig(providerType: ProviderType) {
  switch (providerType) {
    case ProviderType.OPENAI:
      return {
        temperature: 0.7,
        maxTokens: 4096,
        topP: 1,
        frequencyPenalty: 0,
        presencePenalty: 0
      }
      
    case ProviderType.ANTHROPIC:
      return {
        temperature: 0.7,
        maxTokens: 4096,
        topP: 1
      }
      
    case ProviderType.OLLAMA:
      return {
        temperature: 0.7,
        maxTokens: 2048
      }
      
    default:
      return {
        temperature: 0.7,
        maxTokens: 2048
      }
  }
}