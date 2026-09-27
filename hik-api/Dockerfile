# hik-api/Dockerfile
FROM oven/bun:1 AS base
WORKDIR /app

# Copy package files first to leverage Docker cache
COPY package.json ./
COPY bun.lock ./

RUN bun install --frozen-lockfile

# Copy source code
COPY . .

# Production image
FROM oven/bun:1-slim AS production
WORKDIR /app

# Copy node_modules and source from the base stage
COPY --from=base /app/node_modules ./node_modules
COPY --from=base /app/src ./src
COPY --from=base /app/package.json ./package.json

EXPOSE 3000
# Run the entry point directly using Bun
CMD ["bun", "run", "src/index.ts"]