import fetch from "node-fetch";
import { requireApiKey, getConfig } from "./auth.js";

export async function streamChat(message: string, model?: string) {
  const apiKey = requireApiKey();
  const config = getConfig();
  const apiUrl = config.apiUrl || "http://localhost:3000";

  // For MVP, we'll use a random UUID for session ID.
  // In a real app, you might want to persist sessions in a local file.
  const sessionId = crypto.randomUUID();

  const response = await fetch(`${apiUrl}/api/v1/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
    },
    body: JSON.stringify({
      sessionId,
      messages: [{ role: "user", content: message }],
      model: model || "qwen2.5-coder-7b-instruct",
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`API Error: ${err}`);
  }

  const reader = response.body?.getReader();
  const decoder = new TextDecoder();

  if (!reader) throw new Error("No response body");

  let buffer = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";

    for (const line of lines) {
      if (line.startsWith("data: ")) {
        try {
          const data = JSON.parse(line.slice(6));
          if (data.type === "text") {
            process.stdout.write(data.content);
          }
        } catch (e) {
          // Ignore parse errors
        }
      }
    }
  }
  console.log("\n"); // New line after stream ends
}
