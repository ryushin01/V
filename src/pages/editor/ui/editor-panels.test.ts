import { fireEvent, render, screen, waitFor } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { createEmptyPlan, createSamplePlan } from '#entities/plan';
import { EditorSession } from '../model/session.svelte';
import CatalogPanel from './CatalogPanel.svelte';
import EditorToolbar from './EditorToolbar.svelte';
import FloorPlan from './FloorPlan.svelte';
import ItemForm from './ItemForm.svelte';
import ItemList from './ItemList.svelte';
import ReviewPanel from './ReviewPanel.svelte';
import RoomForm from './RoomForm.svelte';
import UnderlayForm from './UnderlayForm.svelte';
import { validateImageFile } from '../lib/load-image';

const empty = () => new EditorSession(createEmptyPlan());
const sample = () => new EditorSession(createSamplePlan());

describe('CatalogPanel', () => {
	it('요건의 물건 분류를 모두 제공하고 누르면 추가합니다', async () => {
		const session = empty();
		render(CatalogPanel, { session });
		for (const name of ['책상', '모니터', 'PC 타워', '게임기', '의자', 'TV', '스피커', '콘센트']) {
			expect(screen.getAllByRole('button', { name: new RegExp(name) }).length).toBeGreaterThan(0);
		}
		await userEvent.click(screen.getByRole('button', { name: /^PC 타워/ }));
		expect(session.items[0].entry.kind).toBe('pc');
	});
});

describe('CatalogPanel 검색', () => {
	it('검색어로 거르고 개수를 알립니다', async () => {
		const session = empty();
		render(CatalogPanel, { session });
		await userEvent.type(screen.getByLabelText('모델명이나 제조사로 찾기'), 'G9');
		const button = screen.getByRole('button', { name: /Odyssey OLED G9/ });
		expect(screen.getAllByRole('button')).toHaveLength(1);
		expect(screen.getByText('1개')).toBeInTheDocument();
		await userEvent.click(button);
		expect(session.items[0].entry.diagonalInch).toBe(49);
	});

	it('결과가 없으면 대안을 안내합니다', async () => {
		render(CatalogPanel, { session: empty() });
		await userEvent.type(screen.getByLabelText('모델명이나 제조사로 찾기'), '없는모델');
		expect(screen.getByText(/규격을 직접 입력/)).toBeInTheDocument();
	});
});

describe('ItemForm', () => {
	it('실제 모델의 전력 기준을 보여 줍니다', () => {
		const session = empty();
		session.addItem('sony-ps5-pro');
		render(ItemForm, { session, item: session.items[0] });
		const watts = screen.getByLabelText('소비 전력');
		expect(watts).toHaveValue(390);
		expect(watts).toHaveAccessibleDescription('정격 소비 전력');
	});

	it('실제 제품에 맞게 규격을 바꿉니다', async () => {
		const session = empty();
		session.addItem('tv-55');
		render(ItemForm, { session, item: session.items[0] });
		const size = screen.getByLabelText('화면 크기');
		await userEvent.clear(size);
		await userEvent.type(size, '75');
		await userEvent.tab();
		expect(session.items[0].entry.diagonalInch).toBe(75);
		await userEvent.click(screen.getByRole('button', { name: '기본 규격으로' }));
		expect(session.items[0].entry.diagonalInch).toBe(55);
	});

	it('0을 입력해도 입력란이 남습니다', async () => {
		const session = empty();
		session.addItem('pc-tower');
		render(ItemForm, { session, item: session.items[0] });
		const watts = screen.getByLabelText('소비 전력');
		await userEvent.clear(watts);
		await userEvent.type(watts, '0');
		await userEvent.tab();
		expect(session.items[0].entry.watts).toBe(0);
		expect(screen.getByLabelText('소비 전력')).toBeInTheDocument();
	});

	it('추정 치수는 직접 고치면 안내를 거둡니다', async () => {
		const session = empty();
		session.addItem('leopold-fc980c');
		render(ItemForm, { session, item: session.items[0] });
		const width = screen.getByLabelText('가로');
		expect(width).toHaveAccessibleDescription(/추정 치수/);
		await userEvent.clear(width);
		await userEvent.type(width, '38');
		await userEvent.tab();
		expect(screen.getByLabelText('가로')).not.toHaveAccessibleDescription(/추정 치수/);
		// 고치지 않은 세로는 여전히 추정값입니다.
		expect(screen.getByLabelText('세로')).toHaveAccessibleDescription(/추정 치수/);
	});

	it('해당 없는 규격은 보여 주지 않습니다', () => {
		const session = empty();
		session.addItem('chair');
		render(ItemForm, { session, item: session.items[0] });
		expect(screen.queryByLabelText('소비 전력')).toBeNull();
		expect(screen.getByLabelText('가로')).toBeInTheDocument();
	});

	it('숫자 입력은 끌기의 대안입니다', async () => {
		const session = empty();
		session.addItem('desk-140');
		render(ItemForm, { session, item: session.items[0] });
		const x = screen.getByLabelText('X');
		await userEvent.clear(x);
		await userEvent.type(x, '200');
		await userEvent.tab();
		expect(session.items[0].x).toBe(200);
	});

	it('버튼으로 회전하고 삭제합니다', async () => {
		const session = empty();
		session.addItem('desk-140');
		render(ItemForm, { session, item: session.items[0] });
		await userEvent.click(screen.getByRole('button', { name: /오른쪽 15/ }));
		expect(session.items[0].rotation).toBe(15);
		await userEvent.click(screen.getByRole('button', { name: /삭제/ }));
		expect(session.items).toHaveLength(0);
	});
});

