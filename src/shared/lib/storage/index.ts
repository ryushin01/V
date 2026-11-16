/**
 * 브라우저가 저장 공간이 모자라거나 오래 쓰지 않을 때 이 사이트의 데이터(IndexedDB)를 지우지 않도록 요청합니다.
 * 배치도를 만들거나 가져오는 사용자 동작에서 부릅니다. 이미 보호되었거나 지원하지 않으면 묻지 않고,
 * 파이어폭스는 허용 여부를 한 번 묻습니다. 결과는 기다리지 않아도 됩니다.
 */
export async function protectStorage(): Promise<boolean> {
	try {
		if (typeof navigator === 'undefined' || !navigator.storage?.persist) return false;
		if (await navigator.storage.persisted()) return true;
		return await navigator.storage.persist();
	} catch {
		return false;
	}
}
