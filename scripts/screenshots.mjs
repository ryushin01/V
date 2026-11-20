// README 화면(docs/images/*.jpg)과 공유 미리보기 그림(static/og-image.jpg)을 다시 찍습니다.
// 배치는 예시 배치와 가상 평면도만 씁니다.
// 먼저 프로덕션 빌드를 띄워 두세요: pnpm build && pnpm preview
// 사용: BASE_URL=http://localhost:4173 pnpm screenshots
import { chromium } from '@playwright/test';

const BASE = process.env.BASE_URL ?? 'http://localhost:4173';
const OUT = 'docs/images';
const browser = await chromium.launch();

async function open({
	viewport = { width: 1440, height: 900 },
	scale = 1,
	colorScheme = 'light'
} = {}) {
	const context = await browser.newContext({
		viewport,
		deviceScaleFactor: scale,
		colorScheme,
		locale: 'ko-KR'
	});
	// 홈 인트로는 아래에서 따로 찍습니다. 나머지 화면은 인트로를 이미 본 것으로 둡니다.
	await context.addInitScript(() => sessionStorage.setItem('v-intro', 'seen'));
	const page = await context.newPage();
	await page.goto(BASE + '/', { waitUntil: 'networkidle' });
	await page.evaluate(() => document.fonts.ready);
	await page.waitForTimeout(1200);
	return { page, context };
}

async function shot(target, name, wait = 1200) {
	const page = 'page' in target ? target.page() : target;
	await page.waitForTimeout(wait);
	await target.screenshot({ path: `${OUT}/${name}.jpg`, type: 'jpeg', quality: 85 });
	console.log('저장', name);
}

