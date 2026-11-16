import { parseCustomEntry } from './custom';
import { CUSTOM_PRODUCT_LIMIT } from './custom-file';
import { finite, isRecord } from './guards';
import { parsePlanData, type ParseResult } from './serialize';
import type { CatalogEntry, PlanData } from './types';

/** 이 브라우저의 모든 배치도와 내 제품을 한 파일로 옮기는 형식입니다. */
const BACKUP_FORMAT = 'v-backup';
const BACKUP_VERSION = 1;
/** 한 번에 가져올 배치도 수 */
export const BACKUP_PLAN_LIMIT = 500;
/**
 * 백업 파일 크기 한도. 평면도 이미지가 있는 배치도 수십 개를 담을 수 있고, 이보다 큰 파일은 읽기 전에
 * 거절합니다. 배치도 파일 하나만 고른 경우도 이 한도로 읽은 뒤 배치도 검사가 크기를 다시 봅니다.
 */
export const BACKUP_FILE_MAX_BYTES = 256 * 1024 * 1024;

export function stringifyBackup(
	plans: readonly PlanData[],
	products: readonly CatalogEntry[]
): string {
	return JSON.stringify({
		format: BACKUP_FORMAT,
		version: BACKUP_VERSION,
		exportedAt: new Date().toISOString(),
		plans,
		products
	});
}

export type ImportResult =
	| { ok: true; kind: 'plan'; plan: PlanData }
	| {
			ok: true;
			kind: 'backup';
			plans: PlanData[];
			products: CatalogEntry[];
			/** 읽을 수 없어 건너뛴 배치도와 내 제품 수 */
			skipped: number;
	  }
	| { ok: false; error: string };

/**
 * "JSON 불러오기"로 고른 파일을 읽습니다. 백업 파일이면 배치도와 내 제품을 항목마다 검사하고(잘못된 항목은
 * 건너뛰고 수를 셈), 아니면 배치도 파일 하나로 검사합니다. 배치도는 모두 새 id를 받아 기존 배치도를 덮지 않고,
 * 마지막으로 고친 순서를 지키도록 저장 시각은 그대로 둡니다.
 */
export function parseImportFile(text: string): ImportResult {
	let raw: unknown;
	try {
		raw = JSON.parse(text);
	} catch {
		return { ok: false, error: 'JSON 형식이 아닙니다. V에서 내보낸 파일을 골라 주세요.' };
	}
	if (!isRecord(raw) || raw.format !== BACKUP_FORMAT) {
		const result: ParseResult = parsePlanData(raw);
		return result.ok ? { ok: true, kind: 'plan', plan: result.plan } : result;
	}
	if (raw.version !== BACKUP_VERSION) {
		return { ok: false, error: '이 버전에서 읽을 수 없는 백업 파일입니다.' };
	}
	if (!Array.isArray(raw.plans) || !Array.isArray(raw.products)) {
		return { ok: false, error: '백업 파일에 배치도나 내 제품 목록이 빠져 있습니다.' };
	}
	if (raw.plans.length > BACKUP_PLAN_LIMIT || raw.products.length > CUSTOM_PRODUCT_LIMIT) {
		return {
			ok: false,
			error: `배치도는 ${BACKUP_PLAN_LIMIT}개, 내 제품은 ${CUSTOM_PRODUCT_LIMIT}개까지 한 번에 가져올 수 있습니다.`
		};
	}
	let skipped = 0;
	const plans: PlanData[] = [];
	for (const item of raw.plans) {
		const result = parsePlanData(item);
		if (!result.ok) {
			skipped += 1;
			continue;
		}
		const updatedAt = isRecord(item) && finite(item.updatedAt) ? item.updatedAt : Date.now();
		plans.push({ ...result.plan, updatedAt });
	}
	// 같은 id가 여러 번 있으면 마지막 것을 씁니다.
	const products = new Map<string, CatalogEntry>();
	for (const item of raw.products) {
		const entry = parseCustomEntry(item);
		if (entry) products.set(entry.id, entry);
		else skipped += 1;
	}
	if (plans.length === 0 && products.size === 0) {
		return { ok: false, error: '백업 파일에 가져올 수 있는 배치도나 내 제품이 없습니다.' };
	}
	return { ok: true, kind: 'backup', plans, products: [...products.values()], skipped };
}
