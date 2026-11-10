export type Wall = 'north' | 'east' | 'south' | 'west';

export interface Opening {
	id: string;
	kind: 'door' | 'window';
	wall: Wall;
	/** 벽의 시작점(북·남 벽은 왼쪽, 동·서 벽은 위쪽)에서 개구부 시작까지의 거리(cm) */
	offset: number;
	width: number;
	/** 문 경첩이 있는 쪽 */
	hinge: 'start' | 'end';
}

export type Corner = 'nw' | 'ne' | 'se' | 'sw';

/** 방의 모서리에서 잘라 낸 직사각형입니다. ㄱ자, ㄴ자, T자 방을 만듭니다. */
export interface Cutout {
	id: string;
	corner: Corner;
	width: number;
	depth: number;
}

export interface RoomData {
	width: number;
	depth: number;
	openings: Opening[];
	cutouts?: Cutout[];
}

/** 배치도 아래에 깔아 두는 평면도 이미지입니다. */
export interface Underlay {
	src: string;
	pixelWidth: number;
	pixelHeight: number;
	/** 이미지 왼쪽 위의 방 기준 위치(cm) */
	x: number;
	y: number;
	cmPerPixel: number;
	opacity: number;
}

export interface ItemData {
	id: string;
	catalogId: string;
	/** 비어 있으면 카탈로그 이름을 씁니다. */
	label: string;
	x: number;
	y: number;
	rotation: number;
	price: number;
	/** 카탈로그 기본값 대신 쓸 사용자 규격 */
	specs?: ItemSpecs;
}

export type SpecKey = 'width' | 'depth' | 'watts' | 'cable' | 'diagonalInch' | 'ports';
export type ItemSpecs = Partial<Record<SpecKey, number>>;

export interface PlanData {
	version: 1;
	id: string;
	name: string;
	room: RoomData;
	items: ItemData[];
	updatedAt: number;
	underlay?: Underlay;
}

export type ItemKind =
	| 'desk'
	| 'stand'
	| 'chair'
	| 'sofa'
	| 'monitor'
	| 'tv'
	| 'pc'
	| 'console'
	| 'laptop'
	| 'speaker'
	| 'subwoofer'
	| 'soundbar'
	| 'receiver'
	| 'outlet'
	| 'strip';

/** floor: 바닥, surface: 책상·장 위, cable: 바닥 배선, wall: 벽 */
export type ItemLayer = 'floor' | 'surface' | 'cable' | 'wall';

export type CatalogCategory = 'furniture' | 'display' | 'computing' | 'audio' | 'power';

export interface CatalogEntry {
	id: string;
	name: string;
	category: CatalogCategory;
	kind: ItemKind;
	width: number;
	depth: number;
	layer: ItemLayer;
	/** 소비 전력(W), 전원이 필요 없으면 0 */
	watts: number;
	/** 전원 케이블 길이(cm) */
	cable: number;
	ports?: number;
	ratedWatts?: number;
	diagonalInch?: number;
	/** true면 책상이나 장 위에 있어야 합니다. */
	requiresSupport?: boolean;
	/** 실제 제품이면 제조사 이름 */
	brand?: string;
	/** 실물을 닮은 모델별 일러스트 (entities/plan/ui/model-glyphs.ts) */
	glyph?: string;
	/** 검색할 때 함께 비교하는 별칭 */
	keywords?: readonly string[];
	/** 소비 전력 값의 기준. 없으면 카탈로그 기본값입니다. */
	wattsBasis?: WattsBasis;
}

export type WattsBasis =
	'max' | 'typical' | 'rated' | 'listed' | 'psu' | 'adapter' | 'measured' | 'estimate' | 'default';

export type FindingSeverity = 'error' | 'warning' | 'ok';

export type FindingCode =
	| 'out-of-room'
	| 'overlap'
	| 'door-swing'
	| 'no-support'
	| 'chair-clearance'
	| 'blocked-route'
	| 'tv-distance'
	| 'monitor-distance'
	| 'no-outlet'
	| 'no-port'
	| 'strip-unplugged'
	| 'cable-short'
	| 'over-capacity';

export interface Finding {
	id: string;
	code: FindingCode;
	severity: FindingSeverity;
	itemIds: string[];
	title: string;
	detail: string;
}

export interface Connection {
	fromId: string;
	toId: string;
	length: number;
	tooShort: boolean;
}

export interface PowerSummary {
	totalWatts: number;
	portsUsed: number;
	portsTotal: number;
	devices: number;
	connected: number;
}

export interface Analysis {
	findings: Finding[];
	connections: Connection[];
	power: PowerSummary;
	cost: number;
	errorCount: number;
	warningCount: number;
}
