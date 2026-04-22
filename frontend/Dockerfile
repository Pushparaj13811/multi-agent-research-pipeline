# ============================================
# Stage 1: Dependencies (cached layer)
# ============================================
FROM node:20-slim AS deps

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --prefer-offline

# ============================================
# Stage 2: Build
# ============================================
FROM node:20-slim AS build

WORKDIR /app

COPY --from=deps /app/node_modules node_modules/
COPY . .

RUN npm run build

# ============================================
# Stage 3: Production serve (nginx)
# ============================================
FROM nginx:1.27-alpine AS runtime

# Remove default nginx config
RUN rm /etc/nginx/conf.d/default.conf

# Copy built assets
COPY --from=build /app/dist /usr/share/nginx/html

# Copy nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Healthcheck
HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
    CMD wget -q --spider http://localhost:80/ || exit 1

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
