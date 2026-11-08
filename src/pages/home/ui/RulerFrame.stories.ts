import type { Meta } from '@storybook/sveltekit';
import RulerFrame from './RulerFrame.svelte';

const meta = {
	title: 'pages/home/RulerFrame',
	component: RulerFrame,
	parameters: { layout: 'fullscreen' }
} satisfies Meta<typeof RulerFrame>;

export default meta;

export const Default = {};
