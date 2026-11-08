<script lang="ts">
	import { tick } from 'svelte';
	import { corners, pointInConvex } from '#shared/lib/geometry';
	import { Button, Icon, Ruler } from '#shared/ui';
	import { RoomOutline, XrayOverlay } from '#entities/plan';
	import { xray } from '#features/toggle-xray';
	import PlanItem from './PlanItem.svelte';
	import type { PlacedItem } from '../model/placed-item.svelte';
	import type { Direction, EditorSession } from '../model/session.svelte';

	let { session }: { session: EditorSession } = $props();

	const view = $derived(session.viewport);

	type Gesture =
		| { type: 'move'; id: string; dx: number; dy: number }
		| { type: 'rotate'; id: string }
		| { type: 'pan'; x: number; y: number };

	let svg = $state<SVGSVGElement>();
	let pointer = $state<{ x: number; y: number; sx: number; sy: number } | null>(null);
	let showCables = $state(true);
	let gesture: Gesture | null = null;
	let fitted = false;

	$effect(() => {
		if (!fitted && view.width > 0 && view.height > 0) {
			fitted = true;
			view.fit(session.room.width, session.room.depth);
		}
	});

	$effect(() => {
		const request = session.focusRequest;
		if (!request) return;
		tick().then(() => {
			const target = request.id
				? svg?.querySelector<SVGGElement>(`[data-item-id="${request.id}"]`)
				: document.getElementById('catalog-heading');
			target?.focus();
		});
	});

	const LAYER_ORDER = { floor: 0, cable: 1, wall: 2, surface: 3 } as const;
	const orderedItems = $derived(
		[...session.items].sort((a, b) => LAYER_ORDER[a.entry.layer] - LAYER_ORDER[b.entry.layer])
	);
	const flagged = $derived(
		new Set(
			session.analysis.findings
				.filter((finding) => finding.severity !== 'ok')
				.flatMap((finding) => finding.itemIds)
		)
	);
	/** TV장은 폭이 좁아 위에 물건이 있으면 이름을 생략합니다. 이름은 목록과 속성에서 볼 수 있습니다. */
	const occupiedStands = $derived(
		new Set(
			session.items
				.filter(
					(stand) =>
						stand.entry.kind === 'stand' &&
						session.items.some(
							(item) => item.entry.layer === 'surface' && pointInConvex(item, corners(stand.rect))
						)
				)
				.map((stand) => stand.id)
		)
	);
	const itemById = $derived(new Map(session.items.map((item) => [item.id, item])));
	const cables = $derived(
		session.analysis.connections.flatMap((connection) => {
			const from = itemById.get(connection.fromId);
			const to = itemById.get(connection.toId);
			return from && to ? [{ connection, from, to }] : [];
		})
	);
	const selectedBounds = $derived(session.selected?.bounds ?? null);
	const dimensions = $derived(
		selectedBounds
			? {
					cx: (selectedBounds.minX + selectedBounds.maxX) / 2,
					cy: (selectedBounds.minY + selectedBounds.maxY) / 2,
					left: selectedBounds.minX,
					right: session.room.width - selectedBounds.maxX,
					top: selectedBounds.minY,
					bottom: session.room.depth - selectedBounds.maxY
				}
			: null
	);

	function local(event: PointerEvent | WheelEvent) {
		const rect = svg?.getBoundingClientRect();
		return { sx: event.clientX - (rect?.left ?? 0), sy: event.clientY - (rect?.top ?? 0) };
	}

	function world(event: PointerEvent) {
		const { sx, sy } = local(event);
		return view.toWorld(sx, sy);
	}

	function capture(event: PointerEvent) {
		svg?.setPointerCapture?.(event.pointerId);
	}

	function startMove(event: PointerEvent, item: PlacedItem) {
		if (event.button !== 0) return;
		event.stopPropagation();
		session.select(item.id);
		session.beginGesture();
		const { x, y } = world(event);
		gesture = { type: 'move', id: item.id, dx: item.x - x, dy: item.y - y };
		capture(event);
	}

	function startRotate(event: PointerEvent, item: PlacedItem) {
		if (event.button !== 0) return;
		event.stopPropagation();
		session.beginGesture();
		gesture = { type: 'rotate', id: item.id };
		capture(event);
	}

	function startPan(event: PointerEvent) {
		if (event.button !== 0) return;
		session.select(null);
		const { sx, sy } = local(event);
		gesture = { type: 'pan', x: sx, y: sy };
		capture(event);
	}

	function handleMove(event: PointerEvent) {
		const { sx, sy } = local(event);
		const point = view.toWorld(sx, sy);
		pointer = { x: point.x, y: point.y, sx, sy };
		if (!gesture) return;
		if (gesture.type === 'move') {
			session.dragItem(gesture.id, point.x + gesture.dx, point.y + gesture.dy, !event.shiftKey);
		} else if (gesture.type === 'rotate') {
			const item = itemById.get(gesture.id);
			if (!item) return;
			const angle = (Math.atan2(point.y - item.y, point.x - item.x) * 180) / Math.PI + 90;
			session.rotateDrag(gesture.id, angle, !event.shiftKey);
		} else {
			view.panBy(sx - gesture.x, sy - gesture.y);
			gesture = { type: 'pan', x: sx, y: sy };
		}
	}

	function handleUp() {
		if (gesture && gesture.type !== 'pan') {
			session.endGesture();
			const item = itemById.get(gesture.id);
			if (item)
				session.announcement = `${item.name}, X ${Math.round(item.x)}, Y ${Math.round(item.y)}, 회전 ${item.rotation}도.`;
		}
		gesture = null;
	}

	function handleCancel() {
		if (gesture && gesture.type !== 'pan') session.cancelGesture();
		gesture = null;
	}

	function handleWheel(event: WheelEvent) {
		event.preventDefault();
		if (event.ctrlKey || event.metaKey) {
			const { sx, sy } = local(event);
			view.zoomAt(sx, sy, Math.exp(-event.deltaY * 0.01));
		} else {
			view.panBy(-event.deltaX, -event.deltaY);
		}
	}

	function handleItemKeydown(event: KeyboardEvent, item: PlacedItem) {
		// Ctrl+R 같은 브라우저 단축키와 되돌리기는 그대로 둡니다.
		if (event.ctrlKey || event.metaKey || event.altKey) return;
		const directions: Record<string, Direction> = {
			ArrowLeft: 'left',
			ArrowRight: 'right',
			ArrowUp: 'up',
			ArrowDown: 'down'
		};
		const direction = directions[event.key];
		if (direction) {
			event.preventDefault();
			session.nudge(item.id, direction, event.shiftKey ? 1 : 10);
		} else if (event.key === 'r' || event.key === 'R') {
			event.preventDefault();
			session.rotate(item.id, event.shiftKey ? -15 : 15);
		} else if (event.key === 'Delete' || event.key === 'Backspace') {
			event.preventDefault();
			session.removeItem(item.id);
		} else if (event.key === 'Enter' || event.key === ' ') {
			event.preventDefault();
			document.getElementById('item-name')?.focus();
		}
	}

	function handleWindowKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape' && gesture && gesture.type !== 'pan') {
			session.cancelGesture();
			gesture = null;
		}
	}

	const PAN_STEP = 80;
