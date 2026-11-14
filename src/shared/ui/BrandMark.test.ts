import { render, screen } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';
import BrandMark from './BrandMark.svelte';

describe('BrandMark', () => {
	it('장식 그림으로 그리고 지정한 크기를 씁니다', () => {
		render(BrandMark, { size: 40 });
		const img = screen.getByTestId('brand-mark');
		expect(img.getAttribute('alt')).toBe('');
		expect(img.getAttribute('width')).toBe('40');
	});
});
