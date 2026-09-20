import { App, PluginSettingTab, Setting } from 'obsidian';
import HikPlugin from './main';

export interface HikSettings {
	apiKey: string;
	baseUrl: string;
	model: string;
}

export const DEFAULT_SETTINGS: HikSettings = {
	apiKey: '',
	baseUrl: 'http://localhost:3000',
	model: 'qwen2.5-coder-7b-instruct',
};

export class HikSettingTab extends PluginSettingTab {
	plugin: HikPlugin;

	constructor(app: App, plugin: HikPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		new Setting(containerEl)
			.setName('Hik API Key')
			.setDesc('Your hik_xxx API key generated from the Hik dashboard.')
			.addText((text) =>
				text
					.setPlaceholder('hik_...')
					.setValue(this.plugin.settings.apiKey)
					.onChange(async (value) => {
						this.plugin.settings.apiKey = value;
						await this.plugin.saveSettings();
					}),
			);

		new Setting(containerEl)
			.setName('Backend URL')
			.setDesc('The URL of your Hik backend server.')
			.addText((text) =>
				text
					.setPlaceholder('http://localhost:3000')
					.setValue(this.plugin.settings.baseUrl)
					.onChange(async (value) => {
						this.plugin.settings.baseUrl = value;
						await this.plugin.saveSettings();
					}),
			);

		new Setting(containerEl)
			.setName('Default Model')
			.setDesc('The model to use for chat requests.')
			.addText((text) =>
				text
					.setPlaceholder('qwen2.5-coder-7b-instruct')
					.setValue(this.plugin.settings.model)
					.onChange(async (value) => {
						this.plugin.settings.model = value;
						await this.plugin.saveSettings();
					}),
			);
	}
}
