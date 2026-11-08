<script lang="ts">
	import { analyzePlan } from '../model/analysis';
	import { getCatalogEntry } from '../model/catalog';
	import type { PlanData } from '../model/types';
	import ItemGlyph from './ItemGlyph.svelte';
	import RoomOutline from './RoomOutline.svelte';
	import XrayOverlay from './XrayOverlay.svelte';

	/** label을 비우면 옆 글자로 설명되는 장식 그림으로 처리합니다. */
	let {
		plan,
		label = '',
		xray = false
	}: { plan: PlanData; label?: string; xray?: boolean } = $props();

	let width = $state(0);
	const scale = $derived(width > 0 ? width / (plan.room.width + 16) : 1);
	const connections = $derived(xray ? analyzePlan(plan.room, plan.items).connections : []);

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
	bind:clientWidth={width}
>
	<RoomOutline room={plan.room} />
	{#each items as { item, entry } (item.id)}
		<g transform={`translate(${item.x} ${item.y}) rotate(${item.rotation})`}>
			<ItemGlyph {entry} />
		</g>
	{/each}
	{#if xray}
		<XrayOverlay room={plan.room} items={plan.items} {connections} {scale} />
	{/if}
</svg>

<style>
	.preview {
		display: block;
		width: 100%;
		height: 100%;
		color: var(--ink);
		overflow: visible;
	}
</style>
