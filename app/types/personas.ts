import type { InferSelectModel } from 'drizzle-orm'
import type { personas } from '../../server/database/schema/personas'

// Database model type (with serialized dates for client-server communication)
export type Persona = Omit<InferSelectModel<typeof personas>, 'createdAt' | 'updatedAt'> & {
  createdAt: string
  updatedAt: string
}

// Input types for API operations
export type CreatePersonaInput = {
  name: string
  universalTruth?: string | null
  internalTruth?: string | null
  externalTruth?: string | null
}

export type UpdatePersonaInput = Partial<CreatePersonaInput>