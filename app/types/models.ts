/**
 * Types for model discovery and management
 */

/**
 * Model as returned from a provider's API
 */
export interface ProviderModel {
  id: string
  name?: string
  created?: number
  owned_by?: string
  // Additional metadata varies by provider
  [key: string]: any
}

/**
 * Configuration for connecting to a provider
 */
export interface ProviderConfig {
  apiEndpoint: string
  apiKey?: string | null
}

/**
 * State management for the model discovery wizard
 */
export interface ModelDiscoveryState {
  config: ProviderConfig
  discoveredModels: ProviderModel[]
  selectedModelIds: string[]
  currentStep: 1 | 2
  loading: boolean
  error: string | null
}

/**
 * Transformed model ready for display/selection
 */
export interface SelectableModel {
  id: string
  name: string
  provider: string
  isAlreadyConfigured: boolean
  disabled: boolean
  disabledReason?: string
}

/**
 * Provider response formats
 */
export interface OpenAIModelsResponse {
  data: ProviderModel[]
  object: 'list'
}

export interface OllamaModelsResponse {
  models: Array<{
    name: string
    model?: string
    modified_at?: string
    size?: number
    digest?: string
  }>
}

/**
 * Known provider types for special handling
 */
export enum ProviderType {
  OPENAI = 'openai',
  ANTHROPIC = 'anthropic',
  OLLAMA = 'ollama',
  GENERIC = 'generic'
}