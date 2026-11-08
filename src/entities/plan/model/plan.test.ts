import { describe, expect, it } from 'vitest';
import { analyzePlan, viewingRange } from './analysis';
import { createSamplePlan } from './factory';
import { findFreeSpot } from './placement';
import { getCatalogEntry } from './catalog';
import { openingGeometry, snapToWall } from './room';
import { parsePlan, stringifyPlan } from './serialize';
import type { ItemData, RoomData } from './types';

const room = (overrides: Partial<RoomData> = {}): RoomData => ({
	width: 400,
	depth: 400,
	openings: [],
	...overrides
});
let sequence = 0;
const item = (catalogId: string, x: number, y: number, rotation = 0): ItemData => ({
	id: `item-${(sequence += 1)}`,
	catalogId,
	x,
	y,
	rotation,
	price: 0,
	label: ''
});
const codes = (r: RoomData, items: ItemData[], severity?: string) =>
	analyzePlan(r, items)
		.findings.filter((finding) => !severity || finding.severity === severity)
		.map((finding) => finding.code);

describe('배치 점검', () => {
	it('바닥 물건끼리 겹치면 오류입니다', () => {
		expect(codes(room(), [item('desk-140', 100, 100), item('tv-stand', 110, 110)])).toContain(
			'overlap'
		);
	});

	it('책상 위 모니터와 책상은 겹침이 아닙니다', () => {
		expect(codes(room(), [item('desk-140', 100, 100), item('monitor-27', 100, 90)])).not.toContain(
			'overlap'
		);
	});

	it('의자를 책상 아래로 넣은 것은 겹침이 아닙니다', () => {
		expect(codes(room(), [item('desk-140', 100, 100), item('chair', 100, 140)])).not.toContain(
			'overlap'
		);
	});

	it('책상 없이 놓은 모니터는 받침 경고가 나옵니다', () => {
		expect(codes(room(), [item('monitor-27', 200, 200)])).toContain('no-support');
	});

	it('받침 없는 PC 타워는 바닥 물건과 겹치면 오류입니다', () => {
		expect(codes(room(), [item('pc-tower', 200, 200), item('subwoofer', 205, 205)])).toContain(
			'overlap'
		);
	});

	it('방 밖으로 나가면 오류입니다', () => {
		expect(codes(room(), [item('desk-140', 10, 100)])).toContain('out-of-room');
	});

	it('문이 여닫히는 영역에 바닥 물건이 있으면 오류입니다', () => {
		const door = {
			id: 'd',
			kind: 'door' as const,
			wall: 'south' as const,
			offset: 100,
			width: 90,
			hinge: 'start' as const
		};
		expect(codes(room({ openings: [door] }), [item('tv-stand', 150, 370)])).toContain('door-swing');
	});

	it('의자 뒤 여유가 60cm보다 적으면 경고입니다', () => {
		const result = analyzePlan(room(), [item('chair', 200, 350)]);
		const finding = result.findings.find((f) => f.code === 'chair-clearance');
		expect(finding?.severity).toBe('warning');
		expect(finding?.detail).toContain('15cm');
	});

	it('의자 뒤가 비어 있으면 통과입니다', () => {
		expect(codes(room(), [item('chair', 200, 200)], 'ok')).toContain('chair-clearance');
	});

	it('가구로 막힌 좌석은 통로 경고가 나옵니다', () => {
		const door = {
			id: 'd',
			kind: 'door' as const,
			wall: 'south' as const,
			offset: 150,
			width: 90,
			hinge: 'start' as const
		};
		const small = room({ width: 200, depth: 400, openings: [door] });
		const barrier = [item('desk-160', 80, 200), item('desk-160', 240, 200)];
		expect(codes(small, [...barrier, item('chair', 100, 60)])).toContain('blocked-route');
	});

	it('통로가 있으면 경고가 나오지 않습니다', () => {
		const door = {
			id: 'd',
			kind: 'door' as const,
			wall: 'south' as const,
			offset: 150,
			width: 90,
			hinge: 'start' as const
		};
		expect(codes(room({ openings: [door] }), [item('chair', 200, 100)])).not.toContain(
			'blocked-route'
		);
	});
});

describe('시청 거리', () => {
	it('65인치 권장 거리를 시야각으로 계산합니다', () => {
		expect(viewingRange(65)).toEqual({ min: 198, max: 269 });
	});

	it('TV가 너무 가까우면 경고합니다', () => {
		const result = analyzePlan(room(), [
			item('tv-stand', 200, 20),
			item('tv-65', 200, 20),
			item('chair', 200, 120)
		]);
		const finding = result.findings.find((f) => f.code === 'tv-distance');
		expect(finding?.severity).toBe('warning');
		expect(finding?.title).toContain('가깝습니다');
	});

	it('모니터 거리가 범위 안이면 통과합니다', () => {
		const result = analyzePlan(room(), [
			item('desk-140', 200, 100),
			item('monitor-27', 200, 80),
			item('chair', 200, 150)
		]);
		expect(result.findings.find((f) => f.code === 'monitor-distance')?.severity).toBe('ok');
	});
});

