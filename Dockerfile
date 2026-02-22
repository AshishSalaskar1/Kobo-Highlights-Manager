# ── Stage 1: Build the React UI ──────────────────────────────────────────────
FROM node:20-alpine AS ui-build

WORKDIR /app/ui
COPY ui/package.json ui/package-lock.json ./
RUN npm ci
COPY ui/ ./
RUN npm run build

# ── Stage 2: Production image ───────────────────────────────────────────────
FROM node:20-alpine

WORKDIR /app

# Install server dependencies
COPY server/package.json server/package-lock.json ./server/
RUN cd server && npm ci --omit=dev

# Copy server source
COPY server/src/ ./server/src/
COPY server/tsconfig.json ./server/

# Copy built UI from Stage 1
COPY --from=ui-build /app/ui/dist ./ui/dist

# Create directories for runtime data
RUN mkdir -p server/data server/.uploads

EXPOSE 3001

CMD ["npx", "--prefix", "server", "tsx", "server/src/index.ts"]