</script>

<svelte:window onkeydown={handleWindowKeydown} />

<div class="stage">
	<div class="corner measure" aria-hidden="true">cm</div>
	<Ruler
		axis="x"
		length={view.width}
		scale={view.scale}
		offset={view.offsetX}
		pointer={pointer?.x ?? null}
		range={selectedBounds ? { start: selectedBounds.minX, end: selectedBounds.maxX } : null}
		onpan={(delta) => view.panBy(delta, 0)}
	/>
	<Ruler
		axis="y"
		length={view.height}
		scale={view.scale}
		offset={view.offsetY}
		pointer={pointer?.y ?? null}
		range={selectedBounds ? { start: selectedBounds.minY, end: selectedBounds.maxY } : null}
		onpan={(delta) => view.panBy(0, delta)}
	/>
	<div class="canvas" bind:clientWidth={view.width} bind:clientHeight={view.height}>
		<svg
			bind:this={svg}
			width="100%"
			height="100%"
			role="group"
			aria-label="방 배치도. 물건에 초점을 두고 방향키로 옮깁니다."
			onpointerdown={startPan}
			onpointermove={handleMove}
			onpointerup={handleUp}
			onpointercancel={handleCancel}
			onpointerleave={() => (pointer = null)}
			onwheel={handleWheel}
		>
			<defs>
				<pattern
					id="dots"
					width={Math.max(10, 50 * view.scale)}
					height={Math.max(10, 50 * view.scale)}
					patternUnits="userSpaceOnUse"
					x={view.offsetX}
					y={view.offsetY}
				>
					<circle cx="1" cy="1" r="1" class="dot" />
				</pattern>
			</defs>
			<rect width="100%" height="100%" fill="url(#dots)" />
			<g transform={`translate(${view.offsetX} ${view.offsetY}) scale(${view.scale})`}>
				<RoomOutline room={session.room} />
				{#if showCables && !xray.on}
					{#each cables as { connection, from, to } (`${connection.fromId}-${connection.toId}`)}
						<line
							class="cable"
							class:short={connection.tooShort}
							x1={from.x}
							y1={from.y}
							x2={to.x}
							y2={to.y}
						/>
					{/each}
				{/if}
				{#each orderedItems as item (item.id)}
					<PlanItem
						{item}
						scale={view.scale}
						selected={session.selectedId === item.id}
						warned={flagged.has(item.id)}
						hideLabel={occupiedStands.has(item.id)}
						onpointerdown={startMove}
						onrotatestart={startRotate}
						onkeydown={handleItemKeydown}
						onfocus={(target) => session.select(target.id)}
					/>
				{/each}
				{#if xray.on}
					<XrayOverlay
						room={session.room}
						items={session.items}
						connections={session.analysis.connections}
						scale={view.scale}
					/>
				{/if}
				{#if dimensions && selectedBounds}
					{@const size = 11 / view.scale}
					<g class="dimension" font-size={size}>
						<line x1="0" y1={dimensions.cy} x2={selectedBounds.minX} y2={dimensions.cy} />
						<line
							x1={selectedBounds.maxX}
							y1={dimensions.cy}
							x2={session.room.width}
							y2={dimensions.cy}
						/>
						<line x1={dimensions.cx} y1="0" x2={dimensions.cx} y2={selectedBounds.minY} />
						<line
							x1={dimensions.cx}
							y1={selectedBounds.maxY}
							x2={dimensions.cx}
							y2={session.room.depth}
						/>
						<text x={dimensions.left / 2} y={dimensions.cy - size / 2}
							>{Math.round(dimensions.left)}</text
						>
						<text x={selectedBounds.maxX + dimensions.right / 2} y={dimensions.cy - size / 2}
							>{Math.round(dimensions.right)}</text
						>
						<text x={dimensions.cx + size / 2} y={dimensions.top / 2}
							>{Math.round(dimensions.top)}</text
						>
						<text x={dimensions.cx + size / 2} y={selectedBounds.maxY + dimensions.bottom / 2}
							>{Math.round(dimensions.bottom)}</text
						>
					</g>
				{/if}
			</g>
		</svg>
		{#if pointer}
			<div
				class="cross h"
				style:transform={`translate3d(0, ${pointer.sy}px, 0)`}
				aria-hidden="true"
			></div>
			<div
				class="cross v"
				style:transform={`translate3d(${pointer.sx}px, 0, 0)`}
				aria-hidden="true"
			></div>
			<div
				class="coords measure"
				style:transform={`translate3d(${pointer.sx + 10}px, ${pointer.sy + 10}px, 0)`}
				aria-hidden="true"
			>
				X {Math.round(pointer.x)} · Y {Math.round(pointer.y)}
			</div>
		{/if}
		<div class="controls" role="group" aria-label="화면 조작">
			<Button size="sm" aria-label="축소" title="축소" onclick={() => view.zoomCenter(1 / 1.25)}
				><Icon name="minus" /></Button
			>
			<output class="measure" aria-label="화면 배율">{view.zoomPercent}%</output>
			<Button size="sm" aria-label="확대" title="확대" onclick={() => view.zoomCenter(1.25)}
				><Icon name="plus" /></Button
			>
			<Button
				size="sm"
				aria-label="방 전체 보기"
				title="방 전체 보기"
				onclick={() => view.fit(session.room.width, session.room.depth)}><Icon name="fit" /></Button
			>
			<span class="divider" aria-hidden="true"></span>
			<Button
				size="sm"
				aria-label="화면을 왼쪽으로 이동"
				title="왼쪽으로 이동"
				onclick={() => view.panBy(PAN_STEP, 0)}><Icon name="left" /></Button
			>
			<Button
				size="sm"
				aria-label="화면을 위로 이동"
				title="위로 이동"
				onclick={() => view.panBy(0, PAN_STEP)}><Icon name="up" /></Button
			>
			<Button
				size="sm"
				aria-label="화면을 아래로 이동"
				title="아래로 이동"
				onclick={() => view.panBy(0, -PAN_STEP)}><Icon name="down" /></Button
			>
			<Button
				size="sm"
				aria-label="화면을 오른쪽으로 이동"
				title="오른쪽으로 이동"
				onclick={() => view.panBy(-PAN_STEP, 0)}><Icon name="right" /></Button
			>
			<span class="divider" aria-hidden="true"></span>
			<label class="toggle"><input type="checkbox" bind:checked={showCables} /> 케이블</label>
		</div>
	</div>
</div>

<style>
	.stage {
		display: grid;
		grid-template-columns: var(--ruler-y) minmax(0, 1fr);
		grid-template-rows: var(--ruler-x) minmax(0, 1fr);
		height: 100%;
		min-height: 0;
	}

	.corner {
		display: grid;
		place-items: center;
		border-right: 1px solid var(--line);
		border-bottom: 1px solid var(--line);
	}

	.canvas {
		position: relative;
		overflow: hidden;
		min-width: 0;
		min-height: 0;
		background: var(--paper-2);
	}

	svg {
		display: block;
		touch-action: none;
		cursor: default;
	}

	.dot {
		fill: var(--tick);
	}

	.cable {
		stroke: var(--steel);
		stroke-width: 1;
		stroke-dasharray: 2 5;
		vector-effect: non-scaling-stroke;
		pointer-events: none;
	}

	.cable.short {
		stroke: var(--accent-deep);
		stroke-width: 1.5;
	}

	.dimension line {
		stroke: var(--accent-deep);
		stroke-width: 1;
		stroke-dasharray: 2 5;
		vector-effect: non-scaling-stroke;
	}

	.dimension {
		pointer-events: none;
	}

	.dimension text {
		fill: var(--accent-deep);
		font-family: var(--font-mono);
		text-anchor: middle;
		paint-order: stroke;
		stroke: var(--paper);
		stroke-width: 3px;
		vector-effect: non-scaling-stroke;
	}

	.cross {
		position: absolute;
		top: 0;
		left: 0;
		background: var(--accent);
		pointer-events: none;
		opacity: 0.55;
	}

	.cross.h {
		width: 100%;
		height: 1px;
	}

	.cross.v {
		width: 1px;
		height: 100%;
	}

	.coords {
		position: absolute;
		top: 0;
		left: 0;
		padding: 3px 6px;
		border: 1px solid var(--line);
		border-radius: 4px;
		color: var(--ink);
		background: var(--paper);
		pointer-events: none;
		white-space: nowrap;
	}

	.controls {
		position: absolute;
		bottom: 0.75rem;
		left: 0.75rem;
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.25rem;
		max-width: calc(100% - 1.5rem);
		padding: 0.25rem;
		border: 1px solid var(--line);
		border-radius: 1.5rem;
		background: var(--paper);
	}

	.controls output {
		min-width: 3rem;
		text-align: center;
		color: var(--ink);
	}

	.divider {
		width: 1px;
		height: 1.25rem;
		margin: 0 0.25rem;
		background: var(--line);
	}

	.toggle {
		display: inline-flex;
		align-items: center;
		gap: 0.375rem;
		min-height: 2.25rem;
		padding: 0 0.625rem;
		font-size: 0.8125rem;
	}

	.toggle input {
		width: 1.125rem;
		height: 1.125rem;
		accent-color: var(--accent-deep);
	}
</style>
