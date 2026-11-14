import type { Meta, StoryObj } from '@storybook/sveltekit';
import { fn } from 'storybook/test';
import SelectExample from './SelectExample.svelte';

// 옵션을 snippet으로 넘기는 컴포넌트라 실제 사용처와 같은 예시 컴포넌트로 보여 줍니다.
const meta = {
	title: 'shared/Select',
	component: SelectExample,
	args: { value: 'east', onchange: fn() }
} satisfies Meta<typeof SelectExample>;

export default meta;

export const Default: StoryObj<typeof meta> = {};
