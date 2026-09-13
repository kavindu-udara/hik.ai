import { createAnthropic } from "@ai-sdk/anthropic";
import { createOpenAI } from "@ai-sdk/openai";
import { streamText } from "ai";
import { Hono } from "hono";
import { stream, streamSSE } from "hono/streaming";
import z from "zod";

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
  const body = await c.req.json();
  const parsed = chatSchema.safeParse(body);

  if (!parsed.success) {
    return c.json({ error: "Invalid request body" }, 400);
  }

  const { messages, model } = parsed.data;

  // TODO: 1. Verify the user's API key from the Authorization header
  // TODO: 2. Fetch the user's profile to check their plan (Free vs Full)
  // TODO: 3. If Free plan, fetch their BYOK key from userProviderKeys table.
  //         If Full plan, use Hik's master environment variables.

  // --- MOCKING THE KEY LOGIC FOR NOW ---
  const isFullPlan = false;
  const userOpenAIKey = process.env.OPENAI_API_KEY; // Fallback for testing
  const userAnthropicKey = process.env.ANTHROPIC_API_KEY;
  // -------------------------------------

  // Dynamically create the provider based on the model requested
  let provider;
  if (model.startsWith("gpt") || model.startsWith("o1")) {
    provider = createOpenAI({ apiKey: userOpenAIKey });
  } else if (model.startsWith("claude")) {
    provider = createAnthropic({ apiKey: userAnthropicKey });
  } else {
    return c.json({ error: "Unsupported model" }, 400);
  }

  //   Use Versel AI SDK to handle the streaming
  const result = streamText({
    model: provider(model),
    messages: messages as any,
  });

  // Hono's SSE streaming helper to pipe the AI response to the client
  return streamSSE(c, async (stream) => {
    // Stream the text chunks
    for await (const chunk of result.textStream) {
      await stream.writeSSE({
        data: JSON.stringify({ type: "text", content: chunk }),
        event: "message",
      });
    }

    // Once finished, get the usage metrics and send them
    const usage = await result.usage;
    await stream.writeSSE({
      data: JSON.stringify({
        type: "done",
        usage: {
          inputTokens: usage.inputTokens,
          outputTokens: usage.outputTokens,
          totalTokens: usage.totalTokens,
        },
      }),
      event: "message",
    });

    // TODO: Save the final message to the 'messages' table
    // TODO: Save the usage metrics to the 'usage_logs' table
  });
});

export default ChatRoute;
