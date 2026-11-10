<script lang="ts">
	import { boundsOf, corners, localToWorld, type Point } from '#shared/lib/geometry';
	import { CHAIR_CLEARANCE_CM, viewingRange } from '../model/analysis';
	import { resolveEntry } from '../model/catalog';
	import { openingGeometry, roomOutline } from '../model/room';
	import type { Connection, ItemData, RoomData } from '../model/types';

	interface Props {
		room: RoomData;
		items: readonly ItemData[];
		connections: readonly Connection[];
		/** 1cm당 화면 픽셀 */
		scale: number;
	}

	let { room, items, connections, scale }: Props = $props();

	const clipId = $props.id();
	const SECTOR_DEGREES = 35;
	const MIN_CABLE_LABEL_PX = 72;
	const px = (value: number) => value / scale;
	const fontSize = $derived(px(11));

	const resolved = $derived(
		items.map((item) => {
			const entry = resolveEntry(item);
			const rect = {
				cx: item.x,
				cy: item.y,
				width: entry.width,
				depth: entry.depth,
				rotation: item.rotation
			};
			return { item, entry, rect, polygon: corners(rect) };
		})
	);
	const byId = $derived(new Map(resolved.map((entry) => [entry.item.id, entry])));

	const pointsAttr = (points: Point[]) => points.map((p) => `${p.x},${p.y}`).join(' ');

	const doors = $derived(
		room.openings
			.filter((opening) => opening.kind === 'door')
			.map((opening) => ({ id: opening.id, swing: openingGeometry(room, opening).swing }))
	);

	const clearances = $derived(
		resolved
			.filter(({ entry }) => entry.kind === 'chair')
			.map(({ item, entry, rect }) => {
				const hw = entry.width / 2;
				const near = entry.depth / 2;
				const far = near + CHAIR_CLEARANCE_CM;
				return {
					id: item.id,
					polygon: [
						localToWorld(rect, -hw, near),
						localToWorld(rect, hw, near),
						localToWorld(rect, hw, far),
						localToWorld(rect, -hw, far)
					],
					label: localToWorld(rect, 0, near + CHAIR_CLEARANCE_CM / 2)
				};
			})
	);

	const viewing = $derived(
		resolved
			.filter(({ entry }) => entry.kind === 'tv')
			.map(({ item, entry, rect }) => {
				const range = viewingRange(entry.diagonalInch ?? 0);
				const front = localToWorld(rect, 0, 1);
				const center = Math.atan2(front.y - rect.cy, front.x - rect.cx);
				const spread = (SECTOR_DEGREES * Math.PI) / 180;
				const at = (radius: number, angle: number): Point => ({
					x: rect.cx + radius * Math.cos(angle),
					y: rect.cy + radius * Math.sin(angle)
				});
				const a = at(range.min, center - spread);
				const b = at(range.min, center + spread);
				const c = at(range.max, center + spread);
				const d = at(range.max, center - spread);
				return {
					id: item.id,
					path: `M${a.x} ${a.y}A${range.min} ${range.min} 0 0 1 ${b.x} ${b.y}L${c.x} ${c.y}A${range.max} ${range.max} 0 0 0 ${d.x} ${d.y}Z`,
					label: at((range.min + range.max) / 2, center - spread * 0.62),
					text: `${range.min}~${range.max}cm`
				};
			})
	);

	const cables = $derived(
		connections.flatMap((connection) => {
			const from = byId.get(connection.fromId);
			const to = byId.get(connection.toId);
			if (!from || !to) return [];
			return [
				{
					key: `${connection.fromId}-${connection.toId}`,
					short: connection.tooShort,
					length: Math.round(connection.length),
					x1: from.item.x,
					y1: from.item.y,
					x2: to.item.x,
					y2: to.item.y
				}
			];
		})
	);

	const labels = $derived(
		resolved
			.filter(({ entry, polygon }) => {
				if (entry.kind === 'stand' || entry.layer === 'cable' || entry.layer === 'wall')
					return false;
				const bounds = boundsOf(polygon);
				return (bounds.maxX - bounds.minX) * scale >= 44;
			})
			.map(({ item, entry, rect }) => {
				// 책상 위 물건과 겹치지 않게 앞쪽 가장자리에 씁니다.
				const anchor =
					entry.kind === 'desk'
						? localToWorld(rect, 0, entry.depth * 0.32)
						: { x: item.x, y: item.y };
				return {
					id: item.id,
					x: anchor.x,
					y: anchor.y + px(13),
					text: `${entry.width}×${entry.depth}`
				};
			})
	);
