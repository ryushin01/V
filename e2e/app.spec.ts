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

/** 분류가 접혀 있으므로 검색해서 물건을 놓습니다. 놓은 뒤 초점은 놓은 물건으로 갑니다. */
async function addFromCatalog(page: Page, name: string) {
	await page.getByLabel('모델명이나 제조사로 찾기').fill(name);
	await page.getByRole('button', { name: new RegExp(`^${name}`) }).click();
}

/** 지금 연 배치도가 IndexedDB에 저장된 물건 수입니다. 자동 저장이 끝났는지 고정 대기 없이 확인합니다. */
function storedItemCount(page: Page): Promise<number> {
	const id = page.url().split('/').pop();
	return page.evaluate(
		(planId) =>
			new Promise<number>((resolve) => {
				const request = indexedDB.open('v-setup-planner');
				request.onsuccess = () => {
					const database = request.result;
					const get = database
						.transaction('plans')
						.objectStore('plans')
						.get(planId ?? '');
					get.onsuccess = () => {
						resolve(get.result?.items.length ?? -1);
						database.close();
					};
				};
				request.onerror = () => resolve(-1);
			}),
		id
	);
}

async function expectNoAxeViolations(page: Page) {
	// 스크롤하면 나타나는 요소도 나타난 뒤의 대비로 검사합니다.
	await page.evaluate(() => {
		for (const node of document.querySelectorAll<HTMLElement>('[data-reveal]')) {
			node.dataset.reveal = 'done';
		}
	});
	await page.waitForTimeout(1500);
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

	test('오른쪽 눈금이 없는 좁은 창에서는 기본 스크롤바를 유지합니다', async ({ page }) => {
		await page.setViewportSize({ width: 600, height: 800 });
		await page.goto('/');
		await expect(page.getByTestId('page-scale')).toBeHidden();
		const scrollbar = await page.evaluate(
			() => getComputedStyle(document.documentElement).scrollbarWidth
		);
		expect(scrollbar).not.toBe('none');
	});

	test('처음 화면의 도면 좌표는 방 안에서만 표시합니다', async ({ page }) => {
		await page.setViewportSize({ width: 1440, height: 900 });
		await page.goto('/');
		const area = page.locator('.plan-area');
		const box = await area.boundingBox();
		if (!box) throw new Error('도면이 없습니다');
		await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
		await expect(area.locator('.coords')).toContainText(/X \d+ · Y \d+ cm/);
		await page.mouse.move(box.x + 1, box.y + 1);
		await expect(area.locator('.coords')).toHaveCount(0);
		// 도면에는 눈금 설명 외의 글자가 끼어들지 않아야 합니다.
		await expect(area).toHaveText('');
	});

	test('처음 화면 룰러는 64px마다 숫자를 표시합니다', async ({ page }) => {
		await page.goto('/');
		for (const axis of ['x', 'y']) {
			const labels = await page.getByTestId(`ruler-${axis}`).locator('text').allTextContents();
			expect(labels.slice(0, 4)).toEqual(['0', '64', '128', '192']);
		}
	});

	test('오른쪽 눈금을 끌면 페이지가 스크롤됩니다', async ({ page }) => {
		await page.setViewportSize({ width: 1440, height: 900 });
		await page.goto('/');
		await expect(page.getByTestId('page-scale')).toBeVisible();
		const box = await page.getByTestId('page-scale').boundingBox();
		if (!box) throw new Error('눈금이 없습니다');
		await page.mouse.move(box.x + 10, box.y + 20);
		await page.mouse.down();
		await page.mouse.move(box.x + 10, box.y + box.height / 2, { steps: 4 });
		await page.mouse.up();
		await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(500);
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
		await addFromCatalog(page, '책상 140');

		const desk = page.locator('[data-item-id]').first();
		await expect(desk).toBeFocused();
		const start = await desk.getAttribute('aria-label');

		await page.keyboard.press('ArrowRight');
		await expect(page.locator('p.sr-only[role="status"]')).toContainText(
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
		await addFromCatalog(page, '책상 140');
		await expect(page.locator('[data-item-id]').first()).toBeFocused();
		await page.keyboard.press('Delete');
		await expect(page.getByRole('heading', { name: '물건 추가' })).toBeFocused();
	});
});

