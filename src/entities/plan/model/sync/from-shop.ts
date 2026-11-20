import type { CatalogCategory, CatalogEntry, ItemKind, ItemLayer, WattsBasis } from '../types';
import type { ShopFeed, ShopFeedItem } from './feeds';

interface ShopBase {
	category: CatalogCategory;
	kind: ItemKind;
	layer: ItemLayer;
	cable: number;
	requiresSupport?: boolean;
	width: number;
	depth: number;
	watts: number;
	wattsBasis?: WattsBasis;
}

/**
 * 쇼핑몰 카테고리별 기본 모양입니다. 쇼핑몰에는 놓는 자리와 소비 전력이 없는 상품이 많아서
 * 같은 종류의 흔한 크기로 추정하고, 추정한 값은 카탈로그에 '추정'으로 표시합니다.
 * 표에 없는 카테고리(CPU, 자동차 등)는 배치도에 놓을 물건이 아니어서 가져오지 않습니다.
 * 카테고리를 더하면 scripts/sync-shop-feed.mjs의 PLACEABLE에도 더합니다(스냅샷에 남길 카테고리).
 */
export const BASES: Readonly<Record<string, ShopBase>> = {
	monitor: {
		category: 'display',
		kind: 'monitor',
		layer: 'surface',
		cable: 150,
		requiresSupport: true,
		width: 61,
		depth: 23,
		watts: 60,
		wattsBasis: 'estimate'
	},
	keyboard: {
		category: 'input',
		kind: 'keyboard',
		layer: 'surface',
		cable: 0,
		requiresSupport: true,
		width: 36,
		depth: 14,
		watts: 0
	},
	mouse: {
		category: 'input',
		kind: 'mouse',
		layer: 'surface',
		cable: 0,
		requiresSupport: true,
		width: 6.5,
		depth: 12.5,
		watts: 0
	},
	chair: {
		category: 'furniture',
		kind: 'chair',
		layer: 'floor',
		cable: 0,
		width: 68,
		depth: 68,
		watts: 0
	},
	desk: {
		category: 'furniture',
		kind: 'desk',
		layer: 'floor',
		cable: 0,
		width: 160,
		depth: 80,
		watts: 0
	},
	'monitor-arm': {
		category: 'accessory',
		kind: 'arm',
		layer: 'mount',
		cable: 0,
		requiresSupport: true,
		width: 45,
		depth: 12,
		watts: 0
	},
	lighting: {
		category: 'accessory',
		kind: 'lamp',
		layer: 'surface',
		cable: 200,
		width: 20,
		depth: 20,
		watts: 10,
		wattsBasis: 'estimate'
	},
	speaker: {
		category: 'audio',
		kind: 'speaker',
		layer: 'surface',
		cable: 150,
		width: 15,
		depth: 22,
		watts: 30,
		wattsBasis: 'estimate'
	},
	microphone: {
		category: 'audio',
		kind: 'audio-device',
		layer: 'surface',
		cable: 0,
		requiresSupport: true,
		width: 12,
		depth: 12,
		watts: 0
	},
	headphone: {
		category: 'personal',
		kind: 'headphones',
		layer: 'surface',
		cable: 0,
		requiresSupport: true,
		width: 18,
		depth: 20,
		watts: 0
	},
	earphone: {
		category: 'personal',
		kind: 'earphones',
		layer: 'surface',
		cable: 0,
		requiresSupport: true,
		width: 6,
		depth: 4,
		watts: 0
	},
	dap: {
		category: 'personal',
		kind: 'audio-device',
		layer: 'surface',
		cable: 0,
		requiresSupport: true,
		width: 7,
		depth: 12,
		watts: 0
	},
	'amp-dac': {
		category: 'audio',
		kind: 'audio-device',
		layer: 'surface',
		cable: 150,
		requiresSupport: true,
		width: 20,
		depth: 20,
		watts: 15,
		wattsBasis: 'estimate'
	},
	instrument: {
		category: 'audio',
		kind: 'audio-device',
		layer: 'surface',
		cable: 150,
		requiresSupport: true,
		width: 130,
		depth: 35,
		watts: 30,
		wattsBasis: 'estimate'
	},
	console: {
		category: 'computing',
		kind: 'console',
		layer: 'surface',
		cable: 150,
		width: 30,
		depth: 20,
		watts: 200,
		wattsBasis: 'estimate'
	},
	laptop: {
		category: 'computing',
		kind: 'laptop',
		layer: 'surface',
		cable: 180,
		requiresSupport: true,
		width: 32,
		depth: 22,
		watts: 65,
		wattsBasis: 'estimate'
	},
	desktop: {
		category: 'computing',
		kind: 'pc',
		layer: 'surface',
		cable: 180,
		width: 20,
		depth: 40,
		watts: 300,
		wattsBasis: 'estimate'
	},
	case: {
		category: 'computing',
		kind: 'pc',
		layer: 'surface',
		cable: 180,
		width: 23,
		depth: 48,
		watts: 550,
		wattsBasis: 'estimate'
	},
	electronics: {
		category: 'accessory',
		kind: 'hub',
		layer: 'surface',
		cable: 150,
		requiresSupport: true,
		width: 15,
		depth: 10,
		watts: 10,
		wattsBasis: 'estimate'
	},
	furniture: {
		category: 'furniture',
		kind: 'shelf',
		layer: 'mat',
		cable: 0,
		requiresSupport: true,
		width: 90,
		depth: 24,
		watts: 0
	},
	'desk-accessory': {
		category: 'accessory',
		kind: 'decor',
		layer: 'surface',
		cable: 0,
		requiresSupport: true,
		width: 15,
		depth: 15,
		watts: 0
	}
};

