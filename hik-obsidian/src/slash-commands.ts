import { setIcon } from 'obsidian';

export interface SlashCommand {
	id: string;
	name: string;
	description: string;
	icon: string;
}

export const SLASH_COMMANDS: SlashCommand[] = [
	{
		id: 'summarize',
		name: '/summarize',
		description: 'Summarize the current note',
		icon: 'file-text',
	},
	{
		id: 'explain',
		name: '/explain',
		description: 'Explain the selected text or current note',
		icon: 'help-circle',
	},
	{
		id: 'fix',
		name: '/fix',
		description: 'Fix or improve the selected text',
		icon: 'wrench',
	},
	{
		id: 'translate',
		name: '/translate',
		description: 'Translate the selected text',
		icon: 'languages',
	},
];

export class SlashCommandMenu {
	private menuEl: HTMLElement;
	private items: HTMLElement[] = [];
	private selectedIndex = 0;
	private filteredCommands: SlashCommand[] = [];
	private onSelect: (command: SlashCommand) => void;

	constructor(
		container: HTMLElement,
		onSelect: (command: SlashCommand) => void,
	) {
		this.onSelect = onSelect;

		this.menuEl = container.createDiv({ cls: 'hik-slash-menu' });
		this.menuEl.style.display = 'none';
	}

	show(filter: string) {
		this.filteredCommands = SLASH_COMMANDS.filter((cmd) =>
			cmd.name.toLowerCase().includes(filter.toLowerCase()),
		);

		if (this.filteredCommands.length === 0) {
			this.hide();
			return;
		}

		this.menuEl.empty();
		this.items = [];
		this.selectedIndex = 0;

		for (const cmd of this.filteredCommands) {
			const item = this.menuEl.createDiv({ cls: 'hik-slash-item' });

			const iconSpan = item.createSpan({ cls: 'hik-slash-icon' });
			setIcon(iconSpan, cmd.icon);

			const content = item.createDiv({ cls: 'hik-slash-content' });
			content.createDiv({ cls: 'hik-slash-name', text: cmd.name });
			content.createDiv({ cls: 'hik-slash-desc', text: cmd.description });

			item.addEventListener('mousedown', (e) => {
				e.preventDefault();
				this.onSelect(cmd);
			});

			this.items.push(item);
		}

		this.updateSelection();
		this.menuEl.style.display = 'block';
	}

	hide() {
		this.menuEl.style.display = 'none';
	}

	selectNext() {
		if (this.items.length === 0) return;
		this.selectedIndex = (this.selectedIndex + 1) % this.items.length;
		this.updateSelection();
	}

	selectPrev() {
		if (this.items.length === 0) return;
		this.selectedIndex =
			(this.selectedIndex - 1 + this.items.length) % this.items.length;
		this.updateSelection();
	}

	selectCurrent() {
		const command = this.filteredCommands[this.selectedIndex];
		if (command) {
			this.onSelect(command);
		}
	}

	private updateSelection() {
		this.items.forEach((item, idx) => {
			if (idx === this.selectedIndex) {
				item.addClass('hik-slash-item-selected');
			} else {
				item.removeClass('hik-slash-item-selected');
			}
		});
	}
}
