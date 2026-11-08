import 'fake-indexeddb/auto';
import { render, screen, waitFor } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { deletePlan, listPlans, savePlan, createEmptyPlan } from '#entities/plan';
import HomePage from './HomePage.svelte';
import RulerFrame from './RulerFrame.svelte';

const goto = vi.hoisted(() => vi.fn(() => Promise.resolve()));
vi.mock('$app/navigation', () => ({ goto }));

describe('HomePage', () => {
	beforeEach(async () => {
		goto.mockClear();
		for (const plan of await listPlans()) await deletePlan(plan.id);
		HTMLDialogElement.prototype.showModal = function () {
			this.setAttribute('open', '');
		};
		HTMLDialogElement.prototype.close = function () {
			this.removeAttribute('open');
		};
		vi.stubGlobal('matchMedia', () => ({ matches: false }));
	});

	it('더블 클릭해도 배치도를 하나만 만듭니다', async () => {
		render(HomePage);
		await userEvent.dblClick(screen.getByRole('button', { name: /새 배치도 만들기/ }));
		await waitFor(() => expect(goto).toHaveBeenCalledOnce());
		expect(await listPlans()).toHaveLength(1);
	});

	it('확인을 거쳐 삭제합니다', async () => {
		await savePlan(createEmptyPlan('지울 배치도'));
		render(HomePage);
		await userEvent.click(await screen.findByRole('button', { name: '지울 배치도 삭제' }));
		expect(await listPlans()).toHaveLength(1);
		await userEvent.click(screen.getByRole('button', { name: '삭제' }));
		await waitFor(async () => expect(await listPlans()).toHaveLength(0));
	});

	it('잘못된 파일은 이유를 알립니다', async () => {
		const { container } = render(HomePage);
		const input = container.querySelector('input[type="file"]') as HTMLInputElement;
		await userEvent.upload(input, new File(['not json'], 'a.json', { type: 'application/json' }));
		expect(await screen.findByRole('alert')).toHaveTextContent('JSON 형식이 아닙니다');
		expect(goto).not.toHaveBeenCalled();
	});
});

describe('RulerFrame', () => {
	it('X축과 Y축 룰러를 고정합니다', () => {
		render(RulerFrame);
		expect(screen.getByTestId('ruler-x')).toBeInTheDocument();
		expect(screen.getByTestId('ruler-y')).toBeInTheDocument();
	});
});
