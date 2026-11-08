<script lang="ts">
	import { computeRulerTicks } from '#shared/lib/ruler';

	interface Props {
		axis: 'x' | 'y';
		/** 눈금을 그릴 화면 길이(px) */
		length: number;
		/** 1cm당 화면 픽셀 */
		scale: number;
		/** 0cm가 놓인 화면 위치(px) */
		offset: number;
		/** 포인터의 cm 위치 */
		pointer?: number | null;
		/** 선택한 물건의 cm 범위 */
		range?: { start: number; end: number } | null;
		/** 끌어서 화면을 옮길 때 호출합니다. 없으면 표시 전용입니다. */
		onpan?: (delta: number) => void;
		/** 배경과 테두리 없이 페이지 위에 바로 그립니다. */
		bare?: boolean;
		/** 배율과 상관없이 쓸 눈금 간격 */
		fixedStep?: { majorCm: number; minorCm: number };
	}

	let {
		axis,
		length,
		scale,
		offset,
		pointer = null,
		range = null,
		onpan,
		bare = false,
		fixedStep
	}: Props = $props();

	const MINOR_TICK = 5;
	const MID_TICK = 9;
	const MAJOR_TICK = 14;

	const ticks = $derived(computeRulerTicks(length, scale, offset, fixedStep));
	const tickPath = (positions: number[], size: number) =>
		positions
			.map((position) => {
				const p = Math.round(position) + 0.5;
				return axis === 'x' ? `M${p} 0V${size}` : `M0 ${p}H${size}`;
			})
			.join('');
	const minorPath = $derived(tickPath(ticks.minor, MINOR_TICK));
	const midPath = $derived(tickPath(ticks.mid, MID_TICK));
	const majorPath = $derived(
		tickPath(
			ticks.major.map((tick) => tick.position),
			MAJOR_TICK
		)
	);

	const toScreen = (cm: number) => offset + cm * scale;
	const pointerPosition = $derived(pointer === null ? null : toScreen(pointer));
	const band = $derived(
		range ? { start: toScreen(range.start), size: (range.end - range.start) * scale } : null
	);

	let last: number | null = null;
	const coordinate = (event: PointerEvent) => (axis === 'x' ? event.clientX : event.clientY);

	function handlePointerDown(event: PointerEvent) {
		if (!onpan) return;
		last = coordinate(event);
		(event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
	}

	function handlePointerMove(event: PointerEvent) {
		if (last === null) return;
		const current = coordinate(event);
		onpan?.(current - last);
		last = current;
	}

	function endPan() {
		last = null;
	}
</script>

<!-- 눈금은 시각 표현입니다. 같은 정보는 숫자 입력과 aria-live 안내, 이동 버튼으로 제공합니다. -->
<div
	class="ruler"
	class:x={axis === 'x'}
	class:y={axis === 'y'}
	class:pannable={!!onpan}
	class:bare
	aria-hidden="true"
	data-testid={`ruler-${axis}`}
	onpointerdown={handlePointerDown}
	onpointermove={handlePointerMove}
	onpointerup={endPan}
	onpointercancel={endPan}
>
	<svg width="100%" height="100%">
		{#if band}
			{#if axis === 'x'}
				<rect class="band" x={band.start} y="0" width={band.size} height="100%" />
			{:else}
				<rect class="band" x="0" y={band.start} width="100%" height={band.size} />
			{/if}
		{/if}
		<path class="tick" d={minorPath} />
		<path class="tick" d={midPath} />
		<path class="tick major" d={majorPath} />
		{#each ticks.major as tick (tick.value)}
			{#if axis === 'x'}
				<text class="label" x={tick.position + (bare ? 0 : 4)} y={bare ? 28 : 24}>{tick.value}</text
				>
			{:else}
				<text class="label" x="18" y={Math.max(tick.position + 4, 11)}>{tick.value}</text>
			{/if}
		{/each}
	</svg>
	{#if pointerPosition !== null && pointer !== null}
		<span
			class="thumb"
			style:transform={axis === 'x'
				? `translate3d(${pointerPosition - 4}px, 0, 0)`
				: `translate3d(0, ${pointerPosition - 4}px, 0)`}
		></span>
	{/if}
</div>

<style>
	.ruler {
		position: relative;
		overflow: hidden;
		color: var(--steel);
		background: var(--paper);
		user-select: none;
	}

	.ruler.x {
		height: var(--ruler-x);
		border-bottom: 1px solid var(--line);
	}

	.ruler.y {
		width: var(--ruler-y);
		border-right: 1px solid var(--line);
	}

	.bare {
		overflow: visible;
		border: 0 !important;
		background: transparent;
	}

	.bare svg {
		overflow: visible;
	}

	.bare .tick {
		stroke: var(--steel);
	}

	.bare.x .label {
		text-anchor: middle;
	}

	.pannable {
		cursor: grab;
		touch-action: none;
	}

	.pannable:active {
		cursor: grabbing;
	}

	svg {
		display: block;
	}

	.tick {
		fill: none;
		stroke: var(--tick);
		stroke-width: 1;
		shape-rendering: crispEdges;
	}

	.tick.major {
		stroke: var(--steel);
	}

	.band {
		fill: var(--accent);
		opacity: 0.18;
	}

	.label {
		fill: var(--steel);
		font-family: var(--font-mono);
		font-size: 11px;
		font-variant-numeric: tabular-nums;
	}

	.thumb {
		position: absolute;
		top: 0;
		left: 0;
		width: 8px;
		height: 8px;
		border-radius: 50%;
		background: var(--accent);
		box-shadow: 0 0 0 2px var(--paper);
		will-change: transform;
	}

	.ruler.x .thumb {
		top: 3px;
	}

	.ruler.y .thumb {
		left: 3px;
	}
</style>
