import type { Meta } from '@storybook/sveltekit';
import { createSamplePlan } from '#entities/plan';
import { EditorSession } from '../model/session.svelte';
import ReviewPanel from './ReviewPanel.svelte';

const meta = {
	title: 'pages/editor/ReviewPanel',
	component: ReviewPanel,
	argTypes: { session: { control: false } }
} satisfies Meta<typeof ReviewPanel>;

export default meta;

export const Sample = { args: { session: new EditorSession(createSamplePlan()) } };
