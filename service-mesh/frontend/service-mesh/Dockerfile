# ── Stage 1: build ─────────────────────────────────────────────────────────
FROM node:22-alpine AS builder
WORKDIR /app

# ARG пробрасывается из compose build.args
ARG VITE_API_URL=http://localhost:4000
ENV VITE_API_URL=$VITE_API_URL

COPY package.json ./
RUN npm install --frozen-lockfile

COPY . .
RUN npm run build

# ── Stage 2: serve через nginx ─────────────────────────────────────────────
FROM nginx:1.27-alpine AS runtime

# Конфиг nginx — SPA с fallback на index.html
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
