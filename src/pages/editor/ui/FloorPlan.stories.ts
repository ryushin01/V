import type { Meta } from '@storybook/sveltekit';
import { createSamplePlan } from '#entities/plan';
import { EditorSession } from '../model/session.svelte';
import FloorPlanFrame from './FloorPlanFrame.svelte';

const meta = {
	title: 'pages/editor/FloorPlan',
	component: FloorPlanFrame,
	argTypes: { session: { control: false } },
	parameters: { layout: 'fullscreen' }
} satisfies Meta<typeof FloorPlanFrame>;

export default meta;

export const Sample = { args: { session: new EditorSession(createSamplePlan()) } };
