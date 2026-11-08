import { createId } from '#shared/lib/id';
import { findCatalogEntry } from './catalog';
import { ROOM_LIMITS, wallLength } from './room';
import type { ItemData, Opening, PlanData, RoomData, Wall } from './types';

export type ParseResult = { ok: true; plan: PlanData } | { ok: false; error: string };

const WALLS: readonly Wall[] = ['north', 'east', 'south', 'west'];
const COORDINATE_LIMIT = 10000;

const isRecord = (value: unknown): value is Record<string, unknown> =>
	typeof value === 'object' && value !== null && !Array.isArray(value);

const finite = (value: unknown): value is number =>
	typeof value === 'number' && Number.isFinite(value);

function parseOpening(raw: unknown, room: Pick<RoomData, 'width' | 'depth'>): Opening | null {
	if (!isRecord(raw)) return null;
	const { kind, wall, offset, width, hinge } = raw;
	if (kind !== 'door' && kind !== 'window') return null;
	if (!WALLS.includes(wall as Wall) || !finite(offset) || !finite(width)) return null;
	const length = wallLength(room, wall as Wall);
	if (width <= 0 || width > length || offset < 0 || offset + width > length) return null;
	return {
		id: createId(),
		kind,
		wall: wall as Wall,
		offset,
		width,
		hinge: hinge === 'end' ? 'end' : 'start'
	};
}

function parseItem(raw: unknown): ItemData | null {
	if (!isRecord(raw) || typeof raw.catalogId !== 'string') return null;
	if (!findCatalogEntry(raw.catalogId)) return null;
	const { x, y, rotation, price, label } = raw;
	if (!finite(x) || !finite(y) || !finite(rotation)) return null;
	if (Math.abs(x) > COORDINATE_LIMIT || Math.abs(y) > COORDINATE_LIMIT) return null;
	return {
		id: createId(),
		catalogId: raw.catalogId,
		x,
		y,
		rotation,
		price: finite(price) && price >= 0 ? price : 0,
		label: typeof label === 'string' ? label.slice(0, 40) : ''
	};
}

/** 사용자가 고른 파일은 믿지 않고 항목마다 검사합니다. 불러올 때 id는 새로 만듭니다. */
export function parsePlan(text: string): ParseResult {
	let raw: unknown;
	try {
		raw = JSON.parse(text);
	} catch {
		return { ok: false, error: 'JSON 형식이 아닙니다. V에서 내보낸 파일을 골라 주세요.' };
	}
	if (!isRecord(raw) || raw.version !== 1 || !isRecord(raw.room)) {
		return { ok: false, error: 'V 배치도 파일이 아닙니다. 버전 1 파일만 불러올 수 있습니다.' };
	}
	const { width, depth, openings } = raw.room;
	const validSize = (value: unknown): value is number =>
		finite(value) && value >= ROOM_LIMITS.min && value <= ROOM_LIMITS.max;
	if (!validSize(width) || !validSize(depth)) {
		return {
			ok: false,
			error: `방 크기는 ${ROOM_LIMITS.min}~${ROOM_LIMITS.max}cm여야 합니다.`
		};
	}
	if (!Array.isArray(openings) || !Array.isArray(raw.items)) {
		return { ok: false, error: '문·창문이나 물건 목록이 빠져 있습니다.' };
	}
	const parsedOpenings = openings.map((opening) => parseOpening(opening, { width, depth }));
	if (parsedOpenings.some((opening) => opening === null)) {
		return { ok: false, error: '문이나 창문의 위치가 벽을 벗어났습니다.' };
	}
	const items = raw.items.map(parseItem);
	if (items.some((item) => item === null)) {
		return { ok: false, error: '알 수 없는 물건이나 잘못된 좌표가 들어 있습니다.' };
	}
	return {
		ok: true,
		plan: {
			version: 1,
			id: createId(),
			name:
				typeof raw.name === 'string' && raw.name.trim()
					? raw.name.trim().slice(0, 60)
					: '불러온 배치도',
			updatedAt: Date.now(),
			room: { width, depth, openings: parsedOpenings as Opening[] },
			items: items as ItemData[]
		}
	};
}

export function stringifyPlan(plan: PlanData): string {
	return JSON.stringify(plan, null, 2);
}
