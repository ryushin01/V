import { render, screen, waitFor } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createCustomEntry, type CatalogEntry, type PlanData } from '#entities/plan';
import HomePage from './HomePage.svelte';

/** 저장소 읽기 결과를 시험마다 정하는 가짜 저장소입니다. */
const store = vi.hoisted(() => ({
	plans: [] as PlanData[],
	products: (): Promise<CatalogEntry[]> => Promise.resolve([])
}));
const download = vi.hoisted(() => vi.fn());
vi.mock('#entities/plan', async (original) => ({
	...(await original<typeof import('#entities/plan')>()),
	listPlans: () => Promise.resolve(store.plans),
	listCustomProducts: () => store.products(),
	onPlanChange: () => () => {}
}));
vi.mock('#shared/lib/file', async (original) => ({
	...(await original<typeof import('#shared/lib/file')>()),
	downloadText: download
}));
vi.mock('$app/navigation', () => ({ goto: vi.fn() }));

const speaker = createCustomEntry({
	name: '남은 스피커',
	brand: '',
	kind: 'speaker',
	width: 20,
	depth: 20,
	watts: 30,
	cable: 150,
	glyph: ''
});

describe('HomePage 전체 백업', () => {
	beforeEach(() => {
		download.mockClear();
		vi.stubGlobal('matchMedia', () => ({ matches: false }));
	});

	it('배치도가 없어도 내 제품이 있으면 전체 백업을 둡니다', async () => {
		store.plans = [];
		store.products = () => Promise.resolve([speaker]);
		render(HomePage);
		await userEvent.click(await screen.findByRole('button', { name: /전체 백업/ }));
		expect(download).toHaveBeenCalledTimes(1);
		expect(JSON.parse(download.mock.calls[0][1]).products).toHaveLength(1);
		expect(
			await screen.findByText('배치도 0개와 내 제품 1개를 백업 파일로 내려받았습니다.')
		).toHaveAttribute('role', 'status');
	});

	it('내 제품을 읽지 못하면 빠진 백업을 내려받지 않고 알립니다', async () => {
		store.plans = [];
		store.products = () => Promise.resolve([speaker]);
		render(HomePage);
		const button = await screen.findByRole('button', { name: /전체 백업/ });
		store.products = () => Promise.reject(new Error('막힘'));
		await userEvent.click(button);
		await waitFor(() =>
			expect(screen.getByText(/백업하지 않았습니다/)).toHaveAttribute('role', 'alert')
		);
		expect(download).not.toHaveBeenCalled();
	});
});
