import { describe, expect, it } from 'vitest';
import { createEmptyPlan, createSamplePlan } from '#entities/plan';
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

	it('저장 데이터로 내보냅니다', () => {
		const sample = createSamplePlan();
		const session = new EditorSession(sample);
		expect(session.toData().items).toEqual(sample.items);
	});
});
