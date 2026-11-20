import { expect, test, type Page } from '@playwright/test';

/** 덮개의 CSS 애니메이션이 생기면 모두 멈춥니다. 재생 시간(약 2초)과 관계없이 상태를 확인하려고 씁니다. */
async function pauseIntro(page: Page) {
	await page.waitForFunction(
		() =>
			(document.querySelector('[data-testid="home-intro"]')?.getAnimations({ subtree: true })
				.length ?? 0) > 0
	);
	await page
		.getByTestId('home-intro')
		.evaluate((intro) =>
			intro.getAnimations({ subtree: true }).forEach((animation) => animation.pause())
		);
}

test.describe('홈 인트로', () => {
	test('탭에서 처음 홈에 들어오면 재생하고, 끝나면 걷히며, 같은 탭에서는 다시 재생하지 않습니다', async ({
		page
	}) => {
		await page.goto('/', { waitUntil: 'commit' });
		await pauseIntro(page);
		const intro = page.getByTestId('home-intro');
		await expect(page.locator('html')).toHaveAttribute('data-intro', 'play');
		await expect(intro).toBeVisible();
		await expect(intro).toHaveAttribute('aria-hidden', 'true');

		await intro.evaluate((el) =>
			el.getAnimations({ subtree: true }).forEach((animation) => animation.finish())
		);
		await expect(intro).toHaveCount(0);
		await expect(page.locator('html')).not.toHaveAttribute('data-intro');
		await expect(page.getByRole('button', { name: /새 배치도 만들기/ })).toBeVisible();

		await page.reload();
		await expect(page.locator('html')).not.toHaveAttribute('data-intro');
		await expect(intro).toHaveCount(0);
	});

	test('아무 키나 누르면 바로 건너뜁니다', async ({ page }) => {
		await page.goto('/', { waitUntil: 'commit' });
		await pauseIntro(page);
		const intro = page.getByTestId('home-intro');
		await expect(intro).toBeVisible();
		// 건너뛰기는 수화(hydration) 뒤에 붙으므로 걷힐 때까지 다시 누릅니다.
		await expect(async () => {
			await page.keyboard.press('Shift');
			await expect(intro).toHaveCount(0, { timeout: 500 });
		}).toPass({ timeout: 10_000 });
		await expect(page.locator('html')).not.toHaveAttribute('data-intro');
	});

	test('화면을 눌러도 바로 건너뜁니다', async ({ page }) => {
		await page.goto('/', { waitUntil: 'commit' });
		await pauseIntro(page);
		const intro = page.getByTestId('home-intro');
		await expect(intro).toBeVisible();
		await expect(async () => {
			await page.mouse.click(640, 400);
			await expect(intro).toHaveCount(0, { timeout: 500 });
		}).toPass({ timeout: 10_000 });
	});

	test('동작 줄이기를 켰으면 재생하지 않습니다', async ({ page }) => {
		await page.emulateMedia({ reducedMotion: 'reduce' });
		await page.goto('/');
		await expect(page.locator('html')).not.toHaveAttribute('data-intro');
		await expect(page.getByTestId('home-intro')).toHaveCount(0);
	});

	test('주소에 #이 있으면 재생하지 않습니다', async ({ page }) => {
		await page.goto('/#plans');
		await expect(page.locator('html')).not.toHaveAttribute('data-intro');
		await expect(page.getByTestId('home-intro')).toHaveCount(0);
	});
});
