FROM oven/bun:1-alpine

WORKDIR /app

COPY package.json bun.lockb* ./
RUN bun install --frozen-lockfile

COPY src/ ./src/
COPY db.ts drizzle.config.ts tsconfig.json ./

EXPOSE 3000

CMD ["bun", "run", "dev"]