import { registerCustomEntries } from '../model/catalog';
import { CUSTOM_PRODUCT_LIMIT } from '../model/custom-file';
import type { CatalogEntry, PlanData } from '../model/types';

const DB_NAME = 'v-setup-planner';
const STORE = 'plans';
const CUSTOM_STORE = 'custom-products';

function openDatabase(): Promise<IDBDatabase> {
	return new Promise((resolve, reject) => {
		const request = indexedDB.open(DB_NAME, 2);
		request.onupgradeneeded = () => {
			const database = request.result;
			if (!database.objectStoreNames.contains(STORE)) {
				database.createObjectStore(STORE, { keyPath: 'id' });
			}
			if (!database.objectStoreNames.contains(CUSTOM_STORE)) {
				database.createObjectStore(CUSTOM_STORE, { keyPath: 'id' });
			}
		};
		request.onsuccess = () => resolve(request.result);
		request.onerror = () => reject(request.error);
	});
}

async function run<T>(
	mode: IDBTransactionMode,
	action: (store: IDBObjectStore) => IDBRequest<T>,
	storeName: string = STORE
): Promise<T> {
	const database = await openDatabase();
	try {
		return await new Promise<T>((resolve, reject) => {
			const transaction = database.transaction(storeName, mode);
			const request = action(transaction.objectStore(storeName));
			transaction.oncomplete = () => resolve(request.result);
			transaction.onerror = () => reject(transaction.error);
			transaction.onabort = () => reject(transaction.error);
		});
	} finally {
		database.close();
	}
}

export async function listPlans(): Promise<PlanData[]> {
	const plans = await run<PlanData[]>('readonly', (store) => store.getAll());
	for (const plan of plans) registerCustomEntries(plan.customEntries);
	return plans.sort((a, b) => b.updatedAt - a.updatedAt);
}

export async function getPlan(id: string): Promise<PlanData | undefined> {
	const plan = await run<PlanData | undefined>('readonly', (store) => store.get(id));
	registerCustomEntries(plan?.customEntries);
	return plan;
}

/** 직접 등록한 제품 목록. 불러오면 배치도에 담긴 옛 사본보다 우선합니다. */
export async function listCustomProducts(): Promise<CatalogEntry[]> {
	const entries = await run<CatalogEntry[]>('readonly', (store) => store.getAll(), CUSTOM_STORE);
	registerCustomEntries(entries, true);
	return entries.sort((a, b) => a.name.localeCompare(b.name, 'ko'));
}

/** 저장하면 내 제품이 한도를 넘을 때 던집니다. 아무것도 저장하지 않습니다. */
export class CustomProductLimitError extends Error {
	constructor(readonly total: number) {
		super(`내 제품은 ${CUSTOM_PRODUCT_LIMIT}개까지 둘 수 있습니다.`);
		this.name = 'CustomProductLimitError';
	}
}

export async function saveCustomProduct(entry: CatalogEntry): Promise<void> {
	await saveCustomProducts([entry]);
}

/**
 * 여러 제품을 한 트랜잭션으로 저장합니다. 하나라도 실패하거나 합계가 한도를 넘으면
 * 아무것도 저장하지 않습니다.
 */
export async function saveCustomProducts(entries: readonly CatalogEntry[]): Promise<void> {
	const database = await openDatabase();
	try {
		await new Promise<void>((resolve, reject) => {
			const transaction = database.transaction(CUSTOM_STORE, 'readwrite');
			const store = transaction.objectStore(CUSTOM_STORE);
			let limitError: CustomProductLimitError | null = null;
			const keys = store.getAllKeys();
			keys.onsuccess = () => {
				const ids = new Set([...keys.result.map(String), ...entries.map((entry) => entry.id)]);
				if (ids.size > CUSTOM_PRODUCT_LIMIT) {
					limitError = new CustomProductLimitError(ids.size);
					transaction.abort();
					return;
				}
				for (const entry of entries) store.put(entry);
			};
			transaction.oncomplete = () => resolve();
			transaction.onerror = () => reject(limitError ?? transaction.error);
			transaction.onabort = () => reject(limitError ?? transaction.error);
		});
	} finally {
		database.close();
	}
	registerCustomEntries(entries, true);
}

export async function deleteCustomProduct(id: string): Promise<void> {
	await run('readwrite', (store) => store.delete(id), CUSTOM_STORE);
}

export async function savePlan(plan: PlanData): Promise<void> {
	await run('readwrite', (store) => store.put(plan));
}

export async function deletePlan(id: string): Promise<void> {
	await run('readwrite', (store) => store.delete(id));
}
