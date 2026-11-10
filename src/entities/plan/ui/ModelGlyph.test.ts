import { render } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';
import { CATALOG } from '../model/catalog';
import ItemGlyphGallery from './ItemGlyphGallery.svelte';
import { MODEL_GLYPHS } from './model-glyphs';

describe('모델별 일러스트', () => {
	const models = CATALOG.filter((entry) => entry.brand);

	it('실제 모델마다 등록된 일러스트를 씁니다', () => {
		for (const entry of models) expect(Object.keys(MODEL_GLYPHS), entry.id).toContain(entry.glyph);
	});

	it('그림이 물건 영역을 크게 벗어나지 않습니다', () => {
		for (const entry of models) {
			const shapes = MODEL_GLYPHS[entry.glyph as keyof typeof MODEL_GLYPHS](
				entry.width,
				entry.depth
			);
			for (const shape of shapes) {
				const { x, y, cx, cy } = shape.attrs as Record<string, number>;
				for (const [value, limit] of [
					[x ?? cx, entry.width],
					[y ?? cy, entry.depth]
				] as const) {
					if (value === undefined) continue;
					expect(Math.abs(value), `${entry.id} ${shape.tag}`).toBeLessThanOrEqual(limit / 2 + 3);
				}
			}
		}
	});

	it('모든 실제 모델을 그립니다', () => {
		const { container } = render(ItemGlyphGallery, { entries: models });
		const drawn = container.querySelectorAll('[data-glyph]');
		expect(drawn).toHaveLength(models.length);
		drawn.forEach((glyph) => expect(glyph.children.length).toBeGreaterThan(1));
	});
});
