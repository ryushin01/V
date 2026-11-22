import AxeBuilder from '@axe-core/playwright';
import { expect, test, type BrowserContext, type Page } from '@playwright/test';

/*
 * 오프라인 검사: 처음 방문부터 localhost 밖으로 나가는 요청을 모두 끊은 채 주요 화면이 내용과 함께 뜨는지 봅니다.
 * 제품 목록·글꼴·아이콘은 모두 저장소에 있고, 쇼핑몰 피드는 gear-sync 워크플로가 받을 때만 쓰므로 실행 중에는 바깥 요청이 없어야 합니다.
 * 테스트용 빌드에는 .env가 없어 Sentry도 켜지지 않습니다.
 * (서비스 워커가 저장한 뒤 인터넷이 끊긴 경우는 app.spec.ts의 '오프라인에서도…'가 따로 봅니다.)
 */

/** 바깥 요청을 끊고, 끊긴 주소를 모읍니다. */
async function goOffline(context: BrowserContext): Promise<string[]> {
	const blocked: string[] = [];
	await context.route(
		(url) => !['localhost', '127.0.0.1'].includes(url.hostname),
		(route) => {
			blocked.push(route.request().url());
			return route.abort('internetdisconnected');
		}
	);
	return blocked;
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

test.beforeEach(async ({ context }) => {
	// 홈 인트로는 e2e/intro.spec.ts에서 따로 확인합니다.
	await context.addInitScript(() => sessionStorage.setItem('v-intro', 'seen'));
});

test('오프라인: 바깥 요청 없이 첫 화면·예시 배치도·공유 보기가 내용과 함께 뜹니다', async ({
	page,
	context
}) => {
	const blocked = await goOffline(context);

	await page.goto('/');
	await expect(page.getByRole('heading', { level: 1 })).toContainText('자로 재고');
	await expectNoAxeViolations(page);

	await page.getByRole('button', { name: '예시로 시작하기' }).click();
	await page.waitForURL(/\/plans\//);
	await expect(page.getByRole('heading', { name: '물건 추가' })).toBeVisible();
	await expect(page.locator('[data-item-id]').first()).toBeVisible();
	await expectNoAxeViolations(page);

	await page.getByRole('button', { name: '공유' }).click();
	const url = await page.getByLabel('주소').inputValue();
	await page.goto(url);
	await expect(page.getByRole('button', { name: /내 배치도로 복사/ })).toBeVisible();
	await expect(page.getByRole('img', { name: /평면도, 물건 \d+개/ })).toBeVisible();
	await expectNoAxeViolations(page);

	expect(blocked).toEqual([]);
});
