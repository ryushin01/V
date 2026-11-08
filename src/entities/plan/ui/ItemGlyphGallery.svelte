<script lang="ts">
	import ItemGlyph from './ItemGlyph.svelte';
	import type { CatalogEntry } from '../model/types';

	let { entries }: { entries: readonly CatalogEntry[] } = $props();
</script>

<ul>
	{#each entries as entry (entry.id)}
		<li>
			<svg
				viewBox={`${-entry.width / 2 - 6} ${-entry.depth / 2 - 8} ${entry.width + 12} ${entry.depth + 16}`}
				width="120"
				height="80"
				role="img"
				aria-label={entry.name}
			>
				<ItemGlyph {entry} />
			</svg>
			<span>{entry.name}</span>
		</li>
	{/each}
</ul>

<style>
	ul {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
		gap: 1rem;
		padding: 0;
		list-style: none;
	}

	li {
		display: grid;
		gap: 0.25rem;
		font-size: 0.8125rem;
	}
</style>