describe('RoomForm', () => {
	it('방 크기를 바꾸고 창문을 추가합니다', async () => {
		const session = empty();
		render(RoomForm, { session });
		const width = screen.getByLabelText('가로');
		await userEvent.clear(width);
		await userEvent.type(width, '500');
		await userEvent.tab();
		expect(session.room.width).toBe(500);
		await userEvent.click(screen.getByRole('button', { name: '창문' }));
		expect(session.room.openings.map((opening) => opening.kind)).toEqual(['door', 'window']);
	});

	it('문을 이름으로 구분해 삭제합니다', async () => {
		const session = empty();
		render(RoomForm, { session });
		await userEvent.click(screen.getByRole('button', { name: '문 1 삭제' }));
		expect(session.room.openings).toHaveLength(0);
	});
});

describe('RoomForm 모서리', () => {
	it('모서리를 잘라내고 되돌립니다', async () => {
		const session = empty();
		render(RoomForm, { session });
		await userEvent.click(screen.getByRole('button', { name: '모서리 잘라내기' }));
		expect(session.room.cutouts).toHaveLength(1);
		await userEvent.click(screen.getByRole('button', { name: '오른쪽 위 모서리 되돌리기' }));
		expect(session.room.cutouts).toHaveLength(0);
	});
});

describe('UnderlayForm', () => {
	it('지원하지 않는 파일은 이유를 알립니다', () => {
		expect(validateImageFile({ type: 'image/svg+xml', size: 10 })).toContain('JPG');
		expect(validateImageFile({ type: 'image/png', size: 16 * 1024 * 1024 })).toContain('15MB');
		expect(validateImageFile({ type: 'image/png', size: 10 })).toBeNull();
	});

	it('숫자로 축척을 맞춥니다', async () => {
		const session = empty();
		session.setUnderlay({ src: 'data:image/jpeg;base64,AAAA', pixelWidth: 100, pixelHeight: 100 });
		render(UnderlayForm, { session });
		const width = screen.getByLabelText('이미지 실제 가로');
		await userEvent.clear(width);
		await userEvent.type(width, '500');
		await userEvent.tab();
		expect(session.underlay?.cmPerPixel).toBe(5);
	});
});

