import { Hono } from "hono";
import { generateApiKey, hashApiKey, verifyJWT } from "../lib/auth";
import z from "zod";
import { db } from "../db";
import { apiKeys } from "../db/schema";

const apiKeyRoute = new Hono();

// Middleware to protect routes
apiKeyRoute.use("*", async (c, next) => {
  const authHeader = c.req.header("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return c.json({ error: "Unauthorized: Missing token" }, 401);
  }

  const token = authHeader.split(" ")[1];
  const payload = await verifyJWT(token);

  if (!payload) {
    return c.json({ error: "Unauthorized: Invalid token" }, 401);
  }

  // Attach user ID to context for downstream handlers
  c.set("userId", payload.userId);

  await next();
});

const generateKeySchema = z.object({
  name: z.string().min(1, "Key name is required").max(50),
});

// POST /api-keys
apiKeyRoute.post("/", async (c) => {
  const userId = c.get("userId");
  const body = await c.req.json();
  const parsed = generateKeySchema.safeParse(body);

  if (!parsed.success) return c.json({ error: parsed.error.errors }, 400);

  const { name } = parsed.data;

  // Generate the raw API key
  const rawApiKey = generateApiKey();

  // Hash the API key before save it to the database
  const keyHash = await hashApiKey(rawApiKey);

  // Save to database
  const [newKey] = await db
    .insert(apiKeys)
    .values({
      userId,
      keyHash,
      name,
    })
    .returning();

  // Return the RAW key to the user ONCE. They must save it now.
  return c.json(
    {
      message: "API key generated successfully",
      apiKey: rawApiKey, // ⚠️ Only time this is shown!
      keyId: newKey.id,
      name: newKey.name,
    },
    201,
  );
});

export default apiKeyRoute;
