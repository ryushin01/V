import { describe, expect, it } from 'vitest';
import { BACKUP_PLAN_LIMIT, parseImportFile, stringifyBackup } from './backup';
import { createCustomEntry } from './custom';
import { copyPlan, createEmptyPlan, createSamplePlan } from './factory';
import { stringifyPlan } from './serialize';

const desk = createCustomEntry({
	name: '우리 집 책상',
	brand: '',
	kind: 'desk',
	width: 150,
	depth: 70,
	watts: 0,
	cable: 0,
	glyph: ''
});

describe('백업 파일', () => {
	it('배치도와 내 제품을 담고, 새 id로 읽으며 저장 시각은 그대로 둡니다', () => {
		const sample = { ...createSamplePlan(), updatedAt: 1000 };
		const empty = { ...createEmptyPlan('서재'), updatedAt: 2000 };
		const result = parseImportFile(stringifyBackup([sample, empty], [desk]));
		expect(result.ok && result.kind).toBe('backup');
		if (!result.ok || result.kind !== 'backup') return;
		expect(result.plans.map((plan) => plan.name)).toEqual([sample.name, '서재']);
		expect(result.plans.map((plan) => plan.updatedAt)).toEqual([1000, 2000]);
		expect(result.plans[0].id).not.toBe(sample.id);
		expect(result.plans[0].items).toHaveLength(sample.items.length);
		expect(result.products).toEqual([desk]);
		expect(result.skipped).toBe(0);
	});

	it('잘못된 배치도와 내 제품은 건너뛰고 수를 셉니다', () => {
		const text = JSON.stringify({
			format: 'v-backup',
			version: 1,
			plans: [createEmptyPlan('정상'), { version: 1, room: { width: 10 } }],
			products: [desk, { id: 'custom-x', name: '' }]
		});
		const result = parseImportFile(text);
		expect(result).toMatchObject({ ok: true, kind: 'backup', skipped: 2 });
	});

	it('배치도 파일 하나는 배치도로 읽습니다', () => {
		const result = parseImportFile(stringifyPlan(createSamplePlan()));
		expect(result.ok && result.kind).toBe('plan');
	});

	it('읽을 수 없는 파일은 이유를 알려 줍니다', () => {
		expect(parseImportFile('not json')).toEqual({
			ok: false,
			error: 'JSON 형식이 아닙니다. V에서 내보낸 파일을 골라 주세요.'
		});
		expect(parseImportFile('{"version":9}')).toMatchObject({
			ok: false,
			error: expect.stringContaining('V 배치도 파일이 아닙니다')
		});
		expect(parseImportFile('{"format":"v-backup","version":2}')).toMatchObject({
			ok: false,
			error: '이 버전에서 읽을 수 없는 백업 파일입니다.'
		});
		expect(
			parseImportFile(JSON.stringify({ format: 'v-backup', version: 1, plans: [], products: [] }))
		).toMatchObject({ ok: false, error: expect.stringContaining('가져올 수 있는') });
		const tooMany = Array.from({ length: BACKUP_PLAN_LIMIT + 1 }, () => ({}));
		expect(
			parseImportFile(
				JSON.stringify({ format: 'v-backup', version: 1, plans: tooMany, products: [] })
			)
		).toMatchObject({ ok: false, error: expect.stringContaining(`${BACKUP_PLAN_LIMIT}개`) });
	});
});

describe('copyPlan', () => {
	it('새 id와 "사본" 이름으로 복사하고 원본은 바꾸지 않습니다', () => {
		const original = createSamplePlan();
		const copy = copyPlan(original);
		expect(copy.id).not.toBe(original.id);
		expect(copy.name).toBe(`${original.name} 사본`);
		expect(copy.items).toEqual(original.items);
		copy.items[0].x = 999;
		expect(original.items[0].x).not.toBe(999);
		expect(copyPlan({ ...original, name: '가'.repeat(60) }).name).toHaveLength(60);
	});
});
