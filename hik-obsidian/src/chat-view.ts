import { ItemView, WorkspaceLeaf, Notice } from 'obsidian';
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
		return 'bot'; // Obsidian built-in icon
	}

	async onOpen() {
		const container = this.containerEl.children[1] as HTMLElement;

		container.empty();
		container.addClass('hik-chat-container');

		// Chat History Area
		this.chatHistoryEl = container.createDiv({ cls: 'hik-chat-history' });

		// Input Area
		this.inputContainerEl = container.createDiv({
			cls: 'hik-input-container',
		});
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

	private chatHistoryEl!: HTMLElement;
	private inputContainerEl!: HTMLElement;
	private textareaEl!: HTMLTextAreaElement;
	private sendBtnEl!: HTMLButtonElement;
	private currentAssistantMsgEl!: HTMLElement;

	private async sendMessage() {
		const content = this.textareaEl.value.trim();
		if (!content || this.isStreaming) return;

		if (!this.plugin.settings.apiKey) {
			new Notice('Please set your Hik API Key in settings.');
			return;
		}

		// Add user message to UI and state
		this.addMessageToUI('user', content);
		this.messages.push({ role: 'user', content });
		this.textareaEl.value = '';

		// Prepare assistant message container
		this.isStreaming = true;
		this.sendBtnEl.disabled = true;
		this.currentAssistantMsgEl = this.addMessageToUI('assistant', '');
		let fullResponse = '';

		await streamChat(
			this.plugin.settings,
			this.sessionId,
			this.messages,
			(chunk) => {
				fullResponse += chunk;
				this.currentAssistantMsgEl.textContent = fullResponse;
				this.scrollToBottom();
			},
			(usage) => {
				this.isStreaming = false;
				this.sendBtnEl.disabled = false;
				this.messages.push({
					role: 'assistant',
					content: fullResponse,
				});
				new Notice(
					`Done! Tokens: ${usage.promptTokens + usage.completionTokens}`,
				);
			},
			(error) => {
				this.isStreaming = false;
				this.sendBtnEl.disabled = false;
				this.currentAssistantMsgEl.textContent += `\n\n[Error: ${error}]`;
				new Notice(`Hik Error: ${error}`, 0);
			},
		);
	}

	private addMessageToUI(role: 'user' | 'assistant', content: string) {
		const msgEl = this.chatHistoryEl.createDiv({
			cls: `hik-message hik-message-${role}`,
		});
		msgEl.textContent = content;
		this.scrollToBottom();
		return msgEl;
	}

	private scrollToBottom() {
		this.chatHistoryEl.scrollTop = this.chatHistoryEl.scrollHeight;
	}
}