/** 모니터 가로 길이 비율 (대각선 대비). 비율을 모르면 16:9로 봅니다. */
const ASPECT_WIDTH: Readonly<Record<string, number>> = {
	'16:9': 0.872,
	'21:9': 0.919,
	'32:9': 0.963
};

/**
 * 쇼핑몰 상품 이름 앞에 붙은 제조사 이름입니다. V는 제조사를 따로 보여 주므로 이름에서 뺍니다.
 * 표에 없는 제조사는 이름을 그대로 둡니다.
 */
const BRAND_WORDS: Readonly<Record<string, readonly string[]>> = {
	LG전자: ['LG'],
	Samsung: ['삼성'],
	Sony: ['소니'],
	'Astell&Kern': ['아스텔앤컨'],
	Moondrop: ['문드롭'],
	Sennheiser: ['젠하이저'],
	SteelSeries: ['스틸시리즈'],
	beyerdynamic: ['베이어다이나믹'],
	SIDIZ: ['시디즈'],
	Secretlab: ['시크릿랩'],
	DESKER: ['데스커'],
	Ergotron: ['에르고트론'],
	Nanoleaf: ['나노리프'],
	'Logitech G': ['로지텍'],
	Logitech: ['로지텍'],
	Razer: ['레이저'],
	NuPhy: ['누피'],
	Corsair: ['커세어'],
	Leopold: ['레오폴드'],
	Apple: ['애플'],
	Edifier: ['에디파이어'],
	Audioengine: ['오디오엔진'],
	Creative: ['크리에이티브'],
	Genelec: ['제네렉'],
	Elgato: ['엘가토'],
	Shure: ['슈어'],
	'Cooler Master': ['쿨러마스터'],
	COUGAR: ['쿠거'],
	Keycult: ['키컬트'],
	Geonworks: ['지온웍스'],
	Roland: ['롤랜드'],
	Yamaha: ['야마하'],
	Nord: ['노드']
};

const round = (value: number) => Math.round(value * 10) / 10;

function modelName(item: ShopFeedItem): string {
	for (const word of [item.brand, ...(BRAND_WORDS[item.brand] ?? [])]) {
		if (item.name.startsWith(`${word} `)) return item.name.slice(word.length + 1);
	}
	return item.name;
}

