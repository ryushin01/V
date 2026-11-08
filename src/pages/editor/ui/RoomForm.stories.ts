import type { Meta } from '@storybook/sveltekit';
import { createSamplePlan } from '#entities/plan';
import { EditorSession } from '../model/session.svelte';
import RoomForm from './RoomForm.svelte';

const meta = {
	title: 'pages/editor/RoomForm',
	component: RoomForm,
	argTypes: { session: { control: false } }
} satisfies Meta<typeof RoomForm>;

export default meta;

export const Sample = { args: { session: new EditorSession(createSamplePlan()) } };
