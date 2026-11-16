import {
	boundsOf,
	corners,
	distance,
	distanceToPolygon,
	localToWorld,
	pointInConvex,
	polygonsOverlap,
	type Bounds,
	type Point,
	type RotatedRect
} from '#shared/lib/geometry';
import { josa } from '#shared/lib/josa';
import { resolveEntry } from './catalog';
import { cutoutPolygon, isOutsideRoom, openingGeometry } from './room';
import type {
	Analysis,
	CatalogEntry,
	Connection,
	Finding,
	FindingSeverity,
	ItemData,
	PowerSummary,
	RoomData
} from './types';

export const CHAIR_CLEARANCE_CM = 60;
const PASSAGE_WIDTH_CM = 60;
const MONITOR_RANGE_CM = { min: 50, max: 100 } as const;
const ROUTE_GRID_CM = 10;
/** 좌석에서 이 거리 안의 통로 칸에 닿으면 좌석까지 갈 수 있다고 봅니다. */
const SEAT_REACH_CM = PASSAGE_WIDTH_CM / 2 + 20;
const INCH_TO_CM = 2.54;
/** 16:9 화면의 대각선 대비 가로 길이 */
const SCREEN_WIDTH_RATIO = 16 / Math.hypot(16, 9);

/** 다각형과 그 경계 상자입니다. 경계 상자로 먼 쌍을 먼저 걸러 냅니다. */
interface Shape {
	polygon: Point[];
	bounds: Bounds;
}

interface Resolved extends Shape {
	data: ItemData;
	entry: CatalogEntry;
	name: string;
	rect: RotatedRect;
	center: Point;
}

const shapeOf = (polygon: Point[]): Shape => ({ polygon, bounds: boundsOf(polygon) });

function resolveItem(data: ItemData): Resolved {
	const entry = resolveEntry(data);
	const rect = {
		cx: data.x,
		cy: data.y,
		width: entry.width,
		depth: entry.depth,
		rotation: data.rotation
	};
	return {
		data,
		entry,
		rect,
		name: data.label || entry.name,
		...shapeOf(corners(rect)),
		center: { x: data.x, y: data.y }
	};
}

/**
 * 경계 상자가 이만큼 넘게 떨어진 쌍은 분리축 검사를 하지 않습니다. 사각형끼리는 분리축 방향의 간격이
 * 실제 거리의 cos 45°(약 0.71배) 이상이라, 1cm 떨어진 쌍은 분리축 검사(허용 오차 0.01cm)로도
 * 반드시 겹치지 않음이 나옵니다. 그래서 판정 결과는 모든 쌍을 검사할 때와 같습니다.
 */
const BOUNDS_GAP_CM = 1;

function overlaps(a: Shape, b: Shape): boolean {
	if (
		a.bounds.maxX + BOUNDS_GAP_CM < b.bounds.minX ||
		b.bounds.maxX + BOUNDS_GAP_CM < a.bounds.minX ||
		a.bounds.maxY + BOUNDS_GAP_CM < b.bounds.minY ||
		b.bounds.maxY + BOUNDS_GAP_CM < a.bounds.minY
	) {
		return false;
	}
	return polygonsOverlap(a.polygon, b.polygon);
}

/** 서로 겹쳐 놓는 것이 자연스러운 조합입니다. 의자·발받침대는 책상 아래로, 휴대 기기는 거치대 위로 갑니다. */
const RESTS_ON_HOLDER = new Set([
	'handheld',
	'laptop',
	'mouse',
	'earphones',
	'headphones',
	'audio-device'
]);
function canShareSpace(a: string, b: string): boolean {
	const pair = (x: string, y: string) => (a === x && b === y) || (a === y && b === x);
	if (pair('chair', 'desk') || pair('footrest', 'desk') || pair('footrest', 'chair')) return true;
	return (a === 'holder' && RESTS_ON_HOLDER.has(b)) || (b === 'holder' && RESTS_ON_HOLDER.has(a));
}

const isSeat = (item: Resolved) => item.entry.kind === 'chair' || item.entry.kind === 'sofa';
const isSupport = (item: Resolved) => item.entry.kind === 'desk' || item.entry.kind === 'stand';
const isPowerSource = (item: Resolved) =>
	item.entry.kind === 'outlet' || item.entry.kind === 'strip';

