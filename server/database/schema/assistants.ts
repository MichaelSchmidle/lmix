import { pgTable, text, timestamp, uuid, uniqueIndex } from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'
import { models } from './models'
import { personas } from './personas'

/**
 * Assistants table - junction between Personas and Models
 * 
 * An assistant represents the pairing of a persona (character)
 * with a model (LLM) for use in productions. Optional name
 * override allows for custom display names.
 */
export const assistants = pgTable('assistants', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id').notNull(), // From OIDC auth (user.sub)
  personaId: uuid('persona_id').notNull().references(() => personas.id, { onDelete: 'cascade' }),
  modelId: uuid('model_id').notNull().references(() => models.id, { onDelete: 'cascade' }),
  name: text('name'), // Optional override name for display
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  // Ensure unique combination of user, persona, and model
  uniqueAssistantPerUser: uniqueIndex('idx_unique_assistant_per_user')
    .on(table.userId, table.personaId, table.modelId),
}))

/**
 * RLS Policies for assistants table
 * 
 * These ensure complete user isolation:
 * 1. Users can only SELECT their own assistants
 * 2. Users can only INSERT assistants with their userId
 * 3. Users can only UPDATE their own assistants
 * 4. Users can only DELETE their own assistants
 */
export const assistantsRLSPolicies = sql`
  -- Enable RLS on the assistants table
  ALTER TABLE assistants ENABLE ROW LEVEL SECURITY;
  
  -- Policy: Users can only see their own assistants
  CREATE POLICY assistants_select_policy ON assistants
    FOR SELECT
    USING (user_id = auth.user_id());
  
  -- Policy: Users can only insert assistants for themselves  
  CREATE POLICY assistants_insert_policy ON assistants
    FOR INSERT
    WITH CHECK (user_id = auth.user_id());
  
  -- Policy: Users can only update their own assistants
  CREATE POLICY assistants_update_policy ON assistants
    FOR UPDATE
    USING (user_id = auth.user_id())
    WITH CHECK (user_id = auth.user_id());
  
  -- Policy: Users can only delete their own assistants
  CREATE POLICY assistants_delete_policy ON assistants
    FOR DELETE
    USING (user_id = auth.user_id());
`