/** 카테고리 기본 모양에 상품 이름과 쇼핑몰 값을 맞춥니다. */
function shape(item: ShopFeedItem): ShopBase | undefined {
	const base = BASES[item.category];
	if (!base) return undefined;
	const name = item.name;
	switch (item.category) {
		case 'monitor': {
			const inch = item.diagonalInch;
			if (!inch) return base;
			const width = round(
				inch * 2.54 * (ASPECT_WIDTH[item.aspect ?? '16:9'] ?? ASPECT_WIDTH['16:9']) + 2
			);
			return { ...base, width, depth: 25, watts: inch >= 40 ? 120 : inch >= 30 ? 70 : 45 };
		}
		case 'keyboard': {
			const layout = item.layout ?? '';
			if (/풀배열|풀사이즈|104|108|100%/.test(layout)) return { ...base, width: 44 };
			if (/75%|84키/.test(layout)) return { ...base, width: 32, depth: 13 };
			if (/60%|65%|HHKB|해피해킹/.test(layout)) return { ...base, width: 30, depth: 11 };
			return base;
		}
		case 'desk':
			return /모션|스탠딩|전동|DL6/.test(name)
				? { ...base, cable: 180, watts: 200, wattsBasis: 'estimate' }
				: base;
		case 'lighting':
			if (/스크린바|ScreenBar|라이트 바|Light Bar/i.test(name))
				return {
					category: 'accessory',
					kind: 'lightbar',
					layer: 'mount',
					cable: 0,
					requiresSupport: true,
					width: 45,
					depth: 9,
					watts: 0,
					wattsBasis: 'usb'
				};
			if (/플로어|Floor|장스탠드/i.test(name))
				return { ...base, layer: 'floor', width: 30, depth: 30, watts: 30 };
			return base;
		case 'console':
			return /스팀덱|Steam Deck/i.test(name)
				? {
						category: 'personal',
						kind: 'handheld',
						layer: 'surface',
						cable: 0,
						requiresSupport: true,
						width: 30,
						depth: 12,
						watts: 0
					}
				: base;
		default:
			return base;
	}
}

/** V에 이미 있는 제품의 쇼핑몰 slug를 찾는 표: V 모델 id → 쇼핑몰 상품 */
function shopByModelId(feed: ShopFeed): Map<string, ShopFeedItem> {
	const map = new Map<string, ShopFeedItem>();
	for (const item of feed.items) {
		// 판매를 마친 상품은 판매가·링크를 달지 않습니다.
		if (item.discontinued) continue;
		map.set(item.id, item);
		for (const alias of item.aliases ?? []) map.set(alias, item);
	}
	return map;
}

/** V 모델 가운데 쇼핑몰에서도 파는 것에 쇼핑몰 slug와 판매가를 답니다. */
export function withShop(models: readonly CatalogEntry[], feed: ShopFeed): CatalogEntry[] {
	const byModel = shopByModelId(feed);
	return models.map((entry) => {
		const item = byModel.get(entry.id);
		return item ? { ...entry, shop: { slug: item.id, price: item.price } } : entry;
	});
}

/**
 * 쇼핑몰 피드에서 V에 없는 제품만 카탈로그 항목으로 만듭니다.
 * slug나 별칭이 V 모델 id와 같으면 같은 제품으로 보고 건너뜁니다.
 */
export function shopEntries(feed: ShopFeed, models: readonly CatalogEntry[]): CatalogEntry[] {
	const known = new Set(models.map((entry) => entry.id));
	const entries: CatalogEntry[] = [];
	for (const item of feed.items) {
		if (known.has(item.id) || item.aliases?.some((alias) => known.has(alias))) continue;
		const base = shape(item);
		if (!base) continue;
		const { width: baseWidth, depth: baseDepth, wattsBasis, ...rest } = base;
		const width = item.widthCm ?? baseWidth;
		const depth = item.depthCm ?? baseDepth;
		const measured = item.widthCm !== undefined && item.depthCm !== undefined;
		entries.push({
			...rest,
			id: item.id,
			name: modelName(item),
			brand: item.brand,
			width,
			depth,
			...(wattsBasis ? { wattsBasis } : {}),
			...(item.diagonalInch ? { diagonalInch: item.diagonalInch } : {}),
			...(measured ? {} : { dimsBasis: 'estimate' as const }),
			keywords: ['쇼핑몰', 'My-First-Gear'],
			shop: {
				slug: item.id,
				price: item.price,
				imported: true,
				...(item.discontinued ? { discontinued: true } : {})
			}
		});
		known.add(item.id);
	}
	return entries;
}
