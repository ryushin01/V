<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLButtonAttributes } from 'svelte/elements';
	import Icon from './Icon.svelte';

	interface Props extends HTMLButtonAttributes {
		variant?: 'primary' | 'ghost' | 'danger';
		size?: 'md' | 'sm';
		/** 넣으면 같은 모양의 링크로 그립니다. */
		href?: string;
		/** 글자 옆에 원형 화살표를 붙입니다. */
		arrow?: boolean;
		children: Snippet;
	}

	let {
		variant = 'ghost',
		size = 'md',
		href,
		arrow = false,
		children,
		type = 'button',
		class: className,
		...rest
	}: Props = $props();
</script>

{#snippet content()}
	{@render children()}
	{#if arrow}
		<span class="arrow" aria-hidden="true"><Icon name="arrow" size={16} /></span>
	{/if}
{/snippet}

{#if href}
	<!-- 호출하는 쪽에서 resolve()로 만든 주소를 넘깁니다. -->
	<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
	<a {href} class={['btn', variant, size, className, arrow && 'has-arrow']}>{@render content()}</a>
{:else}
	<button {type} class={['btn', variant, size, className, arrow && 'has-arrow']} {...rest}
		>{@render content()}</button
	>
{/if}

<style>
	.btn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		min-height: 3.25rem;
		padding: 0 1.5rem;
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

	.has-arrow {
		gap: 0.875rem;
		padding: 0 0.5rem 0 1.5rem;
	}

	.arrow {
		display: grid;
		place-items: center;
		width: 2.25rem;
		height: 2.25rem;
		border-radius: 50%;
		color: #fff;
		background: #d92c2c;
		transition: transform 0.25s var(--ease);
	}

	.btn:hover .arrow {
		transform: rotate(45deg);
	}

	.sm {
		min-height: 2.25rem;
		padding: 0 0.75rem;
		font-size: 0.8125rem;
	}

	.primary {
		color: var(--paper);
		background: var(--ink);
		box-shadow: 0 18px 40px -18px var(--accent);
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
