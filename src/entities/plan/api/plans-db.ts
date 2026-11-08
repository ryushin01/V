import type { PlanData } from '../model/types';

const DB_NAME = 'v-setup-planner';
const STORE = 'plans';

function openDatabase(): Promise<IDBDatabase> {
	return new Promise((resolve, reject) => {
		const request = indexedDB.open(DB_NAME, 1);
		request.onupgradeneeded = () => {
			request.result.createObjectStore(STORE, { keyPath: 'id' });
		};
		request.onsuccess = () => resolve(request.result);
		request.onerror = () => reject(request.error);
	});
}

async function run<T>(
	mode: IDBTransactionMode,
	action: (store: IDBObjectStore) => IDBRequest<T>
): Promise<T> {
	const database = await openDatabase();
	try {
		return await new Promise<T>((resolve, reject) => {
			const transaction = database.transaction(STORE, mode);
			const request = action(transaction.objectStore(STORE));
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
	return plans.sort((a, b) => b.updatedAt - a.updatedAt);
}

export function getPlan(id: string): Promise<PlanData | undefined> {
	return run<PlanData | undefined>('readonly', (store) => store.get(id));
}

export async function savePlan(plan: PlanData): Promise<void> {
	await run('readwrite', (store) => store.put(plan));
}

export async function deletePlan(id: string): Promise<void> {
	await run('readwrite', (store) => store.delete(id));
}
