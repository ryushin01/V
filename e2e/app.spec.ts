import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

async function openSample(page: Page) {
	await page.goto('/');
	await page.getByRole('button', { name: '예시로 시작하기' }).click();
	await page.waitForURL(/\/plans\//);
	await expect(page.getByRole('heading', { name: '물건 추가' })).toBeVisible();
}

async function openEmpty(page: Page) {
	await page.goto('/');
	await page.getByRole('button', { name: /새 배치도 만들기/ }).click();
	await page.waitForURL(/\/plans\//);
	await expect(page.getByRole('heading', { name: '물건 추가' })).toBeVisible();
}

async function expectNoAxeViolations(page: Page) {
	const { violations } = await new AxeBuilder({ page })
		.withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
		.analyze();
	expect(violations.map((v) => `${v.id}: ${v.nodes[0]?.html}`)).toEqual([]);
}

test.describe('룰러', () => {
	test('편집 화면에 X축과 Y축 cm 룰러가 있습니다', async ({ page }) => {
		await openSample(page);
		for (const axis of ['x', 'y']) {
			const ruler = page.getByTestId(`ruler-${axis}`);
			await expect(ruler).toBeVisible();
			await expect(ruler.locator('text').first()).toBeAttached();
			expect(await ruler.locator('text').count()).toBeGreaterThan(3);
		}
	});

	test('포인터 위치를 양쪽 축에 표시합니다', async ({ page }) => {
		await openSample(page);
		await page.getByRole('group', { name: /방 배치도/ }).hover();
		await expect(page.getByTestId('ruler-x').locator('.thumb')).toBeAttached();
		await expect(page.getByTestId('ruler-y').locator('.thumb')).toBeAttached();
	});

	test('룰러를 끌면 화면이 이동합니다', async ({ page }) => {
		await openSample(page);
		const ruler = page.getByTestId('ruler-x');
		const first = ruler.locator('text').first();
		const before = await first.getAttribute('x');
		const box = await ruler.boundingBox();
		if (!box) throw new Error('룰러가 없습니다');
		await page.mouse.move(box.x + 200, box.y + 10);
		await page.mouse.down();
		await page.mouse.move(box.x + 233, box.y + 10, { steps: 3 });
		await page.mouse.up();
		await expect(first).not.toHaveAttribute('x', before ?? '');
	});

	test('처음 화면에도 X축과 Y축 룰러가 있습니다', async ({ page }) => {
		await page.goto('/');
		await expect(page.getByTestId('ruler-x')).toBeVisible();
		await expect(page.getByTestId('ruler-y')).toBeVisible();
	});
});

test.describe('키보드만으로 배치', () => {
	test('추가, 이동, 회전, 되돌리기', async ({ page }) => {
		await openEmpty(page);
		await page.getByRole('button', { name: /^책상 140/ }).click();

		const desk = page.locator('[data-item-id]').first();
		await expect(desk).toBeFocused();
		const start = await desk.getAttribute('aria-label');

		await page.keyboard.press('ArrowRight');
		await expect(page.locator('[role="status"][aria-live="polite"]')).toContainText(
			'책상 140, 오른쪽으로 10cm 이동'
		);
		await expect(desk).not.toHaveAttribute('aria-label', start ?? '');

		await page.keyboard.press('r');
		await expect(desk).toHaveAttribute('aria-label', /회전 15도/);

		await page.keyboard.press('Enter');
		await expect(page.getByLabel('이름', { exact: true })).toBeFocused();

		await page.locator('[data-item-id]').first().focus();
		await page.keyboard.press('ControlOrMeta+z');
		await expect(desk).toHaveAttribute('aria-label', /회전 0도/);
	});

	test('삭제하면 초점을 잃지 않습니다', async ({ page }) => {
		await openEmpty(page);
		await page.getByRole('button', { name: /^책상 140/ }).click();
		await expect(page.locator('[data-item-id]').first()).toBeFocused();
		await page.keyboard.press('Delete');
		await expect(page.getByRole('heading', { name: '물건 추가' })).toBeFocused();
	});
});

test.describe('포인터 조작', () => {
	test('끌어서 옮기고 Esc로 취소합니다', async ({ page }) => {
		await openEmpty(page);
		await page.getByRole('button', { name: /^책상 140/ }).click();
		const desk = page.locator('[data-item-id]').first();
		const start = await desk.getAttribute('aria-label');
		const box = await desk.boundingBox();
		if (!box) throw new Error('책상이 없습니다');
		const [x, y] = [box.x + box.width / 2, box.y + box.height / 2];

		await page.mouse.move(x, y);
		await page.mouse.down();
		await page.mouse.move(x + 60, y + 60, { steps: 4 });
		await expect(desk).not.toHaveAttribute('aria-label', start ?? '');
		await page.keyboard.press('Escape');
		await page.mouse.up();
		await expect(desk).toHaveAttribute('aria-label', start ?? '');

		await page.mouse.move(x, y);
		await page.mouse.down();
		await page.mouse.move(x + 60, y + 60, { steps: 4 });
		await page.mouse.up();
		await expect(desk).not.toHaveAttribute('aria-label', start ?? '');
		await expect(page.getByRole('button', { name: '되돌리기', exact: true })).toBeEnabled();
	});
});

test.describe('점검과 저장', () => {
	test('겹치면 글자와 아이콘으로 알립니다', async ({ page }) => {
		await openEmpty(page);
		await page.getByRole('button', { name: /^책상 140/ }).click();
		await page.getByRole('button', { name: /^TV장/ }).click();
		await page.getByLabel('X', { exact: true }).fill('90');
		await page.getByLabel('X', { exact: true }).press('Tab');
		await page.getByLabel('Y', { exact: true }).fill('35');
		await page.getByLabel('Y', { exact: true }).press('Tab');
		await expect(page.getByText(/겹칩니다/)).toBeVisible();
		await expect(page.getByText('오류 1건')).toBeVisible();
	});

	test('새로 고쳐도 배치가 남습니다', async ({ page }) => {
		await openEmpty(page);
		await page.getByRole('button', { name: /^사무용 의자/ }).click();
		await expect(page.getByText('저장됨')).toBeVisible();
		await expect(page.locator('[data-item-id]')).toHaveCount(1);
		await page.waitForTimeout(500);
		await page.reload();
		await expect(page.locator('[data-item-id]')).toHaveCount(1);
	});

	test('새 배치도 버튼을 빠르게 두 번 눌러도 하나만 만듭니다', async ({ page }) => {
		await page.goto('/');
		await page.getByRole('button', { name: /새 배치도 만들기/ }).dblclick();
		await page.waitForURL(/\/plans\//);
		await page.goto('/');
		await expect(page.getByRole('link', { name: /새 배치도/ })).toHaveCount(1);
	});

	test('잘못된 파일은 이유를 알려 줍니다', async ({ page }) => {
		await page.goto('/');
		await page.locator('input[type="file"]').setInputFiles({
			name: 'wrong.json',
			mimeType: 'application/json',
			buffer: Buffer.from('{"version":9}')
		});
		await expect(page.getByRole('alert')).toContainText('V 배치도 파일이 아닙니다');
	});

	test('내보낸 파일을 내려받습니다', async ({ page }) => {
		await openSample(page);
		const download = page.waitForEvent('download');
		await page.getByRole('button', { name: '내보내기' }).click();
		expect((await download).suggestedFilename()).toMatch(/\.json$/);
	});
});

test.describe('화면 폭과 접근성', () => {
	for (const width of [320, 390, 768, 1024, 1440]) {
		test(`${width}px에서 가로로 넘치지 않습니다`, async ({ page }) => {
			await page.setViewportSize({ width, height: 800 });
			await openSample(page);
			const overflow = () =>
				page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
			expect(await overflow()).toBeLessThanOrEqual(0);
			await page.goto('/');
			await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
			expect(await overflow()).toBeLessThanOrEqual(0);
		});
	}

	for (const theme of ['light', 'dark']) {
		test(`${theme} 테마의 axe 검사`, async ({ page }) => {
			await page.addInitScript((value) => localStorage.setItem('v-theme', value), theme);
			await page.goto('/');
			await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
			await expectNoAxeViolations(page);
			await openSample(page);
			await page.locator('[data-item-id]').first().focus();
			await expectNoAxeViolations(page);
			await page.goto('/');
			await expect(page.getByRole('link', { name: /예시/ })).toBeVisible();
			await expectNoAxeViolations(page);
		});
	}

	test('언어와 제목을 지정합니다', async ({ page }) => {
		await openSample(page);
		await expect(page.locator('html')).toHaveAttribute('lang', 'ko');
		await expect(page).toHaveTitle(/예시.* 편집 \| V/);
	});
});
