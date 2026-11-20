#!/usr/bin/env node
// My-First-Gear 쇼핑몰의 상품 목록(/feed/gear.json)을 받아 src/entities/plan/model/sync/shop-feed.ts로 저장합니다.
// V는 이 파일에서 자기에게 없는 제품만 카탈로그 항목으로 만듭니다(from-shop.ts).
//
//   node scripts/sync-shop-feed.mjs              쇼핑몰 운영 사이트에서 받습니다
//   node scripts/sync-shop-feed.mjs --from a.json  파일에서 읽습니다
//
// 받은 값은 정해 둔 필드만 골라 검사합니다. 하나라도 어긋나면 파일을 바꾸지 않고 실패합니다.
// 배치도에 놓을 수 없는 상품(CPU, 자동차 등)은 쓰지 않으므로 저장하지 않습니다(번들을 가볍게).
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const FEED_URL =
	process.env.SHOP_FEED_URL ?? 'https://my-first-gear-ryushin01.vercel.app/feed/gear.json';

/** 배치도에 놓을 수 있는 쇼핑몰 카테고리. from-shop.ts의 BASES와 같게 둡니다. */
export const PLACEABLE = new Set([
	'monitor',
	'keyboard',
	'mouse',
	'chair',
	'desk',
	'monitor-arm',
	'lighting',
	'speaker',
	'microphone',
	'headphone',
	'earphone',
	'dap',
	'amp-dac',
	'instrument',
	'console',
	'laptop',
	'desktop',
	'case',
	'electronics',
	'furniture',
	'desk-accessory'
]);

const ID = /^[a-z0-9][a-z0-9-]{0,99}$/;
const WORD = /^[a-z][a-z-]{0,39}$/;

/**
 * @param {unknown} value
 * @param {string} field
 * @param {number} [max]
 * @returns {string}
 */
function text(value, field, max = 200) {
	if (typeof value !== 'string' || value.trim() === '' || value.length > max)
		throw new Error(`${field}: 1~${max}자 문자열이 아닙니다`);
	return value;
}

/**
 * @param {unknown} value
 * @param {string} field
 * @param {number} min
 * @param {number} max
 * @returns {number}
 */
function number(value, field, min, max) {
	if (typeof value !== 'number' || !Number.isFinite(value) || value < min || value > max)
		throw new Error(`${field}: ${min}~${max} 사이 숫자가 아닙니다`);
	return value;
}

/**
 * @param {unknown} value
 * @param {string} field
 * @param {RegExp} re
 * @returns {string}
 */
function pattern(value, field, re) {
	if (typeof value !== 'string' || !re.test(value))
		throw new Error(`${field}: 형식이 맞지 않습니다 (${JSON.stringify(value)})`);
	return value;
}

/** @typedef {import('../src/entities/plan/model/sync/feeds').ShopFeedItem} ShopFeedItem */
/** @typedef {import('../src/entities/plan/model/sync/feeds').ShopFeed} ShopFeed */

/**
 * 정해 둔 필드만 골라 새 객체를 만듭니다. 모르는 필드는 버립니다.
 * @param {any} raw
 * @param {number} index
 * @returns {ShopFeedItem}
 */
function item(raw, index) {
	const at = `items[${index}]`;
	if (!raw || typeof raw !== 'object') throw new Error(`${at}: 객체가 아닙니다`);
	/** @type {ShopFeedItem} */
	const out = {
		id: pattern(raw.id, `${at}.id`, ID),
		name: text(raw.name, `${at}.name`),
		brand: text(raw.brand, `${at}.brand`),
		category: pattern(raw.category, `${at}.category`, WORD),
		price: number(raw.price, `${at}.price`, 0, 10_000_000_000)
	};
	if (raw.aliases !== undefined) {
		if (!Array.isArray(raw.aliases) || raw.aliases.length > 10)
			throw new Error(`${at}.aliases: 10개 이하 배열이 아닙니다`);
		out.aliases = raw.aliases.map((/** @type {unknown} */ alias, /** @type {number} */ i) =>
			pattern(alias, `${at}.aliases[${i}]`, ID)
		);
	}
	if (raw.widthCm !== undefined) out.widthCm = number(raw.widthCm, `${at}.widthCm`, 0.1, 1000);
	if (raw.depthCm !== undefined) out.depthCm = number(raw.depthCm, `${at}.depthCm`, 0.1, 1000);
	if (raw.diagonalInch !== undefined)
		out.diagonalInch = number(raw.diagonalInch, `${at}.diagonalInch`, 1, 200);
	if (raw.aspect !== undefined)
		out.aspect = pattern(raw.aspect, `${at}.aspect`, /^\d{1,2}:\d{1,2}$/);
	if (raw.layout !== undefined) out.layout = text(raw.layout, `${at}.layout`, 60);
	return out;
}

