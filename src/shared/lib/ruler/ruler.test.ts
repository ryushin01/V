import { describe, expect, it } from 'vitest';
import { chooseRulerStep, computeRulerTicks } from './index';

describe('룰러 눈금', () => {
	it('기본 배율에서는 잔눈금 8px, 큰 눈금 80px에 가깝게 고릅니다', () => {
		expect(chooseRulerStep(1.6)).toEqual({ majorCm: 50, minorCm: 5 });
	});

	it('확대할수록 숫자 단위가 작아집니다', () => {
		expect(chooseRulerStep(0.5).majorCm).toBeGreaterThan(chooseRulerStep(4).majorCm);
	});

	it('0cm 위치와 큰 눈금 값을 맞춥니다', () => {
		const ticks = computeRulerTicks(400, 1.6, 40);
		expect(ticks.major[0]).toEqual({ position: 40, value: 0 });
		expect(ticks.major[1]).toEqual({ position: 120, value: 50 });
	});

	it('0cm 왼쪽도 음수로 이어집니다', () => {
		const ticks = computeRulerTicks(200, 1.6, 100);
		expect(ticks.major.map((tick) => tick.value)).toContain(-50);
	});

	it('화면 밖 눈금은 만들지 않습니다', () => {
		const ticks = computeRulerTicks(100, 1.6, -500);
		for (const position of [...ticks.minor, ...ticks.mid, ...ticks.major.map((t) => t.position)]) {
			expect(position).toBeGreaterThanOrEqual(0);
			expect(position).toBeLessThanOrEqual(100);
		}
	});

	it('길이가 0이면 빈 결과를 돌려줍니다', () => {
		expect(computeRulerTicks(0, 1.6, 0).major).toEqual([]);
	});
});
