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

/**
 * 건너뛰기 처리기가 붙을 때(수화 뒤 `data-ready`)까지 기다렸다가 페이지 시계를 멈춥니다.
 * 멈춘 동안에는 4초 안전장치가 덮개를 지울 수 없어, 확인하려는 경로만으로 걷히는지 볼 수 있습니다.
 * 시계는 이동 전에 `page.clock.install()`로 붙여 두고, 멈출 때까지는 흐르므로 지금보다 0.5초 뒤에 멈춥니다
 * (주고받는 사이에 지난 시각을 주면 오류. 0.5초는 안전장치보다 한참 앞입니다).
 */
async function freezeWhenReady(page: Page) {
	const intro = page.getByTestId('home-intro');
	await expect(intro).toHaveAttribute('data-ready', '');
	await page.clock.pauseAt((await page.evaluate(() => Date.now())) + 500);
	return intro;
}

/** 건너뛰면 처리기가 `is-leaving`을 붙이고, 0.16초 뒤 덮개와 재생 표시를 지웁니다. */
async function expectSkipped(page: Page) {
	const intro = page.getByTestId('home-intro');
	await expect(intro).toHaveClass(/is-leaving/);
	await page.clock.runFor(200);
	await expect(intro).toHaveCount(0);
	await expect(page.locator('html')).not.toHaveAttribute('data-intro');
}

test.describe('홈 인트로', () => {
	test.beforeEach(async ({ page }) => {
		await page.clock.install();
	});

	test('탭에서 처음 홈에 들어오면 재생하고, 끝나면 걷히며, 같은 탭에서는 다시 재생하지 않습니다', async ({
		page
	}) => {
		await page.goto('/', { waitUntil: 'commit' });
		await pauseIntro(page);
		const intro = page.getByTestId('home-intro');
		await expect(page.locator('html')).toHaveAttribute('data-intro', 'play');
		await expect(intro).toBeVisible();
		await expect(intro).toHaveAttribute('aria-hidden', 'true');

		// 애니메이션이 끝난 것만으로 걷히는지 봅니다(안전장치는 시계를 멈춰 막음).
		await freezeWhenReady(page);
		await intro.evaluate((el) =>
			el.getAnimations({ subtree: true }).forEach((animation) => animation.finish())
		);
		await expect(intro).toHaveCount(0);
		await expect(page.locator('html')).not.toHaveAttribute('data-intro');

		await page.clock.resume();
		await expect(page.getByRole('button', { name: /새 배치도 만들기/ })).toBeVisible();
		await page.reload();
		await expect(page.locator('html')).not.toHaveAttribute('data-intro');
		await expect(intro).toHaveCount(0);
	});

	test('아무 키나 누르면 바로 건너뜁니다', async ({ page }) => {
		await page.goto('/', { waitUntil: 'commit' });
		await pauseIntro(page);
		await freezeWhenReady(page);
		await page.keyboard.press('Shift');
		await expectSkipped(page);
	});

	test('화면을 눌러도 바로 건너뜁니다', async ({ page }) => {
		await page.goto('/', { waitUntil: 'commit' });
		await pauseIntro(page);
		await freezeWhenReady(page);
		await page.mouse.click(640, 400);
		await expectSkipped(page);
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
