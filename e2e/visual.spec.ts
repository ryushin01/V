import { expect, test, type Page } from '@playwright/test';
import { openSample, skipIntro } from './support';

/*
 * 시각 회귀: 주요 화면을 데스크톱·모바일로 찍어 기준 이미지(e2e/visual.spec.ts-snapshots)와 비교합니다.
 * 글자 그리기가 운영체제마다 달라 기준 이미지는 CI와 같은 Linux(Playwright 공식 Docker 이미지)에서 만들고,
 * 다른 운영체제에서는 건너뜁니다. 기준 이미지 다시 만들기: `pnpm test:visual:update`(Docker 필요).
 * 애니메이션은 멈추고(toHaveScreenshot의 animations: 'disabled'), 동작 줄이기와 밝은 테마를 고정하고,
 * 글꼴을 다 받은 뒤 찍습니다. 저장 시각처럼 바뀌는 글자는 가립니다.
 */

test.skip(
	process.platform !== 'linux',
	'기준 이미지는 Linux에서만 비교합니다(pnpm test:visual:update).'
);

const VIEWPORTS = {
	desktop: { width: 1280, height: 800 },
	mobile: { width: 390, height: 844 }
} as const;

test.use({ colorScheme: 'light', reducedMotion: 'reduce' });

test.beforeEach(async ({ context }) => {
	await context.addInitScript(skipIntro);
	await context.addInitScript(() => localStorage.setItem('v-theme', 'light'));
});

async function settle(page: Page) {
	await page.evaluate(() => document.fonts.ready);
	await page.evaluate(() => {
		for (const node of document.querySelectorAll<HTMLElement>('[data-reveal]')) {
			node.dataset.reveal = 'done';
		}
	});
	// 나머지 글자 조각이 붙는 시점(첫 화면 1초 뒤)을 지나 글꼴이 바뀌지 않게 합니다.
	await page.waitForTimeout(1500);
	await page.evaluate(() => document.fonts.ready);
}

async function shoot(page: Page, name: string) {
	await settle(page);
	await expect(page).toHaveScreenshot(`${name}.png`, {
		animations: 'disabled',
		caret: 'hide',
		mask: [page.locator('.status.measure')],
		maxDiffPixelRatio: 0.002
	});
}

for (const [device, viewport] of Object.entries(VIEWPORTS)) {
	test.describe(device, () => {
		test.use({ viewport });

		test('첫 화면', async ({ page }) => {
			await page.goto('/');
			await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
			await shoot(page, `${device}-home`);
		});

		test('예시 배치도 편집과 X-ray', async ({ page }) => {
			await openSample(page);
			await expect(page.locator('[data-item-id]')).toHaveCount(13);
			await shoot(page, `${device}-editor`);
			await page.getByRole('button', { name: 'X-ray' }).click();
			await expect(page.getByTestId('xray-overlay')).toContainText('460cm');
			await shoot(page, `${device}-editor-xray`);
		});

		test('공유 보기', async ({ page }) => {
			await openSample(page);
			await page.getByRole('button', { name: '공유' }).click();
			const url = await page.getByLabel('주소').inputValue();
			await page.goto(url);
			await expect(page.getByRole('button', { name: /내 배치도로 복사/ })).toBeVisible();
			await shoot(page, `${device}-shared`);
		});

		test('없는 주소', async ({ page }) => {
			await page.goto('/no-such-page');
			await expect(page.getByRole('heading', { level: 1 })).toContainText('맞지 않습니다');
			await shoot(page, `${device}-not-found`);
		});
	});
}
