import { writable } from 'svelte/store';

export let notifications = writable([]);

export default {
	show(text, { timeout = 1000, dismissable = true } = {}) {
		let id = Math.random().toString(36).slice(2);
		notifications.update((i) => [
			...i,
			{
				timer: setTimeout(() => {
					this.hide(id);
				}, timeout),
				dismissable,
				id,
				text
			}
		]);
		return {
			dismiss() {
				this.hide(id);
			}
		};
	},
	hide(id) {
		notifications.update((i) => i.filter((j) => j.id !== id));
	}
};