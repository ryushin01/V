import type { Meta, StoryObj } from '@storybook/sveltekit';
import Ruler from './Ruler.svelte';

const meta = {
	title: 'shared/Ruler',
	component: Ruler,
	args: { length: 720, scale: 1.6, offset: 40 }
} satisfies Meta<typeof Ruler>;

export default meta;
type Story = StoryObj<typeof meta>;

export const XAxis: Story = { args: { axis: 'x', pointer: 120, range: { start: 40, end: 180 } } };
export const YAxis: Story = { args: { axis: 'y', length: 480, pointer: 80 } };
export const ZoomedIn: Story = { args: { axis: 'x', scale: 6 } };
