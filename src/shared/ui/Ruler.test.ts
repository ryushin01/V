import { fireEvent, render, screen } from '@testing-library/svelte';
import { describe, expect, it, vi } from 'vitest';
import Ruler from './Ruler.svelte';

describe('Ruler', () => {
	it('X축과 Y축 모두 cm 숫자를 그립니다', () => {
		for (const axis of ['x', 'y'] as const) {
			const { unmount } = render(Ruler, { axis, length: 400, scale: 1.6, offset: 40 });
			expect(screen.getByTestId(`ruler-${axis}`).textContent).toContain('50');
			unmount();
		}
	});

	it('보조기술에는 숨기고 초점을 받지 않습니다', () => {
		render(Ruler, { axis: 'x', length: 400, scale: 1.6, offset: 0 });
		const ruler = screen.getByTestId('ruler-x');
		expect(ruler.getAttribute('aria-hidden')).toBe('true');
		expect(ruler.hasAttribute('tabindex')).toBe(false);
	});

	it('끌면 축 방향 이동량을 알립니다', async () => {
		const onpan = vi.fn();
		render(Ruler, { axis: 'y', length: 400, scale: 1.6, offset: 0, onpan });
		const ruler = screen.getByTestId('ruler-y');
		ruler.setPointerCapture = vi.fn();
		await fireEvent.pointerDown(ruler, { clientX: 5, clientY: 100, pointerId: 1 });
		await fireEvent.pointerMove(ruler, { clientX: 90, clientY: 130, pointerId: 1 });
		expect(onpan).toHaveBeenCalledWith(30);
	});
});