/** 16:9 화면에서 시야각 40도(가깝게)와 30도(멀게)가 되는 거리입니다. */
export function viewingRange(inch: number): { min: number; max: number } {
	const screenWidth = inch * INCH_TO_CM * SCREEN_WIDTH_RATIO;
	const at = (degree: number) => screenWidth / 2 / Math.tan(((degree / 2) * Math.PI) / 180);
	return { min: Math.round(at(40)), max: Math.round(at(30)) };
}

function nearest(from: Point, candidates: Resolved[]): { item: Resolved; length: number } | null {
	let best: { item: Resolved; length: number } | null = null;
	for (const item of candidates) {
		const length = distance(from, item.center);
		if (!best || length < best.length) best = { item, length };
	}
	return best;
}

function chairClearance(room: RoomData, chair: Resolved, floor: Resolved[]): number {
	for (let depth = 5; depth <= CHAIR_CLEARANCE_CM; depth += 5) {
		const center = localToWorld(chair.rect, 0, chair.rect.depth / 2 + depth / 2);
		const strip = shapeOf(
			corners({
				cx: center.x,
				cy: center.y,
				width: chair.rect.width,
				depth,
				rotation: chair.rect.rotation
			})
		);
		const blocked =
			isOutsideRoom(room, strip.polygon) ||
			floor.some((item) => item !== chair && overlaps(item, strip));
		if (blocked) return depth - 5;
	}
	return CHAIR_CLEARANCE_CM;
}

/**
 * 폭 60cm로 지나갈 수 있는 칸을 문에서부터 넓혀 가며 각 좌석에 닿는지 확인합니다.
 * 칸마다 모든 물건을 보지 않고, 물건마다 자기 둘레의 칸만 확인해 막습니다. 판정 기준(칸 중심과
 * 물건 사이 거리)은 같아 결과도 같습니다.
 */
function reachableSeats(room: RoomData, floor: Resolved[], seats: Resolved[]): Set<string> {
	const reached = new Set<string>();
	const doors = room.openings.filter((opening) => opening.kind === 'door');
	const radius = PASSAGE_WIDTH_CM / 2;
	const columns = Math.floor(room.width / ROUTE_GRID_CM);
	const rows = Math.floor(room.depth / ROUTE_GRID_CM);
	if (columns === 0 || rows === 0 || doors.length === 0) return reached;

	const center = (column: number, row: number): Point => ({
		x: (column + 0.5) * ROUTE_GRID_CM,
		y: (row + 0.5) * ROUTE_GRID_CM
	});
	/** 경계 상자에서 margin 안에 중심이 들 수 있는 칸의 범위입니다. 실제 판정은 칸마다 거리로 합니다. */
	const cellsNear = (bounds: Bounds, margin: number) => ({
		firstColumn: Math.max(0, Math.floor((bounds.minX - margin) / ROUTE_GRID_CM - 0.5)),
		lastColumn: Math.min(columns - 1, Math.ceil((bounds.maxX + margin) / ROUTE_GRID_CM - 0.5)),
		firstRow: Math.max(0, Math.floor((bounds.minY - margin) / ROUTE_GRID_CM - 0.5)),
		lastRow: Math.min(rows - 1, Math.ceil((bounds.maxY + margin) / ROUTE_GRID_CM - 0.5))
	});

	const open = new Uint8Array(columns * rows);
	for (let row = 0; row < rows; row += 1) {
		for (let column = 0; column < columns; column += 1) {
			const point = center(column, row);
			const nearWall =
				point.x < radius ||
				point.y < radius ||
				point.x > room.width - radius ||
				point.y > room.depth - radius;
			if (!nearWall) open[row * columns + column] = 1;
		}
	}
	const blockers: Shape[] = [
		...(room.cutouts ?? []).map((cutout) => shapeOf(cutoutPolygon(room, cutout))),
		...floor.filter((item) => !isSeat(item))
	];
	for (const { polygon, bounds } of blockers) {
		const near = cellsNear(bounds, radius);
		for (let row = near.firstRow; row <= near.lastRow; row += 1) {
			for (let column = near.firstColumn; column <= near.lastColumn; column += 1) {
				const index = row * columns + column;
				if (open[index] && distanceToPolygon(center(column, row), polygon) < radius)
					open[index] = 0;
			}
		}
	}

	const queue: number[] = [];
	const seen = new Uint8Array(columns * rows);
	for (const door of doors) {
		const geometry = openingGeometry(room, door);
		const start = {
			x: (geometry.start.x + geometry.end.x) / 2 + geometry.inward.x * (radius + 5),
			y: (geometry.start.y + geometry.end.y) / 2 + geometry.inward.y * (radius + 5)
		};
		const column = Math.min(columns - 1, Math.max(0, Math.floor(start.x / ROUTE_GRID_CM)));
		const row = Math.min(rows - 1, Math.max(0, Math.floor(start.y / ROUTE_GRID_CM)));
		const index = row * columns + column;
		if (open[index] && !seen[index]) {
			seen[index] = 1;
			queue.push(index);
		}
	}

	for (let head = 0; head < queue.length; head += 1) {
		const index = queue[head];
		const row = Math.floor(index / columns);
		const column = index - row * columns;
		const neighbours = [
			column > 0 ? index - 1 : -1,
			column < columns - 1 ? index + 1 : -1,
			row > 0 ? index - columns : -1,
			row < rows - 1 ? index + columns : -1
		];
		for (const next of neighbours) {
			if (next >= 0 && open[next] && !seen[next]) {
				seen[next] = 1;
				queue.push(next);
			}
		}
	}

	// 좌석마다 둘레의 칸 중 문에서 닿은 칸이 있는지 봅니다.
	for (const seat of seats) {
		const near = cellsNear(seat.bounds, SEAT_REACH_CM);
		search: for (let row = near.firstRow; row <= near.lastRow; row += 1) {
			for (let column = near.firstColumn; column <= near.lastColumn; column += 1) {
				if (
					seen[row * columns + column] &&
					distanceToPolygon(center(column, row), seat.polygon) <= SEAT_REACH_CM
				) {
					reached.add(seat.data.id);
					break search;
				}
			}
		}
	}
	return reached;
}

