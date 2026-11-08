<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		open: boolean;
		title: string;
		children: Snippet;
		actions?: Snippet;
	}

	const id = $props.id();
	let { open = $bindable(), title, children, actions }: Props = $props();
	let dialog = $state<HTMLDialogElement>();

	$effect(() => {
		if (!dialog) return;
		if (open && !dialog.open) dialog.showModal?.();
		if (!open && dialog.open) dialog.close?.();
	});
</script>

<dialog bind:this={dialog} aria-labelledby={id} onclose={() => (open = false)}>
	<h2 {id}>{title}</h2>
	<div class="body">{@render children()}</div>
	{#if actions}<div class="actions">{@render actions()}</div>{/if}
</dialog>

<style>
	dialog {
		width: min(30rem, calc(100vw - 2rem));
		padding: 1.5rem;
		border: 1px solid var(--line);
		border-radius: var(--radius-media);
		color: var(--ink);
		background: var(--paper);
	}

	dialog::backdrop {
		background: rgb(0 0 0 / 0.45);
	}

	h2 {
		margin: 0 0 0.75rem;
		font-family: var(--font-display);
		font-size: 1.375rem;
		letter-spacing: -0.02em;
	}

	.actions {
		display: flex;
		flex-wrap: wrap;
		justify-content: flex-end;
		gap: 0.5rem;
		margin-top: 1.25rem;
	}
</style>
