import 'fake-indexeddb/auto';
import { fireEvent, render, screen, waitFor } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
	createEmptyPlan,
	createSamplePlan,
	deletePlan,
	listPlans,
	savePlan,
	stringifyBackup
} from '#entities/plan';
import HomePage from './HomePage.svelte';
import BuildStage from './BuildStage.svelte';
import HeroRulers from './HeroRulers.svelte';
import PageScale from './PageScale.svelte';
import { ScrollTracker } from '../model/scroll.svelte';

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
		// 오류 영역은 처음부터 있고 문구만 들어옵니다.
		expect(await screen.findByText(/JSON 형식이 아닙니다/)).toHaveAttribute('role', 'alert');
		expect(goto).not.toHaveBeenCalled();
	});

	it('복제하면 "사본"을 새로 만들고 결과를 알립니다', async () => {
		await savePlan(createEmptyPlan('거실'));
		render(HomePage);
		await userEvent.click(await screen.findByRole('button', { name: '거실 복제' }));
		expect(await screen.findByText('‘거실 사본’을 만들었습니다.')).toHaveAttribute(
			'role',
			'status'
		);
		expect((await listPlans()).map((plan) => plan.name).sort()).toEqual(['거실', '거실 사본']);
		expect(goto).not.toHaveBeenCalled();
	});

	it('백업 파일을 고르면 배치도를 모두 가져와 목록에 두고 결과를 알립니다', async () => {
		const backup = stringifyBackup([createEmptyPlan('백업 1'), createSamplePlan()], []);
		const { container } = render(HomePage);
		const input = container.querySelector('input[type="file"]') as HTMLInputElement;
		await userEvent.upload(
			input,
			new File([backup], 'v-backup.json', { type: 'application/json' })
		);
		expect(
			await screen.findByText('백업에서 배치도 2개와 내 제품 0개를 가져왔습니다.')
		).toHaveAttribute('role', 'status');
		expect(await screen.findByRole('link', { name: /백업 1/ })).toBeInTheDocument();
		expect(await listPlans()).toHaveLength(2);
		expect(goto).not.toHaveBeenCalled();
	});
});

describe('HeroRulers', () => {
	it('X축과 Y축 룰러를 함께 그립니다', () => {
		render(HeroRulers);
		expect(screen.getByTestId('ruler-x')).toBeInTheDocument();
		expect(screen.getByTestId('ruler-y')).toBeInTheDocument();
	});
});

describe('PageScale', () => {
	it('포인터를 누른 위치로 스크롤합니다', async () => {
		const tracker = new ScrollTracker();
		const scrollToProgress = vi.spyOn(tracker, 'scrollToProgress').mockImplementation(() => {});
		render(PageScale, { tracker });
		const scale = screen.getByTestId('page-scale');
		await fireEvent.pointerDown(scale, { clientY: 10, pointerId: 1 });
		expect(scrollToProgress).toHaveBeenCalledOnce();
		expect(scale.getAttribute('aria-hidden')).toBe('true');
	});

	it('있는 동안에만 기본 스크롤바를 숨깁니다', () => {
		const { unmount } = render(PageScale, { tracker: new ScrollTracker() });
		expect(document.documentElement.classList.contains('has-scale')).toBe(true);
		unmount();
		expect(document.documentElement.classList.contains('has-scale')).toBe(false);
	});
});

describe('BuildStage', () => {
	it('여덟 단계를 모두 보조기술에 제공합니다', () => {
		const { container } = render(BuildStage, {
			tracker: new ScrollTracker(),
			plan: createSamplePlan()
		});
		expect(container.querySelectorAll('ol > li')).toHaveLength(8);
		expect(container.querySelector('[aria-current="step"]')?.textContent).toContain('벽');
	});
});
