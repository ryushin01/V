import { describe, expect, it } from 'vitest';
import { ScrollTracker } from './scroll.svelte';

describe('ScrollTracker', () => {
	it('진행률을 세 자리 백분율로 만듭니다', () => {
		const tracker = new ScrollTracker();
		tracker.max = 1000;
		tracker.y = 420;
		expect(tracker.progress).toBe(0.42);
		expect(tracker.percent).toBe('042');
	});

	it('스크롤할 거리가 없으면 0입니다', () => {
		expect(new ScrollTracker().progress).toBe(0);
	});

	it('튕겨 올라간 스크롤도 범위 안으로 맞춥니다', () => {
		const tracker = new ScrollTracker();
		tracker.max = 100;
		tracker.y = 130;
		expect(tracker.percent).toBe('100');
	});
});
