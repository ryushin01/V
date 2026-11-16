import { describe, expect, it } from 'vitest';
import { createCustomEntry, createSamplePlan } from '#entities/plan';
import { planFingerprint } from './autosave';

const desk = (width: number) =>
	createCustomEntry({
		id: 'custom-desk',
		name: '우리 집 책상',
		brand: '',
		kind: 'desk',
		width,
		depth: 70,
		watts: 0,
		cable: 0,
		glyph: ''
	});

describe('planFingerprint', () => {
	it('저장 시각과 내 제품 정의만 다르면 같은 내용으로 봅니다', () => {
		const plan = createSamplePlan();
		const before = planFingerprint({ ...plan, updatedAt: 1, customEntries: [desk(150)] });
		const after = planFingerprint({ ...plan, updatedAt: 2, customEntries: [desk(180)] });
		expect(after).toBe(before);
	});

	it('배치가 바뀌면 다른 내용으로 봅니다', () => {
		const plan = createSamplePlan();
		const moved = { ...plan, items: plan.items.map((item, i) => (i ? item : { ...item, x: 1 })) };
		expect(planFingerprint(moved)).not.toBe(planFingerprint(plan));
		expect(planFingerprint({ ...plan, name: '다른 이름' })).not.toBe(planFingerprint(plan));
	});
});
