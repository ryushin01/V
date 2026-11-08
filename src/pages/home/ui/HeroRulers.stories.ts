import type { Meta } from '@storybook/sveltekit';
import HeroRulers from './HeroRulers.svelte';

const meta = {
	title: 'pages/home/HeroRulers',
	component: HeroRulers,
	parameters: { layout: 'fullscreen' }
} satisfies Meta<typeof HeroRulers>;

export default meta;

export const Default = {};
