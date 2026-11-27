import { IDBFactory, IDBObjectStore } from 'fake-indexeddb';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createCustomEntry } from '../model/custom';
import { createEmptyPlan } from '../model/factory';
import {
	getPlan,
	listCustomProducts,
	listPlans,
	restoreBackup,
	saveCustomProduct,
	savePlan
} from './plans-db';

/** 테스트마다 빈 IndexedDB를 씁니다. */
beforeEach(() => {
	vi.stubGlobal('indexedDB', new IDBFactory());
});

afterEach(() => {
	vi.unstubAllGlobals();
	vi.restoreAllMocks();
});

const product = createCustomEntry({
	id: 'custom-db-error',
	name: '저장 오류 제품',
	brand: '',
	kind: 'decor',
	width: 10,
	depth: 10,
	watts: 0,
	cable: 0,
	glyph: ''
});

/** 다음 저장부터 같은 id를 add로 넣게 바꿔, 이미 있는 항목이면 트랜잭션이 실패하게 합니다(저장 공간 오류 등과 같은 경로). */
function failNextWrites() {
	vi.spyOn(IDBObjectStore.prototype, 'put').mockImplementation(function (
		this: IDBObjectStore,
		value: unknown
	) {
		return this.add(value);
	});
}

function openRaw(version: number, stores: string[]): Promise<void> {
	return new Promise((resolve, reject) => {
		const request = indexedDB.open('v-setup-planner', version);
		request.onupgradeneeded = () => {
			for (const name of stores) request.result.createObjectStore(name, { keyPath: 'id' });
		};
		request.onsuccess = () => {
			request.result.close();
			resolve();
		};
		request.onerror = () => reject(request.error);
	});
}

describe('IndexedDB 저장소 열기', () => {
	it('배치도 저장소만 있던 옛 데이터베이스를 열면 내 제품 저장소를 더하고 배치도는 남깁니다', async () => {
		await openRaw(1, ['plans']);
		const plan = createEmptyPlan('옛 배치도');
		await savePlan(plan);
		expect(await listCustomProducts()).toEqual([]);
		expect((await listPlans()).map((saved) => saved.name)).toEqual(['옛 배치도']);
	});

	it('두 저장소가 이미 있으면 그대로 씁니다', async () => {
		await openRaw(1, ['plans', 'custom-products']);
		expect(await listPlans()).toEqual([]);
	});

	it('더 새 버전 앱이 만든 데이터베이스는 열지 못했다고 알립니다', async () => {
		await openRaw(3, ['plans', 'custom-products']);
		await expect(listPlans()).rejects.toBeTruthy();
	});

	it('없는 배치도는 undefined, 내 제품 없는 백업도 배치도만 되살립니다', async () => {
		expect(await getPlan('없음')).toBeUndefined();
		const plan = createEmptyPlan('백업');
		await restoreBackup([plan], []);
		expect((await getPlan(plan.id))?.name).toBe('백업');
	});

	it('트랜잭션이 실패하면 배치도·내 제품·백업 저장이 모두 실패한 이유와 함께 알립니다', async () => {
		const plan = createEmptyPlan('이미 있음');
		await savePlan(plan);
		await saveCustomProduct(product);
		failNextWrites();
		// error 이벤트 때 비어 있는 transaction.error(null)가 아니라 실패한 요청의 오류로 알립니다.
		const constraint = { name: 'ConstraintError' };
		await expect(savePlan(plan)).rejects.toMatchObject(constraint);
		await expect(saveCustomProduct(product)).rejects.toMatchObject(constraint);
		await expect(restoreBackup([plan], [product])).rejects.toMatchObject(constraint);
	});
});
