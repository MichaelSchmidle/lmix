-- Create trigger to ensure only one default model per user
-- This trigger automatically clears previous defaults when setting a new one
CREATE OR REPLACE FUNCTION ensure_single_default_model()
RETURNS TRIGGER AS $$
BEGIN
  -- If setting a model as default, unset all other defaults for this user
  IF NEW.is_default = true AND (OLD IS NULL OR OLD.is_default IS DISTINCT FROM true) THEN
    UPDATE models 
    SET is_default = false 
    WHERE user_id = NEW.user_id 
      AND id != NEW.id 
      AND is_default = true;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for INSERT operations
CREATE TRIGGER before_model_default_insert
  BEFORE INSERT ON models
  FOR EACH ROW
  WHEN (NEW.is_default = true)
  EXECUTE FUNCTION ensure_single_default_model();

-- Create trigger for UPDATE operations  
CREATE TRIGGER before_model_default_update
  BEFORE UPDATE ON models
  FOR EACH ROW
  WHEN (NEW.is_default = true)
  EXECUTE FUNCTION ensure_single_default_model();