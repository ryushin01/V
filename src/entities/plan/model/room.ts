import type { Point } from '#shared/lib/geometry';
import type { Opening, RoomData, Wall } from './types';

export const ROOM_LIMITS = { min: 150, max: 1500 } as const;

export const WALL_LABELS: Record<Wall, string> = {
	north: '위쪽 벽',
	east: '오른쪽 벽',
	south: '아래쪽 벽',
	west: '왼쪽 벽'
};

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
	room: Pick<RoomData, 'width' | 'depth'>,
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
	const clampX = Math.min(room.width - width / 2, Math.max(width / 2, x));
	const clampY = Math.min(room.depth - width / 2, Math.max(width / 2, y));
	if (wall === 'north') return { x: clampX, y: depth / 2, rotation: 0 };
	if (wall === 'south') return { x: clampX, y: room.depth - depth / 2, rotation: 180 };
	if (wall === 'west') return { x: depth / 2, y: clampY, rotation: 270 };
	return { x: room.width - depth / 2, y: clampY, rotation: 90 };
}
