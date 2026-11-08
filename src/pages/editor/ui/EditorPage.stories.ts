import type { Meta } from '@storybook/sveltekit';
import EditorPage from './EditorPage.svelte';

const meta = {
	title: 'pages/editor/EditorPage',
	component: EditorPage,
	parameters: { layout: 'fullscreen' }
} satisfies Meta<typeof EditorPage>;

export default meta;

/** 없는 id를 열면 목록으로 돌아가는 안내를 보여 줍니다. */
export const Missing = { args: { id: 'missing-plan' } };
