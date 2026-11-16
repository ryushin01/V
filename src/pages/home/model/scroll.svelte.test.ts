import { describe, expect, it, vi } from 'vitest';
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

	it('스크롤 이벤트가 여러 번 와도 한 프레임에 한 번만 위치를 읽고, 멈추면 예약을 지웁니다', () => {
		const frames: FrameRequestCallback[] = [];
		const request = vi
			.spyOn(window, 'requestAnimationFrame')
			.mockImplementation((callback) => frames.push(callback));
		const cancel = vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => {});
		document.body.innerHTML = '<section data-section="점검"></section>';
		const tracker = new ScrollTracker();
		const stop = tracker.start();
		window.dispatchEvent(new Event('scroll'));
		window.dispatchEvent(new Event('scroll'));
		window.dispatchEvent(new Event('scroll'));
		expect(request).toHaveBeenCalledTimes(1);
		frames[0](0);
		expect(tracker.section).toBe('점검');
		window.dispatchEvent(new Event('scroll'));
		expect(request).toHaveBeenCalledTimes(2);
		stop();
		expect(cancel).toHaveBeenCalled();
		request.mockRestore();
		cancel.mockRestore();
	});
});
