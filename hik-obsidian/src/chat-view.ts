import { ItemView, WorkspaceLeaf, Notice, MarkdownView, TFile } from 'obsidian';
import HikPlugin from './main';
import { streamChat, ChatMessage } from './api';
import { v4 as uuidv4 } from 'uuid';

export const VIEW_TYPE_HIK_CHAT = 'hik-chat-view';

interface ContextFile {
	file: TFile;
	content: string;
}

export class HikChatView extends ItemView {
	plugin: HikPlugin;
	messages: ChatMessage[] = [];
	sessionId: string = uuidv4();
	isStreaming = false;
	contextFiles: ContextFile[] = [];
	contextProvidedFile: TFile | null = null;
	lastActiveFile: TFile | null = null;

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
	private contextChipsEl!: HTMLElement;
	private inputContainerEl!: HTMLElement;
	private textareaEl!: HTMLTextAreaElement;
	private sendBtnEl!: HTMLButtonElement;
	private addContextBtnEl!: HTMLButtonElement;
	private currentAssistantTextEl!: HTMLElement;
	private currentAssistantMsgEl!: HTMLElement;
	private insertBtnsContainerEl!: HTMLElement;
	private lastAssistantResponse: string = '';

	async onOpen() {
		const container = this.containerEl.children[1] as HTMLElement;
		container.empty();
		container.addClass('hik-chat-container');

		this.registerEvent(
			this.app.workspace.on('file-open', (file) => {
				if (file) this.lastActiveFile = file;
			}),
		);
		this.lastActiveFile = this.app.workspace.getActiveFile();

		this.chatHistoryEl = container.createDiv({ cls: 'hik-chat-history' });
		this.contextChipsEl = container.createDiv({ cls: 'hik-context-chips' });
		this.inputContainerEl = container.createDiv({
			cls: 'hik-input-container',
		});

		this.addContextBtnEl = this.inputContainerEl.createEl('button', {
			cls: 'hik-icon-btn',
			attr: { title: 'Add current note to context' },
		});
		this.addContextBtnEl.innerHTML = '📎';
		this.addContextBtnEl.addEventListener('mousedown', (e) => {
			e.preventDefault();
			this.addNoteContext();
		});

		this.textareaEl = this.inputContainerEl.createEl('textarea', {
			cls: 'hik-textarea',
			attr: { placeholder: 'Ask Hik anything...', rows: 3 },
		});

		this.sendBtnEl = this.inputContainerEl.createEl('button', {
			cls: 'hik-send-btn',
			text: 'Send',
		});

		this.sendBtnEl.addEventListener('mousedown', (e) => {
			e.preventDefault();
			this.sendMessage();
		});

		this.textareaEl.addEventListener('keydown', (e) => {
			if (e.key === 'Enter' && !e.shiftKey) {
				e.preventDefault();
				this.sendMessage();
			}
		});

		this.renderContextChips();
	}

	private renderContextChips() {
		this.contextChipsEl.empty();
		if (this.contextFiles.length === 0) {
			this.contextChipsEl.style.display = 'none';
			return;
		}
		this.contextChipsEl.style.display = 'flex';

		for (const ctx of this.contextFiles) {
			const chip = this.contextChipsEl.createDiv({
				cls: 'hik-context-chip',
			});
			chip.createSpan({ cls: 'hik-chip-icon', text: '📄' });
			chip.createSpan({ cls: 'hik-chip-name', text: ctx.file.name });

			const removeBtn = chip.createEl('button', {
				cls: 'hik-chip-remove',
				attr: { title: 'Remove from context' },
			});
			removeBtn.innerHTML = '×';
			removeBtn.addEventListener('mousedown', (e) => {
				e.preventDefault();
				e.stopPropagation();
				this.removeContextFile(ctx.file);
			});
		}
	}

	private addNoteContext() {
		const activeFile = this.app.workspace.getActiveFile();
		if (!activeFile) {
			new Notice('No active file open.');
			return;
		}

		if (this.contextFiles.some((c) => c.file.path === activeFile.path)) {
			new Notice(`"${activeFile.name}" is already in context.`);
			return;
		}

		this.app.vault.read(activeFile).then((content) => {
			this.contextFiles.push({ file: activeFile, content });

			if (!this.contextProvidedFile) {
				this.contextProvidedFile = activeFile;
			}

			this.renderContextChips();
		});
	}

