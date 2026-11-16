import type { Meta } from '@storybook/sveltekit';
import { createSamplePlan } from '../model/factory';
import PlanPreview from './PlanPreview.svelte';

const meta = {
	title: 'entities/plan/PlanPreview',
	component: PlanPreview
} satisfies Meta<typeof PlanPreview>;

export default meta;

export const Sample = { args: { plan: createSamplePlan(), label: '예시 배치도' } };
/** 그림 저장(PNG)에 쓰는 모습: 물건 이름을 함께 그립니다. */
export const WithNames = { args: { plan: createSamplePlan(), label: '예시 배치도', names: true } };
