import { describe, expect, it } from 'vitest';
import {
	createCustomEntry,
	createEmptyPlan,
	createSamplePlan,
	PLAN_LIMITS,
	registerCustomEntries
} from '#entities/plan';
import { EditorSession } from './session.svelte';

function sessionWithDesk() {
	const session = new EditorSession(createEmptyPlan());
	session.addItem('desk-140');
	return { session, desk: session.items[0] };
}

describe('EditorSession', () => {
	it('추가하면 선택하고 초점을 요청합니다', () => {
		const { session, desk } = sessionWithDesk();
		expect(session.selectedId).toBe(desk.id);
		expect(session.focusRequest?.id).toBe(desk.id);
		expect(session.announcement).toContain('책상 140을 추가');
	});

	it('방향키 이동은 벽까지 거리를 안내합니다', () => {
		const { session, desk } = sessionWithDesk();
		desk.x = 200;
		session.nudge(desk.id, 'left', 10);
		expect(desk.x).toBe(190);
		expect(session.announcement).toBe('책상 140, 왼쪽으로 10cm 이동. 왼쪽 벽까지 120cm.');
	});

	it('연속 이동은 되돌리기 한 번으로 묶습니다', () => {
		const { session, desk } = sessionWithDesk();
		const start = desk.x;
		session.undo();
		session.redo();
		const restored = session.items[0];
		session.nudge(restored.id, 'right', 10);
		session.nudge(restored.id, 'right', 10);
		session.undo();
		expect(session.items[0].x).toBe(start);
	});

	it('되돌리기와 다시 하기', () => {
		const { session } = sessionWithDesk();
		expect(session.canUndo).toBe(true);
		session.undo();
		expect(session.items).toHaveLength(0);
		expect(session.canRedo).toBe(true);
		session.redo();
		expect(session.items).toHaveLength(1);
	});

	it('끌기를 취소하면 시작 위치로 돌아갑니다', () => {
		const { session, desk } = sessionWithDesk();
		const start = { x: desk.x, y: desk.y };
		session.beginGesture();
		session.dragItem(desk.id, 300, 200, false);
		session.cancelGesture();
		expect(session.items[0]).toMatchObject(start);
	});

	it('끌기는 격자와 벽에 맞춥니다', () => {
		const { session, desk } = sessionWithDesk();
		session.dragItem(desk.id, 173, 141, true);
		expect(desk).toMatchObject({ x: 175, y: 140 });
		session.dragItem(desk.id, 73, 141, true);
		expect(desk.x).toBe(70);
	});

	it('분석은 좌표 변경을 따라 다시 계산됩니다', () => {
		const { session, desk } = sessionWithDesk();
		session.addItem('tv-stand');
		expect(session.analysis.findings.some((f) => f.code === 'overlap')).toBe(false);
		const stand = session.items[1];
		stand.x = desk.x;
		stand.y = desk.y;
		expect(session.analysis.findings.some((f) => f.code === 'overlap')).toBe(true);
	});

	it('콘센트는 벽에서 떨어지지 않고 방이 줄어도 따라옵니다', () => {
		const session = new EditorSession(createEmptyPlan());
		session.addItem('outlet-2');
		const outlet = session.items[0];
		session.setPosition(outlet.id, 'x', 200);
		session.setPosition(outlet.id, 'y', 300);
		expect(outlet.y).toBe(session.room.depth - 2);
		session.setRoomSize('depth', 250);
		expect(outlet.y).toBe(248);
	});

	it('방을 줄이면 문이 벽 안에 머뭅니다', () => {
		const session = new EditorSession(createEmptyPlan());
		session.setRoomSize('width', 200);
		const door = session.room.openings[0];
		expect(door.offset + door.width).toBeLessThanOrEqual(200);
	});

	it('삭제하면 이전 물건으로 초점을 옮깁니다', () => {
		const { session, desk } = sessionWithDesk();
		session.addItem('chair');
		session.removeItem(session.items[1].id);
		expect(session.focusRequest?.id).toBe(desk.id);
	});

	it('복제한 콘센트도 벽에 붙습니다', () => {
		const session = new EditorSession(createEmptyPlan());
		session.addItem('outlet-2');
		session.setPosition(session.items[0].id, 'x', 200);
		session.duplicateItem(session.items[0].id);
		expect(session.items[1]).toMatchObject({ x: 220, y: 2 });
	});

	it('복제한 물건은 방 밖으로 나가지 않습니다', () => {
		const session = new EditorSession(createEmptyPlan());
		session.addItem('chair');
		session.items[0].x = session.room.width;
		session.duplicateItem(session.items[0].id);
		expect(session.items[1].x).toBe(session.room.width);
	});

	it('파일로 다시 불러올 수 있는 개수까지만 추가합니다', () => {
		const plan = createEmptyPlan();
		const session = new EditorSession({
			...plan,
			items: Array.from({ length: PLAN_LIMITS.items }, (_, index) => ({
				id: `item-${index}`,
				catalogId: 'chair',
				label: '',
				x: 100,
				y: 100,
				rotation: 0,
				price: 0
			}))
		});
		session.addItem('chair');
		session.duplicateItem('item-0');
		expect(session.items).toHaveLength(PLAN_LIMITS.items);
	});

	it('사용자 규격이 점검과 저장에 반영됩니다', () => {
		const session = new EditorSession(createEmptyPlan());
		session.addItem('tv-55');
		const tv = session.items[0];
		session.setSpec(tv.id, 'width', 170);
		session.setSpec(tv.id, 'watts', 300);
		expect(tv.entry.width).toBe(170);
		expect(session.analysis.power.totalWatts).toBe(300);
		expect(session.toData().items[0].specs).toEqual({ width: 170, watts: 300 });
		session.resetSpecs(tv.id);
		expect(tv.entry.width).toBe(123);
		expect(session.toData().items[0].specs).toBeUndefined();
	});

	it('규격은 허용 범위로 맞추고 되돌릴 수 있습니다', () => {
		const session = new EditorSession(createEmptyPlan());
		session.addItem('chair');
		const chair = session.items[0];
		session.setSpec(chair.id, 'width', 9999);
		expect(chair.entry.width).toBe(500);
		session.undo();
		expect(session.items[0].entry.width).toBe(62);
	});

	const image = { src: 'data:image/jpeg;base64,AAAA', pixelWidth: 400, pixelHeight: 300 };

	it('평면도 이미지를 방 가로에 맞춰 깔고 되돌립니다', () => {
		const session = new EditorSession(createEmptyPlan());
		session.setUnderlay(image);
		expect(session.underlay?.cmPerPixel).toBe(1);
		expect(session.toData().underlay?.src).toBe(image.src);
		session.undo();
		expect(session.underlay).toBeNull();
	});

	it('두 점과 실제 길이로 축척을 맞춥니다', () => {
		const session = new EditorSession(createEmptyPlan());
		session.setUnderlay(image);
		session.startCalibration();
		session.addCalibrationPoint({ x: 100, y: 100 });
		session.addCalibrationPoint({ x: 200, y: 100 });
		session.applyCalibration(300);
		expect(session.underlay?.cmPerPixel).toBe(3);
		expect(session.underlay?.x).toBe(-200);
		expect(session.calibration).toBeNull();
	});

	it('되돌리기로 이미지가 사라지면 축척 맞추기도 끝냅니다', () => {
		const session = new EditorSession(createEmptyPlan());
		session.setUnderlay(image);
		session.startCalibration();
		session.undo();
		expect(session.underlay).toBeNull();
		expect(session.calibration).toBeNull();
	});

	it('모서리를 자르면 문이 남은 벽으로 옮겨 갑니다', () => {
		const session = new EditorSession(createEmptyPlan());
		session.addOpening('window');
		session.addCutout();
		const cutout = session.room.cutouts?.[0];
		expect(cutout?.corner).toBe('ne');
		session.updateOpening(session.room.openings[1].id, { offset: 390 });
		const opening = session.room.openings[1];
		expect(opening.offset + opening.width).toBeLessThanOrEqual(400 - (cutout?.width ?? 0));
		session.undo();
		session.undo();
		expect(session.room.cutouts ?? []).toHaveLength(0);
	});

	it('모서리는 네 곳까지만 자릅니다', () => {
		const session = new EditorSession(createEmptyPlan());
		for (let index = 0; index < 5; index += 1) session.addCutout();
		expect(session.room.cutouts).toHaveLength(4);
		expect(session.freeCorners).toEqual([]);
	});

	it('직접 등록 제품을 고치면 놓인 물건과 저장 데이터에 반영됩니다', () => {
		const entry = createCustomEntry({
			id: 'custom-session-desk',
			name: '내 책상',
			brand: '',
			kind: 'desk',
			width: 150,
			depth: 75,
			watts: 0,
			cable: 0,
			glyph: ''
		});
		registerCustomEntries([entry], true);
		const session = new EditorSession(createEmptyPlan());
		session.addItem(entry.id);
		expect(session.toData().customEntries?.[0].width).toBe(150);
		registerCustomEntries([{ ...entry, width: 180 }], true);
		expect(session.items[0].entry.width).toBe(180);
		expect(session.toData().customEntries?.[0].width).toBe(180);
	});

	it('직접 등록 제품을 쓰지 않으면 담지 않습니다', () => {
		expect(new EditorSession(createEmptyPlan()).toData().customEntries).toBeUndefined();
	});

	it('저장 데이터로 내보냅니다', () => {
		const sample = createSamplePlan();
		const session = new EditorSession(sample);
		expect(session.toData().items).toEqual(sample.items);
	});
});
