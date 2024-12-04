#!/bin/sh
set -e

# Wait for database to be available (timeout after 30 seconds)
echo "Waiting for database to be available..."
timeout=30
counter=0
until PGPASSWORD=$POSTGRES_PASSWORD psql -v ON_ERROR_STOP=1 -h "$POSTGRES_HOST" -p "$POSTGRES_PORT" -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c '\q' 2>&1; do
  counter=$((counter + 1))
  if [ $counter -ge $((timeout + 1)) ]; then
    echo "Error: Timed out waiting for database after ${timeout} seconds"
    exit 1
  fi
  echo "Database is unavailable - sleeping (attempt $counter/$timeout)"
  sleep 1
done
echo "Database is available"

# Construct database URL for Supabase CLI
export SUPABASE_DB_URL="postgresql://$POSTGRES_USER:$POSTGRES_PASSWORD@$POSTGRES_HOST:$POSTGRES_PORT/$POSTGRES_DB"

# Run migrations
echo "Running Supabase migrations..."
supabase db push --db-url "$SUPABASE_DB_URL"

# Start the Nuxt app
echo "Starting Nuxt app..."
exec node server/index.mjs