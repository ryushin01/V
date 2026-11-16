import type { Meta, StoryObj } from '@storybook/sveltekit';
import PageMeta from './PageMeta.svelte';

/** 화면에는 그리지 않고 문서 머리(head)에 제목과 공유 미리보기 정보를 넣습니다. 개발자 도구의 head에서 확인합니다. */
const meta = {
	title: 'shared/PageMeta',
	component: PageMeta,
	args: { title: 'V | 데스크·게이밍 셋업 배치도', path: '/' }
} satisfies Meta<typeof PageMeta>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Home: Story = {};
export const NoIndex: Story = { args: { title: '배치도 편집 | V', noindex: true } };
