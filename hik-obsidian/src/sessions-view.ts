import { ItemView, WorkspaceLeaf, Notice } from 'obsidian';
import HikPlugin from './main';
import { fetchSessions, fetchSession, Session } from './api';
import { HikChatView, VIEW_TYPE_HIK_CHAT } from './chat-view';

export const VIEW_TYPE_HIK_SESSIONS = 'hik-sessions-view';

export class HikSessionsView extends ItemView {
	plugin: HikPlugin;

	constructor(leaf: WorkspaceLeaf, plugin: HikPlugin) {
		super(leaf);
		this.plugin = plugin;
	}

	getViewType() {
		return VIEW_TYPE_HIK_SESSIONS;
	}

	getDisplayText() {
		return 'Hik Chat History';
	}

	getIcon() {
		return 'history';
	}

	async onOpen() {
		const container = this.containerEl.children[1] as HTMLElement;
		container.empty();
		container.addClass('hik-sessions-container');

		// Header
		const header = container.createDiv({ cls: 'hik-sessions-header' });
		header.createEl('h3', { text: 'Chat History' });

		const refreshBtn = header.createEl('button', {
			cls: 'hik-refresh-btn',
			text: '🔄',
			attr: { title: 'Refresh' },
		});
		refreshBtn.addEventListener('mousedown', (e) => {
			e.preventDefault();
			this.loadSessions();
		});

		// Sessions list
		this.sessionsListEl = container.createDiv({ cls: 'hik-sessions-list' });

		await this.loadSessions();
	}

	private sessionsListEl!: HTMLElement;

	private async loadSessions() {
		this.sessionsListEl.empty();
		this.sessionsListEl.createDiv({
			cls: 'hik-loading',
			text: 'Loading sessions...',
		});

		try {
			const sessions = await fetchSessions(this.plugin.settings);

			this.sessionsListEl.empty();

			if (sessions.length === 0) {
				this.sessionsListEl.createDiv({
					cls: 'hik-empty-state',
					text: 'No chat history yet. Start a conversation!',
				});
				return;
			}

			for (const session of sessions) {
				this.renderSessionItem(session);
			}
		} catch (error) {
			this.sessionsListEl.empty();
			this.sessionsListEl.createDiv({
				cls: 'hik-error-state',
				text: `Failed to load sessions: ${(error as Error).message}`,
			});
		}
	}

	private renderSessionItem(session: Session) {
		const item = this.sessionsListEl.createDiv({ cls: 'hik-session-item' });

		const title = item.createDiv({
			cls: 'hik-session-title',
			text: session.title || 'Untitled Chat',
		});

		const date = item.createDiv({
			cls: 'hik-session-date',
			text: new Date(session.createdAt).toLocaleDateString(),
		});

		item.addEventListener('mousedown', async (e) => {
			e.preventDefault();
			await this.openSession(session.id);
		});
	}

	private async openSession(sessionId: string) {
		try {
			const sessionData = await fetchSession(
				this.plugin.settings,
				sessionId,
			);

			// Find or create the chat view
			const { workspace } = this.app;
			let leaf = workspace.getLeavesOfType(VIEW_TYPE_HIK_CHAT)[0];

			if (!leaf) {
				leaf = workspace.getRightLeaf(false)!;
				await leaf.setViewState({
					type: VIEW_TYPE_HIK_CHAT,
					active: true,
				});
			}

			const chatView = leaf.view as HikChatView;
			chatView.loadSessionFromHistory(sessionData);

			workspace.revealLeaf(leaf);
		} catch (error) {
			new Notice(`Failed to open session: ${(error as Error).message}`);
		}
	}
}
