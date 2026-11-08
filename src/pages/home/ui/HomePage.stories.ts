import type { Meta } from '@storybook/sveltekit';
import HomePage from './HomePage.svelte';

const meta = {
	title: 'pages/home/HomePage',
	component: HomePage,
	parameters: { layout: 'fullscreen' }
} satisfies Meta<typeof HomePage>;

export default meta;

export const Default = {};
