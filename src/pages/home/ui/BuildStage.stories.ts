import type { Meta } from '@storybook/sveltekit';
import { createSamplePlan } from '#entities/plan';
import { ScrollTracker } from '../model/scroll.svelte';
import BuildStage from './BuildStage.svelte';

const meta = {
	title: 'pages/home/BuildStage',
	component: BuildStage,
	parameters: { layout: 'fullscreen' },
	argTypes: { tracker: { control: false }, plan: { control: false } }
} satisfies Meta<typeof BuildStage>;

export default meta;

export const Default = { args: { tracker: new ScrollTracker(), plan: createSamplePlan() } };
