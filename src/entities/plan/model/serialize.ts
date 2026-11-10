import { createId } from '#shared/lib/id';
import { findCatalogEntry, SPEC_LIMITS } from './catalog';
import { CUSTOM_LIMITS, parseCustomEntry } from './custom';
import { cutoutLimits, PLAN_LIMITS, ROOM_LIMITS, wallRange } from './room';
import type {
	CatalogEntry,
	Corner,
	Cutout,
	Underlay,
	ItemData,
	ItemSpecs,
	Opening,
	PlanData,
	RoomData,
	SpecKey,
	Wall
} from './types';

export type ParseResult = { ok: true; plan: PlanData } | { ok: false; error: string };

const WALLS: readonly Wall[] = ['north', 'east', 'south', 'west'];
const COORDINATE_LIMIT = 10000;

const isRecord = (value: unknown): value is Record<string, unknown> =>
	typeof value === 'object' && value !== null && !Array.isArray(value);

const finite = (value: unknown): value is number =>
	typeof value === 'number' && Number.isFinite(value);

const CORNERS: readonly Corner[] = ['nw', 'ne', 'se', 'sw'];

function parseCutouts(raw: unknown, width: number, depth: number): Cutout[] | null {
	if (raw === undefined) return [];
	if (!Array.isArray(raw) || raw.length > CORNERS.length) return null;
	const cutouts: Cutout[] = [];
	for (const entry of raw) {
		if (!isRecord(entry) || !CORNERS.includes(entry.corner as Corner)) return null;
		const corner = entry.corner as Corner;
		if (cutouts.some((cutout) => cutout.corner === corner)) return null;
		if (!finite(entry.width) || !finite(entry.depth)) return null;
		const limits = cutoutLimits({ width, depth, cutouts }, corner);
		if (
			entry.width < limits.min ||
			entry.depth < limits.min ||
			entry.width > limits.maxWidth ||
			entry.depth > limits.maxDepth
		) {
			return null;
		}
		cutouts.push({ id: createId(), corner, width: entry.width, depth: entry.depth });
	}
	return cutouts;
}

const UNDERLAY_SRC = /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/;
const MAX_UNDERLAY_CHARS = 8_000_000;

function parseUnderlay(raw: unknown): Underlay | undefined | null {
	if (raw === undefined) return undefined;
	if (!isRecord(raw)) return null;
	const { src, pixelWidth, pixelHeight, x, y, cmPerPixel, opacity } = raw;
	if (typeof src !== 'string' || src.length > MAX_UNDERLAY_CHARS || !UNDERLAY_SRC.test(src)) {
		return null;
	}
	if (![pixelWidth, pixelHeight, x, y, cmPerPixel, opacity].every(finite)) return null;
	const size = [pixelWidth, pixelHeight, cmPerPixel] as number[];
	if (size.some((value) => value <= 0)) return null;
	if ((opacity as number) < 0 || (opacity as number) > 1) return null;
	return {
		src,
		pixelWidth: pixelWidth as number,
		pixelHeight: pixelHeight as number,
		x: x as number,
		y: y as number,
		cmPerPixel: cmPerPixel as number,
		opacity: opacity as number
	};
}

function parseOpening(
	raw: unknown,
	room: Pick<RoomData, 'width' | 'depth' | 'cutouts'>
): Opening | null {
	if (!isRecord(raw)) return null;
	const { kind, wall, offset, width, hinge } = raw;
	if (kind !== 'door' && kind !== 'window') return null;
	if (!WALLS.includes(wall as Wall) || !finite(offset) || !finite(width)) return null;
	const range = wallRange(room, wall as Wall);
	if (width <= 0 || offset < range.start || offset + width > range.end) return null;
	return {
		id: createId(),
		kind,
		wall: wall as Wall,
		offset,
		width,
		hinge: hinge === 'end' ? 'end' : 'start'
	};
}

function parseSpecs(raw: unknown): ItemSpecs | undefined | null {
	if (raw === undefined) return undefined;
	if (!isRecord(raw)) return null;
	const specs: ItemSpecs = {};
	for (const key of Object.keys(SPEC_LIMITS) as SpecKey[]) {
		const value = raw[key];
		if (value === undefined) continue;
		if (!finite(value) || value < SPEC_LIMITS[key].min || value > SPEC_LIMITS[key].max) return null;
		specs[key] = value;
	}
	return Object.keys(specs).length > 0 ? specs : undefined;
}

function parseItem(raw: unknown, customIds: ReadonlySet<string>): ItemData | null {
	if (!isRecord(raw) || typeof raw.catalogId !== 'string') return null;
	if (!findCatalogEntry(raw.catalogId) && !customIds.has(raw.catalogId)) return null;
	const { x, y, rotation, price, label } = raw;
	if (!finite(x) || !finite(y) || !finite(rotation)) return null;
	if (Math.abs(x) > COORDINATE_LIMIT || Math.abs(y) > COORDINATE_LIMIT) return null;
	const specs = parseSpecs(raw.specs);
	if (specs === null) return null;
	return {
		id: createId(),
		catalogId: raw.catalogId,
		x,
		y,
		rotation,
		price: finite(price) && price >= 0 ? price : 0,
		label: typeof label === 'string' ? label.slice(0, 40) : '',
		...(specs ? { specs } : {})
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
	if (openings.length > PLAN_LIMITS.openings || raw.items.length > PLAN_LIMITS.items) {
		return {
			ok: false,
			error: `문·창문은 ${PLAN_LIMITS.openings}개, 물건은 ${PLAN_LIMITS.items}개까지 불러올 수 있습니다.`
		};
	}
	const cutouts = parseCutouts(raw.room.cutouts, width, depth);
	if (!cutouts) {
		return { ok: false, error: '잘라 낸 모서리의 크기나 위치가 올바르지 않습니다.' };
	}
	const underlay = parseUnderlay(raw.underlay);
	if (underlay === null) {
		return { ok: false, error: '평면도 이미지 정보가 올바르지 않습니다.' };
	}
	const parsedOpenings = openings.map((opening) =>
		parseOpening(opening, { width, depth, cutouts })
	);
	if (parsedOpenings.some((opening) => opening === null)) {
		return { ok: false, error: '문이나 창문의 위치가 벽을 벗어났습니다.' };
	}
	const rawCustom = raw.customEntries ?? [];
	if (!Array.isArray(rawCustom) || rawCustom.length > CUSTOM_LIMITS.entries) {
		return { ok: false, error: '직접 등록한 제품 정보가 올바르지 않습니다.' };
	}
	const customEntries = rawCustom.map(parseCustomEntry);
	if (customEntries.some((entry) => entry === null)) {
		return { ok: false, error: '직접 등록한 제품 정보가 올바르지 않습니다.' };
	}
	const customIds = new Set(customEntries.map((entry) => entry!.id));
	const items = raw.items.map((item) => parseItem(item, customIds));
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
			room: {
				width,
				depth,
				openings: parsedOpenings as Opening[],
				...(cutouts.length > 0 ? { cutouts } : {})
			},
			...(underlay ? { underlay } : {}),
			...(customEntries.length > 0 ? { customEntries: customEntries as CatalogEntry[] } : {}),
			items: items as ItemData[]
		}
	};
}

export function stringifyPlan(plan: PlanData): string {
	return JSON.stringify(plan, null, 2);
}
