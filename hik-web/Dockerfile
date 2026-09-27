FROM oven/bun:1 AS base
WORKDIR /app

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

COPY . .
ENV NEXT_TELEMETRY_DISABLED 1
RUN bun run build

FROM oven/bun:1-slim AS production
WORKDIR /app

COPY --from=base /app/public ./public
COPY --from=base /app/.next/standalone ./
COPY --from=base /app/.next/static ./.next/static

EXPOSE 3001
ENV PORT 3001
ENV HOSTNAME "0.0.0.0"
CMD ["bun", "server.js"]