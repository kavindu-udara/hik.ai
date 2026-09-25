import { Hono } from "hono";
import { db } from "../db";
import { sessions, usageLogs, apiKeys, users } from "../db/schema";
import { eq, sql, desc } from "drizzle-orm";
import { verifyJWT } from "../lib/auth";

const dashboardOverviewRoute = new Hono();

// Middleware: authenticate via JWT
dashboardOverviewRoute.use("*", async (c, next) => {
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

dashboardOverviewRoute.get("/", async (c) => {
  const userId = c.get("userId");

  // Get total sessions
  const totalSessions = await db
    .select({ count: sql<number>`count(*)` })
    .from(sessions)
    .where(eq(sessions.userId, userId));

  // Get total tokens
  const usageStats = await db
    .select({
      inputTokens: sql<number>`coalesce(sum(${usageLogs.inputTokens}), 0)`,
      outputTokens: sql<number>`coalesce(sum(${usageLogs.outputTokens}), 0)`,
      totalRequests: sql<number>`count(*)`,
    })
    .from(usageLogs)
    .where(eq(usageLogs.userId, userId));

  // Get active providers (providers used in last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const recentUsage = await db.query.usageLogs.findMany({
    where: sql`${usageLogs.createdAt} > ${thirtyDaysAgo.toISOString()}`,
    columns: { provider: true },
  });

  const activeProviders = Array.from(
    new Set(recentUsage.map((log) => log.provider)),
  );

  // Get API keys count
  const apiKeysCount = await db
    .select({ count: sql<number>`count(*)` })
    .from(apiKeys)
    .where(eq(apiKeys.userId, userId));

  // Get recent sessions (last 5)
  const recentSessions = await db.query.sessions.findMany({
    where: eq(sessions.userId, userId),
    orderBy: [desc(sessions.updatedAt)],
    limit: 5,
  });

  // Get user info
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
  });

  return c.json({
    totalSessions: Number(totalSessions[0]?.count || 0),
    totalTokens: {
      input: Number(usageStats[0]?.inputTokens || 0),
      output: Number(usageStats[0]?.outputTokens || 0),
      total:
        Number(usageStats[0]?.inputTokens || 0) +
        Number(usageStats[0]?.outputTokens || 0),
    },
    totalRequests: Number(usageStats[0]?.totalRequests || 0),
    activeProviders,
    apiKeysCount: Number(apiKeysCount[0]?.count || 0),
    recentSessions,
    user: {
      email: user?.email,
      plan: user?.plan,
      createdAt: user?.createdAt,
    },
  });
});

export default dashboardOverviewRoute;
