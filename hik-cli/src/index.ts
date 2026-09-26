#!/usr/bin/env node

import { Command } from 'commander';
import { saveConfig } from './auth.js';
import { streamChat } from './chat.js';
import pkg from '../package.json' with { type: 'json' };

const program = new Command();

program
  .name('hik')
  .description('Your unified AI workspace CLI')
  .version(pkg.version);

program
  .command('login')
  .argument('<api-key>', 'Your Hik API key (hik_...)')
  .description('Save your API key locally')
  .action((apiKey) => {
    if (!apiKey.startsWith('hik_')) {
      console.error('[ERROR] Invalid API key format. It should start with hik_');
      process.exit(1);
    }
    saveConfig({ apiKey });
    console.log('[SUCCESS] API key saved successfully!');
  });

program
  .command('chat')
  .argument('<message>', 'The message to send to Hik')
  .option('-m, --model <model>', 'Specify the LLM model', 'qwen2.5-coder-7b-instruct')
  .description('Start a chat with Hik')
  .action(async (message, options) => {
    try {
      console.log('[INFO] Hik: ');
      await streamChat(message, options.model);
    } catch (error) {
      console.error('[ERROR]:', (error as Error).message);
      process.exit(1);
    }
  });

program
  .command('config')
  .option('--url <url>', 'Set the backend API URL')
  .description('Manage CLI configuration')
  .action((options) => {
    if (options.url) {
      saveConfig({ apiUrl: options.url });
      console.log(`[SUCCESS] Backend URL set to: ${options.url}`);
    } else {
      console.error('[ERROR] No URL provided.');
      console.log('Usage: hik config --url <http://localhost:3000>');
    }
  });

program.parse();