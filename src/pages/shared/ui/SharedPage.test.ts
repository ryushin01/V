import 'fake-indexeddb/auto';
import { render, screen, waitFor } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createSamplePlan, encodePlan, listPlans } from '#entities/plan';
import SharedPage from './SharedPage.svelte';

const goto = vi.hoisted(() => vi.fn(() => Promise.resolve()));
vi.mock('$app/navigation', () => ({ goto }));

describe('SharedPage', () => {
	beforeEach(() => {
		goto.mockClear();
		location.hash = '';
	});

	it('잘못된 링크는 이유를 알립니다', async () => {
		location.hash = '#broken';
		render(SharedPage);
		expect(await screen.findByRole('alert')).toHaveTextContent('V 공유 링크가 아닙니다');
	});

	it('더블 클릭해도 한 번만 복사합니다', async () => {
		const before = (await listPlans()).length;
		const plan = createSamplePlan();
		location.hash = `#${await encodePlan(plan)}`;
		render(SharedPage);
		expect(await screen.findByRole('heading', { level: 1, name: plan.name })).toBeInTheDocument();
		await userEvent.dblClick(screen.getByRole('button', { name: /내 배치도로 복사/ }));
		await waitFor(() => expect(goto).toHaveBeenCalledOnce());
		expect(await listPlans()).toHaveLength(before + 1);
	});
});
