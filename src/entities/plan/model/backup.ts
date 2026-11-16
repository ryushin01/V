import { parseCustomEntry } from './custom';
import { CUSTOM_PRODUCT_LIMIT } from './custom-file';
import { finite, isRecord } from './guards';
import { parsePlanData, type ParseResult } from './serialize';
import type { CatalogEntry, PlanData } from './types';

/** 이 브라우저의 모든 배치도와 내 제품을 한 파일로 옮기는 형식입니다. */
const BACKUP_FORMAT = 'v-backup';
const BACKUP_VERSION = 1;
/** 백업 파일 하나에 담는(그리고 한 번에 가져오는) 배치도 수 */
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

const utf8Bytes = (text: string) => new TextEncoder().encode(text).length;

/**
 * 모든 배치도와 내 제품을, 각각 다시 가져올 수 있는(배치도 수·파일 크기 한도 안의) 백업 파일로 나눕니다.
 * 보통은 파일 하나이고, 평면도 이미지가 많아 한도를 넘으면 배치도를 빠짐없이 여러 파일에 나눠 담습니다.
 * 내 제품은 첫 파일에 담습니다.
 */
export function splitBackup(
	plans: readonly PlanData[],
	products: readonly CatalogEntry[],
	limits = { plans: BACKUP_PLAN_LIMIT, bytes: BACKUP_FILE_MAX_BYTES }
): string[] {
	// 여유: 머리글(형식·버전·시각)과 배열의 쉼표
	const overhead = utf8Bytes(stringifyBackup([], [])) + 64;
	const files: { plans: PlanData[]; bytes: number }[] = [];
	let current = { plans: [] as PlanData[], bytes: overhead + utf8Bytes(JSON.stringify(products)) };
	for (const plan of plans) {
		const size = utf8Bytes(JSON.stringify(plan)) + 1;
		if (
			current.plans.length > 0 &&
			(current.plans.length >= limits.plans || current.bytes + size > limits.bytes)
		) {
			files.push(current);
			current = { plans: [], bytes: overhead };
		}
		current.plans.push(plan);
		current.bytes += size;
	}
	files.push(current);
	return files.map((file, index) => stringifyBackup(file.plans, index === 0 ? products : []));
}

/** 날짜로 보여 줄 수 있는 저장 시각인지 봅니다. 미래 시각은 지금으로 바꿉니다. */
function importedTime(value: unknown): number {
	const now = Date.now();
	return finite(value) && value > 0 && value <= now ? value : now;
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
		plans.push({ ...result.plan, updatedAt: importedTime(isRecord(item) && item.updatedAt) });
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
