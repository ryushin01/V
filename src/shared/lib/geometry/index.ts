export interface Point {
	x: number;
	y: number;
}

/** 중심과 크기, 시계 방향 각도(도)로 나타낸 사각형입니다. 단위는 cm입니다. */
export interface RotatedRect {
	cx: number;
	cy: number;
	width: number;
	depth: number;
	rotation: number;
}

export interface Bounds {
	minX: number;
	minY: number;
	maxX: number;
	maxY: number;
}

const DEGREE = Math.PI / 180;
const OVERLAP_EPSILON = 0.01;

export function normalizeAngle(angle: number): number {
	return ((angle % 360) + 360) % 360;
}

export function localToWorld(rect: RotatedRect, lx: number, ly: number): Point {
	const angle = rect.rotation * DEGREE;
	const cos = Math.cos(angle);
	const sin = Math.sin(angle);
	return { x: rect.cx + lx * cos - ly * sin, y: rect.cy + lx * sin + ly * cos };
}

export function corners(rect: RotatedRect): Point[] {
	const hw = rect.width / 2;
	const hd = rect.depth / 2;
	return [
		localToWorld(rect, -hw, -hd),
		localToWorld(rect, hw, -hd),
		localToWorld(rect, hw, hd),
		localToWorld(rect, -hw, hd)
	];
}

export function boundsOf(points: Point[]): Bounds {
	return {
		minX: Math.min(...points.map((p) => p.x)),
		minY: Math.min(...points.map((p) => p.y)),
		maxX: Math.max(...points.map((p) => p.x)),
		maxY: Math.max(...points.map((p) => p.y))
	};
}

function projectionRange(points: Point[], axis: Point): [number, number] {
	let min = Infinity;
	let max = -Infinity;
	for (const point of points) {
		const value = point.x * axis.x + point.y * axis.y;
		min = Math.min(min, value);
		max = Math.max(max, value);
	}
	return [min, max];
}

function edgeNormals(points: Point[]): Point[] {
	return points.map((point, index) => {
		const next = points[(index + 1) % points.length];
		const dx = next.x - point.x;
		const dy = next.y - point.y;
		const length = Math.hypot(dx, dy) || 1;
		return { x: -dy / length, y: dx / length };
	});
}

/** 분리축 정리(SAT)로 볼록 다각형의 겹침을 판정합니다. 변이 맞닿기만 한 경우는 겹침이 아닙니다. */
export function polygonsOverlap(a: Point[], b: Point[]): boolean {
	for (const axis of [...edgeNormals(a), ...edgeNormals(b)]) {
		const [minA, maxA] = projectionRange(a, axis);
		const [minB, maxB] = projectionRange(b, axis);
		if (maxA - minB <= OVERLAP_EPSILON || maxB - minA <= OVERLAP_EPSILON) return false;
	}
	return true;
}

export function distanceToSegment(point: Point, a: Point, b: Point): number {
	const dx = b.x - a.x;
	const dy = b.y - a.y;
	const lengthSquared = dx * dx + dy * dy;
	const t =
		lengthSquared === 0
			? 0
			: Math.min(1, Math.max(0, ((point.x - a.x) * dx + (point.y - a.y) * dy) / lengthSquared));
	return Math.hypot(point.x - (a.x + t * dx), point.y - (a.y + t * dy));
}

export function pointInConvex(point: Point, polygon: Point[]): boolean {
	let sign = 0;
	for (let index = 0; index < polygon.length; index += 1) {
		const a = polygon[index];
		const b = polygon[(index + 1) % polygon.length];
		const cross = (b.x - a.x) * (point.y - a.y) - (b.y - a.y) * (point.x - a.x);
		if (Math.abs(cross) < 1e-9) continue;
		const current = Math.sign(cross);
		if (sign !== 0 && current !== sign) return false;
		sign = current;
	}
	return true;
}

/** 점에서 볼록 다각형까지의 거리입니다. 안쪽이면 0입니다. */
export function distanceToPolygon(point: Point, polygon: Point[]): number {
	if (pointInConvex(point, polygon)) return 0;
	let minimum = Infinity;
	for (let index = 0; index < polygon.length; index += 1) {
		minimum = Math.min(
			minimum,
			distanceToSegment(point, polygon[index], polygon[(index + 1) % polygon.length])
		);
	}
	return minimum;
}

export function distance(a: Point, b: Point): number {
	return Math.hypot(a.x - b.x, a.y - b.y);
}
