import type { Meta, StoryObj } from '@storybook/sveltekit';
import LiveMessage from './LiveMessage.svelte';

const meta = {
	title: 'shared/LiveMessage',
	component: LiveMessage,
	args: { message: 'JSON 형식이 아닙니다. V에서 내보낸 파일을 골라 주세요.' }
} satisfies Meta<typeof LiveMessage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Error: Story = {};
export const Small: Story = { args: { size: '0.8125rem' } };
export const Note: Story = {
	args: {
		role: 'status',
		message: '도면에서 길이를 아는 첫 번째 점을 눌러 주세요. Esc로 취소합니다.'
	}
};
export const Empty: Story = { args: { message: '' } };
