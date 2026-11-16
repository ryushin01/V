import adapter from '@sveltejs/adapter-static';
import { sveltekit } from '@sveltejs/kit/vite';
import { svelteTesting } from '@testing-library/svelte/vite';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { loadEnv } from 'vite';
import { defineConfig } from 'vitest/config';

/**
 * app.html의 인라인 테마 스크립트 해시입니다. 스크립트를 고쳐도 빌드할 때 다시 계산해 CSP가 맞습니다.
 * SvelteKit이 만드는 인라인 스크립트(시작 코드, 서비스 워커 등록)의 해시는 SvelteKit이 직접 더합니다.
 */
function themeScriptHash(): `sha256-${string}` {
	const script = readFileSync('src/app.html', 'utf8').match(/<script>([\s\S]*?)<\/script>/)?.[1];
	if (!script) throw new Error('src/app.html에서 테마 스크립트를 찾지 못했습니다.');
	return `sha256-${createHash('sha256').update(script).digest('base64')}`;
}

/** Sentry DSN이 있으면 오류를 보낼 주소(예: https://o1.ingest.us.sentry.io)만 연결을 허용합니다. */
function sentryOrigin(dsn: string | undefined): `https://${string}.${string}`[] {
	if (!dsn) return [];
	try {
		const { origin, protocol } = new URL(dsn);
		return protocol === 'https:' ? [origin as `https://${string}.${string}`] : [];
	} catch {
		return [];
	}
}

export default defineConfig(({ mode }) => {
	const env = loadEnv(mode, process.cwd(), 'VITE_');
	return {
		plugins: [
			sveltekit({
				compilerOptions: {
					runes: ({ filename }) =>
						filename.split(/[/\\]/).includes('node_modules') ? undefined : true
				},
				adapter: adapter({ fallback: 'spa.html' }),
				// 미리 그린 페이지와 대체 페이지(spa.html)마다 <meta>로 들어갑니다. frame-ancestors처럼
				// <meta>에서 쓸 수 없는 것은 vercel.json의 응답 헤더로 보냅니다.
				csp: {
					mode: 'hash',
					directives: {
						'default-src': ['self'],
						'script-src': ['self', themeScriptHash()],
						// Svelte가 그리는 style 속성(style:--i 등)이 있어 인라인 스타일은 허용합니다.
						'style-src': ['self', 'unsafe-inline'],
						// 평면도 이미지는 data: 주소로 저장하고, 그림 저장은 blob:을 씁니다.
						'img-src': ['self', 'data:', 'blob:'],
						'font-src': ['self'],
						'connect-src': ['self', ...sentryOrigin(env.VITE_SENTRY_DSN)],
						'worker-src': ['self'],
						'manifest-src': ['self'],
						'object-src': ['none'],
						'base-uri': ['self'],
						'form-action': ['self']
					}
				}
			}),
			svelteTesting()
		],
		build: {
			// 글꼴은 글자 묶음별 조각이라 필요한 것만 받아야 합니다. 작은 조각을 data: 주소로 CSS에 넣으면
			// 모든 조각(한글 글꼴 포함 269개)을 첫 화면에서 한꺼번에 받게 되므로 항상 파일로 내보냅니다.
			assetsInlineLimit: (file: string) => (/\.(woff2?|ttf|otf)$/.test(file) ? false : undefined)
		},
		test: {
			environment: 'jsdom',
			include: ['src/**/*.test.ts'],
			setupFiles: ['./vitest.setup.ts']
		}
	};
});
