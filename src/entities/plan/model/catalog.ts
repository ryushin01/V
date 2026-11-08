import type { CatalogCategory, CatalogEntry } from './types';

/** 치수와 전력은 흔한 제품을 기준으로 잡은 기본값입니다. 특정 제품의 사양이 아닙니다. */
export const CATALOG: readonly CatalogEntry[] = [
	{
		id: 'desk-140',
		name: '책상 140',
		category: 'furniture',
		kind: 'desk',
		width: 140,
		depth: 70,
		layer: 'floor',
		watts: 0,
		cable: 0
	},
	{
		id: 'desk-160',
		name: '책상 160',
		category: 'furniture',
		kind: 'desk',
		width: 160,
		depth: 80,
		layer: 'floor',
		watts: 0,
		cable: 0
	},
	{
		id: 'tv-stand',
		name: 'TV장',
		category: 'furniture',
		kind: 'stand',
		width: 160,
		depth: 40,
		layer: 'floor',
		watts: 0,
		cable: 0
	},
	{
		id: 'chair',
		name: '사무용 의자',
		category: 'furniture',
		kind: 'chair',
		width: 62,
		depth: 62,
		layer: 'floor',
		watts: 0,
		cable: 0
	},
	{
		id: 'gaming-chair',
		name: '게이밍 의자',
		category: 'furniture',
		kind: 'chair',
		width: 70,
		depth: 72,
		layer: 'floor',
		watts: 0,
		cable: 0
	},
	{
		id: 'sofa-2',
		name: '2인 소파',
		category: 'furniture',
		kind: 'sofa',
		width: 170,
		depth: 88,
		layer: 'floor',
		watts: 0,
		cable: 0
	},
	{
		id: 'monitor-27',
		name: '모니터 27인치',
		category: 'display',
		kind: 'monitor',
		width: 62,
		depth: 20,
		layer: 'surface',
		watts: 45,
		cable: 150,
		diagonalInch: 27,
		requiresSupport: true
	},
	{
		id: 'monitor-34',
		name: '울트라와이드 34인치',
		category: 'display',
		kind: 'monitor',
		width: 82,
		depth: 24,
		layer: 'surface',
		watts: 70,
		cable: 150,
		diagonalInch: 34,
		requiresSupport: true
	},
	{
		id: 'tv-55',
		name: 'TV 55인치',
		category: 'display',
		kind: 'tv',
		width: 123,
		depth: 26,
		layer: 'surface',
		watts: 120,
		cable: 180,
		diagonalInch: 55
	},
	{
		id: 'tv-65',
		name: 'TV 65인치',
		category: 'display',
		kind: 'tv',
		width: 145,
		depth: 30,
		layer: 'surface',
		watts: 170,
		cable: 180,
		diagonalInch: 65
	},
	{
		id: 'pc-tower',
		name: 'PC 타워',
		category: 'computing',
		kind: 'pc',
		width: 23,
		depth: 47,
		layer: 'surface',
		watts: 550,
		cable: 180
	},
	{
		id: 'console',
		name: '거치형 게임기',
		category: 'computing',
		kind: 'console',
		width: 36,
		depth: 26,
		layer: 'surface',
		watts: 200,
		cable: 150
	},
	{
		id: 'handheld-dock',
		name: '휴대용 게임기 독',
		category: 'computing',
		kind: 'console',
		width: 18,
		depth: 11,
		layer: 'surface',
		watts: 40,
		cable: 150,
		requiresSupport: true
	},
	{
		id: 'speaker',
		name: '스피커',
		category: 'audio',
		kind: 'speaker',
		width: 18,
		depth: 24,
		layer: 'surface',
		watts: 40,
		cable: 150
	},
	{
		id: 'subwoofer',
		name: '서브우퍼',
		category: 'audio',
		kind: 'subwoofer',
		width: 36,
		depth: 36,
		layer: 'floor',
		watts: 120,
		cable: 180
	},
	{
		id: 'soundbar',
		name: '사운드바',
		category: 'audio',
		kind: 'soundbar',
		width: 90,
		depth: 11,
		layer: 'surface',
		watts: 40,
		cable: 150,
		requiresSupport: true
	},
	{
		id: 'receiver',
		name: 'AV 리시버',
		category: 'audio',
		kind: 'receiver',
		width: 43,
		depth: 34,
		layer: 'surface',
		watts: 200,
		cable: 150,
		requiresSupport: true
	},
	{
		id: 'outlet-2',
		name: '벽 콘센트 2구',
		category: 'power',
		kind: 'outlet',
		width: 12,
		depth: 4,
		layer: 'wall',
		watts: 0,
		cable: 0,
		ports: 2,
		ratedWatts: 3520
	},
	{
		id: 'strip-4',
		name: '멀티탭 4구',
		category: 'power',
		kind: 'strip',
		width: 27,
		depth: 6,
		layer: 'cable',
		watts: 0,
		cable: 150,
		ports: 4,
		ratedWatts: 2500
	},
	{
		id: 'strip-6',
		name: '멀티탭 6구',
		category: 'power',
		kind: 'strip',
		width: 40,
		depth: 6,
		layer: 'cable',
		watts: 0,
		cable: 300,
		ports: 6,
		ratedWatts: 2500
	}
];

export const CATEGORY_LABELS: Record<CatalogCategory, string> = {
	furniture: '가구',
	display: '화면',
	computing: 'PC·게임기',
	audio: '오디오',
	power: '전원'
};

const byId = new Map(CATALOG.map((entry) => [entry.id, entry]));

export function findCatalogEntry(id: string): CatalogEntry | undefined {
	return byId.get(id);
}

export function getCatalogEntry(id: string): CatalogEntry {
	const entry = byId.get(id);
	if (!entry) throw new Error(`알 수 없는 카탈로그 항목: ${id}`);
	return entry;
}
