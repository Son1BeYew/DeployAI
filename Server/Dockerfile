FROM node:18-alpine

# Set working directory
WORKDIR /app

# Set environment variables
ENV NODE_ENV=production
ENV PORT=5000

# Copy only package files first (cache optimization)
COPY Server/package*.json ./
# Install deps without dev
RUN npm install --omit=dev && npm cache clean --force
# Create required directories before copying code
RUN mkdir -p outputs

# Copy source code
COPY Server ./

# Expose port
EXPOSE 5000

# Healthcheck - allow server time to start
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5000/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start server
CMD ["node", "server.js"]

