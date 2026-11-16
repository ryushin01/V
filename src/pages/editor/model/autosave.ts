import type { PlanData } from '#entities/plan';

/**
 * 자동 저장이 바뀐 내용인지 비교하는 문자열입니다. 저장 시각과 내 제품 정의(customEntries)는 뺍니다.
 * 내 제품 정의는 공용 등록 Map에서 오므로, 다른 탭에서 고친 정의를 다시 읽는 것(동기화, 물건 목록 갱신)만으로
 * 이 탭의 옛 배치를 저장해 다른 탭의 배치를 덮지 않게 합니다. 정의는 배치가 바뀌어 저장할 때 함께 담깁니다.
 */
export function planFingerprint(plan: PlanData): string {
	return JSON.stringify({ ...plan, updatedAt: 0, customEntries: undefined });
}
