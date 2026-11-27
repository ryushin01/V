import { expect, test, type Page } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { openSample, skipIntro } from './support';

/*
 * 큰 방 성능: 15×15m 방에 물건 300개를 놓고 끌기·키보드 이동을 할 때 점검 계산 때문에 화면이 끊기지 않는지 봅니다.
 * - 프레임: 끄는 동안 requestAnimationFrame 간격을 모아 가장 긴 간격과 50ms가 넘는 프레임 비율을 봅니다.
 * - INP: Event Timing(PerformanceObserver 'event')으로 잰 조작 처리 시간 중 가장 긴 값이 200ms(좋음 기준) 이하인지 봅니다.
 */

const ITEMS = 300;
const ROOM_CM = 1500;
const INP_LIMIT_MS = 200;
const LONGEST_FRAME_LIMIT_MS = 200;
const SLOW_FRAME_RATIO_LIMIT = 0.1;

test.beforeEach(async ({ context }) => {
	await context.addInitScript(skipIntro);
});

interface ExportedItem {
	catalogId: string;
	label: string;
	rotation: number;
	price: number;
}

function isItem(value: unknown): value is ExportedItem {
	return typeof value === 'object' && value !== null && 'catalogId' in value && 'rotation' in value;
}

/** 예시 배치도를 내보낸 파일에서 물건 종류를 가져와 큰 방 배치도 파일을 만듭니다. */
async function bigPlanFile(page: Page): Promise<Buffer> {
	await openSample(page);
	const downloading = page.waitForEvent('download');
	await page.getByRole('button', { name: '내보내기' }).click();
	const raw: unknown = JSON.parse(await readFile(await (await downloading).path(), 'utf8'));
	if (typeof raw !== 'object' || raw === null || !('items' in raw) || !Array.isArray(raw.items)) {
		throw new Error('내보낸 배치도 파일 형식이 다릅니다.');
	}
	const kinds = raw.items.filter(isItem);
	const columns = 20;
	const step = (ROOM_CM - 100) / columns;
	const items = Array.from({ length: ITEMS }, (_, index) => {
		const kind = kinds[index % kinds.length];
		return {
			...kind,
			id: `perf-${index}`,
			x: 50 + (index % columns) * step,
			y: 50 + Math.floor(index / columns) * step
		};
	});
	const plan = {
		...raw,
		name: '큰 방 성능',
		room: { width: ROOM_CM, depth: ROOM_CM, openings: [] },
		items
	};
	return Buffer.from(JSON.stringify(plan));
}

test('큰 방(물건 300개)에서 끌기와 키보드 이동이 끊기지 않습니다', async ({ page }) => {
	test.slow();
	const file = await bigPlanFile(page);
	await page.goto('/');
	await page.locator('input[type="file"]').setInputFiles({
		name: 'big.json',
		mimeType: 'application/json',
		buffer: file
	});
	await page.waitForURL(/\/plans\//);
	await expect(page.locator('[data-item-id]')).toHaveCount(ITEMS);

	await page.evaluate(() => {
		const durations: number[] = [];
		new PerformanceObserver((list) => {
			for (const entry of list.getEntries()) durations.push(entry.duration);
		}).observe({ type: 'event', buffered: true, durationThreshold: 16 });
		Object.assign(window, { __eventDurations: durations });
	});

	// 끄는 동안 프레임 간격 모으기
	await page.evaluate(() => {
		const gaps: number[] = [];
		let last = performance.now();
		const tick = (now: number) => {
			gaps.push(now - last);
			last = now;
			if (Object.hasOwn(window, '__frameGaps')) requestAnimationFrame(tick);
		};
		Object.assign(window, { __frameGaps: gaps });
		requestAnimationFrame(tick);
	});
	// 가져올 때 id를 새로 만드므로 순서로 고릅니다.
	const target = page.locator('[data-item-id]').nth(21);
	const box = await target.boundingBox();
	if (!box) throw new Error('끌 물건이 없습니다');
	const [x, y] = [box.x + box.width / 2, box.y + box.height / 2];
	await page.mouse.move(x, y);
	await page.mouse.down();
	await page.mouse.move(x + 120, y + 80, { steps: 40 });
	await page.mouse.up();
	const gaps = await page.evaluate(() => {
		const value: unknown = Reflect.get(window, '__frameGaps');
		Reflect.deleteProperty(window, '__frameGaps');
		return Array.isArray(value)
			? value.filter((gap): gap is number => typeof gap === 'number')
			: [];
	});

	// 키보드로 옮기기
	await target.focus();
	for (let i = 0; i < 10; i++) await page.keyboard.press('ArrowRight');
	await expect(page.locator('p.sr-only[role="status"]')).toContainText('오른쪽으로');
	await page.waitForTimeout(500);

	const durations = await page.evaluate(() => {
		const value: unknown = Reflect.get(window, '__eventDurations');
		return Array.isArray(value) ? value.filter((d): d is number => typeof d === 'number') : [];
	});
	const frames = gaps.slice(1);
	const longest = Math.max(0, ...frames);
	const slowRatio = frames.filter((gap) => gap > 50).length / Math.max(1, frames.length);
	const inp = Math.max(0, ...durations);
	test.info().annotations.push({
		type: 'perf',
		description: `프레임 ${frames.length}개, 가장 긴 간격 ${longest.toFixed(0)}ms, 50ms 넘는 비율 ${(slowRatio * 100).toFixed(1)}%, 가장 긴 조작 ${inp.toFixed(0)}ms`
	});
	console.log(test.info().annotations.at(-1)?.description);

	expect(inp, '가장 긴 조작 처리 시간(INP)').toBeLessThanOrEqual(INP_LIMIT_MS);
	expect(longest, '가장 긴 프레임 간격').toBeLessThanOrEqual(LONGEST_FRAME_LIMIT_MS);
	expect(slowRatio, '50ms 넘는 프레임 비율').toBeLessThanOrEqual(SLOW_FRAME_RATIO_LIMIT);
});
