# ── Stage 1: build ─────────────────────────────────────────────────────────
FROM node:22-alpine AS builder
WORKDIR /app

COPY package.json ./
RUN npm install --frozen-lockfile

COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# ── Stage 2: runtime ───────────────────────────────────────────────────────
FROM node:22-alpine AS runtime
WORKDIR /app

ENV NODE_ENV=production

# Только prod зависимости
COPY package.json ./
RUN npm install --omit=dev --frozen-lockfile

COPY --from=builder /app/dist ./dist

EXPOSE 4000

# wget нужен для healthcheck в compose
RUN apk add --no-cache wget

CMD ["node", "dist/main.js"]
