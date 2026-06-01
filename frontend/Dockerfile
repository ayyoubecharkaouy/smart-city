# Stage 1: Build the Next.js application
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files for dependency caching
COPY package*.json ./

# Install all dependencies (needed for compilation)
RUN npm ci

# Copy application code and compile
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# Stage 2: Serve the compiled application
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV NEXT_PUBLIC_BACKEND_URL=http://localhost:4000
ENV NEXT_TELEMETRY_DISABLED=1

# Copy public assets, standalone build and static files from builder with proper ownership
COPY --from=builder --chown=node:node /app/public ./public
COPY --from=builder --chown=node:node /app/.next/standalone ./
COPY --from=builder --chown=node:node /app/.next/static ./.next/static

# Expose the frontend port
EXPOSE 3000

# Use non-root node user for runtime security
USER node

CMD ["node", "server.js"]
