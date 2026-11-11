import { createId } from '#shared/lib/id';
import { SPEC_LIMITS } from './catalog';
import type { CatalogCategory, CatalogEntry, ItemKind, ItemLayer } from './types';

interface KindPreset {
	label: string;
	category: CatalogCategory;
	layer: ItemLayer;
	requiresSupport?: boolean;
	/** 그림 후보. 빈 문자열은 종류별 기본 그림입니다. */
	glyphs: { id: string; label: string }[];
	hasScreen?: boolean;
	hasPorts?: boolean;
}

const BASIC = { id: '', label: '기본' };

/** 직접 등록하는 제품의 종류별 설정입니다. 층과 받침 여부는 사용자가 아니라 종류가 정합니다. */
export const KIND_PRESETS: Record<ItemKind, KindPreset> = {
	desk: {
		label: '책상',
		category: 'furniture',
		layer: 'floor',
		glyphs: [
			BASIC,
			{ id: 'mattz', label: '모션데스크' },
			{ id: 'uppspel', label: '케이블 구멍' },
			{ id: 'magnus-pro', label: '케이블 덮개' },
			{ id: 'desk-motion', label: '2단 기둥 모션데스크' },
			{ id: 'desk-wood', label: '원목 상판' }
		]
	},
	stand: {
		label: 'TV장·수납장',
		category: 'furniture',
		layer: 'floor',
		glyphs: [BASIC, { id: 'besta', label: '세 칸' }]
	},
	chair: {
		label: '의자',
		category: 'furniture',
		layer: 'floor',
		glyphs: [
			BASIC,
			{ id: 'aeron', label: '다섯 갈래 다리' },
			{ id: 'chair-omni', label: '나뉜 등받이' },
			{ id: 'chair-uniback', label: '곡면 좌판' }
		]
	},
	sofa: { label: '소파', category: 'furniture', layer: 'floor', glyphs: [BASIC] },
	footrest: {
		label: '발받침대',
		category: 'furniture',
		layer: 'floor',
		glyphs: [
			{ id: 'footrest', label: '홈 줄' },
			{ id: 'footrest-wave', label: '물결' }
		]
	},
	monitor: {
		label: '모니터',
		category: 'display',
		layer: 'surface',
		requiresSupport: true,
		hasScreen: true,
		glyphs: [
			BASIC,
			{ id: 'ultragear-27', label: '평면·넓은 받침' },
			{ id: 'dell-ultrasharp', label: '평면·사각 받침' },
			{ id: 'studio-display', label: '평면·판 받침' },
			{ id: 'alienware-34', label: '곡면 1800R' },
			{ id: 'odyssey-g9', label: '곡면 1000R' },
			{ id: 'ultragear-45', label: '곡면 800R' }
		]
	},
	tv: {
		label: 'TV',
		category: 'display',
		layer: 'surface',
		hasScreen: true,
		glyphs: [
			BASIC,
			{ id: 'oled-c4', label: '가운데 받침' },
			{ id: 's90d', label: '사다리꼴 받침' },
			{ id: 'bravia-8', label: '양 끝 다리' }
		]
	},
	laptop: {
		label: '노트북',
		category: 'computing',
		layer: 'surface',
		requiresSupport: true,
		glyphs: [
			{ id: 'macbook', label: '기본' },
			{ id: 'laptop-numpad', label: '숫자 키 포함' }
		]
	},
	pc: {
		label: 'PC 본체',
		category: 'computing',
		layer: 'surface',
		glyphs: [
			BASIC,
			{ id: 'o11-evo', label: '두 공간 케이스' },
			{ id: 'h9-flow', label: '통풍망 케이스' },
			{ id: 'north', label: '나무 살 앞면' },
			{ id: 'torque', label: '오픈 프레임' },
			{ id: 'mac-mini', label: '작은 정사각' },
			{ id: 'mac-studio', label: '둥근 정사각' }
		]
	},
	console: {
		label: '게임기',
		category: 'computing',
		layer: 'surface',
		glyphs: [
			BASIC,
			{ id: 'ps5-pro', label: '줄무늬 띠' },
			{ id: 'ps5-slim', label: '나뉜 덮개' },
			{ id: 'xbox-series-x', label: '원형 통풍구(정사각)' },
			{ id: 'xbox-series-s', label: '원형 통풍구(직사각)' },
			{ id: 'switch-oled', label: '독과 조이콘' },
			{ id: 'switch-2-dock', label: '독' }
		]
	},
	keyboard: {
		label: '키보드',
		category: 'input',
		layer: 'surface',
		requiresSupport: true,
		glyphs: [
			{ id: 'kb-tkl', label: '텐키리스' },
			{ id: 'kb-96', label: '풀배열' },
			{ id: 'kb-75', label: '75%' },
			{ id: 'kb-65', label: '65%' },
			{ id: 'kb-60', label: '60%' },
			{ id: 'kb-hhkb', label: 'HHKB' },
			{ id: 'kb-phoenix', label: 'F13 텐키리스' },
			{ id: 'kb-magic', label: '슬림' }
		]
	},
	mouse: {
		label: '마우스',
		category: 'input',
		layer: 'surface',
		requiresSupport: true,
		glyphs: [
			{ id: 'mouse-symmetric', label: '대칭형' },
			{ id: 'mouse-ergo', label: '인체공학형' },
			{ id: 'mouse-magic', label: '납작형' },
			{ id: 'mouse-vertical', label: '버티컬' },
			{ id: 'trackball', label: '트랙볼' }
		]
	},
	mousepad: {
		label: '마우스패드·데스크매트',
		category: 'input',
		layer: 'mat',
		requiresSupport: true,
		glyphs: [
			{ id: 'mousepad', label: '기본' },
			{ id: 'powerplay', label: '충전 패드' },
			{ id: 'desk-mat-leather', label: '가죽 데스크매트' },
			{ id: 'desk-mat-felt', label: '펠트 데스크매트' }
		]
	},
	palmrest: {
		label: '팜레스트',
		category: 'input',
		layer: 'surface',
		requiresSupport: true,
		glyphs: [
			{ id: 'palm-rest', label: '키보드용' },
			{ id: 'mouse-palm', label: '마우스용' }
		]
	},
	speaker: {
		label: '스피커',
		category: 'audio',
		layer: 'surface',
		glyphs: [
			BASIC,
			{ id: 'speaker-bookshelf', label: '북셀프' },
			{ id: 'speaker-acton', label: '손잡이가 위에 있는 스피커' },
			{ id: 'speaker-pebble', label: '둥근 스피커' }
		]
	},
	subwoofer: {
		label: '서브우퍼',
		category: 'audio',
		layer: 'floor',
		glyphs: [BASIC, { id: 'sub-4', label: '가운데 구멍' }, { id: 'katana-sub', label: '세로형' }]
	},
	soundbar: {
		label: '사운드바',
		category: 'audio',
		layer: 'surface',
		requiresSupport: true,
		glyphs: [
			BASIC,
			{ id: 'arc-ultra', label: '둥근 막대' },
			{ id: 'q990d', label: '각진 막대' },
			{ id: 'katana', label: '가운데 표시창' }
		]
	},
	receiver: {
		label: 'AV 리시버·앰프',
		category: 'audio',
		layer: 'surface',
		requiresSupport: true,
		glyphs: [BASIC, { id: 'avr', label: '큰 손잡이' }, { id: 'amp-knob', label: '데스크 앰프' }]
	},
	'audio-device': {
		label: 'DAC·DAP·오디오 소품',
		category: 'personal',
		layer: 'surface',
		requiresSupport: true,
		glyphs: [
			{ id: 'dap', label: 'DAP' },
			{ id: 'dac-portable', label: '포터블 DAC' },
			{ id: 'dongle', label: '동글' },
			{ id: 'radio', label: '라디오' }
		]
	},
	headphones: {
		label: '헤드폰',
		category: 'personal',
		layer: 'surface',
		requiresSupport: true,
		glyphs: [{ id: 'headphones', label: '기본' }]
	},
	earphones: {
		label: '이어폰',
		category: 'personal',
		layer: 'surface',
		requiresSupport: true,
		glyphs: [
			{ id: 'iem', label: '커스텀형 셸' },
			{ id: 'earbud-round', label: '원형 이어버드' },
			{ id: 'earhook', label: '이어훅' },
			{ id: 'iem-bullet', label: '원통형' },
			{ id: 'earbuds-case', label: '충전 케이스' },
			{ id: 'stick-case', label: '원통 케이스' }
		]
	},
	handheld: {
		label: '휴대폰·태블릿',
		category: 'personal',
		layer: 'surface',
		requiresSupport: true,
		glyphs: [
			{ id: 'phone', label: '휴대폰' },
			{ id: 'tablet', label: '태블릿' }
		]
	},
	lightbar: {
		label: '모니터 조명',
		category: 'accessory',
		layer: 'mount',
		requiresSupport: true,
		glyphs: [{ id: 'light-bar', label: '기본' }]
	},
	arm: {
		label: '모니터암',
		category: 'accessory',
		layer: 'mount',
		requiresSupport: true,
		glyphs: [{ id: 'monitor-arm', label: '기본' }]
	},
	holder: {
		label: '거치대·충전기',
		category: 'accessory',
		layer: 'surface',
		requiresSupport: true,
		glyphs: [
			{ id: 'phone-stand', label: '휴대폰 거치대' },
			{ id: 'bookarc', label: '노트북 거치대' },
			{ id: 'charger-multi', label: '무선 충전기' },
			{ id: 'mouse-dock', label: '충전 독' }
		]
	},
	hub: {
		label: '허브·셀렉터',
		category: 'accessory',
		layer: 'surface',
		requiresSupport: true,
		glyphs: [
			{ id: 'hub', label: '허브' },
			{ id: 'hdmi-switch', label: '셀렉터' }
		]
	},
	decor: {
		label: '소품',
		category: 'accessory',
		layer: 'surface',
		requiresSupport: true,
		glyphs: [
			{ id: 'pen', label: '펜' },
			{ id: 'car', label: '자동차 모형' },
			{ id: 'tray', label: '트레이' },
			{ id: 'diffuser-reed', label: '디퓨저' },
			{ id: 'clock-frame', label: '탁상 시계·액자' },
			{ id: 'flower-lamp', label: '꽃 오브제' }
		]
	},
	shelf: {
		label: '데스크 선반·받침대',
		category: 'furniture',
		layer: 'mat',
		requiresSupport: true,
		glyphs: [
			{ id: 'shelf-plank', label: '원목 선반' },
			{ id: 'shelf-steel', label: '금속판 선반' },
			{ id: 'shelf-tiered', label: '2단 진열대' },
			{ id: 'speaker-stand', label: '스피커 스탠드' }
		]
	},
	// 받침 없이 두면 바닥 물건으로, 책상 위에 두면 책상 위 물건으로 판정합니다.
	lamp: {
		label: '조명',
		category: 'accessory',
		layer: 'surface',
		glyphs: [
			{ id: 'floor-lamp', label: '장스탠드' },
			{ id: 'pole-lamp', label: '막대 조명' },
			{ id: 'wall-washer', label: '벽 비춤 조명' }
		]
	},
	outlet: { label: '벽 콘센트', category: 'power', layer: 'wall', hasPorts: true, glyphs: [BASIC] },
	strip: { label: '멀티탭', category: 'power', layer: 'cable', hasPorts: true, glyphs: [BASIC] }
};

