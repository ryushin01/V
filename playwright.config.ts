import { defineConfig, devices } from '@playwright/test';

/** 다른 서버와 겹치지 않게 PORT로 바꿀 수 있습니다(기본 4173). */
const port = Number(process.env.PORT ?? 4173);

export default defineConfig({
	testDir: 'e2e',
	fullyParallel: true,
	forbidOnly: !!process.env.CI,
	retries: process.env.CI ? 1 : 0,
	reporter: process.env.CI ? 'github' : 'list',
	use: { baseURL: `http://localhost:${port}`, trace: 'retain-on-failure' },
	projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
	webServer: {
		// 배포와 같은 조건으로 정적 결과물과 200.html 대체 경로를 검사합니다.
		command: `pnpm exec sirv build --single spa.html --port ${port}`,
		url: `http://localhost:${port}`,
		reuseExistingServer: !process.env.CI
	}
});
