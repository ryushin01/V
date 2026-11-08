import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
	testDir: 'e2e',
	fullyParallel: true,
	forbidOnly: !!process.env.CI,
	retries: process.env.CI ? 1 : 0,
	reporter: process.env.CI ? 'github' : 'list',
	use: { baseURL: 'http://localhost:4173', trace: 'retain-on-failure' },
	projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
	webServer: {
		// 배포와 같은 조건으로 정적 결과물과 200.html 대체 경로를 검사합니다.
		command: 'pnpm exec sirv build --single 200.html --port 4173',
		url: 'http://localhost:4173',
		reuseExistingServer: !process.env.CI
	}
});
