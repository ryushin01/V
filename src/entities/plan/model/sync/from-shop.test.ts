import { describe, expect, it } from 'vitest';
import { CATALOG, SHOP_ENTRIES } from '../catalog';
import { MODEL_ENTRIES } from '../catalog-models';
import type { ShopFeed, ShopFeedItem } from './feeds';
import { BASES, shopEntries, withShop } from './from-shop';
import { plannerFeed } from './planner-feed';
import { SHOP_FEED } from './shop-feed';

const feed = (items: ShopFeedItem[]): ShopFeed => ({ version: 1, source: 'my-first-gear', items });

describe('쇼핑몰 제품 동기화', () => {
	it('카탈로그 id가 겹치지 않습니다', () => {
		expect(new Set(CATALOG.map((entry) => entry.id)).size).toBe(CATALOG.length);
	});

	it('V에 이미 있는 제품(id나 별칭이 같은 것)은 가져오지 않고 판매가만 답니다', () => {
		const items: ShopFeedItem[] = [
			{
				id: 'samsung-odyssey-oled-g9',
				name: '삼성 오디세이 OLED G9',
				brand: 'Samsung',
				category: 'monitor',
				price: 1790000
			},
			{
				id: 'playstation-5-pro',
				name: '플레이스테이션 5 Pro',
				brand: 'Sony Interactive',
				category: 'console',
				price: 1118000,
				aliases: ['sony-ps5-pro']
			}
		];
		expect(shopEntries(feed(items), MODEL_ENTRIES)).toEqual([]);
		const linked = withShop(MODEL_ENTRIES, feed(items));
		expect(linked.find((entry) => entry.id === 'sony-ps5-pro')?.shop).toEqual({
			slug: 'playstation-5-pro',
			price: 1118000
		});
	});

	it('배치도에 놓을 수 없는 상품(CPU 등)은 가져오지 않습니다', () => {
		const items: ShopFeedItem[] = [
			{ id: 'acme-cpu', name: 'ACME CPU', brand: 'ACME', category: 'cpu', price: 1 }
		];
		expect(shopEntries(feed(items), MODEL_ENTRIES)).toEqual([]);
	});

	it('크기를 모르는 상품은 종류별 흔한 크기로 추정하고 추정이라고 표시합니다', () => {
		const [monitor, synth] = shopEntries(
			feed([
				{
					id: 'acme-45',
					name: 'ACME 45',
					brand: 'ACME',
					category: 'monitor',
					price: 1,
					diagonalInch: 45,
					aspect: '21:9'
				},
				{
					id: 'acme-synth',
					name: 'ACME 신스',
					brand: 'ACME',
					category: 'instrument',
					price: 1,
					widthCm: 139.3,
					depthCm: 35.4
				}
			]),
			MODEL_ENTRIES
		);
		expect(monitor).toMatchObject({
			kind: 'monitor',
			diagonalInch: 45,
			dimsBasis: 'estimate',
			wattsBasis: 'estimate'
		});
		expect(monitor.width).toBeCloseTo(107, 0);
		expect(synth).toMatchObject({
			kind: 'audio-device',
			width: 139.3,
			depth: 35.4,
			shop: { slug: 'acme-synth', price: 1, imported: true }
		});
		expect(synth.dimsBasis).toBeUndefined();
	});

	it('객체가 물려받은 이름(constructor 등)이 와도 멈추지 않고 건너뜁니다', () => {
		const entries = shopEntries(
			feed([
				{
					id: 'acme-odd',
					name: 'ACME 이상한 상품',
					brand: 'ACME',
					category: 'constructor',
					price: 1
				},
				{
					id: 'acme-mon',
					name: 'constructor 모니터',
					brand: 'constructor',
					category: 'monitor',
					price: 1
				}
			]),
			MODEL_ENTRIES
		);
		expect(entries.map((entry) => [entry.id, entry.name])).toEqual([['acme-mon', '모니터']]);
	});

	it('이름 앞의 제조사 이름을 뺍니다', () => {
		const [entry] = shopEntries(
			feed([
				{ id: 'acme-g9', name: '삼성 오디세이 G9', brand: 'Samsung', category: 'monitor', price: 1 }
			]),
			MODEL_ENTRIES
		);
		expect(entry.name).toBe('오디세이 G9');
	});

	it('스냅샷에서 가져온 제품은 모두 판매가가 있습니다', () => {
		expect(SHOP_ENTRIES.length).toBeGreaterThan(0);
		for (const entry of SHOP_ENTRIES) expect(entry.shop?.price).toBeGreaterThan(0);
	});
});

describe('V 피드', () => {
	it('제조사가 있는 V 모델만 싣고 쇼핑몰에서 가져온 제품은 되돌려 보내지 않습니다', () => {
		const items = plannerFeed(CATALOG).items;
		expect(items).toHaveLength(MODEL_ENTRIES.length);
		const imported = new Set(SHOP_ENTRIES.map((entry) => entry.id));
		expect(items.some((item) => imported.has(item.id))).toBe(false);
	});
});

describe('쇼핑몰 피드 스냅샷', () => {
	it('배치도에 놓을 수 있는 카테고리만 저장하고, 그 목록은 BASES와 같습니다', async () => {
		const { PLACEABLE } = await import('../../../../../scripts/sync-shop-feed.mjs');
		expect([...PLACEABLE].sort()).toEqual(Object.keys(BASES).sort());
		expect(SHOP_FEED.items.every((item) => item.category in BASES)).toBe(true);
	});
});

describe('쇼핑몰에서 판매를 마친 제품', () => {
	const ended: ShopFeedItem = {
		id: 'acme-ended',
		name: 'ACME 판매 종료 모니터',
		brand: 'ACME',
		category: 'monitor',
		price: 1,
		discontinued: true
	};

	it('카탈로그 항목은 남기고(이미 놓은 배치도), 판매 종료로 표시합니다', () => {
		const [entry] = shopEntries(feed([ended]), MODEL_ENTRIES);
		expect(entry.shop).toEqual({
			slug: 'acme-ended',
			price: 1,
			imported: true,
			discontinued: true
		});
	});

	it('V 모델에는 판매가·링크를 달지 않습니다', () => {
		const linked = withShop(MODEL_ENTRIES, feed([{ ...ended, id: 'samsung-odyssey-oled-g9' }]));
		expect(linked.find((entry) => entry.id === 'samsung-odyssey-oled-g9')?.shop).toBeUndefined();
	});

	it('동기화는 피드에서 빠진 상품을 판매 종료로 남기고, 다시 나오면 판매 중으로 돌립니다', async () => {
		const { keepDiscontinued, snapshotItems } =
			await import('../../../../../scripts/sync-shop-feed.mjs');
		const kept = keepDiscontinued(
			[{ ...ended, discontinued: undefined }],
			[{ id: 'acme-new', name: 'ACME 새 모니터', brand: 'ACME', category: 'monitor', price: 2 }]
		);
		expect(kept.map((entry: ShopFeedItem) => [entry.id, entry.discontinued])).toEqual([
			['acme-new', undefined],
			['acme-ended', true]
		]);
		expect(keepDiscontinued([ended], [{ ...ended, discontinued: undefined }])).toHaveLength(1);
		expect(snapshotItems('export const SHOP_FEED: ShopFeed = {"items":[{"id":"x"}]};')).toEqual([]);
	});
});
