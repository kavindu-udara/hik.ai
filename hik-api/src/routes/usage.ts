import { Hono } from "hono";
import { hashApiKey } from "../lib/auth";
import { desc, eq } from "drizzle-orm";
import { db } from "../db";
import { apiKeys, usageLogs } from "../db/schema";

const usageRoute = new Hono();

// Middleware: authenticate via API key
usageRoute.use("*", async (c, next) => {
  const apiKeyHeader =
    c.req.header("x-api-key") ||
    c.req.header("Authorization")?.replace("Bearer ", "");

  if (!apiKeyHeader || !apiKeyHeader.startsWith("hik_")) {
    return c.json({ error: "Unauthorized: Valid x-api-key required" }, 401);
  }

  const hashedInput = hashApiKey(apiKeyHeader);
  const dbKey = await db.query.apiKeys.findFirst({
    where: eq(apiKeys.keyHash, hashedInput),
  });

  if (!dbKey) {
    return c.json({ error: "Unauthorized: Invalid API key" }, 401);
  }

  c.set("userId", dbKey.userId);
  await next();
});

// usage
usageRoute.get("/", async (c) => {
  const userId = c.get("userId");

  const logs = await db.query.usageLogs.findMany({
    where: eq(usageLogs.userId, userId),
    orderBy: [desc(usageLogs.createdAt)],
    limit: 100,
  });

  const total = logs.reduce(
    (acc, log) => ({
      inputTokens: acc.inputTokens + log.inputTokens,
      outputTokens: acc.outputTokens + log.outputTokens,
    }),
    { inputTokens: 0, outputTokens: 0 },
  );

  return c.json({ logs, total });
});

export default usageRoute;
