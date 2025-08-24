import { z } from 'zod'

/**
 * Shared validation schemas for models
 * Used across both client and server components
 */

export const apiEndpointSchema = z
  .string()
  .min(1, 'API endpoint is required')
  .url('Must be a valid URL')
  .refine(
    (url) => /\/v\d+(?:\/|$)/.test(url),
    'URL must include a version path (e.g., /v1)'
  )

export const modelValidationSchemas = {
  name: z.string().min(1, 'Model name is required'),
  modelId: z.string().min(1, 'Model ID is required'),
  apiEndpoint: apiEndpointSchema,
  apiKey: z.string().nullable().optional(),
  isDefault: z.boolean().optional(),
}

/**
 * Complete schemas for model operations
 */
export const createModelSchema = z.object({
  name: modelValidationSchemas.name,
  modelId: modelValidationSchemas.modelId,
  apiEndpoint: modelValidationSchemas.apiEndpoint,
  apiKey: modelValidationSchemas.apiKey,
  isDefault: modelValidationSchemas.isDefault,
})

export const updateModelSchema = z.object({
  name: modelValidationSchemas.name,
  modelId: modelValidationSchemas.modelId,
  apiEndpoint: modelValidationSchemas.apiEndpoint,
  apiKey: modelValidationSchemas.apiKey,
  isDefault: modelValidationSchemas.isDefault,
})

/**
 * Provider configuration schema for model discovery
 */
export const providerConfigSchema = z.object({
  apiEndpoint: apiEndpointSchema,
  apiKey: modelValidationSchemas.apiKey,
})

/**
 * Model selection schema for bulk creation
 */
export const modelSelectionSchema = z.object({
  selectedModels: z.array(z.string()).min(1, 'Please select at least one model'),
})