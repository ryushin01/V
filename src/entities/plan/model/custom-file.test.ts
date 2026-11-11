import { describe, expect, it } from 'vitest';
import { createCustomEntry, type CustomProductInput } from './custom';
import {
	CUSTOM_PRODUCT_LIMIT,
	parseCustomProductsFile,
	stringifyCustomProducts
} from './custom-file';
import { createEmptyPlan } from './factory';
import { stringifyPlan } from './serialize';

const input: CustomProductInput = {
	name: '내 스피커',
	brand: '공방',
	kind: 'speaker',
	width: 15,
	depth: 20,
	watts: 30,
	cable: 150,
	glyph: ''
};

describe('내 제품 파일', () => {
	it('내보낸 파일을 그대로 다시 읽습니다', () => {
		const entries = [
			createCustomEntry({ ...input, id: 'custom-file-a' }),
			createCustomEntry({ ...input, id: 'custom-file-b', name: '두 번째' })
		];
		const parsed = parseCustomProductsFile(stringifyCustomProducts(entries));
		expect(parsed).toMatchObject({ ok: true, skipped: 0, source: 'products' });
		if (!parsed.ok) return;
		expect(parsed.entries.map((entry) => entry.name)).toEqual(['내 스피커', '두 번째']);
	});

	it('배치도 파일에서 내 제품 정의만 꺼냅니다', () => {
		const entry = createCustomEntry({ ...input, id: 'custom-from-plan' });
		const plan = {
			...createEmptyPlan(),
			customEntries: [entry],
			items: [{ id: 'i', catalogId: entry.id, label: '', x: 100, y: 100, rotation: 0, price: 0 }]
		};
		const parsed = parseCustomProductsFile(stringifyPlan(plan));
		expect(parsed).toMatchObject({ ok: true, source: 'plan' });
		if (!parsed.ok) return;
		expect(parsed.entries[0].id).toBe('custom-from-plan');
	});

	it('내 제품이 없는 배치도는 이유를 알립니다', () => {
		expect(parseCustomProductsFile(stringifyPlan(createEmptyPlan()))).toEqual({
			ok: false,
			error: '이 배치도에는 직접 등록한 제품이 없습니다.'
		});
	});

	it('잘못된 항목은 건너뛰고 수를 셉니다', () => {
		const good = createCustomEntry({ ...input, id: 'custom-good' });
		const text = JSON.stringify({
			format: 'v-custom-products',
			version: 1,
			products: [good, { ...good, id: '../evil' }, { ...good, kind: 'constructor' }, 'text']
		});
		expect(parseCustomProductsFile(text)).toMatchObject({ ok: true, skipped: 3 });
	});

	it('같은 id는 파일의 마지막 것을 씁니다', () => {
		const first = createCustomEntry({ ...input, id: 'custom-same', width: 10 });
		const last = createCustomEntry({ ...input, id: 'custom-same', width: 30 });
		const parsed = parseCustomProductsFile(stringifyCustomProducts([first, last]));
		expect(parsed.ok && parsed.entries).toMatchObject([{ width: 30 }]);
	});

	it('형식이 다르거나 너무 큰 파일은 거절합니다', () => {
		expect(parseCustomProductsFile('{')).toMatchObject({
			ok: false,
			error: 'JSON 파일이 아닙니다.'
		});
		expect(parseCustomProductsFile('[]')).toMatchObject({ ok: false });
		expect(parseCustomProductsFile('{"hello":1}')).toMatchObject({ ok: false });
		expect(
			parseCustomProductsFile(
				JSON.stringify({ format: 'v-custom-products', version: 2, products: [] })
			)
		).toMatchObject({ ok: false });
		const many = Array.from({ length: CUSTOM_PRODUCT_LIMIT + 1 }, () => ({}));
		expect(
			parseCustomProductsFile(
				JSON.stringify({ format: 'v-custom-products', version: 1, products: many })
			)
		).toMatchObject({
			ok: false,
			error: `한 파일에 ${CUSTOM_PRODUCT_LIMIT}개까지 가져올 수 있습니다.`
		});
	});
});
