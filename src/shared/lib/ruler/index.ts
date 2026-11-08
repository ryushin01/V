export interface RulerTicks {
	majorCm: number;
	minorCm: number;
	minor: number[];
	mid: number[];
	major: { position: number; value: number }[];
}

const NICE_MAJOR_STEPS = [1, 2, 5, 10, 20, 50, 100, 200, 500, 1000, 2000];
const MIN_MAJOR_PX = 48;
const MIN_MINOR_PX = 6;

/**
 * 큰 눈금이 화면에서 약 64px, 잔눈금이 약 8px이 되도록 cm 간격을 고릅니다.
 * 숫자는 언제나 1·2·5 계열의 깔끔한 값이어야 하므로 실제 픽셀 간격은 배율에 따라 조금 달라집니다.
 */
export function chooseRulerStep(scale: number): { majorCm: number; minorCm: number } {
	const majorCm =
		NICE_MAJOR_STEPS.find((step) => step * scale >= MIN_MAJOR_PX) ??
		NICE_MAJOR_STEPS[NICE_MAJOR_STEPS.length - 1];
	const division = [10, 5, 2].find((count) => (majorCm / count) * scale >= MIN_MINOR_PX) ?? 1;
	return { majorCm, minorCm: majorCm / division };
}

/** 화면 길이 `length`(px) 안에 보이는 눈금을 계산합니다. `offset`은 0cm가 놓인 화면 위치입니다. */
export function computeRulerTicks(length: number, scale: number, offset: number): RulerTicks {
	const { majorCm, minorCm } = chooseRulerStep(scale);
	const perMajor = Math.round(majorCm / minorCm);
	const ticks: RulerTicks = { majorCm, minorCm, minor: [], mid: [], major: [] };
	if (length <= 0 || scale <= 0) return ticks;

	const firstIndex = Math.ceil(-offset / scale / minorCm);
	const lastIndex = Math.floor((length - offset) / scale / minorCm);
	const midStep = perMajor % 2 === 0 ? perMajor / 2 : 0;

	for (let index = firstIndex; index <= lastIndex; index += 1) {
		const position = offset + index * minorCm * scale;
		const inMajor = ((index % perMajor) + perMajor) % perMajor;
		if (inMajor === 0) {
			ticks.major.push({ position, value: Math.round(index * minorCm) });
		} else if (midStep !== 0 && inMajor === midStep) {
			ticks.mid.push(position);
		} else {
			ticks.minor.push(position);
		}
	}
	return ticks;
}
