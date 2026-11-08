import { boundsOf, polygonsOverlap, type Point } from '#shared/lib/geometry';
import type { Corner, Cutout, Opening, RoomData, Wall } from './types';

export const ROOM_LIMITS = { min: 150, max: 1500 } as const;
/** 편집과 파일 불러오기에 함께 쓰는 개수 한도입니다. */
export const PLAN_LIMITS = { items: 500, openings: 40 } as const;

export const WALL_LABELS: Record<Wall, string> = {
	north: '위쪽 벽',
	east: '오른쪽 벽',
	south: '아래쪽 벽',
	west: '왼쪽 벽'
};

export const CORNER_LABELS: Record<Corner, string> = {
	ne: '오른쪽 위',
	nw: '왼쪽 위',
	se: '오른쪽 아래',
	sw: '왼쪽 아래'
};

type RoomShape = Pick<RoomData, 'width' | 'depth' | 'cutouts'>;

const MIN_CUTOUT_CM = 30;
/** 잘라 낸 뒤에도 남겨야 하는 폭입니다. */
const MIN_REMAINING_CM = 60;
const ROOM_TOLERANCE_CM = 0.5;

function cutoutAt(room: RoomShape, corner: Corner): Cutout | undefined {
	return room.cutouts?.find((cutout) => cutout.corner === corner);
}

/** 다른 모서리와 겹치지 않고 통로 폭이 남도록 잘라 낼 크기의 범위를 구합니다. */
export function cutoutLimits(room: RoomShape, corner: Corner) {
	const others = (room.cutouts ?? []).filter((cutout) => cutout.corner !== corner);
	return {
		min: MIN_CUTOUT_CM,
		maxWidth: room.width - MIN_REMAINING_CM - Math.max(0, ...others.map((c) => c.width)),
		maxDepth: room.depth - MIN_REMAINING_CM - Math.max(0, ...others.map((c) => c.depth))
	};
}

export function cutoutPolygon(room: RoomShape, cutout: Cutout): Point[] {
	const left = cutout.corner === 'nw' || cutout.corner === 'sw' ? 0 : room.width - cutout.width;
	const top = cutout.corner === 'nw' || cutout.corner === 'ne' ? 0 : room.depth - cutout.depth;
	return [
		{ x: left, y: top },
		{ x: left + cutout.width, y: top },
		{ x: left + cutout.width, y: top + cutout.depth },
		{ x: left, y: top + cutout.depth }
	];
}

/** 왼쪽 위에서 시계 방향으로 도는 방의 윤곽선입니다. */
export function roomOutline(room: RoomShape): Point[] {
	const { width: w, depth: d } = room;
	const nw = cutoutAt(room, 'nw');
	const ne = cutoutAt(room, 'ne');
	const se = cutoutAt(room, 'se');
	const sw = cutoutAt(room, 'sw');
	return [
		...(nw
			? [
					{ x: 0, y: nw.depth },
					{ x: nw.width, y: nw.depth },
					{ x: nw.width, y: 0 }
				]
			: [{ x: 0, y: 0 }]),
		...(ne
			? [
					{ x: w - ne.width, y: 0 },
					{ x: w - ne.width, y: ne.depth },
					{ x: w, y: ne.depth }
				]
			: [{ x: w, y: 0 }]),
		...(se
			? [
					{ x: w, y: d - se.depth },
					{ x: w - se.width, y: d - se.depth },
					{ x: w - se.width, y: d }
				]
			: [{ x: w, y: d }]),
		...(sw
			? [
					{ x: sw.width, y: d },
					{ x: sw.width, y: d - sw.depth },
					{ x: 0, y: d - sw.depth }
				]
			: [{ x: 0, y: d }])
	];
}

