import { createId } from '#shared/lib/id';
import type { ItemData, PlanData } from './types';

const DEFAULT_ROOM_SIZE = { width: 400, depth: 320 } as const;

export function createEmptyPlan(name = '새 배치도'): PlanData {
	return {
		version: 1,
		id: createId(),
		name,
		updatedAt: Date.now(),
		items: [],
		room: {
			...DEFAULT_ROOM_SIZE,
			openings: [
				{ id: createId(), kind: 'door', wall: 'south', offset: 290, width: 90, hinge: 'end' }
			]
		}
	};
}

function place(
	catalogId: string,
	x: number,
	y: number,
	rotation = 0,
	price = 0,
	label = ''
): ItemData {
	return { id: createId(), catalogId, x, y, rotation, price, label };
}

/** 예시 금액은 모두 가상의 값입니다. */
export function createSamplePlan(): PlanData {
	return {
		version: 1,
		id: createId(),
		name: '예시: 책상과 TV를 함께 쓰는 방',
		updatedAt: Date.now(),
		room: {
			width: 460,
			depth: 380,
			openings: [
				{ id: createId(), kind: 'door', wall: 'south', offset: 20, width: 90, hinge: 'start' },
				{ id: createId(), kind: 'window', wall: 'north', offset: 240, width: 160, hinge: 'start' }
			]
		},
		items: [
			place('desk-160', 85, 40, 0, 320000),
			place('monitor-34', 85, 25, 0, 690000),
			place('pc-tower', 148, 40, 0, 1800000),
			place('gaming-chair', 85, 120, 0, 390000),
			place('strip-6', 85, 12, 0, 25000),
			place('outlet-2', 170, 2, 0),
			place('tv-stand', 440, 215, 90, 280000),
			place('tv-55', 445, 215, 90, 1250000),
			place('console', 447, 320, 90, 620000),
			place('subwoofer', 440, 100, 0, 240000),
			place('strip-4', 425, 345, 90, 18000),
			place('outlet-2', 458, 335, 90),
			place('sofa-2', 245, 210, 90, 760000)
		]
	};
}
