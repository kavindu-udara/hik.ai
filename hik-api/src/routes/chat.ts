import { createAnthropic } from "@ai-sdk/anthropic";
import { createOpenAI } from "@ai-sdk/openai";
import { streamText } from "ai";
import { Hono } from "hono";
import { stream, streamSSE } from "hono/streaming";
import { z } from "zod";
import { hashPassword } from "../lib/auth";
import { db } from "../db";
import { and, eq } from "drizzle-orm";
import { apiKeys, sessions, userProviderKeys, users } from "../db/schema";

const ChatRoute = new Hono();

const chatSchema = z.object({
  sessionId: z.string().uuid(),
  messages: z.array(
    z.object({
      role: z.enum(["user", "assistant", "system"]),
      content: z.string(),
    }),
  ),
  model: z.string().default("gpt-4o"),
});

ChatRoute.post("/", async (c) => {
  // Authenticate via API key
  const apiKeyHeader =
    c.req.header("x-api-key") ||
    c.req.header("Authorization")?.replace("Bearer ", "");
  if (!apiKeyHeader || !apiKeyHeader.startsWith("hik_")) {
    return c.json({ error: "Unauthorized: Valid x-api-key required" }, 401);
  }

  // Hash the provided key to query the database
  const hashedInput = await hashPassword(apiKeyHeader);

  const dbKey = await db.query.apiKeys.findFirst({
    where: eq(apiKeys.keyHash, hashedInput),
  });

  if (!dbKey) {
    return c.json({ error: "Unauthorized: Invalid API key" }, 401);
  }

  // Fetch the user separately
  const user = await db.query.users.findFirst({
    where: eq(users.id, dbKey.userId),
  });

  if (!user) {
    return c.json({ error: "Unauthorized: User not found" }, 401);
  }

  const userId = dbKey.userId;
  const userPlan = user.plan;

  // Validate request body
  const body = await c.req.json();
  const parsed = chatSchema.safeParse(body);

  if (!parsed.success) {
    return c.json({ error: "Invalid request body" }, 400);
  }

  const { sessionId, messages: chatMessages, model } = parsed.data;

  // Ensure session exists (or create it if it's the first message)
  const session = await db.query.sessions.findFirst({
    where: eq(sessions.id, sessionId),
  });

  if (!session) {
    await db.insert(sessions).values({
      id: sessionId,
      userId,
      title: chatMessages[0].content.slice(0, 30) + "...",
    });
  }

  // determine which API key to use (Full Plan vs BYOK)
  let providerKey: string | undefined;
  let providerName: "openai" | "anthropic" = "openai";

  if (userPlan === "full") {
    // Use master key from .env
    if (model.startsWith("gpt") || model.startsWith("o1")) {
      providerKey = process.env.OPENAI_API_KEY;
    } else if (model.startsWith("claude")) {
      providerKey = process.env.ANTHROPIC_API_KEY;
      providerName = "anthropic";
    }
  } else {
    // BYOK : Fetch the user's saved key
    const userKey = await db.query.userProviderKeys.findFirst({
      where: and(
        eq(userProviderKeys.userId, userId),
        eq(
          userProviderKeys.provider,
          model.startsWith("claude") ? "anthropic" : "openai",
        ),
      ),
    });

    if (!userKey) {
      return c.json(
        {
          error: "Payment Required: Please add your API key in settings first.",
        },
        402,
      );
    }

    providerKey = userKey.encryptedKey;
    providerName = userKey.provider as "openai" | "anthropic";
  }

  if (!providerKey) {
    return c.json(
      { error: "Server Error: LLM provider key not configured" },
      500,
    );
  }

  // Initialize the LLM provider
  let llmProvider;

  if (providerName === "openai") {
    llmProvider = createOpenAI({
      apiKey: providerKey || "not-needed", // LM Studio doesn't need a key
      baseURL: process.env.OPENAI_BASE_URL || "https://api.openai.com/v1",
    });
  } else if (providerName === "anthropic") {
    llmProvider = createAnthropic({
      apiKey: providerKey || "not-needed",
      baseURL: process.env.ANTHROPIC_BASE_URL || "https://api.anthropic.com",
    });
  } else {
    return c.json({ error: "Unsupported provider" }, 400);
  }

  // Stream the response
  const result = streamText({
    model: llmProvider(model),
    messages: chatMessages as any,
  });

  return streamSSE(c, async (stream) => {
    let fullResponseText = "";

    // Stream chunks to client
    for await (const chunk of result.textStream) {
      fullResponseText += chunk;
      await stream.writeSSE({
        data: JSON.stringify({ type: "text", content: chunk }),
        event: "message",
      });
    }

    // Get final usage metrics
    const usage = await result.usage;

    // Send completion event
    await stream.writeSSE({
      data: JSON.stringify({
        type: "done",
        usage: {
          promptTokens: usage.promptTokens,
          completionTokens: usage.completionTokens,
        },
      }),
      event: "message",
    });

    // Save to database
    try {
      // Save the assistant's message
      await db.insert(messages).values({
        sessionId,
        role: "assistant",
        content: fullResponseText,
      });

      // Log usage metrics
      await db.insert(usageLogs).values({
        userId,
        sessionId,
        provider: providerName,
        model,
        inputTokens: usage.promptTokens,
        outputTokens: usage.completionTokens,
      });
    } catch (dbError) {
      console.error("Failed to save chat history or usage:", dbError);
    }
  });
});

export default ChatRoute;
