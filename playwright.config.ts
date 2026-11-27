import { defineConfig, devices } from '@playwright/test';

/** 다른 서버와 겹치지 않게 PORT·STORYBOOK_PORT로 바꿀 수 있습니다(기본 4173·6007). */
const port = Number(process.env.PORT ?? 4173);
const storybookPort = Number(process.env.STORYBOOK_PORT ?? 6007);

export default defineConfig({
	testDir: 'e2e',
	fullyParallel: true,
	forbidOnly: !!process.env.CI,
	retries: process.env.CI ? 1 : 0,
	// CI에서는 실패할 때 올릴 HTML 리포트도 만듭니다.
	reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
	use: { baseURL: `http://localhost:${port}`, trace: 'retain-on-failure' },
	expect: { toHaveScreenshot: { scale: 'css' } },
	projects: [
		{
			name: 'chromium',
			testIgnore: ['**/visual.spec.ts', '**/storybook/**'],
			use: { ...devices['Desktop Chrome'] }
		},
		{
			// 기준 이미지는 Linux(CI·Playwright Docker 이미지)에서 만듭니다. 다른 운영체제에서는 건너뜁니다.
			name: 'visual',
			testMatch: '**/visual.spec.ts',
			use: { ...devices['Desktop Chrome'] }
		},
		{
			name: 'storybook',
			testMatch: '**/storybook/*.spec.ts',
			use: { ...devices['Desktop Chrome'], baseURL: `http://localhost:${storybookPort}` }
		}
	],
	webServer: [
		{
			// 배포와 같은 조건으로 정적 결과물과 200.html 대체 경로를 검사합니다.
			command: `pnpm exec sirv build --single spa.html --port ${port}`,
			url: `http://localhost:${port}`,
			reuseExistingServer: !process.env.CI
		},
		{
			// pnpm build-storybook 결과물
			command: `pnpm exec sirv storybook-static --port ${storybookPort}`,
			// sirv는 환경 변수 PORT를 --port보다 먼저 쓰므로 이 서버의 PORT를 맞춥니다.
			env: { PORT: String(storybookPort) },
			url: `http://localhost:${storybookPort}`,
			reuseExistingServer: !process.env.CI
		}
	]
});
