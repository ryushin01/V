import '@fontsource-variable/bricolage-grotesque/opsz.css';
import '@fontsource-variable/space-grotesk/wght.css';
import '@fontsource/ibm-plex-mono/400.css';
import '../src/app/styles/global.css';
import type { Preview } from '@storybook/sveltekit';

const preview: Preview = {
	parameters: { a11y: { test: 'error' } }
};

export default preview;
