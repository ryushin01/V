// 제목: Roboto Condensed(영문)·해바라기(한글), 본문: Gothic A1, 치수: IBM Plex Mono(영문·숫자)·나눔고딕코딩(한글)
import '@fontsource-variable/roboto-condensed/wght.css';
import '@fontsource/sunflower/500.css';
import '@fontsource/sunflower/700.css';
import '@fontsource/gothic-a1/400.css';
import '@fontsource/gothic-a1/700.css';
import '@fontsource/ibm-plex-mono/400.css';
import '@fontsource/nanum-gothic-coding/400.css';
import '../src/app/styles/global.css';
import type { Preview } from '@storybook/sveltekit';

const preview: Preview = {
	parameters: { a11y: { test: 'error' } }
};

export default preview;
