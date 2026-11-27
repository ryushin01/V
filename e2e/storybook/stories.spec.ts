import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';

/*
 * Storybook 스토리마다 axe 검사(위반이 있으면 실패)와 시각 회귀를 합니다. `pnpm build-storybook`으로 만든
 * storybook-static을 playwright.config.ts의 storybook 프로젝트가 띄웁니다. 시각 비교는 visual.spec.ts처럼
 * Linux에서만 합니다.
 */

interface IndexEntry {
	type: string;
	id: string;
	title: string;
	name: string;
}

function isIndex(value: unknown): value is { entries: Record<string, IndexEntry> } {
	return typeof value === 'object' && value !== null && 'entries' in value;
}

const raw: unknown = JSON.parse(readFileSync('storybook-static/index.json', 'utf8'));
if (!isIndex(raw)) throw new Error('storybook-static/index.json 형식이 맞지 않습니다.');
const stories = Object.values(raw.entries).filter((entry) => entry.type === 'story');

/**
 * addon-a11y도 스토리를 그린 뒤 미리보기 안에서 axe를 돌립니다(parameters.a11y.test: 'error'). 겹치면 axe가
 * 'already running'으로 거절하므로, 그 검사가 끝날 때까지 잠깐씩 기다렸다가 다시 돌립니다.
 */
async function analyze(page: Page) {
	for (let attempt = 0; ; attempt++) {
		try {
			return await new AxeBuilder({ page })
				.withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
				.analyze();
		} catch (error) {
			if (attempt >= 10 || !String(error).includes('Axe is already running')) throw error;
			await page.waitForTimeout(300);
		}
	}
}

test.use({ colorScheme: 'light', reducedMotion: 'reduce', viewport: { width: 1024, height: 768 } });

for (const story of stories) {
	test(`${story.title} / ${story.name}`, async ({ page }) => {
		await page.goto(`/iframe.html?id=${story.id}&viewMode=story`);
		// 스토리를 다 그리면 Storybook이 body에 sb-show-main(오류면 sb-show-errordisplay)을 붙입니다.
		// 대화상자·<head>만 바꾸는 스토리도 있어 #storybook-root가 비어 있을 수 있습니다.
		await page.waitForFunction(() =>
			['sb-show-main', 'sb-show-errordisplay'].some((name) =>
				document.body.classList.contains(name)
			)
		);
		await expect(page.locator('body')).not.toHaveClass(/sb-show-errordisplay/);
		await page.evaluate(() => document.fonts.ready);

		const { violations } = await analyze(page);
		expect(violations.map((v) => `${v.id}: ${v.nodes[0]?.html}`)).toEqual([]);

		if (process.platform === 'linux') {
			await expect(page).toHaveScreenshot(`${story.id}.png`, {
				animations: 'disabled',
				caret: 'hide',
				maxDiffPixelRatio: 0.002
			});
		}
	});
}
