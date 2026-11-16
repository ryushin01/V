import type { PlanData } from '#entities/plan';

/**
 * 자동 저장이 바뀐 내용인지 비교하는 문자열을 만드는 함수를 돌려줍니다.
 *
 * - 저장 시각과 내 제품 정의(customEntries)는 뺍니다. 내 제품 정의는 공용 등록 Map에서 오므로, 다른 탭에서
 *   고친 정의를 다시 읽는 것(동기화, 물건 목록 갱신)만으로 이 탭의 옛 배치를 저장해 다른 탭의 배치를 덮지 않게
 *   합니다. 정의는 배치가 바뀌어 저장할 때 함께 담깁니다.
 * - 평면도 이미지(수 MB 문자열)는 번호로 바꿉니다. 끄는 동안 포인터가 움직일 때마다 큰 문자열을 새로 만들지
 *   않게 합니다. 같은 이미지 문자열은 같은 번호이고(문자열 해시는 브라우저가 기억), 지금과 직전 이미지만 기억해
 *   지운 이미지는 메모리에서 내려갑니다.
 */
export function createPlanFingerprint(): (plan: PlanData) => string {
	const imageIds = new Map<string, number>();
	let nextImageId = 0;
	const imageId = (src: string) => {
		let id = imageIds.get(src);
		if (id === undefined) {
			id = nextImageId += 1;
			imageIds.set(src, id);
			if (imageIds.size > 2) imageIds.delete(imageIds.keys().next().value!);
		}
		return id;
	};
	return (plan) =>
		JSON.stringify({
			...plan,
			updatedAt: 0,
			customEntries: undefined,
			underlay: plan.underlay && { ...plan.underlay, src: imageId(plan.underlay.src) }
		});
}
