<script lang="ts">
	import { resolve } from '$app/paths';
	import { ThemeToggle } from '#features/toggle-theme';
	import { XrayToggle } from '#features/toggle-xray';
	import type { ScrollTracker } from '../model/scroll.svelte';

	let { tracker }: { tracker: ScrollTracker } = $props();

	const LINKS = [
		['#build', '과정'],
		['#checks', '점검'],
		['#plans', '내 배치도']
	] as const;
</script>

<header class="nav">
	<div class="pill">
		<a class="mark" href={resolve('/')} aria-label="V 처음으로"
			>V<span class="tick" aria-hidden="true"></span></a
		>
	</div>
	<div class="readout" aria-hidden="true">
		<span class="progress"><span style:transform={`scaleX(${tracker.progress})`}></span></span>
		<span class="measure">{tracker.section}</span>
	</div>
	<nav class="pill" aria-label="주 메뉴">
		{#each LINKS as [href, label] (href)}
			<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
			<a class="item" {href}>{label}</a>
		{/each}
		<XrayToggle />
		<ThemeToggle />
	</nav>
</header>

<style>
	.nav {
		position: fixed;
		top: 40px;
		right: 0;
		left: 0;
		z-index: 100;
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding-inline: calc(var(--shell) + 1rem) var(--shell);
		pointer-events: none;
	}

	.pill {
		display: flex;
		align-items: center;
		gap: 0.125rem;
		padding: 0.25rem;
		border: 1px solid var(--line);
		border-radius: 999px;
		background: var(--paper);
		pointer-events: auto;
	}

	.mark {
		display: inline-flex;
		align-items: flex-end;
		gap: 0.1875rem;
		min-height: 2.75rem;
		padding: 0.5rem 0.875rem;
		font-family: var(--font-display);
		font-size: 1.375rem;
		font-weight: 700;
		line-height: 1.2;
		color: inherit;
		text-decoration: none;
	}

	.tick {
		width: 2px;
		height: 0.5rem;
		margin-bottom: 0.25rem;
		background: var(--accent);
	}

	.item {
		display: flex;
		align-items: center;
		height: 2.75rem;
		padding: 0 0.8rem;
		border-radius: 999px;
		font-size: 0.875rem;
		font-weight: 500;
		white-space: nowrap;
		color: inherit;
		text-decoration: none;
		transition: background-color 0.3s var(--ease);
	}

	.item:hover {
		background: var(--paper-2);
	}

	.readout {
		position: absolute;
		left: 50%;
		display: flex;
		align-items: center;
		gap: 0.75rem;
		transform: translateX(-50%);
	}

	.progress {
		position: relative;
		display: block;
		width: 72px;
		height: 2px;
		overflow: hidden;
		background: var(--tick);
	}

	.progress > span {
		position: absolute;
		inset: 0;
		background: var(--accent);
		transform-origin: 0;
	}

	.readout .measure {
		color: var(--ink);
	}

	@media (max-width: 1023px) {
		.readout {
			display: none;
		}
	}

	@media (max-width: 767px) {
		.nav {
			top: 0.75rem;
			padding-inline: var(--shell);
		}

		.item {
			display: none;
		}
	}
</style>
