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
const LAPTOP: Base = {
	category: 'computing',
	kind: 'laptop',
	layer: 'surface',
	cable: 180,
	requiresSupport: true
};
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

const KEYBOARD: Base = {
	category: 'input',
	kind: 'keyboard',
	layer: 'surface',
	cable: 0,
	requiresSupport: true
};
const MOUSE: Base = {
	category: 'input',
	kind: 'mouse',
	layer: 'surface',
	cable: 0,
	requiresSupport: true
};
const MOUSEPAD: Base = {
	category: 'input',
	kind: 'mousepad',
	layer: 'mat',
	cable: 0,
	requiresSupport: true
};
const PALMREST: Base = {
	category: 'input',
	kind: 'palmrest',
	layer: 'surface',
	cable: 0,
	requiresSupport: true
};
const LIGHTBAR: Base = {
	category: 'accessory',
	kind: 'lightbar',
	layer: 'mount',
	cable: 0,
	requiresSupport: true
};
const ARM: Base = {
	category: 'accessory',
	kind: 'arm',
	layer: 'mount',
	cable: 0,
	requiresSupport: true
};
const FOOTREST: Base = { category: 'furniture', kind: 'footrest', layer: 'floor', cable: 0 };
const HEADPHONES: Base = {
	category: 'personal',
	kind: 'headphones',
	layer: 'surface',
	cable: 0,
	requiresSupport: true
};
const EARPHONES: Base = {
	category: 'personal',
	kind: 'earphones',
	layer: 'surface',
	cable: 0,
	requiresSupport: true
};
const AUDIO_DEVICE: Base = {
	category: 'personal',
	kind: 'audio-device',
	layer: 'surface',
	cable: 0,
	requiresSupport: true
};
const DESK_AUDIO: Base = {
	category: 'audio',
	kind: 'audio-device',
	layer: 'surface',
	cable: 150,
	requiresSupport: true
};
const HANDHELD: Base = {
	category: 'personal',
	kind: 'handheld',
	layer: 'surface',
	cable: 0,
	requiresSupport: true
};
const HOLDER: Base = {
	category: 'accessory',
	kind: 'holder',
	layer: 'surface',
	cable: 0,
	requiresSupport: true
};
const POWERED_HOLDER: Base = { ...HOLDER, cable: 150 };
const HUB: Base = {
	category: 'accessory',
	kind: 'hub',
	layer: 'surface',
	cable: 0,
	requiresSupport: true
};
const POWERED_HUB: Base = { ...HUB, cable: 150 };
const DECOR: Base = {
	category: 'accessory',
	kind: 'decor',
	layer: 'surface',
	cable: 0,
	requiresSupport: true
};
const DESK_MOTOR: Base = { ...DESK, cable: 180 };
/** 책상 위에 놓고 그 위에 다시 화면·스피커를 올리는 선반과 받침대입니다. */
const SHELF: Base = {
	category: 'furniture',
	kind: 'shelf',
	layer: 'mat',
	cable: 0,
	requiresSupport: true
};
const POWER_SHELF: Base = { ...SHELF, cable: 180 };
const DESK_SPEAKER: Base = { category: 'audio', kind: 'speaker', layer: 'surface', cable: 150 };
const USB_SPEAKER: Base = { ...DESK_SPEAKER, cable: 120 };
const PASSIVE_SPEAKER: Base = { ...DESK_SPEAKER, cable: 0 };
const POWERED_LIGHTBAR: Base = { ...LIGHTBAR, cable: 150 };
/** 책상에도 바닥에도 둘 수 있는 조명입니다. */
const DESK_LAMP: Base = { category: 'accessory', kind: 'lamp', layer: 'surface', cable: 200 };
const USB_DESK_LAMP: Base = { ...DESK_LAMP, cable: 0, requiresSupport: true };
const FLOOR_LAMP: Base = { category: 'accessory', kind: 'lamp', layer: 'floor', cable: 200 };
const USB_DECOR: Base = { ...DECOR, cable: 150 };
const USB_INPUT: Base = { ...KEYBOARD, kind: 'hub', cable: 150 };
/** 책상 아래에 다는 물건은 위의 물건과 겹치지 않습니다. */
const UNDER_DESK: Base = { ...DECOR, layer: 'mount' };
const WALL_DECOR: Base = { category: 'accessory', kind: 'decor', layer: 'wall', cable: 0 };
const EST = { dimsBasis: 'estimate' } as const;

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
const ENTRIES: CatalogEntry[] = [
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
	model(DESK, 'ikea-uppspel-180', 'IKEA', 'UPPSPEL 게이밍 책상 180', 180, 80, 240, 'psu', {
		cable: 180
	}),
	model(DESK, 'secretlab-magnus-pro', 'Secretlab', 'MAGNUS Pro 책상', 150, 70, 200, 'estimate', {
		cable: 180
	}),
	model(
		DESK,
		'secretlab-magnus-pro-xl',
		'Secretlab',
		'MAGNUS Pro XL 책상',
		177,
		80,
		200,
		'estimate',
		{ cable: 180 }
	),
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
	model(RECEIVER, 'denon-avr-x1800h', 'Denon', 'AVR-X1800H AV 리시버', 43.4, 33.9, 430, 'rated'),
	model(
		LAPTOP,
		'apple-macbook-air-13',
		'Apple',
		'MacBook Air 13인치 (M4)',
		30.4,
		21.5,
		30,
		'adapter',
		{ keywords: ['맥북'] }
	),
	model(
		LAPTOP,
		'apple-macbook-air-15',
		'Apple',
		'MacBook Air 15인치 (M4)',
		34.0,
		23.8,
		35,
		'adapter',
		{ keywords: ['맥북'] }
	),
	model(LAPTOP, 'apple-macbook-pro-14', 'Apple', 'MacBook Pro 14인치', 31.3, 22.1, 70, 'adapter', {
		keywords: ['맥북']
	}),
	model(LAPTOP, 'apple-macbook-pro-16', 'Apple', 'MacBook Pro 16인치', 35.6, 24.8, 140, 'adapter', {
		keywords: ['맥북']
	}),
	model(MONITOR, 'apple-imac-24', 'Apple', 'iMac 24인치 (M4)', 54.7, 14.7, 143, 'adapter', {
		diagonalInch: 23.5,
		keywords: ['아이맥']
	}),
	model(
		MONITOR,
		'apple-studio-display',
		'Apple',
		'Studio Display 27인치',
		62.3,
		16.8,
		21,
		'typical',
		{ diagonalInch: 27, keywords: ['스튜디오 디스플레이'] }
	),
	model(PC, 'antec-torque', 'Antec', 'Torque 오픈 프레임 케이스', 28.5, 62.1, 550, 'estimate', {
		keywords: ['토크']
	}),
	// 사용자 요청 목록 (2026-11-10). 치수를 찾지 못한 제품은 dimsBasis: 'estimate'입니다.
	model(
		DESK,
		'bestpiece-mattz-1800',
		'Bestpiece',
		'모션데스크 매츠 1800 (블랙 스왈로우)',
		180,
		80,
		200,
		'estimate',
		{ ...EST, cable: 180, keywords: ['Mattz', '매츠'] }
	),
	model(FOOTREST, 'sizeof-footrest', 'SIZE OF', '사이즈오브 발받침대', 45, 35, 0, undefined, {
		...EST,
		keywords: ['발받침']
	}),
	model(FOOTREST, 'pullizio-footrest', 'Pullizio', '풀리지오 풋레스트', 45, 33, 0, undefined, {
		...EST,
		keywords: ['발받침', '풋레스트']
	}),
	model(MONITOR, 'dell-up3216q', 'Dell', 'UltraSharp 32 4K (UP3216Q)', 75.0, 21.4, 130, 'max', {
		diagonalInch: 31.5
	}),
	model(
		PC,
		'white-highend-pc',
		'Lian Li',
		'화이트 하이엔드 PC (O11 Vision 케이스)',
		30.4,
		46.5,
		850,
		'estimate',
		{ ...EST, keywords: ['화이트', '조립 PC', 'AERO'] }
	),
	model(ARM, 'ergotron-hx', 'Ergotron', 'HX 데스크 모니터암', 46, 15, 0, undefined, {
		...EST,
		keywords: ['모니터암']
	}),
	model(ARM, 'dell-msa20', 'Dell', '싱글 모니터암 (MSA20)', 40, 12, 0, undefined, {
		...EST,
		keywords: ['모니터암']
	}),
	model(LIGHTBAR, 'benq-screenbar-plus', 'BenQ', 'ScreenBar Plus 모니터 조명', 45, 9, 0, 'usb', {
		keywords: ['스크린바']
	}),
	model(
		LIGHTBAR,
		'xiaomi-mijia-light-bar',
		'Xiaomi',
		'미지아 모니터 조명 (27인치용)',
		44.8,
		9,
		0,
		'usb',
		{ ...EST, keywords: ['미지아'] }
	),
	model(LIGHTBAR, 'luxy-mx1', 'Luxy', '럭시 MX1 노트북 모니터 조명', 30, 4, 0, 'usb', EST),
	model(
		KEYBOARD,
		'leopold-fc980c',
		'Leopold',
		'FC980C 무접점 (한글 블랙)',
		38.2,
		13.6,
		0,
		undefined,
		EST
	),
	model(
		KEYBOARD,
		'phoenix-keyboard',
		'Cable Car Designs',
		'Phoenix TKL 키보드 키트 (F13)',
		36.4,
		14.0,
		0,
		undefined,
		{
			...EST,
			keywords: ['피닉스', 'Phoenix', 'F13', '텐키리스']
		}
	),
	model(KEYBOARD, 'apple-magic-keyboard', 'Apple', 'Magic Keyboard', 27.9, 11.5, 0, undefined, {
		keywords: ['매직 키보드']
	}),
	model(
		KEYBOARD,
		'hhkb-hybrid-type-s',
		'PFU',
		'HHKB Professional HYBRID Type-S (스노우)',
		29.4,
		11.0,
		0,
		undefined,
		{ ...EST, keywords: ['해피해킹'] }
	),
	model(KEYBOARD, 'hansung-gk868b', 'Hansung', 'GK868B TICO 무접점', 36.0, 13.5, 0, undefined, EST),
	model(
		KEYBOARD,
		'leopold-fc660mbt',
		'Leopold',
		'FC660MBT PD 화이트 (저소음 적축)',
		32.5,
		11.0,
		0,
		undefined,
		EST
	),
	model(
		KEYBOARD,
		'realforce-r3tl',
		'Realforce',
		'R3TL BT 저소음 45g',
		36.9,
		14.2,
		0,
		undefined,
		EST
	),
	model(KEYBOARD, 'vgn-vxe75', 'VGN', 'VXE75 (실버, 아니아축)', 32.3, 13.6, 0, undefined, EST),
	model(KEYBOARD, 'wooting-80he', 'Wooting', '80HE 래피드 트리거', 34.6, 14.2, 0, undefined, {
		keywords: ['우팅', '래피드 트리거']
	}),
	model(
		KEYBOARD,
		'glorious-gmmk3-pro-he',
		'Glorious',
		'GMMK 3 PRO HE 75%',
		33.2,
		14.3,
		0,
		undefined,
		{ ...EST, keywords: ['래피드 트리거'] }
	),
	model(
		KEYBOARD,
		'asus-rog-falchion-ace-hfx',
		'ASUS',
		'ROG Falchion Ace HFX',
		31.3,
		10.5,
		0,
		undefined,
		{ ...EST, keywords: ['래피드 트리거', '팔시온'] }
	),
	model(
		KEYBOARD,
		'razer-huntsman-v3-pro-mini',
		'Razer',
		'Huntsman V3 Pro Mini',
		29.4,
		10.3,
		0,
		undefined,
		{ ...EST, keywords: ['헌츠맨', '래피드 트리거'] }
	),
	model(
		PALMREST,
		'joseph-palm-rest-fc980c',
		'죠셉공방',
		'키보드 팜레스트 파덕 원목 (FC980C용)',
		38,
		9,
		0,
		undefined,
		EST
	),
	model(
		PALMREST,
		'deltahub-carpio-g2',
		'Deltahub',
		'카르피오 G2.0 마우스 팜레스트 (스몰)',
		9,
		7.5,
		0,
		undefined,
		EST
	),
	model(PALMREST, 'zerosun-mouse-palm-rest', '제로썬', '마우스 팜레스트', 8, 7, 0, undefined, EST),
	model(
		MOUSE,
		'logitech-g-pro-x-superlight-2',
		'Logitech',
		'G PRO X SUPERLIGHT 2',
		6.35,
		12.5,
		0,
		undefined,
		{ keywords: ['지슈라', '파워플레이'] }
	),
	model(MOUSE, 'logitech-mx-master-3s', 'Logitech', 'MX Master 3S', 8.4, 12.5, 0, undefined, EST),
	model(MOUSE, 'apple-magic-mouse', 'Apple', 'Magic Mouse', 5.71, 11.35, 0, undefined, {
		keywords: ['매직 마우스']
	}),
	model(MOUSE, 'logitech-lift', 'Logitech', 'Lift 버티컬 마우스', 7.1, 10.8, 0, undefined, {
		...EST,
		keywords: ['리프트']
	}),
	model(MOUSE, 'razer-deathadder-v2-pro', 'Razer', 'DeathAdder V2 Pro', 6.2, 12.7, 0, undefined, {
		keywords: ['데스에더']
	}),
	model(
		MOUSE,
		'kensington-pro-fit-ergo-vertical',
		'Kensington',
		'Pro Fit Ergo 버티컬 무선 트랙볼',
		8.6,
		13.6,
		0,
		undefined,
		{ keywords: ['트랙볼'] }
	),
	model(HOLDER, 'razer-mouse-dock-chroma', 'Razer', '마우스 충전독 크로마', 8, 8, 0, 'usb', EST),
	model(
		MOUSEPAD,
		'logitech-g-powerplay',
		'Logitech',
		'G POWERPLAY 무선 충전 패드',
		34.4,
		32.1,
		0,
		'usb',
		EST
	),
	model(MOUSEPAD, 'razer-strider-l', 'Razer', 'Strider 마우스패드 (Large)', 45, 40, 0, undefined),
	model(MOUSEPAD, 'lgg-venus-xl', 'LGG', 'Venus 마우스패드 (XL)', 49, 42, 0, undefined, EST),
	model(
		MOUSEPAD,
		'lgg-venus-pro-xl',
		'LGG',
		'Venus Pro 마우스패드 (XL)',
		49,
		42,
		0,
		undefined,
		EST
	),
	model(
		MOUSEPAD,
		'artisan-fx-zero-s',
		'Artisan',
		'FX 제로 마우스패드 (S)',
		24,
		21,
		0,
		undefined,
		EST
	),
	model(
		MOUSEPAD,
		'artisan-fx-hien-m',
		'Artisan',
		'FX 히엔 마우스패드 (M)',
		42,
		24,
		0,
		undefined,
		EST
	),
	model(
		MOUSEPAD,
		'pulsar-paracontrol-v2-xxl',
		'Pulsar',
		'ParaControl V2 장패드 (XXL)',
		90,
		40,
		0,
		undefined,
		EST
	),
	model(
		SOUNDBAR,
		'creative-katana-v2',
		'Creative',
		'Sound Blaster Katana V2 사운드바',
		60,
		9.5,
		72,
		'adapter',
		{ keywords: ['카타나'] }
	),
	model(
		SUBWOOFER,
		'creative-katana-v2-sub',
		'Creative',
		'Sound Blaster Katana V2 서브우퍼',
		15,
		36.7,
		0,
		undefined,
		{ keywords: ['카타나'] }
	),
	model(
		DESK_AUDIO,
		'jds-labs-element-iii',
		'JDS Labs',
		'Element III 앰프·DAC (레드 링)',
		22,
		18,
		10,
		'estimate',
		EST
	),
	model(
		AUDIO_DEVICE,
		'creative-soundblasterx-g1',
		'Creative',
		'Sound BlasterX G1 사운드카드',
		6.4,
		3.0,
		0,
		'usb',
		EST
	),
	model(
		AUDIO_DEVICE,
		'ifi-xdsd-gryphon',
		'iFi audio',
		'xDSD Gryphon 포터블 DAC',
		7.5,
		12.5,
		0,
		'usb',
		EST
	),
	model(AUDIO_DEVICE, 'astell-kern-hc3', 'Astell&Kern', 'AK HC3 듀얼 DAC', 2.0, 5.0, 0, 'usb', EST),
	model(AUDIO_DEVICE, 'qudelix-5k', 'Qudelix', '5K 블루투스 리시버 DAC', 2.5, 6.0, 0, 'usb', EST),
	model(
		AUDIO_DEVICE,
		'astell-kern-hb1',
		'Astell&Kern',
		'AK HB1 블루투스 DAC/AMP',
		3.6,
		7.0,
		0,
		'usb',
		EST
	),
	model(AUDIO_DEVICE, 'astell-kern-ak120', 'Astell&Kern', 'AK120 DAP', 5.9, 10.7, 0, undefined, {
		...EST,
		keywords: ['DAP']
	}),
	model(
		AUDIO_DEVICE,
		'cowon-plenue-v',
		'Cowon',
		'플레뉴 V 레드 (PV-64G)',
		5.8,
		10.1,
		0,
		undefined,
		{ ...EST, keywords: ['DAP'] }
	),
	model(
		AUDIO_DEVICE,
		'astell-kern-sp3000',
		'Astell&Kern',
		'A&ultima SP3000 DAP',
		7.6,
		13.9,
		0,
		undefined,
		{ ...EST, keywords: ['DAP', '신제품'] }
	),
	model(AUDIO_DEVICE, 'sony-nw-wm1zm2', 'Sony', '워크맨 NW-WM1ZM2', 7.3, 12.3, 0, undefined, {
		...EST,
		keywords: ['DAP', '신제품']
	}),
	model(AUDIO_DEVICE, 'sony-icf-506', 'Sony', '포터블 라디오 ICF-506', 25, 9, 5, 'estimate', {
		...EST,
		keywords: ['라디오']
	}),
	model(HEADPHONES, 'sony-mdr-1a', 'Sony', 'MDR-1A 헤드폰', 17, 22, 0, undefined, EST),
	model(HEADPHONES, 'bose-qc45', 'Bose', 'QuietComfort 45 헤드폰', 16, 19, 0, undefined, EST),
	model(
		HEADPHONES,
		'gigabyte-aorus-h1',
		'Gigabyte',
		'AORUS H1 RGB FUSION 헤드셋',
		18,
		21,
		0,
		undefined,
		EST
	),
	model(EARPHONES, 'shure-se846', 'Shure', 'SE846 이어폰', 6, 4, 0, undefined, EST),
	model(
		EARPHONES,
		'astell-kern-zero1',
		'Astell&Kern',
		'AK ZERO1 블랙 에디션',
		6,
		4,
		0,
		undefined,
		EST
	),
	model(EARPHONES, 'moondrop-starfield', 'Moondrop', '스타필드 이어폰', 6, 4, 0, undefined, EST),
	model(
		EARPHONES,
		'moondrop-starfield-2',
		'Moondrop',
		'스타필드 2 이어폰',
		6,
		4,
		0,
		undefined,
		EST
	),
	model(EARPHONES, 'fiio-ff5', 'FiiO', 'FF5 이어버드', 6, 4, 0, undefined, EST),
	model(EARPHONES, '7hz-salnotes-zero', '7Hz', 'Salnotes Zero 이어폰', 6, 4, 0, undefined, EST),
	model(
		EARPHONES,
		'7hz-crinacle-zero-2',
		'7Hz',
		'x Crinacle Zero 2 이어폰',
		6,
		4,
		0,
		undefined,
		EST
	),
	model(EARPHONES, 'bang-olufsen-a8', 'Bang & Olufsen', 'A8 이어폰', 7, 5, 0, undefined, EST),
	model(EARPHONES, 'nothing-ear-2', 'Nothing', 'Ear (2) (케이스)', 5.6, 5.6, 0, undefined, EST),
	model(
		EARPHONES,
		'nothing-ear-stick',
		'Nothing',
		'Ear (stick) 화이트 (케이스)',
		8.7,
		2.9,
		0,
		undefined,
		EST
	),
	model(EARPHONES, 'sennheiser-mx375', 'Sennheiser', 'MX375 이어버드', 6, 4, 0, undefined, EST),
	model(EARPHONES, 'final-e1000', 'final', 'E1000 이어폰', 6, 4, 0, undefined, EST),
	model(EARPHONES, 'apple-airpods-pro', 'Apple', 'AirPods Pro (케이스)', 6.1, 4.5, 0, undefined, {
		...EST,
		keywords: ['에어팟']
	}),
	model(EARPHONES, 'dunu-alpha-3', 'DUNU', 'Alpha 3 이어버드', 6, 4, 0, undefined, EST),
	model(EARPHONES, 'akg-n5005', 'AKG', 'N5005 이어폰', 6, 4, 0, undefined, EST),
	model(EARPHONES, 'musehifi-the-east-6', 'MuseHiFi', 'The East 6 이어폰', 6, 4, 0, undefined, EST),
	model(
		EARPHONES,
		'tangzu-waner-studio',
		'TANGZU',
		"Wan'er Studio 이어폰",
		6,
		4,
		0,
		undefined,
		EST
	),
	model(
		EARPHONES,
		'creative-aurvana-air',
		'Creative',
		'Aurvana Air (케이스)',
		6.5,
		4.8,
		0,
		undefined,
		EST
	),
	model(
		DOCK,
		'nintendo-switch-oled',
		'Nintendo',
		'Nintendo Switch OLED (독에 꽂은 상태)',
		24.2,
		5.4,
		39,
		'estimate',
		{ ...EST, keywords: ['스위치'] }
	),
	model(
		LAPTOP,
		'samsung-notebook-odyssey',
		'Samsung',
		'노트북 오디세이 15.6인치',
		35.9,
		23.9,
		180,
		'estimate',
		{ ...EST, keywords: ['노트북'] }
	),
	model(
		HOLDER,
		'twelve-south-bookarc',
		'Twelve South',
		'BookArc 노트북 거치대 (스페이스 그레이)',
		9,
		11,
		0,
		undefined,
		EST
	),
	model(
		HANDHELD,
		'lenovo-legion-y700',
		'Lenovo',
		'LEGION Y700 태블릿',
		20.5,
		12.9,
		0,
		undefined,
		EST
	),
	model(
		HANDHELD,
		'samsung-galaxy-tab-s7-fe',
		'Samsung',
		'갤럭시 탭 S7 FE',
		28.5,
		18.5,
		0,
		undefined,
		EST
	),
	model(HANDHELD, 'samsung-galaxy-s23', 'Samsung', '갤럭시 S23', 7.1, 14.6, 0, undefined, EST),
	model(HOLDER, 'esr-halolock-stand', 'ESR', 'HaloLock 마그네틱 거치대', 7, 10, 0, undefined, {
		...EST,
		keywords: ['마그네틱', '거치대']
	}),
	model(
		POWERED_HOLDER,
		'requem-5in1-wireless-charger',
		'리큐엠',
		'5in1 무선 충전기',
		18,
		10,
		30,
		'estimate',
		{ ...EST, keywords: ['무선 충전'] }
	),
	model(
		POWERED_HUB,
		'nextu-8122sp8k60',
		'NEXT',
		'HDMI 양방향 선택 분배기 8K (8122SP8K60)',
		9.5,
		6,
		10,
		'estimate',
		{ ...EST, keywords: ['넥스트유', '셀렉터'] }
	),
	model(HUB, 'caldigit-soho-dock', 'CalDigit', 'SOHO 독', 11, 4.7, 0, undefined, {
		...EST,
		keywords: ['칼디짓']
	}),
	model(HUB, 'satechi-8in1-hub', 'Satechi', '8in1 맥북 프로 멀티 허브', 11.5, 3.5, 0, undefined, {
		...EST,
		keywords: ['사테치']
	}),
	model(
		DECOR,
		'hoverpen-2-interstellar',
		'Hoverpen',
		'호버펜 2.0 인터스텔라 (스페이스 블랙)',
		15,
		1.4,
		0,
		undefined,
		EST
	),
	model(
		DECOR,
		'genesis-g80-diecast-1-18',
		'Genesis',
		'G80 1:18 다이캐스트',
		27.8,
		10.7,
		0,
		undefined,
		{ ...EST, keywords: ['제네시스', '다이캐스트'] }
	),
	// futureterior 커뮤니티 사진에 태그된 제품 (2026-11-10)
	model(
		DESK_MOTOR,
		'oframe-barco-1600',
		'오프레임',
		'BARCO 바르코 모션데스크 1600',
		160,
		80,
		200,
		'estimate',
		{ keywords: ['바르코', '모션데스크'] }
	),
	model(
		DESK_MOTOR,
		'oframe-largo-1600',
		'오프레임',
		'LARGO 라르고 모션데스크 1600',
		160,
		80,
		200,
		'estimate',
		{ keywords: ['라르고', '모션데스크'] }
	),
	model(
		DESK_MOTOR,
		'maywood-homage-1600',
		'메이우드',
		'Homage 원목 모션데스크 1600',
		160,
		80,
		200,
		'estimate',
		{ keywords: ['오마주', '원목', '모션데스크'] }
	),
	model(
		DESK_MOTOR,
		'breed-fenix-30t-1600',
		'브리드',
		'패닉스 스탠딩 데스크 (Fenix30T) 1600',
		160,
		78,
		200,
		'estimate',
		{ keywords: ['패닉스', '페닉스', 'Fenix', '스탠딩'] }
	),
	model(
		DESK_MOTOR,
		'linak-dl6-experience',
		'LINAK',
		'DL6 EXPERIENCE 듀얼모터 모션데스크 (상판 1200×700)',
		120,
		70,
		200,
		'estimate',
		{ ...EST, keywords: ['리낙', '익스피리언스', 'DPG1C'] }
	),
	model(
		SHELF,
		'oframe-stilo-1000',
		'오프레임',
		'STILO 스틸로 프리미엄 선반 1000',
		100,
		24,
		0,
		undefined,
		{ ...EST, keywords: ['스틸로', '데스크선반'] }
	),
	model(
		SHELF,
		'oframe-feno-1000',
		'오프레임',
		'페노 프리미엄 선반 1000 (FENIX)',
		100,
		24,
		0,
		undefined,
		{ ...EST, keywords: ['페노', 'Feno', '데스크선반'] }
	),
	model(SHELF, 'maywood-prestige-shelf', '메이우드', 'Prestige 데스크선반', 90, 25, 0, undefined, {
		...EST,
		keywords: ['프레스티지', '데스크선반']
	}),
	model(
		SHELF,
		'ilian-modular-monitor-stand',
		'일리안',
		'프리미엄 모듈러 모니터 받침대',
		70,
		24,
		0,
		undefined,
		{ ...EST, keywords: ['모니터받침대'] }
	),
	model(
		SHELF,
		'1off-dual-monitor-shelf',
		'1OFF',
		'원오프 듀얼 모니터 선반',
		100,
		25,
		0,
		undefined,
		{ ...EST, keywords: ['원오프', '모니터선반'] }
	),
	model(
		SHELF,
		'qdesk-stainless-shelf-750',
		'큐데스크',
		'스테인리스 데스크선반 컴팩트 750',
		75,
		22,
		0,
		undefined,
		{ keywords: ['큐데스크', '모니터받침대', '자석'] }
	),
	model(
		SHELF,
		'breathmit-desk-organizer-shelf',
		'브레스밋',
		'데스크 오거나이저 쉘프',
		40,
		18,
		0,
		undefined,
		{ ...EST, keywords: ['오거나이저'] }
	),
	model(
		SHELF,
		'breathmit-keyboard-display-2',
		'브레스밋×버니언스',
		'키보드 거치대 진열대 2단',
		46,
		26,
		0,
		undefined,
		{ ...EST, keywords: ['키보드 진열대'] }
	),
	model(
		POWER_SHELF,
		'hexcal-studio-plus',
		'헥스칼',
		'Hexcal 스튜디오 플러스 모니터 받침대',
		119,
		23,
		0,
		undefined,
		{ ...EST, keywords: ['헥스칼', '스튜디오', '모니터받침대'] }
	),
	model(
		SHELF,
		'kanto-sp6hd',
		'Kanto Audio',
		'SP6HD 데스크 스피커 스탠드 (1개)',
		17.8,
		21.6,
		0,
		undefined,
		{ keywords: ['칸토', '스피커 스탠드'] }
	),
	model(
		MOUSEPAD,
		'maywood-linoleum-desk-mat-l',
		'메이우드',
		'리놀리움 데스크매트 L',
		90,
		43,
		0,
		undefined,
		{ keywords: ['리놀륨', '데스크매트'] }
	),
	model(
		MOUSEPAD,
		'hexcal-leather-desk-mat',
		'헥스칼',
		'프리미엄 가죽 데스크 매트 (마그네틱 홀더)',
		90,
		40,
		0,
		undefined,
		{ ...EST, keywords: ['헥스칼', '가죽', '데스크매트'] }
	),
	model(
		MOUSEPAD,
		'hexcal-felt-desk-mat-1400',
		'헥스칼',
		'펠트 마그네틱 풀커버 데스크매트 1400',
		140,
		70,
		0,
		undefined,
		{ keywords: ['헥스칼', '펠트', '데스크매트'] }
	),
	model(
		MOUSEPAD,
		'brixa-leather-desk-mat',
		'브릭사',
		'가죽 데스크매트 장패드',
		90,
		40,
		0,
		undefined,
		{ ...EST, keywords: ['브릭사', '장패드', '데스크매트'] }
	),
	model(
		MOUSEPAD,
		'ororot-linoleum-desk-mat-900',
		'오롯이제작소',
		'천연 리놀륨 데스크매트 900',
		90,
		40,
		0,
		undefined,
		{ keywords: ['오롯이', '리놀륨', '데스크매트'] }
	),
	model(
		ARM,
		'fellowes-tallo-modular-1fm',
		'Fellowes',
		'플렉스 모듈러 1FM 모니터암',
		50,
		12,
		0,
		undefined,
		{ ...EST, keywords: ['펠로우즈', 'Tallo', '모니터암'] }
	),
	model(
		ARM,
		'fellowes-pt-lite-single',
		'Fellowes',
		'PT 라이트 싱글 모니터암',
		45,
		12,
		0,
		undefined,
		{ ...EST, keywords: ['펠로우즈', '모니터암'] }
	),
	model(
		LIGHTBAR,
		'benq-screenbar-halo-2',
		'BenQ',
		'ScreenBar Halo 2 모니터 조명',
		50,
		10.9,
		0,
		'usb',
		{ keywords: ['스크린바', '헤일로'] }
	),
	model(
		POWERED_LIGHTBAR,
		'philips-hue-play-light-bar',
		'Philips Hue',
		'Play 라이트 바 (더블팩 중 1개)',
		25.3,
		4.4,
		6.6,
		'typical',
		{ keywords: ['필립스 휴', '휴 플레이', '라이트바'] }
	),
	model(
		DESK_LAMP,
		'philips-hue-play-wall-washer',
		'Philips Hue',
		'Play 월 워셔',
		9.1,
		7.6,
		60,
		'listed',
		{ keywords: ['필립스 휴', '월워셔'] }
	),
	model(
		FLOOR_LAMP,
		'philips-hue-signe-gradient-floor',
		'Philips Hue',
		'그라디언트 Signe 플로어 램프',
		11.1,
		11.1,
		29,
		'listed',
		{ keywords: ['필립스 휴', '사인', '무드등'] }
	),
	model(
		FLOOR_LAMP,
		'tangram-ether-floor',
		'탱그램라이팅',
		'이더 플로어 장스탠드',
		30,
		30,
		30,
		'estimate',
		{ ...EST, keywords: ['탱그램', '이더', '장스탠드'] }
	),
	model(
		FLOOR_LAMP,
		'moodix-vibepole-pro-floor',
		'무딕스',
		'바이브폴 Pro 사이드폴 (플로어)',
		25,
		25,
		20,
		'estimate',
		{ ...EST, keywords: ['무딕스', '바이브폴', '사이드폴'] }
	),
	model(
		USB_DESK_LAMP,
		'huhuru-blooming-coaster',
		'후후루',
		'블루밍코스터 무드등',
		10,
		10,
		0,
		'usb',
		{ ...EST, keywords: ['후후루', '코스터 조명'] }
	),
	model(
		POWERED_HUB,
		'philips-hue-bridge-pro',
		'Philips Hue',
		'브릿지 프로',
		9.23,
		9.23,
		5,
		'listed',
		{ keywords: ['필립스 휴', '브릿지'] }
	),
	model(
		DESK_SPEAKER,
		'edifier-qr65-active',
		'Edifier',
		'QR65 액티브 스피커 (오른쪽)',
		14.15,
		21.68,
		65,
		'listed',
		{ keywords: ['에디파이어', 'QR65'] }
	),
	model(
		PASSIVE_SPEAKER,
		'edifier-qr65-passive',
		'Edifier',
		'QR65 패시브 스피커 (왼쪽)',
		13,
		21.2,
		0,
		undefined,
		{ keywords: ['에디파이어', 'QR65'] }
	),
	model(
		DESK_SPEAKER,
		'edifier-qr30-active',
		'Edifier',
		'QR30 액티브 스피커 (오른쪽)',
		12.75,
		14.2,
		30,
		'estimate',
		{ keywords: ['에디파이어', 'QR30'] }
	),
	model(
		PASSIVE_SPEAKER,
		'edifier-qr30-passive',
		'Edifier',
		'QR30 패시브 스피커 (왼쪽)',
		11.2,
		14.2,
		0,
		undefined,
		{ keywords: ['에디파이어', 'QR30'] }
	),
	model(
		DESK_SPEAKER,
		'kef-lsx-ii-lt-primary',
		'KEF',
		'LSX II LT 스피커 (주 스피커)',
		15.5,
		18,
		200,
		'listed',
		{ keywords: ['케프', 'LSX'] }
	),
	model(
		PASSIVE_SPEAKER,
		'kef-lsx-ii-lt-secondary',
		'KEF',
		'LSX II LT 스피커 (보조 스피커)',
		15.5,
		18,
		0,
		undefined,
		{ keywords: ['케프', 'LSX'] }
	),
	model(
		DESK_SPEAKER,
		'marshall-acton-iii',
		'Marshall',
		'Acton III 블루투스 스피커',
		26,
		15,
		60,
		'estimate',
		{ keywords: ['마샬', '액톤'] }
	),
	model(
		USB_SPEAKER,
		'creative-pebble-v2-right',
		'Creative',
		'Pebble V2 스피커 (오른쪽, 전원)',
		11.6,
		11.5,
		0,
		'usb',
		{ keywords: ['크리에이티브', '페블'] }
	),
	model(
		PASSIVE_SPEAKER,
		'creative-pebble-v2-left',
		'Creative',
		'Pebble V2 스피커 (왼쪽)',
		11.6,
		11.5,
		0,
		undefined,
		{ keywords: ['크리에이티브', '페블'] }
	),
	model(
		MONITOR,
		'corsair-xeneon-edge',
		'Corsair',
		'XENEON EDGE 14.5인치 터치스크린',
		37.2,
		12,
		0,
		'usb',
		{ diagonalInch: 14.5, keywords: ['커세어', '제논 엣지', '보조 모니터'] }
	),
	model(USB_DECOR, 'divoom-times-frame', 'Divoom', '타임즈 프레임 디지털 액자', 25.6, 8, 0, 'usb', {
		...EST,
		keywords: ['디붐', '디지털 액자']
	}),
	model(USB_INPUT, 'elgato-stream-deck-plus', 'Elgato', 'Stream Deck +', 14, 13.8, 0, 'usb', {
		keywords: ['엘가토', '스트림덱']
	}),
	model(HANDHELD, '8bitdo-micro', '8BitDo', 'Micro 블루투스 게임패드', 7.2, 4.1, 0, undefined, {
		keywords: ['컨트롤러', '게임패드']
	}),
	model(KEYBOARD, 'varo-v108-pastel', 'VARO', 'V108 PASTEL 기계식 키보드', 44, 14, 0, undefined, {
		...EST,
		keywords: ['바로', '풀배열']
	}),
	model(
		KEYBOARD,
		'lofree-flow2-100',
		'Lofree',
		'Flow 2 로우프로파일 키보드 (100키)',
		39.8,
		12.6,
		0,
		undefined,
		{ keywords: ['로프리', '플로우'] }
	),
	model(
		KEYBOARD,
		'lofree-flow2-mac',
		'Lofree',
		'Flow 2 for Mac 키보드 (84키, 실버)',
		34.1,
		12.6,
		0,
		undefined,
		{ ...EST, keywords: ['로프리', '플로우', '맥'] }
	),
	model(
		KEYBOARD,
		'logitech-g-pro-x-tkl-rapid',
		'Logitech',
		'G PRO X TKL RAPID 래피드 트리거',
		35.7,
		15,
		0,
		undefined,
		{ keywords: ['로지텍', '래피드 트리거', '텐키리스'] }
	),
	model(
		PALMREST,
		'ororot-dumaru-wrist-rest-360',
		'오롯이제작소',
		'두마루 원목 손목 받침대 (라운드 360)',
		36,
		12.5,
		0,
		undefined,
		{ keywords: ['오롯이', '손목 받침대', '팜레스트'] }
	),
	model(CHAIR, 'libernovo-omni', 'LiberNovo', 'Omni 다이나믹 인체공학 의자', 74, 79, 0, undefined, {
		keywords: ['리버노보', '옴니']
	}),
	model(CHAIR, 'lenif-uniback-chair-pro', '레니프', '유니백체어 프로', 65, 65, 0, undefined, {
		...EST,
		keywords: ['레니프', '유니백']
	}),
	model(
		FOOTREST,
		'rowmo-double-step',
		'로우모',
		'높이조절 2단 더블스텝 발받침대',
		48,
		35,
		0,
		undefined,
		{ ...EST, keywords: ['로우모', '발받침'] }
	),
	model(
		FOOTREST,
		'rowmo-dualrest-lc99',
		'로우모',
		'듀얼레스트 LC99 발받침대',
		51.2,
		38,
		0,
		undefined,
		{ ...EST, keywords: ['로우모', '듀얼레스트', '발받침'] }
	),
	model(HOLDER, 'maywood-phone-stand', '메이우드', '원목 스마트폰 거치대', 8, 9, 0, undefined, {
		...EST,
		keywords: ['메이우드', '거치대']
	}),
	model(
		POWERED_HOLDER,
		'oa-quickturbo-3in1',
		'오아',
		'퀵터보 Qi2.2 3in1 무선 충전기',
		17,
		10,
		30,
		'estimate',
		{ ...EST, keywords: ['오아', '맥세이프', '무선 충전기'] }
	),
	model(
		UNDER_DESK,
		'dextop-mct-05',
		'덱스탑',
		'무타공 클램프형 멀티탭 트레이 MCT-05',
		42,
		15,
		0,
		undefined,
		{ ...EST, keywords: ['덱스탑', '멀티탭 트레이', '케이블 정리'] }
	),
	model(DECOR, 'maywood-cork-tray', '메이우드', '코르크 트레이', 25, 13, 0, undefined, {
		...EST,
		keywords: ['트레이']
	}),
	model(
		DECOR,
		'ororot-pocket-catchall-mini',
		'오롯이제작소',
		'포켓 캐치올 미니',
		12,
		9,
		0,
		undefined,
		{ ...EST, keywords: ['캐치올', '트레이'] }
	),
	model(DECOR, 'ororot-daon-tray', '오롯이제작소', '다온 원목 트레이', 30, 15, 0, undefined, {
		...EST,
		keywords: ['다온', '트레이']
	}),
	model(
		DECOR,
		'ororot-linoleum-coaster-set',
		'오롯이제작소',
		'리놀륨 코스터 세트',
		11,
		11,
		0,
		undefined,
		{ ...EST, keywords: ['코스터'] }
	),
	model(DECOR, 'diolt-diffuser-750', '디올트', '디퓨저 750ml', 9, 9, 0, undefined, {
		...EST,
		keywords: ['디퓨저']
	}),
	model(DECOR, 'yeniz-stone-diffuser', '예니즈', '스톤 디퓨저 오브제', 15, 15, 0, undefined, {
		...EST,
		keywords: ['스톤', '디퓨저']
	}),
	model(
		DECOR,
		'heriers-lava-ball',
		'헤리어스',
		'LAVA BALL 아로마 스톤 세트',
		14,
		14,
		0,
		undefined,
		{ ...EST, keywords: ['아로마 스톤'] }
	),
	model(
		DECOR,
		'huhuru-lheure-bleue',
		'후후루',
		'뢰흐블루 블루로즈 오브제 (M)',
		14,
		14,
		0,
		undefined,
		{ ...EST, keywords: ['후후루', '블루로즈'] }
	),
	model(DECOR, 'miee-frame-clock', 'MIEE', '미이 프레임 시계', 22, 6, 0, undefined, {
		...EST,
		keywords: ['시계']
	}),
	model(DECOR, 'ulti-flow-timer', '울티', '플로우 디지털 비주얼 타이머', 9, 9, 0, undefined, {
		...EST,
		keywords: ['타이머', '시계']
	}),
	model(DECOR, 'sosse-thermo-hygrometer', '쏘쓰', '1초스캔 디지털 온습도계', 7, 3, 0, undefined, {
		...EST,
		keywords: ['온습도계']
	}),
	model(WALL_DECOR, 'bunyans-a2-frame', '버니언스', 'A2 인테리어 액자', 45, 3, 0, undefined, {
		...EST,
		keywords: ['액자', '포스터']
	})
];

