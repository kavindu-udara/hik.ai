import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

const CONFIG_DIR = path.join(os.homedir(), '.hik');
const CONFIG_FILE = path.join(CONFIG_DIR, 'config.json');

interface Config {
  apiKey?: string;
  apiUrl?: string;
}

export function getConfig(): Config {
  if (!fs.existsSync(CONFIG_FILE)) return {};
  try {
    return JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf-8'));
  } catch {
    return {};
  }
}

export function saveConfig(config: Partial<Config>) {
  if (!fs.existsSync(CONFIG_DIR)) {
    fs.mkdirSync(CONFIG_DIR, { recursive: true });
  }
  const current = getConfig();
  fs.writeFileSync(CONFIG_FILE, JSON.stringify({ ...current, ...config }, null, 2));
}

export function requireApiKey(): string {
  const config = getConfig();
  if (!config.apiKey) {
    console.error('[Error] No API key found. Please run: hik login <your-api-key>');
    process.exit(1);
  }
  return config.apiKey;
}