import type { Meta } from '@storybook/sveltekit';
import SharedPage from './SharedPage.svelte';

const meta = {
	title: 'pages/shared/SharedPage',
	component: SharedPage,
	parameters: { layout: 'fullscreen' }
} satisfies Meta<typeof SharedPage>;

export default meta;

/** 주소에 공유 정보가 없을 때의 안내입니다. */
export const InvalidLink = {};
