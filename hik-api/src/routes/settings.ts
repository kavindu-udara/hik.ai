import { Hono } from "hono";
import { verifyJWT } from "../lib/auth";
import z from "zod";
import { db } from "../db";
import { and, eq } from "drizzle-orm";
import { userProviderKeys } from "../db/schema";

const settingsRoute = new Hono();

// Middleware to protect routes
settingsRoute.use("*", async (c, next) => {
  const authHeader = c.req.header("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return c.json({ error: "Unauthorized : Missing token" }, 401);
  }
  const token = authHeader.split(" ")[1];
  const payload = await verifyJWT(token);
  if (!payload) {
    return c.json({ error: "Unauthorized : Invalid token" }, 401);
  }
  c.set("userId", payload.userId);
  await next();
});

const saveKeySchema = z.object({
  provider: z.enum(["openai", "anthropic"]),
  apiKey: z.string().min(10, "Invalid API key format"),
});

// POST /keys
settingsRoute.post("/keys", async (c) => {
  const userId = c.get("userId");
  const body = await c.req.json();
  const parsed = saveKeySchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: parsed.error.format() }, 400);
  }

  const { provider, apiKey } = parsed.data;

  // In a real app, encrypt this with a library like 'crypto' using a server-side secret.
  // For this MVP, we will hash it or store it as-is (add a warning in production).
  // Let's use a simple XOR or just store it for the MVP, but ideally use crypto.createCipheriv.
  // For simplicity in this step, we'll just store it. (Add encryption in Phase 2)

  // Upsert: Update if exists, insert if not
  const existing = await db.query.userProviderKeys.findFirst({
    where: and(
      eq(userProviderKeys.userId, userId),
      eq(userProviderKeys.provider, provider),
    ),
  });

  if (existing) {
    await db
      .update(userProviderKeys)
      .set({ encryptedKey: apiKey }) // TODO: Encrypt this in production
      .where(eq(userProviderKeys.id, existing.id));
  } else {
    await db.insert(userProviderKeys).values({
      userId,
      provider,
      encryptedKey: apiKey,
    });
  }

  return c.json({ message: `${provider} key saved successfully` });
});

export default settingsRoute;
