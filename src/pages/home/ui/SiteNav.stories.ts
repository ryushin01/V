import type { Meta } from '@storybook/sveltekit';
import { ScrollTracker } from '../model/scroll.svelte';
import SiteNav from './SiteNav.svelte';

const meta = {
	title: 'pages/home/SiteNav',
	component: SiteNav,
	parameters: { layout: 'fullscreen' },
	argTypes: { tracker: { control: false } }
} satisfies Meta<typeof SiteNav>;

export default meta;

export const Default = { args: { tracker: new ScrollTracker() } };
