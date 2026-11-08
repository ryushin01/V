import { boundsOf, corners, localToWorld, polygonsOverlap } from '#shared/lib/geometry';
import { getCatalogEntry, resolveEntry } from './catalog';
import { isOutsideRoom, snapToWall } from './room';
import type { CatalogEntry, ItemData, RoomData } from './types';

const GRID_CM = 10;

function polygonFor(entry: CatalogEntry, x: number, y: number, rotation = 0) {
	return corners({ cx: x, cy: y, width: entry.width, depth: entry.depth, rotation });
}

/** 새 물건을 겹치지 않는 자리에 놓습니다. 빈자리가 없으면 방 가운데에 둡니다. */
export function findFreeSpot(
	room: RoomData,
	items: readonly ItemData[],
	entry: CatalogEntry
): { x: number; y: number; rotation: number } {
	const sameLayer = items
		.map((item) => ({ item, entry: resolveEntry(item) }))
		.filter((other) => other.entry.layer === entry.layer);
	const collides = (x: number, y: number, rotation: number) => {
		const polygon = polygonFor(entry, x, y, rotation);
		return sameLayer.some((other) =>
			polygonsOverlap(
				polygon,
				polygonFor(other.entry, other.item.x, other.item.y, other.item.rotation)
			)
		);
	};

	if (entry.layer === 'wall') {
		for (let x = entry.width; x <= room.width - entry.width; x += GRID_CM * 3) {
			const spot = snapToWall(room, x, 0, entry.depth, entry.width);
			if (!collides(spot.x, spot.y, spot.rotation)) return spot;
		}
		return snapToWall(room, room.width / 2, room.depth, entry.depth, entry.width);
	}

	if (entry.layer === 'surface') {
		const supports = items.filter((item) => {
			const kind = getCatalogEntry(item.catalogId).kind;
			return kind === 'desk' || kind === 'stand';
		});
		for (const support of supports) {
			const supportEntry = resolveEntry(support);
			const rect = {
				cx: support.x,
				cy: support.y,
				width: supportEntry.width,
				depth: supportEntry.depth,
				rotation: support.rotation
			};
			const halfW = (supportEntry.width - entry.width) / 2;
			const halfD = (supportEntry.depth - entry.depth) / 2;
			for (let ly = -halfD; ly <= halfD; ly += GRID_CM) {
				for (let offset = 0; offset <= halfW; offset += GRID_CM) {
					for (const lx of offset === 0 ? [0] : [offset, -offset]) {
						const world = localToWorld(rect, lx, ly);
						if (!collides(world.x, world.y, support.rotation)) {
							return { x: world.x, y: world.y, rotation: support.rotation };
						}
					}
				}
			}
		}
	}

	const halfW = entry.width / 2;
	const halfD = entry.depth / 2;
	for (let y = halfD; y <= room.depth - halfD; y += GRID_CM) {
		for (let x = halfW; x <= room.width - halfW; x += GRID_CM) {
			if (!collides(x, y, 0) && !isOutsideRoom(room, polygonFor(entry, x, y))) {
				return { x, y, rotation: 0 };
			}
		}
	}
	return { x: room.width / 2, y: room.depth / 2, rotation: 0 };
}

export function halfExtents(entry: CatalogEntry, rotation: number): { hx: number; hy: number } {
	const bounds = boundsOf(polygonFor(entry, 0, 0, rotation));
	return { hx: bounds.maxX, hy: bounds.maxY };
}
