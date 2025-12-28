# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --legacy-peer-deps

# Copy source code
COPY . .

# Build arguments
ARG APP_NAME=app-api

# Build the application
RUN npm run build:${APP_NAME}

# Production stage
FROM node:20-alpine AS production

WORKDIR /app

# Install curl for healthcheck
RUN apk add --no-cache curl

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm ci --legacy-peer-deps --omit=dev && \
    npm cache clean --force

# Build arguments
ARG APP_NAME=app-api
ARG APP_PORT=4000

# Copy built application
COPY --from=builder /app/dist ./dist

# Set environment variables (ARG -> ENV for runtime)
ENV NODE_ENV=production
ENV PORT=${APP_PORT}
ENV APP_NAME=${APP_NAME}

# Change ownership
RUN chown -R nestjs:nodejs /app

# Switch to non-root user
USER nestjs

# Expose port
EXPOSE ${APP_PORT}

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:${PORT}/api/health || exit 1

# Start the application
CMD ["sh", "-c", "node dist/apps/${APP_NAME}/main.js"]
