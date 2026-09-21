import {
	ItemView,
	WorkspaceLeaf,
	Notice,
	MarkdownView,
	TFile,
	setIcon,
	MarkdownRenderer,
} from 'obsidian';
import HikPlugin from './main';
import { streamChat, ChatMessage } from './api';
import { v4 as uuidv4 } from 'uuid';
import { VIEW_TYPE_HIK_SESSIONS } from './sessions-view';

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
	private currentAssistantContentEl!: HTMLElement;
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

		// Top Navigation Bar
		this.renderTopNav(container);

		// Chat History Area
		this.chatHistoryEl = container.createDiv({ cls: 'hik-chat-history' });

		// Context Chips Area
		this.contextChipsEl = container.createDiv({ cls: 'hik-context-chips' });

		// Input Area
		this.inputContainerEl = container.createDiv({
			cls: 'hik-input-container',
		});

		this.addContextBtnEl = this.inputContainerEl.createEl('button', {
			cls: 'hik-icon-btn',
			attr: { title: 'Attach current note' },
		});
		setIcon(this.addContextBtnEl, 'paperclip');
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
			attr: { title: 'Send message' },
		});
		setIcon(this.sendBtnEl, 'arrow-up');
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

	private renderTopNav(container: HTMLElement) {
		const navBar = container.createDiv({ cls: 'hik-top-nav' });

		// Left side: Logo/Title
		const titleEl = navBar.createDiv({ cls: 'hik-nav-title' });
		const logoIcon = titleEl.createSpan({ cls: 'hik-nav-logo' });
		setIcon(logoIcon, 'bot');
		titleEl.createSpan({ text: 'Hik', cls: 'hik-nav-title-text' });

		// Right side: Action buttons
		const actionsEl = navBar.createDiv({ cls: 'hik-nav-actions' });

		// New Chat button
		const newChatBtn = actionsEl.createEl('button', {
			cls: 'hik-nav-btn',
			attr: { title: 'New Chat' },
		});
		setIcon(newChatBtn, 'plus');
		newChatBtn.addEventListener('mousedown', (e) => {
			e.preventDefault();
			this.startNewChat();
		});

		// History button
		const historyBtn = actionsEl.createEl('button', {
			cls: 'hik-nav-btn',
			attr: { title: 'Chat History' },
		});
		setIcon(historyBtn, 'history');
		historyBtn.addEventListener('mousedown', (e) => {
			e.preventDefault();
			this.openHistory();
		});
	}

	private startNewChat() {
		if (this.isStreaming) {
			new Notice('Cannot start new chat while streaming.');
			return;
		}

		this.sessionId = uuidv4();
		this.messages = [];
		this.contextFiles = [];
		this.contextProvidedFile = null;
		this.lastAssistantResponse = '';

		this.chatHistoryEl.empty();
		this.renderContextChips();

		new Notice('Started new chat');
	}

	private async openHistory() {
		const { workspace } = this.app;
		const leaves = workspace.getLeavesOfType(VIEW_TYPE_HIK_SESSIONS);

		let leaf: WorkspaceLeaf | null = leaves.length > 0 ? leaves[0]! : null;

		if (!leaf) {
			leaf = workspace.getRightLeaf(false);
			if (leaf) {
				await leaf.setViewState({
					type: VIEW_TYPE_HIK_SESSIONS,
					active: true,
				});
			}
		}

		if (leaf) {
			workspace.revealLeaf(leaf);
		}
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

		const { contentEl, msgEl } = this.addMessageToUI('assistant', '');
		this.currentAssistantContentEl = contentEl;
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

				// 🌟 Update plain text during stream for maximum performance
				const plainTextEl =
					this.currentAssistantContentEl.querySelector(
						'.hik-markdown-content',
					);
				if (plainTextEl) {
					plainTextEl.textContent = this.lastAssistantResponse;
				}
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

				// 🌟 NEW: Render the final Markdown once streaming is complete!
				this.renderAssistantMarkdown();

				this.showInsertButtons();
			},
			(error) => {
				this.isStreaming = false;
				this.sendBtnEl.disabled = false;
				this.addContextBtnEl.disabled = false;
				const plainTextEl =
					this.currentAssistantContentEl.querySelector(
						'.hik-markdown-content',
					);
				if (plainTextEl) {
					plainTextEl.textContent += `\n\n[Error: ${error}]`;
				}
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

		// Create a container for the content
		const contentEl = msgEl.createDiv({ cls: 'hik-message-content' });

		if (role === 'user') {
			// User messages stay as clean plain text
			contentEl.createEl('pre', { text: content, cls: 'hik-plain-text' });
		} else {
			// Assistant messages start as plain text (for streaming performance)
			contentEl.createEl('div', {
				cls: 'hik-markdown-content',
				text: content,
			});
		}

		this.scrollToBottom();
		return { msgEl, contentEl };
	}

	private scrollToBottom() {
		this.chatHistoryEl.scrollTop = this.chatHistoryEl.scrollHeight;
	}

	public async loadSessionFromHistory(sessionData: any) {
		this.sessionId = sessionData.session.id;
		this.messages = sessionData.messages;
		this.contextFiles = [];
		this.contextProvidedFile = null;
		this.lastAssistantResponse = '';

		this.chatHistoryEl.empty();
		this.renderContextChips();

		// Render all messages from history
		for (const msg of this.messages) {
			const { contentEl } = this.addMessageToUI(
				msg.role as 'user' | 'assistant',
				msg.content,
			);

			// If it's an assistant message, render it as markdown immediately
			if (msg.role === 'assistant') {
				const markdownEl = contentEl.createDiv({
					cls: 'hik-markdown-rendered',
				});
				await MarkdownRenderer.renderMarkdown(
					msg.content,
					markdownEl,
					'',
					this,
				);
			}
		}

		new Notice(`Loaded session: ${sessionData.session.title}`);
	}

	private async renderAssistantMarkdown() {
		const contentEl = this.currentAssistantContentEl;
		if (!contentEl) return;

		// Clear the plain text container
		contentEl.empty();

		// Create a new div for the rendered markdown
		const markdownEl = contentEl.createDiv({
			cls: 'hik-markdown-rendered',
		});

		// Use Obsidian's built-in MarkdownRenderer
		// 'this' works because ItemView extends Component, which MarkdownRenderer requires
		await MarkdownRenderer.renderMarkdown(
			this.lastAssistantResponse,
			markdownEl,
			'', // source path (empty is fine for generated text)
			this,
		);
	}
}
