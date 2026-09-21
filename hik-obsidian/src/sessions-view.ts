import { ItemView, WorkspaceLeaf, Notice, setIcon } from 'obsidian';
import HikPlugin from './main';
import { fetchSessions, fetchSession, Session } from './api';
import { HikChatView, VIEW_TYPE_HIK_CHAT } from './chat-view';

export const VIEW_TYPE_HIK_SESSIONS = 'hik-sessions-view';

export class HikSessionsView extends ItemView {
	plugin: HikPlugin;
	private sessionsListEl!: HTMLElement;

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

		const header = container.createDiv({ cls: 'hik-sessions-header' });

		const backBtn = header.createEl('button', {
			cls: 'hik-nav-btn',
			attr: { title: 'Back to Chat' },
		});
		setIcon(backBtn, 'arrow-left');
		backBtn.addEventListener('mousedown', (e) => {
			e.preventDefault();
			this.goBackToChat();
		});

		const titleEl = header.createDiv({ cls: 'hik-sessions-title' });
		const historyIcon = titleEl.createSpan();
		setIcon(historyIcon, 'history');
		titleEl.createSpan({
			text: 'Chat History',
			cls: 'hik-sessions-title-text',
		});

		const refreshBtn = header.createEl('button', {
			cls: 'hik-nav-btn',
			attr: { title: 'Refresh' },
		});
		setIcon(refreshBtn, 'refresh-cw');
		refreshBtn.addEventListener('mousedown', (e) => {
			e.preventDefault();
			this.loadSessions();
		});

		this.sessionsListEl = container.createDiv({ cls: 'hik-sessions-list' });
		await this.loadSessions();
	}

	private async goBackToChat() {
		const { workspace } = this.app;
		const leaves = workspace.getLeavesOfType(VIEW_TYPE_HIK_CHAT);

		// FIX: Proper null/undefined handling
		if (leaves.length > 0 && leaves[0]) {
			workspace.revealLeaf(leaves[0]);
		} else {
			const leaf = workspace.getRightLeaf(false);
			if (leaf) {
				await leaf.setViewState({
					type: VIEW_TYPE_HIK_CHAT,
					active: true,
				});
				workspace.revealLeaf(leaf);
			}
		}
	}

	private async loadSessions() {
		this.sessionsListEl.empty();
		const loading = this.sessionsListEl.createDiv({ cls: 'hik-loading' });
		const loadingIcon = loading.createSpan();
		setIcon(loadingIcon, 'loader');
		loading.createSpan({ text: ' Loading sessions...' });

		try {
			const sessions = await fetchSessions(this.plugin.settings);
			this.sessionsListEl.empty();

			if (sessions.length === 0) {
				const empty = this.sessionsListEl.createDiv({
					cls: 'hik-empty-state',
				});
				const emptyIcon = empty.createSpan();
				setIcon(emptyIcon, 'message-square');
				empty.createSpan({
					text: ' No chat history yet. Start a conversation!',
				});
				return;
			}

			for (const session of sessions) {
				this.renderSessionItem(session);
			}
		} catch (error) {
			this.sessionsListEl.empty();
			const err = this.sessionsListEl.createDiv({
				cls: 'hik-error-state',
			});
			const errIcon = err.createSpan();
			setIcon(errIcon, 'alert-circle');
			err.createSpan({
				text: ` Failed to load: ${(error as Error).message}`,
			});
		}
	}

	private renderSessionItem(session: Session) {
		const item = this.sessionsListEl.createDiv({ cls: 'hik-session-item' });

		const left = item.createDiv({ cls: 'hik-session-item-left' });
		const itemIcon = left.createSpan({ cls: 'hik-session-icon' });
		setIcon(itemIcon, 'message-square');

		const content = left.createDiv({ cls: 'hik-session-content' });
		content.createDiv({
			cls: 'hik-session-title',
			text: session.title || 'Untitled Chat',
		});
		content.createDiv({
			cls: 'hik-session-date',
			text: new Date(session.createdAt).toLocaleDateString(),
		});

		const right = item.createDiv({ cls: 'hik-session-item-right' });
		const arrowIcon = right.createSpan();
		setIcon(arrowIcon, 'chevron-right');

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

			const { workspace } = this.app;
			const leaves = workspace.getLeavesOfType(VIEW_TYPE_HIK_CHAT);

			// ✅ FIX: Use '!' to assert it's not undefined
			let leaf: WorkspaceLeaf | null =
				leaves.length > 0 ? leaves[0]! : null;

			if (!leaf) {
				leaf = workspace.getRightLeaf(false);
				if (leaf) {
					await leaf.setViewState({
						type: VIEW_TYPE_HIK_CHAT,
						active: true,
					});
				}
			}

			if (leaf) {
				const chatView = leaf.view as HikChatView;
				chatView.loadSessionFromHistory(sessionData);
				workspace.revealLeaf(leaf);
			}
		} catch (error) {
			new Notice(`Failed to open session: ${(error as Error).message}`);
		}
	}
}
