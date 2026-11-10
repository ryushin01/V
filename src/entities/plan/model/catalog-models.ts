import type { CatalogCategory, CatalogEntry, ItemKind, ItemLayer, WattsBasis } from './types';

interface Base {
	category: CatalogCategory;
	kind: ItemKind;
	layer: ItemLayer;
	cable: number;
	requiresSupport?: boolean;
}

const MONITOR: Base = {
	category: 'display',
	kind: 'monitor',
	layer: 'surface',
	cable: 150,
	requiresSupport: true
};
const TV: Base = { category: 'display', kind: 'tv', layer: 'surface', cable: 180 };
const CONSOLE: Base = { category: 'computing', kind: 'console', layer: 'surface', cable: 150 };
const DOCK: Base = { ...CONSOLE, requiresSupport: true };
const PC: Base = { category: 'computing', kind: 'pc', layer: 'surface', cable: 180 };
const DESK: Base = { category: 'furniture', kind: 'desk', layer: 'floor', cable: 0 };
const STAND: Base = { category: 'furniture', kind: 'stand', layer: 'floor', cable: 0 };
const CHAIR: Base = { category: 'furniture', kind: 'chair', layer: 'floor', cable: 0 };
const SOUNDBAR: Base = {
	category: 'audio',
	kind: 'soundbar',
	layer: 'surface',
	cable: 150,
	requiresSupport: true
};
const SUBWOOFER: Base = { category: 'audio', kind: 'subwoofer', layer: 'floor', cable: 180 };
const RECEIVER: Base = {
	category: 'audio',
	kind: 'receiver',
	layer: 'surface',
	cable: 150,
	requiresSupport: true
};

function model(
	base: Base,
	id: string,
	brand: string,
	name: string,
	width: number,
	depth: number,
	watts: number,
	wattsBasis: WattsBasis | undefined,
	extra: Partial<CatalogEntry> = {}
): CatalogEntry {
	return { ...base, id, brand, name, width, depth, watts, wattsBasis, ...extra };
}

/**
 * 실제 제품의 바닥 면적(가로×세로, cm)과 소비 전력입니다.
 * 화면은 스탠드를 포함한 값, 게임기는 눕혀 놓은 값(Xbox Series X는 세운 값)입니다.
 * 출처와 기준은 docs/catalog.md에 정리했습니다.
 */
