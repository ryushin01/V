import type { Meta } from '@storybook/sveltekit';
import { createSamplePlan } from '#entities/plan';
import { EditorSession } from '../model/session.svelte';
import ItemList from './ItemList.svelte';

const meta = {
	title: 'pages/editor/ItemList',
	component: ItemList,
	argTypes: { session: { control: false } }
} satisfies Meta<typeof ItemList>;

export default meta;

export const Sample = { args: { session: new EditorSession(createSamplePlan()) } };
