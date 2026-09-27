import * as readline from 'readline';
import { requireApiKey, getConfig } from './auth.js';
import chalk from 'chalk';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export async function startInteractiveChat() {
  const apiKey = requireApiKey();
  const config = getConfig();
  const apiUrl = config.apiUrl || 'http://localhost:3000';
  
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: chalk.green('hik> '),
  });

  const history: Message[] = [];
  const sessionId = crypto.randomUUID();

  console.log(chalk.blue('\n🤖 Hik Interactive Mode'));
  console.log(chalk.gray('Type your message and press Enter. Type /exit to quit.\n'));

  rl.prompt();

  rl.on('line', async (line) => {
    const input = line.trim();

    if (input.toLowerCase() === '/exit' || input.toLowerCase() === '/quit') {
      console.log(chalk.yellow('Goodbye! 👋'));
      rl.close();
      return;
    }

    if (!input) {
      rl.prompt();
      return;
    }

    // Add user message to history
    history.push({ role: 'user', content: input });

    try {
      // Show a small indicator that we are thinking
      process.stdout.write(chalk.dim('Hik is typing...\r'));

      const response = await fetch(`${apiUrl}/api/v1/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
        },
        body: JSON.stringify({
          sessionId,
          messages: history,
          model: 'qwen2.5-coder-7b-instruct',
        }),
      });

      if (!response.ok) throw new Error(await response.text());

      // Clear the "typing" indicator
      process.stdout.write(' '.repeat(20) + '\r');

      // Stream the response
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let assistantResponse = '';
      
      if (reader) {
        let buffer = '';
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6));
                if (data.type === 'text') {
                  process.stdout.write(data.content);
                  assistantResponse += data.content;
                }
              } catch {}
            }
          }
        }
      }

      console.log('\n'); // New line after response
      
      // Add assistant response to history
      history.push({ role: 'assistant', content: assistantResponse });

    } catch (error) {
      console.error(chalk.red('\n[ERROR] Error:'), (error as Error).message);
    } finally {
      rl.prompt();
    }
  });

  rl.on('close', () => {
    console.log('\n');
    process.exit(0);
  });
}