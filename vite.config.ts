import adapter from '@sveltejs/adapter-static';
import { sveltekit } from '@sveltejs/kit/vite';
import { svelteTesting } from '@testing-library/svelte/vite';
import { defineConfig } from 'vitest/config';

export default defineConfig({
	plugins: [
		sveltekit({
			compilerOptions: {
				runes: ({ filename }) =>
					filename.split(/[/\\]/).includes('node_modules') ? undefined : true
			},
			adapter: adapter({ fallback: 'spa.html' })
		}),
		svelteTesting()
	],
	build: {
		// 글꼴은 글자 묶음별 조각이라 필요한 것만 받아야 합니다. 작은 조각을 data: 주소로 CSS에 넣으면
		// 모든 조각(한글 글꼴 포함 269개)을 첫 화면에서 한꺼번에 받게 되므로 항상 파일로 내보냅니다.
		assetsInlineLimit: (file) => (/\.(woff2?|ttf|otf)$/.test(file) ? false : undefined)
	},
	test: {
		environment: 'jsdom',
		include: ['src/**/*.test.ts'],
		setupFiles: ['./vitest.setup.ts']
	}
});
