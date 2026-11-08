import { createId } from '#shared/lib/id';
import { distance, normalizeAngle, type Point } from '#shared/lib/geometry';
import { josa } from '#shared/lib/josa';
import {
	analyzePlan,
	findFreeSpot,
	getCatalogEntry,
	halfExtents,
	cutoutLimits,
	PLAN_LIMITS,
	ROOM_LIMITS,
	SPEC_LIMITS,
	snapToWall,
	wallRange,
	type ItemData,
	type Opening,
	type PlanData,
	type RoomData,
	type Corner,
	type Cutout,
	type Underlay,
	type SpecKey
} from '#entities/plan';
import { PlacedItem } from './placed-item.svelte';
import { Viewport } from './viewport.svelte';

interface Snapshot {
	room: RoomData;
	items: ItemData[];
	underlay: Underlay | null;
}

export type Direction = 'left' | 'right' | 'up' | 'down';

const HISTORY_LIMIT = 100;
const COALESCE_MS = 700;
const GRID_CM = 5;
const WALL_SNAP_CM = 8;

const DIRECTION_LABEL: Record<Direction, string> = {
	left: '왼쪽',
	right: '오른쪽',
	up: '위쪽',
	down: '아래쪽'
};
const DIRECTION_VECTOR: Record<Direction, [number, number]> = {
	left: [-1, 0],
	right: [1, 0],
	up: [0, -1],
	down: [0, 1]
};

/** 큰 이미지 문자열은 참조로 비교합니다. */
function sameSnapshot(a: Snapshot, b: Snapshot): boolean {
	const body = (snapshot: Snapshot) =>
		JSON.stringify({
			room: snapshot.room,
			items: snapshot.items,
			underlay: snapshot.underlay && { ...snapshot.underlay, src: '' }
		});
	return a.underlay?.src === b.underlay?.src && body(a) === body(b);
}

export class EditorSession {
	readonly id: string;
	readonly viewport = new Viewport();

	name = $state('');
	room = $state<RoomData>({ width: 0, depth: 0, openings: [] });
	items = $state<PlacedItem[]>([]);
	selectedId = $state<string | null>(null);
	announcement = $state('');
	underlay = $state.raw<Underlay | null>(null);
	/** 두 점으로 축척을 맞추는 중이면 찍은 점을 담습니다. */
	calibration = $state.raw<{ points: Point[] } | null>(null);
	focusRequest = $state<{ id: string | null } | null>(null);

	#past = $state.raw<Snapshot[]>([]);
	#future = $state.raw<Snapshot[]>([]);
	#lastKey: string | null = null;
	#lastTime = 0;
	#gestureStart: Snapshot | null = null;

	readonly selected = $derived(this.items.find((item) => item.id === this.selectedId) ?? null);
	readonly analysis = $derived(analyzePlan(this.room, this.items));
	readonly canAddItem = $derived(this.items.length < PLAN_LIMITS.items);
	readonly canAddOpening = $derived(this.room.openings.length < PLAN_LIMITS.openings);
	readonly canUndo = $derived(this.#past.length > 0);
	readonly canRedo = $derived(this.#future.length > 0);

	constructor(plan: PlanData) {
		this.id = plan.id;
		this.name = plan.name;
		this.room = plan.room;
		this.items = plan.items.map((item) => new PlacedItem(item));
		this.underlay = plan.underlay ?? null;
	}

	toData(): PlanData {
		const { room, items, underlay } = this.#capture();
		return {
			version: 1,
			id: this.id,
			name: this.name,
			room,
			items,
			updatedAt: Date.now(),
			...(underlay ? { underlay } : {})
		};
	}

	#capture(): Snapshot {
		return {
			room: $state.snapshot(this.room),
			items: this.items.map((item) => item.toData()),
			underlay: this.underlay
		};
	}

	#restore(snapshot: Snapshot) {
		this.room = structuredClone(snapshot.room);
		this.items = snapshot.items.map((item) => new PlacedItem(item));
		this.underlay = snapshot.underlay;
		if (!snapshot.underlay) this.calibration = null;
		if (!this.items.some((item) => item.id === this.selectedId)) this.selectedId = null;
	}

	#commit(before: Snapshot, key: string | null = null) {
		this.#gestureStart = null;
		if (sameSnapshot(before, this.#capture())) return;
		const now = Date.now();
		const coalesce = key !== null && key === this.#lastKey && now - this.#lastTime < COALESCE_MS;
		this.#lastKey = key;
		this.#lastTime = now;
		if (!coalesce) this.#past = [...this.#past, before].slice(-HISTORY_LIMIT);
		this.#future = [];
	}

	#transact(action: () => void, key: string | null = null) {
		const before = this.#capture();
		action();
		this.#commit(before, key);
	}

