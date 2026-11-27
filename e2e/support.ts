import AxeBuilder from '@axe-core/playwright';
import { expect, type Page } from '@playwright/test';

/*
 * 새 E2E(접근성·시각 회귀·성능)가 함께 쓰는 도우미입니다. app.spec.ts의 같은 이름 도우미와 동작이 같습니다.
 */

/** 홈 인트로는 intro.spec.ts에서 따로 확인하므로 이미 본 것으로 둡니다. */
export const skipIntro = () => sessionStorage.setItem('v-intro', 'seen');

export async function openSample(page: Page) {
	await page.goto('/');
	await page.getByRole('button', { name: '예시로 시작하기' }).click();
	await page.waitForURL(/\/plans\//);
	await expect(page.getByRole('heading', { name: '물건 추가' })).toBeVisible();
}

export async function openEmpty(page: Page) {
	await page.goto('/');
	await page.getByRole('button', { name: /새 배치도 만들기/ }).click();
	await page.waitForURL(/\/plans\//);
	await expect(page.getByRole('heading', { name: '물건 추가' })).toBeVisible();
}

/** 분류가 접혀 있으므로 검색해서 물건을 놓습니다. 놓은 뒤 초점은 놓은 물건으로 갑니다. */
export async function addFromCatalog(page: Page, name: string) {
	await page.getByLabel('모델명이나 제조사로 찾기').fill(name);
	await page.getByRole('button', { name: new RegExp(`^${name}`) }).click();
}

/** WCAG 2.2 AA까지의 axe 규칙으로 검사합니다. 스크롤하면 나타나는 요소도 나타난 뒤의 대비로 봅니다. */
export async function expectNoAxeViolations(page: Page, label = '') {
	await page.evaluate(() => {
		for (const node of document.querySelectorAll<HTMLElement>('[data-reveal]')) {
			node.dataset.reveal = 'done';
		}
	});
	await page.waitForTimeout(1500);
	const { violations } = await new AxeBuilder({ page })
		.withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
		.analyze();
	expect(
		violations.map((v) => `${v.id}: ${v.nodes[0]?.html}`),
		label
	).toEqual([]);
}
