import type { CatalogEntry } from '../types';
import type { PlannerFeed, PlannerFeedItem } from './feeds';

function feedItem(entry: CatalogEntry): PlannerFeedItem {
	const item: PlannerFeedItem = {
		id: entry.id,
		name: entry.name,
		brand: entry.brand ?? '',
		kind: entry.kind,
		category: entry.category,
		layer: entry.layer,
		width: entry.width,
		depth: entry.depth,
		watts: entry.watts,
		cable: entry.cable
	};
	if (entry.wattsBasis) item.wattsBasis = entry.wattsBasis;
	if (entry.diagonalInch) item.diagonalInch = entry.diagonalInch;
	if (entry.ports) item.ports = entry.ports;
	if (entry.dimsBasis) item.dimsBasis = entry.dimsBasis;
	return item;
}

/**
 * 쇼핑몰에 넘기는 실제 모델 목록입니다. 제조사가 있는 V 모델만 싣고,
 * 쇼핑몰에서 가져온 제품은 쇼핑몰로 되돌려 보내지 않습니다. /feed/gear.json으로 공개합니다.
 */
export function plannerFeed(models: readonly CatalogEntry[]): PlannerFeed {
	return {
		version: 1,
		source: 'v',
		items: models.filter((entry) => entry.brand && !entry.shop?.imported).map(feedItem)
	};
}
