<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLButtonAttributes } from 'svelte/elements';

	interface Props extends HTMLButtonAttributes {
		variant?: 'primary' | 'ghost' | 'danger';
		size?: 'md' | 'sm';
		/** 넣으면 같은 모양의 링크로 그립니다. */
		href?: string;
		children: Snippet;
	}

	let {
		variant = 'ghost',
		size = 'md',
		href,
		children,
		type = 'button',
		class: className,
		...rest
	}: Props = $props();
</script>

{#if href}
	<!-- 호출하는 쪽에서 resolve()로 만든 주소를 넘깁니다. -->
	<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
	<a {href} class={['btn', variant, size, className]}>{@render children()}</a>
{:else}
	<button {type} class={['btn', variant, size, className]} {...rest}>{@render children()}</button>
{/if}

<style>
	.btn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		min-height: 2.75rem;
		padding: 0 1.25rem;
		border: 1px solid transparent;
		border-radius: 999px;
		font: inherit;
		font-size: 0.9375rem;
		font-weight: 500;
		white-space: nowrap;
		text-decoration: none;
		color: inherit;
		background: transparent;
		cursor: pointer;
		transition:
			background-color 0.2s var(--ease),
			color 0.2s var(--ease),
			border-color 0.2s var(--ease);
	}

	.sm {
		min-height: 2.25rem;
		padding: 0 0.75rem;
		font-size: 0.8125rem;
	}

	.primary {
		color: var(--paper);
		background: var(--ink);
	}

	.primary:hover {
		background: var(--accent-deep);
	}

	.ghost {
		border-color: var(--control);
		background: var(--paper);
	}

	.ghost:hover {
		background: var(--paper-2);
	}

	.danger {
		border-color: var(--accent-deep);
		color: var(--accent-deep);
		background: var(--paper);
	}

	.danger:hover {
		color: var(--paper);
		background: var(--accent-deep);
	}

	.btn:disabled {
		opacity: 0.45;
		cursor: not-allowed;
	}
</style>
