import { render, screen } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';
import { createSamplePlan } from '../model/factory';
import PlanPreview from './PlanPreview.svelte';

describe('PlanPreview', () => {
	it('대체 텍스트를 가진 그림으로 그립니다', () => {
		render(PlanPreview, { plan: createSamplePlan(), label: '예시 평면도' });
		expect(screen.getByRole('img', { name: '예시 평면도' })).toBeTruthy();
	});

	it('설명이 없으면 보조기술에서 숨깁니다', () => {
		const { container } = render(PlanPreview, { plan: createSamplePlan() });
		expect(container.querySelector('svg')?.getAttribute('aria-hidden')).toBe('true');
		expect(screen.queryByRole('img')).toBeNull();
	});
});
