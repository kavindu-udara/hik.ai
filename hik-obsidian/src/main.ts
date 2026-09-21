import { Plugin, WorkspaceLeaf } from "obsidian";
import { HikSettings, DEFAULT_SETTINGS, HikSettingTab } from "./settings";
import { HikChatView, VIEW_TYPE_HIK_CHAT } from "./chat-view";
import { HikSessionsView, VIEW_TYPE_HIK_SESSIONS } from "./sessions-view";

export default class HikPlugin extends Plugin {
  settings: HikSettings = DEFAULT_SETTINGS;

  async onload() {
    await this.loadSettings();

    // Register both views
    this.registerView(VIEW_TYPE_HIK_CHAT, (leaf) => new HikChatView(leaf, this));
    this.registerView(VIEW_TYPE_HIK_SESSIONS, (leaf) => new HikSessionsView(leaf, this));

    // Single ribbon icon - the main entry point
    this.addRibbonIcon("bot", "Open Hik AI", () => {
      this.activateView(VIEW_TYPE_HIK_CHAT);
    });

    // Single command
    this.addCommand({
      id: "open-hik-chat",
      name: "Open Hik AI Chat",
      callback: () => {
        this.activateView(VIEW_TYPE_HIK_CHAT);
      },
    });

    this.addSettingTab(new HikSettingTab(this.app, this));
  }

  async activateView(viewType: string) {
    const { workspace } = this.app;
    let leaf: WorkspaceLeaf | null = null;
    const leaves = workspace.getLeavesOfType(viewType);

    if (leaves.length > 0) {
      leaf = leaves[0] || null;
    } else {
      leaf = workspace.getRightLeaf(false);
      if (leaf) {
        await leaf.setViewState({ type: viewType, active: true });
      }
    }

    if (leaf) {
      workspace.revealLeaf(leaf);
    }
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }
}