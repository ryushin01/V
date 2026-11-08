import type { Meta } from '@storybook/sveltekit';
import { createSamplePlan } from '#entities/plan';
import { EditorSession } from '../model/session.svelte';
import UnderlayForm from './UnderlayForm.svelte';

const meta = {
	title: 'pages/editor/UnderlayForm',
	component: UnderlayForm,
	argTypes: { session: { control: false } }
} satisfies Meta<typeof UnderlayForm>;

export default meta;

export const Empty = { args: { session: new EditorSession(createSamplePlan()) } };
