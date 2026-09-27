#!/usr/bin/env node
import { Command } from 'commander';
import { execSync } from "node:child_process";
import chalk from "chalk";
import { saveConfig } from "./auth.js";
import {
  explainCode,
  fixIssue,
  generateCommitMessage,
  streamChat,
} from "./chat.js";
import pkg from "../package.json" with { type: "json" };
import { getStagedDiff } from "./git.js";
import { readFileContent } from "./fs.js";
import * as path from "path";
import { startInteractiveChat } from "./interactive.js";

const program = new Command();

program
  .name("hik")
  .description("Your unified AI workspace CLI")
  .version(pkg.version);

program
  .command("login")
  .argument("<api-key>", "Your Hik API key (hik_...)")
  .description("Save your API key locally")
  .action((apiKey) => {
    if (!apiKey.startsWith("hik_")) {
      console.error(
        "[ERROR] Invalid API key format. It should start with hik_",
      );
      process.exit(1);
    }
    saveConfig({ apiKey });
    console.log("[SUCCESS] API key saved successfully!");
  });

program
  .command("chat")
  .argument("<message>", "The message to send to Hik")
  .option(
    "-m, --model <model>",
    "Specify the LLM model",
    "qwen2.5-coder-7b-instruct",
  )
  .description("Start a chat with Hik")
  .action(async (message, options) => {
    try {
      console.log("[INFO] Hik: ");
      await streamChat(message, options.model);
    } catch (error) {
      console.error("[ERROR]:", (error as Error).message);
      process.exit(1);
    }
  });

program
  .command("config")
  .option("--url <url>", "Set the backend API URL")
  .description("Manage CLI configuration")
  .action((options) => {
    if (options.url) {
      saveConfig({ apiUrl: options.url });
      console.log(`[SUCCESS] Backend URL set to: ${options.url}`);
    } else {
      console.error("[ERROR] No URL provided.");
      console.log("Usage: hik config --url <http://localhost:3000>");
    }
  });

program
  .command("commit")
  .description("Generate a commit message from staged changes")
  .option("-y, --yes", "Automatically commit with the generated message")
  .action(async (options) => {
    try {
      console.log(chalk.blue("[INFO] Analyzing staged changes..."));
      const diff = getStagedDiff();

      if (!diff.trim()) {
        console.log(chalk.yellow("[WARNING] No staged changes found."));
        return;
      }

      console.log(chalk.blue("✨ Generating commit message..."));
      const message = await generateCommitMessage(diff);

      console.log(chalk.green("\nProposed Commit Message:"));
      console.log(chalk.bold(`"${message}"\n`));

      if (options.yes) {
        execSync(`git commit -m "${message}"`, { stdio: "inherit" });
        console.log(chalk.green("[SUCCESS] Committed successfully!"));
      } else {
        console.log(
          chalk.gray(
            "[INFO] To commit automatically next time, use: hik commit -y",
          ),
        );
        console.log(chalk.gray(`[INFO] Or run: git commit -m "${message}"`));
      }
    } catch (error) {
      console.error(chalk.red("[ERROR] Error:"), (error as Error).message);
      process.exit(1);
    }
  });

program
  .command("explain")
  .argument("<file>", "Path to the file you want to explain")
  .description("Explain the contents of a code file")
  .action(async (filePath) => {
    try {
      console.log(chalk.blue(`[INFO] Reading ${filePath}...`));
      const content = readFileContent(filePath);

      console.log(chalk.blue("✨ Analyzing code..."));
      const explanation = await explainCode(content, path.basename(filePath));

      console.log(chalk.green("\n💡 Explanation:"));
      console.log(explanation);
      console.log("\n");
    } catch (error) {
      console.error(chalk.red("[ERROR] Error:"), (error as Error).message);
      process.exit(1);
    }
  });

program
  .command("fix")
  .argument("[file]", "Path to the file containing the code or error log")
  .description(
    "Get a fix for an error message or buggy code. Can also read from stdin.",
  )
  .action(async (filePath) => {
    try {
      let input = "";
      let contextType: "error" | "code" = "error";
      let sourceName = "stdin";

      // Check if data is being piped (e.g., cat error.log | hik fix)
      if (process.stdin.isTTY) {
        // If no file argument and not piped, ask for manual paste (MVP: just throw error for now)
        if (!filePath) {
          console.error(
            chalk.red(
              "[ERROR] Please provide a file path or pipe input. Example:",
            ),
          );
          console.error(chalk.gray("   hik fix error.log"));
          console.error(chalk.gray("   cat error.log | hik fix"));
          console.error(chalk.gray("   hik fix src/broken-code.ts"));
          process.exit(1);
        }

        // It's a file
        input = readFileContent(filePath);
        sourceName = filePath;

        // Simple heuristic: if it looks like code, treat as code
        if (filePath.match(/\.(ts|js|py|go|rs|java|cpp|c)$/)) {
          contextType = "code";
        }
      } else {
        // Reading from stdin
        const chunks: Buffer[] = [];
        for await (const chunk of process.stdin) {
          chunks.push(chunk);
        }
        input = Buffer.concat(chunks).toString();
        contextType = "error"; // Default piped input to error/log analysis
      }

      if (!input.trim()) {
        console.error(chalk.red("[ERROR] No input provided."));
        process.exit(1);
      }

      console.log(chalk.blue(`🔍 Analyzing ${sourceName}...`));
      const solution = await fixIssue(input, contextType, sourceName);

      console.log(chalk.green("\n🛠️ Suggested Fix:"));
      console.log(solution);
      console.log("\n");
    } catch (error) {
      console.error(chalk.red("[ERROR] Error:"), (error as Error).message);
      process.exit(1);
    }
  });

program
  .command("interactive")
  .alias("i")
  .description("Start an interactive chat session")
  .action(() => {
    startInteractiveChat();
  });

program.parse();
