import * as fs from "fs";
import * as path from "path";

export function readFileContent(filePath: string): string {
  const absolutePath = path.resolve(filePath);

  if (!fs.existsSync(absolutePath)) {
    throw new Error(`File not found: ${filePath}`);
  }

  const stats = fs.statSync(absolutePath);
  if (stats.isDirectory()) {
    throw new Error(`Path is a directory, not a file: ${filePath}`);
  }

  // Limit file size to prevent sending massive files to the LLM (e.g., 100KB limit)
  if (stats.size > 100 * 1024) {
    throw new Error("File is too large to explain (max 100KB).");
  }

  return fs.readFileSync(absolutePath, "utf-8");
}
