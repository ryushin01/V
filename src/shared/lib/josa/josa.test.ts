import { describe, expect, it } from 'vitest';
import { josa, particle } from './index';

describe('josa', () => {
	it.each([
		['책상', '책상이'],
		['의자', '의자가'],
		['책상 140', '책상 140이'],
		['멀티탭 4구', '멀티탭 4구가'],
		['PC', 'PC가']
	])('%s', (word, expected) => {
		expect(josa(word, '이', '가')).toBe(expected);
	});
});

describe('particle', () => {
	it.each([
		['새 배치도', '를'],
		['예시: 책상과 TV를 함께 쓰는 방', '을'],
		['거실 2', '를'],
		['거실 3', '을']
	])('%s', (word, expected) => {
		expect(particle(word, '을', '를')).toBe(expected);
	});
});
