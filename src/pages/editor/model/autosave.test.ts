import { describe, expect, it } from 'vitest';
import { createCustomEntry, createSamplePlan, type Underlay } from '#entities/plan';
import { createPlanFingerprint } from './autosave';

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

const underlay = (src: string): Underlay => ({
	src,
	pixelWidth: 100,
	pixelHeight: 80,
	x: 0,
	y: 0,
	cmPerPixel: 4,
	opacity: 0.6
});

describe('createPlanFingerprint', () => {
	it('저장 시각과 내 제품 정의만 다르면 같은 내용으로 봅니다', () => {
		const fingerprint = createPlanFingerprint();
		const plan = createSamplePlan();
		const before = fingerprint({ ...plan, updatedAt: 1, customEntries: [desk(150)] });
		const after = fingerprint({ ...plan, updatedAt: 2, customEntries: [desk(180)] });
		expect(after).toBe(before);
	});

	it('배치가 바뀌면 다른 내용으로 봅니다', () => {
		const fingerprint = createPlanFingerprint();
		const plan = createSamplePlan();
		const moved = { ...plan, items: plan.items.map((item, i) => (i ? item : { ...item, x: 1 })) };
		expect(fingerprint(moved)).not.toBe(fingerprint(plan));
		expect(fingerprint({ ...plan, name: '다른 이름' })).not.toBe(fingerprint(plan));
	});

	it('평면도 이미지는 문자열 대신 번호로 비교하되, 이미지나 위치가 바뀌면 다른 내용으로 봅니다', () => {
		const fingerprint = createPlanFingerprint();
		const plan = createSamplePlan();
		const big = `data:image/jpeg;base64,${'A'.repeat(100_000)}`;
		const first = fingerprint({ ...plan, underlay: underlay(big) });
		expect(first.length).toBeLessThan(10_000);
		// 같은 내용의 다른 문자열(다시 불러온 경우)도 같은 번호입니다.
		expect(fingerprint({ ...plan, underlay: underlay(big.slice(0) + '') })).toBe(first);
		expect(fingerprint({ ...plan, underlay: underlay(`${big}B`) })).not.toBe(first);
		expect(fingerprint({ ...plan, underlay: { ...underlay(big), x: 10 } })).not.toBe(first);
	});
});
