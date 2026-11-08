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

export interface RoomData {
	width: number;
	depth: number;
	openings: Opening[];
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
}

export interface PlanData {
	version: 1;
	id: string;
	name: string;
	room: RoomData;
	items: ItemData[];
	updatedAt: number;
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
}

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
