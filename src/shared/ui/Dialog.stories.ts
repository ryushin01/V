import type { Meta } from '@storybook/sveltekit';
import { createRawSnippet } from 'svelte';
import Dialog from './Dialog.svelte';

const meta = { title: 'shared/Dialog', component: Dialog } satisfies Meta<typeof Dialog>;

export default meta;

export const Open = {
	args: {
		open: true,
		title: '배치도를 지울까요?',
		children: createRawSnippet(() => ({ render: () => '<p>지우면 되돌릴 수 없습니다.</p>' }))
	}
};
