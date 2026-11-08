import type { Meta } from '@storybook/sveltekit';
import { fn } from 'storybook/test';
import { createSamplePlan } from '#entities/plan';
import { EditorSession } from '../model/session.svelte';
import PlanItemFrame from './PlanItemFrame.svelte';

const meta = {
	title: 'pages/editor/PlanItem',
	component: PlanItemFrame,
	args: { onpointerdown: fn(), onrotatestart: fn(), onkeydown: fn(), onfocus: fn(), scale: 2 },
	argTypes: { item: { control: false } }
} satisfies Meta<typeof PlanItemFrame>;

export default meta;

const item = new EditorSession(createSamplePlan()).items[0];

export const Default = { args: { item, selected: false, warned: false } };
export const Selected = { args: { item, selected: true, warned: false } };
export const Warned = { args: { item, selected: false, warned: true } };
