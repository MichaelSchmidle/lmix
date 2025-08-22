import { pgTable, text, timestamp, uuid, boolean, jsonb, uniqueIndex } from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'

/**
 * Models table for storing LLM configurations
 * 
 * Each user can have multiple models configured with different
 * providers and settings. Only one model can be marked as default.
 */
export const models = pgTable('models', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id').notNull(), // From OIDC auth (user.sub)
  name: text('name').notNull(), // Display name (e.g., "GPT-4 Turbo")
  apiEndpoint: text('api_endpoint').notNull(), // Full API endpoint URL
  apiKey: text('api_key'), // Nullable for local/Ollama models
  modelId: text('model_id').notNull(), // Model identifier for the endpoint
  config: jsonb('config').$type<{
    temperature?: number
    maxTokens?: number
    topP?: number
    frequencyPenalty?: number
    presencePenalty?: number
    stopSequences?: string[]
  }>(), // Model configuration parameters
  isDefault: boolean('is_default').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  // Ensure only one default model per user
  oneDefaultPerUser: uniqueIndex('idx_one_default_model_per_user')
    .on(table.userId)
    .where(sql`${table.isDefault} = true`),
  
  // Ensure no duplicate models per user (same model ID and endpoint)
  uniqueModelPerUser: uniqueIndex('idx_unique_model_per_user')
    .on(table.userId, table.modelId, table.apiEndpoint),
}))

/**
 * RLS Policies for models table
 * 
 * These ensure complete user isolation:
 * 1. Users can only SELECT their own models
 * 2. Users can only INSERT models with their userId
 * 3. Users can only UPDATE their own models
 * 4. Users can only DELETE their own models
 */
export const modelsRLSPolicies = sql`
  -- Enable RLS on the models table
  ALTER TABLE models ENABLE ROW LEVEL SECURITY;
  
  -- Policy: Users can only see their own models
  CREATE POLICY models_select_policy ON models
    FOR SELECT
    USING (user_id = auth.user_id());
  
  -- Policy: Users can only insert models for themselves  
  CREATE POLICY models_insert_policy ON models
    FOR INSERT
    WITH CHECK (user_id = auth.user_id());
  
  -- Policy: Users can only update their own models
  CREATE POLICY models_update_policy ON models
    FOR UPDATE
    USING (user_id = auth.user_id())
    WITH CHECK (user_id = auth.user_id());
  
  -- Policy: Users can only delete their own models
  CREATE POLICY models_delete_policy ON models
    FOR DELETE
    USING (user_id = auth.user_id());
`

/**
 * Helper function to ensure only one default model per user
 * This should be called before setting a new default
 */
export const clearDefaultModelsTrigger = sql`
  CREATE OR REPLACE FUNCTION clear_default_models()
  RETURNS TRIGGER AS $$
  BEGIN
    IF NEW.is_default = true THEN
      UPDATE models 
      SET is_default = false 
      WHERE user_id = NEW.user_id 
        AND id != NEW.id
        AND is_default = true;
    END IF;
    RETURN NEW;
  END;
  $$ LANGUAGE plpgsql;

  CREATE TRIGGER ensure_one_default_model
  BEFORE INSERT OR UPDATE ON models
  FOR EACH ROW
  EXECUTE FUNCTION clear_default_models();
`