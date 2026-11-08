import { fireEvent, render, screen } from '@testing-library/svelte';
import { describe, expect, it, vi } from 'vitest';
import { createEmptyPlan } from '#entities/plan';
import { EditorSession } from '../model/session.svelte';
import PlanItemFrame from './PlanItemFrame.svelte';

function setup(selected: boolean) {
	const session = new EditorSession(createEmptyPlan());
	session.addItem('outlet-2');
	const handlers = {
		onpointerdown: vi.fn(),
		onrotatestart: vi.fn(),
		onkeydown: vi.fn(),
		onfocus: vi.fn()
	};
	const view = render(PlanItemFrame, {
		item: session.items[0],
		scale: 1,
		selected,
		warned: true,
		...handlers
	});
	return { ...view, handlers, item: session.items[0] };
}

describe('PlanItem', () => {
	it('이름, 치수, 위치, 점검 상태를 접근 가능한 이름에 담습니다', () => {
		setup(false);
		const button = screen.getByRole('button');
		expect(button.getAttribute('aria-label')).toContain('벽 콘센트 2구, 가로 12, 세로 4');
		expect(button.getAttribute('aria-label')).toContain('점검 필요');
		expect(button.getAttribute('aria-pressed')).toBe('false');
	});

	it('작은 물건도 화면 기준 28px 이상의 대상 크기를 가집니다', () => {
		const { container } = setup(false);
		const hit = container.querySelector('.hit');
		expect(Number(hit?.getAttribute('width'))).toBeGreaterThanOrEqual(28);
		expect(Number(hit?.getAttribute('height'))).toBeGreaterThanOrEqual(28);
	});

	it('키 입력과 초점을 상위로 넘깁니다', async () => {
		const { handlers, item } = setup(false);
		const button = screen.getByRole('button');
		await fireEvent.keyDown(button, { key: 'r' });
		await fireEvent.focus(button);
		expect(handlers.onkeydown).toHaveBeenCalledOnce();
		expect(handlers.onfocus).toHaveBeenCalledWith(item);
	});

	it('벽에 붙는 물건에는 회전 손잡이를 그리지 않습니다', () => {
		const { container } = setup(true);
		expect(container.querySelector('.handle')).toBeNull();
		expect(container.querySelector('.crop')).not.toBeNull();
	});
});
