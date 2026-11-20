// 앱과 같은 글꼴(src/routes/+layout.svelte). 스토리북에서는 나머지 글자 조각 목록도 바로 붙입니다.
import '@fontsource-variable/bodoni-moda/standard.css';
import '@fontsource/ibm-plex-mono/400.css';
import '@fontsource/ibm-plex-mono/500.css';
import '../src/app/styles/fonts/noto-serif-kr.css';
import '../src/app/styles/fonts/ibm-plex-sans-kr.css';
import '../src/app/styles/fonts/nanum-gothic-coding.css';
import '../static/fonts/noto-serif-kr-rest.css';
import '../static/fonts/ibm-plex-sans-kr-rest.css';
import '../static/fonts/nanum-gothic-coding-rest.css';
import '../src/app/styles/global.css';
import type { Preview } from '@storybook/sveltekit';

const preview: Preview = {
	parameters: { a11y: { test: 'error' } }
};

export default preview;