	private removeContextFile(file: TFile) {
		this.contextFiles = this.contextFiles.filter(
			(c) => c.file.path !== file.path,
		);
		if (this.contextProvidedFile?.path === file.path) {
			this.contextProvidedFile = this.contextFiles[0]?.file || null;
		}
		this.renderContextChips();
	}

	private async sendMessage() {
		const userText = this.textareaEl.value.trim();
		if (!userText || this.isStreaming) return;

		if (!this.plugin.settings.apiKey) {
			new Notice('Please set your Hik API Key in settings.');
			return;
		}

		let fullContent = userText;
		if (this.contextFiles.length > 0) {
			const contextBlock = this.contextFiles
				.map(
					(c) =>
						`---\n**Context from ${c.file.name}:**\n\`\`\`markdown\n${c.content}\n\`\`\``,
				)
				.join('\n\n');
			fullContent = `${contextBlock}\n\n---\n\n**User Question:**\n${userText}`;
		}

		this.addMessageToUI('user', userText);
		this.messages.push({ role: 'user', content: fullContent });
		this.textareaEl.value = '';

		this.isStreaming = true;
		this.sendBtnEl.disabled = true;
		this.addContextBtnEl.disabled = true;
		this.lastAssistantResponse = '';

		const { textEl, msgEl } = this.addMessageToUI('assistant', '');
		this.currentAssistantTextEl = textEl;
		this.currentAssistantMsgEl = msgEl;

		this.insertBtnsContainerEl = msgEl.createDiv({
			cls: 'hik-insert-btns',
		});
		this.insertBtnsContainerEl.style.display = 'none';

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

				this.showInsertButtons();
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

	private showInsertButtons() {
		this.insertBtnsContainerEl.empty();
		this.insertBtnsContainerEl.style.display = 'flex';

		// Button for current active note
		const insertCurrentBtn = this.insertBtnsContainerEl.createEl('button', {
			cls: 'hik-insert-btn',
			text: '📝',
			attr: { title: 'Insert to current active note' },
		});
		insertCurrentBtn.addEventListener('mousedown', (e) => {
			e.preventDefault();
			this.insertToNote(this.lastAssistantResponse, this.lastActiveFile);
		});

		// Button for context file (if one exists)
		if (this.contextProvidedFile) {
			const insertContextBtn = this.insertBtnsContainerEl.createEl(
				'button',
				{
					cls: 'hik-insert-btn hik-insert-btn-alt',
					text: '📄',
					attr: {
						title: `Insert to ${this.contextProvidedFile.name}`,
					},
				},
			);
			insertContextBtn.addEventListener('mousedown', (e) => {
				e.preventDefault();
				this.insertToNote(
					this.lastAssistantResponse,
					this.contextProvidedFile,
				);
			});
		}
	}

	private async insertToNote(text: string, targetFile: TFile | null) {
		if (!targetFile) {
			new Notice('No target file available.');
			return;
		}

		try {
			const currentContent = await this.app.vault.read(targetFile);
			await this.app.vault.modify(
				targetFile,
				currentContent + '\n\n' + text,
			);
			new Notice(`Inserted into "${targetFile.name}"!`);

			const leaf = this.app.workspace.getLeaf(false);
			await leaf.openFile(targetFile);
		} catch (err) {
			new Notice(`Failed to insert: ${(err as Error).message}`);
		}
	}

	private addMessageToUI(role: 'user' | 'assistant', content: string) {
		const msgEl = this.chatHistoryEl.createDiv({
			cls: `hik-message hik-message-${role}`,
		});
		const textEl = msgEl.createDiv({ cls: 'hik-message-text' });
		textEl.textContent = content;
		this.scrollToBottom();
		return { msgEl, textEl };
	}

	private scrollToBottom() {
		this.chatHistoryEl.scrollTop = this.chatHistoryEl.scrollHeight;
	}
}