export function isOutsideRoom(room: RoomShape, polygon: Point[]): boolean {
	const bounds = boundsOf(polygon);
	if (
		bounds.minX < -ROOM_TOLERANCE_CM ||
		bounds.minY < -ROOM_TOLERANCE_CM ||
		bounds.maxX > room.width + ROOM_TOLERANCE_CM ||
		bounds.maxY > room.depth + ROOM_TOLERANCE_CM
	) {
		return true;
	}
	return (room.cutouts ?? []).some((cutout) =>
		polygonsOverlap(polygon, cutoutPolygon(room, cutout))
	);
}

/** 잘라 낸 부분을 뺀, 벽에서 실제로 쓸 수 있는 구간입니다. */
export function wallRange(room: RoomShape, wall: Wall): { start: number; end: number } {
	const [startCorner, endCorner]: [Corner, Corner] =
		wall === 'north'
			? ['nw', 'ne']
			: wall === 'south'
				? ['sw', 'se']
				: wall === 'west'
					? ['nw', 'sw']
					: ['ne', 'se'];
	const horizontal = wall === 'north' || wall === 'south';
	const size = (corner: Corner) => {
		const cutout = cutoutAt(room, corner);
		return cutout ? (horizontal ? cutout.width : cutout.depth) : 0;
	};
	return {
		start: size(startCorner),
		end: (horizontal ? room.width : room.depth) - size(endCorner)
	};
}

export function wallLength(room: Pick<RoomData, 'width' | 'depth'>, wall: Wall): number {
	return wall === 'north' || wall === 'south' ? room.width : room.depth;
}

export interface OpeningGeometry {
	start: Point;
	end: Point;
	inward: Point;
	hinge: Point;
	free: Point;
	/** 문을 90도 열었을 때 문짝 끝 */
	leafEnd: Point;
	/** 문이 여닫히는 정사각형 영역 */
	swing: Point[];
}

export function openingGeometry(
	room: Pick<RoomData, 'width' | 'depth'>,
	opening: Opening
): OpeningGeometry {
	const { wall, offset, width } = opening;
	const start: Point =
		wall === 'north'
			? { x: offset, y: 0 }
			: wall === 'south'
				? { x: offset, y: room.depth }
				: wall === 'west'
					? { x: 0, y: offset }
					: { x: room.width, y: offset };
	const direction: Point = wall === 'north' || wall === 'south' ? { x: 1, y: 0 } : { x: 0, y: 1 };
	const inward: Point =
		wall === 'north'
			? { x: 0, y: 1 }
			: wall === 'south'
				? { x: 0, y: -1 }
				: wall === 'west'
					? { x: 1, y: 0 }
					: { x: -1, y: 0 };
	const end = { x: start.x + direction.x * width, y: start.y + direction.y * width };
	const hinge = opening.hinge === 'start' ? start : end;
	const free = opening.hinge === 'start' ? end : start;
	const leafEnd = { x: hinge.x + inward.x * width, y: hinge.y + inward.y * width };
	const swing = [
		start,
		end,
		{ x: end.x + inward.x * width, y: end.y + inward.y * width },
		{ x: start.x + inward.x * width, y: start.y + inward.y * width }
	];
	return { start, end, inward, hinge, free, leafEnd, swing };
}

/** 콘센트는 항상 가장 가까운 벽에 붙습니다. */
export function snapToWall(
	room: RoomShape,
	x: number,
	y: number,
	depth: number,
	width: number
): { x: number; y: number; rotation: number } {
	const distances: [Wall, number][] = [
		['north', y],
		['south', room.depth - y],
		['west', x],
		['east', room.width - x]
	];
	distances.sort((a, b) => a[1] - b[1]);
	const wall = distances[0][0];
	const range = wallRange(room, wall);
	const along = (value: number) =>
		Math.min(range.end - width / 2, Math.max(range.start + width / 2, value));
	if (wall === 'north') return { x: along(x), y: depth / 2, rotation: 0 };
	if (wall === 'south') return { x: along(x), y: room.depth - depth / 2, rotation: 180 };
	if (wall === 'west') return { x: depth / 2, y: along(y), rotation: 270 };
	return { x: room.width - depth / 2, y: along(y), rotation: 90 };
}
