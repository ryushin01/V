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
		// 버튼 200여 개의 이름을 계산하므로 병렬 실행에서는 기본 5초를 넘길 수 있습니다.
	}, 20_000);
});

describe('CatalogPanel 검색', () => {
	it('검색어로 거르고 개수를 알립니다', async () => {
		const session = empty();
		render(CatalogPanel, { session });
		await userEvent.type(screen.getByLabelText('모델명이나 제조사로 찾기'), 'G9');
		const button = screen.getByRole('button', { name: /Odyssey OLED G9/ });
		expect(screen.getAllByRole('button', { name: /배치도에 추가/ })).toHaveLength(1);
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
		expect(watts).toHaveValue('390');
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

	it('저장 실패는 화면에 보이고 바로 알립니다', () => {
		render(EditorToolbar, { session: empty(), saveStatus: 'error' });
		expect(screen.getByText(/저장 실패/)).toBeVisible();
		expect(screen.getByText(/저장하지 못했습니다/)).toHaveAttribute('role', 'alert');
	});

	it('저장 중·저장됨은 화면에만 보이고 읽어 주지 않습니다', () => {
		render(EditorToolbar, { session: empty(), saveStatus: 'saving' });
		expect(screen.getByText('저장 중')).not.toHaveAttribute('role');
		expect(screen.getByRole('alert', { hidden: true }).textContent).toBe('');
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

	it('거리 재기: 두 점 사이를 5cm 격자로 재고, 물건은 잡지 않으며 Esc로 마칩니다', async () => {
		const session = empty();
		session.addItem('desk-140');
		const { container } = render(FloorPlan, { session });
		const svg = container.querySelector('.canvas svg') as SVGSVGElement;
		svg.setPointerCapture = vi.fn();
		const toggle = screen.getByRole('button', { name: '거리 재기' });
		await userEvent.click(toggle);
		expect(toggle).toHaveAttribute('aria-pressed', 'true');
		expect(session.announcement).toContain('두 점을 차례로 누르거나');

		// 기본 배율 1.6, 여백 0: 화면 (16, 16)은 (10, 10)cm, (176, 16)은 (110, 10)cm입니다.
		const start = { x: session.items[0].x, y: session.items[0].y };
		const press = (clientX: number, clientY: number, shiftKey = false) =>
			fireEvent.pointerDown(svg, {
				pointerId: 1,
				pointerType: 'mouse',
				isPrimary: true,
				button: 0,
				clientX,
				clientY,
				shiftKey
			});
		await press(16, 16);
		expect(session.announcement).toBe('두 번째 점을 찍어 주세요.');
		await press(177, 16);
		expect(session.announcement).toContain('두 점 사이 100cm');
		expect(screen.getByTestId('measure-line')).toHaveTextContent('100 cm');
		// 세 번째 점은 새로 재기 시작하고, Shift를 누르면 격자에 맞추지 않습니다.
		await press(16, 16);
		await press(177, 16, true);
		expect(session.announcement).toContain('두 점 사이 101cm');
		expect(session.items[0]).toMatchObject(start);
		expect(session.selectedId).toBe(session.items[0].id);

		await fireEvent.keyDown(window, { key: 'Escape' });
		expect(toggle).toHaveAttribute('aria-pressed', 'false');
		expect(screen.queryByTestId('measure-line')).toBeNull();
		expect(session.announcement).toBe('거리 재기를 마쳤습니다.');
	});

	it('거리 재기를 키보드로: 켜면 십자선 버튼으로 초점이 가고, 방향키로 옮겨 Enter로 찍습니다', async () => {
		const session = empty();
		render(FloorPlan, { session });
		const toggle = screen.getByRole('button', { name: '거리 재기' });
		toggle.focus();
		await userEvent.keyboard('{Enter}');
		const cursor = await screen.findByRole('button', { name: /두 점을 찍어 거리를 잽니다/ });
		await waitFor(() => expect(cursor).toHaveFocus());
		expect(cursor).toHaveAccessibleDescription(/방향키로 십자선을/);
		// 방 가운데(200, 160)에서 시작합니다.
		await userEvent.keyboard('{Enter}');
		expect(session.announcement).toBe('두 번째 점을 찍어 주세요.');
		await userEvent.keyboard('{ArrowRight}{ArrowRight}{ArrowRight}{ArrowRight}');
		expect(session.announcement).toBe('X 240, Y 160cm');
		await userEvent.keyboard('{Shift>}{ArrowLeft}{/Shift}{Enter}');
		expect(session.announcement).toContain('두 점 사이 39cm');
		await userEvent.keyboard('{Escape}');
		expect(toggle).toHaveFocus();
		expect(toggle).toHaveAttribute('aria-pressed', 'false');
	});

	it('마우스가 도면 위에 있어도 키보드로 재는 동안에는 키보드 십자선을 보여 줍니다', async () => {
		const session = empty();
		const { container } = render(FloorPlan, { session });
		const svg = container.querySelector('.canvas svg') as SVGSVGElement;
		const coords = () => container.querySelector('.canvas > .coords:not(.measure-hint)');
		// 기본 배율 1.6: 화면 (16, 16)은 (10, 10)cm입니다.
		await fireEvent.pointerMove(svg, { pointerType: 'mouse', clientX: 16, clientY: 16 });
		expect(coords()).toHaveTextContent('X 10 · Y 10');
		screen.getByRole('button', { name: '거리 재기' }).focus();
		await userEvent.keyboard('{Enter}');
		await waitFor(() => expect(coords()).toHaveTextContent('X 200 · Y 160'));
		await userEvent.keyboard('{ArrowRight}');
		expect(coords()).toHaveTextContent('X 210 · Y 160');
		await fireEvent.pointerMove(svg, { pointerType: 'mouse', clientX: 16, clientY: 16 });
		expect(coords()).toHaveTextContent('X 10 · Y 10');
	});

	it('거리를 재는 동안 두 번째 손가락은 화면을 옮기거나 선택을 풀지 않습니다', async () => {
		const session = empty();
		session.addItem('desk-140');
		const { container } = render(FloorPlan, { session });
		const svg = container.querySelector('.canvas svg') as SVGSVGElement;
		svg.setPointerCapture = vi.fn();
		await userEvent.click(screen.getByRole('button', { name: '거리 재기' }));
		const touch = (pointerId: number, isPrimary: boolean, clientX: number) => ({
			pointerId,
			pointerType: 'touch',
			isPrimary,
			button: 0,
			clientX,
			clientY: 40
		});
		const before = { x: session.viewport.offsetX, selected: session.selectedId };
		await fireEvent.pointerDown(svg, touch(1, true, 40));
		await fireEvent.pointerDown(svg, touch(2, false, 200));
		await fireEvent.pointerMove(svg, touch(2, false, 300));
		expect(session.viewport.offsetX).toBe(before.x);
		expect(session.selectedId).toBe(before.selected);
		expect(session.announcement).toBe('두 번째 점을 찍어 주세요.');
	});

	it('축척 맞추기를 시작하면 거리 재기를 끕니다', async () => {
		const session = empty();
		session.setUnderlay({ src: 'data:image/png;base64,AA==', pixelWidth: 100, pixelHeight: 80 });
		render(FloorPlan, { session });
		const toggle = screen.getByRole('button', { name: '거리 재기' });
		await userEvent.click(toggle);
		session.startCalibration();
		await waitFor(() => expect(toggle).toHaveAttribute('aria-pressed', 'false'));
	});

	it('화면 이동 버튼으로 끌기 없이 움직입니다', async () => {
		const session = empty();
		render(FloorPlan, { session });
		const before = session.viewport.offsetX;
		await userEvent.click(screen.getByRole('button', { name: '화면을 왼쪽으로 이동' }));
		expect(session.viewport.offsetX).toBe(before + 80);
	});
});