describe('ReviewPanel', () => {
	it('색 없이도 상태를 글자로 읽을 수 있습니다', () => {
		render(ReviewPanel, { session: sample() });
		expect(screen.getByText('주의')).toBeInTheDocument();
		expect(screen.getAllByText('통과').length).toBeGreaterThan(0);
	});

	it('항목을 누르면 해당 물건을 선택합니다', async () => {
		const session = sample();
		render(ReviewPanel, { session });
		await userEvent.click(screen.getByRole('button', { name: /서브우퍼 케이블/ }));
		expect(session.selected?.entry.kind).toBe('subwoofer');
	});
});

describe('ItemList', () => {
	it('겹쳐 놓은 물건도 목록에서 고릅니다', async () => {
		const session = sample();
		render(ItemList, { session });
		await userEvent.click(screen.getByRole('button', { name: /^TV 55인치/ }));
		expect(session.selected?.entry.kind).toBe('tv');
	});
});

describe('EditorToolbar', () => {
	it('되돌릴 것이 없으면 비활성입니다', async () => {
		const session = empty();
		render(EditorToolbar, { session, saveStatus: 'saved' });
		const undo = screen.getByRole('button', { name: '되돌리기' });
		expect(undo).toBeDisabled();
		session.addItem('chair');
		await waitFor(() => expect(undo).toBeEnabled());
	});

	it('저장 실패를 알립니다', () => {
		render(EditorToolbar, { session: empty(), saveStatus: 'error' });
		expect(screen.getByRole('status')).toHaveTextContent('저장 실패');
	});
});

describe('FloorPlan', () => {
	it('X축과 Y축 룰러를 함께 그립니다', () => {
		render(FloorPlan, { session: sample() });
		expect(screen.getByTestId('ruler-x')).toBeInTheDocument();
		expect(screen.getByTestId('ruler-y')).toBeInTheDocument();
	});

	it('방향키로 옮기고 Shift로 1cm씩 옮깁니다', async () => {
		const session = empty();
		session.addItem('desk-140');
		render(FloorPlan, { session });
		const item = session.items[0];
		item.x = 200;
		const element = screen.getByRole('button', { name: /책상 140/ });
		await fireEvent.keyDown(element, { key: 'ArrowRight' });
		expect(item.x).toBe(210);
		await fireEvent.keyDown(element, { key: 'ArrowLeft', shiftKey: true });
		expect(item.x).toBe(209);
	});

	it('브라우저 단축키는 가로채지 않습니다', async () => {
		const session = empty();
		session.addItem('desk-140');
		render(FloorPlan, { session });
		const element = screen.getByRole('button', { name: /책상 140/ });
		await fireEvent.keyDown(element, { key: 'r', ctrlKey: true });
		expect(session.items[0].rotation).toBe(0);
	});

	it('두 손가락으로 확대하고 물건 끌기는 취소합니다', async () => {
		const session = empty();
		session.addItem('desk-140');
		const { container } = render(FloorPlan, { session });
		const svg = container.querySelector('.canvas svg') as SVGSVGElement;
		svg.setPointerCapture = vi.fn();
		const item = screen.getByRole('button', { name: /책상 140/ });
		const start = session.items[0].x;
		const touch = (id: number, clientX: number) => ({
			pointerId: id,
			pointerType: 'touch',
			clientX,
			clientY: 100,
			button: 0
		});
		await fireEvent.pointerDown(item, touch(1, 100));
		await fireEvent.pointerMove(svg, touch(1, 180));
		expect(session.items[0].x).not.toBe(start);
		await fireEvent.pointerDown(svg, touch(2, 200));
		expect(session.items[0].x).toBe(start);
		const before = session.viewport.scale;
		await fireEvent.pointerMove(svg, touch(2, 400));
		expect(session.viewport.scale).toBeGreaterThan(before);
		await fireEvent.pointerUp(svg, touch(1, 180));
		await fireEvent.pointerUp(svg, touch(2, 400));
		expect(session.canUndo).toBe(true);
	});

	it('화면 이동 버튼으로 끌기 없이 움직입니다', async () => {
		const session = empty();
		render(FloorPlan, { session });
		const before = session.viewport.offsetX;
		await userEvent.click(screen.getByRole('button', { name: '화면을 왼쪽으로 이동' }));
		expect(session.viewport.offsetX).toBe(before + 80);
	});
});
