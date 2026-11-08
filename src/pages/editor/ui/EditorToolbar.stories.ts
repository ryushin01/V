import type { Meta } from '@storybook/sveltekit';
import { createSamplePlan } from '#entities/plan';
import { EditorSession } from '../model/session.svelte';
import EditorToolbar from './EditorToolbar.svelte';

const meta = {
	title: 'pages/editor/EditorToolbar',
	component: EditorToolbar,
	argTypes: { session: { control: false } }
} satisfies Meta<typeof EditorToolbar>;

export default meta;

const session = new EditorSession(createSamplePlan());

export const Saved = { args: { session, saveStatus: 'saved' } };
export const SaveFailed = { args: { session, saveStatus: 'error' } };
