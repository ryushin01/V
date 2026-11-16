import { describe, expect, it } from 'vitest';
import { analyzePlan } from './analysis';
import { analyzePlanLegacy } from './analysis.legacy';
import type { Analysis } from './types';
import { CATALOG } from './catalog';
import { cutoutLimits, ROOM_LIMITS, wallRange } from './room';
import type { Corner, ItemData, Opening, RoomData, Wall } from './types';

/** 같은 씨앗이면 같은 배치를 만드는 난수(mulberry32)입니다. */
function random(seed: number) {
	let state = seed >>> 0;
	return () => {
		state = (state + 0x6d2b79f5) >>> 0;
		let t = state;
		t = Math.imul(t ^ (t >>> 15), t | 1);
		t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
}

/**
 * 점검 항목의 id만 0.9.0에서 바뀌었습니다(순번 → 종류·물건). 나머지(종류, 심각도, 물건, 문구, 순서,
 * 전원 연결, 합계)는 바이트 단위로 같아야 합니다.
 */
const withoutIds = (analysis: Analysis) =>
	JSON.stringify({
		...analysis,
		findings: analysis.findings.map((finding) => ({ ...finding, id: undefined }))
	});

const WALLS: Wall[] = ['north', 'east', 'south', 'west'];
const CORNERS: Corner[] = ['nw', 'ne', 'se', 'sw'];

function makePlan(seed: number, maxSize: number, maxItems: number) {
	const next = random(seed);
	const pick = <T>(list: readonly T[]) => list[Math.floor(next() * list.length)];
	const between = (min: number, max: number) => min + next() * (max - min);

	const room: RoomData = {
		width: Math.round(between(ROOM_LIMITS.min, maxSize)),
		depth: Math.round(between(ROOM_LIMITS.min, maxSize)),
		openings: []
	};
	const cutouts = [];
	for (const corner of CORNERS) {
		if (next() > 0.25) continue;
		const limits = cutoutLimits({ ...room, cutouts }, corner);
		if (limits.maxWidth < limits.min || limits.maxDepth < limits.min) continue;
		cutouts.push({
			id: `cut-${corner}`,
			corner,
			width: Math.round(between(limits.min, limits.maxWidth)),
			depth: Math.round(between(limits.min, limits.maxDepth))
		});
	}
	if (cutouts.length > 0) room.cutouts = cutouts;
	const openingCount = Math.floor(next() * 4);
	for (let index = 0; index < openingCount; index += 1) {
		const wall = pick(WALLS);
		const range = wallRange(room, wall);
		const width = Math.min(range.end - range.start, Math.round(between(60, 160)));
		const opening: Opening = {
			id: `opening-${index}`,
			kind: next() < 0.7 ? 'door' : 'window',
			wall,
			offset: Math.round(between(range.start, range.end - width)),
			width,
			hinge: next() < 0.5 ? 'start' : 'end'
		};
		room.openings.push(opening);
	}

	const items: ItemData[] = [];
	const count = Math.floor(next() * (maxItems + 1));
	for (let index = 0; index < count; index += 1) {
		const entry = pick(CATALOG);
		const item: ItemData = {
			id: `item-${index}`,
			catalogId: entry.id,
			label: next() < 0.1 ? `이름 ${index}` : '',
			// 방 밖으로 조금 나간 물건도 섞습니다.
			x: Math.round(between(-30, room.width + 30) * 10) / 10,
			y: Math.round(between(-30, room.depth + 30) * 10) / 10,
			rotation: next() < 0.6 ? Math.floor(next() * 24) * 15 : Math.round(next() * 359),
			price: Math.floor(next() * 5) * 10000
		};
		if (next() < 0.15) item.specs = { width: Math.round(between(10, 200)) };
		items.push(item);
	}
	// 같은 자리에 겹쳐 놓은 물건과 책상 위 물건도 섞습니다.
	if (items.length > 2 && next() < 0.5) items.push({ ...items[0], id: 'twin', rotation: 0 });
	return { room, items };
}

describe('점검 계산을 빠르게 바꾼 뒤에도 결과가 같습니다', () => {
	it('작은 방부터 큰 방까지 무작위 배치 400개', () => {
		for (let seed = 1; seed <= 400; seed += 1) {
			const { room, items } = makePlan(seed, seed % 4 === 0 ? ROOM_LIMITS.max : 700, 40);
			const expected = withoutIds(analyzePlanLegacy(room, items));
			const actual = withoutIds(analyzePlan(room, items));
			if (actual !== expected) throw new Error(`씨앗 ${seed}에서 결과가 다릅니다`);
		}
	});

	it('가장 큰 방에 물건을 많이 놓은 배치', () => {
		for (let seed = 1000; seed < 1004; seed += 1) {
			const { room, items } = makePlan(seed, ROOM_LIMITS.max, 200);
			room.width = ROOM_LIMITS.max;
			room.depth = ROOM_LIMITS.max;
			room.cutouts = undefined;
			room.openings = [
				{ id: 'door', kind: 'door', wall: 'south', offset: 40, width: 90, hinge: 'start' }
			];
			expect(withoutIds(analyzePlan(room, items))).toBe(withoutIds(analyzePlanLegacy(room, items)));
		}
	});

	it('경계 상자가 거의 맞닿은 회전 물건도 분리축 판정과 같습니다', () => {
		const room: RoomData = { width: 600, depth: 600, openings: [] };
		for (let step = 0; step <= 80; step += 1) {
			const gap = step * 0.025;
			const items: ItemData[] = [
				{ id: 'a', catalogId: 'desk-140', label: '', x: 200, y: 300, rotation: 45, price: 0 },
				{
					id: 'b',
					catalogId: 'desk-140',
					label: '',
					x: 200 + Math.SQRT2 * 105 + gap,
					y: 300,
					rotation: 45,
					price: 0
				}
			];
			expect(withoutIds(analyzePlan(room, items))).toBe(withoutIds(analyzePlanLegacy(room, items)));
		}
	});
});

describe('점검 항목 id', () => {
	it('한 배치 안에서 겹치지 않습니다', () => {
		for (let seed = 1; seed <= 200; seed += 1) {
			const { room, items } = makePlan(seed, 700, 40);
			const ids = analyzePlan(room, items).findings.map((finding) => finding.id);
			expect(new Set(ids).size).toBe(ids.length);
		}
	});

	it('다른 항목이 생기거나 사라져도 그대로입니다', () => {
		for (let seed = 1; seed <= 100; seed += 1) {
			const { room, items } = makePlan(seed, 700, 30);
			const before = analyzePlan(room, items).findings.map((finding) => finding.id);
			// 방 밖에 겹친 책상 두 개를 더하면 앞쪽 순서에 오류가 끼어듭니다.
			const extra: ItemData[] = [
				{
					id: 'extra-a',
					catalogId: 'desk-140',
					label: '',
					x: -500,
					y: -500,
					rotation: 0,
					price: 0
				},
				{ id: 'extra-b', catalogId: 'desk-140', label: '', x: -480, y: -500, rotation: 0, price: 0 }
			];
			const after = new Set(analyzePlan(room, [...extra, ...items]).findings.map((f) => f.id));
			for (const id of before) expect(after.has(id), `씨앗 ${seed}: ${id}`).toBe(true);
		}
	});
});
