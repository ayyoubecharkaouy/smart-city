FROM node:20-alpine

WORKDIR /app

# Copy package files first for caching
COPY --chown=node:node package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application files with proper ownership
COPY --chown=node:node . .

# Expose port
EXPOSE 4000

# Environment defaults
ENV PORT=4000
ENV MONGODB_URI=mongodb://mongodb:27017/smartcity
ENV KAFKA_BOOTSTRAP_SERVERS=kafka:29092

# Switch to non-root user
USER node

CMD ["node", "server.js"]
