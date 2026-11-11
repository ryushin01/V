import type { Meta } from '@storybook/sveltekit';
import { fn } from 'storybook/test';
import CustomProductDialog from './CustomProductDialog.svelte';

const meta = {
	title: 'pages/editor/CustomProductDialog',
	component: CustomProductDialog,
	args: { open: true, editing: null, onsaved: fn(), ondeleted: fn() }
} satisfies Meta<typeof CustomProductDialog>;

export default meta;

export const Register = {};
