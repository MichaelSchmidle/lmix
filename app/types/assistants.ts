import type { InferSelectModel } from 'drizzle-orm'
import type { assistants } from '../../server/database/schema/assistants'
import type { Persona } from './personas'
import type { Model } from './models'

// Database model type (with serialized dates for client-server communication)
export type Assistant = Omit<InferSelectModel<typeof assistants>, 'createdAt' | 'updatedAt'> & {
  createdAt: string
  updatedAt: string
  persona?: Persona // Include related persona data
  model?: Model // Include related model data
}

// Input types for API operations
export type CreateAssistantInput = {
  personaId: string
  modelId: string
  name?: string | null
}

export type UpdateAssistantInput = Partial<CreateAssistantInput>