// 웹 앱 매니페스트 아이콘(512px, 마스크용 512px)을 원본 글자 그림에서 만듭니다.
// 원본: scripts/brand/letter-v-512.png (Flaticon "Letter v", arnikahossain, 저작자 표기 조건 — README 출처 참고)
// 사용: pnpm icons
import { chromium } from '@playwright/test';
import { readFile, writeFile } from 'node:fs/promises';

const SOURCE = 'scripts/brand/letter-v-512.png';
/** 지금 아이콘(icon-192.png)과 같은 비율: 흰 둥근 사각형 반지름 약 21%, 글자 높이 약 68% */
const ICONS = [
	{ file: 'static/icon-512.png', size: 512, radius: 0.21, glyph: 0.84 },
	// 마스크용은 가장자리까지 흰 바탕을 채우고, 글자를 가운데 안전 영역(지름 80%) 안에 둡니다.
	{ file: 'static/icon-maskable-512.png', size: 512, radius: 0, glyph: 0.62 }
];

const browser = await chromium.launch();
const page = await browser.newPage();
const source = `data:image/png;base64,${(await readFile(SOURCE)).toString('base64')}`;
for (const icon of ICONS) {
	const data = await page.evaluate(
		async ({ source, size, radius, glyph }) => {
			const image = new Image();
			image.src = source;
			await image.decode();
			const canvas = document.createElement('canvas');
			canvas.width = size;
			canvas.height = size;
			const g = canvas.getContext('2d');
			g.imageSmoothingQuality = 'high';
			g.fillStyle = '#fff';
			g.beginPath();
			g.roundRect(0, 0, size, size, radius * size);
			g.fill();
			const drawn = size * glyph;
			g.drawImage(image, (size - drawn) / 2, (size - drawn) / 2, drawn, drawn);
			return canvas.toDataURL('image/png');
		},
		{ source, ...icon }
	);
	await writeFile(icon.file, Buffer.from(data.split(',')[1], 'base64'));
	console.log('저장', icon.file);
}
await browser.close();
