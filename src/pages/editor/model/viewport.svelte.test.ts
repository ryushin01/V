import { describe, expect, it } from 'vitest';
import { Viewport } from './viewport.svelte';

describe('Viewport', () => {
	it('방을 가운데에 맞춥니다', () => {
		const view = new Viewport();
		view.width = 1000;
		view.height = 600;
		view.fit(400, 300, 0);
		expect(view.scale).toBe(2);
		expect(view.offsetX).toBe(100);
		expect(view.offsetY).toBe(0);
	});

	it('확대해도 포인터 아래 지점은 그대로입니다', () => {
		const view = new Viewport();
		const before = view.toWorld(300, 200);
		view.zoomAt(300, 200, 2);
		expect(view.toWorld(300, 200).x).toBeCloseTo(before.x);
		expect(view.toWorld(300, 200).y).toBeCloseTo(before.y);
	});

	it('배율은 범위를 벗어나지 않습니다', () => {
		const view = new Viewport();
		view.zoomCenter(1000);
		expect(view.scale).toBe(8);
	});
});
