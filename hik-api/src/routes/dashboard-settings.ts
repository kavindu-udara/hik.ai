import { Hono } from "hono";
import { db } from "../db";
import { userProviderKeys, usageLogs, apiKeys } from "../db/schema";
import { eq, and, desc, sql } from "drizzle-orm";
import { verifyJWT } from "../lib/auth";

const dashboardSettingsRoute = new Hono();

// Middleware: authenticate via JWT
dashboardSettingsRoute.use("*", async (c, next) => {
  const authHeader = c.req.header("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return c.json({ error: "Unauthorized: Missing token" }, 401);
  }

  const token = authHeader.split(" ")[1];
  const payload = await verifyJWT(token);

  if (!payload) {
    return c.json({ error: "Unauthorized: Invalid token" }, 401);
  }

  c.set("userId", payload.userId);
  await next();
});

dashboardSettingsRoute.get("/keys", async (c) => {
  const userId = c.get("userId");

  const keys = await db.query.userProviderKeys.findMany({
    where: eq(userProviderKeys.userId, userId),
    columns: { id: true, provider: true, createdAt: true, updatedAt: true },
  });

  return c.json({ keys });
});

dashboardSettingsRoute.post("/keys", async (c) => {
  const userId = c.get("userId");
  const body = await c.req.json();
  const { provider, apiKey } = body;

  if (!provider || !apiKey) {
    return c.json({ error: "Provider and apiKey are required" }, 400);
  }

  if (!["openai", "anthropic"].includes(provider)) {
    return c.json({ error: "Invalid provider" }, 400);
  }

  // Check if key already exists
  const existing = await db.query.userProviderKeys.findFirst({
    where: and(
      eq(userProviderKeys.userId, userId),
      eq(userProviderKeys.provider, provider),
    ),
  });

  if (existing) {
    // Update existing key
    await db
      .update(userProviderKeys)
      .set({ encryptedKey: apiKey, updatedAt: new Date() })
      .where(eq(userProviderKeys.id, existing.id));
  } else {
    // Insert new key
    await db.insert(userProviderKeys).values({
      userId,
      provider,
      encryptedKey: apiKey,
    });
  }

  return c.json({ message: `${provider} key saved successfully` });
});

dashboardSettingsRoute.delete("/keys/:provider", async (c) => {
  const userId = c.get("userId");
  const provider = c.req.param("provider");

  await db
    .delete(userProviderKeys)
    .where(
      and(
        eq(userProviderKeys.userId, userId),
        eq(userProviderKeys.provider, provider),
      ),
    );

  return c.json({ message: "Key deleted" });
});

dashboardSettingsRoute.get("/usage", async (c) => {
  const userId = c.get("userId");

  // Get recent usage logs
  const logs = await db.query.usageLogs.findMany({
    where: eq(usageLogs.userId, userId),
    orderBy: [desc(usageLogs.createdAt)],
    limit: 100,
  });

  // Calculate totals
  const totalInputTokens = logs.reduce((sum, log) => sum + log.inputTokens, 0);
  const totalOutputTokens = logs.reduce(
    (sum, log) => sum + log.outputTokens,
    0,
  );

  // Group by provider
  const byProvider = logs.reduce(
    (acc, log) => {
      if (!acc[log.provider]) {
        acc[log.provider] = { inputTokens: 0, outputTokens: 0, requests: 0 };
      }
      acc[log.provider].inputTokens += log.inputTokens;
      acc[log.provider].outputTokens += log.outputTokens;
      acc[log.provider].requests += 1;
      return acc;
    },
    {} as Record<
      string,
      { inputTokens: number; outputTokens: number; requests: number }
    >,
  );

  return c.json({
    logs: logs.slice(0, 20), // Return only last 20 for display
    totals: {
      inputTokens: totalInputTokens,
      outputTokens: totalOutputTokens,
      totalTokens: totalInputTokens + totalOutputTokens,
    },
    byProvider,
  });
});

export default dashboardSettingsRoute;
