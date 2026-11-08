import type { Meta, StoryObj } from '@storybook/sveltekit';
import { fn } from 'storybook/test';
import NumberField from './NumberField.svelte';

const meta = {
	title: 'shared/NumberField',
	component: NumberField,
	args: { label: '방 가로', value: 400, min: 150, max: 1500, unit: 'cm', oncommit: fn() }
} satisfies Meta<typeof NumberField>;

export default meta;

export const Default: StoryObj<typeof meta> = {};
