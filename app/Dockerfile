FROM node:22-alpine

WORKDIR /app

RUN npm install -g bun

COPY package.json bun.lockb* ./
RUN bun install --frozen-lockfile

COPY src/ ./src/
COPY public/ ./public/
COPY index.html vite.config.ts tsconfig.json tsconfig.node.json tailwind.config.ts postcss.config.js ./

EXPOSE 5173

CMD ["bun", "run", "dev", "--host", "0.0.0.0"]