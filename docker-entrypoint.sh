#!/bin/sh
set -e

# Construct database URL for Supabase CLI
export SUPABASE_DB_URL="postgresql://$POSTGRES_USER:$POSTGRES_PASSWORD@$POSTGRES_HOST:$POSTGRES_PORT/$POSTGRES_DB"

# Run migrations
echo "Running Supabase migrations..."
supabase db push --db-url "$SUPABASE_DB_URL"

# Start the Nuxt app
echo "Starting Nuxt app..."
exec node server/index.mjs