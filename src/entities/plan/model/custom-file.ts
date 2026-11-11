import { parseCustomEntry } from './custom';
import { PLAN_LIMITS } from './room';
import type { CatalogEntry } from './types';

/** 내 제품만 담은 파일의 형식 이름입니다. 배치도 파일과 구분합니다. */
export const CUSTOM_FILE_FORMAT = 'v-custom-products';
const CUSTOM_FILE_VERSION = 1;
/**
 * 한 브라우저에 둘 수 있는 내 제품 수이자 한 파일의 한도입니다. 저장할 때 이 수를 넘지 않게 막아,
 * 내보낸 파일은 언제나 다시 가져올 수 있습니다. 배치도 한 장의 항목 한도와 같습니다.
 */
export const CUSTOM_PRODUCT_LIMIT = PLAN_LIMITS.items;

export type CustomFileResult =
	| { ok: true; entries: CatalogEntry[]; skipped: number; source: 'products' | 'plan' }
	| { ok: false; error: string };

const isRecord = (value: unknown): value is Record<string, unknown> =>
	typeof value === 'object' && value !== null && !Array.isArray(value);

/** 내 제품 목록을 다른 기기로 옮길 JSON 문자열로 만듭니다. */
export function stringifyCustomProducts(entries: readonly CatalogEntry[]): string {
	return JSON.stringify(
		{
			format: CUSTOM_FILE_FORMAT,
			version: CUSTOM_FILE_VERSION,
			exportedAt: new Date().toISOString(),
			products: entries
		},
		null,
		2
	);
}

/**
 * 내 제품 파일을 읽습니다. 배치도 파일을 넣으면 그 배치도에 담긴 내 제품 정의를 꺼냅니다.
 * 잘못된 항목은 건너뛰고 수를 알려 주며, 같은 id가 여러 번 있으면 마지막 것을 씁니다.
 */
export function parseCustomProductsFile(text: string): CustomFileResult {
	let raw: unknown;
	try {
		raw = JSON.parse(text);
	} catch {
		return { ok: false, error: 'JSON 파일이 아닙니다.' };
	}
	if (!isRecord(raw)) return { ok: false, error: '내 제품 파일이 아닙니다.' };

	let list: unknown;
	let source: 'products' | 'plan';
	if (raw.format === CUSTOM_FILE_FORMAT) {
		if (raw.version !== CUSTOM_FILE_VERSION) {
			return { ok: false, error: '이 버전에서 읽을 수 없는 내 제품 파일입니다.' };
		}
		list = raw.products;
		source = 'products';
	} else if (Array.isArray(raw.items) && isRecord(raw.room)) {
		list = raw.customEntries ?? [];
		source = 'plan';
	} else {
		return { ok: false, error: '내 제품 파일이나 배치도 파일이 아닙니다.' };
	}
	if (!Array.isArray(list)) return { ok: false, error: '제품 목록을 읽을 수 없습니다.' };
	if (list.length > CUSTOM_PRODUCT_LIMIT) {
		return { ok: false, error: `한 파일에 ${CUSTOM_PRODUCT_LIMIT}개까지 가져올 수 있습니다.` };
	}

	// 파일의 같은 id는 마지막 것만 남깁니다.
	const byId = new Map<string, CatalogEntry>();
	let skipped = 0;
	for (const item of list) {
		const entry = parseCustomEntry(item);
		if (entry) byId.set(entry.id, entry);
		else skipped += 1;
	}
	if (byId.size === 0) {
		return {
			ok: false,
			error:
				source === 'plan'
					? '이 배치도에는 직접 등록한 제품이 없습니다.'
					: '가져올 수 있는 제품이 없습니다.'
		};
	}
	return { ok: true, entries: [...byId.values()], skipped, source };
}