interface PowerNode {
	item: Resolved;
	free: number;
	load: number;
	plugged: boolean;
}

function analyzePower(
	items: Resolved[],
	push: (finding: Omit<Finding, 'id'>) => void
): { connections: Connection[]; summary: PowerSummary } {
	const outlets: PowerNode[] = items
		.filter((item) => item.entry.kind === 'outlet')
		.map((item) => ({ item, free: item.entry.ports ?? 0, load: 0, plugged: true }));
	const strips: PowerNode[] = items
		.filter((item) => item.entry.kind === 'strip')
		.map((item) => ({ item, free: item.entry.ports ?? 0, load: 0, plugged: false }));
	const devices = items.filter((item) => item.entry.watts > 0 && !isPowerSource(item));
	const connections: Connection[] = [];
	const totalWatts = devices.reduce((sum, item) => sum + item.entry.watts, 0);
	const portsTotal = [...outlets, ...strips].reduce(
		(sum, node) => sum + (node.item.entry.ports ?? 0),
		0
	);

	const nearestFree = (from: Point, nodes: PowerNode[]) => {
		let best: { node: PowerNode; length: number } | null = null;
		for (const node of nodes) {
			if (node.free <= 0) continue;
			const length = distance(from, node.item.center);
			if (!best || length < best.length) best = { node, length };
		}
		return best;
	};

	const connect = (item: Resolved, node: PowerNode, length: number) => {
		node.free -= 1;
		const tooShort = length > item.entry.cable;
		connections.push({ fromId: item.data.id, toId: node.item.data.id, length, tooShort });
		if (tooShort) {
			push({
				code: 'cable-short',
				severity: 'warning',
				itemIds: [item.data.id, node.item.data.id],
				title: `${item.name} 케이블이 짧습니다`,
				detail: `${node.item.name}까지 약 ${Math.round(length)}cm인데 케이블은 ${item.entry.cable}cm입니다.`
			});
		}
	};

	/** 가까운 전원까지의 거리로 정렬합니다. 거리는 한 번만 구합니다(안정 정렬이라 순서는 그대로). */
	const byNearest = <T>(list: T[], center: (value: T) => Point, sources: Resolved[]): T[] =>
		list
			.map((value) => ({ value, length: nearest(center(value), sources)?.length ?? 0 }))
			.sort((a, b) => a.length - b.length)
			.map(({ value }) => value);

	const stripsByDistance = byNearest(
		strips,
		(strip) => strip.item.center,
		outlets.map((outlet) => outlet.item)
	);
	for (const strip of stripsByDistance) {
		const target = nearestFree(strip.item.center, outlets);
		if (target) {
			strip.plugged = true;
			connect(strip.item, target.node, target.length);
		} else {
			push({
				code: 'strip-unplugged',
				severity: 'warning',
				itemIds: [strip.item.data.id],
				title: `${josa(strip.item.name, '을', '를')} 꽂을 벽 콘센트가 없습니다`,
				detail: '벽 콘센트를 추가하거나 비어 있는 구를 만들어 주세요.'
			});
		}
	}

	const candidates = [...outlets, ...strips.filter((strip) => strip.plugged)];
	const ordered = byNearest(
		devices,
		(device) => device.center,
		candidates.map((node) => node.item)
	);
	const unpowered: Resolved[] = [];
	for (const device of ordered) {
		const target = nearestFree(device.center, candidates);
		if (!target) {
			unpowered.push(device);
			continue;
		}
		connect(device, target.node, target.length);
		target.node.load += device.entry.watts;
	}

	for (const connection of connections) {
		const strip = strips.find((node) => node.item.data.id === connection.fromId);
		const outlet = outlets.find((node) => node.item.data.id === connection.toId);
		if (strip && outlet) outlet.load += strip.load;
	}

	for (const node of [...outlets, ...strips]) {
		const rated = node.item.entry.ratedWatts ?? Infinity;
		if (node.load > rated) {
			push({
				code: 'over-capacity',
				severity: 'error',
				itemIds: [node.item.data.id],
				title: `${node.item.name}의 정격 전력을 넘었습니다`,
				detail: `연결된 기기 합계 ${node.load}W, 정격 ${rated}W입니다.`
			});
		}
	}

	if (devices.length > 0 && outlets.length === 0) {
		push({
			code: 'no-outlet',
			severity: 'warning',
			itemIds: [],
			title: '벽 콘센트가 없습니다',
			detail: '전원 분류에서 벽 콘센트를 추가하면 케이블 길이와 구 수를 점검합니다.'
		});
	} else if (unpowered.length > 0) {
		push({
			code: 'no-port',
			severity: 'error',
			itemIds: unpowered.map((item) => item.data.id),
			title: `콘센트 구 수가 ${unpowered.length}개 부족합니다`,
			detail: `전원을 꽂지 못한 기기: ${unpowered.map((item) => item.name).join(', ')}`
		});
	}

	return {
		connections,
		summary: {
			totalWatts,
			portsTotal,
			portsUsed: connections.length,
			devices: devices.length,
			connected: devices.length - unpowered.length
		}
	};
}

