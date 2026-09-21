import { Hono } from "hono";
import { hashApiKey } from "../lib/auth";
import { desc, eq } from "drizzle-orm";
import { apiKeys, messages, sessions } from "../db/schema";
import { db } from "../db";

const sessionsRoute = new Hono();

// Middleware to auth via API key
sessionsRoute.use("*", async (c, next) => {
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

// GET /session - Fetch all session from the user
sessionsRoute.get("/", async (c) => {
  const userId = c.get("userId");

  const userSessions = await db.query.sessions.findMany({
    where: eq(sessions.userId, userId),
    orderBy: [desc(sessions.updatedAt)],
    limit: 50,
  });

  return c.json({ sessions: userSessions });
});

// GET /session/:id - Fetch a specific session by ID
sessionsRoute.get("/:sessionId", async (c) => {
  const userId = c.get("userId");
  const sessionId = c.req.param("sessionId");

  // Verify the session belongs to this user
  const session = await db.query.sessions.findFirst({
    where: eq(sessions.id, sessionId),
  });

  if (!session || session.userId !== userId) {
    return c.json({ error: "Session not found" }, 404);
  }

  // Fetch all messages for this session
  const sessionMessages = await db.query.messages.findMany({
    where: eq(messages.sessionId, sessionId),
    orderBy: [messages.createdAt],
  });

  return c.json({
    session,
    messages: sessionMessages,
  });
});

export default sessionsRoute;
