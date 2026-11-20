/*
 * My-First-Gear 쇼핑몰과 주고받는 제품 목록(피드)의 모양입니다.
 * 두 앱은 각자 자기 제품만 /feed/gear.json으로 내보내고, 상대 피드에서 자기에게 없는 제품만 가져옵니다.
 * 모양을 바꾸면 version을 올리고 쇼핑몰 쪽(packages/catalog/src/sync)도 함께 바꿉니다.
 */

export const SHOP_URL = 'https://my-first-gear-ryushin01.vercel.app';

/** 쇼핑몰 상품 화면 주소입니다. 피드의 주소를 그대로 쓰지 않고 slug로 만듭니다. */
export function shopProductUrl(slug: string): string {
	return `${SHOP_URL}/product/${encodeURIComponent(slug)}`;
}

/** 쇼핑몰이 내보내는 상품 한 개 */
export interface ShopFeedItem {
	/** 상품 slug */
	id: string;
	name: string;
	brand: string;
	/** 쇼핑몰 카테고리 (monitor, keyboard 등) */
	category: string;
	/** 판매가 (원, 가상 가격) */
	price: number;
	/** slug가 달라도 같은 제품인 V 모델 id */
	aliases?: string[];
	widthCm?: number;
	depthCm?: number;
	diagonalInch?: number;
	/** 화면 비율 (예: '21:9') */
	aspect?: string;
	/** 키보드 배열 (예: '텐키리스 (87키)') */
	layout?: string;
	/**
	 * 쇼핑몰에서 빠졌지만 V 스냅샷에 남겨 둔 상품입니다(쇼핑몰 피드에는 없는 값).
	 * 이미 놓은 배치도가 그대로 열리도록 카탈로그에는 두고 목록과 쇼핑몰 링크에서만 뺍니다.
	 */
	discontinued?: boolean;
}

export interface ShopFeed {
	version: 1;
	source: 'my-first-gear';
	items: ShopFeedItem[];
}

/** V가 내보내는 실제 모델 한 개. 크기는 cm, 전력은 W입니다. */
export interface PlannerFeedItem {
	id: string;
	name: string;
	brand: string;
	kind: string;
	category: string;
	layer: string;
	width: number;
	depth: number;
	watts: number;
	wattsBasis?: string;
	cable: number;
	diagonalInch?: number;
	ports?: number;
	dimsBasis?: 'estimate';
}

export interface PlannerFeed {
	version: 1;
	source: 'v';
	items: PlannerFeedItem[];
}