	#problemCount() {
		return this.analysis.errorCount + this.analysis.warningCount;
	}

	#announceWithProblems(message: string, before: number) {
		const after = this.#problemCount();
		this.announcement =
			after > before ? `${message}. 점검 항목 ${after - before}건 늘었습니다.` : `${message}.`;
	}

	undo() {
		const previous = this.#past.at(-1);
		if (!previous) return;
		this.#future = [this.#capture(), ...this.#future];
		this.#past = this.#past.slice(0, -1);
		this.#lastKey = null;
		this.#restore(previous);
		this.announcement = '되돌렸습니다.';
	}

	redo() {
		const [next, ...rest] = this.#future;
		if (!next) return;
		this.#past = [...this.#past, this.#capture()];
		this.#future = rest;
		this.#lastKey = null;
		this.#restore(next);
		this.announcement = '다시 실행했습니다.';
	}

	select(id: string | null) {
		this.selectedId = id;
	}

	requestFocus(id: string | null) {
		this.focusRequest = { id };
	}

	addItem(catalogId: string) {
		if (!this.canAddItem) return;
		const entry = getCatalogEntry(catalogId);
		const before = this.#problemCount();
		const spot = findFreeSpot(this.room, this.items, entry);
		const item = new PlacedItem({ id: createId(), catalogId, label: '', price: 0, ...spot });
		this.#transact(() => {
			this.items.push(item);
		});
		this.selectedId = item.id;
		this.requestFocus(item.id);
		this.#announceWithProblems(`${josa(entry.name, '을', '를')} 추가했습니다`, before);
	}

	duplicateItem(id: string) {
		const source = this.items.find((item) => item.id === id);
		if (!source || !this.canAddItem) return;
		const copy = new PlacedItem({ ...source.toData(), id: createId() });
		this.#place(copy, source.x + 20, source.y + 20);
		this.#transact(() => {
			this.items.push(copy);
		});
		this.selectedId = copy.id;
		this.requestFocus(copy.id);
		this.announcement = `${josa(source.name, '을', '를')} 복제했습니다.`;
	}

	removeItem(id: string) {
		const index = this.items.findIndex((item) => item.id === id);
		if (index < 0) return;
		const { name } = this.items[index];
		this.#transact(() => {
			this.items.splice(index, 1);
		});
		if (this.selectedId === id) this.selectedId = null;
		this.requestFocus(this.items[Math.max(0, index - 1)]?.id ?? null);
		this.announcement = `${josa(name, '을', '를')} 삭제했습니다.`;
	}

	#place(item: PlacedItem, x: number, y: number) {
		if (item.entry.layer === 'wall') {
			const spot = snapToWall(this.room, x, y, item.entry.depth, item.entry.width);
			item.x = spot.x;
			item.y = spot.y;
			item.rotation = spot.rotation;
			return;
		}
		item.x = Math.min(this.room.width, Math.max(0, x));
		item.y = Math.min(this.room.depth, Math.max(0, y));
	}

	/** 끌기가 시작될 때의 상태를 기억합니다. */
	beginGesture() {
		this.#gestureStart ??= this.#capture();
	}

	endGesture() {
		if (this.#gestureStart) this.#commit(this.#gestureStart);
	}

	cancelGesture() {
		if (!this.#gestureStart) return;
		this.#restore(this.#gestureStart);
		this.#gestureStart = null;
		this.announcement = '이동을 취소했습니다.';
	}

	get hasGesture() {
		return this.#gestureStart !== null;
	}

	/** 포인터로 옮길 때 씁니다. 5cm 격자와 벽에 맞춥니다. */
	dragItem(id: string, x: number, y: number, snap: boolean) {
		const item = this.items.find((candidate) => candidate.id === id);
		if (!item) return;
		if (!snap) {
			this.#place(item, x, y);
			return;
		}
		const { hx, hy } = halfExtents(item.entry, item.rotation);
		let nextX = Math.round(x / GRID_CM) * GRID_CM;
		let nextY = Math.round(y / GRID_CM) * GRID_CM;
		if (Math.abs(x - hx) < WALL_SNAP_CM) nextX = hx;
		if (Math.abs(this.room.width - hx - x) < WALL_SNAP_CM) nextX = this.room.width - hx;
		if (Math.abs(y - hy) < WALL_SNAP_CM) nextY = hy;
		if (Math.abs(this.room.depth - hy - y) < WALL_SNAP_CM) nextY = this.room.depth - hy;
		this.#place(item, nextX, nextY);
	}

	rotateDrag(id: string, angle: number, snap: boolean) {
		const item = this.items.find((candidate) => candidate.id === id);
		if (!item || item.entry.layer === 'wall') return;
		item.rotation = normalizeAngle(snap ? Math.round(angle / 15) * 15 : Math.round(angle));
	}

	nudge(id: string, direction: Direction, step: number) {
		const item = this.items.find((candidate) => candidate.id === id);
		if (!item) return;
		const before = this.#problemCount();
		const [dx, dy] = DIRECTION_VECTOR[direction];
		this.#transact(() => this.#place(item, item.x + dx * step, item.y + dy * step), `nudge:${id}`);
		const { bounds } = item;
		const gap = {
			left: bounds.minX,
			right: this.room.width - bounds.maxX,
			up: bounds.minY,
			down: this.room.depth - bounds.maxY
		}[direction];
		const label = DIRECTION_LABEL[direction];
		this.#announceWithProblems(
			`${item.name}, ${label}으로 ${step}cm 이동. ${label} 벽까지 ${Math.round(gap)}cm`,
			before
		);
	}

	rotate(id: string, delta: number) {
		const item = this.items.find((candidate) => candidate.id === id);
		if (!item || item.entry.layer === 'wall') return;
		const before = this.#problemCount();
		this.#transact(() => {
			item.rotation = normalizeAngle(item.rotation + delta);
		}, `rotate:${id}`);
		this.#announceWithProblems(`${item.name}, ${item.rotation}도로 회전`, before);
	}

	setPosition(id: string, axis: 'x' | 'y', value: number) {
		const item = this.items.find((candidate) => candidate.id === id);
		if (!item) return;
		this.#transact(() =>
			this.#place(item, axis === 'x' ? value : item.x, axis === 'y' ? value : item.y)
		);
	}

	setRotation(id: string, value: number) {
		const item = this.items.find((candidate) => candidate.id === id);
		if (!item || item.entry.layer === 'wall') return;
		this.#transact(() => {
			item.rotation = normalizeAngle(value);
		});
	}

	setSpec(id: string, key: SpecKey, value: number) {
		const item = this.items.find((candidate) => candidate.id === id);
		if (!item) return;
		const { min, max } = SPEC_LIMITS[key];
		this.#transact(() => {
			item.specs[key] = Math.min(max, Math.max(min, value));
			if (item.entry.layer === 'wall') this.#place(item, item.x, item.y);
		});
		this.announcement = `${item.name} 규격을 바꿨습니다.`;
	}

	resetSpecs(id: string) {
		const item = this.items.find((candidate) => candidate.id === id);
		if (!item) return;
		this.#transact(() => {
			item.specs = {};
			if (item.entry.layer === 'wall') this.#place(item, item.x, item.y);
		});
		this.announcement = `${item.name} 규격을 기본값으로 되돌렸습니다.`;
	}

	setPrice(id: string, value: number) {
		const item = this.items.find((candidate) => candidate.id === id);
		if (!item) return;
		this.#transact(() => {
			item.price = value;
		});
	}

	setLabel(id: string, value: string) {
		const item = this.items.find((candidate) => candidate.id === id);
		if (!item) return;
		this.#transact(() => {
			item.label = value.slice(0, 40);
		}, `label:${id}`);
	}

	/** 방 모양이 바뀐 뒤 잘라 낸 모서리, 문, 콘센트를 벽 안으로 맞춥니다. */
	#fitToRoom() {
		for (const cutout of this.room.cutouts ?? []) this.#clampCutout(cutout);
		for (const opening of this.room.openings) this.#clampOpening(opening);
		for (const item of this.items) {
			if (item.entry.layer === 'wall') this.#place(item, item.x, item.y);
		}
	}

	#clampCutout(cutout: Cutout) {
		const limits = cutoutLimits(this.room, cutout.corner);
		cutout.width = Math.max(limits.min, Math.min(limits.maxWidth, cutout.width));
		cutout.depth = Math.max(limits.min, Math.min(limits.maxDepth, cutout.depth));
	}

	setRoomSize(axis: 'width' | 'depth', value: number) {
		const size = Math.min(ROOM_LIMITS.max, Math.max(ROOM_LIMITS.min, value));
		this.#transact(() => {
			this.room[axis] = size;
			this.#fitToRoom();
		});
	}

	readonly freeCorners = $derived(
		(['ne', 'nw', 'se', 'sw'] as Corner[]).filter(
			(corner) => !this.room.cutouts?.some((cutout) => cutout.corner === corner)
		)
	);

	addCutout() {
		const [corner] = this.freeCorners;
		if (!corner) return;
		const limits = cutoutLimits(this.room, corner);
		if (limits.maxWidth < limits.min || limits.maxDepth < limits.min) {
			this.announcement = '방이 작아 모서리를 더 잘라 낼 수 없습니다.';
			return;
		}
		this.#transact(() => {
			this.room.cutouts = [
				...(this.room.cutouts ?? []),
				{
					id: createId(),
					corner,
					width: Math.min(120, limits.maxWidth),
					depth: Math.min(100, limits.maxDepth)
				}
			];
			this.#fitToRoom();
		});
		this.announcement = '모서리를 잘라 냈습니다.';
	}

	updateCutout(id: string, patch: Partial<Omit<Cutout, 'id'>>) {
		const cutout = this.room.cutouts?.find((candidate) => candidate.id === id);
		if (!cutout) return;
		this.#transact(() => {
			Object.assign(cutout, patch);
			this.#fitToRoom();
		});
	}

	removeCutout(id: string) {
		this.#transact(() => {
			this.room.cutouts = this.room.cutouts?.filter((cutout) => cutout.id !== id);
			this.#fitToRoom();
		});
		this.announcement = '잘라 낸 모서리를 되돌렸습니다.';
	}

	setUnderlay(image: Pick<Underlay, 'src' | 'pixelWidth' | 'pixelHeight'>) {
		this.#transact(() => {
			this.underlay = {
				...image,
				x: 0,
				y: 0,
				cmPerPixel: this.room.width / image.pixelWidth,
				opacity: 0.6
			};
		});
		this.announcement = '평면도 이미지를 올렸습니다. 실제 길이에 맞게 축척을 조정해 주세요.';
	}

	updateUnderlay(patch: Partial<Pick<Underlay, 'x' | 'y' | 'cmPerPixel' | 'opacity'>>) {
		if (!this.underlay) return;
		const next = { ...this.underlay, ...patch };
		this.#transact(() => {
			this.underlay = next;
		});
	}

	removeUnderlay() {
		this.calibration = null;
		this.#transact(() => {
			this.underlay = null;
		});
		this.announcement = '평면도 이미지를 삭제했습니다.';
	}

	startCalibration() {
		this.calibration = { points: [] };
		this.announcement = '도면에서 길이를 아는 두 점을 차례로 눌러 주세요.';
	}

	addCalibrationPoint(point: Point) {
		if (!this.calibration || this.calibration.points.length >= 2) return;
		const points = [...this.calibration.points, point];
		this.calibration = { points };
		if (points.length === 1) this.announcement = '두 번째 점을 눌러 주세요.';
	}

	cancelCalibration() {
		this.calibration = null;
		this.announcement = '축척 맞추기를 취소했습니다.';
	}

	/** 첫 번째 점을 고정하고 두 점 사이가 실제 길이가 되도록 이미지를 늘립니다. */
	applyCalibration(realCm: number) {
		const [a, b] = this.calibration?.points ?? [];
		const image = this.underlay;
		this.calibration = null;
		if (!a || !b || !image) return;
		const measured = distance(a, b);
		if (measured <= 0 || realCm <= 0) return;
		const ratio = realCm / measured;
		this.updateUnderlay({
			cmPerPixel: image.cmPerPixel * ratio,
			x: a.x - (a.x - image.x) * ratio,
			y: a.y - (a.y - image.y) * ratio
		});
		this.announcement = '축척을 맞췄습니다.';
	}

	#clampOpening(opening: Opening) {
		const { start, end } = wallRange(this.room, opening.wall);
		opening.width = Math.min(end - start, Math.max(30, opening.width));
		opening.offset = Math.min(end - opening.width, Math.max(start, opening.offset));
	}

	addOpening(kind: Opening['kind']) {
		if (!this.canAddOpening) return;
		this.#transact(() => {
			this.room.openings.push({
				id: createId(),
				kind,
				wall: kind === 'door' ? 'south' : 'north',
				offset: 20,
				width: kind === 'door' ? 90 : 120,
				hinge: 'start'
			});
			const added = this.room.openings[this.room.openings.length - 1];
			this.#clampOpening(added);
		});
		this.announcement = kind === 'door' ? '문을 추가했습니다.' : '창문을 추가했습니다.';
	}

	updateOpening(id: string, patch: Partial<Omit<Opening, 'id' | 'kind'>>) {
		const opening = this.room.openings.find((candidate) => candidate.id === id);
		if (!opening) return;
		this.#transact(() => {
			Object.assign(opening, patch);
			this.#clampOpening(opening);
		});
	}

	removeOpening(id: string) {
		this.#transact(() => {
			this.room.openings = this.room.openings.filter((opening) => opening.id !== id);
		});
		this.announcement = '문 또는 창문을 삭제했습니다.';
	}
}
