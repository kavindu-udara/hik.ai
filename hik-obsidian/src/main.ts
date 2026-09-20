import { Plugin, WorkspaceLeaf } from 'obsidian';
import { HikSettings, DEFAULT_SETTINGS, HikSettingTab } from './settings';
import { HikChatView, VIEW_TYPE_HIK_CHAT } from './chat-view';

export default class HikPlugin extends Plugin {
	settings: HikSettings = DEFAULT_SETTINGS;

	async onload() {
		await this.loadSettings();

		// Register the custom view
		this.registerView(
			VIEW_TYPE_HIK_CHAT,
			(leaf) => new HikChatView(leaf, this),
		);

		// Add a ribbon icon to open the chat
		this.addRibbonIcon('bot', 'Open Hik AI', () => {
			this.activateView();
		});

		// Add a command to open the chat
		this.addCommand({
			id: 'open-hik-chat',
			name: 'Open Hik AI Chat',
			callback: () => {
				this.activateView();
			},
		});

		// Add settings tab
		this.addSettingTab(new HikSettingTab(this.app, this));
	}

	async loadSettings() {
		this.settings = Object.assign(
			{},
			DEFAULT_SETTINGS,
			await this.loadData(),
		);
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	async activateView() {
		const { workspace } = this.app;
		let leaf: WorkspaceLeaf | null = null;
		const leaves = workspace.getLeavesOfType(VIEW_TYPE_HIK_CHAT);

		if (leaves.length > 0) {
			leaf = leaves[0] || null;
		} else {
			leaf = workspace.getRightLeaf(false);
			if (leaf) {
				await leaf.setViewState({
					type: VIEW_TYPE_HIK_CHAT,
					active: true,
				});
			}
		}

		if (leaf) {
			workspace.revealLeaf(leaf);
		}
	}
}
