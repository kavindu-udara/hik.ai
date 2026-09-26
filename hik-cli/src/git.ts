import { execSync } from "child_process";

export function getStagedDiff(): string {
  try {
    // Get the diff of all staged files
    return execSync("git diff --cached").toString();
  } catch (error) {
    throw new Error("No staged changes found or not in a git repository.");
  }
}

export function getCurrentBranch(): string {
  try {
    return execSync("git branch --show-current").toString().trim();
  } catch {
    return "unknown";
  }
}
