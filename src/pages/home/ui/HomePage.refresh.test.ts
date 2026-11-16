import { render, screen, waitFor } from '@testing-library/svelte';
import { describe, expect, it, vi } from 'vitest';
import { createEmptyPlan, type PlanData } from '#entities/plan';
import HomePage from './HomePage.svelte';

/** 목록 읽기를 직접 끝내는 가짜 저장소입니다. 다른 탭 알림은 직접 보냅니다. */
const reads = vi.hoisted(() => [] as ((plans: PlanData[]) => void)[]);
const notify = vi.hoisted(() => ({ current: (() => {}) as (change: unknown) => void }));
vi.mock('#entities/plan', async (original) => ({
	...(await original<typeof import('#entities/plan')>()),
	listPlans: () => new Promise<PlanData[]>((resolve) => reads.push(resolve)),
	listCustomProducts: () => Promise.resolve([]),
	onPlanChange: (listener: (change: unknown) => void) => {
		notify.current = listener;
		return () => {};
	}
}));
vi.mock('$app/navigation', () => ({ goto: vi.fn() }));

describe('HomePage 목록 다시 읽기', () => {
	it('겹친 읽기에서 늦게 끝난 옛 결과가 새 결과를 덮지 않습니다', async () => {
		vi.stubGlobal('matchMedia', () => ({ matches: false }));
		render(HomePage);
		await waitFor(() => expect(reads).toHaveLength(1));
		// 다른 탭에서 배치도를 저장해 다시 읽기가 시작됩니다(0.3초 뒤).
		notify.current({ type: 'saved', id: 'other', updatedAt: 1 });
		await waitFor(() => expect(reads).toHaveLength(2), { timeout: 2000 });
		const older = createEmptyPlan('옛 목록');
		const newer = createEmptyPlan('새 목록');
		reads[1]([newer]);
		await screen.findByRole('link', { name: /새 목록/ });
		reads[0]([older]);
		await new Promise((resolve) => setTimeout(resolve, 20));
		expect(screen.queryByRole('link', { name: /옛 목록/ })).toBeNull();
		expect(screen.getByRole('link', { name: /새 목록/ })).toBeInTheDocument();
	});
});
