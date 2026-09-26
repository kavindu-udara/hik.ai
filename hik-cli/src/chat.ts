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

  const decoder = new TextDecoder();

  if (!response.body) throw new Error("No response body");

  let buffer = "";
  for await (const chunk of response.body) {
    buffer +=
      typeof chunk === "string"
        ? chunk
        : decoder.decode(chunk, { stream: true });
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

  buffer += decoder.decode();
  console.log("\n"); // New line after stream ends
}

async function fetchCompletion(
  messages: any[],
  model: string,
): Promise<string> {
  const apiKey = requireApiKey();
  const config = getConfig();
  const apiUrl = config.apiUrl || "http://localhost:3000";
  const sessionId = crypto.randomUUID();

  const response = await fetch(`${apiUrl}/api/v1/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
    },
    body: JSON.stringify({
      sessionId,
      messages,
      model,
    }),
  });

  if (!response.ok) throw new Error(await response.text());

  const decoder = new TextDecoder();
  let fullText = "";
  let buffer = "";

  if (response.body) {
    for await (const chunk of response.body) {
      buffer +=
        typeof chunk === "string"
          ? chunk
          : decoder.decode(chunk, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";
      for (const line of lines) {
        if (line.startsWith("data: ")) {
          try {
            const data = JSON.parse(line.slice(6));
            if (data.type === "text") fullText += data.content;
          } catch {}
        }
      }
    }
  }
  return fullText;
}

export async function generateCommitMessage(diff: string): Promise<string> {
  const prompt = `Generate a conventional commit message for this diff. Only return the message, nothing else.\n\n${diff}`;
  return fetchCompletion(
    [{ role: "user", content: prompt }],
    "qwen2.5-coder-7b-instruct",
  );
}

export async function explainCode(
  content: string,
  fileName: string,
): Promise<string> {
  const prompt = `You are an expert developer. Please explain the following code from the file "${fileName}". 
  Focus on:
  1. What the code does at a high level.
  2. Key functions or logic flows.
  3. Any potential improvements or "gotchas".
  
  Keep the explanation concise and easy to understand.
  
  Code:
  \`\`\`
  ${content}
  \`\`\``;

  return fetchCompletion(
    [{ role: "user", content: prompt }],
    "qwen2.5-coder-7b-instruct",
  );
}

export async function fixIssue(
  input: string,
  contextType: "error" | "code",
  fileName?: string,
): Promise<string> {
  let prompt = "";

  if (contextType === "error") {
    prompt = `You are an expert debugger. I am encountering the following error or issue. 
    Please analyze it and provide:
    1. A brief explanation of what is likely causing the error.
    2. The corrected code or solution.
    
    Issue/Error:
    ${input}`;
  } else {
    prompt = `You are an expert code reviewer. I have the following code in "${fileName || "a file"}" that needs fixing or improvement.
    Please identify any bugs, performance issues, or bad practices and provide the corrected version.
    
    Code:
    \`\`\`
    ${input}
    \`\`\``;
  }

  return fetchCompletion(
    [{ role: "user", content: prompt }],
    "qwen2.5-coder-7b-instruct",
  );
}
