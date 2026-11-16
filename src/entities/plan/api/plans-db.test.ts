import 'fake-indexeddb/auto';
import { describe, expect, it } from 'vitest';
import { getCatalogEntry } from '../model/catalog';
import { createCustomEntry } from '../model/custom';
import { createEmptyPlan } from '../model/factory';
import { CUSTOM_PRODUCT_LIMIT } from '../model/custom-file';
import {
	CustomProductLimitError,
	deleteCustomProduct,
	deletePlan,
	getPlan,
	listCustomProducts,
	listPlans,
	restoreBackup,
	saveCustomProducts,
	savePlan
} from './plans-db';

describe('IndexedDB 저장소', () => {
	it('저장하고 최신순으로 불러옵니다', async () => {
		const older = { ...createEmptyPlan('이전'), updatedAt: 1 };
		const newer = { ...createEmptyPlan('최신'), updatedAt: 2 };
		await savePlan(older);
		await savePlan(newer);
		const names = (await listPlans()).map((plan) => plan.name);
		expect(names.indexOf('최신')).toBeLessThan(names.indexOf('이전'));
		expect((await getPlan(older.id))?.name).toBe('이전');
	});

	it('삭제하면 찾을 수 없습니다', async () => {
		const plan = createEmptyPlan();
		await savePlan(plan);
		await deletePlan(plan.id);
		expect(await getPlan(plan.id)).toBeUndefined();
	});

	it('여러 내 제품을 한 번에 저장하고 바로 쓸 수 있게 등록합니다', async () => {
		const base = {
			brand: '',
			kind: 'decor' as const,
			width: 10,
			depth: 10,
			watts: 0,
			cable: 0,
			glyph: ''
		};
		const entries = [
			createCustomEntry({ ...base, id: 'custom-batch-a', name: '첫째' }),
			createCustomEntry({ ...base, id: 'custom-batch-b', name: '둘째' })
		];
		await saveCustomProducts(entries);
		const ids = (await listCustomProducts()).map((entry) => entry.id);
		expect(ids).toEqual(expect.arrayContaining(['custom-batch-a', 'custom-batch-b']));
		expect(getCatalogEntry('custom-batch-b').name).toBe('둘째');
	});

	it('합계가 한도를 넘으면 하나도 저장하지 않습니다', async () => {
		const before = (await listCustomProducts()).length;
		const many = Array.from({ length: CUSTOM_PRODUCT_LIMIT - before + 1 }, (_, index) =>
			createCustomEntry({
				brand: '',
				kind: 'decor',
				width: 10,
				depth: 10,
				watts: 0,
				cable: 0,
				glyph: '',
				id: `custom-over-${index}`,
				name: `넘침 ${index}`
			})
		);
		await expect(saveCustomProducts(many)).rejects.toBeInstanceOf(CustomProductLimitError);
		expect(await listCustomProducts()).toHaveLength(before);
		// 한도 안이면 저장합니다.
		await saveCustomProducts(many.slice(1));
		expect(await listCustomProducts()).toHaveLength(CUSTOM_PRODUCT_LIMIT);
	});

	it('백업은 배치도와 내 제품을 한 번에 저장하고, 내 제품이 한도를 넘으면 아무것도 저장하지 않습니다', async () => {
		const product = (index: number) =>
			createCustomEntry({
				name: `백업 제품 ${index}`,
				brand: '',
				kind: 'decor',
				width: 10,
				depth: 10,
				watts: 0,
				cable: 0,
				glyph: ''
			});
		// 앞선 시험이 채워 둔 내 제품을 비웁니다.
		for (const entry of await listCustomProducts()) await deleteCustomProduct(entry.id);
		const plan = { ...createEmptyPlan('백업 배치도'), updatedAt: 5 };
		await restoreBackup([plan], [product(1)]);
		expect((await getPlan(plan.id))?.name).toBe('백업 배치도');
		expect((await listCustomProducts()).some((entry) => entry.name === '백업 제품 1')).toBe(true);

		const existing = (await listCustomProducts()).length;
		const tooMany = Array.from({ length: CUSTOM_PRODUCT_LIMIT - existing + 1 }, (_, index) =>
			product(index + 2)
		);
		const blocked = { ...createEmptyPlan('막힌 배치도'), updatedAt: 6 };
		await expect(restoreBackup([blocked], tooMany)).rejects.toBeInstanceOf(CustomProductLimitError);
		expect(await getPlan(blocked.id)).toBeUndefined();
		expect(await listCustomProducts()).toHaveLength(existing);
	});
});
