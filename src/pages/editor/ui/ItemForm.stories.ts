import type { Meta } from '@storybook/sveltekit';
import { createSamplePlan } from '#entities/plan';
import { EditorSession } from '../model/session.svelte';
import ItemForm from './ItemForm.svelte';

const meta = {
	title: 'pages/editor/ItemForm',
	component: ItemForm,
	argTypes: { session: { control: false }, item: { control: false } }
} satisfies Meta<typeof ItemForm>;

export default meta;

const session = new EditorSession(createSamplePlan());

export const Desk = { args: { session, item: session.items[0] } };
