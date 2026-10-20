# TelloraShop container image.
#
# Run it with a volume on /data so the database (and the generated login key) survive restarts:
#   docker run -p 3000:3000 -v tellorashop-data:/data \
#     -e JWT_SECRET=... -e NEXT_PUBLIC_SITE_URL=https://yourshop.com tellorashop

# 1. Base stage
FROM node:20-alpine AS base
# libc6-compat is the correct package for glibc-linked binaries on Alpine
RUN apk add --no-cache libc6-compat
WORKDIR /app

# 2. Dependencies stage
FROM base AS deps
# Build tools are only needed if better-sqlite3 has no prebuilt binary and must compile from source
RUN apk add --no-cache python3 make g++
COPY package.json package-lock.json ./
RUN npm ci

# 3. Builder stage
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# 4. Runner stage
FROM base AS runner
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0 \
    DB_PATH=/data/tellorashop.db

RUN addgroup --system --gid 1001 nodejs \
 && adduser --system --uid 1001 nextjs \
 && mkdir -p /data \
 && chown nextjs:nodejs /data

# Public static files, then the standalone Next.js server and its static assets
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

VOLUME ["/data"]
USER nextjs
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3000/api/health >/dev/null || exit 1

CMD ["node", "server.js"]
