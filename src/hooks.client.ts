import type { HandleClientError } from '@sveltejs/kit/hooks';

import { initMonitoring, reportError } from './app/monitoring';

initMonitoring();

/** SvelteKit이 잡아 오류 화면(+error.svelte)으로 바꾼 오류는 전역으로 올라가지 않으므로 직접 보냅니다. */
export const handleError: HandleClientError = ({ error }) => {
	console.error(error);
	reportError(error);
};
