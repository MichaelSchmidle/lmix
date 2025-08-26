import { pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'

/**
 * Worlds table for storing reusable world settings
 * 
 * Worlds define the immutable laws and setting for productions.
 * Examples: "Modern NYC", "Victorian London with magic", "24th century space station"
 */
export const worlds = pgTable('worlds', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id').notNull(), // From OIDC auth (user.sub)
  name: text('name').notNull(), // World name (e.g., "Modern NYC")
  description: text('description').notNull(), // Immutable laws/setting
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

/**
 * RLS Policies for worlds table
 * 
 * These ensure complete user isolation:
 * 1. Users can only SELECT their own worlds
 * 2. Users can only INSERT worlds with their userId
 * 3. Users can only UPDATE their own worlds
 * 4. Users can only DELETE their own worlds
 */
export const worldsRLSPolicies = sql`
  -- Enable RLS on the worlds table
  ALTER TABLE worlds ENABLE ROW LEVEL SECURITY;
  
  -- Policy: Users can only see their own worlds
  CREATE POLICY worlds_select_policy ON worlds
    FOR SELECT
    USING (user_id = auth.user_id());
  
  -- Policy: Users can only insert worlds for themselves  
  CREATE POLICY worlds_insert_policy ON worlds
    FOR INSERT
    WITH CHECK (user_id = auth.user_id());
  
  -- Policy: Users can only update their own worlds
  CREATE POLICY worlds_update_policy ON worlds
    FOR UPDATE
    USING (user_id = auth.user_id())
    WITH CHECK (user_id = auth.user_id());
  
  -- Policy: Users can only delete their own worlds
  CREATE POLICY worlds_delete_policy ON worlds
    FOR DELETE
    USING (user_id = auth.user_id());
`