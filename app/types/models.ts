import type { InferSelectModel } from 'drizzle-orm'
import type { models } from '../../server/database/schema/models'

// Database model type (with serialized dates for client-server communication)
export type Model = Omit<InferSelectModel<typeof models>, 'createdAt' | 'updatedAt'> & {
  createdAt: string
  updatedAt: string
}

// Input types for API operations
export type CreateModelInput = {
  name: string
  apiEndpoint: string
  apiKey?: string | null
  modelId: string
  isDefault?: boolean
}

export type UpdateModelInput = Partial<CreateModelInput>