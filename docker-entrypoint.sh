#!/bin/sh
set -e

# Wait for database to be ready
until PGPASSWORD="$SUPABASE_DB_PASSWORD" psql -h "$SUPABASE_DB_HOST" -U "$SUPABASE_DB_USER" -d "$SUPABASE_DB_NAME" -c '\q'; do
  >&2 echo "Postgres is unavailable - sleeping"
  sleep 1
done

>&2 echo "Postgres is up - executing migrations"

# Run migrations using Supabase CLI
cd /app/supabase
supabase db push

# Start the application
cd /app
node .output/server/index.mjs
