INSERT INTO storage.buckets (id, name, owner, created_at, updated_at, public, avif_autodetection, file_size_limit, allowed_mime_types, owner_id)
VALUES (
  'persona_avatars',
  'persona_avatars',
  NULL,
  NOW(),
  NOW(),
  false,
  false,
  6291456,  -- ~6MB limit
  '{image/*}',
  NULL
) ON CONFLICT (id) DO NOTHING;
