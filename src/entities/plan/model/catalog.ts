import { MODEL_ENTRIES } from './catalog-models';
import type { CatalogCategory, CatalogEntry, ItemData, SpecKey, WattsBasis } from './types';

/** 치수와 전력은 흔한 제품을 기준으로 잡은 기본값입니다. 특정 제품의 사양이 아닙니다. */
const GENERIC_ENTRIES: readonly CatalogEntry[] = [
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
		id: 'laptop-15',
		name: '노트북 15인치',
		category: 'computing',
		kind: 'laptop',
		width: 34,
		depth: 24,
		layer: 'surface',
		watts: 65,
		cable: 180,
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

/** 크기별 기본 물건 다음에 실제 제품을 둡니다. */
export const CATALOG: readonly CatalogEntry[] = [...GENERIC_ENTRIES, ...MODEL_ENTRIES];

export const CATEGORY_LABELS: Record<CatalogCategory, string> = {
	furniture: '가구',
	display: '화면',
	computing: 'PC·게임기',
	input: '키보드·마우스',
	audio: '오디오',
	personal: '휴대 기기·음향',
	accessory: '조명·거치·소품',
	power: '전원'
};

export const WATTS_BASIS_LABELS: Record<WattsBasis, string> = {
	max: '제조사 표기 최대 소비 전력',
	typical: '일반 사용 소비 전력 (판매처 표기)',
	rated: '정격 소비 전력',
	listed: '판매처 표기 소비 전력',
	psu: '내장 전원부 정격',
	adapter: '전원 어댑터 정격',
	measured: '리뷰 실측값 (제조사 미표기)',
	estimate: 'PC 구성에 따라 다른 추정값',
	default: '제조사 미표기, 카탈로그 기본값',
	usb: 'USB 전원이라 콘센트를 쓰지 않음'
};

/** 검색어와 비교하기 위해 공백과 대소문자를 없앱니다. */
const normalize = (text: string) => text.toLowerCase().replace(/[\s·()-]/g, '');

const BRAND_KOREAN: Record<string, string> = {
	Samsung: '삼성',
	LG: '엘지',
	Sony: '소니',
	Dell: '델',
	Microsoft: '마이크로소프트',
	Nintendo: '닌텐도',
	Apple: '애플',
	IKEA: '이케아',
	Secretlab: '시크릿랩',
	'Herman Miller': '허먼밀러',
	Sonos: '소노스',
	Denon: '데논',
	Antec: '안텍',
	Logitech: '로지텍',
	Razer: '레이저',
	Leopold: '레오폴드',
	Realforce: '리얼포스',
	Creative: '크리에이티브',
	BenQ: '벤큐',
	Xiaomi: '샤오미',
	Ergotron: '어고트론',
	Kensington: '켄싱턴',
	Bose: '보스',
	Shure: '슈어',
	Sennheiser: '젠하이저',
	'Astell&Kern': '아스텔앤컨',
	Cowon: '코원',
	Moondrop: '수월우',
	FiiO: '피오',
	Nothing: '낫씽',
	Lenovo: '레노버',
	Hansung: '한성',
	Bestpiece: '베스트피스',
	Gigabyte: '기가바이트'
};

export function matchesCatalogQuery(entry: CatalogEntry, query: string): boolean {
	// 띄어 쓴 낱말이 모두 들어 있으면 찾은 것으로 봅니다. 예: 'ps5 pro'
	const needles = query.split(/\s+/).map(normalize).filter(Boolean);
	if (needles.length === 0) return true;
	const haystack = [
		entry.brand ?? '',
		entry.brand ? (BRAND_KOREAN[entry.brand] ?? '') : '',
		entry.name,
		CATEGORY_LABELS[entry.category],
		...(entry.keywords ?? [])
	].join(' ');
	const target = normalize(haystack);
	return needles.every((needle) => target.includes(needle));
}

/** 사용자가 입력할 수 있는 규격의 범위입니다. */
export const SPEC_LIMITS: Record<SpecKey, { min: number; max: number }> = {
	width: { min: 1, max: 500 },
	depth: { min: 1, max: 500 },
	watts: { min: 0, max: 5000 },
	cable: { min: 0, max: 2000 },
	diagonalInch: { min: 10, max: 120 },
	ports: { min: 1, max: 20 }
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

/** 카탈로그 값에 사용자 규격을 덮어씁니다. 원래 없는 규격(의자의 전력 등)은 무시합니다. */
export function resolveEntry(item: Pick<ItemData, 'catalogId' | 'specs'>): CatalogEntry {
	const base = getCatalogEntry(item.catalogId);
	if (!item.specs) return base;
	const merged = { ...base };
	for (const key of Object.keys(SPEC_LIMITS) as SpecKey[]) {
		const value = item.specs[key];
		if (value !== undefined && base[key] !== undefined) merged[key] = value;
	}
	return merged;
}