const SEVERITY_ORDER: Record<FindingSeverity, number> = { error: 0, warning: 1, ok: 2 };

export function analyzePlan(room: RoomData, data: readonly ItemData[]): Analysis {
	const items = data.map(resolveItem);
	const findings: Finding[] = [];
	/**
	 * id는 점검 종류와 물건으로만 정합니다. 다른 항목이 생기거나 사라져도 같은 항목의 id가 그대로라
	 * 점검 목록이 끄는 동안 통째로 다시 그려지지 않습니다. 같은 조합이 또 나오면(문 두 개가 같은 물건을
	 * 막는 경우 등) 순번을 붙입니다.
	 */
	const used = new Map<string, number>();
	const push = (finding: Omit<Finding, 'id'>) => {
		const base = `${finding.code}:${finding.itemIds.join(',')}`;
		const count = (used.get(base) ?? 0) + 1;
		used.set(base, count);
		findings.push({ ...finding, id: count === 1 ? base : `${base}#${count}` });
	};

	const supports = items.filter(isSupport);
	const supported = new Set(
		items
			.filter(
				(item) =>
					(item.entry.layer === 'surface' ||
						item.entry.layer === 'mat' ||
						item.entry.layer === 'mount') &&
					supports.some((support) => pointInConvex(item.center, support.polygon))
			)
			.map((item) => item.data.id)
	);
	/** 받침 없이 바닥에 놓인 PC·TV 등은 바닥 물건으로 겹침을 판정합니다. */
	const onFloor = (item: Resolved) =>
		item.entry.layer === 'floor' ||
		(item.entry.layer === 'surface' && !item.entry.requiresSupport && !supported.has(item.data.id));
	const floor = items.filter(onFloor);
	const surface = items.filter((item) => item.entry.layer === 'surface' && !onFloor(item));

	for (const item of items) {
		if (isOutsideRoom(room, item.polygon)) {
			push({
				code: 'out-of-room',
				severity: 'error',
				itemIds: [item.data.id],
				title: `${josa(item.name, '이', '가')} 방 밖으로 나갔습니다`,
				detail: '방 안으로 옮기거나 방 크기를 늘려 주세요.'
			});
		}
		if (item.entry.requiresSupport && !supported.has(item.data.id)) {
			push({
				code: 'no-support',
				severity: 'warning',
				itemIds: [item.data.id],
				title: `${josa(item.name, '을', '를')} 받칠 가구가 없습니다`,
				detail: '책상이나 TV장 위로 옮겨 주세요.'
			});
		}
	}

	for (const group of [floor, surface]) {
		for (let i = 0; i < group.length; i += 1) {
			for (let j = i + 1; j < group.length; j += 1) {
				const [a, b] = [group[i], group[j]];
				const tucked = canShareSpace(a.entry.kind, b.entry.kind);
				if (!tucked && overlaps(a, b)) {
					push({
						code: 'overlap',
						severity: 'error',
						itemIds: [a.data.id, b.data.id],
						title: `${josa(a.name, '과', '와')} ${josa(b.name, '이', '가')} 겹칩니다`,
						detail: '둘 중 하나를 옮겨 주세요.'
					});
				}
			}
		}
	}

	for (const opening of room.openings) {
		if (opening.kind !== 'door') continue;
		const swing = shapeOf(openingGeometry(room, opening).swing);
		for (const item of floor) {
			if (overlaps(item, swing)) {
				push({
					code: 'door-swing',
					severity: 'error',
					itemIds: [item.data.id],
					title: `${josa(item.name, '이', '가')} 문을 막습니다`,
					detail: '문이 여닫히는 영역 밖으로 옮겨 주세요.'
				});
			}
		}
	}

	const seats = items.filter(isSeat);
	for (const chair of seats.filter((seat) => seat.entry.kind === 'chair')) {
		const clearance = chairClearance(room, chair, floor);
		if (clearance < CHAIR_CLEARANCE_CM) {
			push({
				code: 'chair-clearance',
				severity: 'warning',
				itemIds: [chair.data.id],
				title: `${josa(chair.name, '을', '를')} 뒤로 뺄 공간이 부족합니다`,
				detail: `뒤쪽 여유 ${clearance}cm, 권장 ${CHAIR_CLEARANCE_CM}cm입니다.`
			});
		} else {
			push({
				code: 'chair-clearance',
				severity: 'ok',
				itemIds: [chair.data.id],
				title: `${chair.name} 뒤 여유 공간 충분`,
				detail: `뒤쪽으로 ${CHAIR_CLEARANCE_CM}cm 이상 비어 있습니다.`
			});
		}
	}

	if (seats.length > 0 && room.openings.some((opening) => opening.kind === 'door')) {
		const reached = reachableSeats(room, floor, seats);
		for (const seat of seats) {
			if (reached.has(seat.data.id)) continue;
			push({
				code: 'blocked-route',
				severity: 'warning',
				itemIds: [seat.data.id],
				title: `문에서 ${seat.name}까지 갈 통로가 없습니다`,
				detail: `폭 ${PASSAGE_WIDTH_CM}cm로 지나갈 길이 막혀 있습니다.`
			});
		}
	}

	for (const screen of items.filter((item) => item.entry.diagonalInch)) {
		const seat = nearest(screen.center, seats);
		if (!seat) continue;
		const isTv = screen.entry.kind === 'tv';
		const range = isTv ? viewingRange(screen.entry.diagonalInch ?? 0) : MONITOR_RANGE_CM;
		const length = Math.round(seat.length);
		const inRange = length >= range.min && length <= range.max;
		push({
			code: isTv ? 'tv-distance' : 'monitor-distance',
			severity: inRange ? 'ok' : 'warning',
			itemIds: [screen.data.id, seat.item.data.id],
			title: inRange
				? `${screen.name} 시청 거리 적정`
				: `${josa(screen.name, '이', '가')} ${length < range.min ? '너무 가깝습니다' : '너무 멉니다'}`,
			detail: `${seat.item.name}까지 ${length}cm, 권장 ${range.min}~${range.max}cm입니다.`
		});
	}

	const { connections, summary } = analyzePower(items, push);

	findings.sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]);
	return {
		findings,
		connections,
		power: summary,
		cost: data.reduce((sum, item) => sum + item.price, 0),
		errorCount: findings.filter((finding) => finding.severity === 'error').length,
		warningCount: findings.filter((finding) => finding.severity === 'warning').length
	};
}
