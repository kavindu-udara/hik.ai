import { ItemView, WorkspaceLeaf, Notice, MarkdownView } from 'obsidian';
import HikPlugin from './main';
import { streamChat, ChatMessage } from './api';
import { v4 as uuidv4 } from 'uuid';

export const VIEW_TYPE_HIK_CHAT = 'hik-chat-view';

export class HikChatView extends ItemView {
	plugin: HikPlugin;
	messages: ChatMessage[] = [];
	sessionId: string = uuidv4();
	isStreaming = false;

	constructor(leaf: WorkspaceLeaf, plugin: HikPlugin) {
		super(leaf);
		this.plugin = plugin;
	}

	getViewType() {
		return VIEW_TYPE_HIK_CHAT;
	}
	getDisplayText() {
		return 'Hik AI Chat';
	}
	getIcon() {
		return 'bot';
	}

	private chatHistoryEl!: HTMLElement;
	private inputContainerEl!: HTMLElement;
	private textareaEl!: HTMLTextAreaElement;
	private sendBtnEl!: HTMLButtonElement;
	private addContextBtnEl!: HTMLButtonElement;

	private currentAssistantMsgEl!: HTMLElement;
	private currentAssistantTextEl!: HTMLElement;
	private lastAssistantResponse: string = '';

	async onOpen() {
		const container = this.containerEl.children[1] as HTMLElement;
		container.empty();
		container.addClass('hik-chat-container');

		this.chatHistoryEl = container.createDiv({ cls: 'hik-chat-history' });
		this.inputContainerEl = container.createDiv({
			cls: 'hik-input-container',
		});

		this.addContextBtnEl = this.inputContainerEl.createEl('button', {
			cls: 'hik-icon-btn',
			attr: { title: 'Add current note to context' },
		});
		this.addContextBtnEl.innerHTML = '📎';
		this.addContextBtnEl.addEventListener('click', () =>
			this.addNoteContext(),
		);

		this.textareaEl = this.inputContainerEl.createEl('textarea', {
			cls: 'hik-textarea',
			attr: { placeholder: 'Ask Hik anything...', rows: 3 },
		});

		this.sendBtnEl = this.inputContainerEl.createEl('button', {
			cls: 'hik-send-btn',
			text: 'Send',
		});

		this.sendBtnEl.addEventListener('click', () => this.sendMessage());
		this.textareaEl.addEventListener('keydown', (e) => {
			if (e.key === 'Enter' && !e.shiftKey) {
				e.preventDefault();
				this.sendMessage();
			}
		});
	}

	private async addNoteContext() {
		const activeFile = this.app.workspace.getActiveFile();
		if (!activeFile) {
			new Notice('No active file open.');
			return;
		}

		const content = await this.app.vault.read(activeFile);
		const contextPrompt = `\n\n---\n**Context from current note (${activeFile.name}):**\n\`\`\`markdown\n${content}\n\`\`\`\n`;

		this.textareaEl.value += contextPrompt;
		this.textareaEl.focus();
		new Notice(`Added "${activeFile.name}" to context`);
	}

	private async sendMessage() {
		const content = this.textareaEl.value.trim();
		if (!content || this.isStreaming) return;

		if (!this.plugin.settings.apiKey) {
			new Notice('Please set your Hik API Key in settings.');
			return;
		}

		this.addMessageToUI('user', content);
		this.messages.push({ role: 'user', content });
		this.textareaEl.value = '';

		this.isStreaming = true;
		this.sendBtnEl.disabled = true;
		this.addContextBtnEl.disabled = true;
		this.lastAssistantResponse = '';

		const { msgEl, textEl } = this.addMessageToUI('assistant', '');
		this.currentAssistantMsgEl = msgEl;
		this.currentAssistantTextEl = textEl; // Save direct reference!

		const insertBtn = this.currentAssistantMsgEl.createEl('button', {
			cls: 'hik-insert-btn',
			text: '📝 Insert to Note',
		});
		insertBtn.addEventListener('click', () =>
			this.insertToActiveNote(this.lastAssistantResponse),
		);

		await streamChat(
			this.plugin.settings,
			this.sessionId,
			this.messages,
			(chunk) => {
				this.lastAssistantResponse += chunk;
				this.currentAssistantTextEl.textContent =
					this.lastAssistantResponse;
				this.scrollToBottom();
			},
			(usage) => {
				this.isStreaming = false;
				this.sendBtnEl.disabled = false;
				this.addContextBtnEl.disabled = false;
				this.messages.push({
					role: 'assistant',
					content: this.lastAssistantResponse,
				});
				new Notice(
					`Done! Tokens: ${usage.promptTokens + usage.completionTokens}`,
				);
			},
			(error) => {
				this.isStreaming = false;
				this.sendBtnEl.disabled = false;
				this.addContextBtnEl.disabled = false;
				this.currentAssistantTextEl.textContent += `\n\n[Error: ${error}]`;
				new Notice(`Hik Error: ${error}`, 0);
			},
		);
	}

	private insertToActiveNote(text: string) {
		const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
		if (!activeView || !activeView.editor) {
			new Notice('No markdown file is currently active.');
			return;
		}

		const editor = activeView.editor;
		const cursor = editor.getCursor();
		editor.replaceRange(text + '\n\n', cursor);
		new Notice('Inserted into note!');
	}

	private addMessageToUI(role: 'user' | 'assistant', content: string) {
		const msgEl = this.chatHistoryEl.createDiv({
			cls: `hik-message hik-message-${role}`,
		});
		const textEl = msgEl.createSpan({ text: content });
		this.scrollToBottom();
		return { msgEl, textEl };
	}

	private scrollToBottom() {
		this.chatHistoryEl.scrollTop = this.chatHistoryEl.scrollHeight;
	}
}
