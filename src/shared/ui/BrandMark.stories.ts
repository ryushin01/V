import type { Meta, StoryObj } from '@storybook/sveltekit';
import BrandMark from './BrandMark.svelte';

const meta = {
	title: 'shared/BrandMark',
	component: BrandMark,
	args: { size: 32 }
} satisfies Meta<typeof BrandMark>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Large: Story = { args: { size: 96 } };
