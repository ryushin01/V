import type { Meta } from '@storybook/sveltekit';
import { ScrollTracker } from '../model/scroll.svelte';
import PageScale from './PageScale.svelte';

const meta = {
	title: 'pages/home/PageScale',
	component: PageScale,
	parameters: { layout: 'fullscreen' },
	argTypes: { tracker: { control: false } }
} satisfies Meta<typeof PageScale>;

export default meta;

export const Default = { args: { tracker: new ScrollTracker() } };
