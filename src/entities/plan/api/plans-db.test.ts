import 'fake-indexeddb/auto';
import { describe, expect, it } from 'vitest';
import { createEmptyPlan } from '../model/factory';
import { deletePlan, getPlan, listPlans, savePlan } from './plans-db';

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
});
