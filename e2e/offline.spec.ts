import AxeBuilder from '@axe-core/playwright';
import { expect, test, type BrowserContext, type Page } from '@playwright/test';

/*
 * 오프라인 검사: localhost 밖으로 나가는 요청을 모두 끊은 채 모든 화면·주요 상태가 내용과 함께 뜨는지 봅니다.
 * 제품 목록·글꼴·아이콘은 모두 저장소에 있고, 쇼핑몰 피드는 gear-sync 워크플로가 받아 둔 스냅샷
 * (src/entities/plan/model/sync/shop-feed.ts)만 쓰므로 실행 중에는 바깥 요청이 없어야 합니다.
 * 테스트용 빌드에는 .env가 없어 Sentry도 켜지지 않습니다.
 *
 * 두 경우를 같은 둘러보기로 확인합니다.
 * - 처음 방문: 서비스 워커 없이 처음부터 바깥 요청을 끊습니다.
 * - 설치 뒤 다시 방문: 서비스 워커가 앱 파일을 저장한 뒤 네트워크를 모두 끊습니다(localhost 포함).
 */

const PNG = Buffer.from(
	'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
	'base64'
);

interface Watch {
	/** 끊은 바깥 요청 */
	blocked: string[];
	/**
	 * 실패한 같은 출처 파일 요청(서비스 워커 저장본이 없어 못 받은 글꼴·스크립트·스타일·그림).
	 * 페이지 이동과 새 버전 확인(version.json)은 서비스 워커가 네트워크를 먼저 시도했다가 저장본으로 답하므로 뺍니다.
	 */
	failed: string[];
}

