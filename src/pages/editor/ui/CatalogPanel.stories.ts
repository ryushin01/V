import type { Meta } from '@storybook/sveltekit';
import { createSamplePlan } from '#entities/plan';
import { EditorSession } from '../model/session.svelte';
import CatalogPanel from './CatalogPanel.svelte';

const meta = {
	title: 'pages/editor/CatalogPanel',
	component: CatalogPanel,
	argTypes: { session: { control: false } }
} satisfies Meta<typeof CatalogPanel>;

export default meta;

export const Sample = { args: { session: new EditorSession(createSamplePlan()) } };
