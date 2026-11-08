import { describe, expect, it } from 'vitest';
import { josa } from './index';

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