test.describe('포인터 조작', () => {
	test('끌어서 옮기고 Esc로 취소합니다', async ({ page }) => {
		await openEmpty(page);
		await addFromCatalog(page, '책상 140');
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
		await addFromCatalog(page, '책상 140');
		await addFromCatalog(page, 'TV장');
		await page.getByLabel('X', { exact: true }).fill('90');
		await page.getByLabel('X', { exact: true }).press('Tab');
		await page.getByLabel('Y', { exact: true }).fill('35');
		await page.getByLabel('Y', { exact: true }).press('Tab');
		await expect(page.getByText(/겹칩니다/)).toBeVisible();
		await expect(page.getByText('오류 1건')).toBeVisible();
	});

	test('새로 고쳐도 배치가 남습니다', async ({ page }) => {
		await openEmpty(page);
		await addFromCatalog(page, '사무용 의자');
		await expect(page.getByText('저장됨')).toBeVisible();
		await expect(page.locator('[data-item-id]')).toHaveCount(1);
		await page.waitForTimeout(500);
		await page.reload();
		await expect(page.locator('[data-item-id]')).toHaveCount(1);
		await expect(page).toHaveURL(/\/plans\//);
	});

	test('두 탭에서 고쳐도 서로의 변경을 잃지 않습니다', async ({ page, context }) => {
		await openEmpty(page);
		const other = await context.newPage();
		await other.goto(page.url());
		await expect(other.getByRole('heading', { name: '물건 추가' })).toBeVisible();

		// 한 탭에서 이름을 바꾸면 다른 탭이 바로 불러옵니다.
		await page.getByLabel('배치도 이름').fill('첫 탭에서 바꾼 이름');
		await expect(other.getByLabel('배치도 이름')).toHaveValue('첫 탭에서 바꾼 이름');
		await expect(other.getByRole('status').filter({ hasText: '다른 탭에서' })).toHaveText(
			'다른 탭에서 바뀐 내용을 불러왔습니다.'
		);

		// 다른 탭에서 물건을 놓아도 앞의 이름이 남고, 첫 탭에도 물건이 나타납니다.
		await addFromCatalog(other, '사무용 의자');
		await expect(page.locator('[data-item-id]')).toHaveCount(1);
		await page.reload();
		await expect(page.getByLabel('배치도 이름')).toHaveValue('첫 탭에서 바꾼 이름');
		await expect(page.locator('[data-item-id]')).toHaveCount(1);
	});

	test('끌던 중에 다른 탭이 고친 내용은 놓은 뒤에 불러옵니다', async ({ page, context }) => {
		await openEmpty(page);
		await addFromCatalog(page, '사무용 의자');
		await expect.poll(() => storedItemCount(page)).toBe(1);
		const other = await context.newPage();
		await other.goto(page.url());
		await expect(other.locator('[data-item-id]')).toHaveCount(1);

		// 첫 탭에서 물건을 누른 채로(끌기 시작) 다른 탭에서 이름을 바꿉니다.
		const chair = page.locator('[data-item-id]').first();
		const box = await chair.boundingBox();
		await page.mouse.move(box!.x + box!.width / 2, box!.y + box!.height / 2);
		await page.mouse.down();
		await other.getByLabel('배치도 이름').fill('다른 탭 이름');
		await other.waitForTimeout(800);
		await expect(page.getByLabel('배치도 이름')).toHaveValue('새 배치도');

		// 옮기지 않고 놓으면 미뤄 둔 변경을 불러옵니다.
		await page.mouse.up();
		await expect(page.getByLabel('배치도 이름')).toHaveValue('다른 탭 이름');
	});

	test('다른 탭에서 지운 배치도는 편집 중인 탭에서도 지운 것으로 보여 줍니다', async ({
		page,
		context
	}) => {
		await openEmpty(page);
		const home = await context.newPage();
		await home.goto('/');
		await home.getByRole('button', { name: '새 배치도 삭제' }).click();
		await home.getByRole('dialog').getByRole('button', { name: '삭제', exact: true }).click();
		await expect(page.getByRole('heading', { name: '배치도가 삭제되었습니다' })).toBeVisible();
		await expect(home.getByText('아직 저장한 배치도가 없습니다', { exact: false })).toBeVisible();
	});

	test('이름을 비우고 나가면 이전 이름으로 돌아갑니다', async ({ page }) => {
		await openEmpty(page);
		const name = page.getByLabel('배치도 이름');
		await name.fill('');
		await name.press('Tab');
		await expect(name).toHaveValue('새 배치도');
		await expect(page).toHaveTitle('새 배치도 편집 | V');
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
		// 오류 영역은 처음부터 여럿 있고, 해당 영역에 문구만 들어옵니다.
		await expect(
			page.getByRole('alert').filter({ hasText: 'V 배치도 파일이 아닙니다' })
		).toBeVisible();
	});

	test('내보낸 파일을 내려받습니다', async ({ page }) => {
		await openSample(page);
		const download = page.waitForEvent('download');
		await page.getByRole('button', { name: '내보내기' }).click();
		expect((await download).suggestedFilename()).toMatch(/\.json$/);
	});
});

test.describe('첫 화면 연출과 X-ray', () => {
	test('스크롤에 따라 단계와 진행률이 바뀝니다', async ({ page }) => {
		await page.setViewportSize({ width: 1440, height: 900 });
		await page.goto('/');
		await expect(page.locator('[aria-current="step"]')).toContainText('벽');
		await page.evaluate(() => {
			const build = document.getElementById('build') as HTMLElement;
			window.scrollTo(0, build.offsetTop + build.offsetHeight - window.innerHeight - 2);
		});
		await expect(page.locator('[aria-current="step"]')).toContainText('점검');
		await expect(page.getByTestId('build-percent')).toHaveText(/(099|100)%/);
	});

	test('동작 줄이기에서는 완성된 도면을 바로 보여 줍니다', async ({ page }) => {
		await page.emulateMedia({ reducedMotion: 'reduce' });
		await page.goto('/');
		await expect(page.locator('[aria-current="step"]')).toContainText('점검');
		expect(await page.locator('#build').evaluate((node) => node.clientHeight)).toBeLessThan(2000);
	});

	test('X-ray를 켜면 편집 화면에 치수와 케이블 길이가 드러납니다', async ({ page }) => {
		await openSample(page);
		const overlay = page.getByTestId('xray-overlay');
		await expect(overlay).toHaveCount(0);
		await page.getByRole('button', { name: 'X-ray' }).click();
		await expect(overlay).toContainText('460cm');
		await expect(overlay).toContainText('245cm');
		await expect(page.locator('html')).toHaveAttribute('data-xray', 'on');
	});

	test('X-ray 화면의 axe 검사', async ({ page }) => {
		await page.goto('/');
		await page.getByRole('button', { name: 'X-ray' }).click();
		await expect(page.locator('html')).toHaveAttribute('data-xray', 'on');
		await page.waitForTimeout(500);
		await expectNoAxeViolations(page);
		await page.getByRole('button', { name: '예시로 시작하기' }).click();
		await page.waitForURL(/\/plans\//);
		await expect(page.getByTestId('xray-overlay')).toBeAttached();
		await page.waitForTimeout(500);
		await expectNoAxeViolations(page);
	});
});

test.describe('공유와 오류 화면', () => {
	test('공유 링크를 열어 내 배치도로 복사합니다', async ({ page }) => {
		await openSample(page);
		await page.getByRole('button', { name: '공유' }).click();
		const field = page.getByLabel('주소');
		await expect(field).toHaveValue(/\/shared#/);
		const url = await field.inputValue();
		await page.goto(url);
		await expect(page.getByRole('heading', { level: 1 })).toContainText('예시');
		await expectNoAxeViolations(page);
		await page.getByRole('button', { name: /내 배치도로 복사/ }).click();
		await page.waitForURL(/\/plans\//);
		await expect(page.locator('[data-item-id]')).toHaveCount(13);
	});

	test('손상된 공유 링크는 이유를 알려 줍니다', async ({ page }) => {
		await page.goto('/shared#broken');
		await expect(page.getByRole('alert')).toContainText('V 공유 링크가 아닙니다');
	});

	test('없는 주소는 V의 안내 화면을 보여 줍니다', async ({ page }) => {
		await page.goto('/no-such-page');
		await expect(page.getByRole('heading', { level: 1 })).toContainText('맞지 않습니다');
		await expect(page).toHaveTitle(/찾을 수 없습니다/);
		await expectNoAxeViolations(page);
	});

	test('치수를 바꾸면 도면과 안내가 함께 바뀝니다', async ({ page }) => {
		await openEmpty(page);
		await addFromCatalog(page, '책상 140');
		await page.getByLabel('가로', { exact: true }).fill('200');
		await page.getByLabel('가로', { exact: true }).press('Tab');
		await expect(page.locator('[data-item-id]').first()).toHaveAttribute('aria-label', /가로 200/);
	});

	test('보조기술에 노출되는 편집 화면 구조', async ({ page }) => {
		await openSample(page);
		await page.locator('[data-item-id]').first().focus();
		const tree = await page.locator('body').ariaSnapshot();
		for (const part of [
			'banner',
			'main',
			'heading',
			'group "방 배치도',
			'button "책상 160, 가로 160'
		]) {
			expect(tree).toContain(part);
		}
		await expect(page.locator('p.sr-only[role="status"]')).toBeAttached();
	});
});

test.describe('다각형 방과 평면도 이미지', () => {
	const PNG = Buffer.from(
		'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
		'base64'
	);

	test('모서리를 잘라 ㄱ자 방을 만듭니다', async ({ page }) => {
		await openEmpty(page);
		await page.getByRole('button', { name: '모서리 잘라내기' }).click();
		const points = await page.locator('.canvas polygon.wall').getAttribute('points');
		expect(points?.split(' ')).toHaveLength(6);
		await expectNoAxeViolations(page);
	});

	test('평면도 이미지를 올리고 두 점으로 축척을 맞춥니다', async ({ page }) => {
		await openEmpty(page);
		await page.getByTestId('underlay-file').setInputFiles({
			name: 'plan.png',
			mimeType: 'image/png',
			buffer: PNG
		});
		const image = page.getByTestId('underlay');
		await expect(image).toHaveAttribute('width', '400');

		await page.getByRole('button', { name: '두 점으로 축척 맞추기' }).click();
		const box = await page.locator('.canvas > svg').boundingBox();
		if (!box) throw new Error('도면이 없습니다');
		await page.mouse.click(box.x + 200, box.y + 200);
		await page.mouse.click(box.x + 400, box.y + 200);
		const dialog = page.getByRole('dialog', { name: '두 점 사이의 실제 길이' });
		await expect(dialog).toBeVisible();
		await dialog.getByLabel('실제 길이').fill('500');
		await dialog.getByLabel('실제 길이').press('Tab');
		await dialog.getByRole('button', { name: '적용' }).click();
		await expect(dialog).toBeHidden();
		const width = Number(await image.getAttribute('width'));
		expect(width).toBeGreaterThan(400);
	});

	test('축척 맞추기는 Esc로 취소합니다', async ({ page }) => {
		await openEmpty(page);
		await page.getByTestId('underlay-file').setInputFiles({
			name: 'plan.png',
			mimeType: 'image/png',
			buffer: PNG
		});
		await page.getByRole('button', { name: '두 점으로 축척 맞추기' }).click();
		await page.keyboard.press('Escape');
		await expect(page.getByRole('button', { name: '두 점으로 축척 맞추기' })).toBeVisible();
	});
});

test.describe('물건 목록', () => {
	test('분류는 접혀 있고, 검색하면 펼치고, 최근 놓은 물건을 위에 보여 줍니다', async ({ page }) => {
		await openEmpty(page);
		const panel = page.locator('section[aria-labelledby="catalog-heading"]');
		await expect(panel.getByRole('button', { name: /^책상 140/ })).toBeHidden();
		await expect(panel.locator('summary', { hasText: '가구' })).toContainText(/\d+/);

		await page.getByLabel('모델명이나 제조사로 찾기').fill('액톤');
		await expect(panel.getByRole('button', { name: /Acton III/ })).toBeVisible();
		await panel.getByRole('button', { name: /Acton III/ }).click();
		await page.getByLabel('모델명이나 제조사로 찾기').fill('');

		const recent = panel.locator('details.recent');
		await expect(recent.getByRole('button', { name: /Acton III/ })).toBeVisible();
		await page.reload();
		await expect(
			page.locator('details.recent').getByRole('button', { name: /Acton III/ })
		).toBeVisible();
		await expectNoAxeViolations(page);
	});
});

test.describe('셀렉트', () => {
	test('화살표 오른쪽 간격이 왼쪽 글자 간격과 같습니다', async ({ page }) => {
		await openEmpty(page);
		await page.getByRole('button', { name: '제품 등록' }).click();
		const dialog = page.getByRole('dialog', { name: '제품 등록' });
		for (const label of ['종류', '그림']) {
			const gaps = await dialog.getByLabel(label, { exact: true }).evaluate((select) => {
				const style = getComputedStyle(select);
				const box = select.getBoundingClientRect();
				const arrow = select.parentElement!.querySelector('.arrow svg')!.getBoundingClientRect();
				return {
					left: parseFloat(style.borderLeftWidth) + parseFloat(style.paddingLeft),
					right: box.right - arrow.right
				};
			});
			expect(Math.abs(gaps.left - gaps.right), label).toBeLessThan(0.5);
		}
	});
});

test.describe('내 제품 등록', () => {
	test('등록해 놓고, 새로 고쳐도 남고, 공유 링크로도 열립니다', async ({ page }) => {
		await openEmpty(page);
		await page.getByRole('button', { name: '제품 등록' }).click();
		const dialog = page.getByRole('dialog', { name: '제품 등록' });
		await dialog.getByLabel('제품 이름 (필수)').fill('우리 집 원목 책상');
		await dialog.getByLabel('가로', { exact: true }).fill('170');
		await dialog.getByLabel('가로', { exact: true }).press('Tab');
		await dialog.getByLabel('그림', { exact: true }).selectOption({ label: '모션데스크' });
		await expectNoAxeViolations(page);
		await dialog.getByRole('button', { name: '등록' }).click();
		await expect(dialog).toBeHidden();
		const item = page.locator('[data-item-id]').first();
		await expect(item).toHaveAttribute('aria-label', /우리 집 원목 책상, 가로 170/);
		await expect(page.locator('[data-glyph="mattz"]')).toBeAttached();

		await page.waitForTimeout(500);
		await page.reload();
		await expect(page.locator('[data-item-id]').first()).toHaveAttribute(
			'aria-label',
			/우리 집 원목 책상/
		);
		await expect(page.getByRole('button', { name: '우리 집 원목 책상 고치기' })).toBeVisible();

		await page.getByRole('button', { name: '공유' }).click();
		const url = await page.getByLabel('주소').inputValue();
		const fresh = await page.context().browser()!.newContext();
		const other = await fresh.newPage();
		await other.goto(url);
		await expect(other.getByRole('img', { name: /물건 1개/ })).toBeVisible();
		await other.getByRole('button', { name: /내 배치도로 복사/ }).click();
		await other.waitForURL(/\/plans\//);
		await expect(other.locator('[data-item-id]').first()).toHaveAttribute(
			'aria-label',
			/우리 집 원목 책상/
		);
		await fresh.close();
	});

	test('다른 탭에서 내 제품을 고치면 놓은 물건과 목록에도 바로 반영합니다', async ({
		page,
		context
	}) => {
		await openEmpty(page);
		await page.getByRole('button', { name: '제품 등록' }).click();
		const dialog = page.getByRole('dialog', { name: '제품 등록' });
		await dialog.getByLabel('제품 이름 (필수)').fill('탭 공유 책상');
		await dialog.getByLabel('가로', { exact: true }).fill('150');
		await dialog.getByLabel('가로', { exact: true }).press('Tab');
		await dialog.getByRole('button', { name: '등록' }).click();
		await expect(dialog).toBeHidden();
		await expect.poll(() => storedItemCount(page)).toBe(1);

		const other = await context.newPage();
		await other.goto(page.url());
		await expect(other.locator('[data-item-id]').first()).toHaveAttribute(
			'aria-label',
			/탭 공유 책상, 가로 150/
		);

		await page.getByRole('button', { name: '탭 공유 책상 고치기' }).click();
		const edit = page.getByRole('dialog', { name: '내 제품 고치기' });
		await edit.getByLabel('가로', { exact: true }).fill('180');
		await edit.getByLabel('가로', { exact: true }).press('Tab');
		await edit.getByRole('button', { name: '저장' }).click();
		await expect(edit).toBeHidden();

		await expect(other.locator('[data-item-id]').first()).toHaveAttribute(
			'aria-label',
			/탭 공유 책상, 가로 180/
		);
		// 내 제품 목록과 최근 추가한 물건 모두 새 치수로 바뀝니다.
		await expect(other.getByRole('button', { name: /^탭 공유 책상 180×60/ })).toHaveCount(2);
	});

	test('내 제품 목록을 파일로 내보내 다른 브라우저에서 가져옵니다', async ({ page }) => {
		await openEmpty(page);
		await page.getByRole('button', { name: '제품 등록' }).click();
		const dialog = page.getByRole('dialog', { name: '제품 등록' });
		await dialog.getByLabel('제품 이름 (필수)').fill('옮길 스피커');
		await dialog.getByLabel('종류').selectOption({ label: '스피커' });
		await dialog.getByLabel('등록하고 배치도에 놓기').uncheck();
		await dialog.getByRole('button', { name: '등록' }).click();
		await expect(dialog).toBeHidden();

		const downloading = page.waitForEvent('download');
		await page.getByRole('button', { name: '파일로 내보내기' }).click();
		const file = await (await downloading).path();

		const fresh = await page.context().browser()!.newContext();
		const other = await fresh.newPage();
		await openEmpty(other);
		await other.locator('input[type="file"][accept*="json"]').setInputFiles(file);
		await expect(other.getByRole('button', { name: '옮길 스피커 고치기' })).toBeVisible();
		await expectNoAxeViolations(other);
		await fresh.close();
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

test.describe('런칭 기본', () => {
	test('모든 화면에서 CSP 위반이 없고 저장한 테마를 먼저 적용합니다', async ({ page }) => {
		await page.addInitScript(() => {
			localStorage.setItem('v-theme', 'dark');
			const violations: string[] = [];
			(window as unknown as { __csp: string[] }).__csp = violations;
			document.addEventListener('securitypolicyviolation', (event) =>
				violations.push(`${event.violatedDirective} ${event.blockedURI}`)
			);
		});
		const violations = () => page.evaluate(() => (window as unknown as { __csp: string[] }).__csp);

		await page.goto('/');
		await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
		await expect(page.locator('meta[http-equiv="content-security-policy"]')).toHaveCount(1);
		expect(await violations()).toEqual([]);

		await page.getByRole('button', { name: '예시로 시작하기' }).click();
		await page.waitForURL(/\/plans\//);
		await page
			.locator('input[type="file"][accept*="image"]')
			.first()
			.setInputFiles({
				name: 'plan.png',
				mimeType: 'image/png',
				buffer: Buffer.from(
					'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
					'base64'
				)
			});
		await expect(page.getByTestId('underlay')).toBeVisible();
		expect(await violations()).toEqual([]);

		await page.getByRole('button', { name: '공유' }).click();
		const url = await page.getByLabel('주소').inputValue();
		await page.goto(url);
		await expect(page.getByRole('button', { name: /내 배치도로 복사/ })).toBeVisible();
		expect(await violations()).toEqual([]);

		await page.goto('/no-such-page');
		await expect(page.getByText('ERROR')).toBeVisible();
		expect(await violations()).toEqual([]);
	});

	test('오프라인에서도 첫 화면과 편집 화면이 열리고 고친 내용이 남습니다', async ({
		page,
		context
	}) => {
		await openEmpty(page);
		const url = page.url();
		// 서비스 워커가 앱 파일을 모두 저장하고 이 화면을 맡을 때까지 기다립니다.
		await page.evaluate(async () => {
			await navigator.serviceWorker.ready;
		});
		await page.reload();
		await expect
			.poll(() => page.evaluate(() => navigator.serviceWorker.controller !== null))
			.toBe(true);

		await context.setOffline(true);
		await page.goto('/');
		await expect(page.getByRole('heading', { level: 1 })).toContainText('자로 재고');
		await page.goto(url);
		await expect(page.getByRole('heading', { name: '물건 추가' })).toBeVisible();
		await addFromCatalog(page, '사무용 의자');
		await expect(page.locator('[data-item-id]')).toHaveCount(1);
		await expect.poll(() => storedItemCount(page)).toBe(1);
		await page.reload();
		await expect(page.locator('[data-item-id]')).toHaveCount(1);
		await context.setOffline(false);
	});

	test('설치용 매니페스트와 아이콘, 공유 미리보기, 검색 설정', async ({ page, request }) => {
		const manifest = await (await request.get('/manifest.webmanifest')).json();
		expect(manifest).toMatchObject({ short_name: 'V', display: 'standalone', start_url: '/' });
		for (const icon of manifest.icons as { src: string; sizes: string }[]) {
			const response = await request.get(icon.src);
			expect(response.status(), icon.src).toBe(200);
		}
		expect(manifest.icons.map((icon: { sizes: string }) => icon.sizes)).toEqual(
			expect.arrayContaining(['192x192', '512x512'])
		);

		await page.goto('/');
		await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
			'content',
			'https://v-setup-planner-ryushin01.vercel.app/og-image.jpg'
		);
		await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
			'href',
			'https://v-setup-planner-ryushin01.vercel.app/'
		);
		expect((await request.get('/og-image.jpg')).status()).toBe(200);
		expect(await (await request.get('/robots.txt')).text()).toContain('Disallow: /plans/');

		await openEmpty(page);
		await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex');
	});
});

test.describe('백업과 복제', () => {
	test('복제한 배치도는 따로 열립니다', async ({ page }) => {
		await openSample(page);
		await page.goto('/');
		await page.getByRole('button', { name: /^예시: .* 복제$/ }).click();
		await expect(page.getByRole('status').filter({ hasText: '사본' })).toContainText(
			'사본’을 만들었습니다.'
		);
		await page.getByRole('link', { name: /사본/ }).click();
		await page.waitForURL(/\/plans\//);
		await expect(page.locator('[data-item-id]')).toHaveCount(13);
		await expect(page.getByLabel('배치도 이름')).toHaveValue(/ 사본$/);
	});

	test('전체 백업을 다른 브라우저에서 불러옵니다', async ({ page, browser }) => {
		await openSample(page);
		await page.getByRole('button', { name: '제품 등록' }).click();
		const dialog = page.getByRole('dialog', { name: '제품 등록' });
		await dialog.getByLabel('제품 이름 (필수)').fill('백업할 스피커');
		await dialog.getByLabel('종류').selectOption({ label: '스피커' });
		await dialog.getByLabel('등록하고 배치도에 놓기').uncheck();
		await dialog.getByRole('button', { name: '등록' }).click();
		await expect(dialog).toBeHidden();

		await page.goto('/');
		const downloading = page.waitForEvent('download');
		await page.getByRole('button', { name: '전체 백업' }).click();
		const download = await downloading;
		expect(download.suggestedFilename()).toMatch(/^v-backup-\d{4}-\d{2}-\d{2}\.json$/);
		await expect(page.getByRole('status').filter({ hasText: '백업 파일로' })).toContainText(
			'배치도 1개와 내 제품 1개'
		);

		const fresh = await browser.newContext();
		const other = await fresh.newPage();
		await other.goto('/');
		const choosing = other.waitForEvent('filechooser');
		await other.getByRole('button', { name: 'JSON 불러오기' }).click();
		await (await choosing).setFiles(await download.path());
		await expect(other.getByRole('status').filter({ hasText: '백업에서' })).toContainText(
			'배치도 1개와 내 제품 1개를 가져왔습니다.'
		);
		await other.getByRole('link', { name: /예시/ }).click();
		await other.waitForURL(/\/plans\//);
		await expect(other.locator('[data-item-id]')).toHaveCount(13);
		await expect(other.getByRole('button', { name: '백업할 스피커 고치기' })).toBeVisible();
		await fresh.close();
	});
});