describe('전력과 구 수', () => {
	it('벽 콘센트가 없으면 경고합니다', () => {
		expect(codes(room(), [item('pc-tower', 100, 100)])).toContain('no-outlet');
	});

	it('구 수가 모자라면 오류입니다', () => {
		const result = analyzePlan(room(), [
			item('outlet-2', 200, 2),
			item('desk-140', 200, 60),
			item('monitor-27', 170, 50),
			item('monitor-27', 230, 50),
			item('pc-tower', 120, 150)
		]);
		expect(result.findings.find((f) => f.code === 'no-port')?.title).toContain('1개 부족');
		expect(result.power).toMatchObject({
			devices: 3,
			connected: 2,
			totalWatts: 640,
			portsTotal: 2
		});
	});

	it('멀티탭을 쓰면 구 수가 늘어납니다', () => {
		const result = analyzePlan(room(), [
			item('outlet-2', 200, 2),
			item('strip-4', 200, 30),
			item('pc-tower', 120, 80),
			item('pc-tower', 280, 80),
			item('subwoofer', 200, 120)
		]);
		expect(result.power.connected).toBe(3);
		expect(result.connections).toHaveLength(4);
	});

	it('케이블이 닿지 않으면 경고합니다', () => {
		expect(codes(room(), [item('outlet-2', 200, 2), item('pc-tower', 200, 300)])).toContain(
			'cable-short'
		);
	});

	it('멀티탭 정격을 넘으면 오류입니다', () => {
		const towers = Array.from({ length: 5 }, (_, i) => item('pc-tower', 100 + i * 40, 60));
		expect(
			codes(room(), [item('outlet-2', 200, 2), item('strip-6', 200, 30), ...towers])
		).toContain('over-capacity');
	});

	it('비용을 합산합니다', () => {
		const priced = { ...item('chair', 200, 200), price: 1000 };
		expect(analyzePlan(room(), [priced, { ...priced, id: 'other', price: 500 }]).cost).toBe(1500);
	});
});

describe('방 계산', () => {
	it('경첩 쪽에서 문짝이 방 안으로 열립니다', () => {
		const geometry = openingGeometry(room(), {
			id: 'd',
			kind: 'door',
			wall: 'south',
			offset: 100,
			width: 90,
			hinge: 'end'
		});
		expect(geometry.hinge).toEqual({ x: 190, y: 400 });
		expect(geometry.leafEnd).toEqual({ x: 190, y: 310 });
	});

	it('콘센트는 가장 가까운 벽에 붙습니다', () => {
		expect(snapToWall(room(), 395, 100, 4, 12)).toEqual({ x: 398, y: 100, rotation: 90 });
	});
});

describe('자동 배치', () => {
	it('모니터를 책상 위에 놓습니다', () => {
		const desk = item('desk-140', 100, 100);
		const spot = findFreeSpot(room(), [desk], getCatalogEntry('monitor-27'));
		expect(Math.abs(spot.x - 100)).toBeLessThanOrEqual(39);
		expect(Math.abs(spot.y - 100)).toBeLessThanOrEqual(25);
	});

	it('이미 놓인 물건과 겹치지 않게 놓습니다', () => {
		const first = item('desk-140', 70, 35);
		const spot = findFreeSpot(room(), [first], getCatalogEntry('desk-140'));
		const placed = { ...item('desk-140', spot.x, spot.y) };
		expect(codes(room(), [first, placed])).not.toContain('overlap');
	});
});

describe('파일 입출력', () => {
	it('내보낸 파일을 다시 불러옵니다', () => {
		const sample = createSamplePlan();
		const parsed = parsePlan(stringifyPlan(sample));
		expect(parsed.ok).toBe(true);
		if (parsed.ok) {
			expect(parsed.plan.items).toHaveLength(sample.items.length);
			expect(parsed.plan.id).not.toBe(sample.id);
		}
	});

	it('사용자 규격을 검사합니다', () => {
		const make = (specs: unknown) =>
			parsePlan(
				JSON.stringify({
					version: 1,
					room: { width: 300, depth: 300, openings: [] },
					items: [{ catalogId: 'chair', x: 10, y: 10, rotation: 0, specs }]
				})
			);
		const valid = make({ width: 80 });
		expect(valid.ok && valid.plan.items[0].specs).toEqual({ width: 80 });
		expect(make({ width: 99999 }).ok).toBe(false);
		expect(make('wide').ok).toBe(false);
	});

	it('지나치게 많은 물건은 거절합니다', () => {
		const items = Array.from({ length: 501 }, () => ({
			catalogId: 'chair',
			x: 10,
			y: 10,
			rotation: 0
		}));
		const room = { width: 300, depth: 300, openings: [] };
		const parsed = parsePlan(JSON.stringify({ version: 1, room, items }));
		expect(parsed.ok).toBe(false);
	});

	it.each([
		['{', 'JSON'],
		['{"version":2,"room":{}}', '버전'],
		['{"version":1,"room":{"width":10,"depth":300,"openings":[]},"items":[]}', '방 크기'],
		[
			'{"version":1,"room":{"width":300,"depth":300,"openings":[]},"items":[{"catalogId":"x","x":0,"y":0,"rotation":0}]}',
			'알 수 없는'
		],
		[
			'{"version":1,"room":{"width":300,"depth":300,"openings":[{"kind":"door","wall":"north","offset":290,"width":90}]},"items":[]}',
			'벽을 벗어'
		]
	])('잘못된 파일 %s 는 거절합니다', (text, message) => {
		const parsed = parsePlan(text);
		expect(parsed.ok).toBe(false);
		if (!parsed.ok) expect(parsed.error).toContain(message);
	});
});

describe('예시 배치도', () => {
	it('오류 없이 시작합니다', () => {
		const sample = createSamplePlan();
		const result = analyzePlan(sample.room, sample.items);
		expect(result.findings.filter((f) => f.severity === 'error')).toEqual([]);
	});
});
