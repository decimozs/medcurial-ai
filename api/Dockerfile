FROM oven/bun:1-alpine AS base

WORKDIR /app

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile


FROM base AS dev

COPY src/ ./src/
COPY drizzle.config.ts tsconfig.json ./

CMD ["bun", "run", "dev"]


FROM base AS build

COPY src/ ./src/
COPY drizzle.config.ts tsconfig.json ./
RUN bun run build


FROM oven/bun:1-alpine AS production

WORKDIR /app

RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001 -G nodejs

COPY --from=build --chown=nextjs:nodejs /app/dist ./dist
COPY --from=base --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --from=base --chown=nextjs:nodejs /app/package.json ./

USER 1001

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD ["wget", "-q", "--spider", "http://localhost:3000/health"]

CMD ["bun", "dist/index.js"]
