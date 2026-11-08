import { render } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';
import { CATALOG } from '../model/catalog';
import ItemGlyphGallery from './ItemGlyphGallery.svelte';

describe('ItemGlyph', () => {
	it('카탈로그의 모든 물건을 그립니다', () => {
		const { container } = render(ItemGlyphGallery, { entries: CATALOG });
		const svgs = container.querySelectorAll('svg');
		expect(svgs).toHaveLength(CATALOG.length);
		svgs.forEach((svg) => expect(svg.querySelector('.glyph')?.children.length).toBeGreaterThan(0));
	});
});
