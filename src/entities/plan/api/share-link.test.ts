import { describe, expect, it } from 'vitest';
import { createSamplePlan } from '../model/factory';
import { decodePlan, decodeShareHash, encodePlan } from './share-link';

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

	it('비었거나 너무 긴 링크, base64가 아닌 글자, 압축이 아닌 내용은 같은 이유로 거절합니다', async () => {
		const reason = '링크가 손상되었거나 V 공유 링크가 아닙니다.';
		for (const token of ['', 'a'.repeat(100_001), '%%%', 'aGVsbG8']) {
			expect(await decodePlan(token)).toEqual({ ok: false, error: reason });
		}
	});

	it('압축은 맞지만 배치도가 아니면 파일 검사의 이유를 알려 줍니다', async () => {
		const bytes = new TextEncoder().encode('{"version":9}');
		const stream = new Response(bytes).body;
		if (!stream) throw new Error('스트림을 만들지 못했습니다');
		const compressed = new Uint8Array(
			await new Response(stream.pipeThrough(new CompressionStream('deflate-raw'))).arrayBuffer()
		);
		const token = btoa(String.fromCharCode(...compressed))
			.replace(/\+/g, '-')
			.replace(/\//g, '_')
			.replace(/=+$/, '');
		const decoded = await decodePlan(token);
		expect(decoded.ok).toBe(false);
	});

	it('풀면 512KB가 넘는 링크는 끝까지 풀지 않고 거절합니다', async () => {
		const bytes = new Uint8Array(600 * 1024).fill(32);
		const stream = new Response(bytes).body;
		if (!stream) throw new Error('스트림을 만들지 못했습니다');
		const compressed = new Uint8Array(
			await new Response(stream.pipeThrough(new CompressionStream('deflate-raw'))).arrayBuffer()
		);
		const token = btoa(String.fromCharCode(...compressed))
			.replace(/\+/g, '-')
			.replace(/\//g, '_')
			.replace(/=+$/, '');
		expect(await decodePlan(token)).toEqual({
			ok: false,
			error: '링크가 손상되었거나 V 공유 링크가 아닙니다.'
		});
	});

	it('주소 해시(# 포함·제외)에서 배치도를 읽고, 비었거나 다른 값이면 같은 오류를 돌려줍니다', async () => {
		const plan = createSamplePlan();
		const token = await encodePlan(plan);
		for (const hash of [`#${token}`, token]) {
			const result = await decodeShareHash(hash);
			expect(result.ok && result.plan.name).toBe(plan.name);
		}
		const broken = await decodeShareHash('#broken');
		for (const hash of ['', '#']) expect(await decodeShareHash(hash)).toEqual(broken);
	});
});
