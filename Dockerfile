# Build stage
FROM node:20-alpine AS builder
WORKDIR /app

# Add build arguments
ARG LMIX_VERSION=unspecified

# Set environment variables for build
ENV LMIX_VERSION=${LMIX_VERSION}

COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Production stage
FROM node:20-alpine
WORKDIR /app

# Install Supabase CLI and PostgreSQL client (needed for health check)
RUN apk add --no-cache \
    curl \
    postgresql-client \
    && curl -L https://github.com/supabase/cli/releases/latest/download/supabase_linux_amd64.tar.gz | tar -xz \
    && mv supabase /usr/local/bin \
    && apk del curl

# Copy only necessary files
COPY --from=builder /app/.output ./
COPY supabase/migrations ./supabase/migrations
COPY docker-entrypoint.sh /
RUN chmod +x /docker-entrypoint.sh

ENTRYPOINT ["/docker-entrypoint.sh"]