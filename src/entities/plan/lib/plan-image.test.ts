import { describe, expect, it } from 'vitest';
import { createSamplePlan } from '../model/factory';
import { inlineStyles, planImageSize } from './plan-image';

describe('planImageSize', () => {
	it('1cm에 2px로 그리고 2배 해상도로 저장합니다', () => {
		expect(planImageSize(createSamplePlan())).toEqual({
			width: (460 + 16) * 2,
			height: (380 + 16) * 2,
			pixelsPerCm: 2,
			density: 2
		});
	});

	it('큰 방은 긴 변이 4096px을 넘지 않게 줄입니다', () => {
		const { width, height, density } = planImageSize({
			room: { width: 1500, depth: 900, openings: [] }
		});
		expect(Math.round(Math.max(width, height) * density)).toBeLessThanOrEqual(4096);
		expect(density).toBeLessThan(2);
	});
});

describe('inlineStyles', () => {
	it('계산된 스타일을 style 속성으로 옮기고 클래스를 지웁니다', () => {
		const style = document.createElement('style');
		style.textContent = '.wall { stroke: rgb(18, 18, 20); fill: none; }';
		document.head.append(style);
		const source = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
		const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
		line.setAttribute('class', 'wall');
		source.append(line);
		document.body.append(source);
		const copy = source.cloneNode(true) as SVGSVGElement;
		inlineStyles(source, copy);
		const copied = copy.firstElementChild!;
		expect(copied.getAttribute('class')).toBeNull();
		expect(copied.getAttribute('style')).toContain('stroke');
		source.remove();
		style.remove();
	});
});
