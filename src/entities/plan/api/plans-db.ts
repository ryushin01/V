import { registerCustomEntries } from '../model/catalog';
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

export async function saveCustomProduct(entry: CatalogEntry): Promise<void> {
	await run('readwrite', (store) => store.put(entry), CUSTOM_STORE);
	registerCustomEntries([entry], true);
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
