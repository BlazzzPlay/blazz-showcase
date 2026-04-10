# ---- Build Stage ----
FROM node:22-alpine AS builder

WORKDIR /app

# Install dependencies first (layer cache)
COPY package.json package-lock.json ./
RUN npm ci

# Copy source and build
COPY . .
RUN npm run build

# ---- Production Stage ----
FROM node:22-alpine AS production

WORKDIR /app

# Only copy production deps and build output
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY --from=builder /app/dist ./dist

# Create data directory for SQLite persistence
RUN mkdir -p /data

# Environment defaults
ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=4321
ENV DB_PATH=/data/sqlite.db

EXPOSE 4321

CMD ["npm", "start"]
