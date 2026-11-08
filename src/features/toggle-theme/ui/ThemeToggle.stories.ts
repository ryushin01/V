import type { Meta } from '@storybook/sveltekit';
import ThemeToggle from './ThemeToggle.svelte';

const meta = {
	title: 'features/ThemeToggle',
	component: ThemeToggle
} satisfies Meta<typeof ThemeToggle>;

export default meta;

export const Default = {};
