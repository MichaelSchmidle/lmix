import type { InferSelectModel } from 'drizzle-orm'
import type { worlds } from '../../server/database/schema/worlds'

// Database model type (with serialized dates for client-server communication)
export type World = Omit<InferSelectModel<typeof worlds>, 'createdAt' | 'updatedAt'> & {
  createdAt: string
  updatedAt: string
}

// Input types for API operations
export type CreateWorldInput = {
  name: string
  description: string
}

export type UpdateWorldInput = Partial<CreateWorldInput>