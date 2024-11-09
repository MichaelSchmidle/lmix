# Build stage
FROM node:18-alpine AS builder

# Install build dependencies
RUN apk add --no-cache git

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source files
COPY . .

# Build application
RUN npm run build

# Production stage
FROM node:18-alpine

# Install Supabase CLI and runtime dependencies
RUN apk add --no-cache \
  curl \
  postgresql-client \
  && curl -fsSL https://raw.githubusercontent.com/supabase/cli/main/install.sh | sh

# Set working directory
WORKDIR /app

# Copy built application
COPY --from=builder /app/.output ./.output
COPY --from=builder /app/supabase ./supabase

# Copy startup script
COPY docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# Set environment
ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3000

# Expose port
EXPOSE 3000

# Set entrypoint
ENTRYPOINT ["docker-entrypoint.sh"]
