import type { Meta } from '@storybook/sveltekit';
import ErrorPage from './ErrorPage.svelte';

const meta = {
	title: 'pages/error/ErrorPage',
	component: ErrorPage,
	parameters: { layout: 'fullscreen' }
} satisfies Meta<typeof ErrorPage>;

export default meta;

export const NotFound = { args: { status: 404 } };
export const ServerError = { args: { status: 500 } };
