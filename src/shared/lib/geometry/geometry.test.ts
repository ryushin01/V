import { describe, expect, it } from 'vitest';
import {
	boundsOf,
	corners,
	distanceToPolygon,
	normalizeAngle,
	pointInConvex,
	polygonsOverlap
} from './index';

const rect = (cx: number, cy: number, width: number, depth: number, rotation = 0) => ({
	cx,
	cy,
	width,
	depth,
	rotation
});

describe('geometry', () => {
	it('각도를 0 이상 360 미만으로 맞춥니다', () => {
		expect(normalizeAngle(-15)).toBe(345);
		expect(normalizeAngle(375)).toBe(15);
	});

	it('90도 회전하면 가로와 세로 범위가 바뀝니다', () => {
		const bounds = boundsOf(corners(rect(0, 0, 100, 20, 90)));
		expect(bounds.maxX).toBeCloseTo(10);
		expect(bounds.maxY).toBeCloseTo(50);
	});

	it('겹친 사각형을 찾습니다', () => {
		expect(polygonsOverlap(corners(rect(0, 0, 10, 10)), corners(rect(5, 5, 10, 10)))).toBe(true);
	});

	it('변이 맞닿기만 하면 겹침이 아닙니다', () => {
		expect(polygonsOverlap(corners(rect(0, 0, 10, 10)), corners(rect(10, 0, 10, 10)))).toBe(false);
	});

	it('축 정렬 범위는 겹쳐도 회전으로 떨어져 있으면 겹침이 아닙니다', () => {
		const diamond = corners(rect(0, 0, 10, 10, 45));
		const corner = corners(rect(6.6, 6.6, 4, 4));
		expect(polygonsOverlap(diamond, corner)).toBe(false);
	});

	it('점과 다각형의 거리를 계산합니다', () => {
		const square = corners(rect(0, 0, 10, 10));
		expect(pointInConvex({ x: 1, y: 1 }, square)).toBe(true);
		expect(distanceToPolygon({ x: 1, y: 1 }, square)).toBe(0);
		expect(distanceToPolygon({ x: 15, y: 0 }, square)).toBeCloseTo(10);
	});
});
