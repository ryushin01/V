import { afterEach, describe, expect, it, vi } from 'vitest';
import { protectStorage } from './index';

const original = Object.getOwnPropertyDescriptor(navigator, 'storage');

function mockStorage(storage: Partial<StorageManager> | undefined) {
	Object.defineProperty(navigator, 'storage', { value: storage, configurable: true });
}

afterEach(() => {
	if (original) Object.defineProperty(navigator, 'storage', original);
	else delete (navigator as { storage?: unknown }).storage;
});

describe('protectStorage', () => {
	it('이미 보호되어 있으면 다시 묻지 않습니다', async () => {
		const persist = vi.fn();
		mockStorage({ persisted: async () => true, persist });
		expect(await protectStorage()).toBe(true);
		expect(persist).not.toHaveBeenCalled();
	});

	it('보호되지 않았으면 요청하고 결과를 돌려줍니다', async () => {
		const persist = vi.fn(async () => true);
		mockStorage({ persisted: async () => false, persist });
		expect(await protectStorage()).toBe(true);
		expect(persist).toHaveBeenCalledTimes(1);
	});

	it('지원하지 않거나 실패해도 던지지 않습니다', async () => {
		mockStorage(undefined);
		expect(await protectStorage()).toBe(false);
		mockStorage({
			persisted: async () => {
				throw new Error('막힘');
			},
			persist: async () => true
		});
		expect(await protectStorage()).toBe(false);
	});
});
