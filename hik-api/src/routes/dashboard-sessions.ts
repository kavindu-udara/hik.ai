import { Hono } from "hono";
import { verifyJWT } from "../lib/auth";
import { db } from "../db";
import { desc, eq } from "drizzle-orm";
import { messages, sessions } from "../db/schema";

const dashboardSessionsRoute = new Hono();

// Middleware: authenticate via JWT
dashboardSessionsRoute.use("*", async (c, next) => {
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

// GET /dashboard/sessions - List all sessions for the user
dashboardSessionsRoute.get("/", async (c) => {
  const userId = c.get("userId");

  const userSessions = await db.query.sessions.findMany({
    where: eq(sessions.userId, userId),
    orderBy: [desc(sessions.updatedAt)],
    limit: 50,
  });

  return c.json({ sessions: userSessions });
});

// GET /dashboard/sessions/:sessionId - Get session with messages
dashboardSessionsRoute.get("/:sessionId", async (c) => {
  const userId = c.get("userId");
  const sessionId = c.req.param("sessionId");

  const session = await db.query.sessions.findFirst({
    where: eq(sessions.id, sessionId),
  });

  if (!session || session.userId !== userId) {
    return c.json({ error: "Session not found" }, 404);
  }

  const sessionMessages = await db.query.messages.findMany({
    where: eq(messages.sessionId, sessionId),
    orderBy: [messages.createdAt],
  });

  return c.json({
    session,
    messages: sessionMessages,
  });
});

export default dashboardSessionsRoute;