/** 모델별 일러스트 (entities/plan/ui/model-glyphs.ts) */
const GLYPHS: Record<string, string> = {
	'samsung-odyssey-oled-g9': 'odyssey-g9',
	'lg-ultragear-45gr95qe': 'ultragear-45',
	'dell-alienware-aw3423dwf': 'alienware-34',
	'lg-ultragear-27gs95qe': 'ultragear-27',
	'lg-oled-c4-65': 'oled-c4',
	'lg-oled-c4-55': 'oled-c4',
	'samsung-s90d-65': 's90d',
	'sony-bravia-8-ii-65': 'bravia-8',
	'sony-ps5-pro': 'ps5-pro',
	'sony-ps5-slim': 'ps5-slim',
	'microsoft-xbox-series-x': 'xbox-series-x',
	'microsoft-xbox-series-s': 'xbox-series-s',
	'nintendo-switch-2-dock': 'switch-2-dock',
	'apple-mac-mini-m4': 'mac-mini',
	'apple-mac-studio-2025': 'mac-studio',
	'lian-li-o11-dynamic-evo': 'o11-evo',
	'nzxt-h9-flow': 'h9-flow',
	'fractal-north': 'north',
	'ikea-uppspel-180': 'uppspel',
	'secretlab-magnus-pro': 'magnus-pro',
	'secretlab-magnus-pro-xl': 'magnus-pro',
	'ikea-besta-180': 'besta',
	'herman-miller-aeron-b': 'aeron',
	'sonos-arc-ultra': 'arc-ultra',
	'sonos-sub-4': 'sub-4',
	'samsung-hw-q990d': 'q990d',
	'samsung-hw-q990d-sub': 'q990d-sub',
	'denon-avr-x1800h': 'avr',
	'apple-macbook-air-13': 'macbook',
	'apple-macbook-air-15': 'macbook',
	'apple-macbook-pro-14': 'macbook',
	'apple-macbook-pro-16': 'macbook',
	'apple-imac-24': 'imac-24',
	'apple-studio-display': 'studio-display',
	'antec-torque': 'torque',
	'bestpiece-mattz-1800': 'mattz',
	'sizeof-footrest': 'footrest',
	'pullizio-footrest': 'footrest-wave',
	'dell-up3216q': 'dell-ultrasharp',
	'white-highend-pc': 'o11-evo',
	'ergotron-hx': 'monitor-arm',
	'dell-msa20': 'monitor-arm',
	'benq-screenbar-plus': 'light-bar',
	'xiaomi-mijia-light-bar': 'light-bar',
	'luxy-mx1': 'light-bar',
	'leopold-fc980c': 'kb-96',
	'phoenix-keyboard': 'kb-phoenix',
	'apple-magic-keyboard': 'kb-magic',
	'hhkb-hybrid-type-s': 'kb-hhkb',
	'hansung-gk868b': 'kb-tkl',
	'leopold-fc660mbt': 'kb-65',
	'realforce-r3tl': 'kb-tkl',
	'vgn-vxe75': 'kb-75',
	'wooting-80he': 'kb-tkl',
	'glorious-gmmk3-pro-he': 'kb-75',
	'asus-rog-falchion-ace-hfx': 'kb-65',
	'razer-huntsman-v3-pro-mini': 'kb-60',
	'joseph-palm-rest-fc980c': 'palm-rest',
	'deltahub-carpio-g2': 'mouse-palm',
	'zerosun-mouse-palm-rest': 'mouse-palm',
	'logitech-g-pro-x-superlight-2': 'mouse-symmetric',
	'logitech-mx-master-3s': 'mouse-ergo',
	'apple-magic-mouse': 'mouse-magic',
	'logitech-lift': 'mouse-vertical',
	'razer-deathadder-v2-pro': 'mouse-ergo',
	'kensington-pro-fit-ergo-vertical': 'trackball',
	'razer-mouse-dock-chroma': 'mouse-dock',
	'logitech-g-powerplay': 'powerplay',
	'razer-strider-l': 'mousepad',
	'lgg-venus-xl': 'mousepad',
	'lgg-venus-pro-xl': 'mousepad',
	'artisan-fx-zero-s': 'mousepad',
	'artisan-fx-hien-m': 'mousepad',
	'pulsar-paracontrol-v2-xxl': 'mousepad',
	'creative-katana-v2': 'katana',
	'creative-katana-v2-sub': 'katana-sub',
	'jds-labs-element-iii': 'amp-knob',
	'creative-soundblasterx-g1': 'dongle',
	'ifi-xdsd-gryphon': 'dac-portable',
	'astell-kern-hc3': 'dongle',
	'qudelix-5k': 'dongle',
	'astell-kern-hb1': 'dongle',
	'astell-kern-ak120': 'dap',
	'cowon-plenue-v': 'dap',
	'astell-kern-sp3000': 'dap',
	'sony-nw-wm1zm2': 'dap',
	'sony-icf-506': 'radio',
	'sony-mdr-1a': 'headphones',
	'bose-qc45': 'headphones',
	'gigabyte-aorus-h1': 'headphones',
	'shure-se846': 'iem',
	'astell-kern-zero1': 'iem',
	'moondrop-starfield': 'iem',
	'moondrop-starfield-2': 'iem',
	'fiio-ff5': 'earbud-round',
	'7hz-salnotes-zero': 'iem',
	'7hz-crinacle-zero-2': 'iem',
	'bang-olufsen-a8': 'earhook',
	'nothing-ear-2': 'earbuds-case',
	'nothing-ear-stick': 'stick-case',
	'sennheiser-mx375': 'earbud-round',
	'final-e1000': 'iem-bullet',
	'apple-airpods-pro': 'earbuds-case',
	'dunu-alpha-3': 'earbud-round',
	'akg-n5005': 'iem',
	'musehifi-the-east-6': 'iem',
	'tangzu-waner-studio': 'iem',
	'creative-aurvana-air': 'earbuds-case',
	'nintendo-switch-oled': 'switch-oled',
	'samsung-notebook-odyssey': 'laptop-numpad',
	'twelve-south-bookarc': 'bookarc',
	'lenovo-legion-y700': 'tablet',
	'samsung-galaxy-tab-s7-fe': 'tablet',
	'samsung-galaxy-s23': 'phone',
	'esr-halolock-stand': 'phone-stand',
	'requem-5in1-wireless-charger': 'charger-multi',
	'nextu-8122sp8k60': 'hdmi-switch',
	'caldigit-soho-dock': 'hub',
	'satechi-8in1-hub': 'hub',
	'hoverpen-2-interstellar': 'pen',
	'genesis-g80-diecast-1-18': 'car',
	'oframe-barco-1600': 'desk-motion',
	'oframe-largo-1600': 'desk-motion',
	'maywood-homage-1600': 'desk-wood',
	'breed-fenix-30t-1600': 'desk-motion',
	'linak-dl6-experience': 'desk-motion',
	'oframe-stilo-1000': 'shelf-plank',
	'oframe-feno-1000': 'shelf-plank',
	'maywood-prestige-shelf': 'shelf-plank',
	'ilian-modular-monitor-stand': 'shelf-modular',
	'1off-dual-monitor-shelf': 'shelf-dual',
	'qdesk-stainless-shelf-750': 'shelf-steel',
	'breathmit-desk-organizer-shelf': 'shelf-tiered',
	'breathmit-keyboard-display-2': 'shelf-tiered',
	'hexcal-studio-plus': 'studio-stand',
	'kanto-sp6hd': 'speaker-stand',
	'maywood-linoleum-desk-mat-l': 'mousepad',
	'hexcal-leather-desk-mat': 'desk-mat-leather',
	'hexcal-felt-desk-mat-1400': 'desk-mat-felt',
	'brixa-leather-desk-mat': 'desk-mat-leather',
	'ororot-linoleum-desk-mat-900': 'mousepad',
	'fellowes-tallo-modular-1fm': 'monitor-arm',
	'fellowes-pt-lite-single': 'monitor-arm',
	'benq-screenbar-halo-2': 'light-bar-halo',
	'philips-hue-play-light-bar': 'hue-play',
	'philips-hue-play-wall-washer': 'wall-washer',
	'philips-hue-signe-gradient-floor': 'floor-lamp',
	'tangram-ether-floor': 'floor-lamp',
	'moodix-vibepole-pro-floor': 'pole-lamp',
	'huhuru-blooming-coaster': 'coaster-light',
	'philips-hue-bridge-pro': 'hue-bridge',
	'edifier-qr65-active': 'speaker-knob',
	'edifier-qr65-passive': 'speaker-bookshelf',
	'edifier-qr30-active': 'speaker-knob',
	'edifier-qr30-passive': 'speaker-bookshelf',
	'kef-lsx-ii-lt-primary': 'speaker-bookshelf',
	'kef-lsx-ii-lt-secondary': 'speaker-bookshelf',
	'marshall-acton-iii': 'speaker-acton',
	'creative-pebble-v2-right': 'speaker-pebble',
	'creative-pebble-v2-left': 'speaker-pebble',
	'corsair-xeneon-edge': 'touch-strip',
	'divoom-times-frame': 'photo-frame',
	'elgato-stream-deck-plus': 'stream-deck',
	'8bitdo-micro': 'gamepad-micro',
	'varo-v108-pastel': 'kb-96',
	'lofree-flow2-100': 'kb-96',
	'lofree-flow2-mac': 'kb-75',
	'logitech-g-pro-x-tkl-rapid': 'kb-tkl',
	'ororot-dumaru-wrist-rest-360': 'wrist-rest-wave',
	'libernovo-omni': 'chair-omni',
	'lenif-uniback-chair-pro': 'chair-uniback',
	'rowmo-double-step': 'footrest-step',
	'rowmo-dualrest-lc99': 'footrest-dual',
	'maywood-phone-stand': 'phone-stand',
	'oa-quickturbo-3in1': 'charger-stand',
	'dextop-mct-05': 'cable-tray',
	'maywood-cork-tray': 'tray',
	'ororot-pocket-catchall-mini': 'tray',
	'ororot-daon-tray': 'tray-handle',
	'ororot-linoleum-coaster-set': 'coaster-set',
	'diolt-diffuser-750': 'diffuser-reed',
	'yeniz-stone-diffuser': 'stone-diffuser',
	'heriers-lava-ball': 'lava-ball',
	'huhuru-lheure-bleue': 'flower-lamp',
	'miee-frame-clock': 'clock-frame',
	'ulti-flow-timer': 'timer-cube',
	'sosse-thermo-hygrometer': 'thermo-hygro',
	'bunyans-a2-frame': 'poster-frame'
};

export const MODEL_ENTRIES: readonly CatalogEntry[] = ENTRIES.map((entry) => ({
	...entry,
	glyph: GLYPHS[entry.id]
}));