export const MODEL_ENTRIES: readonly CatalogEntry[] = [
	model(
		MONITOR,
		'samsung-odyssey-oled-g9',
		'Samsung',
		'Odyssey OLED G9 49인치 (G95SC)',
		119.5,
		23.7,
		220,
		'max',
		{ diagonalInch: 49, keywords: ['오디세이', '울트라와이드', '49인치'] }
	),
	model(
		MONITOR,
		'lg-ultragear-45gr95qe',
		'LG',
		'UltraGear OLED 45인치 (45GR95QE)',
		99.3,
		36.3,
		160,
		'max',
		{ diagonalInch: 44.5 }
	),
	model(
		MONITOR,
		'dell-alienware-aw3423dwf',
		'Dell',
		'Alienware 34 QD-OLED (AW3423DWF)',
		81.5,
		30.6,
		200,
		'max',
		{ diagonalInch: 34.2 }
	),
	model(
		MONITOR,
		'lg-ultragear-27gs95qe',
		'LG',
		'UltraGear OLED 27인치 (27GS95QE)',
		60.4,
		25.8,
		72,
		'max',
		{ diagonalInch: 26.5 }
	),
	model(TV, 'lg-oled-c4-65', 'LG', 'OLED evo C4 65인치 (OLED65C4)', 144.0, 23.1, 145, 'typical', {
		diagonalInch: 64.5
	}),
	model(TV, 'lg-oled-c4-55', 'LG', 'OLED evo C4 55인치 (OLED55C4)', 122.2, 23.0, 114, 'typical', {
		diagonalInch: 54.6
	}),
	model(TV, 'samsung-s90d-65', 'Samsung', 'OLED S90D 65인치 (QN65S90D)', 144.5, 26.4, 375, 'max', {
		diagonalInch: 64.5
	}),
	model(
		TV,
		'sony-bravia-8-ii-65',
		'Sony',
		'BRAVIA 8 II 65인치 (K-65XR80M2)',
		144.3,
		33.9,
		397,
		'listed',
		{ diagonalInch: 64.5 }
	),
	model(CONSOLE, 'sony-ps5-pro', 'Sony', 'PlayStation 5 Pro', 38.8, 21.6, 390, 'rated', {
		keywords: ['PS5', '플스']
	}),
	model(CONSOLE, 'sony-ps5-slim', 'Sony', 'PlayStation 5 (슬림)', 35.8, 21.6, 216, 'measured', {
		keywords: ['PS5', '플스']
	}),
	model(
		CONSOLE,
		'microsoft-xbox-series-x',
		'Microsoft',
		'Xbox Series X (세워 둠)',
		15.1,
		15.1,
		315,
		'psu',
		{ keywords: ['엑스박스', '엑박'] }
	),
	model(CONSOLE, 'microsoft-xbox-series-s', 'Microsoft', 'Xbox Series S', 27.5, 15.1, 165, 'psu', {
		keywords: ['엑스박스', '엑박']
	}),
	model(
		DOCK,
		'nintendo-switch-2-dock',
		'Nintendo',
		'Nintendo Switch 2 독',
		20.1,
		5.1,
		60,
		'adapter',
		{ keywords: ['스위치'] }
	),
	model(PC, 'apple-mac-mini-m4', 'Apple', 'Mac mini (M4)', 12.7, 12.7, 155, 'max'),
	model(PC, 'apple-mac-studio-2025', 'Apple', 'Mac Studio (2025)', 19.7, 19.7, 480, 'max'),
	model(
		PC,
		'lian-li-o11-dynamic-evo',
		'Lian Li',
		'O11 Dynamic EVO 케이스',
		28.5,
		46.5,
		550,
		'estimate'
	),
	model(PC, 'nzxt-h9-flow', 'NZXT', 'H9 Flow 케이스', 29.0, 49.5, 550, 'estimate'),
	model(PC, 'fractal-north', 'Fractal Design', 'North 케이스', 21.5, 46.9, 550, 'estimate'),
	model(DESK, 'ikea-uppspel-180', 'IKEA', 'UPPSPEL 게이밍 책상 180', 180, 80, 0, undefined),
	model(DESK, 'secretlab-magnus-pro', 'Secretlab', 'MAGNUS Pro 책상', 150, 70, 0, undefined),
	model(DESK, 'secretlab-magnus-pro-xl', 'Secretlab', 'MAGNUS Pro XL 책상', 177, 80, 0, undefined),
	model(STAND, 'ikea-besta-180', 'IKEA', 'BESTÅ TV장 180', 180, 42, 0, undefined),
	model(
		CHAIR,
		'herman-miller-aeron-b',
		'Herman Miller',
		'Aeron 의자 (B 사이즈)',
		68.6,
		69.8,
		0,
		undefined
	),
	model(SOUNDBAR, 'sonos-arc-ultra', 'Sonos', 'Arc Ultra 사운드바', 117.8, 11.1, 40, 'default'),
	model(SUBWOOFER, 'sonos-sub-4', 'Sonos', 'Sub 4 서브우퍼', 40.2, 15.8, 120, 'default'),
	model(SOUNDBAR, 'samsung-hw-q990d', 'Samsung', 'HW-Q990D 사운드바', 123.2, 13.8, 41, 'typical'),
	model(
		SUBWOOFER,
		'samsung-hw-q990d-sub',
		'Samsung',
		'HW-Q990D 서브우퍼',
		22.0,
		41.0,
		26,
		'typical'
	),
	model(RECEIVER, 'denon-avr-x1800h', 'Denon', 'AVR-X1800H AV 리시버', 43.4, 33.9, 430, 'rated')
];