/** 화면 크기를 입력하지 않으면 입력란에 보이는 값과 같은 27인치로 저장합니다. */
export const DEFAULT_SCREEN_INCH = 27;

export const CUSTOM_KINDS = Object.keys(KIND_PRESETS) as ItemKind[];
export const CUSTOM_LIMITS = { name: 40, brand: 30 } as const;
const ID_PATTERN = /^custom-[\w-]{1,64}$/;

export interface CustomProductInput {
	id?: string;
	name: string;
	brand: string;
	kind: ItemKind;
	width: number;
	depth: number;
	watts: number;
	cable: number;
	diagonalInch?: number;
	ports?: number;
	glyph: string;
}

/** 입력값으로 카탈로그 항목을 만듭니다. 층·분류는 종류에서 정합니다. */
export function createCustomEntry(input: CustomProductInput): CatalogEntry {
	const preset = KIND_PRESETS[input.kind];
	const clamp = (value: number, key: keyof typeof SPEC_LIMITS) =>
		Math.min(SPEC_LIMITS[key].max, Math.max(SPEC_LIMITS[key].min, value));
	const glyph = preset.glyphs.some((option) => option.id === input.glyph)
		? input.glyph
		: preset.glyphs[0].id;
	return {
		id: input.id ?? `custom-${createId()}`,
		custom: true,
		name: input.name.trim().slice(0, CUSTOM_LIMITS.name),
		...(input.brand.trim() ? { brand: input.brand.trim().slice(0, CUSTOM_LIMITS.brand) } : {}),
		category: preset.category,
		kind: input.kind,
		layer: preset.layer,
		width: clamp(input.width, 'width'),
		depth: clamp(input.depth, 'depth'),
		watts: clamp(input.watts, 'watts'),
		cable: Math.min(SPEC_LIMITS.cable.max, Math.max(0, input.cable)),
		...(preset.requiresSupport ? { requiresSupport: true } : {}),
		...(glyph ? { glyph } : {}),
		...(preset.hasScreen
			? { diagonalInch: clamp(input.diagonalInch ?? DEFAULT_SCREEN_INCH, 'diagonalInch') }
			: {}),
		...(preset.hasPorts
			? {
					ports: clamp(input.ports ?? 2, 'ports'),
					ratedWatts: input.kind === 'outlet' ? 3520 : 2500
				}
			: {}),
		...(input.watts > 0 ? { wattsBasis: 'listed' as const } : {})
	};
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
	typeof value === 'object' && value !== null && !Array.isArray(value);
const finite = (value: unknown): value is number =>
	typeof value === 'number' && Number.isFinite(value);

/** 파일이나 공유 링크에서 온 직접 등록 제품을 검사합니다. */
export function parseCustomEntry(raw: unknown): CatalogEntry | null {
	if (!isRecord(raw)) return null;
	const { id, name, brand, kind, width, depth, watts, cable, diagonalInch, ports, glyph } = raw;
	if (typeof id !== 'string' || !ID_PATTERN.test(id)) return null;
	if (typeof name !== 'string' || !name.trim() || name.length > CUSTOM_LIMITS.name) return null;
	if (brand !== undefined && (typeof brand !== 'string' || brand.length > CUSTOM_LIMITS.brand)) {
		return null;
	}
	// 'constructor' 같은 상속 속성 이름을 막기 위해 자기 속성만 인정합니다.
	if (typeof kind !== 'string' || !Object.hasOwn(KIND_PRESETS, kind)) return null;
	const numbers: [unknown, keyof typeof SPEC_LIMITS][] = [
		[width, 'width'],
		[depth, 'depth'],
		[watts, 'watts'],
		[cable, 'cable']
	];
	for (const [value, key] of numbers) {
		if (
			!finite(value) ||
			value < Math.min(0, SPEC_LIMITS[key].min) ||
			value > SPEC_LIMITS[key].max
		) {
			return null;
		}
	}
	return createCustomEntry({
		id,
		name,
		brand: typeof brand === 'string' ? brand : '',
		kind: kind as ItemKind,
		width: width as number,
		depth: depth as number,
		watts: watts as number,
		cable: cable as number,
		diagonalInch: finite(diagonalInch) ? diagonalInch : undefined,
		ports: finite(ports) ? ports : undefined,
		glyph: typeof glyph === 'string' ? glyph : ''
	});
}

/** 등록 항목을 입력값으로 되돌립니다. 수정 화면에서 씁니다. */
export function toCustomInput(entry: CatalogEntry): CustomProductInput {
	return {
		id: entry.id,
		name: entry.name,
		brand: entry.brand ?? '',
		kind: entry.kind,
		width: entry.width,
		depth: entry.depth,
		watts: entry.watts,
		cable: entry.cable,
		diagonalInch: entry.diagonalInch,
		ports: entry.ports,
		glyph: entry.glyph ?? ''
	};
}
