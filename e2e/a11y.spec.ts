import { expect, test } from '@playwright/test';
import { addFromCatalog, expectNoAxeViolations, openEmpty, openSample, skipIntro } from './support';

/*
 * 화면마다 사용자가 거치는 상태(키보드 배치, 룰러 십자선, 거리 재기, 선택, 대화상자, 좁은 화면)를 만들고 axe로 봅니다.
 * 첫 화면·테마·X-ray·공유·오류 화면·축척 대화상자는 app.spec.ts와 offline.spec.ts가 따로 봅니다.
 */

test('인트로가 재생되는 동안의 첫 화면', async ({ page }) => {
	await page.goto('/');
	await expect(page.getByTestId('home-intro')).toBeAttached();
	// 인트로가 걷히기 전에 검사하도록 기다리지 않고 바로 봅니다(axe 대기 1.5초 안에 걷혀도 그 뒤 화면을 봄).
	await expectNoAxeViolations(page, '인트로');
});

test.describe('편집 상태', () => {
	test.beforeEach(async ({ context }) => {
		await context.addInitScript(skipIntro);
	});

	test('키보드만으로 놓고 옮기고 고칠 때', async ({ page }) => {
		await openEmpty(page);
		await addFromCatalog(page, '책상 140');
		const desk = page.locator('[data-item-id]').first();
		await expect(desk).toBeFocused();
		await page.keyboard.press('ArrowRight');
		await page.keyboard.press('r');
		await expect(desk).toHaveAttribute('aria-label', /회전 15도/);
		await expectNoAxeViolations(page, '키보드로 옮긴 물건');

		await page.keyboard.press('Enter');
		await expect(page.getByLabel('이름', { exact: true })).toBeFocused();
		await expectNoAxeViolations(page, '선택한 물건 양식');
	});

	test('룰러 십자선과 거리 재기', async ({ page }) => {
		await openSample(page);
		const canvas = page.getByRole('group', { name: /방 배치도/ });
		await canvas.hover();
		await expect(page.getByTestId('ruler-x').locator('.thumb')).toBeAttached();
		await expect(page.getByTestId('ruler-y').locator('.thumb')).toBeAttached();
		await expectNoAxeViolations(page, '룰러 십자선');

		await page.getByRole('button', { name: '거리 재기' }).click();
		const box = await canvas.boundingBox();
		if (!box) throw new Error('도면이 없습니다');
		await page.mouse.click(box.x + box.width * 0.3, box.y + box.height * 0.5);
		await page.mouse.click(box.x + box.width * 0.6, box.y + box.height * 0.5);
		await expect(page.getByTestId('measure-line')).toHaveText(/^\d+ cm$/);
		await expectNoAxeViolations(page, '거리 재기');
	});

	test('겹침 경고가 있는 점검', async ({ page }) => {
		await openEmpty(page);
		await addFromCatalog(page, '책상 140');
		await addFromCatalog(page, 'TV장');
		await page.getByLabel('X', { exact: true }).fill('90');
		await page.getByLabel('X', { exact: true }).press('Tab');
		await page.getByLabel('Y', { exact: true }).fill('35');
		await page.getByLabel('Y', { exact: true }).press('Tab');
		await expect(page.getByText('오류 1건')).toBeVisible();
		await expectNoAxeViolations(page, '겹침 경고');
	});

	test('제품 등록 대화상자', async ({ page }) => {
		await openSample(page);
		await page.getByRole('button', { name: '제품 등록' }).click();
		const dialog = page.getByRole('dialog', { name: '제품 등록' });
		await expect(dialog).toBeVisible();
		await expectNoAxeViolations(page, '제품 등록');
		// 이름 없이 등록하면 오류를 입력 칸에 이어 줍니다.
		await dialog.getByRole('button', { name: '등록' }).click();
		await expectNoAxeViolations(page, '제품 등록 오류');
		await page.keyboard.press('Escape');
		await expect(dialog).toBeHidden();
	});

	test('공유 대화상자와 다각형 방', async ({ page }) => {
		await openSample(page);
		await page.getByRole('button', { name: '공유' }).click();
		await expect(page.getByLabel('주소')).toHaveValue(/\/shared#/);
		await expectNoAxeViolations(page, '공유');
		await page.keyboard.press('Escape');
		await page.getByRole('button', { name: '모서리 잘라내기' }).click();
		await expectNoAxeViolations(page, '다각형 방');
	});

	test('좁은 화면(390px)의 첫 화면·편집·공유 보기', async ({ page }) => {
		await page.setViewportSize({ width: 390, height: 844 });
		await page.goto('/');
		await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
		await expectNoAxeViolations(page, '좁은 첫 화면');
		await openSample(page);
		await expectNoAxeViolations(page, '좁은 편집');
		await page.getByRole('button', { name: '공유' }).click();
		const url = await page.getByLabel('주소').inputValue();
		await page.goto(url);
		await expect(page.getByRole('button', { name: /내 배치도로 복사/ })).toBeVisible();
		await expectNoAxeViolations(page, '좁은 공유 보기');
	});
});
