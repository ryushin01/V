import { describe, expect, it } from 'vitest';
import { createSamplePlan } from '../model/factory';
import { decodePlan, encodePlan } from './share-link';

describe('공유 링크', () => {
	it('주소에 넣을 수 있는 문자로 왕복합니다', async () => {
		const plan = createSamplePlan();
		const token = await encodePlan(plan);
		expect(token).toMatch(/^[\w-]+$/);
		const decoded = await decodePlan(token);
		expect(decoded.ok).toBe(true);
		if (decoded.ok) {
			expect(decoded.plan.name).toBe(plan.name);
			expect(decoded.plan.items).toHaveLength(plan.items.length);
			expect(decoded.plan.id).not.toBe(plan.id);
		}
	});

	it('금액은 넣지 않습니다', async () => {
		const decoded = await decodePlan(await encodePlan(createSamplePlan()));
		if (!decoded.ok) throw new Error(decoded.error);
		expect(decoded.plan.items.every((item) => item.price === 0)).toBe(true);
	});

	it('평면도 이미지는 넣지 않습니다', async () => {
		const plan = createSamplePlan();
		plan.underlay = {
			src: 'data:image/jpeg;base64,AAAA',
			pixelWidth: 10,
			pixelHeight: 10,
			x: 0,
			y: 0,
			cmPerPixel: 1,
			opacity: 0.5
		};
		const decoded = await decodePlan(await encodePlan(plan));
		if (!decoded.ok) throw new Error(decoded.error);
		expect(decoded.plan.underlay).toBeUndefined();
	});

	it('사용자 규격은 유지합니다', async () => {
		const plan = createSamplePlan();
		plan.items[0].specs = { width: 180 };
		const decoded = await decodePlan(await encodePlan(plan));
		if (!decoded.ok) throw new Error(decoded.error);
		expect(decoded.plan.items[0].specs).toEqual({ width: 180 });
	});

	it.each(['', '!!!', 'AAAA', 'x'.repeat(100_001)])('잘못된 링크를 거절합니다', async (token) => {
		expect((await decodePlan(token)).ok).toBe(false);
	});
});
