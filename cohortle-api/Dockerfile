# -------- BUILD STAGE --------
FROM node:20-alpine AS builder

# Force rebuild for auto-migrations
WORKDIR /app

COPY package*.json ./
# Install production dependencies + sequelize-cli for migrations
RUN npm ci --only=production && npm install sequelize-cli@^6.6.2

COPY . .

# -------- RUNTIME STAGE --------
FROM node:20-alpine

WORKDIR /app

# Create non-root user
RUN addgroup -S nodegroup && adduser -S nodeuser -G nodegroup

COPY --from=builder /app /app

# Copy entrypoint + make executable INSIDE the image
COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

USER nodeuser

EXPOSE 3000
ENTRYPOINT ["docker-entrypoint.sh"]
