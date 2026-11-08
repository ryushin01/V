import type { Meta } from '@storybook/sveltekit';
import { createSamplePlan } from '../model/factory';
import PlanPreview from './PlanPreview.svelte';

const meta = {
	title: 'entities/plan/XrayOverlay',
	component: PlanPreview
} satisfies Meta<typeof PlanPreview>;

export default meta;

export const Sample = { args: { plan: createSamplePlan(), label: '예시 배치도', xray: true } };
