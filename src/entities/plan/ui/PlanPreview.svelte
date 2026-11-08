<script lang="ts">
	import { getCatalogEntry } from '../model/catalog';
	import type { PlanData } from '../model/types';
	import ItemGlyph from './ItemGlyph.svelte';
	import RoomOutline from './RoomOutline.svelte';

	/** label을 비우면 옆 글자로 설명되는 장식 그림으로 처리합니다. */
	let { plan, label = '' }: { plan: PlanData; label?: string } = $props();

	const LAYER_ORDER = { floor: 0, cable: 1, wall: 2, surface: 3 } as const;
	const items = $derived(
		plan.items
			.map((item) => ({ item, entry: getCatalogEntry(item.catalogId) }))
			.sort((a, b) => LAYER_ORDER[a.entry.layer] - LAYER_ORDER[b.entry.layer])
	);
</script>

<svg
	class="preview"
	viewBox={`-8 -8 ${plan.room.width + 16} ${plan.room.depth + 16}`}
	role={label ? 'img' : undefined}
	aria-label={label || undefined}
	aria-hidden={label ? undefined : 'true'}
>
	<RoomOutline room={plan.room} />
	{#each items as { item, entry } (item.id)}
		<g transform={`translate(${item.x} ${item.y}) rotate(${item.rotation})`}>
			<ItemGlyph {entry} />
		</g>
	{/each}
</svg>

<style>
	.preview {
		display: block;
		width: 100%;
		height: 100%;
		color: var(--ink);
	}
</style>
