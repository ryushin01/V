<script lang="ts">
	import { localToWorld } from '#shared/lib/geometry';
	import { ItemGlyph } from '#entities/plan';
	import type { PlacedItem } from '../model/placed-item.svelte';

	interface Props {
		item: PlacedItem;
		scale: number;
		selected: boolean;
		warned: boolean;
		/** 위에 다른 물건이 놓여 이름을 그리면 겹치는 경우 */
		hideLabel?: boolean;
		onpointerdown: (event: PointerEvent, item: PlacedItem) => void;
		onrotatestart: (event: PointerEvent, item: PlacedItem) => void;
		onkeydown: (event: KeyboardEvent, item: PlacedItem) => void;
		onfocus: (item: PlacedItem) => void;
	}

	let {
		item,
		scale,
		selected,
		warned,
		hideLabel = false,
		onpointerdown,
		onrotatestart,
		onkeydown,
		onfocus
	}: Props = $props();

	/** 작은 물건도 포인터로 잡을 수 있게 화면 기준 28px 이상의 영역을 둡니다. */
	const MIN_TARGET_PX = 28;
	const hitWidth = $derived(Math.max(item.entry.width, MIN_TARGET_PX / scale));
	const hitDepth = $derived(Math.max(item.entry.depth, MIN_TARGET_PX / scale));

	const description = $derived(
		`${item.name}, 가로 ${item.entry.width}, 세로 ${item.entry.depth}, X ${Math.round(item.x)}, Y ${Math.round(item.y)}, 회전 ${item.rotation}도${warned ? ', 점검 필요' : ''}`
	);
	const showLabel = $derived(
		!hideLabel &&
			item.entry.width * scale >= 64 &&
			item.entry.depth * scale >= 22 &&
			item.entry.layer !== 'wall'
	);
	/** 책상과 TV장은 위에 놓인 물건을 가리지 않게 이름을 앞쪽 가장자리로 내립니다. */
	const labelPoint = $derived(
		item.entry.kind === 'desk' || item.entry.kind === 'stand'
			? localToWorld(item.rect, 0, item.entry.depth * 0.32)
			: { x: item.x, y: item.y }
	);
	const canRotate = $derived(selected && item.entry.layer !== 'wall');
	const CROP_PX = 10;
	const GAP_PX = 6;
	const crop = $derived(CROP_PX / scale);
	const gap = $derived(GAP_PX / scale);
	const hw = $derived(item.entry.width / 2 + gap);
	const hd = $derived(item.entry.depth / 2 + gap);
	const handleY = $derived(-hd - 22 / scale);
</script>

<g
	class="item"
	class:selected
	class:warned
	transform={`translate(${item.x} ${item.y}) rotate(${item.rotation})`}
	role="button"
	tabindex="0"
	aria-label={description}
	aria-pressed={selected}
	data-item-id={item.id}
	onpointerdown={(event) => onpointerdown(event, item)}
	onkeydown={(event) => onkeydown(event, item)}
	onfocus={() => onfocus(item)}
>
	<rect class="hit" x={-hitWidth / 2} y={-hitDepth / 2} width={hitWidth} height={hitDepth} />
	<ItemGlyph entry={item.entry} />
	<rect class="focus-ring" x={-hw} y={-hd} width={hw * 2} height={hd * 2} rx={4 / scale} />
	{#if selected}
		<path
			class="crop"
			d={`M${-hw} ${-hd + crop}V${-hd}H${-hw + crop}M${hw - crop} ${-hd}H${hw}V${-hd + crop}M${hw} ${hd - crop}V${hd}H${hw - crop}M${-hw + crop} ${hd}H${-hw}V${hd - crop}`}
		/>
	{/if}
	{#if canRotate}
		<line class="stem" x1="0" y1={-hd} x2="0" y2={handleY} />
		<!-- 회전은 도구 막대의 버튼, 숫자 입력, R 키로도 할 수 있습니다. -->
		<circle
			class="handle-hit"
			cx="0"
			cy={handleY}
			r={16 / scale}
			role="presentation"
			onpointerdown={(event) => onrotatestart(event, item)}
		/>
		<circle class="handle" cx="0" cy={handleY} r={5 / scale} />
	{/if}
</g>
{#if showLabel}
	<text class="name" x={labelPoint.x} y={labelPoint.y} font-size={11 / scale}>{item.name}</text>
{/if}

<style>
	.item {
		color: var(--ink);
		cursor: grab;
		outline: none;
	}

	.item.warned {
		--item-fill: color-mix(in srgb, var(--accent) 16%, var(--paper));
	}

	.item.selected {
		color: var(--accent-deep);
	}

	.hit {
		fill: transparent;
	}

	.focus-ring {
		display: none;
		fill: none;
		stroke: var(--ink);
		stroke-width: 2;
		vector-effect: non-scaling-stroke;
	}

	.item:focus-visible .focus-ring {
		display: block;
	}

	.crop,
	.stem {
		fill: none;
		stroke: var(--accent-deep);
		stroke-width: 1.5;
		vector-effect: non-scaling-stroke;
	}

	.handle-hit {
		fill: transparent;
		cursor: crosshair;
	}

	.handle {
		fill: var(--accent);
		stroke: var(--paper);
		stroke-width: 2;
		vector-effect: non-scaling-stroke;
		pointer-events: none;
	}

	.name {
		fill: var(--ink);
		font-family: var(--font-mono);
		text-anchor: middle;
		dominant-baseline: central;
		paint-order: stroke;
		stroke: var(--paper);
		stroke-width: 3px;
		vector-effect: non-scaling-stroke;
		pointer-events: none;
	}
</style>
