// 제목: Roboto Condensed(영문)·해바라기(한글), 본문: 운영체제 고딕, 치수: IBM Plex Mono(영문·숫자)
import '@fontsource/barlow-condensed/400.css';
import '@fontsource/barlow-condensed/500.css';
import '@fontsource/barlow-condensed/600.css';
import '@fontsource/barlow-condensed/700.css';
import '../src/app/styles/fonts/sunflower.css';
import '../static/fonts/sunflower-rest.css';
import '@fontsource/ibm-plex-mono/400.css';
import '../src/app/styles/global.css';
import type { Preview } from '@storybook/sveltekit';

const preview: Preview = {
	parameters: { a11y: { test: 'error' } }
};

export default preview;
