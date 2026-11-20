import { fireEvent, render, screen } from '@testing-library/svelte';
import { tick } from 'svelte';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import HomeIntro from './HomeIntro.svelte';

const original = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'getAnimations');

/** jsdom에는 Web Animations가 없어, 주어진 finished로 끝나는 애니메이션 하나로 대신합니다. */
function stubAnimations(finished: Promise<unknown>) {
	Object.defineProperty(HTMLElement.prototype, 'getAnimations', {
		configurable: true,
		value: () => [{ finished }]
	});
}

async function renderPlaying(finished: Promise<unknown> = new Promise(() => {})) {
	document.documentElement.dataset.intro = 'play';
	stubAnimations(finished);
	const result = render(HomeIntro);
	await tick();
	return result;
}

describe('HomeIntro', () => {
	beforeEach(() => {
		vi.useFakeTimers();
	});

	afterEach(() => {
		vi.useRealTimers();
		delete document.documentElement.dataset.intro;
		if (original) Object.defineProperty(HTMLElement.prototype, 'getAnimations', original);
		else Reflect.deleteProperty(HTMLElement.prototype, 'getAnimations');
	});

	it('첫 페인트 전 판단이 재생으로 정하지 않았으면 덮개를 남기지 않습니다', async () => {
		render(HomeIntro);
		await tick();
		expect(screen.queryByTestId('home-intro')).toBeNull();
	});

	it('재생 중에는 장식 덮개를 보이고, 아무 키나 누르면 걷은 뒤 재생 표시를 지웁니다', async () => {
		await renderPlaying();
		const intro = screen.getByTestId('home-intro');
		expect(intro).toHaveAttribute('aria-hidden', 'true');

		await fireEvent.keyDown(window, { key: 'Tab' });
		expect(intro).toHaveClass('is-leaving');
		vi.advanceTimersByTime(200);
		await tick();
		expect(screen.queryByTestId('home-intro')).toBeNull();
		expect(document.documentElement.dataset.intro).toBeUndefined();
	});

	it('화면을 눌러도 바로 건너뜁니다', async () => {
		await renderPlaying();
		await fireEvent.click(screen.getByTestId('home-intro'));
		vi.advanceTimersByTime(200);
		await tick();
		expect(screen.queryByTestId('home-intro')).toBeNull();
	});

	it('애니메이션이 끝나면 덮개를 걷습니다', async () => {
		await renderPlaying(Promise.resolve());
		await tick();
		expect(screen.queryByTestId('home-intro')).toBeNull();
		expect(document.documentElement.dataset.intro).toBeUndefined();
	});

	it('애니메이션이 끝나지 않아도 4초 뒤에는 덮개를 걷습니다', async () => {
		await renderPlaying();
		vi.advanceTimersByTime(3900);
		await tick();
		expect(screen.getByTestId('home-intro')).toBeInTheDocument();
		vi.advanceTimersByTime(200);
		await tick();
		expect(screen.queryByTestId('home-intro')).toBeNull();
	});

	it('재생 중에 화면을 떠나면 재생 표시를 지워 다시 와도 재생하지 않습니다', async () => {
		const { unmount } = await renderPlaying();
		unmount();
		expect(document.documentElement.dataset.intro).toBeUndefined();
	});
});