/** 바깥 요청을 끊고, 끊긴 주소와 실패한 요청을 모읍니다. */
async function cutOutside(context: BrowserContext): Promise<Watch> {
	const watch: Watch = { blocked: [], failed: [] };
	await context.route(
		(url) => !['localhost', '127.0.0.1'].includes(url.hostname),
		(route) => {
			watch.blocked.push(route.request().url());
			return route.abort('internetdisconnected');
		}
	);
	context.on('requestfailed', (request) => {
		const url = new URL(request.url());
		const asset = ['font', 'script', 'stylesheet', 'image'].includes(request.resourceType());
		if (asset && ['localhost', '127.0.0.1'].includes(url.hostname)) watch.failed.push(url.pathname);
	});
	return watch;
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

/** 화면 글꼴이 대체 글꼴로 떨어지지 않았는지(받다 실패한 글꼴이 없는지) 봅니다. */
async function expectFontsLoaded(page: Page) {
	await page.evaluate(() => document.fonts.ready);
	const errors = await page.evaluate(() =>
		[...document.fonts].filter((font) => font.status === 'error').map((font) => font.family)
	);
	expect(errors).toEqual([]);
}

/** 첫 화면부터 편집·카탈로그·X-ray·도면·점검·공유·축척·백업까지 차례로 둘러봅니다. */
async function tour(page: Page) {
	// 첫 화면(인트로는 건너뛴 상태)
	await page.goto('/');
	await expect(page.getByRole('heading', { level: 1 })).toContainText('자로 재고');
	await expectFontsLoaded(page);
	await expectNoAxeViolations(page);

	// 예시 배치도 편집
	await page.getByRole('button', { name: '예시로 시작하기' }).click();
	await page.waitForURL(/\/plans\//);
	const planUrl = page.url();
	await expect(page.getByRole('heading', { name: '물건 추가' })).toBeVisible();
	await expect(page.locator('[data-item-id]')).toHaveCount(13);
	await expect(page.getByRole('heading', { name: '점검' })).toBeVisible();
	await expectFontsLoaded(page);
	await expectNoAxeViolations(page);

	// 카탈로그: 분류를 모두 펼치면 실제 모델 180여 종과 기본 물건이 그림과 함께 보입니다.
	const panel = page.locator('section[aria-labelledby="catalog-heading"]');
	const closed = panel.locator('details:not([open]) > summary');
	while ((await closed.count()) > 0) await closed.first().click();
	expect(await panel.getByRole('button').count()).toBeGreaterThanOrEqual(180);
	await page.getByLabel('모델명이나 제조사로 찾기').fill('액톤');
	await expect(panel.getByRole('button', { name: /Acton III/ })).toBeVisible();
	await page.getByLabel('모델명이나 제조사로 찾기').fill('');
	await expectNoAxeViolations(page);

	// X-ray
	await page.getByRole('button', { name: 'X-ray' }).click();
	await expect(page.getByTestId('xray-overlay')).toContainText('460cm');
	await expectNoAxeViolations(page);
	await page.getByRole('button', { name: 'X-ray' }).click();

	// 도면 그림 저장
	const picture = page.waitForEvent('download');
	await page.getByRole('button', { name: '그림 저장' }).click();
	expect((await picture).suggestedFilename()).toMatch(/\.png$/);

	// 공유 링크 열기
	await page.getByRole('button', { name: '공유' }).click();
	const shareUrl = await page.getByLabel('주소').inputValue();
	await page.goto(shareUrl);
	await expect(page.getByRole('button', { name: /내 배치도로 복사/ })).toBeVisible();
	await expect(page.getByRole('img', { name: /평면도, 물건 \d+개/ })).toBeVisible();
	await expectFontsLoaded(page);
	await expectNoAxeViolations(page);

	// 손상된 공유 링크와 없는 주소(같은 문서의 해시만 바뀌지 않게 다른 화면을 거칩니다)
	await page.goto('/no-such-page');
	await expect(page.getByRole('heading', { level: 1 })).toContainText('맞지 않습니다');
	await expectNoAxeViolations(page);
	await page.goto('/shared#broken');
	await expect(page.getByRole('alert')).toContainText('V 공유 링크가 아닙니다');

	// 평면도 이미지를 올리고 두 점으로 축척 맞추기
	await page.goto(planUrl);
	await expect(page.locator('[data-item-id]')).toHaveCount(13);
	await page.getByTestId('underlay-file').setInputFiles({
		name: 'plan.png',
		mimeType: 'image/png',
		buffer: PNG
	});
	await page.getByRole('button', { name: '두 점으로 축척 맞추기' }).click();
	const box = await page.locator('.canvas > svg').boundingBox();
	if (!box) throw new Error('도면이 없습니다');
	await page.mouse.click(box.x + 200, box.y + 200);
	await page.mouse.click(box.x + 400, box.y + 200);
	const dialog = page.getByRole('dialog', { name: '두 점 사이의 실제 길이' });
	await expect(dialog).toBeVisible();
	await expectNoAxeViolations(page);
	await dialog.getByLabel('실제 길이').fill('500');
	await dialog.getByLabel('실제 길이').press('Tab');
	await dialog.getByRole('button', { name: '적용' }).click();
	await expect(dialog).toBeHidden();

	// 전체 백업을 받아 복원
	await page.goto('/');
	const backup = page.waitForEvent('download');
	await page.getByRole('button', { name: '전체 백업' }).click();
	const file = await (await backup).path();
	const choosing = page.waitForEvent('filechooser');
	await page.getByRole('button', { name: 'JSON 불러오기' }).click();
	await (await choosing).setFiles(file);
	await expect(page.getByRole('status').filter({ hasText: '백업에서' })).toContainText(
		'가져왔습니다'
	);
}

test.describe('오프라인', () => {
	// 모든 화면을 한 번에 둘러보므로 기본 30초보다 길게 둡니다.
	test.describe.configure({ timeout: 120_000 });

	test.beforeEach(async ({ context }) => {
		// 홈 인트로는 아래 '인트로' 검사와 e2e/intro.spec.ts에서 따로 확인합니다.
		await context.addInitScript(() => sessionStorage.setItem('v-intro', 'seen'));
	});

	test('처음 방문: 바깥 요청 없이 모든 화면이 내용과 함께 뜹니다', async ({ page, context }) => {
		const watch = await cutOutside(context);
		await tour(page);
		expect(watch.blocked).toEqual([]);
		expect(watch.failed).toEqual([]);
	});

	test('설치 뒤 다시 방문: 네트워크가 모두 끊겨도 저장본으로 모든 화면이 뜹니다', async ({
		page,
		context
	}) => {
		const watch = await cutOutside(context);
		await page.goto('/');
		// 서비스 워커가 앱 파일을 모두 저장하고 이 화면을 맡을 때까지 기다립니다.
		await page.evaluate(async () => {
			await navigator.serviceWorker.ready;
		});
		await page.reload();
		await expect
			.poll(() => page.evaluate(() => navigator.serviceWorker.controller !== null))
			.toBe(true);

		await context.setOffline(true);
		watch.failed.length = 0;
		await tour(page);
		await context.setOffline(false);
		expect(watch.blocked).toEqual([]);
		expect(watch.failed).toEqual([]);
	});
});

test('오프라인 인트로: 바깥 요청 없이 인트로가 걷히고 첫 화면이 뜹니다', async ({
	page,
	context
}) => {
	const watch = await cutOutside(context);
	await page.goto('/');
	await expect(page.getByTestId('home-intro')).toHaveCount(0, { timeout: 10_000 });
	await expect(page.getByRole('heading', { level: 1 })).toContainText('자로 재고');
	await expectFontsLoaded(page);
	expect(watch.blocked).toEqual([]);
	expect(watch.failed).toEqual([]);
});
