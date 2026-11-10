import { describe, expect, it } from 'vitest';
import { getCatalogEntry, registerCustomEntries } from './catalog';
import { createCustomEntry, KIND_PRESETS, parseCustomEntry } from './custom';
import { parsePlan, stringifyPlan } from './serialize';
import { createEmptyPlan } from './factory';
import { analyzePlan } from './analysis';

const input = {
	name: '내 책상',
	brand: '공방',
	kind: 'desk' as const,
	width: 150,
	depth: 75,
	watts: 0,
	cable: 0,
	glyph: 'mattz'
};

describe('직접 등록 제품', () => {
	it('층과 분류는 종류가 정합니다', () => {
		const mouse = createCustomEntry({
			...input,
			kind: 'mouse',
			glyph: 'trackball',
			width: 8,
			depth: 12
		});
		expect(mouse).toMatchObject({
			custom: true,
			layer: 'surface',
			category: 'input',
			requiresSupport: true,
			glyph: 'trackball'
		});
		expect(mouse.id).toMatch(/^custom-/);
	});

	it('종류에 없는 그림은 기본 그림으로 바꿉니다', () => {
		expect(createCustomEntry({ ...input, glyph: 'trackball' }).glyph).toBeUndefined();
		expect(createCustomEntry({ ...input, kind: 'keyboard', glyph: 'x' }).glyph).toBe(
			KIND_PRESETS.keyboard.glyphs[0].id
		);
	});

	it('범위를 벗어난 치수는 허용 범위로 맞춥니다', () => {
		expect(createCustomEntry({ ...input, width: 9999 }).width).toBe(500);
	});

	it('화면 크기를 비워 두면 27인치로 저장합니다', () => {
		expect(createCustomEntry({ ...input, kind: 'monitor', glyph: '' }).diagonalInch).toBe(27);
	});

	it('멀티탭은 구 수와 정격을 가집니다', () => {
		expect(createCustomEntry({ ...input, kind: 'strip', ports: 8 })).toMatchObject({
			ports: 8,
			ratedWatts: 2500,
			layer: 'cable'
		});
	});

	it('파일에서 온 정의를 검사합니다', () => {
		const entry = createCustomEntry(input);
		expect(parseCustomEntry(JSON.parse(JSON.stringify(entry)))).toMatchObject({
			id: entry.id,
			width: 150
		});
		expect(parseCustomEntry({ ...entry, id: '../evil' })).toBeNull();
		expect(parseCustomEntry({ ...entry, kind: 'rocket' })).toBeNull();
		expect(parseCustomEntry({ ...entry, kind: 'constructor' })).toBeNull();
		expect(parseCustomEntry({ ...entry, kind: 'toString' })).toBeNull();
		expect(parseCustomEntry({ ...entry, width: -5 })).toBeNull();
		expect(parseCustomEntry({ ...entry, name: '' })).toBeNull();
		// 층·분류는 파일 값을 믿지 않고 종류에서 다시 정합니다.
		expect(parseCustomEntry({ ...entry, layer: 'mount' })?.layer).toBe('floor');
	});

	it('배치도 파일에 함께 담겨 다른 브라우저에서도 열립니다', () => {
		const entry = createCustomEntry({ ...input, id: 'custom-shared-desk' });
		const plan = {
			...createEmptyPlan(),
			customEntries: [entry],
			items: [{ id: 'i', catalogId: entry.id, label: '', x: 100, y: 100, rotation: 0, price: 0 }]
		};
		const parsed = parsePlan(stringifyPlan(plan));
		expect(parsed.ok).toBe(true);
		if (!parsed.ok) return;
		expect(parsed.plan.customEntries?.[0].name).toBe('내 책상');
		registerCustomEntries(parsed.plan.customEntries);
		expect(
			analyzePlan(parsed.plan.room, parsed.plan.items).findings.every(
				(f) => f.code !== 'out-of-room'
			)
		).toBe(true);
	});

	it('정의가 없는 직접 등록 제품을 쓴 파일은 거절합니다', () => {
		const plan = {
			...createEmptyPlan(),
			items: [
				{ id: 'i', catalogId: 'custom-unknown', label: '', x: 100, y: 100, rotation: 0, price: 0 }
			]
		};
		expect(parsePlan(stringifyPlan(plan)).ok).toBe(false);
	});

	it('편집기에서 놓을 수 있는 만큼의 내 제품이 담긴 파일을 읽습니다', () => {
		const entries = Array.from({ length: 120 }, (_, index) =>
			createCustomEntry({ ...input, id: `custom-many-${index}` })
		);
		const plan = {
			...createEmptyPlan(),
			customEntries: entries,
			items: entries.map((entry, index) => ({
				id: `i${index}`,
				catalogId: entry.id,
				label: '',
				x: 100,
				y: 100,
				rotation: 0,
				price: 0
			}))
		};
		expect(parsePlan(stringifyPlan(plan)).ok).toBe(true);
	});

	it('이 브라우저에 등록된 제품이라도 파일에 정의가 없으면 거절합니다', () => {
		const entry = createCustomEntry({ ...input, id: 'custom-local-only' });
		registerCustomEntries([entry]);
		const plan = {
			...createEmptyPlan(),
			items: [{ id: 'i', catalogId: entry.id, label: '', x: 100, y: 100, rotation: 0, price: 0 }]
		};
		expect(parsePlan(stringifyPlan(plan)).ok).toBe(false);
		expect(parsePlan(stringifyPlan({ ...plan, customEntries: [entry] })).ok).toBe(true);
	});

	it('이미 있는 정의는 배치도의 옛 사본으로 덮지 않습니다', () => {
		const current = createCustomEntry({ ...input, id: 'custom-keep', width: 160 });
		registerCustomEntries([current], true);
		registerCustomEntries([createCustomEntry({ ...input, id: 'custom-keep', width: 120 })]);
		expect(getCatalogEntry('custom-keep').width).toBe(160);
	});
});
