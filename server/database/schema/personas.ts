import { pgTable, text, timestamp, uuid, uniqueIndex } from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'

/**
 * Personas table for storing character definitions
 * 
 * Each persona has three layers of truth:
 * - Universal: What is objectively true and known to everyone
 * - Internal: Personal secrets/private knowledge known only to self
 * - External: How others perceive them
 */
export const personas = pgTable('personas', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id').notNull(), // From OIDC auth (user.sub)
  name: text('name').notNull(), // Character name
  universalTruth: text('universal_truth'), // Public facts
  internalTruth: text('internal_truth'), // Personal secrets/private knowledge
  externalTruth: text('external_truth'), // How others perceive them
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

/**
 * RLS Policies for personas table
 * 
 * These ensure complete user isolation:
 * 1. Users can only SELECT their own personas
 * 2. Users can only INSERT personas with their userId
 * 3. Users can only UPDATE their own personas
 * 4. Users can only DELETE their own personas
 */
export const personasRLSPolicies = sql`
  -- Enable RLS on the personas table
  ALTER TABLE personas ENABLE ROW LEVEL SECURITY;
  
  -- Policy: Users can only see their own personas
  CREATE POLICY personas_select_policy ON personas
    FOR SELECT
    USING (user_id = auth.user_id());
  
  -- Policy: Users can only insert personas for themselves  
  CREATE POLICY personas_insert_policy ON personas
    FOR INSERT
    WITH CHECK (user_id = auth.user_id());
  
  -- Policy: Users can only update their own personas
  CREATE POLICY personas_update_policy ON personas
    FOR UPDATE
    USING (user_id = auth.user_id())
    WITH CHECK (user_id = auth.user_id());
  
  -- Policy: Users can only delete their own personas
  CREATE POLICY personas_delete_policy ON personas
    FOR DELETE
    USING (user_id = auth.user_id());
`