</script>

<g class="xray" aria-hidden="true" font-size={fontSize} data-testid="xray-overlay">
	<clipPath id={clipId}><polygon points={pointsAttr(roomOutline(room))} /></clipPath>

	<g clip-path={`url(#${clipId})`}>
		{#each viewing as sector (sector.id)}
			<path class="zone" d={sector.path} />
		{/each}
	</g>
	{#each doors as door (door.id)}
		<polygon class="zone" points={pointsAttr(door.swing)} />
	{/each}
	{#each clearances as zone (zone.id)}
		<polygon class="zone dashed" points={pointsAttr(zone.polygon)} />
	{/each}

	{#each resolved as { item, polygon } (item.id)}
		<polygon class="outline" points={pointsAttr(polygon)} />
	{/each}

	{#each cables as cable (cable.key)}
		<line
			class="cable"
			class:short={cable.short}
			x1={cable.x1}
			y1={cable.y1}
			x2={cable.x2}
			y2={cable.y2}
		/>
		{#if cable.short || cable.length * scale >= MIN_CABLE_LABEL_PX}
			<text
				class="value"
				class:short={cable.short}
				x={(cable.x1 + cable.x2) / 2}
				y={(cable.y1 + cable.y2) / 2}
			>
				{cable.length}cm
			</text>
		{/if}
	{/each}

	{#each labels as label (label.id)}
		<text class="value" x={label.x} y={label.y}>{label.text}</text>
	{/each}
	{#each clearances as zone (zone.id)}
		<text class="value" x={zone.label.x} y={zone.label.y}>{CHAIR_CLEARANCE_CM}</text>
	{/each}
	{#each viewing as sector (sector.id)}
		<text class="value" x={sector.label.x} y={sector.label.y}>{sector.text}</text>
	{/each}

	<g class="room-size">
		<path
			d={`M0 ${px(-14)}H${room.width}M0 ${px(-18)}V${px(-10)}M${room.width} ${px(-18)}V${px(-10)}`}
		/>
		<path
			d={`M${px(-14)} 0V${room.depth}M${px(-18)} 0H${px(-10)}M${px(-18)} ${room.depth}H${px(-10)}`}
		/>
		<text class="value" x={room.width / 2} y={px(-14)}>{room.width}cm</text>
		<text class="value" x={px(-14)} y={room.depth / 2}>{room.depth}cm</text>
	</g>
</g>

<style>
	.xray {
		pointer-events: none;
	}

	.xray :global(*) {
		vector-effect: non-scaling-stroke;
	}

	.zone {
		fill: var(--accent);
		fill-opacity: 0.14;
		stroke: var(--accent);
		stroke-width: 1;
	}

	.zone.dashed {
		stroke-dasharray: 3 4;
	}

	.outline {
		fill: none;
		stroke: var(--steel);
		stroke-width: 1;
		stroke-dasharray: 2 3;
	}

	.room-size path {
		fill: none;
		stroke: var(--ink);
		stroke-width: 1;
	}

	.cable {
		stroke: var(--ink-2);
		stroke-width: 1;
		stroke-dasharray: 5 4;
	}

	.cable.short {
		stroke: var(--accent);
		stroke-width: 1.5;
	}

	.value {
		fill: var(--ink);
		font-family: var(--font-mono);
		font-variant-numeric: tabular-nums;
		text-anchor: middle;
		dominant-baseline: central;
		paint-order: stroke;
		stroke: var(--paper);
		stroke-width: 3px;
	}

	.value.short {
		fill: var(--accent-deep);
	}
</style>
