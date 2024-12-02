#!/bin/sh
set -e

# Run migrations
echo "Running Supabase migrations..."
supabase db push --db-url "$SUPABASE_DB_URL"

# Start the Nuxt app
echo "Starting Nuxt app..."
exec node server/index.mjs