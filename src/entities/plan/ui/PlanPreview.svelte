<script lang="ts">
	import { corners, localToWorld, pointInConvex } from '#shared/lib/geometry';
	import { analyzePlan } from '../model/analysis';
	import { LAYER_ORDER, resolveEntry } from '../model/catalog';
	import type { PlanData } from '../model/types';
	import ItemGlyph from './ItemGlyph.svelte';
	import RoomOutline from './RoomOutline.svelte';
	import XrayOverlay from './XrayOverlay.svelte';

	/** label을 비우면 옆 글자로 설명되는 장식 그림으로 처리합니다. */
	let {
		plan,
		label = '',
		xray = false,
		names = false,
		margin = 8
	}: {
		plan: PlanData;
		label?: string;
		xray?: boolean;
		/** 방 둘레에 둘 여백(cm). 그림 저장은 X-ray 치수가 잘리지 않게 넓힙니다. */
		margin?: number;
		/** 물건 이름을 함께 그립니다(그림 저장). 편집 화면과 같은 규칙으로, 작아서 글자가 넘치는 물건은 뺍니다. */
		names?: boolean;
	} = $props();

	let width = $state(0);
	let height = $state(0);
	/** SVG는 viewBox 비율을 유지하므로 가로·세로 중 작은 배율로 그려집니다. */
	const scale = $derived(
		width > 0 && height > 0
			? Math.min(width / (plan.room.width + margin * 2), height / (plan.room.depth + margin * 2))
			: 1
	);
	const connections = $derived(xray ? analyzePlan(plan.room, plan.items).connections : []);

	const items = $derived(
		plan.items
			.map((item) => ({ item, entry: resolveEntry(item) }))
			.sort((a, b) => LAYER_ORDER[a.entry.layer] - LAYER_ORDER[b.entry.layer])
	);
	/**
	 * 편집 화면과 같은 규칙입니다. 책상과 TV장은 위에 놓인 물건을 가리지 않게 이름을 앞쪽 가장자리로 내리고,
	 * 위에 물건이 있는 TV장은 이름을 생략합니다.
	 */
	const labels = $derived.by(() => {
		if (!names) return [];
		const rectOf = (item: PlanData['items'][number], entry: (typeof items)[number]['entry']) => ({
			cx: item.x,
			cy: item.y,
			width: entry.width,
			depth: entry.depth,
			rotation: item.rotation
		});
		const occupied = (stand: (typeof items)[number]) => {
			const polygon = corners(rectOf(stand.item, stand.entry));
			return items.some(
				({ item, entry }) => entry.layer === 'surface' && pointInConvex(item, polygon)
			);
		};
		return items
			.filter(
				(candidate) =>
					candidate.entry.layer !== 'wall' &&
					candidate.entry.width * scale >= 64 &&
					candidate.entry.depth * scale >= 22 &&
					!(candidate.entry.kind === 'stand' && occupied(candidate))
			)
			.map(({ item, entry }) => {
				const rect = rectOf(item, entry);
				const at =
					entry.kind === 'desk' || entry.kind === 'stand'
						? localToWorld(rect, 0, entry.depth * 0.32)
						: { x: item.x, y: item.y };
				return { id: item.id, text: item.label || entry.name, ...at };
			});
	});
</script>

<svg
	class="preview"
	viewBox={`${-margin} ${-margin} ${plan.room.width + margin * 2} ${plan.room.depth + margin * 2}`}
	role={label ? 'img' : undefined}
	aria-label={label || undefined}
	aria-hidden={label ? undefined : 'true'}
	bind:clientWidth={width}
	bind:clientHeight={height}
>
	<RoomOutline room={plan.room} />
	{#each items as { item, entry } (item.id)}
		<g transform={`translate(${item.x} ${item.y}) rotate(${item.rotation})`}>
			<ItemGlyph {entry} />
		</g>
	{/each}
	{#each labels as label (label.id)}
		<text class="name" x={label.x} y={label.y} font-size={11 / scale}>{label.text}</text>
	{/each}
	{#if xray}
		<XrayOverlay room={plan.room} items={plan.items} {connections} {scale} />
	{/if}
</svg>

<style>
	.name {
		fill: var(--ink);
		font-family: var(--font-mono);
		text-anchor: middle;
		dominant-baseline: central;
		paint-order: stroke;
		stroke: var(--paper);
		stroke-width: 3px;
		vector-effect: non-scaling-stroke;
	}

	.preview {
		display: block;
		width: 100%;
		height: 100%;
		color: var(--ink);
		overflow: visible;
	}
</style>
