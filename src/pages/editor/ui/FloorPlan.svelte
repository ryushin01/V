<script lang="ts">
	import { tick, untrack } from 'svelte';
	import { corners, distance, pointInConvex, type Point } from '#shared/lib/geometry';
	import { Button, Icon, Ruler } from '#shared/ui';
	import { LAYER_ORDER, RoomOutline, XrayOverlay } from '#entities/plan';
	import { xray } from '#features/toggle-xray';
	import PlanItem from './PlanItem.svelte';
	import type { PlacedItem } from '../model/placed-item.svelte';
	import type { Direction, EditorSession } from '../model/session.svelte';

	let { session }: { session: EditorSession } = $props();

	const view = $derived(session.viewport);

	type Gesture =
		| { type: 'move'; id: string; dx: number; dy: number }
		| { type: 'rotate'; id: string }
		| { type: 'pan'; x: number; y: number }
		| { type: 'pinch'; distance: number; x: number; y: number };

	let svg = $state<SVGSVGElement>();
	let pointer = $state<{ x: number; y: number; sx: number; sy: number } | null>(null);
	let showCables = $state(true);
	let gesture: Gesture | null = null;
	// 화면에 그리지 않는 포인터 기록이라 반응형으로 만들지 않습니다.
	// eslint-disable-next-line svelte/prefer-svelte-reactivity
	const touches = new Map<number, { x: number; y: number }>();
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

	function pinchState(): Gesture {
		const [a, b] = [...touches.values()];
		return {
			type: 'pinch',
			distance: Math.hypot(a.x - b.x, a.y - b.y) || 1,
			x: (a.x + b.x) / 2,
			y: (a.y + b.y) / 2
		};
	}

	const isItemGesture = (value: Gesture | null) =>
		value !== null && (value.type === 'move' || value.type === 'rotate');

	/**
	 * 거리 재기: 두 점을 차례로 누르면 그 사이를 잽니다. 저장하지 않는 화면 도구입니다. 키보드로는 도면에
	 * 초점을 두고 방향키로 십자선을 옮겨 Enter로 점을 찍습니다.
	 */
	let measuring = $state(false);
	let measurePoints = $state.raw<Point[]>([]);
	/** 키보드로 옮기는 십자선(cm). 처음에는 방 가운데입니다. */
	let measureCursor = $state.raw<Point | null>(null);
	const MEASURE_SNAP_CM = 5;
	/** 방향키 한 번에 옮기는 거리(cm). Shift를 누르면 1cm입니다. */
	const MEASURE_KEY_STEP_CM = 10;
	const measured = $derived(
		measurePoints.length === 2 ? Math.round(distance(measurePoints[0], measurePoints[1])) : null
	);

	let measureButton = $state<HTMLButtonElement>();
	let canvas = $state<HTMLDivElement>();
	const measureHelpId = $props.id();

	function stopMeasure() {
		// 십자선 버튼에 있던 초점은 사라지기 전에 켜기 버튼으로 돌려줍니다.
		const hadFocus = measureButton !== undefined && document.activeElement === measureButton;
		measuring = false;
		measurePoints = [];
		measureCursor = null;
		session.announcement = '거리 재기를 마쳤습니다.';
		if (hadFocus) canvas?.querySelector<HTMLElement>('.measure-toggle')?.focus();
	}

	function toggleMeasure(event: MouseEvent) {
		if (measuring) {
			stopMeasure();
			return;
		}
		if (session.calibration) session.cancelCalibration();
		measuring = true;
		measurePoints = [];
		measureCursor = { x: session.room.width / 2, y: session.room.depth / 2 };
		session.announcement =
			'거리 재기: 도면에서 두 점을 차례로 누르거나, 방향키로 십자선을 옮기고 Enter로 찍어 주세요. Esc로 마칩니다.';
		// 키보드로 켰으면(누른 위치가 없는 클릭) 십자선을 옮길 수 있게 십자선 버튼으로 초점을 옮기고,
		// 도면 위에 남은 마우스 위치 대신 키보드 십자선을 보여 줍니다.
		if (event.detail === 0) {
			pointer = null;
			void tick().then(() => measureButton?.focus());
		}
	}

	function placeMeasurePoint(point: Point) {
		measurePoints = measurePoints.length === 1 ? [measurePoints[0], point] : [point];
		session.announcement =
			measurePoints.length === 1
				? '두 번째 점을 찍어 주세요.'
				: `두 점 사이 ${Math.round(distance(measurePoints[0], point))}cm. 다른 곳을 찍으면 새로 잽니다.`;
	}

	/** 5cm 격자에 맞추고, Shift를 누르면 누른 자리 그대로 씁니다. */
	function addMeasurePoint(event: PointerEvent) {
		const { sx, sy } = local(event);
		const raw = view.toWorld(sx, sy);
		const snap = (value: number) =>
			event.shiftKey ? value : Math.round(value / MEASURE_SNAP_CM) * MEASURE_SNAP_CM;
		const point = { x: snap(raw.x), y: snap(raw.y) };
		measureCursor = point;
		placeMeasurePoint(point);
	}

	const MEASURE_KEYS: Record<string, [number, number]> = {
		ArrowLeft: [-1, 0],
		ArrowRight: [1, 0],
		ArrowUp: [0, -1],
		ArrowDown: [0, 1]
	};

	const cursorOrCenter = () =>
		measureCursor ?? { x: session.room.width / 2, y: session.room.depth / 2 };

	/** 십자선 버튼에서 방향키로 십자선을 옮깁니다(Enter·Space는 버튼 누르기로 점을 찍음). */
	function handleMeasureKeydown(event: KeyboardEvent) {
		const move = MEASURE_KEYS[event.key];
		if (!move || event.ctrlKey || event.metaKey || event.altKey) return;
		event.preventDefault();
		// 키보드로 옮기는 동안에는 마우스 위치 대신 키보드 십자선을 보여 줍니다(마우스를 움직이면 다시 마우스).
		pointer = null;
		const cursor = cursorOrCenter();
		const step = event.shiftKey ? 1 : MEASURE_KEY_STEP_CM;
		const clamp = (value: number, max: number) => Math.min(max, Math.max(0, value));
		measureCursor = {
			x: clamp(cursor.x + move[0] * step, session.room.width),
			y: clamp(cursor.y + move[1] * step, session.room.depth)
		};
		session.announcement = `X ${Math.round(measureCursor.x)}, Y ${Math.round(measureCursor.y)}cm`;
	}

	/** 마우스 위치가 없으면 키보드 십자선을 같은 모양으로 보여 줍니다. */
	const shownPointer = $derived(
		pointer ??
			(measuring && measureCursor
				? {
						x: measureCursor.x,
						y: measureCursor.y,
						sx: measureCursor.x * view.scale + view.offsetX,
						sy: measureCursor.y * view.scale + view.offsetY
					}
				: null)
	);

	// 축척 맞추기를 시작하면(평면도 이미지 패널) 거리 재기를 끕니다.
	$effect(() => {
		if (session.calibration && untrack(() => measuring)) {
			measuring = false;
			measurePoints = [];
			measureCursor = null;
		}
	});

	function trackTouch(event: PointerEvent) {
		if (measuring && event.button === 0) {
			// 거리를 재는 동안에는 물건을 잡거나 화면을 옮기지 않습니다. 누른 물건에 초점이 가서 선택되지
			// 않도록 기본 동작도 막고, 두 번째 손가락은 받지 않으며 첫 손가락(주 포인터)만 점을 찍습니다.
			event.stopPropagation();
			event.preventDefault();
			if (event.isPrimary) addMeasurePoint(event);
			return;
		}
		if (session.calibration && event.button === 0) {
			// 축척을 맞추는 동안에는 물건을 잡거나 선택하지 않고 점만 찍습니다.
			event.stopPropagation();
			event.preventDefault();
			const { sx, sy } = local(event);
			session.addCalibrationPoint(view.toWorld(sx, sy));
			return;
		}
		if (event.pointerType !== 'touch') return;
		const { sx, sy } = local(event);
		touches.set(event.pointerId, { x: sx, y: sy });
		capture(event);
		if (touches.size === 2) {
			if (isItemGesture(gesture)) session.cancelGesture();
			gesture = pinchState();
		}
	}

	function startMove(event: PointerEvent, item: PlacedItem) {
		if (event.button !== 0 || touches.size > 1) return;
		event.stopPropagation();
		session.select(item.id);
		session.beginGesture();
		const { x, y } = world(event);
		gesture = { type: 'move', id: item.id, dx: item.x - x, dy: item.y - y };
		capture(event);
	}

	function startRotate(event: PointerEvent, item: PlacedItem) {
		if (event.button !== 0 || touches.size > 1) return;
		event.stopPropagation();
		session.beginGesture();
		gesture = { type: 'rotate', id: item.id };
		capture(event);
	}

	function startPan(event: PointerEvent) {
		if (event.button !== 0 || touches.size > 1) return;
		session.select(null);
		const { sx, sy } = local(event);
		gesture = { type: 'pan', x: sx, y: sy };
		capture(event);
	}

	function handleMove(event: PointerEvent) {
		const { sx, sy } = local(event);
		const point = view.toWorld(sx, sy);
		if (event.pointerType !== 'touch') pointer = { x: point.x, y: point.y, sx, sy };
		if (touches.has(event.pointerId)) touches.set(event.pointerId, { x: sx, y: sy });
		if (!gesture) return;
		if (gesture.type === 'pinch') {
			if (touches.size < 2) return;
			const next = pinchState() as Extract<Gesture, { type: 'pinch' }>;
			view.zoomAt(next.x, next.y, next.distance / gesture.distance);
			view.panBy(next.x - gesture.x, next.y - gesture.y);
			gesture = next;
			return;
		}
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

	function handleUp(event: PointerEvent) {
		touches.delete(event.pointerId);
		if (gesture && gesture.type !== 'pan' && gesture.type !== 'pinch') {
			session.endGesture();
			const item = itemById.get(gesture.id);
			if (item)
				session.announcement = `${item.name}, X ${Math.round(item.x)}, Y ${Math.round(item.y)}, 회전 ${item.rotation}도.`;
		}
		gesture = null;
	}

	function handleCancel(event: PointerEvent) {
		touches.delete(event.pointerId);
		if (isItemGesture(gesture)) session.cancelGesture();
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
		if (event.key === 'Escape' && measuring) stopMeasure();
		if (event.key === 'Escape' && session.calibration) session.cancelCalibration();
		if (event.key === 'Escape' && isItemGesture(gesture)) {
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
		pointer={shownPointer?.x ?? null}
		range={selectedBounds ? { start: selectedBounds.minX, end: selectedBounds.maxX } : null}
		onpan={(delta) => view.panBy(delta, 0)}
	/>
	<Ruler
		axis="y"
		length={view.height}
		scale={view.scale}
		offset={view.offsetY}
		pointer={shownPointer?.y ?? null}
		range={selectedBounds ? { start: selectedBounds.minY, end: selectedBounds.maxY } : null}
		onpan={(delta) => view.panBy(0, delta)}
	/>
	<div
		class="canvas"
		bind:this={canvas}
		bind:clientWidth={view.width}
		bind:clientHeight={view.height}
	>
		<svg
			bind:this={svg}
			width="100%"
			height="100%"
			role="group"
			aria-label="방 배치도. 물건에 초점을 두고 방향키로 옮깁니다."
			onpointerdowncapture={trackTouch}
			onpointerdown={startPan}
			onpointermove={handleMove}
			onpointerup={handleUp}
			onpointercancel={handleCancel}
			onpointerleave={() => (pointer = null)}
			onwheel={handleWheel}
			class:calibrating={!!session.calibration || measuring}
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
				{#if session.underlay}
					{@const image = session.underlay}
					<image
						class="underlay"
						href={image.src}
						x={image.x}
						y={image.y}
						width={image.pixelWidth * image.cmPerPixel}
						height={image.pixelHeight * image.cmPerPixel}
						opacity={image.opacity}
						preserveAspectRatio="none"
						data-testid="underlay"
					/>
				{/if}
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
				{#if session.calibration}
					{@const points = session.calibration.points}
					{#if points.length === 2}
						<line
							class="calibration"
							x1={points[0].x}
							y1={points[0].y}
							x2={points[1].x}
							y2={points[1].y}
						/>
					{/if}
					{#each points as point, index (index)}
						<circle class="calibration-point" cx={point.x} cy={point.y} r={5 / view.scale} />
					{/each}
				{/if}
				{#if measuring && measurePoints.length > 0}
					{@const [a, b] = measurePoints}
					{@const size = 11 / view.scale}
					{#if b}
						<g class="dimension measure-line" data-testid="measure-line">
							<line x1={a.x} y1={a.y} x2={b.x} y2={b.y} />
							<text x={(a.x + b.x) / 2} y={(a.y + b.y) / 2 - size / 2} font-size={size}
								>{measured} cm</text
							>
						</g>
					{/if}
					{#each measurePoints as point, index (index)}
						<circle class="calibration-point" cx={point.x} cy={point.y} r={5 / view.scale} />
					{/each}
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
		{#if shownPointer}
			<div
				class="cross h"
				style:transform={`translate3d(0, ${shownPointer.sy}px, 0)`}
				aria-hidden="true"
			></div>
			<div
				class="cross v"
				style:transform={`translate3d(${shownPointer.sx}px, 0, 0)`}
				aria-hidden="true"
			></div>
			<div
				class="coords measure"
				style:transform={`translate3d(${shownPointer.sx + 10}px, ${shownPointer.sy + 10}px, 0)`}
				aria-hidden="true"
			>
				X {Math.round(shownPointer.x)} · Y {Math.round(shownPointer.y)}
			</div>
		{/if}
		{#if measuring}
			<!-- 키보드로 거리를 재는 십자선 버튼입니다. 포인터는 도면을 직접 눌러 찍으므로 이 버튼을 지나쳐 갑니다. -->
			<button
				bind:this={measureButton}
				type="button"
				class="measure-hint coords measure"
				aria-describedby={measureHelpId}
				onkeydown={handleMeasureKeydown}
				onclick={() => {
					pointer = null;
					placeMeasurePoint(cursorOrCenter());
				}}
			>
				{measured === null ? '두 점을 찍어 거리를 잽니다' : `${measured} cm`} · Esc로 마침
			</button>
			<span id={measureHelpId} class="sr-only"
				>방향키로 십자선을 10cm씩, Shift와 함께 1cm씩 옮기고 Enter로 점을 찍습니다.</span
			>
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
			<Button
				size="sm"
				class="measure-toggle"
				aria-pressed={measuring}
				aria-label="거리 재기"
				title="거리 재기 (두 점을 누릅니다)"
				onclick={toggleMeasure}><Icon name="ruler" /></Button
			>
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

	.underlay {
		pointer-events: none;
	}

	.calibration {
		stroke: var(--accent);
		stroke-width: 2;
		vector-effect: non-scaling-stroke;
	}

	.calibration-point {
		fill: var(--accent);
		stroke: var(--paper);
		stroke-width: 2;
		vector-effect: non-scaling-stroke;
	}

	svg.calibrating {
		cursor: crosshair;
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

	/* 버튼이지만 예전 안내 상자와 같은 모양입니다(글자는 전역 .measure, 줄 높이는 본문). */
	.measure-hint {
		top: 0.75rem;
		left: 0.75rem;
		line-height: inherit;
	}

	.measure-hint:focus-visible {
		outline: 2px solid var(--ink);
		outline-offset: 2px;
	}

	.controls :global(.measure-toggle[aria-pressed='true']) {
		border-color: var(--ink);
		color: var(--paper);
		background: var(--ink);
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