/**
 * @param {any} raw
 * @returns {ShopFeed}
 */
export function parseFeed(raw) {
	if (!raw || typeof raw !== 'object') throw new Error('피드가 객체가 아닙니다');
	if (raw.version !== 1) throw new Error(`모르는 피드 버전입니다: ${raw.version}`);
	if (raw.source !== 'my-first-gear') throw new Error(`쇼핑몰 피드가 아닙니다: ${raw.source}`);
	if (!Array.isArray(raw.items) || raw.items.length === 0 || raw.items.length > 5000)
		throw new Error('items는 1~5000개여야 합니다');
	const items = raw.items.map(item);
	/** @type {Set<string>} */
	const seen = new Set();
	for (const { id } of items) {
		if (seen.has(id)) throw new Error(`id가 겹칩니다: ${id}`);
		seen.add(id);
	}
	return { version: 1, source: 'my-first-gear', items };
}

/**
 * 쇼핑몰에서 빠진 상품도 판매 종료로 남깁니다. 이미 놓은 배치도에서 물건이 사라지지 않게 합니다.
 * 다시 피드에 나오면 판매 중으로 돌아갑니다.
 * @param {ShopFeedItem[]} previous 이전 스냅샷의 상품
 * @param {ShopFeedItem[]} current 이번 피드의 상품(놓을 수 있는 것만)
 * @returns {ShopFeedItem[]}
 */
export function keepDiscontinued(previous, current) {
	const ids = new Set(current.map((entry) => entry.id));
	const gone = previous
		.filter((entry) => !ids.has(entry.id))
		.map((entry) => ({ ...entry, discontinued: true }));
	return [...current, ...gone];
}

/**
 * 저장해 둔 스냅샷 파일의 상품을 읽습니다. 파일이 없거나 읽을 수 없으면 빈 목록입니다.
 * @param {string} text 스냅샷 파일 내용
 * @returns {ShopFeedItem[]}
 */
export function snapshotItems(text) {
	const start = text.indexOf('= {');
	if (start === -1) return [];
	try {
		const raw = JSON.parse(text.slice(start + 2, text.lastIndexOf('}') + 1));
		if (!Array.isArray(raw.items)) return [];
		// 직접 쓴 파일이지만 다시 검사해, 손상된 항목은 남기지 않습니다.
		return raw.items.flatMap((/** @type {unknown} */ entry, /** @type {number} */ index) => {
			try {
				return [item(entry, index)];
			} catch {
				return [];
			}
		});
	} catch {
		return [];
	}
}

/** @returns {Promise<unknown>} */
async function load() {
	const from = process.argv.indexOf('--from');
	if (from !== -1) return JSON.parse(await readFile(process.argv[from + 1], 'utf8'));
	const res = await fetch(FEED_URL, {
		signal: AbortSignal.timeout(20_000),
		headers: { accept: 'application/json' }
	});
	if (!res.ok) throw new Error(`쇼핑몰 피드를 받지 못했습니다: HTTP ${res.status}`);
	return res.json();
}

const HEADER = `// 자동 생성 파일. scripts/sync-shop-feed.mjs가 My-First-Gear의 /feed/gear.json에서 받아 씁니다. 손으로 고치지 않습니다.
import type { ShopFeed } from './feeds';

export const SHOP_FEED: ShopFeed = `;

if (import.meta.url.startsWith('file:') && process.argv[1] === fileURLToPath(import.meta.url)) {
	const OUT = fileURLToPath(
		new URL('../src/entities/plan/model/sync/shop-feed.ts', import.meta.url)
	);
	try {
		const parsed = parseFeed(await load());
		const prev = await readFile(OUT, 'utf8').catch(() => '');
		const current = parsed.items.filter((entry) => PLACEABLE.has(entry.category));
		const feed = { ...parsed, items: keepDiscontinued(snapshotItems(prev), current) };
		const next = `${HEADER}${JSON.stringify(feed, null, '\t')};\n`;
		if (prev === next) {
			console.log(
				`쇼핑몰 피드 그대로: 상품 ${feed.items.length}개 (전체 ${parsed.items.length}개)`
			);
		} else {
			await writeFile(OUT, next);
			console.log(
				`쇼핑몰 피드 갱신: 상품 ${feed.items.length}개 (전체 ${parsed.items.length}개) → ${OUT}`
			);
		}
	} catch (error) {
		console.error(`쇼핑몰 피드 동기화 실패: ${error instanceof Error ? error.message : error}`);
		process.exit(1);
	}
}
