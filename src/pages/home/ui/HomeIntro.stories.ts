import type { Meta, StoryObj } from '@storybook/sveltekit';
import HomeIntro from './HomeIntro.svelte';

/**
 * 실제로는 `src/app.html`이 첫 페인트 전에 `<html data-intro="play">`를 붙였을 때만 재생합니다.
 * 스토리에서는 미리 붙여 두고, 다시 보려면 스토리를 다시 불러옵니다(동작 줄이기를 켜면 보이지 않음).
 */
const meta = {
	title: 'pages/home/HomeIntro',
	component: HomeIntro,
	parameters: { layout: 'fullscreen' },
	beforeEach: () => {
		document.documentElement.dataset.intro = 'play';
		return () => {
			delete document.documentElement.dataset.intro;
		};
	}
} satisfies Meta<typeof HomeIntro>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