async function openSample(page) {
	await page.getByRole('button', { name: '예시로 시작하기' }).click();
	await page.waitForURL(/\/plans\//);
	await page.getByRole('heading', { name: '물건 추가' }).waitFor();
	await page.waitForTimeout(800);
}

async function openEmpty(page) {
	await page.getByRole('button', { name: /새 배치도 만들기/ }).click();
	await page.waitForURL(/\/plans\//);
	await page.getByRole('heading', { name: '물건 추가' }).waitFor();
}

/** 검색해서 물건을 놓습니다. */
async function add(page, query) {
	await page.getByLabel('모델명이나 제조사로 찾기').fill(query);
	await page
		.getByRole('button', { name: new RegExp(`${query}.*배치도에 추가`, 'i') })
		.first()
		.click();
	await page.waitForTimeout(300);
}

/** 고른 물건을 X·Y(cm)로 옮깁니다. */
async function place(page, x, y) {
	for (const [label, value] of [
		['X', x],
		['Y', y]
	]) {
		const field = page.getByLabel(label, { exact: true });
		await field.fill(String(value));
		await field.press('Tab');
	}
	await page.waitForTimeout(200);
}

/** 가상의 평면도 그림(PNG)을 브라우저에서 그려 돌려줍니다. */
async function samplePlan(page) {
	const data = await page.evaluate(() => {
		const canvas = document.createElement('canvas');
		canvas.width = 900;
		canvas.height = 700;
		const g = canvas.getContext('2d');
		g.fillStyle = '#fff';
		g.fillRect(0, 0, 900, 700);
		// 바닥(나무색)과 벽
		g.fillStyle = '#ead9bf';
		g.beginPath();
		g.moveTo(60, 60);
		g.lineTo(620, 60);
		g.lineTo(620, 260);
		g.lineTo(840, 260);
		g.lineTo(840, 640);
		g.lineTo(60, 640);
		g.closePath();
		g.fill();
		g.strokeStyle = '#222';
		g.lineWidth = 10;
		g.beginPath();
		g.moveTo(60, 60);
		g.lineTo(620, 60);
		g.lineTo(620, 260);
		g.lineTo(840, 260);
		g.lineTo(840, 640);
		g.lineTo(60, 640);
		g.closePath();
		g.stroke();
		g.lineWidth = 3;
		g.strokeRect(120, 120, 220, 120);
		g.beginPath();
		g.arc(60, 520, 110, -Math.PI / 2, 0);
		g.stroke();
		g.font = '28px sans-serif';
		g.fillStyle = '#555';
		g.fillText('거실', 420, 460);
		g.fillText('발코니', 680, 200);
		g.strokeRect(500, 520, 260, 90);
		g.fillText('수납장', 580, 575);
		return canvas.toDataURL('image/png').split(',')[1];
	});
	return { name: 'plan.png', mimeType: 'image/png', buffer: Buffer.from(data, 'base64') };
}

// 첫 화면과 완성 도면(1.5배 해상도)
{
	const { page, context } = await open({ scale: 1.5 });
	await shot(page, 'home');
	// 단계 구역의 끝(점검 단계)까지 내려 도면이 다 그려진 때를 찍습니다.
	await page.evaluate(() => {
		const plan = document.querySelector('[aria-label^="벽에서 시작해"]');
		let section = plan?.parentElement;
		while (section && section.offsetHeight < window.innerHeight * 1.5)
			section = section.parentElement;
		if (!section) return;
		const top = section.getBoundingClientRect().top + window.scrollY;
		window.scrollTo({
			top: top + section.offsetHeight - window.innerHeight * 1.05,
			behavior: 'instant'
		});
	});
	await shot(page, 'build', 2500);
	await context.close();
}

// 편집 화면: 예시 배치, 책상 선택, X-ray, 점검 패널, 제품 등록 창
{
	const { page, context } = await open();
	await openSample(page);
	await page.getByRole('button', { name: /^책상/ }).first().click();
	await shot(page, 'editor');
	await page.getByRole('button', { name: 'X-ray' }).click();
	await shot(page, 'xray', 1500);
	await page.getByRole('button', { name: 'X-ray' }).click();
	// 소파를 TV 쪽으로 옮겨 시청 거리 주의가 뜬 점검 패널을 찍습니다.
	await page
		.getByRole('button', { name: /^2인 소파/ })
		.first()
		.click();
	const sofaX = page.getByLabel('X', { exact: true });
	await sofaX.fill(String(Number(await sofaX.inputValue()) + 90));
	await sofaX.press('Tab');
	await shot(page.locator('section[aria-labelledby="review-heading"]'), 'review');
	await page.getByRole('button', { name: '제품 등록' }).click();
	await shot(page, 'custom');
	await context.close();
}

// 모델별 일러스트: 빈 배치도에 데스크 셋업을 놓습니다.
{
	const { page, context } = await open();
	await openEmpty(page);
	// 물건을 놓은 뒤 가운데 X·Y(cm)로 자리를 잡습니다(책상 위 모니터·선반·스피커·키보드, 앞에 의자).
	const setup = [
		['BARCO', 200, 45],
		['STILO', 200, 17],
		['Odyssey OLED G9', 200, 27],
		['QR65 패시브', 128, 22],
		['QR65 액티브', 272, 22],
		['FC980C', 190, 68],
		['Stream Deck', 245, 68],
		['LiberNovo', 200, 135]
	];
	for (const [query, x, y] of setup) {
		await add(page, query);
		await place(page, x, y);
	}
	// 검색어를 지워 최근 추가한 물건 목록이 보이게 하고, 방 밖 빈 곳을 눌러 선택을 풉니다.
	await page.getByLabel('모델명이나 제조사로 찾기').fill('');
	await page.mouse.click(700, 160);
	await page.evaluate(() => document.activeElement?.blur());
	await page.mouse.move(40, 880);
	await shot(page, 'models');
	await context.close();
}

// 거리 재기: 예시 배치에서 책상 앞쪽과 소파 사이를 잽니다.
{
	const { page, context } = await open();
	await openSample(page);
	await page.getByRole('button', { name: '거리 재기' }).click();
	const canvas = page.getByRole('group', { name: /방 배치도/ });
	const box = await canvas.boundingBox();
	await page.mouse.click(box.x + box.width * 0.3, box.y + box.height * 0.42);
	await page.mouse.click(box.x + box.width * 0.53, box.y + box.height * 0.42);
	await page.mouse.move(box.x + box.width * 0.53, box.y + box.height * 0.42);
	await shot(page, 'measure');
	await context.close();
}

// 평면도 그림 깔기와 모서리 잘라내기
{
	const { page, context } = await open();
	await openEmpty(page);
	await page
		.locator('input[type="file"][accept*="image"]')
		.first()
		.setInputFiles(await samplePlan(page));
	await page.getByRole('button', { name: /모서리 잘라내기/ }).click();
	await add(page, '책상');
	await add(page, '의자');
	await shot(page, 'underlay');
	await context.close();
}

// 어두운 화면과 모바일
{
	const { page, context } = await open({ colorScheme: 'dark' });
	await openSample(page);
	await shot(page, 'dark');
	await context.close();
}
{
	const { page, context } = await open({ viewport: { width: 390, height: 844 } });
	await openSample(page);
	await shot(page, 'mobile');
	await context.close();
}

// 홈 인트로: 탭에서 처음 홈에 들어올 때 재생됩니다. 흰 역정삼각형에 로고가 얹힌 순간(0.9초)에 멈춰 찍습니다.
{
	const context = await browser.newContext({
		viewport: { width: 1440, height: 900 },
		deviceScaleFactor: 1.5,
		colorScheme: 'light',
		locale: 'ko-KR'
	});
	const page = await context.newPage();
	await page.goto(BASE + '/', { waitUntil: 'commit' });
	const intro = page.getByTestId('home-intro');
	await page.waitForFunction(
		() =>
			(document.querySelector('[data-testid="home-intro"]')?.getAnimations({ subtree: true })
				.length ?? 0) > 0
	);
	await intro.evaluate((el) => el.getAnimations({ subtree: true }).forEach((a) => a.pause()));
	// 로고는 CSS 배경 그림이라 미리 받아 둔 뒤 찍습니다.
	await page.evaluate(
		() =>
			new Promise((resolve) => {
				const logo = new Image();
				logo.onload = logo.onerror = resolve;
				logo.src = '/brand/logo-512.png';
			})
	);
	await intro.evaluate((el) =>
		el.getAnimations({ subtree: true }).forEach((a) => (a.currentTime = 900))
	);
	await shot(page, 'intro', 100);
	await context.close();
}

// 공유 미리보기(OG) 그림: 첫 화면을 1200×630으로 찍습니다. 동작 줄이기로 등장 효과 없이 찍습니다.
{
	const context = await browser.newContext({
		viewport: { width: 1200, height: 630 },
		colorScheme: 'light',
		reducedMotion: 'reduce',
		locale: 'ko-KR'
	});
	const page = await context.newPage();
	await page.goto(BASE + '/', { waitUntil: 'networkidle' });
	await page.evaluate(() => document.fonts.ready);
	await page.waitForTimeout(1200);
	await page.screenshot({ path: 'static/og-image.jpg', type: 'jpeg', quality: 86 });
	console.log('저장 og-image');
	await context.close();
}

await browser.close();
