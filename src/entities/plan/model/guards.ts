/** 파일·공유 링크에서 온 값을 검사할 때 쓰는 공통 판별 함수입니다. */
export const isRecord = (value: unknown): value is Record<string, unknown> =>
	typeof value === 'object' && value !== null && !Array.isArray(value);

export const finite = (value: unknown): value is number =>
	typeof value === 'number' && Number.isFinite(value);
